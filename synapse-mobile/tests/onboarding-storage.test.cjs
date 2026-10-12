const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const {OnboardingController,initialOnboarding}=require('../.test-build/onboarding');
const {libraryHarness}=require('./helpers/libraryHarness.cjs');
function fixture(){
 const folder=fs.mkdtempSync(path.join(process.cwd(),'.qa-onboarding-')),file=path.join(folder,'synapse.db'),connections=[];let failKey='';
 const sqlite={openDatabaseAsync:async()=>{const db=new DatabaseSync(file);connections.push(db);return {execAsync:async s=>db.exec(s),getAllAsync:async(s,...a)=>db.prepare(s).all(...a),getFirstAsync:async(s,...a)=>db.prepare(s).get(...a),runAsync:async(s,...a)=>{if(a[0]===failKey&&/INSERT/.test(s))throw Error('disk');return db.prepare(s).run(...a)},closeAsync:async()=>db.close(),withTransactionAsync:async w=>{db.exec('BEGIN');try{await w();db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}}}}};
 const code=ts.transpileModule(fs.readFileSync('src/storage.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const open=()=>{const module={exports:{}};vm.runInNewContext(code,{module,exports:module.exports,Date,require:n=>n==='expo-sqlite'?sqlite:require(path.join(process.cwd(),'.test-build',n.replace('./content/','')))});return module.exports};
 return {open,fail:key=>{failKey=key},get db(){return connections[0]},dispose(){for(const db of connections)try{db.close()}catch{};for(const suffix of ['','-wal','-shm'])if(fs.existsSync(file+suffix))fs.unlinkSync(file+suffix);fs.rmdirSync(folder)}};
}
const article={id:'seed',title:'Luce',category:'science',source:'https://it.wikipedia.org/wiki/Luce',preview:['La luce del Sole contiene diversi colori. Le molecole dell’atmosfera diffondono la luce in tutte le direzioni e le lunghezze d’onda più corte vengono diffuse maggiormente. Per questo il cielo appare blu.'],paragraphs:['La luce del Sole contiene diversi colori. Le molecole dell’atmosfera diffondono la luce in tutte le direzioni e le lunghezze d’onda più corte vengono diffuse maggiormente. Per questo il cielo appare blu.'],fetchedAt:1};
test('boot retry hydrates saved data and preferences before enabling discovery after a disk failure',async()=>{
 const profile={...require('../.test-build/recommendations').emptyLearning(),seen:['known'],opens:{known:1}},disk={rows:[{...article,saved:true,readAt:2}],profile,settings:{dark:true,size:23,categories:['science'],aiEnabled:false},history:[article]};let calls=0;
 const h=await libraryHarness({disk,broken:true,wiki:{batch:async()=>{calls++;return []}}});try{
  assert(h.lib.onboardingError);assert.equal(h.lib.onboarding,undefined);const before=JSON.stringify(disk.profile);
  await h.lib.load('all');await h.flush();assert.equal(calls,0);assert.equal(JSON.stringify(disk.profile),before);
  h.repairDisk();await Promise.all([h.lib.retryOnboarding(),h.lib.retryOnboarding()]);await h.flush();
  assert.equal(h.lib.onboardingError,'');assert(h.lib.onboarding.completed);assert.equal(h.lib.settings.dark,true);assert.equal(h.lib.settings.size,23);assert.equal(h.lib.history.length,1);assert(h.lib.cache.find(a=>a.id===article.id).saved);assert(disk.profile.seen.includes('known'));assert.equal(disk.profile.opens.known,1);
 }finally{h.dispose()}
});
test('SQLite initializes before seed/migrations, resumes, completes atomically and never reopens used installations',async()=>{
 const f=fixture();try{let s=f.open();await s.initStorage();await s.putArticles([article]);const fresh=await s.initOnboarding();assert.equal(fresh.stage,'intro');await s.migrateProfile([article],[]);await s.migrateCategories();const c=new OnboardingController(fresh,(v,i)=>s.putOnboarding(v,i));
 await c.navigate('next',c.navigationRevision);await c.draft({name:'  李  ',interests:['science']});await c.navigate('skip',c.navigationRevision);await c.navigate('next',c.navigationRevision);s=f.open();const resumed=await s.initOnboarding();assert.equal(resumed.stage,'tutorial');assert.equal(resumed.draft.name,'李');assert.deepEqual(Array.from((await s.getLearning()).initialInterests.ids),['science']);
 const r=new OnboardingController(resumed,(v,i)=>s.putOnboarding(v,i));await r.navigate('skip',r.navigationRevision);await r.navigate('enter',r.navigationRevision);const completed=await f.open().initOnboarding();assert(completed.completed);assert.equal(completed.profile.name,'李');assert.equal(completed.stage,'home');const p=await s.getLearning();assert.deepEqual(Array.from(p.seen),[]);assert.deepEqual(Object.keys(p.opens),[]);
 await s.putOnboarding(completed,true);assert.equal((await s.getLearning()).initialInterests.ids.length,1);await assert.rejects(s.putOnboarding({...completed,stage:'intro',completed:false,revision:0}));
 }finally{f.dispose()}
 const legacy=fixture();try{const s=legacy.open();await s.putSettings({dark:true,size:23,categories:['music'],aiEnabled:true});await s.putSavedArticle(article,true);await s.markRead(article.id);const before=await s.getSettings();assert((await s.initOnboarding()).completed);assert.equal((await s.getArticles())[0].saved,true);assert.equal((await s.getHistory()).length,1);assert.deepEqual(await s.getSettings(),before)}finally{legacy.dispose()}
});
test('SQLite normalizes the retired version 1 position without losing profile, draft, backup or existing library data',async()=>{
 const f=fixture();try{
  const s=f.open();await s.initStorage();await s.putSettings({dark:true,size:23,categories:['science'],aiEnabled:false});await s.putSavedArticle(article,true);await s.markRead(article.id);
  const learning={...require('../.test-build/recommendations').emptyLearning(),seen:['known'],opens:{known:1}};await s.putLearning(learning);
  const previous={...initialOnboarding({preferenceKeys:[],visits:0,saved:0,read:0}),stage:'tutorial',tutorialIndex:3,revision:19,draft:{name:'Àlex 李',photoUri:'file:local/avatar.jpg',interests:['science','arts']},profile:{name:'Nome precedente',photoUri:'file:local/old-avatar.jpg'}};
  const raw=JSON.stringify(previous),backup=JSON.stringify({...previous,revision:18,tutorialIndex:1});
  const insert=f.db.prepare('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)');insert.run('onboarding',raw);insert.run('onboarding-backup',backup);
  const before={settings:await s.getSettings(),history:await s.getHistory(),articles:await s.getArticles(),learning:await s.getLearning()};
  const resumed=await s.initOnboarding();assert.equal(resumed.tutorialIndex,2);assert.equal(resumed.revision,19);assert.equal(JSON.stringify(resumed.draft),JSON.stringify(previous.draft));assert.equal(JSON.stringify(resumed.profile),JSON.stringify(previous.profile));
  assert.equal(f.db.prepare('SELECT value FROM preferences WHERE key=?').get('onboarding-recovery-source').value,raw);assert.equal(f.db.prepare('SELECT value FROM preferences WHERE key=?').get('onboarding-backup').value,backup);
  assert.equal(JSON.stringify({settings:await s.getSettings(),history:await s.getHistory(),articles:await s.getArticles(),learning:await s.getLearning()}),JSON.stringify(before));
  const c=new OnboardingController(resumed,(v,i)=>s.putOnboarding(v,i));await c.navigate('skip',c.navigationRevision);assert.equal((await s.initOnboarding()).stage,'preparation');assert.equal(c.state.revision,20);assert.deepEqual(c.state.draft.interests,resumed.draft.interests);
 }finally{f.dispose()}
});
test('SQLite failure rolls onboarding, backup and learning back together; recovery keeps the damaged source',async()=>{
 const f=fixture();try{const s=f.open();await s.initStorage();const first=await s.initOnboarding(),next={...first,stage:'tutorial',revision:1,draft:{name:'Alex',interests:['music']}};
 f.fail('onboarding');await assert.rejects(s.putOnboarding(next,true));assert.equal((await s.initOnboarding()).stage,'intro');assert.equal((await s.getLearning()).initialInterests,undefined);assert.equal(f.db.prepare('SELECT value FROM preferences WHERE key=?').get('onboarding-backup'),undefined);
 f.fail('');await s.putOnboarding(next,true);f.db.prepare('UPDATE preferences SET value=? WHERE key=?').run('{broken','onboarding');const recovered=await s.initOnboarding();assert.equal(recovered.stage,'intro');assert.equal(f.db.prepare('SELECT value FROM preferences WHERE key=?').get('onboarding-recovery-source').value,'{broken');
 f.db.prepare('UPDATE preferences SET value=? WHERE key=?').run('{broken-again','onboarding');f.db.prepare('DELETE FROM preferences WHERE key=?').run('onboarding-backup');await assert.rejects(s.initOnboarding());assert.equal((await s.getLearning()).initialInterests.ids[0],'music');
 }finally{f.dispose()}
});
test('browser preview journal restores interrupted multi-key commit before resuming',async()=>{
 const data=new Map(),localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)},module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync('src/storage.web.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,Date,localStorage,require:n=>require(path.join(process.cwd(),'.test-build',n.replace('./content/','')))});const s=module.exports;await s.initStorage();const state=await s.initOnboarding();
 const before=['synapse-native-onboarding','synapse-native-onboarding-backup','synapse-native-learning'].map(k=>[k,localStorage.getItem(k)]);data.set('synapse-native-onboarding-journal',JSON.stringify(before));data.set('synapse-native-onboarding',JSON.stringify({...state,revision:1,stage:'interests'}));data.set('synapse-native-learning','{"seen":[],"version":3}');assert.equal((await s.initOnboarding()).stage,'intro');assert.equal(data.has('synapse-native-learning'),false);assert.equal(data.has('synapse-native-onboarding-journal'),false);
});
test('real library persists interests in its write queue; late general response and duplicate load retain usable contents',async()=>{
 let release,calls=0,profiles=[];const initial=initialOnboarding({preferenceKeys:[],visits:0,saved:0,read:0}),disk={rows:[article],profile:require('../.test-build/recommendations').emptyLearning(),onboarding:initial};
 const wiki={batch:async(cat,exclude,limit,signal,profile,options)=>{calls++;profiles.push(profile);await new Promise(r=>release=r);const rows=[{...article,id:'new',title:'Una nuova luce',source:'https://it.wikipedia.org/wiki/Nuova_luce'}];if(!signal.aborted)await options.onChunk(rows);return rows}};
 const h=await libraryHarness({disk,wiki});try{const load=h.lib.load('all');await h.flush();await h.lib.load('all');assert.equal(calls,1);await h.lib.persistOnboarding({...initial,revision:1,stage:'tutorial',draft:{name:'Privato',interests:['music']}},true);await h.flush();release();await load;await h.flush();assert(h.lib.getFeed('all').some(a=>a.id==='seed'));assert(h.lib.getFeed('all').some(a=>a.id==='new'));assert.deepEqual(h.disk.profile.initialInterests.ids,['music']);assert.equal(JSON.stringify(h.disk.profile).includes('Privato'),false);assert.equal(profiles[0].initialInterests,undefined)}finally{h.dispose()}
});
