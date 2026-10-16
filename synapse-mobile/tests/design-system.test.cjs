const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const tokens=require('./helpers/theme.cjs');
const hapticCues=[];
const jsx=(type,props)=>({type,props});
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/design-system/components.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
 module:mod,exports:mod.exports,require(id){
  if(id==='../haptics')return {haptics:{emit:cue=>hapticCues.push(cue)}};
  if(id==='react')return {forwardRef:fn=>props=>fn(props,null),useRef:()=>({current:null}),useState:v=>[v,()=>{}],useEffect:()=>{}};
  if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};
  if(id==='react-native')return {View:'View',Pressable:'Pressable',Switch:'Switch',TextInput:'TextInput',ScrollView:'ScrollView',KeyboardAvoidingView:'KeyboardAvoidingView',Platform:{OS:'android'},useWindowDimensions:()=>({fontScale:1}),StyleSheet:{create:x=>x,absoluteFill:{position:'absolute'},hairlineWidth:1}};
  if(id==='react-native-reanimated')return {default:{View:'AnimatedView'}};
  if(id==='./tokens')return tokens;
  if(id==='./primitives')return {Button:'Button',Label:'Label',Icon:'Icon',useTheme:()=>({palette:tokens.light})};
  throw Error(id);
 }
});
const ui=mod.exports;

test('settings dispatch one cue for accepted navigation, on/off and changed choices',()=>{
 hapticCues.length=0;const changes=[];
 ui.NavigationRow({title:'Gemini',icon:'auto-fix',onPress:()=>changes.push('page')}).props.onPress();
 for(const value of [false,true])ui.ToggleRow({title:'Opzione',value,onChange:next=>changes.push(next)}).props.onPress();
 ui.ToggleRow({title:'Disabilitata',value:false,disabled:true,onChange:()=>{throw Error('disabled')}}).props.onPress();
 const group=ui.ChoiceGroup({label:'Tema',value:'light',options:[{value:'light',label:'Chiaro'},{value:'dark',label:'Scuro'}],onChange:v=>changes.push(v)}).props.children[1];
 group.props.children[0].props.onPress();group.props.children[1].props.onPress();
 assert.deepEqual(changes,['page',true,false,'dark']);assert.deepEqual(hapticCues,['tap','on','off','selection']);
});
test('disabled actions stay visibly disabled instead of the feedback animation overriding their opacity',()=>{
 const compiled={exports:{}},react={createContext:value=>({value}),useContext:context=>context.value,useEffect:fn=>fn()};react.default=react;
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/design-system/primitives.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
  module:compiled,exports:compiled.exports,require(id){
   if(id==='../haptics')return {haptics:{emit:cue=>hapticCues.push(cue)}};
  if(id==='react')return react;if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};
   if(id==='react-native')return {Pressable:'Pressable',StyleSheet:{create:x=>x}};
   if(id==='react-native-reanimated')return {default:{View:'AnimatedView'},useSharedValue:value=>({value}),useAnimatedStyle:read=>({read}),withSpring:value=>value};
   if(id==='./tokens')return tokens;
   if(id==='../useMotionPreference')return {useMotionPreference:()=>false};
   if(id==='react-native-svg')return {default:'Svg',Path:'Path'};
   if(id==='./phosphorPaths')return {phosphorPaths:{}};
   throw Error(id);
  }
 });
 const render=disabled=>compiled.exports.Button({label:'Salva',children:'Salva',disabled,onPress:()=>{},style:{opacity:disabled?.5:1}});
 const disabled=render(true);assert.equal(disabled.props.children.props.disabled,true);assert.equal(disabled.props.style.at(-1).read().opacity,.5);
 const enabled=render(false);enabled.props.children.props.onPressIn();assert.equal(enabled.props.style.at(-1).read().opacity,.7);enabled.props.children.props.onPressOut();assert.equal(enabled.props.style.at(-1).read().opacity,1);
});
test('covered scenes disable both touch and accessibility on a real non-collapsible parent',()=>{
 for(const active of [true,false]){const host=ui.ScreenLayer({active,children:'private underlying control',style:{transform:[]}});
 assert.equal(host.props.collapsable,false);assert.equal(host.props.pointerEvents,active?'box-none':'none');assert.equal(host.props.accessibilityElementsHidden,!active);assert.equal(host.props.importantForAccessibility,active?'auto':'no-hide-descendants');}
});
test('single-choice controls expose selection and preserve numeric setting values',()=>{
 const calls=[],wrapper=ui.ChoiceGroup({label:'Lettura',value:20,options:[{value:18,label:'Piccolo'},{value:20,label:'Medio'},{value:23,label:'Grande'}],onChange:v=>calls.push(v)}),tree=wrapper.props.children[1];
 assert.equal(tree.props.accessibilityRole,'radiogroup');const choices=tree.props.children;
 assert.deepEqual(choices.map(c=>c.props.accessibilityState.checked),[false,true,false]);choices[2].props.onPress();assert.deepEqual(calls,[23]);
 assert.equal(tree.props.style.flexWrap,'wrap');for(const c of choices){assert.equal(c.props.children.props.numberOfLines,1);assert.equal(c.props.style({pressed:false}).flexShrink,0)}
});
test('a disabled switch is one announced control; the decorative native switch cannot intercept input',()=>{
 const tree=ui.ToggleRow({title:'Gemini',value:true,disabled:true,onChange:()=>{throw Error('must not dispatch')}});
 assert.equal(tree.props.accessibilityRole,'switch');assert.equal(tree.props.disabled,true);assert.equal(tree.props.accessibilityState.checked,true);assert.equal(tree.props.accessibilityState.disabled,true);
 const graphic=tree.props.children[1];assert.equal(graphic.props.pointerEvents,'none');assert.equal(graphic.props.importantForAccessibility,'no-hide-descendants');
});
function luminance(hex){const c=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
test('current palette supports normal text and actionable icons on all shared surfaces',()=>{
 for(const palette of [tokens.light,tokens.dark])for(const background of ['paper','surface','active']){
  assert(contrast(palette.ink,palette[background])>=4.5,`ink on ${background}`);
  assert(contrast(tokens.secondaryText(palette,background),palette[background])>=4.5,`muted on ${background}`);
  assert(contrast(palette.accent,palette[background])>=3,`accent on ${background}`);
 }
});
test('locally bundled typefaces have font data and redistribution licenses',()=>{
 for(const file of ['GoogleSansFlex-400.ttf','GoogleSansFlex-500.ttf','GoogleSansFlex-600.ttf','Newsreader_800ExtraBold_Italic.ttf']){
  const bytes=fs.readFileSync('assets/fonts/'+file);assert(bytes.length>10000);assert.equal(bytes.readUInt32BE(0),0x00010000);
 }
 for(const file of ['GoogleSansFlex-OFL.txt','Newsreader-OFL.txt'])assert.match(fs.readFileSync('assets/fonts/'+file,'utf8'),/SIL OPEN FONT LICENSE/i);
});
