const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;

function scene(){
 let slots=[],index=0,effects=[],output,props={open:false,reduced:false},closed=0,pending=false;
 const completions=[],js=[];
 const react={
  useRef(value){const i=index++;return slots[i]??(slots[i]={current:value})},
  useState(value){const i=index++;if(!(i in slots))slots[i]=value;return [slots[i],next=>{if(slots[i]!==next){slots[i]=next;pending=true}}]},
  useCallback(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((d,j)=>d!==old.deps[j]))slots[i]={deps,fn};return slots[i].fn},
  useLayoutEffect(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((d,j)=>d!==old.deps[j])){slots[i]={deps,cleanup:old?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn()})}},
 };
 const module={exports:{}};
 vm.runInNewContext(compile('src/useSlideTransition.ts'),{module,exports:module.exports,require:id=>{
  if(id==='react')return react;
  if(id==='./theme')return {spring:{}};
  if(id==='react-native-reanimated')return {useSharedValue:value=>react.useRef({value}).current,cancelAnimation(){},runOnJS:fn=>(...args)=>js.push(()=>fn(...args)),withSpring:(value,_config,done)=>{completions.push(done);return value}};
  throw Error(id);
 }});
 function render(){do{pending=false;index=0;output=module.exports.useSlideTransition(props.open,props.reduced,()=>closed++,props.keepMounted);while(effects.length)effects.shift()()}while(pending)}
 render();
 return {get value(){return output},get closed(){return closed},completions,update:next=>{Object.assign(props,next);render()},finish:(i,success=true)=>{completions[i](success);render()},flush:()=>{while(js.length)js.shift()();render()}};
}
test('outgoing scenes keep their native tree until successful exit and never steal a reopened scene',()=>{
 const h=scene();assert.equal(h.value.mounted,false);assert.equal(h.completions.length,0);assert.equal(h.closed,0);
 h.update({open:true});assert.equal(h.value.mounted,true);
 h.update({open:false});const exit=h.completions.length-1;assert.equal(h.value.mounted,true);
 h.finish(exit);h.update({open:true});h.flush();assert.equal(h.value.mounted,true);assert.equal(h.closed,0);
 h.update({open:false});h.finish(h.completions.length-1,false);h.flush();assert.equal(h.value.mounted,true);
 h.finish(h.completions.length-1);h.flush();assert.equal(h.value.mounted,false);assert.equal(h.closed,1);
});
test('1000 rapid navigation reversals reject every stale exit, including queued completions and reduced motion',()=>{
 const h=scene();
 for(let i=0;i<1000;i++){h.update({open:true});h.update({open:false});h.finish(h.completions.length-1);h.update({open:true});h.flush();assert.equal(h.value.mounted,true)}
 assert.equal(h.closed,0);h.update({open:false,reduced:true});assert.equal(h.value.mounted,false);assert.equal(h.value.progress.value,0);assert.equal(h.closed,1);
});
test('a bounded warm collection keeps its tree after exit but stops painting; details still unmount by default',()=>{
 const h=scene();h.update({open:true,keepMounted:true});h.update({open:false});assert(h.value.painting);
 h.finish(h.completions.length-1);h.flush();assert.equal(h.value.painting,false);assert.equal(h.value.mounted,true);
 h.update({open:true});assert(h.value.painting);assert.equal(h.closed,1);
});
test('inactive cached scenes commit cleanup props once, then reuse exactly the same React subtree until re-entry',()=>{
 let slots=[],index=0;const module={exports:{}};
 vm.runInNewContext(compile('src/components/CachedScene.tsx'),{module,exports:module.exports,require:id=>{if(id==='react')return {useRef:value=>{const i=index++;return slots[i]??(slots[i]={current:value})}};throw Error(id)}});
 const render=(active,children)=>{index=0;return module.exports.CachedScene({active,children})};
 const first={},cleanup={},resumed={};assert.strictEqual(render(true,first),first);assert.strictEqual(render(false,cleanup),cleanup);
 for(let i=0;i<1000;i++)assert.strictEqual(render(false,{}),cleanup);
 assert.strictEqual(render(true,resumed),resumed);
});

test('motion preferences share one native query/listener and late reads cannot override a system event',async()=>{
 let queryCount=0,listenerCount=0,removals=0,changed,resolveRead;const hooks=[];
 const module={exports:{}};
 vm.runInNewContext(compile('src/useMotionPreference.ts'),{module,exports:module.exports,require:id=>{
  if(id==='react')return {useSyncExternalStore:(subscribe,getSnapshot)=>{let signals=0;const unsubscribe=subscribe(()=>signals++);const hook={getSnapshot,unsubscribe,get signals(){return signals}};hooks.push(hook);return getSnapshot()}};
  if(id==='react-native')return {AccessibilityInfo:{addEventListener:(_name,fn)=>{changed=fn;listenerCount++;return {remove:()=>removals++}},isReduceMotionEnabled:()=>{queryCount++;return new Promise(resolve=>resolveRead=resolve)}}};
  if(id==='react-native-reanimated')return {useReducedMotion:()=>false};throw Error(id);
 }});
 for(let i=0;i<100;i++)module.exports.useMotionPreference();
 assert.equal(queryCount,1);assert.equal(listenerCount,1);
 changed(true);resolveRead(false);await new Promise(setImmediate);
 for(const hook of hooks){assert.equal(hook.getSnapshot(),true);assert.equal(hook.signals,1)}
 changed(false);for(const hook of hooks){assert.equal(hook.getSnapshot(),false);assert.equal(hook.signals,2);hook.unsubscribe()}
 assert.equal(removals,1);
});

test('hidden discovery loads do not rebuild the reserve or change the published feed',async()=>{
 const {libraryHarness}=require('./helpers/libraryHarness.cjs');
 const h=await libraryHarness({catalogue:true,online:true,wiki:{batch:async()=>[]}});
 try{
  h.lib.setDiscovery(false);const before=h.lib.getFeed('all');
  for(let i=0;i<100;i++)await h.lib.load('all',0);
  assert.strictEqual(h.lib.getFeed('all'),before);
 }finally{h.dispose()}
});
