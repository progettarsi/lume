const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),ts=require('typescript');
const {storedArticle}=require('../.test-build/storedArticle');
const valid={id:'wiki:1',title:'Luce',category:'science',source:'https://it.wikipedia.org/wiki/Luce',preview:['Una scoperta.'],paragraphs:['Una scoperta.'],fetchedAt:1};
test('persisted article validation accepts the whole bundled catalogue without changing text or provenance',()=>{
 const {withCatalogue}=require('../.test-build/catalogue');
 const rows=withCatalogue([]);assert(rows.length>=150);
 for(const article of rows)assert.equal(storedArticle(article),article);
 assert.equal(storedArticle({...valid,preview:[],paragraphs:[]}).id,valid.id);
 for(const patch of [{fetchedAt:NaN},{preview:[{}]},{source:null},{classification:{version:1}},{edition:{version:1,continuation:[]}},{feedSequence:[]},{verification:{version:1}},{retrieval:{method:null}}])assert.equal(storedArticle({...valid,...patch}),undefined);
});
test('web storage recovers valid articles independently from malformed visits without overwriting source data',async()=>{
 const disk=new Map([['synapse-native-articles',JSON.stringify([valid,{...valid,id:'broken',preview:null}])],['synapse-native-visits','{broken']]);
 const before=new Map(disk),module={exports:{}},localStorage={getItem:key=>disk.get(key)??null,setItem:(key,value)=>disk.set(key,value),removeItem:key=>disk.delete(key)};
 const source=ts.transpileModule(fs.readFileSync('src/storage.web.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(source,{module,exports:module.exports,localStorage,require:name=>require(path.join(process.cwd(),'.test-build',name.replace('./content/','')))});
 const storage=module.exports;await storage.initStorage();assert.equal((await storage.getArticles()).length,1);assert.equal((await storage.getHistory()).length,0);assert.deepEqual(disk,before);
 for(const raw of ['null','{}','17']){disk.set('synapse-native-articles',raw);await storage.initStorage();assert.equal((await storage.getArticles()).length,0);assert.equal(disk.get('synapse-native-articles'),raw)}
});
