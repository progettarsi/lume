const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function reader(embedded,kind='home'){
 let time=0,saves=0;const values=[],jsx=(type,props)=>({type,props}),shared=value=>{const v={value};values.push(v);return v};
 const code=ts.transpileModule(fs.readFileSync('src/components/Reader.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};
 const react={useEffect(){},useLayoutEffect(){},useRef:current=>({current}),useState:value=>[value,()=>{}],useMemo:fn=>fn()};
 vm.runInNewContext(code,{module,exports:module.exports,Math,JSON,Date:{now:()=>time},require(id){
  if(id==='react')return react;if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};
  if(id==='react-native')return {View:'View',StyleSheet:{create:x=>x,absoluteFill:{}},AccessibilityInfo:{}};
  if(id==='react-native-reanimated')return {__esModule:true,default:{View:'AnimatedView',ScrollView:'AnimatedScrollView'},useSharedValue:shared,useDerivedValue:fn=>({get value(){return fn()}}),interpolateColor:(p,range,colors)=>p===0?colors[0]:colors[1],useAnimatedStyle:fn=>({read:fn}),useReducedMotion:()=>false,useAnimatedReaction(){},useAnimatedRef:()=>null,useAnimatedScrollHandler:fn=>fn};
  if(id==='../content/text')return require('../.test-build/text');if(id==='../content/categories')return require('../.test-build/categories');if(id==='../content/readerReturn')return require('../.test-build/readerReturn');
  if(id==='../theme')return {heading:'Newsreader',spring:{}};return {useTheme:()=>({palette:{paper:'#eee',active:'#aaa'}})};
 }});
 const tree=module.exports.Reader({article:{id:'demo',title:'Aurora',preview:['Testo breve'],paragraphs:['Testo breve','Dettagli'],complete:true},origin:{x:40,y:260,width:300,height:250,kind},open:true,width:384,height:832,top:24,bottom:24,size:20,saved:false,onClose(){},onReopen(){},onClosed(){},onSave(){},returnPaper:embedded?'#26211f':undefined,onDoubleTapSave:()=>saves++});
 const touch=find(tree,n=>!!n.props?.onTouchStart);
 return {tree,progress:values[0],time:t=>time=t,saves:()=>saves,tap(x=10,y=10){touch.props.onTouchStart({nativeEvent:{pageX:x,pageY:y}});touch.props.onTouchEnd()},drag(){touch.props.onTouchStart({nativeEvent:{pageX:10,pageY:10}});touch.props.onTouchMove({nativeEvent:{pageX:10,pageY:50}});touch.props.onTouchEnd()}};
}
function find(node,predicate){if(!node)return;if(Array.isArray(node)){for(const child of node){const hit=find(child,predicate);if(hit)return hit}return}if(predicate(node))return node;return find(node.props?.children,predicate)}
test('embedded reader contracts to the measured source without fading the whole reader',()=>{
 const demo=reader(true),normal=reader(false);
 for(const p of [1,.75,.3,0,.4,1]){demo.progress.value=p;const surface=demo.tree.props.children[0].props.style[1].read();assert.equal(surface.width,300+84*p);assert.equal(surface.height,250+582*p);assert.equal(surface.left,40*(1-p));assert.equal(surface.top,260*(1-p));assert.equal(surface.opacity,1)}
 demo.progress.value=0;const surface=demo.tree.props.children[0],content=surface.props.children[0].props.style.read();assert.equal(content.opacity,0);assert.equal(content.transform[0].translateX,-24);
 const source=find(surface,n=>n.props?.style?.[0]?.width===300&&n.props?.style?.[0]?.height===250);assert.ok(source);assert.equal(source.props.style[1].read().opacity,1);assert.equal(source.props.style[0].width,300);
 demo.progress.value=1;assert.equal(source.props.style[1].read().opacity,0);assert.equal(surface.props.children[0].props.style.read().opacity,1);
 normal.progress.value=0;assert.equal(normal.tree.props.children[0].props.style[1].read().width,300);
});

test('reader double tap saves once, while distant taps and scroll gestures never save',()=>{
 const demo=reader(true);demo.time(1000);demo.tap();demo.time(1200);demo.tap();assert.equal(demo.saves(),1);
 demo.time(1300);demo.tap();assert.equal(demo.saves(),1);demo.time(1700);demo.tap();assert.equal(demo.saves(),1);
 demo.time(1800);demo.tap(100,100);assert.equal(demo.saves(),1);demo.drag();demo.time(1900);demo.tap(100,100);assert.equal(demo.saves(),1);
 demo.time(2000);demo.tap(100,100);assert.equal(demo.saves(),2);
});

test('tutorial row returns its title while withdrawing the preview before it hits the shrinking bounds',()=>{
 const demo=reader(true,'row'),normal=reader(false,'row');
 const preview=tree=>find(tree,n=>n.type==='AnimatedView'&&Array.isArray(n.props?.children)&&n.props.children[0]?.props?.children==='Testo breve');
 const body=preview(demo.tree);assert.ok(body.props.style);
 demo.progress.value=.3;assert.equal(body.props.style.read().opacity,0);
 demo.progress.value=1;assert.equal(body.props.style.read().opacity,1);
 assert.equal(preview(normal.tree).props.style,undefined);
});
