const {test}=require('node:test'),assert=require('node:assert/strict');
const {LibraryViews}=require('../.test-build/libraryViews');
const {emptyLearning,rankRecommendations}=require('../.test-build/recommendations');
const {editorialRepetition,repetitionScorer}=require('../.test-build/editorial');
const {appendDiscoveries}=require('../.test-build/reserve');
const {reserveContext,reserveDemand}=require('../.test-build/reserve');
const text='Le molecole dell’atmosfera diffondono la luce del Sole. Le lunghezze d’onda più corte vengono diffuse maggiormente. Per questo il cielo appare blu, mentre al tramonto prevalgono altri colori.';
const article=i=>({id:`wiki:${i}`,title:`Diffusione della luce ${i}`,preview:[text],paragraphs:[text],category:i%2?'science':'nature',source:`https://it.wikipedia.org/wiki/Luce_${i}`,fetchedAt:1});
test('reserve ranking is reused across UI reads but invalidated synchronously by consumed IDs, profile and cache',()=>{
 let calls=0;const views=new LibraryViews((cache,profile,served)=>{calls++;return cache.filter(a=>!served.has(a.id)&&!profile.seen.includes(a.id))});
 const rows=[article(1),article(2)],profile=emptyLearning(),served=new Set();
 const first=views.reserve(rows,profile,served,0);for(let i=0;i<100;i++)assert.strictEqual(views.reserve(rows,profile,served,0),first);assert.equal(calls,1);
 served.add(rows[0].id);assert.deepEqual(views.reserve(rows,profile,served,1).map(a=>a.id),[rows[1].id]);assert.equal(calls,2);
 assert.deepEqual(views.reserve(rows,{...profile,seen:[rows[1].id]},served,1),[]);assert.equal(calls,3);
 const changed=[...rows,article(3)];assert.equal(views.reserve(changed,profile,served,1).length,2);assert.equal(calls,4);
});
test('reader edition keeps preview and identity on unrelated downloads; arriving original/AI content invalidates it',()=>{
 const views=new LibraryViews(),a=article(1),rows=[a],first=views.feed('all',rows,[a],true);
 const other=article(2),cache=[a,other];const stable=views.feed('all',rows,cache,true);assert.strictEqual(stable[0],first[0]);assert.strictEqual(views.feed('all',rows,cache,true),stable);
 const full={...a,complete:true,paragraphs:[text,text],textVersion:3};const downloaded=views.feed('all',rows,[full,other],true)[0];assert.equal(downloaded.complete,true);assert.strictEqual(downloaded.preview,a.preview);assert.strictEqual(downloaded.paragraphs,full.paragraphs);
 const revised={...full,simplified:['Testo revisionato'],simplifiedVersion:3};const finalCache=[revised,other];assert.strictEqual(views.feed('all',rows,finalCache,true)[0].simplified,revised.simplified);assert.equal(views.feed('all',rows,finalCache,false)[0].simplified,undefined);
 const next={...revised,simplified:['Nuova revisione']};assert.strictEqual(views.feed('all',rows,[next],true)[0].simplified,next.simplified);
});
test('repetition optimisation preserves editorial penalties and deterministic ordering',()=>{
 const rows=Array.from({length:24},(_,i)=>article(i)),score=repetitionScorer();
 for(const a of rows)for(let i=0;i<rows.length-3;i++)assert.equal(score(a,rows.slice(i,i+3)),editorialRepetition(a,rows.slice(i,i+3)));
 const profile=emptyLearning(),one=rankRecommendations(rows,profile,()=>.5,[],profile.updatedAt),two=rankRecommendations(rows,profile,()=>.5,[],profile.updatedAt);assert.deepEqual(one.map(a=>a.id),two.map(a=>a.id));
});
test('empty and duplicate refills preserve the published array, rather than waking UI work',()=>{
 const rows=[article(1)],profile=emptyLearning();assert.strictEqual(appendDiscoveries(rows,[],profile,new Set()),rows);assert.strictEqual(appendDiscoveries(rows,[{...rows[0]}],profile,new Set()),rows);
});
test('reader/foreground/offline suspension never ranks the reserve; resuming obtains current data',()=>{
 let calls=0;const pool=()=>{calls++;return [article(1)]};
 for(let i=0;i<30;i++)assert.equal(reserveDemand(reserveContext(false,'all',pool,true)),undefined);
 assert.equal(calls,0);const active=reserveContext(true,'all',pool,false);assert.equal(calls,1);assert.equal(active.pool.length,1);assert.equal(reserveDemand(active),'all');
});
