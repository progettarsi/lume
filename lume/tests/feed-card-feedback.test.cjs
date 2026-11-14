const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
test('repeated reduced-motion saves keep their own feedback deadline and unmount cancels pending feedback',()=>{
 let now=0,saves=0;const timers=new Map(),shared=[],effects=[],taps=[],module={exports:{}},jsx=(type,props)=>({type,props});
 const gesture=()=>{const handlers={},chain=new Proxy({}, {get:(_,key)=>(...args)=>{handlers[key]=args[0];return chain}});taps.push(handlers);return chain};
 const source=ts.transpileModule(fs.readFileSync('src/components/Feed.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInNewContext(source,{module,exports:module.exports,setTimeout:(fn,ms)=>{const key={};timers.set(key,{at:now+ms,fn});return key},clearTimeout:key=>timers.delete(key),require:id=>{
  if(id==='react')return {memo:fn=>fn,useState:v=>[v,()=>{}],useRef:current=>({current}),useCallback:fn=>fn,useEffect:fn=>effects.push(fn)};
  if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};if(id==='react-native')return {View:'View',StyleSheet:{create:x=>x}};
  if(id==='react-native-reanimated')return {__esModule:true,default:{View:'AnimatedView'},useSharedValue:value=>{const v={value};shared.push(v);return v},useAnimatedStyle:fn=>fn(),cancelAnimation(){},withSpring:v=>v,withTiming:v=>v};
  if(id==='react-native-gesture-handler')return {Gesture:{Tap:gesture,Exclusive(){}},GestureDetector:'GestureDetector'};
  if(id==='expo-haptics')return {selectionAsync:async()=>{}};if(id.endsWith('/theme'))return require('./helpers/theme.cjs');
  if(id.endsWith('/Atoms'))return {Label:'Label',Icon:'Icon',useTheme:()=>({palette:{}})};
  if(id.endsWith('/edition'))return require('../.test-build/edition');if(id.endsWith('/categories'))return require('../.test-build/categories');return {};
 }});
 module.exports.FeedCard({article:{id:'a',title:'Luce',category:'science',preview:[]},height:700,size:20,saved:false,reduced:true,onSave:()=>saves++,onOpen(){}});
 const cleanup=effects.map(fn=>fn()),tap=()=>taps[0].onEnd({},true),advance=ms=>{now+=ms;for(const [key,job] of timers)if(job.at<=now){timers.delete(key);job.fn()}};
 tap();advance(100);tap();assert.equal(saves,2);advance(80);assert.equal(shared[0].value,1);advance(100);assert.equal(shared[0].value,0);
 tap();assert.equal(timers.size,1);cleanup.forEach(fn=>fn?.());assert.equal(timers.size,0);
});
