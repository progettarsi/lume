const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const ts=require('typescript');const {DatabaseSync}=require('node:sqlite');
test('native storage contracts: concurrent bookmarks/history/cache survive an invalid connection',async()=>{
 const folder=fs.mkdtempSync(path.join(process.cwd(),'.qa-storage-')),file=path.join(folder,'synapse.db');let opens=0,fault=false,active=0,max=0;
 const connections=[];
 const sqlite={openDatabaseAsync:async(name,options)=>{
  assert.equal(name,'synapse.db');assert.equal(options.useNewConnection,true);opens++;const db=new DatabaseSync(file);connections.push(db);
  const invoke=async(sql,args,mode)=>{active++;max=Math.max(max,active);try{await new Promise(setImmediate);if(fault&&/^SELECT/.test(sql)){fault=false;throw Error("NativeDatabase.prepareAsync rejected: java.lang.NullPointerException")}return db.prepare(sql)[mode](...args)}finally{active--}};
  const wrapper={execAsync:async sql=>{db.exec(sql)},getAllAsync:(sql,...args)=>invoke(sql,args,'all'),getFirstAsync:(sql,...args)=>invoke(sql,args,'get'),runAsync:(sql,...args)=>invoke(sql,args,'run'),closeAsync:async()=>db.close(),withTransactionAsync:async operation=>{db.exec('BEGIN');try{await operation();db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}}};return wrapper;
 }};
 const output=ts.transpileModule(fs.readFileSync(path.join(process.cwd(),'src/storage.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};const scopedRequire=name=>name==='expo-sqlite'?sqlite:require(path.join(process.cwd(),'.test-build',name.replace('./content/','')));
 vm.runInNewContext(output,{module,exports:module.exports,require:scopedRequire,Date,console});const storage=module.exports;
 const article={id:'wiki:1',title:'Aurora polare',category:'geography',paragraphs:['Una spiegazione completa.'],preview:['Una spiegazione completa.'],complete:true,source:'https://it.wikipedia.org/wiki/Aurora_polare',fetchedAt:1};
 try{
  await Promise.all(Array.from({length:8},()=>storage.initStorage()));assert.equal(opens,1);
  await storage.putArticles([article]);
  await Promise.all([storage.putSavedArticle(article,true),storage.markRead(article.id),...Array.from({length:30},()=>storage.getHistory()),...Array.from({length:30},()=>storage.getArticles()),storage.putArticles([{...article,complete:false,paragraphs:['Anteprima.']}])]);
  const rows=await storage.getArticles();assert.equal(rows[0].saved,true);assert(rows[0].readAt);assert.deepEqual(Array.from(rows[0].paragraphs),article.paragraphs);assert.equal((await storage.getHistory()).length,1);assert.equal(max,1);
  fault=true;const recovered=await storage.getArticles();assert.equal(opens,2);assert.equal(recovered[0].saved,true);assert(recovered[0].readAt);
  await storage.putSavedArticle(article,false);assert.equal((await storage.getArticles())[0].saved,false);assert.equal((await storage.getHistory()).length,1);
  assert.deepEqual(Array.from((await storage.getArticles())[0].paragraphs),article.paragraphs);
  // A new native connection must see the last removal; undo only changes its bookmark.
  fault=true;assert.equal((await storage.getArticles())[0].saved,false);assert.equal(opens,3);
  await storage.putSavedArticle(article,true);assert.equal((await storage.getArticles())[0].saved,true);assert.equal((await storage.getHistory()).length,1);
  const newer={...article,revision:42,paragraphs:['Edizione aggiornata.']};await storage.putArticles([newer]);
  await storage.putSavedArticle(article,false);await storage.putSavedArticle(article,true);
  assert.deepEqual(Array.from((await storage.getArticles())[0].paragraphs),newer.paragraphs);assert.equal((await storage.getArticles())[0].revision,42);
 }finally{
  for(const db of connections)try{db.close()}catch{}
  for(const suffix of ['', '-wal','-shm'])if(fs.existsSync(file+suffix))fs.unlinkSync(file+suffix);fs.rmdirSync(folder);
 }
});
