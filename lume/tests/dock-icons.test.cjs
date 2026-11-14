const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;

test('navbar animates only the destination; Home refresh animates once per accepted double tap',()=>{
 const app=fs.readFileSync('App.tsx','utf8');
 const source=app.slice(app.indexOf('const navigate='),app.indexOf('const sourceRows='));
 const cues=[],state={haptics:{emit:cue=>cues.push(cue)},route:'home',readerOpen:false,activeReaderOpen:{current:false},navigationContext:{current:'home:null:false'},collection:null,searchOpen:false,lastHomeTap:{current:0},revision:{home:0,profile:0},refreshes:0,time:1000};
 Object.assign(state,{Date:{now:()=>state.time},setDockIconRevision:fn=>state.revision=JSON.parse(JSON.stringify(fn(state.revision))),refreshHome:()=>state.refreshes++,lib:{settleCategories(){}},Keyboard:{dismiss(){}},randomRequest:{current:null},readerRequest:{current:null},setRandomBusy(){},setSearchOpen(){},setCollection(){},setRoute:next=>state.route=next});
 vm.createContext(state);vm.runInContext(compile(source+';globalThis.navigate=navigate;'),state);
 state.navigate('profile');assert.deepEqual(state.revision,{home:0,profile:1});
 state.navigate('profile');assert.deepEqual(state.revision,{home:0,profile:1});
 state.navigate('home');assert.deepEqual(state.revision,{home:1,profile:1});assert.equal(state.refreshes,0);
 state.time+=100;state.navigate('home');assert.equal(state.revision.home,1);
 state.time+=100;state.navigate('home');assert.equal(state.refreshes,1);assert.equal(state.revision.home,2);
 state.time+=100;state.navigate('home');assert.equal(state.refreshes,1);
 state.time+=100;state.navigate('home');assert.equal(state.refreshes,2);assert.equal(state.revision.home,3);
 assert.deepEqual(cues,['selection','selection']);
});
