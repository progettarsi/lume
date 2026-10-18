const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {TutorialDemo}=require('../.test-build/onboarding');

test('tutorial uses the real feed and reader, keeps demo saves local, and exits on its final swipe',()=>{
 const slots=[],effects=[],components={Reader:function(){},TutorialFeed:function(){}};let index=0,tree,dirty=false,commandedPage={index:0,revision:0};
 const slot=make=>{const i=index++;return slots[i]??(slots[i]=make())};
 const react={
  useRef:value=>slot(()=>({current:value})),
  useState:value=>{const s=slot(()=>({value}));return [s.value,next=>{s.value=typeof next==='function'?next(s.value):next;dirty=true}]},
  useLayoutEffect(fn,deps){const s=slot(()=>({deps:null}));if(!s.deps||deps.some((v,i)=>!Object.is(v,s.deps[i])))effects.push(fn);s.deps=deps},
 };
 const navigations=[],positions=[],progress=[],commands=[],jsx=(type,props)=>({type,props});
 const draft={name:'Privato',photoUri:'file:local/profile.jpg',interests:['science']},binding={draft,tutorialIndex:0,tutorialNavigationRevision:0,demo:new TutorialDemo(),busy:false,interactDemo(fn){this.demo.interact();fn(this.demo)},updateDraft(){throw Error('Profile must not be written')},navigate(action){navigations.push(action)},seekTutorial(index){positions.push(index);this.tutorialIndex=index}};
 const before=JSON.stringify(draft),motion={reduced:false,visible:true,appActive:true},module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync('src/components/onboarding/TutorialStage.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,Set,require(id){
  if(id==='../../theme')return require('./helpers/theme.cjs');if(id==='react')return react;if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};
  if(id==='react-native')return {Modal:'Modal',View:'View',StyleSheet:{create:x=>x,absoluteFill:{}},useWindowDimensions:()=>({width:384,height:832,fontScale:1})};
  if(id==='react-native-safe-area-context')return {useSafeAreaInsets:()=>({top:24,bottom:24})};if(id==='../../content/onboarding')return require('../.test-build/onboarding');
  return {...components,ThemeContext:{Provider:'ThemeProvider'},useTheme:()=>({palette:{accent:'#df9878',paper:require('./helpers/theme.cjs').dark.paper,surface:'#35302c'}})};
 }});
 const render=()=>{index=0;tree=module.exports.TutorialStage({binding:{...binding},motion:{...motion},commandedPage,onIndex:n=>progress.push(n)})};
 const flush=()=>{for(let i=0;i<20;i++){while(effects.length)effects.shift()();if(!dirty)break;dirty=false;render()}};
 const all=type=>{const found=[];function visit(node){if(Array.isArray(node)){node.forEach(visit);return}if(!node||typeof node!=='object'||node.type==='Modal'&&!node.props.visible)return;if(node.type===components[type])found.push(node);visit(node.props?.children)}visit(tree);return found};
 const getFeed=()=>all('TutorialFeed')[0].props,getReader=()=>all('Reader')[0].props,goTo=n=>{getFeed().onIndex(n);render();flush()};
 render();flush();getFeed().ref.current={goTo:n=>{commands.push(n);getFeed().onIndex(n)}};
 const first=getFeed().articles[0],third=getFeed().articles[2];assert.equal(getFeed().articles.length,3);assert.equal(first.complete,true);assert(first.paragraphs.length>1);assert(getFeed().articles.every(a=>a.source.startsWith('https://it.wikipedia.org/')));assert.deepEqual(Array.from(getFeed().cardInsets),[0,0,0]);assert.equal(getFeed().bottomInset,0);
 getFeed().onSave(first);render();assert.equal(getFeed().saved.has(first.id),true);getFeed().onSave(first);render();assert.equal(getFeed().saved.has(first.id),false);
 getFeed().onOpen(first,{measureInWindow:show=>show(40,280,304,300)},'home');render();assert.equal(getReader().article.id,first.id);assert.equal(getReader().origin.width,304);assert.equal(getFeed().blocked,true);assert.equal(getFeed().covered,first.id);assert.equal(getReader().returnPaper,require('./helpers/theme.cjs').surfaceTones(require('./helpers/theme.cjs').dark).snippet);assert.equal(getReader().reducedOverride,false);
 getReader().onSave();render();assert.equal(getFeed().saved.size,1);getReader().onClose();render();assert.equal(getReader().open,false);assert.equal(getFeed().blocked,true);assert.equal(getFeed().covered,first.id);getReader().onClosed();render();assert.equal(all('Reader').length,0);assert.equal(getFeed().blocked,false);
 getFeed().onEndReached();assert.deepEqual(navigations,[]);goTo(1);getFeed().onEndReached();assert.deepEqual(navigations,[]);goTo(2);assert.equal(progress.at(-1),2);assert.equal(positions.at(-1),2);
 getFeed().onSave(third,true);getFeed().onSave(third,true);render();assert.equal(getFeed().saved.has(third.id),true);getFeed().onSave(third);render();assert.equal(getFeed().saved.has(third.id),false);
 binding.busy=true;render();getFeed().onEndReached();assert.deepEqual(navigations,[]);binding.busy=false;motion.visible=false;render();getFeed().onEndReached();assert.deepEqual(navigations,[]);motion.visible=true;motion.appActive=false;render();getFeed().onEndReached();assert.deepEqual(navigations,[]);motion.appActive=true;render();getFeed().onEndReached();assert.deepEqual(navigations,['skip']);
 commandedPage={index:0,revision:1};render();flush();assert.equal(commands.at(-1),0);assert.equal(getFeed().initialIndex,0);const commandCount=commands.length;goTo(1);assert.equal(commands.length,commandCount);
 binding.tutorialIndex=2;binding.tutorialNavigationRevision++;render();flush();assert.equal(commands.at(-1),2);assert.equal(getFeed().initialIndex,2);
 assert.equal(JSON.stringify(binding.draft),before);assert.equal(binding.demo.saved,true);assert.equal(binding.demo.opened,false);
});
test('tutorial delegates paging and viewport resizing to the actual Home feed with its bottom fade',()=>{
 let cursor=0,tree,interactions=0;const slots=[],reports=[],handle={current:null},Feed=function(){},FeedBottomFade=function(){};
 const jsx=(type,props)=>({type,props}),react={forwardRef:fn=>fn,useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],value=>slots[i]=typeof value==='function'?value(slots[i]):value]},useRef:value=>{const i=cursor++;return slots[i]??(slots[i]={current:value})},useCallback:x=>x,useImperativeHandle:(ref,fn)=>ref.current=fn()};
 const module={exports:{}},code=ts.transpileModule(fs.readFileSync('src/components/onboarding/TutorialFeed.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,Math,require(id){if(id==='react')return {...react,default:react};if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};if(id==='react-native')return {View:'View',useWindowDimensions:()=>({width:384,height:832,fontScale:1})};if(id==='../Feed')return {Feed,FeedBottomFade};throw Error('Unexpected independent pager: '+id)}});
 const props={articles:['a','b','c','d'],saved:new Set(['a']),cardInsets:[0,68,0,0],bottomInset:0,initialIndex:2,blocked:false,readerOpen:false,motion:{visible:true,appActive:true,reduced:false},onOpen(){},onSave(){},onEndReached:()=>reports.push('end'),onInteract:()=>interactions++,onIndex:i=>reports.push(i)};
 const render=change=>{Object.assign(props,change);cursor=0;tree=module.exports.TutorialFeed(props,handle)};
 const content=()=>tree.props.children[0],feed=()=>content().props.children;
 render();assert.equal(feed(),false);const event={nativeEvent:{layout:{height:320}}};content().props.onLayout(event);event.nativeEvent=null;render();assert.equal(feed().type,Feed);assert.equal(feed().props.height,320);assert.equal(feed().props.position,2);assert.equal(feed().props.saved,props.saved);assert.equal(feed().props.onOpen,props.onOpen);assert.equal(feed().props.onSave,props.onSave);assert.equal(feed().props.onEndReached,props.onEndReached);assert.equal(tree.props.children[1].type,FeedBottomFade);assert.equal(tree.props.children[1].props.height,90);
 feed().props.onIndex(3);render();assert.deepEqual(reports,[3]);assert.equal(feed().props.position,3);assert.equal(interactions,1);
 handle.current.goTo(0);render();assert.equal(feed().props.position,0);assert.deepEqual(reports,[3,0]);
 content().props.onLayout({nativeEvent:{layout:{height:250}}});render({bottomInset:88});assert.equal(feed().props.height,250);assert.equal(feed().props.position,0);assert.equal(tree.props.children[1].props.height,178);
 render({blocked:true});assert.equal(tree.props.pointerEvents,'none');assert.equal(feed().props.onEndReached,undefined);render({blocked:false,motion:{visible:true,appActive:true,reduced:true}});assert.equal(feed().props.reducedOverride,true);render({motion:{visible:true,appActive:false,reduced:false}});assert.equal(tree.props.pointerEvents,'none');assert.equal(feed().props.reducedOverride,true);
});
