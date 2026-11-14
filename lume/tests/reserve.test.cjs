const {test}=require('node:test');const assert=require('node:assert/strict');
const {Wikipedia}=require('../.test-build/wikipedia');
const {reserveArticles,appendDiscoveries,reserveDemand,ReserveScheduler,RESERVE_TARGET,RESERVE_BYTES}=require('../.test-build/reserve');
const {emptyLearning,identity}=require('../.test-build/recommendations');
const {articleBytes,evictable,CACHE_COUNT,CACHE_BYTES}=require('../.test-build/cache');
const {articleStatus,aiFailure}=require('../.test-build/readerStatus');
const {mergeArticle}=require('../.test-build/articleState');
const {readerContinuation}=require('../.test-build/text');
const intro='La luce del Sole contiene diversi colori. Le molecole dell’atmosfera diffondono la luce in tutte le direzioni e le lunghezze d’onda più corte vengono diffuse maggiormente. Per questo il cielo appare blu.';
const a=(i,extra={})=>({id:`wiki:${i}`,title:`Luce ${i}`,category:'science',source:`https://it.wikipedia.org/wiki/Luce_${i}`,paragraphs:[intro],preview:[intro],fetchedAt:i,...extra});
const page=i=>({pageid:i,title:`Luce ${i}`,extract:intro,fullurl:a(i).source});
const drain=()=>new Promise(setImmediate);
function clock(){let now=0,id=0;const timers=new Map();return {now:()=>now,set:(fn,delay)=>{timers.set(++id,{fn,at:now+delay});return id},clear:key=>timers.delete(key),advance:async ms=>{now+=ms;const due=[...timers].filter(([,v])=>v.at<=now);for(const [key,v] of due){timers.delete(key);v.fn()}await drain()},timers}}

test('first response is published while the next slow response is still pending; cancellation retains that chunk',async()=>{
 let calls=0,release;const gate=new Promise(resolve=>release=resolve),chunks=[];
 const wiki=new Wikipedia(async()=>{calls++;if(calls===2)await gate;return new Response(JSON.stringify({query:{pages:[page(calls*2),page(calls*2+1)]}}))});
 const abort=new AbortController();const job=wiki.batch('science',new Set(),4,abort.signal,emptyLearning(),{maxRounds:2,onChunk:rows=>chunks.push(rows)});
 await drain();assert.equal(chunks.length,1);assert.equal(chunks[0].length,2);assert.equal(calls,2);
 abort.abort();release();await assert.rejects(job);assert.equal(chunks.length,1);
});
test('feed rounds are bounded and aliases are deduplicated in the same response',async()=>{
 let calls=0;const wiki=new Wikipedia(async()=>{calls++;return new Response(JSON.stringify({query:{pages:[page(1),{...page(2),fullurl:a(1).source}]}}))});
 const rows=await wiki.batch('science',new Set(),6,undefined,emptyLearning(),{maxRounds:2});assert.equal(calls,2);assert.equal(rows.length,1);
 assert.equal(appendDiscoveries([a(1)],[a(2,{source:a(1).source}),a(3)],emptyLearning(),new Set()).length,2);
});
test('reserve is bounded, excludes consumed identities and favours the current category',()=>{
 const rows=Array.from({length:100},(_,i)=>a(i,{category:i<90?'nature':'science'}));
 const profile={...emptyLearning(),seen:[identity(rows[98])]};
 const pool=reserveArticles(rows,profile,new Set(['wiki:99']),'science');
 assert.equal(pool.length,RESERVE_TARGET);assert.equal(pool.filter(row=>row.category==='science').length,8);assert(!pool.some(row=>row.id==='wiki:98'||row.id==='wiki:99'));
 assert(pool.reduce((n,row)=>n+articleBytes(row),0)<=RESERVE_BYTES);
 const context={enabled:true,category:'science',pool,pendingFull:false};assert.equal(reserveDemand(context),undefined);
 assert.equal(reserveDemand({...context,pool:pool.filter(a=>a.category!=='science')}),'science');assert.equal(reserveDemand({...context,enabled:false}),undefined);
});
test('ordinary cache budget leaves room for the protected reserve and active/saved articles',()=>{
 const rows=Array.from({length:100},(_,i)=>a(i));rows[0].saved=true;
 const protect=new Set(rows.slice(1,32).map(a=>a.id));const removed=evictable(rows,protect);
 assert.equal(CACHE_COUNT,80);assert.equal(CACHE_BYTES,6*1024*1024);assert.equal(removed.length,19);
 assert(!removed.some(id=>protect.has(id)||id===rows[0].id));
});
test('background stops at target and permits only six jobs in a sliding minute',async()=>{
 const timer=clock();let calls=0;const state={enabled:true,category:'all',pool:[],pendingFull:false};
 const scheduler=new ReserveScheduler(()=>state,async()=>{calls++;return 1},timer);
 scheduler.wake();await drain();for(let i=0;i<10;i++)await timer.advance(1800);assert.equal(calls,6);
 await timer.advance(60000);assert.equal(calls,7);
 state.pool=Array.from({length:30},(_,i)=>a(i));await timer.advance(1800);assert.equal(calls,7);scheduler.dispose();assert.equal(timer.timers.size,0);
});

test('reserve waits for the foreground handoff instead of starting a transport immediately',async()=>{
 const timer=clock();let calls=0;const state={enabled:true,category:'all',pool:[],pendingFull:false};
 const scheduler=new ReserveScheduler(()=>state,async()=>{calls++;return 1},timer);
 scheduler.afterForeground();await drain();assert.equal(calls,0);await timer.advance(1799);assert.equal(calls,0);await timer.advance(1);assert.equal(calls,1);scheduler.dispose();
});
test('reset for an explicit foreground refresh does not dispatch a speculative request first',async()=>{
 const timer=clock();let calls=0;const state={enabled:true,category:'all',pool:[],pendingFull:false};const scheduler=new ReserveScheduler(()=>state,async()=>{calls++;return 1},timer);
 scheduler.reset(false);await drain();assert.equal(calls,0);scheduler.afterForeground();await timer.advance(1799);assert.equal(calls,0);await timer.advance(1);assert.equal(calls,1);scheduler.dispose();
});
test('three empty/error attempts stop automatic loops; explicit reconnect starts a fresh attempt',async()=>{
 const timer=clock();let calls=0;const state={enabled:true,category:'all',pool:[],pendingFull:false};
 const scheduler=new ReserveScheduler(()=>state,async()=>{calls++;if(calls===2)throw Error('disconnected');return 0},timer);
 scheduler.wake();await drain();await timer.advance(30000);await timer.advance(60000);assert.equal(calls,3);
 await timer.advance(600000);scheduler.wake();await drain();assert.equal(calls,3);
 state.enabled=false;scheduler.reset();await drain();assert.equal(calls,3);
 state.enabled=true;scheduler.reset();await drain();assert.equal(calls,4);scheduler.dispose();
});
test('opening an article aborts the background transport and prevents new work until it is released',async()=>{
 const timer=clock();let calls=0,aborted=0;const state={enabled:true,category:'all',pool:[],pendingFull:false};
 const scheduler=new ReserveScheduler(()=>state,(_category,signal)=>new Promise((resolve,reject)=>{calls++;signal.addEventListener('abort',()=>{aborted++;reject(Error('cancelled'))},{once:true})}),timer);
 scheduler.wake();state.enabled=false;scheduler.interrupt();await drain();assert.equal(aborted,1);await timer.advance(60000);assert.equal(calls,1);
 state.enabled=true;scheduler.wake();assert.equal(calls,2);scheduler.dispose();await drain();
});

test('a depleted category cannot starve the global reserve or retry its own source indefinitely',async()=>{
 const timer=clock(),calls=[];const state={enabled:true,category:'science',pool:Array.from({length:20},(_,i)=>a(i,{category:'nature'})),pendingFull:false};
 const scheduler=new ReserveScheduler(()=>state,async category=>{calls.push(category);if(category==='all'){state.pool=Array.from({length:30},(_,i)=>a(i,{category:'nature'}));return 30}return 0},timer);
 scheduler.wake();await drain();await timer.advance(30000);await timer.advance(60000);await timer.advance(1800);
 assert.deepEqual(calls,['science','science','science','all']);await timer.advance(600000);scheduler.wake();await drain();assert.equal(calls.length,4);scheduler.dispose();
});
test('offline has only a preview; failed Gemini or stale download flags cannot hide an available original',()=>{
 assert.equal(articleStatus(a(1),false).kind,'offline');assert.equal(articleStatus(a(1,{contentIssueKind:'network'}),true).action,'article');
 assert.equal(articleStatus(a(1,{contentIssueKind:'content'}),true).action,'source');assert.equal(aiFailure('Quota terminata.').kind,'ai');
 const full=a(1,{complete:true,paragraphs:[intro,'Un seguito originale leggibile.']});
 const merged=mergeArticle(full,a(1,{contentIssue:'Download interrotto',contentIssueKind:'network'}));
 assert.equal(merged.contentIssue,undefined);assert.equal(articleStatus(merged,true),undefined);assert.deepEqual(readerContinuation(merged),['Un seguito originale leggibile.']);
});
test('a new interest can retry a full reserve without resetting the network budget',async()=>{
 const timer=clock();let calls=0;const state={enabled:true,category:'all',pool:Array.from({length:30},(_,i)=>a(i)),pendingFull:false,refresh:true};
 const scheduler=new ReserveScheduler(()=>state,async()=>{calls++;return 1},timer);
 scheduler.wake();await drain();for(let i=0;i<8;i++){scheduler.reset();await timer.advance(1800)}assert.equal(calls,6);
 await timer.advance(60000);assert.equal(calls,7);scheduler.dispose();
});
