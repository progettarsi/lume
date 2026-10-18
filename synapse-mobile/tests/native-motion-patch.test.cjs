const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const script=fs.readFileSync('scripts/patch-native-motion.cjs','utf8'),root=path.resolve('node_modules/react-native-reanimated');
function fixture(){
 const files=new Map(),packagePath=path.join(root,'package.json');files.set(packagePath,JSON.stringify({version:'4.5.1'}));let writes=0;
 const context={__dirname:path.resolve('scripts'),console:{log(){}},require:id=>id==='node:path'?path:{readFileSync:file=>{if(!files.has(file))files.set(file,fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n'));return files.get(file)},writeFileSync:(file,text)=>{writes++;files.set(file,text)}}};
 function run(){vm.runInNewContext('{'+script+';globalThis.patchChanges=changes;}',context)}
 run();writes=0;for(const [file,before,after]of context.patchChanges){const target=path.join(root,file);files.set(target,files.get(target).replace(after,before))}
 return {files,packagePath,run,get writes(){return writes},changes:context.patchChanges};
}
test('native compatibility patch reapplies all fixes exactly once and is idempotent',()=>{
 const f=fixture();f.run();assert.equal(f.writes,new Set(f.changes.map(([file])=>file)).size);for(const [file,,after]of f.changes)assert(f.files.get(path.join(root,file)).includes(after));const count=f.writes;f.run();assert.equal(f.writes,count);
});
test('unreviewed native versions or changed contexts fail before any mutation',()=>{
 const f=fixture();f.files.set(f.packagePath,JSON.stringify({version:'4.7.1'}));assert.throws(f.run,/Review/);assert.equal(f.writes,0);
 f.files.set(f.packagePath,JSON.stringify({version:'4.5.1'}));f.files.set(path.join(root,f.changes.at(-1)[0]),'unexpected source');assert.throws(f.run,/context changed/);assert.equal(f.writes,0);
});
