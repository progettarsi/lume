const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
function fixture(){
 let current;const listeners=new Set(),events=[],app={currentState:'active',addEventListener(_,fn){listeners.add(fn);return {remove:()=>listeners.delete(fn)}}};
 const player={play:(...frames)=>events.push(frames),pause:()=>events.push('pause')};
 const slot=init=>{const i=current.index++;return current.slots[i]??(current.slots[i]=init())};
 const state=v=>{const s=slot(()=>({value:v}));return [s.value,next=>{const v=typeof next==='function'?next(s.value):next;if(v!==s.value){s.value=v;current.dirty=true}}]};
 const effect=(fn,deps)=>{const s=slot(()=>({}));if(!s.deps||deps.some((v,i)=>!Object.is(v,s.deps[i]))){s.deps=deps;current.pending.push(()=>{s.cleanup?.();s.cleanup=fn()})}};
 const react={useRef:v=>slot(()=>({current:v})),useState:state,useLayoutEffect:effect,useEffect:effect,useMemo:fn=>{current.index++;return fn()}};
 const jsx=(type,props,key)=>{if(type==='Lottie'&&props.ref)props.ref.current=player;return {type,props,key}};
 function load(file){const m={exports:{}};vm.runInNewContext(compile(fs.readFileSync(file,'utf8')),{module:m,exports:m.exports,require:id=>{
  if(id==='react')return react;if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};if(id==='react-native')return {AppState:app,View:'View'};
  if(id==='react-native-svg')return {__esModule:true,default:'Svg',G:'G',Path:'Path'};if(id==='lottie-react-native')return {__esModule:true,default:'Lottie'};
  if(id.endsWith('/animatedIconFrames'))return load('src/design-system/animatedIconFrames.ts');
  if(id.startsWith('../../assets/'))return JSON.parse(fs.readFileSync(id.replace('../../',''),'utf8'));throw Error(id);
 }});return m.exports}
 const ui=load('src/components/AnimatedIcon.tsx');
 function host(component,props){const h={index:0,slots:[],pending:[],props,tree:null,dirty:true};h.render=()=>{current=h;let n=0;do{h.dirty=false;h.index=0;h.tree=component(h.props);while(h.pending.length)h.pending.shift()();if(++n>10)throw Error('render loop')}while(h.dirty);return h.tree};h.dispose=()=>{current=h;h.slots.forEach(s=>s.cleanup?.())};return h}
 const icon=host(ui.AnimatedIcon,{name:'home',color:'#353629',revision:0,active:true,reduced:false});
 return {icon,ui,host,events,app,listeners,playback(){icon.render();const el=icon.tree.props.children[1];return el&&host(el.type,el.props)},background(){app.currentState='background';listeners.forEach(fn=>fn('background'))}};
}
const child=h=>h.tree.props.children[1];
test('idle icons mount no Lottie players; only revisions trigger and inactive/reduced events are discarded',()=>{
 const f=fixture(),h=f.icon;h.render();assert(!child(h));h.props.revision++;h.render();assert(child(h));
 h.props.active=false;h.render();assert(!child(h));h.props.active=true;h.render();assert(!child(h));
 h.props.reduced=true;h.props.revision++;h.render();assert(!child(h));h.props.reduced=false;h.render();assert(!child(h));
 h.props.revision++;h.render();const first=child(h).key;h.props.revision++;h.render();assert.notEqual(child(h).key,first);
});
test('bookmark copies reflect persisted state immediately, but only the pressed copy animates in the correct direction',()=>{
 const f=fixture(),h=f.icon;Object.assign(h.props,{name:'bookmark',filled:false});h.render();h.props.filled=true;h.render();assert(!child(h));
 h.props.filled=false;h.props.revision++;h.render();assert.equal(child(h).props.reverse,true);
 const reverse=f.playback();reverse.render();reverse.tree.props.onAnimationLoaded();reverse.render();assert.equal(reverse.tree.props.autoPlay,true);assert.equal(reverse.tree.props.speed,-1);assert.equal(f.events.length,0);
 reverse.tree.props.onAnimationFinish(false);h.render();assert(!child(h));
 h.props.filled=true;h.props.revision++;h.render();assert.equal(child(h).props.reverse,false);
 const forward=f.playback();forward.render();forward.tree.props.onAnimationLoaded();forward.render();assert.equal(forward.tree.props.autoPlay,true);assert.equal(forward.tree.props.speed,1);assert.equal(f.events.length,0);
});
test('Home starts declaratively after mounting and reverses once; background discards without native commands',()=>{
 const f=fixture(),h=f.icon;h.render();h.props.revision++;const p=f.playback();p.render();assert.equal(p.tree.props.autoPlay,false);assert.equal(p.tree.props.loop,false);
 const stale=p.tree.props.onAnimationLoaded;p.tree.props.onAnimationLoaded();p.render();assert.equal(p.tree.props.autoPlay,true);assert.equal(p.tree.props.speed,1);p.tree.props.onAnimationFinish(false);p.render();assert.equal(p.tree.props.autoPlay,false);assert.equal(p.tree.props.speed,-1);stale();p.render();assert.equal(p.tree.props.autoPlay,false);p.tree.props.onAnimationLoaded();p.render();assert.equal(p.tree.props.autoPlay,true);
 p.tree.props.onAnimationFinish(false);h.render();assert(!child(h));p.dispose();
 h.props.revision++;const next=f.playback();next.render();f.background();h.render();assert(!child(h));assert.equal(f.events.length,0);
 f.app.currentState='active';h.render();assert(!child(h));next.dispose();assert.equal(f.listeners.size,0);
});
test('official assets are local expression-free vectors; recoloring affects strokes and fills without mutating originals',()=>{
 for(const name of ['home','user','bookmark','shuffle']){
  const f=fixture(),h=f.icon;Object.assign(h.props,{name,filled:false});h.render();h.props.revision++;h.props.filled=name==='bookmark';const p=f.playback();p.render();const a=p.tree.props.source;
  assert.equal(a.w,32);assert.equal(a.assets.length,0);assert(a.layers.every(l=>l.ty===4));
  let paints=0;const visit=v=>{if(!v||typeof v!=='object')return;if(v.ty==='fl'||v.ty==='st'){paints++;assert.deepEqual(Array.from(v.c.k),[53/255,54/255,41/255,1])}Object.values(v).forEach(visit)};visit(a);assert(paints>0);
  const original=JSON.parse(fs.readFileSync('assets/useanimations/'+name+'.json','utf8'));assert.equal(a.op,original.op+1);
 }
});
test('pending playback is discarded before loading and stale completions cannot cancel a newer event',()=>{
 const f=fixture(),h=f.icon;h.props.name='user';h.render();h.props.revision++;const pending=f.playback();pending.render();
 h.props.revision++;h.render();const newKey=child(h).key;pending.tree.props.onAnimationFinish(false);pending.tree.props.onAnimationFinish(false);h.render();assert.equal(child(h).key,newKey);
 pending.dispose();pending.tree.props.onAnimationLoaded();assert.equal(f.events.length,0);
 const next=f.playback();next.render();next.tree.props.onAnimationFailure('decode failed');h.render();assert(!child(h));
});
test('all 22 categories resolve to distinct static Phosphor artwork across the shared renderer',()=>{
 const m={exports:{}};vm.runInNewContext(compile(fs.readFileSync('src/design-system/phosphorPaths.ts','utf8')),{module:m,exports:m.exports});
 const {CATEGORIES}=require('../.test-build/categories'),paths=m.exports.phosphorPaths;
 const categories=CATEGORIES.filter(c=>c.id!=='all');assert.equal(categories.length,22);
 for(const c of categories)assert(paths[c.icon]?.every(d=>d.startsWith('M')),c.id);
 assert.equal(new Set(categories.map(c=>JSON.stringify(paths[c.icon]))).size,22);
 for(const license of ['Phosphor','useAnimations'])assert.match(fs.readFileSync(`assets/licenses/${license}-MIT.txt`,'utf8'),/Permission is hereby granted/);
});
