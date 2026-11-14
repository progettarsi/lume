const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
test('bookmark pointer and accessibility presses use one activation path and render the persisted glyph directly',()=>{
 const source=ts.transpileModule(fs.readFileSync('src/components/SaveButton.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 let intents=0;const module={exports:{}},jsx=(type,props)=>({type,props});
 vm.runInNewContext(source,{module,exports:module.exports,require:id=>{
  if(id==='react')return {useState:v=>[v,()=>{}]};if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};
  if(id==='react-native')return {Pressable:'Pressable',View:'View'};
  if(id==='react-native-reanimated')return {__esModule:true,default:{View:'AnimatedView'},useSharedValue:value=>({value}),useAnimatedStyle:fn=>fn(),cancelAnimation(){},withTiming:value=>value,withSpring:value=>value};
  if(id.includes('useMotionPreference'))return {useMotionPreference:()=>false};if(id==='./AnimatedIcon')return {AnimatedIcon:'AnimatedIcon'};if(id==='./Atoms')return {Icon:'Icon',useTheme:()=>({palette:{}})};
  throw Error('Unexpected second input system: '+id);
 }});
 const button=module.exports.SaveButton({saved:false,onPress:()=>intents++});assert.equal(button.type,'Pressable');
 button.props.onPress();assert.equal(intents,1);assert.equal(button.props.accessibilityRole,'button');assert.equal(button.props.onAccessibilityTap,undefined);
 assert.equal(button.props.children.props.name,'bookmark');
 const saved=module.exports.SaveButton({saved:true,onPress:()=>intents++});saved.props.onPress();assert.equal(intents,2);assert.equal(saved.props.accessibilityLabel,'Rimuovi dai salvati');assert.equal(saved.props.accessibilityState.selected,true);assert.equal(saved.props.children.props.name,'bookmark');
 for(const value of [false,true,true,false,true]){const next=module.exports.SaveButton({saved:value,onPress(){}});assert.equal(next.props.children.props.filled,value)}
});
