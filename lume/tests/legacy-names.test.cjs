const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {DatabaseSync}=require('node:sqlite');
const names=require('../.test-build/legacyNames');

// Minimal expo-sqlite shaped port over node:sqlite files in a temporary folder.
function port(folder,{failBackup=false}={}){
 const removed=[],open=name=>{const db=new DatabaseSync(path.join(folder,name));return {raw:db,getFirstAsync:async sql=>db.prepare(sql).get()??null,closeAsync:async()=>db.close()}};
 return {removed,open,api:{open:async name=>open(name),backup:async(source,destination)=>{if(failBackup)throw Error('backup failed');destination.raw.exec(`ATTACH DATABASE '${path.join(folder,'synapse.db')}' AS legacy`);for(const {name,sql} of source.raw.prepare("SELECT name,sql FROM sqlite_master WHERE type='table'").all()){destination.raw.exec(sql);destination.raw.exec(`INSERT INTO main.${name} SELECT * FROM legacy.${name}`)}destination.raw.exec('DETACH DATABASE legacy')},remove:async name=>{removed.push(name);fs.rmSync(path.join(folder,name),{force:true})}}};
}
function legacyFile(folder,count){const db=new DatabaseSync(path.join(folder,'synapse.db'));db.exec('CREATE TABLE articles(id TEXT PRIMARY KEY,json TEXT NOT NULL); CREATE TABLE preferences(key TEXT PRIMARY KEY,value TEXT NOT NULL)');for(let i=0;i<count;i++)db.prepare('INSERT INTO articles VALUES(?,?)').run('wiki:'+i,'{}');db.prepare('INSERT INTO preferences VALUES(?,?)').run('settings','{"dark":true}');db.close()}
const temp=()=>fs.mkdtempSync(path.join(process.cwd(),'.qa-legacy-'));

test('database: legacy synapse.db is adopted once into an empty lume.db and then removed',async()=>{
 const folder=temp();try{
  legacyFile(folder,3);const p=port(folder),db=p.open('lume.db');
  assert.equal(await names.adoptLegacyDatabase(db,p.api),true);
  assert.equal(db.raw.prepare('SELECT COUNT(*) AS n FROM articles').get().n,3);
  assert.equal(db.raw.prepare("SELECT value FROM preferences WHERE key='settings'").get().value,'{"dark":true}');
  assert.deepEqual(p.removed,['synapse.db']);assert.equal(fs.existsSync(path.join(folder,'synapse.db')),false);
  assert.equal(await names.adoptLegacyDatabase(db,p.api),false,'an adopted database is never overwritten');db.raw.close();
 }finally{fs.rmSync(folder,{recursive:true,force:true})}
});

test('database: fresh installs and populated lume.db are left alone',async()=>{
 const folder=temp();try{
  const p=port(folder),db=p.open('lume.db');
  assert.equal(await names.adoptLegacyDatabase(db,p.api),false);assert.deepEqual(p.removed,['synapse.db'],'empty legacy file created by the probe is removed');
  db.raw.exec('CREATE TABLE articles(id TEXT PRIMARY KEY,json TEXT NOT NULL)');legacyFile(folder,2);p.removed.length=0;
  assert.equal(await names.adoptLegacyDatabase(db,p.api),false);assert.deepEqual(p.removed,[]);assert.equal(fs.existsSync(path.join(folder,'synapse.db')),true);db.raw.close();
 }finally{fs.rmSync(folder,{recursive:true,force:true})}
});

test('database: a failed copy keeps the legacy file and leaves lume.db empty for a retry',async()=>{
 const folder=temp();try{
  legacyFile(folder,2);const p=port(folder,{failBackup:true}),db=p.open('lume.db');
  await assert.rejects(names.adoptLegacyDatabase(db,p.api),/backup failed/);
  assert.deepEqual(p.removed,[]);assert.equal(fs.existsSync(path.join(folder,'synapse.db')),true);
  assert.equal(db.raw.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='articles'").get().n,0);db.raw.close();
 }finally{fs.rmSync(folder,{recursive:true,force:true})}
});

test('AI key: legacy secret moves to the new name; writes and deletions clear the legacy name',async()=>{
 const data=new Map([['synapse-ai-key','AIza-old']]),store={getItemAsync:async k=>data.get(k)??null,setItemAsync:async(k,v)=>{data.set(k,v)},deleteItemAsync:async k=>{data.delete(k)}};
 assert.equal(await names.readSecret(store),'AIza-old');assert.deepEqual([...data],[['lume-ai-key','AIza-old']]);
 assert.equal(await names.readSecret(store),'AIza-old');
 data.set('synapse-ai-key','stale');await names.writeSecret(store,'  AIza-new ');assert.deepEqual([...data],[['lume-ai-key','AIza-new']]);
 await names.writeSecret(store,' ');assert.equal(data.size,0);assert.equal(await names.readSecret(store),null);
});

test('web preview: legacy keys move to the lume- prefix without overwriting newer values',()=>{
 const data=new Map([['synapse-native-articles','[1]'],['synapse-native-settings','old'],['lume-settings','new'],['unrelated','x']]),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 names.migrateWebKeys(storage);
 assert.deepEqual(Object.fromEntries(data),{'lume-articles':'[1]','lume-settings':'new',unrelated:'x'});
 names.migrateWebKeys(storage);assert.equal(data.size,3);
});
