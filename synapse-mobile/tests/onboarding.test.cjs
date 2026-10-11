const {test}=require('node:test'),assert=require('node:assert/strict');
const {initialOnboarding,parseOnboarding,recoverOnboarding,OnboardingController,setInitialInterests,interestOptions,TutorialDemo,preparationState,usablePreviewCount}=require('../.test-build/onboarding');
const {emptyLearning,parseLearning,learn,initialInterestWeight,explainRecommendation}=require('../.test-build/recommendations');
const {emptyRegistry}=require('../.test-build/categoryRegistry'),{CATEGORIES}=require('../.test-build/categories');
const {LocalPhoto}=require('../.test-build/onboardingPhoto');
const fresh=()=>initialOnboarding({preferenceKeys:[],visits:0,saved:0,read:0});
const a=i=>({id:String(i),title:'Luce '+i,category:'science',preview:['La luce illumina il cielo.'],paragraphs:[],source:'https://it.wikipedia.org/wiki/Luce_'+i,fetchedAt:1});
test('fresh, conservative legacy evidence and interrupted configuration are independent of preloaded articles',()=>{
 assert.equal(fresh().stage,'intro');for(const evidence of [{preferenceKeys:['learning']},{preferenceKeys:['settings']},{visits:1},{saved:1},{read:1}])assert(initialOnboarding({preferenceKeys:[],visits:0,saved:0,read:0,...evidence}).completed);
 const paused={...fresh(),stage:'tutorial',tutorialIndex:2,revision:12,draft:{name:'Àlex 李',interests:['science']}};
 assert.deepEqual(parseOnboarding(JSON.stringify(paused)),paused);
 assert.deepEqual(recoverOnboarding('{broken',JSON.stringify(paused),{}),paused);
 assert.throws(()=>recoverOnboarding('{broken','{also broken',{}));
 assert.throws(()=>parseOnboarding(JSON.stringify({...paused,version:2})));
});
test('navigation skips only optional steps, returns through four tutorial moments and completes exactly once',async()=>{
 const writes=[],c=new OnboardingController(fresh(),async(s,i)=>writes.push({s,i}));
 const go=action=>c.navigate(action,c.navigationRevision);
 await go('next');assert.equal(c.state.stage,'identity');await go('skip');assert.equal(c.state.stage,'interests');await go('next');assert.equal(c.state.stage,'tutorial');assert(writes.at(-1).i);
 await go('next');await go('next');await go('back');assert.equal(c.state.tutorialIndex,1);await go('next');await go('next');assert.equal(c.state.tutorialIndex,3);await go('next');assert.equal(c.state.stage,'preparation');await go('back');assert.equal(c.state.stage,'tutorial');assert.equal(c.state.tutorialIndex,3);await go('skip');await go('enter');assert(c.state.completed);const n=writes.length;await go('next');assert.equal(writes.length,n);
});
test('duplicate presses carry a revision and cannot advance twice; no clock-based input lock',async()=>{
 let release;const c=new OnboardingController(fresh(),()=>new Promise(r=>release=r));const revision=c.navigationRevision,pending=c.navigate('next',revision);await Promise.resolve();await c.navigate('next',revision);assert(c.busy);release();await pending;assert.equal(c.state.stage,'identity');await c.navigate('next',revision);assert.equal(c.state.stage,'identity');
});
test('failed draft and failed navigation retain intent; retry commits it before advancing',async()=>{
 let fail=true;const c=new OnboardingController({...fresh(),stage:'identity'},async()=>{if(fail)throw Error('disk')});
 await assert.rejects(c.draft({name:'  Zoe\u0308   李  '}));assert.equal(c.state.draft.name,'');assert.equal(c.draftValue.name,'Zoë 李');await assert.rejects(c.navigate('next',c.navigationRevision));assert.equal(c.state.stage,'identity');assert(!c.busy);
 fail=false;await c.navigate('next',c.navigationRevision);assert.equal(c.state.draft.name,'Zoë 李');assert.equal(c.state.stage,'interests');assert.equal(c.error,'');
 await c.draft({name:'🙂'.repeat(60)});assert.equal(Array.from(c.state.draft.name).length,48);assert(!c.state.draft.name.includes('\ud800'));
});
test('initial preferences replace idempotently, preserve real ledgers and decay by subsequent interaction order',()=>{
 const original=emptyLearning(),p=setInitialInterests(original,['music','music','science','unknown']);assert.deepEqual(p.initialInterests.ids,['music','science']);assert.equal(setInitialInterests(p,['music','science']),p);assert.deepEqual(p.seen,[]);assert.deepEqual(p.categories,{});assert.deepEqual(p.opens,{});assert.deepEqual(p.bookmarks,{});
 let next=p;for(let i=0;i<24;i++)next=learn(next,a(i),'open',i+1);assert.equal(initialInterestWeight(next,'music'),1);assert.equal(initialInterestWeight(p,'music'),2);assert(explainRecommendation(a(99),p).interest>explainRecommendation(a(99),original).interest);
 const roundTrip=parseLearning(JSON.stringify(next));assert.deepEqual(roundTrip.initialInterests,next.initialInterests);const changed=setInitialInterests(roundTrip,['arts']);assert.equal(changed.initialInterests.sequence,0);assert.deepEqual(changed.opens,next.opens);
});
test('interest catalog has canonical IDs and no duplicate or availability-disabled choice',()=>{
 const options=interestOptions(emptyRegistry(),new Set(['science']));assert.equal(options.length,CATEGORIES.length);assert.equal(new Set(options.map(x=>x.id)).size,options.length);assert(options.every(x=>x.selectable));assert(options.find(x=>x.id==='music').available===false);
});
test('tutorial and replay have no persistence or learning side effects, including duplicate replay actions',async()=>{
 const state={...fresh(),completed:true,stage:'home',profile:{name:'Nome locale'},revision:9};let writes=0;const c=new OnboardingController(state,async()=>writes++),before=JSON.stringify(c.state),demo=new TutorialDemo();
 demo.swipe('next');demo.swipe('next');assert.equal(demo.card,1);assert(demo.hintStopped);demo.saved=true;demo.opened=true;demo.destination='profile';c.replay();const revision=c.navigationRevision;await c.navigate('next',revision);await c.navigate('next',revision);assert.equal(c.replayIndex,1);await c.navigate('skip',c.navigationRevision);assert.equal(c.replayIndex,null);assert.equal(JSON.stringify(c.state),before);assert.equal(writes,0);
});
test('preparation requires ten unique usable previews, counts real work, and offers finite offline/error exits',()=>{
 const rows=Array.from({length:10},(_,i)=>a(i));assert.equal(usablePreviewCount([...rows,rows[0],{...a(100),source:rows[0].source},{...a(101),preview:[]}]),10);
 assert.equal(preparationState(1,true,true,{phase:'loading'}).kind,'loading');assert.equal(preparationState(9,true,false,{phase:'ready'}).kind,'loading');assert.equal(preparationState(10,true,true,{phase:'loading'}).kind,'ready');
 assert.equal(preparationState(3,false,false,{phase:'idle'}).kind,'partial');assert.equal(preparationState(0,false,false,{phase:'idle'}).kind,'offline-empty');const error=preparationState(0,true,false,{phase:'service'});assert(error.canEnter&&error.canRetry);
});
test('cancelled/denied photo leaves identity intact; replacement and removal delete only unreferenced copies',async()=>{
 let selection={kind:'cancelled'},current='local:old';const removed=[],port={pick:async()=>selection,copy:async()=> 'local:new',remove:async uri=>removed.push(uri),exists:async uri=>uri==='local:new'},photo=new LocalPhoto(port),commit=async uri=>{current=uri},refs=()=>current?[current]:[];
 assert.equal(await photo.replace(()=>current,commit,refs),'cancelled');selection={kind:'denied'};assert.equal(await photo.replace(()=>current,commit,refs),'denied');assert.equal(current,'local:old');assert.deepEqual(removed,[]);
 selection={kind:'picked',uri:'temporary',width:2000,height:1000};await photo.replace(()=>current,commit,refs);assert.equal(current,'local:new');assert.deepEqual(removed,['local:old']);assert.equal(await photo.usable('local:missing'),undefined);
 await photo.remove(()=>current,commit,refs);assert.equal(current,undefined);assert.deepEqual(removed,['local:old','local:new']);
});
test('photo failed commit cleans new copy, oversized input never copies, and referenced old photo is protected',async()=>{
 let current='local:old',copies=0,selection={kind:'picked',uri:'temp',width:800,height:600};const deleted=[],photo=new LocalPhoto({pick:async()=>selection,copy:async()=>{copies++;return 'local:new'},remove:async u=>deleted.push(u),exists:async()=>true});
 await assert.rejects(photo.replace(()=>current,async()=>{throw Error('disk')},()=>[current]));assert.equal(current,'local:old');assert.deepEqual(deleted,['local:new']);
 selection={...selection,bytes:26*1024*1024};await assert.rejects(photo.replace(()=>current,async()=>{},()=>[]));assert.equal(copies,1);
 selection={...selection,bytes:1};await photo.replace(()=>current,async u=>{current=u},()=>[current,'local:old']);assert.deepEqual(deleted,['local:new']);
});
