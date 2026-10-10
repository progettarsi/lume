const {test}=require('node:test'),assert=require('node:assert/strict');
const R=require('../.test-build/recommendations'),{refreshFuture,reserveDemand}=require('../.test-build/reserve');
const {article,rows,events,scenarios,rng}=require('../scripts/qa/personalization-corpus.cjs');
const profile=es=>es.reduce((p,e)=>R.learn(p,e.article,e.kind,1000),R.emptyLearning());
const order=(p,seed=1,rs=rows)=>R.rankRecommendations(rs,p,rng(seed)).slice(0,10),count=(xs,c)=>xs.filter(a=>a.category===c).length;
test('migration rebuilds mixed v1/v2 aggregates from reliable saved and visited identities without deleting history',()=>{
 for(const version of [1,2]){const saved={...article(0,0),saved:true},visit=article(1,0),old={version,seen:['old'],categories:{science:999},topics:{time:999},habit:{words:999},sessions:['old'],opens:{[R.identity(visit)]:1},updatedAt:1};
 const next=R.migrateLearning(R.parseLearning(JSON.stringify(old)),[saved],[visit]);assert.equal(next.categories.science,5);assert.equal(next.categories.nature,.2);assert(next.seen.includes('old'));assert(next.seen.includes(R.identity(visit)));assert.deepEqual(next.recent,[]);assert.equal(next.habit,undefined);assert.equal(next.sessions,undefined);assert.equal(R.migrateLearning(next,[],[]),next);assert.equal(R.learn(next,saved,'unsave').categories.science,0);}
});
test('duplicate and repeated openings do not manufacture preference or recency; seen is neutral',()=>{
 const a=article(0,0),p=R.learn(R.emptyLearning(),a,'open',1);assert.strictEqual(R.learn(p,{...a,id:'alias'},'open',999999999),p);assert.deepEqual(profile(scenarios.repeated).categories,p.categories);
 const seen=R.learn(p,article(1,0),'seen');assert.deepEqual(seen.categories,p.categories);assert.equal(seen.sequence,p.sequence);
});
test('undo of a migrated bookmark cannot invent a recent strong signal',()=>{
 const saved={...article(0,99),saved:true},p=R.migrateLearning({version:2,seen:[],categories:{science:99},topics:{}},[saved],[]);
 const restored=R.learn(R.learn(p,saved,'unsave'),saved,'save');assert.deepEqual(restored.recent,p.recent);assert.deepEqual(restored.categories,p.categories);assert.deepEqual(order(restored),order(p));
});
test('unsave and undo reverse their contribution exactly, including recency and unrelated interests',()=>{
 const a=article(0,99),base=profile(events(1,20)),saved=R.learn(base,a,'save',1);let p=saved;
 for(let i=0;i<20;i++){p=R.learn(p,a,'unsave',2);assert.deepEqual(order(p).map(a=>a.id),order(base).map(a=>a.id));p=R.learn(p,a,'save',3);assert.deepEqual(p.categories,saved.categories);assert.deepEqual(p.recent,saved.recent);assert.deepEqual(order(p),order(saved))}
});
test('acceptance matrix: cold, accidental, coherent saves/opens, switch, alternation across twenty seeds',()=>{
 for(let seed=1;seed<=20;seed++){
 const cold=order(profile([]),seed),weak=order(profile(scenarios.accidental),seed);assert(new Set(cold.map(a=>a.category)).size>=4);
 assert(weak.filter(a=>!cold.some(b=>a.id===b.id)).length<=2);
 // Also compare topic allocation, independent of order within equivalent articles.
 const allocation=xs=>Object.fromEntries([...new Set(rows.map(a=>a.category))].map(c=>[c,count(xs,c)]));const c=allocation(cold),w=allocation(weak);assert(Object.keys(c).reduce((s,k)=>s+Math.max(0,w[k]-c[k]),0)<=2);
 for(const name of ['saves2','saves3']){const xs=order(profile(scenarios[name]),seed);assert(count(xs,'science')>=4);assert(xs.findIndex(a=>a.category==='science')<3)}
 assert(count(order(profile(scenarios.opens5),seed),'science')>=3);
 const switched=order(profile(scenarios.switch),seed);assert(count(switched,'science')>=3);assert(count(switched,'nature')>=1);
 const alternating=order(profile(scenarios.alternating),seed);assert(count(alternating,'science')>=2);assert(count(alternating,'nature')>=2);
 for(const es of Object.values(scenarios)){const xs=order(profile(es),seed);for(let i=2;i<xs.length;i++)assert(!(xs[i].category===xs[i-1].category&&xs[i].category===xs[i-2].category));if(es.length){assert(xs[4].category!=='science'||xs[9].category!=='science')}}
 }
});
test('exploration slots preserve at least two unpreferred topics after strong coherent signals',()=>{
 const xs=order(profile(scenarios.saves3));assert.notEqual(xs[4].category,'science');assert.notEqual(xs[9].category,'science');assert(count(xs,'science')<=8);
});
test('scarce candidates are promoted but never invented, aliases excluded, offline restart is deterministic',()=>{
 const p=profile(scenarios.saves3),sparse=rows.filter(a=>a.category!=='science'||a.id==='candidate-0-0'),xs=order(p,1,sparse);assert.equal(count(xs,'science'),1);assert.equal(xs[0].category,'science');assert.equal(new Set(xs.map(R.identity)).size,xs.length);
 assert.deepEqual(order(R.parseLearning(JSON.stringify(p))),order(p));assert.equal(R.rankRecommendations([...sparse,{...sparse[0],id:'alias'}],p).length,sparse.length);
});
test('actual reserve refresh preserves visible prefix, admits relevant cached candidates and does not duplicate',()=>{
 const cold=R.rankRecommendations(rows,R.emptyLearning(),()=>.5),p=profile(scenarios.saves3),current=cold.slice(0,30),next=refreshFuture(current,rows,p,new Set(),2);
 assert.deepEqual(next.slice(0,3),current.slice(0,3));assert(count(next.slice(3,13),'science')>=4);assert.equal(new Set(next.map(R.identity)).size,next.length);
 assert.equal(reserveDemand({enabled:true,category:'all',pool:current,pendingFull:false,refresh:true}),'all');assert.equal(reserveDemand({enabled:false,category:'all',pool:current,pendingFull:false,refresh:true}),undefined);
});
test('specific preview terms distinguish topics within a category without inferring language or comprehension',()=>{
 const a=article(0,0),b={...article(1,0),category:'science'},p=profile(events(0,3));const xs=R.rankRecommendations([b,a],p,()=>.5);assert.equal(xs[0].id,a.id);assert.equal(R.explainRecommendation(a,p).language,undefined);assert.equal(R.explainRecommendation(a,p).quantity,undefined);
});
test('acquisition has no anchor for an accidental open; saves and coherent opens provide an anchor',()=>{
 assert.equal(R.discoveryAnchor(profile(scenarios.accidental)),undefined);assert.equal(R.discoveryAnchor(profile(scenarios.saves3),()=>.5).category,'science');assert.equal(R.discoveryAnchor(profile(scenarios.opens5),()=>.5).category,'science');
});
test('Wikipedia retrieves interest candidates within the old budget; search and shuffle retain independent requests',async()=>{
 const {Wikipedia}=require('../.test-build/wikipedia');const calls=[];
 const wiki=new Wikipedia(async url=>{const params=new URL(url).searchParams;calls.push(Object.fromEntries(params));return new Response(JSON.stringify({query:{pages:rows.slice(0,8).map((a,i)=>({pageid:i+1,title:a.title,extract:a.preview[0],fullurl:a.source,index:i+1}))}}))});
 await wiki.batch('all',new Set(),6,undefined,profile(scenarios.saves3),{maxRounds:2,preferInterest:true});assert(calls.length<=2);assert.equal(calls[0].generator,'search');assert.match(calls[0].gsrsearch,/Astronomia/);
 calls.length=0;await wiki.search('mosaico');assert.equal(calls[0].gsrsearch,'mosaico');calls.length=0;await wiki.random(new Set());assert.equal(calls[0].generator,'random');
});
