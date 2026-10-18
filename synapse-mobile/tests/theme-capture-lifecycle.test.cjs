const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
test('rapid theme intents share one capture and apply the latest selection after loading',async()=>{
 const source=fs.readFileSync('App.tsx','utf8'),start=source.indexOf('  const changeTheme=async('),end=source.indexOf('  const dismissSearch=',start);
 let resolve,captures=0;const settings=[],choices=[],images=[],released=[];
 const state={pendingThemeMode:{current:null},themeChoice:null,setThemeChoice:v=>choices.push(v),themeCapturing:{current:false},snapshotRef:{current:null},themeAlive:{current:true},themeRequest:{current:0},systemScheme:'light',isDark:false,reduced:false,Platform:{OS:'android'},AppState:{currentState:'active'},frame:{current:{}},isDarkTheme:mode=>mode==='dark',lib:{currentSettings:()=>({themeMode:'automatic'}),updateSettings:v=>settings.push(v)},setSnapshot:v=>images.push(v),releaseCapture:v=>released.push(v),captureRef:()=>{captures++;return new Promise(r=>resolve=r)},useEffect:()=>{}};
 vm.runInNewContext(ts.transpileModule(source.slice(start,end)+';globalThis.change=changeTheme;', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,state);
 const first=state.change('dark');state.change('light');state.change('dark');assert.equal(captures,1);assert.deepEqual(choices,['dark','light','dark']);assert.equal(settings.length,0);
 resolve('snapshot');await first;assert.equal(images.length,1);assert.equal(images[0].themeMode,'dark');assert.equal(state.themeCapturing.current,false);
 state.change('light');assert.equal(captures,1);assert.equal(settings.at(-1).themeMode,'light');
});
