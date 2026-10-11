const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {organicPath,tutorialTarget}=require('../.test-build/onboardingMotion'),{ORGANIC_POINTS}=require('../.test-build/onboardingShapes');
test('brand preserves every original vector and switches both logo and rays between theme palettes',()=>{
 const {onboardingBrand}=require('../.test-build/onboardingBrand');
 const paths=xml=>[...xml.matchAll(/\bd="([^"]+)"/g)].map(m=>m[1]);
 for(const [ink,paper] of [['#282621','#f7f4ee'],['#efe9df','#1d1b19']]){
  const brand=onboardingBrand(ink,paper);
  for(const part of ['bulb','rays']){assert.deepEqual(paths(brand[part]),paths(fs.readFileSync(`assets/onboarding/${part}.svg`,'utf8')));assert(!brand[part].includes('#F0E9DF'));assert(brand[part].includes(ink));}
  assert(brand.bulb.includes(`stroke="${paper}"`));
 }
});
test('organic morph has compatible closed geometry throughout both directions of its cycle',()=>{
 const shapes=Object.values(ORGANIC_POINTS);for(const a of shapes)for(const b of shapes){
  assert.equal(a.length,128);assert.equal(b.length,128);
  let last;for(let p=0;p<=1.001;p+=.05){const d=organicPath(a,b,p);assert(d.endsWith('Z'));assert.equal((d.match(/C/g)||[]).length,64);assert(!/NaN|Infinity/.test(d));const values=d.match(/-?\d+(?:\.\d+)?/g).map(Number);assert(values.every(v=>v>=-2&&v<=102));if(last)assert(Math.max(...values.map((v,i)=>Math.abs(v-last[i])))<3);last=values}
  assert.equal(organicPath(a,b,0),organicPath(a,b,-1));assert.equal(organicPath(a,b,1),organicPath(a,b,2));assert.equal(organicPath(a,b,0),organicPath(b,a,1));
 }
});
test('tutorial release advances at most one card, reverses and holds below threshold without velocity jumps',()=>{
 assert.equal(tutorialTarget(0,-47,218),0);assert.equal(tutorialTarget(0,-49,218),1);assert.equal(tutorialTarget(0,-10000,218),1);assert.equal(tutorialTarget(1,-10000,218),1);assert.equal(tutorialTarget(1,49,218),0);assert.equal(tutorialTarget(0,10000,218),0);assert.equal(tutorialTarget(1,1,218),1);
});
function identityFixture({reduced=false}={}){
 let slots=[],idx=0,effects=[],pending=false,tree,time=0,seq=0,timers=new Map(),writes=[],motion={reduced,visible:true,appActive:true};
 const react={useState(initial){const i=idx++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;pending=true}]},useRef(v){const i=idx++;return slots[i]??(slots[i]={current:v})},useEffect(fn,deps){const i=idx++,old=slots[i];if(!old||deps.some((v,j)=>!Object.is(v,old.deps[j]))){slots[i]={deps,cleanup:old?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn()})}}};
 const jsx=(type,props)=>({type,props}),module={exports:{}},binding={active:true,draft:{name:''},state:{draft:{},profile:{}},updateDraft:p=>writes.push(p.name),pickPhoto(){},navigate(){}};
 const code=ts.transpileModule(fs.readFileSync('src/components/onboarding/IdentityStage.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,setTimeout:(fn,ms)=>{const id=++seq;timers.set(id,{fn,at:time+ms});return id},clearTimeout:id=>timers.delete(id),require:n=>n==='react'?react:n==='react/jsx-runtime'?{jsx,jsxs:jsx}:n==='react-native'?{View:'View',Text:'Text',TextInput:'TextInput',Image:'Image',Pressable:'Pressable',StyleSheet:{create:v=>v},useWindowDimensions:()=>({width:402})}:n.includes('Atoms')?{Label:'Label',Button:'Button',Icon:'Icon',useTheme:()=>({palette:{muted:'#555',surface:'#ddd',ink:'#222'}})}:n.includes('onboardingPresentation')?require('../.test-build/onboardingPresentation'):n.includes('ActionButton')?{ActionButton:'ActionButton'}:{body:'body',heading:'heading'}});
 function render(){idx=0;tree=module.exports.IdentityStage({binding,motion,usableHeight:800,fontScale:1});while(effects.length)effects.shift()();}
 function flush(){let loops=0;do{pending=false;render();if(++loops>15)throw Error('render loop')}while(pending)}
 function nodes(root){if(!root||typeof root!=='object')return [];return [root,...[root.props?.children].flat(Infinity).flatMap(nodes)]}
 flush();return {get input(){return nodes(tree).find(n=>n.type==='TextInput').props},get writes(){return writes},get pendingTimers(){return timers.size},get overlay(){return nodes(tree).filter(n=>n.type==='Text').map(n=>n.props.children).join('')},flush,advance(ms){const end=time+ms;while(true){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;time=next[1].at;timers.delete(next[0]);next[1].fn();flush()}time=end},background(){motion={...motion,appActive:false};flush()},dispose(){for(const s of slots)s?.cleanup?.()}};
}
test('placeholder focus cancels the typing timer; immediate Unicode input survives and never stores a suggested name',()=>{
 const h=identityFixture();try{h.advance(200);assert(h.overlay.length>0);h.input.onFocus();h.flush();assert(h.pendingTimers<=1);h.input.onChangeText('李 🧑🏽‍🚀');h.flush();assert.equal(h.input.value,'李 🧑🏽‍🚀');assert.deepEqual(h.writes,['李 🧑🏽‍🚀']);assert.equal(h.pendingTimers,0);h.advance(12000);assert.equal(h.input.value,'李 🧑🏽‍🚀');assert.equal(h.overlay,'');h.input.onBlur();h.flush();assert.equal(h.pendingTimers,0)}finally{h.dispose()}
});
test('placeholder tears down on background/unmount and stays static with reduced motion',()=>{
 const h=identityFixture();h.advance(90);h.background();assert.equal(h.pendingTimers,0);h.advance(12000);assert.equal(h.writes.length,0);h.dispose();const reduced=identityFixture({reduced:true});assert.equal(reduced.pendingTimers,0);assert.equal(reduced.input.placeholder,'Il tuo nome, facoltativo');reduced.dispose();
});
test('native photo copy awaits asynchronous filesystem completion before verification and temporary cleanup',async()=>{
 let finishCopy,temporaryDeleted=false;const files=new Map([['cache:photo',{exists:true,size:2048}]]);
 class File{constructor(root,name){this.uri=name?root.uri+'/'+name:root}get exists(){return files.get(this.uri)?.exists??false}get size(){return files.get(this.uri)?.size??0}delete(){if(this.uri==='cache:photo')temporaryDeleted=true;files.delete(this.uri)}copy(to){return new Promise(resolve=>{finishCopy=()=>{files.set(to.uri,{exists:true,size:2048});resolve()}})}}
 class Directory{constructor(root,name){this.uri=root+'/'+name}create(){}}
 const image={saveAsync:async()=>({uri:'cache:photo'}),release(){}},context={resize(){},renderAsync:async()=>image,release(){}},module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync('src/onboardingPhoto.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,require:n=>n==='expo-file-system'?{File,Directory,Paths:{document:'local:'}}:n==='expo-image-manipulator'?{ImageManipulator:{manipulate:()=>context},SaveFormat:{JPEG:'jpeg'}}:{},Date,Math});
 let settled=false;const promise=module.exports.photoPort.copy({kind:'picked',uri:'picked:',width:100,height:100}).finally(()=>{settled=true});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(settled,false);assert.equal(temporaryDeleted,false);assert.equal(typeof finishCopy,'function');finishCopy();const uri=await promise;assert(uri.startsWith('local:/synapse-profile/avatar-'));assert.equal(temporaryDeleted,true);assert.equal(await module.exports.photoPort.exists(uri),true);
});
