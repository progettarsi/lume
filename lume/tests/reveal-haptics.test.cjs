const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {revealHapticStep}=require('../.test-build/revealHaptics');

test('reveal ticks require newly visible moving text, never a full reflow or invisible text',()=>{
 assert.equal(revealHapticStep(0,30,1000,600,true),true);
 for(const args of [[-1,0,1000,600,true],[30,30,1000,600,true],[30,20,1000,600,true],[30,1000,1000,600,true],[600,650,1000,600,true],[0,30,1000,-10,true],[0,30,1000,600,false]])assert.equal(revealHapticStep(...args),false);
});

function fixture({open=true,reduced=false}={}){
 let time=100;const cues=[],values=[],reactions=[],cleanup=[];
 const shared=value=>{const v={value};values.push(v);return v},jsx=(type,props)=>({type,props}),module={exports:{}};
 const source=ts.transpileModule(fs.readFileSync('src/components/ReaderReveal.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInNewContext(source,{module,exports:module.exports,Date:{now:()=>time},require:id=>{
  if(id==='react')return {memo:fn=>fn,useRef:current=>({current}),useCallback:fn=>fn,useEffect:fn=>cleanup.push(fn())};
  if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};
  if(id==='react-native')return {View:'View',StyleSheet:{create:x=>x,absoluteFill:{}}};
  if(id==='react-native-reanimated')return {__esModule:true,default:{View:'AnimatedView'},useSharedValue:shared,useAnimatedStyle:()=>({}),useAnimatedReaction:(read,fn)=>reactions.push(fn),runOnJS:fn=>fn,cancelAnimation:()=>{},Easing:{linear:()=>{}}};
  if(id==='expo-linear-gradient')return {LinearGradient:'Gradient'};
  if(id==='./Atoms')return {useTheme:()=>({palette:{paper:'#fff'}}),Label:'Label'};
  if(id==='../haptics')return {haptics:{emit:cue=>cues.push(cue)}};
  if(id==='../content/revealHaptics')return {revealHapticStep};
  if(id==='../content/reveal')return require('../.test-build/reveal');
  throw Error(id);
 }});
 const scrolled={value:false},active={value:true};
 module.exports.ReaderReveal({open,reduced,paragraphs:['Testo'],size:20,scroll:{value:0},viewport:{value:800},scrolled,active,bodyY:{value:0},expandedY:{value:0},progress:{value:1}});
 values[0].value=1000;
 return {cues,scrolled,active,advance:ms=>time+=ms,pulse:(next,previous)=>reactions[2](next,previous),dispose:()=>cleanup.forEach(fn=>fn?.())};
}
test('reveal callback stops on scroll, close, unmount, expiry and reduced motion',()=>{
 const f=fixture();f.pulse(30,0);assert.deepEqual(f.cues,['reveal']);f.advance(70);f.scrolled.value=true;f.pulse(60,30);f.scrolled.value=false;
 f.active.value=false;f.pulse(90,60);f.active.value=true;f.advance(2600);f.pulse(120,90);assert.equal(f.cues.length,1);
 for(const options of [{open:false},{reduced:true}]){const s=fixture(options);s.pulse(30,0);assert.deepEqual(s.cues,[])}
 const disposed=fixture();disposed.dispose();disposed.pulse(30,0);assert.deepEqual(disposed.cues,[]);
});
test('a finished opening sweep never restarts haptics for a later edition',()=>{
 const f=fixture();f.pulse(1000,990);f.advance(70);f.pulse(30,0);assert.deepEqual(f.cues,[]);
});
