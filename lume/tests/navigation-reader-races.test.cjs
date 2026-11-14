const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function fixture(){
 const app=fs.readFileSync('App.tsx','utf8'),reader=app.slice(app.indexOf('const open:OpenArticle='),app.indexOf('const save=(a:Article'));
 const navigate=app.slice(app.indexOf('const navigate='),app.indexOf('const sourceRows='));
 let measure,opens=0,loads=0;const cues=[];
 const rows={finish(){},restore(){},hold(){},near(){}};
 const state={route:'home',collection:null,searchOpen:false,readerOpen:false,reader:null,navigationContext:{current:'home:null:false'},activeReader:{current:null},activeReaderOpen:{current:false},readerRequest:{current:null},randomRequest:{current:null},readerSession:{current:0},lastHomeTap:{current:0},collectionReturn:rows,searchReturn:rows,top:24,width:400,height:800,bottom:20,
  haptics:{emit:cue=>cues.push(cue)},frame:{current:{measureInWindow:fn=>fn(0,0)}},Keyboard:{dismiss(){}},AbortController,
  lib:{online:true,activate(){},read:async()=>{},settleCategories(){},beginAIOpen(){},abandonAIOpen(){}},
  setReader(value){state.reader=typeof value==='function'?value(state.reader):value;state.activeReader.current=state.reader;opens++},
  setReaderOpen(value){state.readerOpen=value},setRoute(value){state.route=value},setCollection(){},setSearchOpen(){},setRandomBusy(){},setAIStatus(){},setToast(){},setDockIconRevision(){},refreshHome(){},loadReader(){loads++}
 };
 vm.createContext(state);const code=ts.transpileModule(reader+navigate+';globalThis.actions={open,close,reopen,navigate};',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 // Event handlers retain the route of the render that created them; a React
 // state setter does not change that captured value before the next render.
 vm.runInContext("{const route='home',collection=null,searchOpen=false;"+code+'}',state);
 return {state,cues,actions:state.actions,article:{id:'one',paragraphs:['a']},node:{measureInWindow:fn=>{measure=fn}},measured(){measure(24,160,352,500)},get opens(){return opens},get loads(){return loads}};
}
test('a queued navbar tap cannot navigate after reader opening has started, before React commits disabled props',()=>{
 const f=fixture();f.actions.open(f.article,null,'home');assert(f.state.activeReaderOpen.current);f.actions.navigate('profile');assert.equal(f.state.route,'home');assert.equal(f.state.readerOpen,true);assert.equal(f.loads,1);
});
test('a queued article tap from Home cannot open above Profile after navigation',()=>{
 const f=fixture();f.actions.navigate('profile');f.actions.open(f.article,null,'home');assert.equal(f.state.route,'profile');assert.equal(f.opens,0);assert.equal(f.loads,0);
});
test('a late geometry callback is discarded after context changes, independently of request cancellation',()=>{
 const f=fixture();f.actions.open(f.article,f.node,'home');f.state.navigationContext.current='profile:null:false';assert(!f.state.readerRequest.current.signal.aborted);f.measured();assert.equal(f.opens,0);assert.equal(f.loads,0);assert.deepEqual(f.cues,[]);
});
test('closing reader remains reversible on its page but cannot reopen from an obsolete page',()=>{
 const f=fixture();f.actions.open(f.article,null,'home');f.actions.close();assert.equal(f.state.readerOpen,false);f.actions.reopen();assert.equal(f.state.readerOpen,true);
 f.actions.close();f.actions.navigate('profile');f.actions.reopen();assert.equal(f.state.readerOpen,false);assert.equal(f.state.route,'profile');
});
