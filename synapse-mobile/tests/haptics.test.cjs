const {test}=require('node:test'),assert=require('node:assert/strict');
const {HapticFeedback}=require('../.test-build/hapticFeedback');
const {BookmarkWriter}=require('../.test-build/bookmark');
const {parseSettings}=require('../.test-build/settings');
function setup(play){let time=0,active=true;const cues=[];const feedback=new HapticFeedback(play|| (async cue=>{cues.push(cue)}),()=>active,()=>time);feedback.configure(true);return {feedback,cues,advance:ms=>time+=ms,active:value=>active=value}}

test('haptics preference migrates safely, validates types and preserves opt-out',()=>{
 assert.equal(parseSettings(null).hapticsEnabled,true);
 assert.equal(parseSettings('{"hapticsEnabled":"false"}').hapticsEnabled,true);
 const settings=parseSettings('{"hapticsEnabled":false}');
 assert.equal(parseSettings(JSON.stringify(settings)).hapticsEnabled,false);
});
test('feedback is silent while disabled/inactive and never queues rapid pulses',()=>{
 const s=setup();s.feedback.emit('threshold');s.feedback.emit('confirm');
 s.advance(250);s.feedback.emit('confirm');s.advance(250);s.active(false);s.feedback.emit('remove');
 s.active(true);s.feedback.configure(false);s.feedback.emit('confirm');
 assert.deepEqual(s.cues,['threshold','confirm']);
});
test('reveal ticks are rate limited, yield to deliberate taps and stop on opt-out',()=>{
 const s=setup();s.feedback.emit('tap');s.advance(119);s.feedback.emit('reveal');assert.deepEqual(s.cues,['tap']);
 s.advance(1);s.feedback.emit('reveal');s.advance(69);s.feedback.emit('reveal');s.advance(1);s.feedback.emit('reveal');
 s.feedback.emit('selection');s.advance(300);s.feedback.configure(false);s.feedback.emit('reveal');
 assert.deepEqual(s.cues,['tap','reveal','reveal','selection']);
});
test('completion ignores superseded, repeated and stale operations',()=>{
 const s=setup(),old=s.feedback.begin('article'),latest=s.feedback.begin('article');
 old('confirm');latest('remove');s.advance(300);latest('remove');
 const stale=s.feedback.begin('other');s.advance(1501);stale('confirm');
 assert.deepEqual(s.cues,['remove']);
});
test('preference/background changes invalidate pending completion even after re-enabling',()=>{
 const s=setup(),done=s.feedback.begin('article');s.feedback.configure(false);s.feedback.configure(true);done('confirm');
 s.feedback.configure(false);const disabled=s.feedback.begin('other');s.feedback.configure(true);disabled('confirm');
 assert.deepEqual(s.cues,[]);
});
test('missing or failing native APIs never escape into the interaction',async()=>{
 for(const play of [()=>{throw Error('unavailable')},async()=>{throw Error('unsupported')}]){
  const s=setup(play);assert.doesNotThrow(()=>s.feedback.emit('confirm'));await Promise.resolve();
 }
});
test('bookmark success waits for storage and failure stays silent with rollback',async()=>{
 const s=setup(),writer=new BookmarkWriter();let release,applied=false;
 const done=s.feedback.begin('article');
 const pending=writer.set('article',true,false,()=>new Promise(resolve=>{release=resolve}),value=>applied=value).then(()=>done('confirm'));
 await new Promise(resolve=>setImmediate(resolve));assert.equal(applied,true);assert.deepEqual(s.cues,[]);
 release();await pending;assert.deepEqual(s.cues,['confirm']);
 s.advance(300);const failed=s.feedback.begin('article');
 await writer.set('article',false,true,async()=>{throw Error('disk')},value=>applied=value).then(()=>failed('remove')).catch(()=>failed());
 assert.equal(applied,true);assert.deepEqual(s.cues,['confirm']);
});

test('Android adapter uses system effects, compatible older constants and no waveform fallback',async()=>{
 const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
 for(const version of [24,29,30,36]){
  const calls=[],platform={OS:'android',Version:version},module={exports:{}};
  const source=ts.transpileModule(fs.readFileSync('src/haptics.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(source,{module,exports:module.exports,require:id=>{
   if(id==='react-native')return {Platform:platform,AppState:{currentState:'active'}};
   if(id==='expo-haptics')return {AndroidHaptics:{Confirm:'confirm',Context_Click:'context-click',Clock_Tick:'clock-tick',Segment_Tick:'selection',Segment_Frequent_Tick:'micro',Toggle_On:'on',Toggle_Off:'off',Gesture_Start:'refresh'},performAndroidHapticsAsync:async cue=>calls.push(cue)};
   if(id==='./content/hapticFeedback')return {HapticFeedback:class{constructor(play,active){this.play=play;this.active=active}}};
   throw Error(id);
  }});
  const adapter=module.exports.haptics;
  await adapter.play('confirm');await adapter.play('remove');await adapter.play('threshold');
  assert.deepEqual(calls,[version>=30?'confirm':'context-click','context-click','clock-tick']);
  await adapter.play('reveal');await adapter.play('on');await adapter.play('off');await adapter.play('selection');await adapter.play('refresh');
  assert.deepEqual(calls.slice(3),version>=34?['micro','on','off','selection','refresh']:['context-click','context-click','context-click',version>=30?'refresh':'context-click']);
  const count=calls.length;platform.OS='web';assert.equal(adapter.active(),false);await adapter.play('confirm');assert.equal(calls.length,count);
 }
});

test('saved swipe signals the actual 42 percent threshold once per gesture, including reversals',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
 const cues=[],handlers={},gesture={};let confirmations=0;
 for(const name of ['maxPointers','activeOffsetX','failOffsetY','enabled'])gesture[name]=()=>gesture;
 for(const name of ['onBegin','onUpdate','onEnd','onFinalize'])gesture[name]=fn=>{handlers[name]=fn;return gesture};
 const jsx=(type,props)=>({type,props}),module={exports:{}};
 const source=ts.transpileModule(fs.readFileSync('src/components/SavedSwipe.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInNewContext(source,{module,exports:module.exports,require:id=>{
  if(id==='react')return {useEffect:()=>{}};
  if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};
  if(id==='react-native')return {AppState:{}};
  if(id==='react-native-gesture-handler')return {Gesture:{Pan:()=>gesture},GestureDetector:'GestureDetector'};
  if(id==='react-native-reanimated')return {__esModule:true,default:{View:'View'},useSharedValue:value=>({value}),useAnimatedStyle:()=>({}),useAnimatedReaction:()=>{},runOnJS:fn=>fn,cancelAnimation:()=>{},withSpring:value=>value,withTiming:value=>value,Easing:{out:x=>x,cubic:()=>{}}};
  if(id==='../haptics')return {haptics:{emit:cue=>cues.push(cue)}};
  if(id==='./Atoms')return {useTheme:()=>({palette:{}}),Icon:'Icon',Label:'Label'};
  if(id==='../theme')return {spring:{}};
  if(id==='../content/bookmark')return require('../.test-build/bookmark');
  throw Error(id);
 }});
 const tree=module.exports.SavedSwipe({children:()=>null,onConfirm:()=>confirmations++,onExited:()=>{},removing:false,reduced:true});
 tree.props.onLayout({nativeEvent:{layout:{width:360}}});
 handlers.onBegin();for(const translationX of [-100,-151])handlers.onUpdate({translationX});assert.deepEqual(cues,[]);
 for(const translationX of [-152,-190,-30,-160])handlers.onUpdate({translationX});assert.deepEqual(cues,['threshold']);
 handlers.onEnd({velocityX:0},false);handlers.onFinalize();assert.equal(confirmations,0);
 handlers.onBegin();handlers.onUpdate({translationX:-160});handlers.onEnd({velocityX:0},true);
 assert.deepEqual(cues,['threshold','threshold']);assert.equal(confirmations,1);
});
