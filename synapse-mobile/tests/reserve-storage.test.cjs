const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const ts=require('typescript');const {DatabaseSync}=require('node:sqlite');
const {reserveArticles}=require('../.test-build/reserve');const {emptyLearning,identity}=require('../.test-build/recommendations');
const {offlineReserve,repeatedArticle}=require('../.test-build/feedAvailability');
test('reserve and consumed ledger survive a fresh storage connection, pruning and offline exhaustion',async()=>{
 const folder=fs.mkdtempSync(path.join(process.cwd(),'.qa-reserve-')),file=path.join(folder,'synapse.db'),connections=[];
 const sqlite={openDatabaseAsync:async()=>{const db=new DatabaseSync(file);connections.push(db);return {execAsync:async sql=>db.exec(sql),getAllAsync:async(sql,...args)=>db.prepare(sql).all(...args),getFirstAsync:async(sql,...args)=>db.prepare(sql).get(...args),runAsync:async(sql,...args)=>db.prepare(sql).run(...args),closeAsync:async()=>db.close(),withTransactionAsync:async work=>{db.exec('BEGIN');try{await work();db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}}}}};
 const source=ts.transpileModule(fs.readFileSync('src/storage.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const open=()=>{const module={exports:{}};vm.runInNewContext(source,{module,exports:module.exports,Date,require:name=>name==='expo-sqlite'?sqlite:require(path.join(process.cwd(),'.test-build',name.replace('./content/','')))});return module.exports};
 const intro='Le aurore polari sono fenomeni luminosi dell’atmosfera. Le particelle cariche interagiscono con il campo magnetico terrestre e con i gas atmosferici, formando archi di luce che cambiano colore e intensità nel cielo.';
 const a=i=>({id:`wiki:${i}`,title:`Aurora ${i}`,category:'science',source:`https://it.wikipedia.org/wiki/Aurora_${i}`,paragraphs:[intro],preview:[intro],fetchedAt:i});
 try{
  const first=open();await first.initStorage();const rows=Array.from({length:100},(_,i)=>a(i));await first.putArticles(rows);
  await first.putSavedArticle(rows[0],true);const active={...rows[1],complete:true,textVersion:3,paragraphs:[intro,'Un approfondimento già scaricato.']};await first.putArticles([active]);
  const profile={...emptyLearning(),seen:[rows[2].id,identity(rows[2])]};await first.putLearning(profile);
  const reserve=reserveArticles(await first.getArticles(),profile,new Set());assert.equal(reserve.length,30);
  const protect=new Set([...reserve.map(a=>a.id),active.id]);const removed=await first.prune(protect);assert(removed.length>0);assert(!removed.some(id=>protect.has(id)||id===rows[0].id));
  await first.putAIMetrics({preparations:2,adoptedPreparations:1,specStarted:2,usedInFlight:1,usedCached:0,unused:1,cancelled:0,failures:0,opens:[{classicMs:12,aiMs:50,mode:'inflight'}]});
  const restarted=open(),disk=await restarted.getArticles(),learning=await restarted.getLearning();const offline=reserveArticles(disk,learning,new Set());assert.equal(offline.length,30);assert(!offline.some(row=>row.id===rows[2].id));assert(disk.find(row=>row.id===active.id).complete);
  const metrics=await restarted.getAIMetrics();assert.equal(metrics.usedInFlight,1);assert.deepEqual(JSON.parse(JSON.stringify(metrics.opens)),[{classicMs:12,aiMs:50,mode:'inflight'}]);
  await restarted.putArticles([{...active,simplifiedInput:'local-content-identity',simplifiedPrepared:true}]);await restarted.markRead(active.id);
  const visit=connections.at(-1).prepare('SELECT json FROM visits WHERE id=?').get(active.id);assert(!JSON.parse(visit.json).simplifiedInput);assert(!(JSON.parse(visit.json).simplifiedPrepared));assert.equal((await restarted.getArticles()).find(row=>row.id===active.id).simplifiedInput,'local-content-identity');
  // Exhaust every remaining identity, not just the current in-memory window.
  await restarted.putLearning({...learning,seen:[...learning.seen,...disk.flatMap(a=>[a.id,identity(a)])]});
  const exhausted=open();assert.equal(reserveArticles(await exhausted.getArticles(),await exhausted.getLearning(),new Set()).length,0);
  const consumedLocal=offlineReserve(await exhausted.getArticles(),await exhausted.getLearning(),new Set());assert.equal(consumedLocal.length,30);assert(consumedLocal.every(a=>repeatedArticle(a,learning,new Set(disk.map(a=>a.id)))));
  await exhausted.prune(new Set(consumedLocal.map(a=>a.id)));const secondRestart=open();assert.equal(offlineReserve(await secondRestart.getArticles(),await secondRestart.getLearning(),new Set()).length,30);
  await exhausted.putArticles([a(1000),a(1001)]);assert.equal(reserveArticles(await exhausted.getArticles(),await exhausted.getLearning(),new Set()).length,2);
 }finally{for(const db of connections)try{db.close()}catch{};for(const suffix of ['', '-wal','-shm'])if(fs.existsSync(file+suffix))fs.unlinkSync(file+suffix);fs.rmdirSync(folder)}
});
