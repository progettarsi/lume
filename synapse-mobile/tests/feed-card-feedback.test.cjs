const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
test('one feed tap opens at release, repeated taps never save, cancelled taps never open',()=>{
 let opens=0,saves=0;const taps=[],effects=[],shared=[],module={exports:{}},jsx=(type,props)=>({type,props});
 const gesture=()=>{const handlers={},chain=new Proxy({}, {get:(_,key)=>(...args)=>{handlers[key]=args[0];return chain}});taps.push(handlers);return chain};
 const source=ts.transpileModule(fs.readFileSync('src/components/Feed.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInNewContext(source,{module,exports:module.exports,require:id=>{
  if(id==='react')return {memo:fn=>fn,useMemo:fn=>fn(),useState:v=>[v,()=>{}],useRef:current=>({current}),useCallback:fn=>fn,useEffect:fn=>effects.push(fn),useLayoutEffect:fn=>effects.push(fn)};
  if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};if(id==='react-native')return {View:'View',StyleSheet:{create:x=>x}};
  if(id==='react-native-reanimated')return {__esModule:true,default:{View:'AnimatedView'},useAnimatedRef:()=>({current:{}}),measure:()=>({pageX:24,pageY:160,width:352,height:500}),runOnJS:fn=>fn,useSharedValue:value=>{const item={value};shared.push(item);return item},useAnimatedStyle:fn=>fn(),cancelAnimation(){},withSpring:v=>v,withTiming:v=>v};
  if(id==='react-native-gesture-handler')return {Gesture:{Tap:gesture},GestureDetector:'GestureDetector'};
  if(id.endsWith('/theme'))return require('./helpers/theme.cjs');if(id.endsWith('/Atoms'))return {Label:'Label',Icon:'Icon',useTheme:()=>({palette:{}})};
  if(id.endsWith('/edition'))return require('../.test-build/edition');if(id.endsWith('/categories'))return require('../.test-build/categories');return {};
 }});
 module.exports.FeedCard({article:{id:'a',title:'Luce',category:'science',preview:[]},height:700,size:20,saved:false,reduced:false,onSave:()=>saves++,onOpen:(_a,_node,_kind,_title,box)=>{assert.equal(box.y,160);opens++}});
 assert.equal(taps.length,1);assert.equal(taps[0].numberOfTaps,undefined);assert.equal(taps[0].maxDelay,undefined);
 taps[0].onBegin();assert.equal(shared[0].value,.985);assert.equal(opens,0);
 for(let i=0;i<100;i++)taps[0].onEnd({},true);
 assert.equal(opens,100);assert.equal(saves,0);taps[0].onEnd({},false);assert.equal(opens,100);
});
