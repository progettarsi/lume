const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {scrollEdgeOpacity}=require('../.test-build/onboardingLayout');
const nodes=n=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(nodes):[n,...nodes(n.props?.children)];
function fixture(file,props,extra={},exportName){
 let cursor=0,tree,dirty=false,time=0,serial=0;const slots=[],effects=[],shared=[],animations=[],timers=new Map();
 const slot=fn=>{const i=cursor++;return slots[i]??(slots[i]=fn())};
 const effect=(fn,deps)=>{const s=slot(()=>({deps:null,cleanup:null}));if(!s.deps||deps.some((d,i)=>!Object.is(d,s.deps[i]))){s.deps=deps;effects.push(()=>{s.cleanup?.();s.cleanup=fn()})}};
 const react={createContext:v=>({value:v}),useContext:()=>null,useState:v=>{const s=slot(()=>({value:typeof v==='function'?v():v}));return [s.value,v=>{const next=typeof v==='function'?v(s.value):v;if(!Object.is(next,s.value)){s.value=next;dirty=true}}]},useRef:v=>slot(()=>({current:v})),useEffect:effect,useLayoutEffect:effect};
 const atomic=value=>({current:value,animation:null,get value(){return this.current},set value(v){if(v?.animation){this.animation={...v,owner:this};animations.push(this.animation)}else{this.current=v;this.animation=null}}});
 const reanimated={__esModule:true,default:{View:'AnimatedView',Image:'AnimatedImage',ScrollView:'AnimatedScrollView'},Easing:{bezier:()=> 'ease'},useSharedValue:v=>{const s=slot(()=>atomic(v));if(!shared.includes(s))shared.push(s);return s},useAnimatedStyle:fn=>{slot(()=>({}));return {read:fn}},useAnimatedScrollHandler:fn=>fn,withTiming:(target,config,done)=>({animation:true,target,config,done}),cancelAnimation(s){if(s.animation)s.animation.cancelled=true;s.animation=null},runOnJS:fn=>fn};
 const jsx=(type,props)=>typeof type==='function'?type(props):({type,props}),module={exports:{}};
 react.createElement=(type,props,...children)=>jsx(type,{...props,children:children.length===1?children[0]:children});
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,Math,Array,JSON,setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,at:time+ms});return id},clearTimeout:id=>timers.delete(id),require(id){
  if(id==='react')return react;if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};if(id==='react-native-reanimated')return reanimated;
  if(id==='react-native')return {View:'View',Text:'Text',Image:'Image',Pressable:'Pressable',StyleSheet:{absoluteFill:{position:'absolute',inset:0}},useWindowDimensions:()=>({width:384,fontScale:1}),AccessibilityInfo:{isScreenReaderEnabled:async()=>false}};
  if(id.includes('Atoms'))return {useTheme:()=>({palette:{paper:'#f7f4ee',surface:'#eae4dc',line:'#ded8cf',active:'#dda184',ink:'#282621',muted:'#67655f',accent:'#b65b40'}}),Label:'Label',Button:'Button',Icon:'Icon'};
  if(id.includes('masked-view'))return {__esModule:true,default:'MaskedView'};if(id==='expo-linear-gradient')return {LinearGradient:'Gradient'};
  if(id.endsWith('tutorialFeed'))return require('../.test-build/tutorialFeed');if(id.endsWith('onboardingLayout'))return require('../.test-build/onboardingLayout');if(id.endsWith('onboardingTitleLayout'))return require('../.test-build/onboardingTitleLayout');if(id.endsWith('onboardingPresentation'))return require('../.test-build/onboardingPresentation');return extra[id]||{};
 }});
 const component=exportName?module.exports[exportName]:Object.values(module.exports).find(value=>typeof value==='function');
 const render=()=>{cursor=0;tree=component(props)};
 const flush=()=>{for(let i=0;i<30;i++){while(effects.length)effects.shift()();if(!dirty)return;dirty=false;render()}throw Error('Render loop')};
 const settle=a=>{assert(a&&!a.cancelled);a.owner.value=a.target;a.done?.(true);render();flush()};
 const advance=ms=>{const end=time+ms;for(let i=0;i<500;i++){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next){time=end;return}time=next[1].at;timers.delete(next[0]);next[1].fn();render();flush()}throw Error('Timer loop')};
 render();flush();return {props,shared,animations,settle,advance,update(patch){Object.assign(props,patch);render();flush()},render,flush,get tree(){return tree},get timers(){return timers.size}};
}

test('alpha scroll edges uncover the background and restore fully opaque content at each end',()=>{
 const f=fixture('src/components/onboarding/InterestScrollMask.tsx',{visible:true,children:'chips'}),scroll=nodes(f.tree).find(n=>n.type==='AnimatedScrollView');
 scroll.props.onLayout({nativeEvent:{layout:{height:400}}});scroll.props.onContentSizeChange(340,900);
 // Alpha source-over: opaque cover removes the fade, with no paper-coloured overlay.
 const coverStyles=nodes(f.tree.props.maskElement).filter(n=>n.type==='AnimatedView').map(n=>n.props.style.at(-1));
 assert.equal(coverStyles[0].read().opacity,1);assert.equal(coverStyles[1].read().opacity,0);
 scroll.props.onScroll({contentOffset:{y:16}});assert.equal(coverStyles[0].read().opacity,.5);
 scroll.props.onScroll({contentOffset:{y:486}});assert.equal(coverStyles[0].read().opacity,0);assert.equal(coverStyles[1].read().opacity,.5);
 scroll.props.onScroll({contentOffset:{y:500}});assert.equal(coverStyles[1].read().opacity,1);
 scroll.props.onScroll({contentOffset:{y:-12}});assert.equal(coverStyles[0].read().opacity,1);
 scroll.props.onContentSizeChange(340,200);assert.equal(coverStyles[1].read().opacity,1);
 assert.equal(scrollEdgeOpacity(-10,32),0);assert.equal(scrollEdgeOpacity(80,32),1);assert.equal(f.tree.props.androidRenderingMode,'software');
 f.update({visible:false});assert.equal(f.tree.props.androidRenderingMode,'hardware');
});

test('title measures full incoming lines before typing, never rewraps prefixes, and reports height only at a whole-title change',()=>{
 const heights=[],duo='Una scoperta alla volta',single='Il feed impara da te';
 const f=fixture('src/components/OnboardingMotionSlots.tsx',{title:duo,titleKey:'feed',motion:{reduced:false,visible:true,appActive:true},minLines:1,initialReveal:true,onPaintHeight:h=>heights.push(h)},{},'OnboardingTitleSlot');
 const painted=()=>nodes(f.tree).filter(n=>n.type==='Text'&&!n.props.onTextLayout),measure=(text,lines)=>{nodes(f.tree).find(n=>n.type==='Text'&&n.props.children===text&&n.props.onTextLayout).props.onTextLayout({nativeEvent:{lines}});f.render();f.flush()};
 f.tree.props.onLayout({nativeEvent:{layout:{width:336}}});f.render();f.flush();f.advance(500);assert.equal(painted().length,0);assert.equal(f.timers,0);
 const duoLines=[{text:'Una scoperta alla',x:0,y:0,width:286,height:43},{text:'volta',x:0,y:43,width:74,height:43}],singleLines=[{text:single,x:0,y:0,width:310,height:43}];
 measure(duo,duoLines);assert.equal(f.tree.props.style.minHeight,86);
 for(let i=0;i<65;i++){f.advance(32);for(const [j,row] of painted().entries()){assert.equal(row.props.numberOfLines,1);assert.equal(row.props.style[1].top,duoLines[j].y);assert.equal(row.props.style[1].width,duoLines[j].width+2)}}
 assert.equal(heights.at(-1),86);f.update({title:single,titleKey:'saved'});f.advance(100);assert.equal(f.timers,0);
 measure(single,singleLines);assert.equal(f.tree.props.style.minHeight,86);f.advance(2000);
 assert.equal(heights.at(-1),43);assert.equal(f.tree.props.style.minHeight,43);assert.equal(painted().length,1);assert.equal(painted()[0].props.children,single);assert.deepEqual(heights,[86,43]);
 f.update({title:duo,titleKey:'feed-again'});f.advance(2000);assert.equal(heights.at(-1),86);assert.equal(painted().length,2);
});

test('each tutorial dock rectangle expands in its own track, with centred labels and reversible geometry',()=>{
 const position={value:0},f=fixture('src/components/onboarding/TutorialDock.tsx',{position,index:0,width:270,reduced:false,onSelect(){}});
 const cells=()=>f.tree.props.children;
 for(const cell of cells()){
  const label=nodes(cell).find(n=>n.type==='Label'&&n.props.onTextLayout);
  label.props.onTextLayout({nativeEvent:{lines:[{width:label.props.children==='Categorie'?64:45}]}});
 }
 for(const p of [0,.1,.5,.9,1,1.5,2,1.5,1,0]){
  position.value=p;const widths=cells().map(cell=>cell.props.style[1].read().width);
  assert(Math.abs(widths.reduce((a,b)=>a+b,0)+6-(270-18))<.001);
  for(const [i,cell] of cells().entries()){
   const c=cell.props.style[1].read(),highlight=cell.props.children[0],weight=Math.max(0,1-Math.abs(p-i));
   assert.equal(highlight.props.style[1].read().opacity,weight);assert.equal(highlight.props.style[0].inset,0);assert.equal(cell.props.style[0].left,9+3*i);
   assert.equal(c.width,(246-246*2.3/4.3)/2+(246*2.3/4.3-(246-246*2.3/4.3)/2)*weight);
  }
 }
 assert.equal(cells().length,3); // No extra fixed-width sliding pill.
});

test('photo displays directly while only captions and removable controls animate',()=>{
 const b={photoUri:undefined,active:true,state:{draft:{}},busy:false,pickPhoto(){},reportPhotoUnavailable(){}},motion={reduced:false,visible:true,appActive:true};
 const f=fixture('src/components/onboarding/ProfilePhotoSlot.tsx',{binding:b,motion,size:140,compact:false});
 const images=()=>nodes(f.tree).filter(n=>n.type==='Image'&&n.props.source.uri);
 b.photoUri='file:new';b.state.draft.photoUri=b.photoUri;f.update({binding:b});
 assert.equal(images().length,1);assert.equal(images()[0].props.source.uri,'file:new');
 assert.equal(nodes(f.tree).filter(n=>n.type==='Label'&&n.props.children==='Modifica foto profilo').length,1);assert.equal(nodes(f.tree).filter(n=>n.type==='Label'&&n.props.children==='Aggiungi foto profilo').length,0);assert.equal(images()[0].props.style.width,140);assert.equal(images()[0].props.onLoad,undefined);
 assert.equal(nodes(f.tree).filter(n=>n.type==='AnimatedImage').length,0);
 assert.equal(f.shared.length,2);assert.equal(f.shared[0].animation.target,1);assert.equal(f.shared[1].animation.target,1);
 f.settle(f.shared[0].animation);f.settle(f.shared[1].animation);
 b.photoUri='file:replacement';b.state.draft.photoUri=b.photoUri;f.update({binding:b});assert.equal(images()[0].props.source.uri,'file:replacement');
 b.photoUri=undefined;b.state.draft.photoUri=undefined;f.update({binding:b});assert.equal(images().length,0);
 f.update({motion:{...motion,reduced:true}});assert.equal(f.shared[0].value,1);assert.equal(f.shared[1].value,0);
});