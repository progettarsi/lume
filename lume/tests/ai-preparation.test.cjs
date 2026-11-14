const {test}=require('node:test');const assert=require('node:assert/strict');
const {AIPreparation,DwellGate,parseAIMetrics}=require('../.test-build/aiPreparation');
const {revisionInput,revisedArticle,validRevision}=require('../.test-build/revision');
const {SimplificationError}=require('../.test-build/simplifier');
const {mergeArticle}=require('../.test-build/articleState');
const lead='La luce del Sole contiene diversi colori e illumina il cielo.';
const tail='Le particelle dell’atmosfera diffondono la luce e rendono visibile il fenomeno.';
const a=(id='1')=>({id,title:'Luce',source:'https://it.wikipedia.org/wiki/Luce',category:'science',preview:[lead],paragraphs:[lead,tail],complete:true,textVersion:3,revision:1,fetchedAt:1});
const drain=()=>new Promise(setImmediate),gate=()=>{let resolve;return {promise:new Promise(r=>resolve=r),resolve:v=>resolve(v)}};
test('dwell is continuous visible foreground time, resets on card/eligibility change and uses an internal threshold',()=>{
 let now=0,next,timer,starts=0;const clock={now:()=>now,set:(f,ms)=>{timer=f;next=now+ms;return 1},clear:()=>timer=undefined};const dwell=new DwellGate(()=>starts++,clock);
 dwell.update('card1');now=3400;dwell.update('card1');assert.equal(next,3500);dwell.update('');assert(!timer);dwell.update('card2');assert.equal(next,6900);now=6900;timer();assert.equal(starts,1);dwell.update('card2');assert.equal(starts,1);dwell.clear();
});
test('open during speculative full download adopts full and generation without duplication or scheduler cancellation',async()=>{
 const downloading=gate(),generating=gate();let fulls=0,gens=0,saved=[];
 const ai=new AIPreparation(async()=>{fulls++;return downloading.promise},async()=>{gens++;return generating.promise},async row=>saved.push(row));ai.configure('fixture',true);
 const original={...a(),complete:false,paragraphs:[lead]},background=new AbortController();const work=ai.prepare(original,background.signal);ai.beginOpen();assert(ai.claim(original.id));background.abort();assert(ai.fullInFlight(original));downloading.resolve(a());const full=await ai.fullInFlight(original);ai.originalReady();const opened=ai.request(full,new AbortController().signal);await drain();assert.equal(fulls,1);assert.equal(gens,1);generating.resolve([tail]);assert(validRevision(await opened));await work;assert.equal(saved.length,1);assert.equal(ai.metrics.adoptedPreparations,1);assert.equal(ai.metrics.usedInFlight,0);assert.equal(ai.metrics.opens[0].mode,'inflight');
});
test('immediate opening performs exactly one explicit generation, keeps the original, then reuses the valid cache',async()=>{
 let gens=0,now=0;const ai=new AIPreparation(async row=>row,async()=>{gens++;return [tail]},async()=>{},()=>{},()=>now);ai.configure('fixture',true);ai.beginOpen();now=10;ai.originalReady();now=30;const revised=await ai.request(a(),new AbortController().signal);assert.equal(gens,1);assert.deepEqual(revised.preview,[lead]);ai.beginOpen();await ai.request(revised,new AbortController().signal);assert.equal(gens,1);assert.equal(ai.metrics.opens[0].classicMs,10);
});
test('key change, disable, offline/background policy cancels speculative transport and ignores a late result',async()=>{
 for(const action of ['key','disable','pause']){const generating=gate();let saved=0,signal;const ai=new AIPreparation(async row=>row,async(_a,_key,s)=>{signal=s;return generating.promise},async()=>saved++);ai.configure('fixture',true);const work=ai.prepare(a(),new AbortController().signal);await drain();if(action==='key')ai.configure('new-fixture',true);else if(action==='disable')ai.configure('fixture',false);else ai.cancel(true);assert(signal.aborted);generating.resolve([tail]);await work;assert.equal(saved,0);assert.equal(ai.metrics.cancelled,1)}
});
test('quota blocks speculation across articles and automatic explicit retries; manual retry is intentional',async()=>{
 let calls=0,now=0,quota=true;const ai=new AIPreparation(async row=>row,async()=>{calls++;if(quota)throw new SimplificationError('Quota esaurita','quota');return [tail]},async()=>{},()=>{},()=>now);ai.configure('fixture',true);await ai.prepare(a(),new AbortController().signal);assert(!ai.canPrepare(a('2')));await assert.rejects(ai.request(a(),new AbortController().signal));assert.equal(calls,1);await assert.rejects(ai.request(a(),new AbortController().signal,true));assert.equal(calls,2);now=600001;assert(ai.canPrepare(a('2')));
 now=600002;await assert.rejects(ai.request(a('2'),new AbortController().signal,true));assert(!ai.canPrepare(a('3')));quota=false;await ai.request(a('2'),new AbortController().signal,true);assert(ai.canPrepare(a('3')));assert.equal(calls,4);
});
test('one speculation at a time, rapid changes do not bypass two starts per minute, and cache use redeems unused work',async()=>{
 let calls=0;const ai=new AIPreparation(async row=>row,async()=>{calls++;return [tail]},async()=>{});ai.configure('fixture',true);const work=ai.prepare(a(),new AbortController().signal);assert(!ai.canPrepare(a('2')));const cached=await work;assert.equal(ai.metrics.unused,1);await ai.request(cached,new AbortController().signal);assert.equal(ai.metrics.usedCached,1);assert.equal(ai.metrics.unused,0);await ai.prepare(a('2'),new AbortController().signal);assert(!ai.canPrepare(a('3')));ai.configure('new-fixture',true);assert(!ai.canPrepare(a('3')));assert.equal(calls,2);
});
test('cache validity uses original content, identity and configuration; bookmark changes do not invalidate it',()=>{
 const revised=revisedArticle(a(),[tail]);assert(validRevision(revised));assert(!validRevision({...revised,paragraphs:[lead,tail+' Una nuova frase.']}));assert(!validRevision({...revised,title:'Nuovo titolo'}));assert(!validRevision({...revised,simplifiedInput:'different-config'}));assert(!validRevision({...revised,simplifiedVersion:2}));assert(validRevision({...revised,saved:true,readAt:10}));assert(validRevision(mergeArticle(revised,{...a(),complete:false,paragraphs:[lead]})));
});
test('diagnostics whitelist counts and bounded timings, discarding credentials and content',()=>{
 const m=parseAIMetrics(JSON.stringify({specStarted:3,key:'sensitive',title:'sensitive',opens:Array.from({length:100},()=>({classicMs:12,aiMs:200,mode:'inflight',content:'secret'}))}));assert.equal(m.opens.length,40);assert(!JSON.stringify(m).includes('sensitive'));assert(!JSON.stringify(m).includes('secret'));assert.equal(m.specStarted,3);
});

test('changed source cancels old preparation; a previous signal cannot cancel a later article',async()=>{
 const old=gate();let calls=0;const ai=new AIPreparation(async row=>row,async()=>{calls++;return calls===1?old.promise:[tail]},async()=>{});ai.configure('fixture',true);
 const first=new AbortController();const work=ai.prepare(a(),first.signal);await drain();assert.equal(ai.fullInFlight({...a(),paragraphs:[lead,'A different original paragraph.']}),undefined);
 const opened=await ai.request(a('2'),new AbortController().signal);assert(validRevision(opened));first.abort();old.resolve([tail]);await work;assert.equal(opened.id,'2');
});

test('late completion from an abandoned opening cannot consume another opening timing sample',async()=>{
 const slow=gate();let n=0,now=0;const ai=new AIPreparation(async row=>row,async()=>++n===1?slow.promise:[tail],async()=>{},()=>{},()=>now);ai.configure('fixture',true);
 ai.beginOpen();const abort=new AbortController(),first=ai.request(a(),abort.signal);await drain();abort.abort();now=100;ai.beginOpen();now=130;ai.originalReady();await ai.request(a('2'),new AbortController().signal);slow.resolve([tail]);await first;
 assert.equal(ai.metrics.opens.length,1);assert.equal(ai.metrics.opens[0].classicMs,30);
});
