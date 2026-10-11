const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {TutorialDemo}=require('../.test-build/onboarding');

test('tutorial uses product controls with isolated save, reader, category, profile and search actions',()=>{
 const slots=[];let index=0,tree;const components={};
 for(const name of ['FeedCard','CategoryRail','Dock','Reader','ArticleRow','ProfileMenuRow','SearchComposer','ShuffleButton','TutorialGestureSlot','Label','Button'])components[name]=function(){};
 const react={useRef(value){const i=index++;return slots[i]??(slots[i]={current:value})},useState(initial){const i=index++;if(!(i in slots))slots[i]=initial;return [slots[i],value=>slots[i]=value]}};
 const jsx=(type,props)=>({type,props}),binding={tutorialIndex:0,demo:new TutorialDemo(),interactDemo(fn){this.demo.interact();fn(this.demo)},updateDraft(){throw Error('Profile must not be written')},navigate(){throw Error('Demo must not navigate onboarding')}};
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync('src/components/onboarding/TutorialStage.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,Set,require(id){if(id==='react')return react;if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};if(id==='react-native')return {AccessibilityInfo:{announceForAccessibility(){}},Modal:'Modal',View:'View',StyleSheet:{create:x=>x,absoluteFill:{}},useWindowDimensions:()=>({width:384,height:832,fontScale:1})};if(id==='react-native-safe-area-context')return {useSafeAreaInsets:()=>({top:24,bottom:24})};if(id==='../../content/onboarding')return require('../.test-build/onboarding');if(id==='../../content/categories')return require('../.test-build/categories');if(id==='../../theme')return {heading:'Newsreader_500Medium'};return {...components,useTheme:()=>({palette:{accent:'#ac',paper:'#fa'}})}}});
 const render=()=>{index=0;tree=module.exports.TutorialStage({binding,motion:{reduced:false,visible:true,appActive:true}})};
 const all=(type)=>{const found=[];function visit(node){if(Array.isArray(node)){node.forEach(visit);return}if(!node||typeof node!=='object')return;if(node.type===components[type])found.push(node);visit(node.props?.children)}visit(tree);return found};
 render();assert.equal(all('FeedCard').length,2);const first=all('FeedCard')[0],second=all('FeedCard')[1];
 first.props.onSave(first.props.article);render();assert.equal(all('FeedCard')[0].props.saved,true);assert.equal(all('FeedCard')[1].props.saved,false);
 first.props.onOpen(first.props.article,null,'home');render();assert.equal(all('Reader')[0].props.article.id,first.props.article.id);all('Reader')[0].props.onClose();render();assert.equal(all('Reader')[0].props.open,false);all('Reader')[0].props.onClosed();render();assert.equal(all('Reader').length,0);
 binding.tutorialIndex=1;render();all('CategoryRail')[0].props.onSelect('arts');render();assert.equal(all('FeedCard')[0].props.article.id,second.props.article.id);
 binding.tutorialIndex=2;render();all('FeedCard')[0].props.onSave(second.props.article,true);render();all('FeedCard')[0].props.onSave(second.props.article,true);render();assert.equal(all('FeedCard')[0].props.saved,true);all('FeedCard')[0].props.onSave(second.props.article);render();assert.equal(all('FeedCard')[0].props.saved,false);
 binding.tutorialIndex=3;render();all('Dock')[0].props.onNavigate('profile');render();assert.deepEqual(all('ProfileMenuRow').map(n=>n.props.count),[1,1,undefined]);all('ProfileMenuRow')[0].props.onPress();render();assert.equal(all('ArticleRow').length,1);
 all('Dock')[0].props.onSearch();render();all('SearchComposer')[0].props.onChange('Origami');render();assert.equal(all('ArticleRow').length,1);assert.equal(all('ArticleRow')[0].props.article.id,second.props.article.id);all('SearchComposer')[0].props.onClose();render();assert.equal(binding.demo.destination,'home');assert.equal(all('FeedCard').length,1);
});

test('tutorial card layout retains its height after React Native releases the event',()=>{
 let queued;const jsx=(type,props)=>({type,props}),react={createContext:()=>({}),useState:()=>[218,fn=>queued=fn],useRef:x=>({current:x}),useContext:()=>undefined,useCallback:x=>x,useMemo:fn=>fn(),useEffect(){},Children:{toArray:x=>x}};
 const animated={createAnimatedComponent:x=>x,View:'AnimatedView'},builder=new Proxy({}, {get:()=>()=>builder}),module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync('src/components/OnboardingMotionSlots.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,Math,Array,require(id){if(id==='react')return {...react,default:react};if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};if(id==='react-native')return {View:'View'};if(id==='react-native-reanimated')return {__esModule:true,default:animated,Easing:{bezier:()=>()=>0},useSharedValue:value=>({value}),useAnimatedStyle:fn=>fn()};if(id==='react-native-gesture-handler')return {Gesture:{Pan:()=>builder},GestureDetector:'GestureDetector'};if(id==='../content/onboardingPresentation')return require('../.test-build/onboardingPresentation');return {}}});
 const tree=module.exports.TutorialGestureSlot({children:['first','second'],cardIndex:0,hintStopped:false,motion:{visible:true,appActive:true,reduced:false},onInteract(){},onSwipe(){}});
 const measured=tree.props.children.props.children.props.children[0];
 const event={nativeEvent:{layout:{height:300}}};measured.props.onLayout(event);event.nativeEvent=null;
 assert.equal(queued(218),300);assert.equal(queued(320),320);
});
