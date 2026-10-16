const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;

test('navbar animates only the destination; Home refresh animates once per accepted double tap',()=>{
 const app=fs.readFileSync('App.tsx','utf8');
 const source=app.slice(app.indexOf('const navigate='),app.indexOf('const sourceRows='));
 const state={route:'home',readerOpen:false,collection:null,searchOpen:false,lastHomeTap:{current:0},revision:{home:0,profile:0},refreshes:0,time:1000};
 Object.assign(state,{Date:{now:()=>state.time},setDockIconRevision:fn=>state.revision=JSON.parse(JSON.stringify(fn(state.revision))),refreshHome:()=>state.refreshes++,lib:{settleCategories(){}},Keyboard:{dismiss(){}},randomRequest:{current:null},readerRequest:{current:null},setRandomBusy(){},setSearchOpen(){},setCollection(){},setRoute:next=>state.route=next});
 vm.createContext(state);vm.runInContext(compile(source+';globalThis.navigate=navigate;'),state);
 state.navigate('profile');assert.deepEqual(state.revision,{home:0,profile:1});
 state.navigate('profile');assert.deepEqual(state.revision,{home:0,profile:1});
 state.navigate('home');assert.deepEqual(state.revision,{home:1,profile:1});assert.equal(state.refreshes,0);
 state.time+=100;state.navigate('home');assert.equal(state.revision.home,1);
 state.time+=100;state.navigate('home');assert.equal(state.refreshes,1);assert.equal(state.revision.home,2);
 state.time+=100;state.navigate('home');assert.equal(state.refreshes,1);
 state.time+=100;state.navigate('home');assert.equal(state.refreshes,2);assert.equal(state.revision.home,3);
});

function glyphFixture(){
 let index=0,effects=[],slots=[],tree;const events=[];
 const player={play:()=>events.push('play'),reset:()=>events.push('reset')};
 const slot=fn=>{const i=index++;return slots[i]??(slots[i]=fn())};
 const react={useRef:value=>slot(()=>({current:value})),useMemo:fn=>{index++;return fn()},useLayoutEffect:fn=>{index++;effects.push(fn)}};
 const jsx=(type,props)=>{if(typeof type==='function')return type(props);if(type==='Lottie')props.ref.current=player;return {type,props}};
 const module={exports:{}};
 vm.runInNewContext(compile(fs.readFileSync('src/components/DockIcon.tsx','utf8')),{module,exports:module.exports,require:id=>{
  if(id==='react')return react;if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};if(id==='react-native')return {View:'View'};
  if(id==='lottie-react-native')return {__esModule:true,default:'Lottie'};
  if(id==='./Atoms')return {useTheme:()=>({palette:{ink:'#353629'}})};
  if(id.startsWith('../../assets/'))return require('../'+id.slice(6));throw Error(id);
 }});
 const props={name:'home',revision:0,active:true,reduced:false};
 return {props,events,render(){index=0;tree=module.exports.DockIcon(props);while(effects.length)effects.shift()();return tree.props.children},loaded(){tree.props.children.props.onAnimationLoaded()}};
}

test('icons remain static on mount, restart on an event and stop when inactive or reduced',()=>{
 const f=glyphFixture();const tree=f.render();assert.equal(tree.props.autoPlay,false);assert.equal(tree.props.loop,false);
 f.loaded();assert.deepEqual(f.events,[]);
 f.props.revision++;f.render();assert.deepEqual(f.events,['reset','play']);
 f.props.revision++;f.render();assert.deepEqual(f.events.slice(-2),['reset','play']);
 f.props.active=false;f.render();assert.equal(f.events.at(-1),'reset');
 const plays=f.events.filter(e=>e==='play').length;
 f.props.active=true;f.render();assert.equal(f.events.filter(e=>e==='play').length,plays);
 f.props.reduced=true;f.props.revision++;f.render();assert.equal(f.events.at(-1),'reset');
 f.props.reduced=false;f.render();assert.equal(f.events.filter(e=>e==='play').length,plays);
});

test('an event before loading plays once ready, but is discarded when leaving the page',()=>{
 const f=glyphFixture();f.render();f.props.revision++;f.render();assert.deepEqual(f.events,[]);f.loaded();assert.deepEqual(f.events,['reset','play']);
 const cancelled=glyphFixture();cancelled.render();cancelled.props.revision++;cancelled.render();cancelled.props.active=false;cancelled.render();cancelled.loaded();assert(!cancelled.events.includes('play'));
});

test('both official assets are bundled vectors, with theme-coloured fills and no remote dependencies',()=>{
 for(const name of ['home','profile']){
  const f=glyphFixture();f.props.name=name;const {source}=f.render().props;
  assert.equal(source.fr,60);assert.equal(source.op,60);assert.equal(source.w,240);assert.equal(source.h,240);
  let fills=0;const visit=value=>{if(!value||typeof value!=='object')return;if(value.ty==='fl'){fills++;assert.deepEqual(Array.from(value.c.k),[53/255,54/255,41/255,1])}assert(!('p' in value&&typeof value.p==='string'&&value.p.startsWith('http')));Object.values(value).forEach(visit)};visit(source);assert(fills>0);
 }
});
