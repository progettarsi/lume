const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {initialOnboarding,preparationState}=require('../.test-build/onboarding');

function fixture({stage='interests',reduced=false,appActive=true,count=9}={}){
 const slots=[],effects=[],animations=[],shared=[],navigations=[];let cursor=0,tree,dirty=false;
 const jsx=(type,props)=>({type,props}),slot=make=>{const i=cursor++;return slots[i]??(slots[i]=make())};
 const effect=(fn,deps)=>{const s=slot(()=>({deps:null,cleanup:null}));if(!s.deps||deps.some((d,i)=>!Object.is(d,s.deps[i]))){effects.push(()=>{s.cleanup?.();s.cleanup=fn()});s.deps=deps}};
 const react={
  useRef:v=>slot(()=>({current:v})),useState:v=>{const s=slot(()=>({value:typeof v==='function'?v():v}));return [s.value,next=>{const value=typeof next==='function'?next(s.value):next;if(!Object.is(value,s.value)){s.value=value;dirty=true}}]},
  useEffect:effect,useLayoutEffect:effect,useCallback(fn,deps){const s=slot(()=>({fn,deps}));if(deps.some((d,i)=>!Object.is(d,s.deps[i]))){s.fn=fn;s.deps=deps}return s.fn},
 };
 const atom=value=>({current:value,animation:null,get value(){return this.current},set value(next){if(next?.animation){this.animation={...next,owner:this};animations.push(this.animation)}else{this.current=next;this.animation=null}}});
 const reanimated={__esModule:true,default:{View:'AnimatedView',createAnimatedComponent:()=> 'AnimatedPath'},
  useSharedValue:value=>{const s=slot(()=>atom(value));if(!shared.includes(s))shared.push(s);return s},
  useAnimatedStyle:fn=>{slot(()=>({}));return {read:fn}},useAnimatedProps:fn=>{slot(()=>({}));return {read:fn}},
  cancelAnimation(s){if(s.animation)s.animation.cancelled=true;s.animation=null},
  withTiming:(target,config,done)=>({animation:true,target,config,done}),withDelay:(delay,animation)=>({...animation,delay}),runOnJS:fn=>fn,Easing:{bezier:()=> 'ease'},
  interpolate(n,stops,values){let i=0;while(i<stops.length-2&&n>stops[i+1])i++;const t=Math.max(0,Math.min(1,(n-stops[i])/(stops[i+1]-stops[i])));return values[i]+(values[i+1]-values[i])*t},interpolateColor:(n,range,colors)=>n<.5?colors[0]:colors[1],
 };
 const module={exports:{}},code=ts.transpileModule(fs.readFileSync('src/components/onboarding/ApprovedOnboardingScene.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,Math,require(id){
  if(id==='react')return react;if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};if(id==='react-native-reanimated')return reanimated;
  if(id==='react-native')return {View:'View',ScrollView:'ScrollView',Pressable:'Pressable',Keyboard:{dismiss(){}},Platform:{OS:'android'},StyleSheet:{create:x=>x,absoluteFill:{},hairlineWidth:1},useWindowDimensions:()=>({width:393,height:852,fontScale:1})};
  if(id==='react-native-safe-area-context')return {useSafeAreaInsets:()=>({top:24,bottom:24})};if(id==='react-native-svg')return {__esModule:true,default:'Svg',Path:'Path',SvgXml:'SvgXml'};
  if(id==='../../useKeyboardLift')return {useKeyboardLift:()=>({value:0})};if(id==='../../content/onboarding')return require('../.test-build/onboarding');
  if(id==='../../content/onboardingBrand')return {onboardingBrand:()=>({bulb:'<svg/>',rays:'<svg/>'})};
  if(id==='../Atoms')return {useTheme:()=>({palette:{paper:'#1d1b19',ink:'#efe9df',muted:'#b6aea2',active:'#804e3b',accent:'#df9878',surface:'#35302c',line:'#474139'}}),Label:'Label',Button:'Button',Icon:'Icon'};
  if(id==='../OnboardingMotionSlots')return {OnboardingTitleContext:{Provider:'TitleProvider'},OnboardingTitleSlot:'Title',OrganicShapeSlot:'Shape'};
  const name=id.split('/').at(-1);return {[name]:name};
 }});
 const state=initialOnboarding({preferenceKeys:[],visits:0,saved:0,read:0});state.stage=stage;state.draft={name:'Alex',photoUri:'file:local/photo.jpg',interests:['science','arts']};
 const binding={state,draft:state.draft,active:true,stage,tutorialIndex:2,reduced,appActive,busy:false,preparation:preparationState(count,true,false,{phase:'ready'}),navigate:action=>navigations.push(action),presentPreparation(){},seekTutorial(){},retryFeed(){}};
 const render=()=>{cursor=0;tree=module.exports.ApprovedOnboardingScene({binding:{...binding}});return tree};
 const flush=()=>{for(let i=0;i<30;i++){while(effects.length)effects.shift()();if(!dirty)break;dirty=false;render()}};
 const settle=animation=>{assert(animation&&!animation.cancelled);animation.owner.value=animation.target;animation.done?.(true);render();flush()};
 const change=patch=>{Object.assign(binding,patch);render();flush()};
 render();flush();return {binding,render,flush,change,settle,animations,shared,navigations,get tree(){return tree}};
}
function nodes(root){if(!root||typeof root!=='object')return [];if(Array.isArray(root))return root.flatMap(nodes);return [root,...nodes(root.props?.children)]}
const find=(f,testID)=>nodes(f.tree).find(n=>n.props?.testID===testID),ofType=(f,type)=>nodes(f.tree).filter(n=>n.type===type);
const latest=(f,owner)=>f.animations.filter(a=>a.owner===owner&&!a.cancelled).at(-1);

test('one persistent action and snippet survive forward and interrupted reverse choreography without changing the draft',()=>{
 const f=fixture(),draft=JSON.stringify(f.binding.draft),scene=f.shared[0];
 const persistent=()=>{assert.equal(nodes(f.tree).filter(n=>n.props?.testID==='onboarding-persistent-action').length,1);assert.equal(nodes(f.tree).filter(n=>n.props?.testID==='tutorial-snippet').length,1)};
 persistent();f.change({stage:'tutorial'});const forward=latest(f,scene);assert.equal(forward.target,3);assert.equal(ofType(f,'TutorialStage').length,1);
 scene.current=2.45;f.render();const halfway=find(f,'onboarding-persistent-action').props.style[1].read();assert.equal(halfway.top+halfway.height/2,852-79);
 f.change({stage:'interests'});assert(forward.cancelled);assert.equal(scene.value,2.45);const reverse=latest(f,scene);assert.equal(reverse.target,2);f.settle(reverse);persistent();
 assert.equal(scene.value,2);assert.equal(find(f,'tutorial-snippet').props.pointerEvents,'none');assert.equal(ofType(f,'TutorialStage').length,1);assert.equal(JSON.stringify(f.binding.draft),draft);
 f.change({stage:'tutorial'});f.settle(latest(f,scene));persistent();const back=ofType(f,'Button').find(n=>n.props.label==='Torna alla personalizzazione');back.props.onPress();assert.deepEqual(f.navigations,['back']);assert.equal(JSON.stringify(f.binding.draft),draft);
});

test('ready preparation waits for its incoming scene before freezing, then enters only when the zoom finishes',()=>{
 const f=fixture({stage:'tutorial',count:10}),scene=f.shared[0],zoom=f.shared[1];f.change({stage:'preparation'});
 assert.equal(ofType(f,'TutorialStage').length,1);assert.equal(find(f,'tutorial-snippet').props.pointerEvents,'none');assert.equal(find(f,'onboarding-persistent-action').props.pointerEvents,'none');assert.equal(ofType(f,'Pressable').length,0);
 assert.equal(ofType(f,'MaterialLoadingIndicator')[0].props.frozen,false);assert.deepEqual(f.navigations,[]);
 f.settle(latest(f,scene));const loader=ofType(f,'MaterialLoadingIndicator')[0];assert.equal(loader.props.frozen,true);loader.props.onFreeze({path:'M 50 0 L 100 50 L 50 100 L 0 50 Z',rotation:137});f.render();f.flush();
 assert.deepEqual(f.navigations,[]);const expansion=latest(f,zoom);assert.equal(expansion.target,1);assert.equal(ofType(f,'AnimatedPath')[0].props.transform,'rotate(137 50 50)');f.settle(expansion);assert.deepEqual(f.navigations,['enter']);
 f.change({preparation:preparationState(12,true,false,{phase:'ready'})});assert.deepEqual(f.navigations,['enter']);
});

test('nine previews keep the loader running; the tenth requests a freeze without completing persistence',()=>{
 const f=fixture({stage:'preparation'});assert.equal(ofType(f,'MaterialLoadingIndicator')[0].props.frozen,false);assert.deepEqual(f.navigations,[]);
 f.change({preparation:preparationState(10,true,false,{phase:'ready'})});assert.equal(ofType(f,'MaterialLoadingIndicator')[0].props.frozen,true);assert.deepEqual(f.navigations,[]);
});

test('interrupted zoom keeps the exact frozen shape and resumes from its current progress',()=>{
 const f=fixture({stage:'preparation',count:10}),zoom=f.shared[1];ofType(f,'MaterialLoadingIndicator')[0].props.onFreeze({path:'M 50 0 L 100 100 Z',rotation:42});f.render();f.flush();const first=latest(f,zoom);zoom.current=.4;
 f.change({appActive:false});assert(first.cancelled);assert.equal(zoom.value,.4);assert.deepEqual(f.navigations,[]);
 f.change({appActive:true});const resumed=latest(f,zoom);assert.notEqual(resumed,first);assert.equal(zoom.value,.4);assert.equal(ofType(f,'AnimatedPath')[0].props.transform,'rotate(42 50 50)');f.settle(resumed);assert.deepEqual(f.navigations,['enter']);
});

test('reduced motion settles the scene and completes only after a ready shape is handed over',()=>{
 const f=fixture({stage:'tutorial',count:10,reduced:true});f.change({stage:'preparation'});assert.equal(f.shared[0].value,4);assert.deepEqual(f.navigations,[]);
 const loader=ofType(f,'MaterialLoadingIndicator')[0];assert.equal(loader.props.frozen,true);loader.props.onFreeze({path:'M 0 0 L 100 100 Z',rotation:0});f.render();f.flush();assert.equal(f.shared[1].value,1);assert.deepEqual(f.navigations,['enter']);
});

test('offline readiness remains an explicit choice before the same visual handoff',()=>{
 const f=fixture({stage:'preparation',count:0});f.change({preparation:preparationState(0,false,false,{phase:'idle'})});assert.equal(ofType(f,'MaterialLoadingIndicator')[0].props.frozen,false);assert.deepEqual(f.navigations,[]);
 ofType(f,'Button').find(n=>n.props.label==='Continua con gli articoli disponibili').props.onPress();f.render();f.flush();assert.equal(ofType(f,'MaterialLoadingIndicator')[0].props.frozen,true);assert.deepEqual(f.navigations,[]);
});

test('failed durable entry restores readable preparation with a manual retry and no completion loop',()=>{
 const f=fixture({stage:'preparation',count:10}),zoom=f.shared[1];ofType(f,'MaterialLoadingIndicator')[0].props.onFreeze({path:'M 0 0 L 100 100 Z',rotation:14});f.render();f.flush();f.settle(latest(f,zoom));assert.deepEqual(f.navigations,['enter']);
 f.change({error:'Non riesco a salvare sul telefono. Riprova.'});assert.equal(zoom.value,0);assert.equal(find(f,'approved-onboarding').props.style[2].read().opacity,1);assert.equal(ofType(f,'AnimatedPath')[0].props.transform,'rotate(14 50 50)');
 f.render();f.flush();assert.deepEqual(f.navigations,['enter']);const retry=ofType(f,'Button').find(n=>n.props.label==='Riprova ingresso nella Home');assert(retry&&!retry.props.disabled);retry.props.onPress();assert.deepEqual(f.navigations,['enter','enter']);
});
