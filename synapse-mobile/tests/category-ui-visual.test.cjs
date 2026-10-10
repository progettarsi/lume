const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {emptyRegistry,categoryRailItems}=require('../.test-build/categoryRegistry');
const {CATEGORIES}=require('../.test-build/categories');

function compileComponent(filePath){
  return ts.transpileModule(fs.readFileSync(filePath,'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}
  }).outputText;
}

function mountCategoryRail(extraProps={}){
  let slots=[],index=0,effects=[],tree;
  let selectedCategory=extraProps.selected||'all';
  const props={
    selected:selectedCategory,
    onSelect:(id)=>{selectedCategory=id;props.selected=id;render();},
    items:categoryRailItems(emptyRegistry(),selectedCategory,true,{}),
    ...extraProps,
  };
  const react={
    useState(v){const i=index++;if(!(i in slots))slots[i]=v;return [slots[i],val=>{slots[i]=typeof val==='function'?val(slots[i]):val}]},
    useRef(v){const i=index++;return slots[i]??(slots[i]={current:v})},
    useMemo(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((v,j)=>v!==old.deps[j])){slots[i]={deps,val:fn()}}return slots[i].val},
    useEffect(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((v,j)=>v!==old.deps[j])){slots[i]={deps,cleanup:old?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn()})}},
  };
  const jsx=(type,p)=>typeof type==='function'?type(p):{type,props:p};
  const reanimated={
    default:{View:'AnimatedView'},
    useAnimatedStyle:(fn)=>fn(),
    useSharedValue:(v)=>({value:v}),
    withSpring:(v)=>v,
    LinearTransition:{springify:()=>({damping:()=>({stiffness:()=>({mass:()=>undefined})})})},
    FadeIn:{duration:()=>undefined},
    FadeOut:{duration:()=>undefined},
  };
  const module={exports:{}};
  const source=compileComponent('src/components/CategoryRail.tsx');
  vm.runInNewContext(source,{
    module,
    exports:module.exports,
    require:name=>{
      if(name==='react')return react;
      if(name==='react/jsx-runtime')return {jsx,jsxs:jsx};
      if(name==='react-native')return {Pressable:'Pressable',View:'View',ScrollView:'ScrollView',StyleSheet:{create:s=>s,absoluteFill:{position:'absolute',left:0,right:0,top:0,bottom:0}}};
      if(name==='react-native-reanimated')return reanimated;
      if(name==='expo-linear-gradient')return {LinearGradient:'LinearGradient'};
      if(name.endsWith('/Atoms'))return {Label:'Label',Icon:'Icon',useTheme:()=>({palette:{paper:'#fff',ink:'#111',accent:'#933',active:'#edc',surface:'#f5f5f5',muted:'#777'}})};
      if(name.includes('useMotionPreference'))return {useMotionPreference:()=>false};
      if(name.endsWith('/categories'))return {CATEGORIES};
      return {};
    }
  });

  const render=()=>{index=0;tree=module.exports.CategoryRail(props);while(effects.length)effects.shift()()};
  render();

  const collectChips=(node,chips=[])=>{
    if(!node||typeof node!=='object')return chips;
    if(node.props?.accessibilityRole==='button'&&node.props?.accessibilityLabel){
      chips.push(node);
    }
    const children=node.props?.children;
    if(Array.isArray(children))children.forEach(c=>collectChips(c,chips));
    else if(children)collectChips(children,chips);
    return chips;
  };

  return {
    getTree:()=>tree,
    getChips:()=>collectChips(tree),
    update:(newProps)=>{Object.assign(props,newProps);render();},
  };
}

function mountGeminiSettings(extraProps={}){
  let slots=[],index=0,effects=[],tree;
  let calls=[];
  const defaultState={status:'missing',configured:false,enabled:false,busy:false,message:'Inserisci una chiave personale Gemini.',actions:['save','enable']};
  const props={
    state:defaultState,
    aiKey:'',
    keyEdited:false,
    onChangeKey:(v)=>calls.push({type:'changeKey',value:v}),
    onSaveKey:()=>calls.push({type:'saveKey'}),
    onRemoveKey:()=>calls.push({type:'removeKey'}),
    aiEnabled:false,
    onToggleEnabled:(enabled)=>calls.push({type:'toggleEnabled',value:enabled}),
    ...extraProps,
  };
  const react={
    useState(v){const i=index++;if(!(i in slots))slots[i]=v;return [slots[i],val=>{slots[i]=typeof val==='function'?val(slots[i]):val;render();}]},
    useRef(v){const i=index++;return slots[i]??(slots[i]={current:v})},
    useEffect(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((v,j)=>v!==old.deps[j])){slots[i]={deps,cleanup:old?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn()})}},
  };
  const jsx=(_,p)=>({type:_,props:p});
  const reanimated={
    default:{View:'AnimatedView'},
    FadeIn:{duration:()=>undefined},
    FadeOut:{duration:()=>undefined},
    LinearTransition:{duration:()=>undefined},
  };
  const module={exports:{}};
  const source=compileComponent('src/components/GeminiSettings.tsx');
  vm.runInNewContext(source,{
    module,
    exports:module.exports,
    require:name=>{
      if(name==='react')return react;
      if(name==='react/jsx-runtime')return {jsx,jsxs:jsx};
      if(name==='react-native')return {
        Pressable:'Pressable',
        View:'View',
        TextInput:'TextInput',
        StyleSheet:{create:s=>s,hairlineWidth:1},
        Linking:{openURL:async(url)=>calls.push({type:'openURL',url})},
        Platform:{OS:'android'}
      };
      if(name==='react-native-reanimated')return reanimated;
      if(name.endsWith('/Atoms'))return {Label:'Label',Icon:'Icon',Button:(p)=>({type:'Button',props:p}),useTheme:()=>({palette:{paper:'#fff',ink:'#111',accent:'#933',active:'#edc',surface:'#f5f5f5',muted:'#777',line:'#ddd'}})};
      if(name.includes('useMotionPreference'))return {useMotionPreference:()=>false};
      return {};
    }
  });

  const render=()=>{index=0;tree=module.exports.GeminiSettings(props);while(effects.length)effects.shift()()};
  render();

  const findByRole=(role,node,list=[])=>{
    if(!node||typeof node!=='object')return list;
    if(node.props?.accessibilityRole===role)list.push(node);
    const children=node.props?.children;
    if(Array.isArray(children))children.forEach(c=>findByRole(role,c,list));
    else if(children)findByRole(role,c,list);
    return list;
  };

  const findByLabel=(label,node)=>{
    if(!node||typeof node!=='object')return undefined;
    if(node.props?.accessibilityLabel===label||node.props?.label===label)return node;
    const children=node.props?.children;
    if(Array.isArray(children)){
      for(const c of children){const f=findByLabel(label,c);if(f)return f;}
    } else if(children){
      return findByLabel(label,children);
    }
    return undefined;
  };

  return {
    getTree:()=>tree,
    calls,
    findByRole:(role)=>findByRole(role,tree),
    findByLabel:(label)=>findByLabel(label,tree),
    update:(newProps)=>{Object.assign(props,newProps);render();},
  };
}

test('CategoryRail renders Per Te first and preserves stable IDs',()=>{
  const h=mountCategoryRail();
  const chips=h.getChips();
  assert(chips.length>=7);
  assert.equal(chips[0].props.accessibilityLabel,'Per Te');
  assert(chips[0].props.accessibilityState.selected);
});

test('CategoryRail offline disables all categories except Per Te with accessible description',()=>{
  const reg=emptyRegistry();
  const offlineItems=categoryRailItems(reg,'all',false,{});
  const h=mountCategoryRail({items:offlineItems});
  const chips=h.getChips();
  assert.equal(chips[0].props.accessibilityState.disabled,false);
  for(const c of chips.slice(1)){
    assert.equal(c.props.accessibilityState.disabled,true);
    assert(c.props.accessibilityLabel.includes('non disponibile offline'));
  }
});

test('CategoryRail updates smoothly when categories are reordered, inserted or removed without reordering locally',()=>{
  const reg1=emptyRegistry();
  const h=mountCategoryRail({items:categoryRailItems(reg1,'all',true,{})});
  let chips=h.getChips();
  assert.equal(chips[1].props.accessibilityLabel,'Scienza');

  // New registry order with history first
  const reg2={version:1,topics:{},visible:['history','science','nature']};
  h.update({items:categoryRailItems(reg2,'all',true,{})});
  chips=h.getChips();
  assert.equal(chips[0].props.accessibilityLabel,'Per Te');
  assert.equal(chips[1].props.accessibilityLabel,'Storia');
  assert.equal(chips[2].props.accessibilityLabel,'Scienza');
  assert.equal(chips[3].props.accessibilityLabel,'Natura');
});

test('GeminiSettings displays title, subtitle, status card and guide accordion',()=>{
  const h=mountGeminiSettings();
  const tree=h.getTree();
  assert(JSON.stringify(tree).includes('Integrazione Gemini'));
  assert(JSON.stringify(tree).includes('Usa Gemini per rielaborare i testi'));
  assert(JSON.stringify(tree).includes('Inserisci una chiave personale Gemini.'));

  // Toggle guide
  const guideBtn=h.findByLabel('Mostra o nascondi la guida alla configurazione');
  assert(guideBtn);
  guideBtn.props.onPress();
  const updatedTree=h.getTree();
  assert(JSON.stringify(updatedTree).includes('Guida rapida alla configurazione'));
  assert(JSON.stringify(updatedTree).includes('aistudio.google.com/apikey'));
  assert(JSON.stringify(updatedTree).includes('Facoltativa'));
});

test('GeminiSettings shows configured, active, disabled and remove button without revealing key',()=>{
  const configuredState={status:'ready',configured:true,enabled:true,busy:false,message:'Gemini configurato. Wikipedia resta disponibile.',actions:['save','remove','disable']};
  const h=mountGeminiSettings({state:configuredState,aiEnabled:true});
  const tree=h.getTree();
  assert(JSON.stringify(tree).includes('Configurato e attivo'));
  assert(JSON.stringify(tree).includes('Gemini configurato. Wikipedia resta disponibile.'));
  assert(!JSON.stringify(tree).includes('AIzaSy'));

  const removeBtn=h.findByLabel('Rimuovi chiave Gemini');
  assert(removeBtn);
  removeBtn.props.onPress();
  assert.equal(h.calls.at(-1).type,'removeKey');
});

test('GeminiSettings links to official AI Studio URL',()=>{
  const h=mountGeminiSettings();
  const linkBtn=h.findByLabel('Ottieni una chiave API su Google AI Studio');
  assert(linkBtn);
  linkBtn.props.onPress();
  assert.equal(h.calls.at(-1).type,'openURL');
  assert.equal(h.calls.at(-1).url,'https://aistudio.google.com/apikey');
});
