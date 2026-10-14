const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');

function setup(imageMock){
  const files=new Map([['cache:photo',{exists:true,size:2048}]]);
  class File{
    constructor(root,name){this.uri=name?root.uri+'/'+name:root}
    get exists(){return files.get(this.uri)?.exists??false}
    get size(){return files.get(this.uri)?.size??0}
    delete(){files.delete(this.uri)}
    async copy(to){files.set(to.uri,{exists:true,size:2048})}
  }
  class Directory{constructor(root,name){this.uri=root+'/'+name}create(){}}
  let resizedWidth=0,resizedHeight=0;
  const image={saveAsync:async()=>({uri:'cache:photo'}),release(){}};
  const context={
    resize(dim){resizedWidth=dim.width;resizedHeight=dim.height},
    renderAsync:async()=>image,
    release(){}
  };
  const code=ts.transpileModule(fs.readFileSync('src/onboardingPhoto.ts','utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText;
  const mod={exports:{}};
  vm.runInNewContext(code,{
    module:mod,
    exports:mod.exports,
    require:n=>{
      if(n==='expo-file-system')return {File,Directory,Paths:{document:'local:'}};
      if(n==='expo-image-manipulator')return {ImageManipulator:{manipulate:()=>context},SaveFormat:{JPEG:'jpeg'}};
      if(n==='react-native')return {Image:imageMock};
      return {};
    },
    Date,
    Math
  });
  return {
    photoPort:mod.exports.photoPort,
    getResized:()=>({width:resizedWidth,height:resizedHeight})
  };
}

test('photoPort.copy throws existing Italian error when photo dimensions are invalid and getSize fails', async()=>{
  const {photoPort}=setup({
    getSize:(uri,success,fail)=>fail(new Error('Cannot read size'))
  });
  for(const invalid of [
    {kind:'picked',uri:'picked:1',width:0,height:0},
    {kind:'picked',uri:'picked:2',width:-100,height:200},
    {kind:'picked',uri:'picked:3',width:NaN,height:NaN},
    {kind:'picked',uri:'picked:4',width:Infinity,height:100}
  ]){
    await assert.rejects(
      photoPort.copy(invalid),
      /Non riesco a ridurre questa foto\. Prova un’altra immagine\./
    );
  }
});

test('photoPort.copy recovers real dimensions via Image.getSize when photo dimensions are invalid', async()=>{
  const {photoPort,getResized}=setup({
    getSize:(uri,success)=>success(1536,1024)
  });
  const uri=await photoPort.copy({kind:'picked',uri:'picked:real',width:0,height:0});
  assert(uri.startsWith('local:/synapse-profile/avatar-'));
  // Scale should be 768 / 1536 = 0.5. Resized should be 768 x 512, NOT 1px!
  const resized=getResized();
  assert.equal(resized.width,768);
  assert.equal(resized.height,512);
  assert.notEqual(resized.width,1);
  assert.notEqual(resized.height,1);
});
