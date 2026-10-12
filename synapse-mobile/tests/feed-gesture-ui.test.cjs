const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function mount(extra={}){
 let slots=[],cursor=0,effects=[],handlers={},reports=[],directions=[],tree,props={articles:Array.from({length:10},(_,i)=>({id:String(i)})),height:800,position:0,onIndex:i=>reports.push(i),onDirection:d=>directions.push(d),saved:new Set(),...extra};
 const slot=fn=>{const i=cursor++;return slots[i]??(slots[i]=fn())};
 const react={memo:f=>f,useRef:v=>slot(()=>({current:v})),useState:v=>{const s=slot(()=>({value:v}));return [s.value,v=>s.value=v]},useMemo:f=>{cursor++;return f()},useCallback:f=>{cursor++;return f},useEffect:()=>{cursor++},useLayoutEffect:(fn,deps)=>{const s=slot(()=>({deps:null}));if(!s.deps||deps.some((v,i)=>v!==s.deps[i]))effects.push(fn);s.deps=deps}};
 const gesture=()=>new Proxy({}, {get:(_,key)=>(...args)=>{if(key.startsWith('on'))handlers[key]=args[0];return chain}});let chain=gesture();
 const shared=[];const reanimated={default:{View:'Animated.View'},useSharedValue:v=>{const s=slot(()=>({value:v}));if(!shared.includes(s))shared.push(s);return s},useAnimatedStyle:()=>{cursor++;return {}},useAnimatedReaction:()=>{cursor++},withSpring:v=>v,withTiming:v=>v,cancelAnimation:()=>{},runOnJS:f=>f};
 const module={exports:{}},jsx=(type,props,key)=>({type,props,key});
 const source=ts.transpileModule(fs.readFileSync('src/components/Feed.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInNewContext(source,{module,exports:module.exports,require:name=>name==='react'?react:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='react-native'?{View:'View',StyleSheet:{create:x=>x}}:name==='react-native-reanimated'?{...reanimated,__esModule:true}:name==='react-native-gesture-handler'?{Gesture:{Pan:()=>{chain=gesture();return chain}},GestureDetector:'GestureDetector'}:name.includes('useMotionPreference')?{useMotionPreference:()=>false}:name.endsWith('/paging')?require('../.test-build/paging'):name.endsWith('/Atoms')?{useTheme:()=>({palette:{paper:'#f7f4ee'}})}:name.endsWith('/categories')?{CATEGORIES:[]}:{} });
 const render=()=>{cursor=0;tree=module.exports.Feed(props);while(effects.length)effects.shift()()};render();
 return {get tree(){return tree},shared:shared.slice(2),reports,directions,render,update(position){props.position=position;render()},start(){handlers.onStart()},move(y){handlers.onUpdate({translationY:y})},end(y,v){handlers.onEnd({translationY:y,velocityY:v})}};
}
test('interrupted spring anchors to the visible page and preserves its finger position',()=>{
 const f=mount();f.start();f.move(-200);f.end(-200,-900);assert.deepEqual(f.reports,[1]);
 f.shared[0].value=280; // Offset part way through the native spring towards page 1.
 f.start();f.move(30);assert.equal(f.shared[0].value,250);
 f.end(30,700);assert.deepEqual(f.reports,[1,0]);assert.equal(f.shared[0].value,0);
});
test('acknowledgement from JS does not reset a gesture already in progress',()=>{
 const f=mount();f.start();f.move(-200);f.end(-200,-900);f.start();f.move(-75);
 const current=f.shared[0].value;f.update(1);assert.equal(f.shared[0].value,current);
 f.update(0);assert.equal(f.shared[1].value,0); // External trim/refresh correction still applies.
});
test('direction follows finger reversal before crossing the gesture origin',()=>{
 const f=mount();f.start();f.move(-140);f.move(-100);assert.deepEqual(f.directions,[true,false]);
 f.end(-100,800);assert.equal(f.reports.at(-1),0);
});

test('tutorial cards occupy complete Home pages even with category space and repeated demo articles',()=>{
 const f=mount({articles:[{id:'aurora'},{id:'aurora'},{id:'light'},{id:'balloon'}],height:500,cardInsets:[0,68,0,0],reducedOverride:true});
 const pages=()=>f.tree.props.children.props.children[0].props.children[0];
 assert.equal(pages().length,4);assert.equal(new Set(pages().map(page=>page.key)).size,4);
 pages().forEach((page,i)=>{assert.equal(page.props.style.top,i*500);assert.equal(page.props.style.height,500);assert.equal(page.props.children.props.height+page.props.style.paddingTop,500);assert.equal(page.props.children.props.reduced,true)});
 assert.equal(pages()[1].props.style.paddingTop,68);assert.equal(pages()[1].props.pointerEvents,'none');assert.equal(pages()[1].props.importantForAccessibility,'no-hide-descendants');
 f.start();f.move(-200);f.end(-200,-900);f.render();assert.equal(f.shared[0].value,500);assert.deepEqual(f.reports,[1]);assert.equal(pages()[1].props.pointerEvents,'auto');assert.equal(pages()[0].props.pointerEvents,'none');
});


test('only another upward swipe on the last settled tutorial card requests the final phase',()=>{
 let ends=0;const f=mount({articles:[{id:'a'},{id:'b'},{id:'c'},{id:'d'}],height:420,position:2,onEndReached:()=>ends++});
 f.start();f.move(-120);f.end(-120,-900);assert.equal(ends,0);assert.equal(f.reports.at(-1),3);
 f.start();f.move(-100);f.move(10);f.end(10,600);assert.equal(ends,0);
 f.update(3);f.start();f.move(-120);f.end(-120,-900);assert.equal(ends,1);
});
