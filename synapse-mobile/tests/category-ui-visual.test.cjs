const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {emptyRegistry,categoryRailItems}=require('../.test-build/categoryRegistry');
const {CATEGORIES}=require('../.test-build/categories');

function compileComponent(filePath){
  return ts.transpileModule(fs.readFileSync(filePath,'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}
  }).outputText;
}

function mountCategoryRail(extraProps={}){
  let slots=[],index=0,effects=[],tree,pending=false;const children=new Map(),animations=[],frames=new Map();let frameId=0;
  let selectedCategory=extraProps.selected||'all';
  const props={
    selected:selectedCategory,
    onSelect:(id)=>{selectedCategory=id;props.selected=id;render();},
    items:categoryRailItems(emptyRegistry(),selectedCategory,true,{}),
    ...extraProps,
  };
  const react={
    useState(v){const i=index++,own=slots;if(!(i in own))own[i]=v;return [own[i],val=>{own[i]=typeof val==='function'?val(own[i]):val;pending=true}]},
    useRef(v){const i=index++;return slots[i]??(slots[i]={current:v})},
    useMemo(fn,deps){const i=index++,old=slots[i];if(!old||deps.some((v,j)=>v!==old.deps[j])){slots[i]={deps,val:fn()}}return slots[i].val},
    useEffect(fn,deps){const i=index++,own=slots,old=own[i];if(!old||!deps||deps.some((v,j)=>v!==old.deps?.[j])){own[i]={deps,cleanup:old?.cleanup};effects.push(()=>{own[i].cleanup?.();own[i].cleanup=fn()})}},
  };
  react.useLayoutEffect=react.useEffect;
  const rootSlots=slots;
  const jsx=(type,p,key)=>{if(typeof type!=='function')return {type,props:p,key};const parent=slots,parentIndex=index;slots=children.get(key)||[];children.set(key,slots);index=0;const result=type(p);slots=parent;index=parentIndex;return result};
  react.createElement=(type,p)=>jsx(type,p,p.key);
  const reanimated={
    __esModule:true,
    default:{View:'AnimatedView'},
    useAnimatedStyle:(fn)=>fn(),
    useSharedValue:(v)=>react.useRef({value:v}).current,
    withSpring:(v)=>v,
    withTiming:(v,_config,done)=>{if(done)animations.push(done);return v},runOnJS:fn=>fn,
    LinearTransition:{springify:()=>({damping:()=>({stiffness:()=>({mass:()=>undefined})})})},
    FadeIn:{duration:()=>undefined},
    FadeOut:{duration:()=>undefined},
  };
  const module={exports:{}};
  const source=compileComponent('src/components/CategoryRail.tsx');
  vm.runInNewContext(source,{
    module,requestAnimationFrame:fn=>{const id=++frameId;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),
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

  const render=()=>{do{pending=false;slots=rootSlots;index=0;tree=module.exports.CategoryRail(props);while(effects.length)effects.shift()()}while(pending)};
  render();

  const collectChips=(node,chips=[])=>{
    if(Array.isArray(node)){node.forEach(c=>collectChips(c,chips));return chips}
    if(!node||typeof node!=='object')return chips;
    if(node.props?.accessibilityRole==='button'&&node.props?.accessibilityLabel&&node.props.accessible!==false){
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
    finishExits:()=>{animations.splice(0).forEach(fn=>fn(true));render()},
    frame:()=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn());render()},
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
        Linking:{openURL:async(url)=>{calls.push({type:'openURL',url});if(extraProps.linkFailure)throw Error('No browser')}},
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

function nodes(tree,match){const found=[];function visit(n){if(Array.isArray(n))return n.forEach(visit);if(!n||typeof n!=='object')return;if(match(n))found.push(n);visit(n.props?.children)}visit(tree);return found}
test('removed chips leave only inert inaccessible ghosts; rapid restoration cannot be deleted by an old completion',()=>{
 const h=mountCategoryRail(),views=nodes(h.getTree(),n=>n.type==='AnimatedView'&&n.props.onLayout);
 assert.equal(views.length,7);views.forEach((v,i)=>v.props.onLayout({nativeEvent:{layout:{x:i*100,y:0,width:94,height:44}}}));
 const items=categoryRailItems(emptyRegistry(),'all',true,{});h.update({items:items.filter(c=>c.id!=='science')});
 const ghosts=nodes(h.getTree(),n=>n.props?.importantForAccessibility==='no-hide-descendants');assert.equal(ghosts.length,1);assert.equal(ghosts[0].props.pointerEvents,'none');assert(ghosts[0].props.accessibilityElementsHidden);
 const button=nodes(ghosts[0],n=>n.type==='Pressable')[0];assert(button.props.disabled);assert.equal(button.props.accessible,false);assert.equal(button.props.focusable,false);
 assert(!h.getChips().some(c=>c.props.accessibilityLabel==='Scienza'));h.update({items});h.finishExits();assert(h.getChips().some(c=>c.props.accessibilityLabel==='Scienza'));assert.equal(nodes(h.getTree(),n=>n.props?.importantForAccessibility==='no-hide-descendants').length,0);
});
test('touch release during drag/momentum cannot settle the registry under the scrolling finger',()=>{
 let ends=0;const h=mountCategoryRail({onInteractionEnd:()=>ends++}),scroll=()=>nodes(h.getTree(),n=>n.type==='ScrollView')[0].props;
 scroll().onTouchStart();scroll().onScrollBeginDrag();scroll().onTouchEnd();h.frame();assert.equal(ends,0);
 scroll().onScrollEndDrag();scroll().onMomentumScrollBegin();h.frame();assert.equal(ends,0);scroll().onMomentumScrollEnd();h.frame();assert.equal(ends,1);
});
test('rail content changes preserve offset when computing the end fade, with text never scaled by touch',()=>{
 const h=mountCategoryRail(),scroll=nodes(h.getTree(),n=>n.type==='ScrollView')[0].props,root=h.getTree().props;
 root.onLayout({nativeEvent:{layout:{width:200}}});scroll.onContentSizeChange(600);scroll.onScroll({nativeEvent:{contentOffset:{x:400}}});h.frame();
 nodes(h.getTree(),n=>n.type==='ScrollView')[0].props.onContentSizeChange(620);h.frame();assert.equal(nodes(h.getTree(),n=>n.type==='LinearGradient').length,1);
 nodes(h.getTree(),n=>n.type==='ScrollView')[0].props.onContentSizeChange(600);h.frame();assert.equal(nodes(h.getTree(),n=>n.type==='LinearGradient').length,0);
 assert(!fs.readFileSync('src/components/CategoryRail.tsx','utf8').includes('scale:press.value'));
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

test('CategoryRail preserves supplied order and IDs across insertion/removal (native motion is tested separately)',()=>{
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
test('Gemini configuration statuses, actions and collapsed guide are accurate without claiming key validation',async()=>{
 const h=mountGeminiSettings();for(const status of ['loading','missing','ready','disabled','saving','error']){
  const busy=['loading','saving'].includes(status),configured=['ready','disabled','saving'].includes(status);h.update({state:{status,busy,configured,enabled:status==='ready',message:'stato '+status,actions:[]},aiKey:'fixture',keyEdited:true});
  assert(JSON.stringify(h.getTree()).includes('stato '+status));assert.equal(h.findByLabel('Salva chiave API').props.disabled,busy);
 }
 h.findByLabel('Mostra o nascondi la guida alla configurazione').props.onPress();assert(h.findByLabel('Documentazione ufficiale chiavi API Gemini'));assert(JSON.stringify(h.getTree()).includes('fatturazione disattivata'));
 h.findByLabel('Mostra o nascondi la guida alla configurazione').props.onPress();assert(!h.findByLabel('Documentazione ufficiale chiavi API Gemini'));
 const failed=mountGeminiSettings({linkFailure:true});failed.findByLabel('Ottieni una chiave API su Google AI Studio').props.onPress();await new Promise(setImmediate);assert(JSON.stringify(failed.getTree()).includes('Impossibile aprire il collegamento'));
});
