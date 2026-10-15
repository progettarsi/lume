const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const ts=require('typescript');const {DatabaseSync}=require('node:sqlite');

test('corrupted sqlite rows in articles and visits are safely ignored without failing or losing data',async()=>{
 const folder=fs.mkdtempSync(path.join(process.cwd(),'.qa-corrupt-')),file=path.join(folder,'synapse.db');
 const connections=[];
 const sqlite={openDatabaseAsync:async(name,options)=>{
  const db=new DatabaseSync(file);connections.push(db);
  const wrapper={
   execAsync:async sql=>{db.exec(sql)},
   getAllAsync:async(sql,...args)=>db.prepare(sql).all(...args),
   getFirstAsync:async(sql,...args)=>db.prepare(sql).get(...args),
   runAsync:async(sql,...args)=>db.prepare(sql).run(...args),
   closeAsync:async()=>db.close(),
   withTransactionAsync:async op=>{db.exec('BEGIN');try{await op();db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}}
  };
  return wrapper;
 }};
 const output=ts.transpileModule(fs.readFileSync(path.join(process.cwd(),'src/storage.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 const scopedRequire=name=>name==='expo-sqlite'?sqlite:require(path.join(process.cwd(),'.test-build',name.replace('./content/','')));
 vm.runInNewContext(output,{module,exports:module.exports,require:scopedRequire,Date,console});
 const storage=module.exports;

 const validArticle={id:'valid:1',title:'Articolo valido',category:'science',paragraphs:['Testo'],preview:['Testo'],complete:true,source:'https://it.wikipedia.org/wiki/Valido',fetchedAt:100};
 try{
  await storage.initStorage();
  await storage.putArticles([validArticle]);
  await storage.putSavedArticle(validArticle,true);
  await storage.markRead(validArticle.id);

  // Directly corrupt one row in articles and one row in visits
  const rawDb=new DatabaseSync(file);
  rawDb.prepare('INSERT INTO articles(id,json,saved,read_at,touched) VALUES(?,?,?,?,?)').run('corrupt:1','{not-valid-json',0,null,50);
  rawDb.prepare('INSERT INTO visits(id,json,read_at) VALUES(?,?,?)').run('corrupt:v1','INVALID JSON',60);
  const malformed=[{},[],null,{...validArticle,preview:null},{...validArticle,paragraphs:[42]},{...validArticle,simplified:'text'},{...validArticle,topics:{}},{...validArticle,edition:{version:1,continuation:null}},{...validArticle,provenance:{provider:'wikipedia'}},{...validArticle,title:17}];
  for(const [i,value] of malformed.entries()){
   rawDb.prepare('INSERT INTO articles(id,json,saved,read_at,touched) VALUES(?,?,?,?,?)').run('broken:'+i,JSON.stringify(value),1,null,50);
   rawDb.prepare('INSERT INTO visits(id,json,read_at) VALUES(?,?,?)').run('broken:'+i,JSON.stringify(value),60);
  }
  rawDb.close();

  // 1. getArticles() must skip corrupt rows without throwing
  const articles=await storage.getArticles();
  assert.equal(articles.length,1,'Corrupt article must be ignored');
  assert.equal(articles[0].id,'valid:1');
  assert.equal(articles[0].saved,true);

  // Verify corrupt row was not deleted from DB
  const rawDb2=new DatabaseSync(file);
  const countArticles=rawDb2.prepare('SELECT COUNT(*) as n FROM articles').get().n;
  assert.equal(countArticles,2+malformed.length,'Corrupt article rows must not be deleted');

  // 2. getHistory() must skip corrupt rows without throwing
  const history=await storage.getHistory();
  assert.equal(history.length,1,'Corrupt visit must be ignored');
  assert.equal(history[0].id,'valid:1');

  const countVisits=rawDb2.prepare('SELECT COUNT(*) as n FROM visits').get().n;
  assert.equal(countVisits,2+malformed.length,'Corrupt visit rows must not be deleted');
  rawDb2.close();

  // 3. migrateProfile must handle corrupt rows gracefully
  const migratedProfile=await storage.migrateProfile(articles,history);
  assert(migratedProfile,'migrateProfile should succeed despite corrupt rows');

  // 4. migrateCategories must handle corrupt rows gracefully
  const migratedCategories=await storage.migrateCategories();
  assert(migratedCategories,'migrateCategories should succeed despite corrupt rows');
 }finally{
  for(const db of connections)try{db.close()}catch{}
  for(const suffix of ['','-wal','-shm'])if(fs.existsSync(file+suffix))fs.unlinkSync(file+suffix);
  fs.rmdirSync(folder);
 }
});
