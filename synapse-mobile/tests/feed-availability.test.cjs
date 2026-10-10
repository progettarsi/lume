const {test}=require('node:test'),assert=require('node:assert/strict');
const {recoverFeed,offlineReserve,offlineContinuation,repeatedArticle,categoryDisabled,FeedReturnClock,FEED_ATTEMPTS,canRecheck}=require('../.test-build/feedAvailability');
const {Wikipedia,WikiError,retryDelay}=require('../.test-build/wikipedia');
const {emptyLearning,identity}=require('../.test-build/recommendations');
const {reserveDemand}=require('../.test-build/reserve');
const intro='La luce del Sole contiene diversi colori. Le molecole dell’atmosfera diffondono la luce in tutte le direzioni e le lunghezze d’onda più corte vengono diffuse maggiormente. Per questo il cielo appare blu.';
const a=i=>({id:'wiki:'+i,title:'Luce '+i,category:i%2?'science':'nature',paragraphs:[intro],preview:[intro],source:'https://it.wikipedia.org/wiki/Luce_'+i,fetchedAt:i});
const page=i=>({pageid:i,title:a(i).title,extract:intro,fullurl:a(i).source});
const signal=()=>new AbortController().signal;
test('one bounded recovery distinguishes first result, empty and duplicate batches then useful results',async()=>{
 for(const sequence of [[1],[0,1],[0,0,1],[0,0,0]]){let calls=0;const states=[];const result=await recoverFeed(async()=>sequence[calls++],signal(),s=>states.push(s.phase));assert.equal(calls,sequence.length);assert.equal(result.phase,sequence.at(-1)?'ready':'exhausted');if(calls>1)assert(states.includes('searching'));assert(calls<=FEED_ATTEMPTS)}
});
test('transport failures recover progressively and cannot establish category exhaustion or offline',async()=>{
 let calls=0;const waits=[];const state=await recoverFeed(async()=>{if(++calls<3)throw new WikiError('timeout');return 2},signal(),()=>{},async delay=>waits.push(delay));assert.equal(state.phase,'ready');assert.deepEqual(waits,[750,1500]);
 calls=0;const failed=await recoverFeed(async()=>{calls++;if(calls===2)throw new WikiError('timeout');return 0},signal(),()=>{},async()=>{});assert.equal(failed.phase,'service');assert.equal(calls,3);assert(!categoryDisabled('science',true,failed));
});
test('rate limits respect long and dated Retry-After without hidden lower-level retries',async()=>{
 assert.equal(retryDelay('120'),120000);assert.equal(retryDelay('Sat, 10 Oct 2026 10:02:00 GMT',Date.parse('2026-10-10T10:00:00Z')),120000);
 for(const status of [429,503]){let calls=0;const wiki=new Wikipedia(async()=>{calls++;return new Response('{}',{status,headers:{'Retry-After':'120'}})});const state=await recoverFeed(async()=>{await wiki.batch('science',new Set(),4,undefined,emptyLearning(),{maxRounds:1,requestAttempts:1});return 0},signal(),()=>{},async()=>{},()=>100);assert.equal(calls,1);assert.equal(state.phase,status===429?'limit':'service');assert.equal(state.after,120100);assert(!canRecheck(state,120099));assert(canRecheck(state,120100))}
});
test('nonrecoverable/API errors stop immediately and temporary service errors remain temporary',async()=>{
 for(const error of [new WikiError('bad','content'),new WikiError('forbidden','network',0,false)]){let calls=0;const result=await recoverFeed(async()=>{calls++;throw error},signal());assert.equal(calls,1);assert.equal(result.phase,'unavailable')}
 const result=await recoverFeed(async()=>{throw new WikiError('service')},signal(),()=>{},async()=>{});assert.equal(result.phase,'service');
});
test('actual provider uses at most three HTTP requests and advances links past finished cursors',async()=>{
 const params=[];const wiki=new Wikipedia(async url=>{params.push(new URL(url).searchParams);return new Response(JSON.stringify({query:{pages:params.length===3?[page(3)]:[]}}))});
 const abort=new AbortController();const result=await recoverFeed(async attempt=>(await wiki.batch('science',new Set(),4,abort.signal,emptyLearning(),{maxRounds:1,requestAttempts:1,alternative:attempt>1})).length,abort.signal);
 assert.equal(result.phase,'ready');assert.equal(params.length,3);assert.equal(params[1].get('generator'),'links');assert.notEqual(params[1].get('titles'),params[2].get('titles'));
});
test('link pagination retains anchor until cursor finishes, then advances the anchor',async()=>{
 const urls=[];const wiki=new Wikipedia(async url=>{urls.push(new URL(url).searchParams);return new Response(JSON.stringify({query:{pages:[]},...(urls.length===1?{continue:{gplcontinue:'next',continue:'||'}}:{})}))});
 for(let i=0;i<3;i++)await wiki.batch('science',new Set(),4,undefined,emptyLearning(),{maxRounds:1,requestAttempts:1,alternative:true});
 assert.equal(urls[0].get('titles'),urls[1].get('titles'));assert.equal(urls[1].get('gplcontinue'),'next');assert.notEqual(urls[1].get('titles'),urls[2].get('titles'));assert.equal(urls[2].get('gplcontinue'),null);
});
test('offline reserve handles full, partial, consumed, absent and unusable data within preview budgets',()=>{
 const rows=Array.from({length:50},(_,i)=>a(i)),learning=emptyLearning();assert.equal(offlineReserve(rows,learning,new Set()).length,30);assert.equal(offlineReserve(rows.slice(0,4),learning,new Set()).length,4);assert.deepEqual(offlineReserve([],learning,new Set()),[]);
 const consumed={...learning,seen:rows.flatMap(a=>[a.id,identity(a)])},reserve=offlineReserve(rows,consumed,new Set());assert.equal(reserve.length,30);assert(reserve.every(a=>repeatedArticle(a,consumed,new Set())));
 assert.equal(offlineReserve([a(1),{...a(2),source:a(1).source},{...a(3),preview:[]},{...a(4),preview:['x'.repeat(17000)]}],learning,new Set()).length,1);
});
test('offline continues with unseen first, then rotates repeats without immediate repetition or changing current card',()=>{
 const rows=[a(1),a(2),a(3)],learning=emptyLearning(),served=new Set(['wiki:1']);
 assert.deepEqual(offlineContinuation([rows[0]],0,rows,learning,served).map(a=>a.id),['wiki:1','wiki:3','wiki:2']);
 const exhausted={...learning,seen:rows.map(a=>a.id)},next=offlineContinuation(rows,2,rows,exhausted,new Set());assert.equal(next[0],rows[2]);assert.equal(next.length,3);assert.notEqual(next[1].id,rows[2].id);assert.equal(new Set(next.map(a=>a.id)).size,next.length);
 assert.deepEqual(offlineContinuation([rows[0]],0,[rows[0]],exhausted,new Set()),[rows[0]]);
});
test('disabled reasons keep Per Te reachable and exhausted categories blocked during recheck until usable content',()=>{
 assert(!categoryDisabled('all',false));assert(categoryDisabled('science',false));assert(!categoryDisabled('science',true,{phase:'service'}));assert(categoryDisabled('science',true,{phase:'exhausted'}));assert(categoryDisabled('science',true,{phase:'searching',exhausted:true}));assert(!categoryDisabled('science',true,{phase:'ready'}));
 assert.equal(reserveDemand({enabled:true,category:'science',pool:[],pendingFull:true}),'all');
});
test('return countdown completes once, pauses in background, and cancellation remains permanent across resumes',()=>{
 let now=0;const clock=new FeedReturnClock(()=>now);clock.resume();now=2000;clock.pause();assert.equal(clock.remaining,3000);now=20000;clock.resume();now+=2999;assert.equal(clock.tick(),1);now++;assert.equal(clock.tick(),0);assert(clock.done);clock.resume();now+=5000;assert.equal(clock.tick(),0);
 const cancelled=new FeedReturnClock(()=>now);cancelled.resume();now+=500;cancelled.cancel();const left=cancelled.remaining;now+=50000;cancelled.resume();assert.equal(cancelled.tick(),left);assert(!cancelled.done);
});
test('cancellation while retry waiting or after a late batch prevents further publication and attempts',async()=>{
 const abort=new AbortController();let calls=0;await assert.rejects(recoverFeed(async()=>{calls++;throw new WikiError('timeout')},abort.signal,()=>{},async()=>abort.abort()));assert.equal(calls,1);
 const late=new AbortController();let finish;const job=recoverFeed(()=>new Promise(resolve=>finish=resolve),late.signal);late.abort();finish(3);await assert.rejects(job);
});
test('recovery supports the installed React Native AbortSignal polyfill without throwIfAborted',async()=>{
 const {AbortController:NativeAbortController}=require('abort-controller/dist/abort-controller');const abort=new NativeAbortController();assert.equal(abort.signal.throwIfAborted,undefined);assert.equal((await recoverFeed(async()=>1,abort.signal)).phase,'ready');abort.abort();let calls=0;await assert.rejects(recoverFeed(async()=>{calls++;return 1},abort.signal));assert.equal(calls,0);
});
