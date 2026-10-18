const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
test('help disclosures compose repeated taps before a React render instead of losing toggle intents',()=>{
 const slots=[];let index=0;
 const jsx=(type,props)=>({type,props}),module={exports:{}};
 const react={useEffect(){},useState(value){const i=index++;if(!(i in slots))slots[i]=value;return [slots[i],next=>{slots[i]=typeof next==='function'?next(slots[i]):next}]}};
 const code=ts.transpileModule(fs.readFileSync('src/components/GeminiSettings.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,require:id=>{
  if(id==='react')return react;if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};
  if(id==='react-native')return {Pressable:'Pressable',View:'View'};
  if(id==='./Atoms')return {Label:'Label',Icon:'Icon',useTheme:()=>({palette:{}})};
  if(id==='../design-system/components')return {Action:'Action',Field:'Field',Section:'Section',Surface:'Surface',ToggleRow:'ToggleRow'};
  if(id==='../theme')return {typography:{}};if(id==='./Collapsible')return {Collapsible:'Collapsible'};if(id==='../haptics')return {haptics:{emit(){}}};throw Error(id);
 }});
 const render=()=>{index=0;return module.exports.GeminiSettings({state:{configured:false,busy:false},online:true,aiKey:'',keyEdited:false})};
 const find=(node,label)=>{if(!node)return;if(Array.isArray(node)){for(const child of node){const found=find(child,label);if(found)return found}}else if(node.props){if(node.props.accessibilityLabel===label)return node;return find(node.props.children,label)}};
 const first=render(),guide=find(first,'Come configurarla'),privacy=find(first,'Privacy, limiti e disponibilità');
 for(let i=0;i<1001;i++)guide.props.onPress();for(let i=0;i<1000;i++)privacy.props.onPress();
 const after=render();assert.equal(find(after,'Come configurarla').props.accessibilityState.expanded,true);assert.equal(find(after,'Privacy, limiti e disponibilità').props.accessibilityState.expanded,false);
});
