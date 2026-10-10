const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const {learn}=require('../.test-build/recommendations');
test('native migration backup and bookmark/profile commits survive restart and roll back together',async()=>{
 const folder=fs.mkdtempSync(path.join(process.cwd(),'.qa-profile-')),file=path.join(folder,'synapse.db'),connections=[];let failLearning=false;
 const sqlite={openDatabaseAsync:async()=>{const db=new DatabaseSync(file);connections.push(db);return {execAsync:async sql=>db.exec(sql),getAllAsync:async(sql,...args)=>db.prepare(sql).all(...args),getFirstAsync:async(sql,...args)=>db.prepare(sql).get(...args),runAsync:async(sql,...args)=>{if(failLearning&&args[0]==='learning'&&/INSERT/.test(sql))throw Error('disk write failed');return db.prepare(sql).run(...args)},closeAsync:async()=>db.close(),withTransactionAsync:async work=>{db.exec('BEGIN');try{await work();db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}}}}};
 const source=ts.transpileModule(fs.readFileSync('src/storage.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const open=()=>{const module={exports:{}};vm.runInNewContext(source,{module,exports:module.exports,Date,require:name=>name==='expo-sqlite'?sqlite:require(path.join(process.cwd(),'.test-build',name.replace('./content/','')))});return module.exports};
 const intro='Il ponte è un manufatto che permette di attraversare un fiume. Le travi sostengono il peso e lo distribuiscono sui pilastri. Per esempio, una campata collega due sponde senza interrompere il passaggio delle barche.';
 const a={id:'Ponte',title:'Ponte',category:'technology',source:'https://it.wikipedia.org/wiki/Ponte',preview:[intro],paragraphs:[intro],fetchedAt:1,complete:true,readingMetadata:{words:123,language:{level:2}}};
 try{
  const storage=open();await storage.putArticles([a]);await storage.putSavedArticle(a,true);await storage.markRead(a.id);await storage.putSettings({dark:true,size:23,aiEnabled:false,categories:['science']});
  const raw={seen:['old'],categories:{technology:7},topics:{ponte:3},updatedAt:Date.now()};await storage.putLearning(raw);
  failLearning=true;await assert.rejects(storage.migrateProfile(await storage.getArticles(),await storage.getHistory()),/disk write/);
  assert.equal((await storage.getLearning()).version,1);assert(!connections[0].prepare('SELECT value FROM preferences WHERE key=?').get('learning-pre-v3-backup'));
  failLearning=false;let profile=await storage.migrateProfile(await storage.getArticles(),await storage.getHistory());assert.equal(profile.version,3);assert.equal(profile.categories.technology,5.2);
  const backup=connections[0].prepare('SELECT value FROM preferences WHERE key=?').get('learning-pre-v3-backup').value;assert.deepEqual(JSON.parse(backup),raw);
  await storage.migrateProfile([],[]);assert.equal(connections[0].prepare('SELECT value FROM preferences WHERE key=?').get('learning-pre-v3-backup').value,backup);
  profile=learn(profile,a,'unsave');await storage.putSavedArticle(a,false,profile);assert(Math.abs(profile.categories.technology-.2)<.0001);
  const next=learn(profile,a,'save');failLearning=true;await assert.rejects(storage.putSavedArticle(a,true,next),/disk write/);
  const restart=open();assert.equal((await restart.getArticles())[0].saved,false);assert.equal((await restart.getLearning()).categories.technology,profile.categories.technology);
  assert.equal((await restart.getHistory()).length,1);assert((await restart.getArticles())[0].complete);assert.equal((await restart.getLearning()).habit,undefined);assert.equal((await restart.getArticles())[0].readingMetadata,undefined);assert.equal((await restart.getHistory())[0].readingMetadata,undefined);assert.equal((await restart.getSettings()).size,23);
  failLearning=false;await restart.putSavedArticle(a,true,next);const final=open();assert.equal((await final.getArticles())[0].saved,true);assert.equal((await final.getLearning()).categories.technology,next.categories.technology);
 }finally{for(const db of connections)try{db.close()}catch{};for(const suffix of ['', '-wal','-shm'])if(fs.existsSync(file+suffix))fs.unlinkSync(file+suffix);fs.rmdirSync(folder)}
});
