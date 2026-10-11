const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),ts=require('typescript');
const {initialOnboarding}=require('../.test-build/onboarding'),{emptyRegistry}=require('../.test-build/categoryRegistry');
const fresh=()=>initialOnboarding({preferenceKeys:[],visits:0,saved:0,read:0});
const articles=n=>Array.from({length:n},(_,i)=>({id:'wiki:'+i,source:'https://it.wikipedia.org/wiki/Luce_'+i,preview:['Una scoperta.'],category:'science'}));
async function hook({state={...fresh(),stage:'preparation'},count=9,fail=false,port}={}){
 let slots=[],index=0,effects=[],pending=false,binding,writes=0,disposed=false,picks=0;
 const schedule=()=>{if(pending||disposed)return;pending=true;queueMicrotask(()=>{pending=false;if(!disposed)render()})};
 const react={useState(v){const i=index++;if(!(i in slots))slots[i]=typeof v==='function'?v():v;return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;schedule()}]},useRef(v){const i=index++;return slots[i]??(slots[i]={current:v})},useReducer(fn,v){const i=index++;if(!(i in slots))slots[i]=v;return [slots[i],value=>{slots[i]=fn(slots[i],value);schedule()}]},useEffect(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((d,j)=>!Object.is(d,old.deps[j]))){slots[i]={deps,cleanup:old?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn()})}}};
 let rows=articles(count),failure=fail;const lib={onboarding:state,registry:emptyRegistry(),cache:rows,online:true,loading:false,availability:{all:{phase:'ready'}},getFeed:()=>rows,persistOnboarding:async(next)=>{writes++;if(failure)throw Error('disk');lib.onboarding=next},retryOnboarding:async()=>{},checkConnection:async()=>{},retryFeed:()=>{}};
 const photoPort=port??{pick:async()=>{picks++;return {kind:'cancelled'}},copy:async()=> 'local:new',exists:async()=>true,remove:async()=>{}};
 const module={exports:{}},code=ts.transpileModule(fs.readFileSync('src/useOnboarding.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,__DEV__:true,require:n=>n==='react'?react:n==='react-native'?{Keyboard:{dismiss(){}}}:n==='./onboardingPhoto'?{photoPort,cleanPhotos:async()=>{}}:require(path.join(process.cwd(),'.test-build',n.replace('./content/','')))});
 const flush=async()=>{for(let i=0;i<12;i++)await new Promise(setImmediate)};
 function render(){index=0;binding=module.exports.useOnboarding(lib,false,true);while(effects.length)effects.shift()()}
 render();await flush();return {get b(){return binding},get writes(){return writes},get picks(){return picks},setFailure:v=>{failure=v},setCount:async n=>{rows=articles(n);lib.cache=rows;render();await flush()},flush,dispose(){disposed=true;for(const s of slots)s?.cleanup?.()}};
}
test('binding holds at nine, enters automatically at ten and does not repeat completion',async()=>{
 const h=await hook();try{assert.equal(h.b.preparation.count,9);assert.equal(h.b.preparation.canEnter,false);h.b.navigate('enter');await h.flush();assert.equal(h.writes,0);await h.setCount(10);assert.equal(h.writes,1);assert(h.b.state.completed);await h.setCount(12);assert.equal(h.writes,1)}finally{h.dispose()}
});
test('failed automatic completion is attempted once and explicit retry preserves configuration',async()=>{
 const h=await hook({count:10,fail:true});try{assert.equal(h.writes,1);assert.equal(h.b.stage,'preparation');assert(h.b.error);await h.flush();assert.equal(h.writes,1);h.setFailure(false);h.b.navigate('enter');await h.flush();assert.equal(h.writes,2);assert(h.b.state.completed)}finally{h.dispose()}
});
test('development preview and tutorial replay cannot write the real profile',async()=>{
 const state={...fresh(),stage:'home',completed:true,revision:8,profile:{name:'Privato'}},h=await hook({state,count:10});try{const before=JSON.stringify(h.b.state);h.b.developmentPreview('interests');await h.flush();h.b.toggleInterest('music');await h.flush();assert(h.b.devSandbox);h.b.closeDevelopment();await h.flush();assert.equal(JSON.stringify(h.b.state),before);assert.equal(h.writes,0);h.b.replayTutorial();await h.flush();h.b.interactDemo(d=>{d.saved=true;d.swipe('next')});h.b.navigate('skip');await h.flush();assert.equal(h.b.replay,false);assert.equal(JSON.stringify(h.b.state),before);assert.equal(h.writes,0)}finally{h.dispose()}
});
test('two old picker callbacks still make one request and cannot free navigation while it is pending',async()=>{
 let release,picks=0;const port={pick:()=>{picks++;return new Promise(r=>release=r)},copy:async()=> 'local:new',exists:async()=>true,remove:async()=>{}},h=await hook({state:{...fresh(),stage:'identity'},port});try{const old=h.b,job=old.pickPhoto();await old.pickPhoto();old.navigate('next');await h.flush();assert.equal(picks,1);assert.equal(h.writes,0);assert.equal(h.b.stage,'identity');release({kind:'cancelled'});await job;await h.flush();h.b.navigate('next');await h.flush();assert.equal(h.b.stage,'interests')}finally{h.dispose()}
});
