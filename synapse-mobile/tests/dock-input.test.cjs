const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
test('navbar touch tracks do not move with the decorative spring and stay disjoint during reversal',()=>{
 let slots=[],index=0,effects=[],tree;const calls=[],props={selected:'home',onNavigate:id=>calls.push(id),onSearch(){},bottom:24,availableWidth:352};
 const slot=fn=>{const i=index++;return slots[i]??(slots[i]=fn())},react={useState:value=>{const state=slot(()=>({value}));return [state.value,next=>state.value=typeof next==='function'?next(state.value):next]},useLayoutEffect:fn=>{index++;effects.push(fn)}};
 const jsx=(type,props)=>({type,props}),module={exports:{}},shared=[];
 const source=ts.transpileModule(fs.readFileSync('src/components/Dock.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInNewContext(source,{module,exports:module.exports,require:id=>{
  if(id==='react')return react;if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};
  if(id==='react-native')return {View:'View',Pressable:'Pressable',StyleSheet:{create:x=>x},useWindowDimensions:()=>({fontScale:1})};
  if(id==='react-native-reanimated')return {__esModule:true,default:{View:'AnimatedView'},useSharedValue:value=>{const item=slot(()=>({value}));if(!shared.includes(item))shared.push(item);return item},useAnimatedStyle:fn=>{index++;return {read:fn}},withSpring:value=>value,cancelAnimation(){}};
  if(id.includes('useMotionPreference'))return {useMotionPreference:()=>false};if(id.endsWith('/theme'))return require('./helpers/theme.cjs');if(id==='./Atoms')return {Icon:'Icon',Label:'Label',Button:'Button',useTheme:()=>({palette:{}})};throw Error(id);
 }});
 const render=()=>{index=0;tree=module.exports.Dock(props);while(effects.length)effects.shift()()};
 const tabs=()=>tree.props.children[0].props.children.filter(child=>child?.props?.accessibilityRole==='tab');
 const box=tab=>Object.assign({},...tab.props.style);
 for(const destination of ['home','profile','home']){props.selected=destination;render();const [home,profile]=tabs(),before=[box(home),box(profile)];
  for(const progress of [0,.4,1.02,.6,-.02]){shared[0].value=progress;assert.deepEqual([...tabs()].map(box),before)}
  assert.equal(before[0].left+before[0].width,before[1].left);assert(before.every(rect=>rect.width>=48));
  profile.props.onPress();home.props.onPress();
 }
 assert.deepEqual(calls,['profile','home','profile','home','profile','home']);
});
