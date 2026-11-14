const {test}=require('node:test'),assert=require('node:assert/strict');
const {libraryHarness}=require('./helpers/libraryHarness.cjs');
const {Wikipedia}=require('../.test-build/wikipedia'),{emptyLearning}=require('../.test-build/recommendations');
const intro='La luce del Sole contiene diversi colori. Le molecole dell’atmosfera diffondono la luce in tutte le direzioni e le lunghezze d’onda più corte vengono diffuse maggiormente. Per questo il cielo appare blu.';
const a=i=>({id:'wiki:'+i,title:'Luce '+i,category:'science',preview:[intro],paragraphs:[intro],source:'https://it.wikipedia.org/wiki/Luce_'+i,fetchedAt:i});
const response=ids=>new Response(JSON.stringify({query:{pages:ids.map(i=>({pageid:i,title:a(i).title,extract:intro,fullurl:a(i).source}))}}));
const natureIntro='Il mimetismo è la capacità degli animali di assumere un aspetto simile all’ambiente circostante. Gli uccelli possono così sfuggire ai predatori e trovare riparo fra le piante. Questo comportamento aiuta la sopravvivenza della specie.';
const nature=i=>({...a(i),title:'Mimetismo '+i,category:'nature',preview:[natureIntro],paragraphs:[natureIntro]});
test('real library loads consumed reserve after offline restart and rotates while keeping current identity',async()=>{
 const rows=[a(1),a(2),a(3)],profile={...emptyLearning(),seen:rows.map(a=>a.id)},first=await libraryHarness({online:false,rows,profile});
 try{assert.equal(first.lib.getFeed('all').length,3);assert(first.lib.isRepeated(first.lib.getFeed('all')[0]));const before=first.lib.getFeed('all'),pos=first.lib.trimFeed('all',2);await first.lib.load('all',pos);await first.flush();assert.equal(first.lib.getFeed('all')[0].id,before[2].id);assert.equal(first.lib.feedCorrection.position,0);
  const restarted=await libraryHarness({online:false,disk:first.disk});try{assert.equal(restarted.lib.getFeed('all').length,3);assert(restarted.lib.isRepeated(restarted.lib.getFeed('all')[0]))}finally{restarted.dispose()}
 }finally{first.dispose()}
});
test('offline first launch and unreadable storage use the included catalog with no network request',async()=>{
 for(const broken of [false,true]){let calls=0;const h=await libraryHarness({online:false,broken,wiki:new Wikipedia(async()=>{calls++;return response([])})});try{assert(h.lib.ready);assert(h.lib.getFeed('all').length>0);await h.lib.load('all');assert.equal(calls,0);assert(!h.lib.disabledCategory('all'));assert(h.lib.disabledCategory('science'))}finally{h.dispose()}}
});
test('empty and duplicate responses recover, refresh retains the current card, and reconnect resumes acquisition',async()=>{
 let calls=0;const h=await libraryHarness({rows:[a(1)],wiki:new Wikipedia(async()=>{calls++;return response(calls===1?[]:calls===2?[1]:[calls+1])})});
 try{const current=h.lib.getFeed('all')[0].id;await h.lib.load('all');await h.flush();assert.equal(calls,3);assert.equal(h.lib.availability.all.phase,'ready');assert.equal(h.lib.getFeed('all')[0].id,current);await h.lib.refresh('all');await h.flush();assert.equal(h.lib.getFeed('all')[0].id,current);
  await h.network(false);const offline=h.lib.getFeed('all')[0].id;await h.network(true);await h.lib.load('all');await h.flush();assert(h.lib.online);assert.equal(h.lib.getFeed('all')[0].id,offline);assert(calls>=5);
 }finally{h.dispose()}
});
test('exhausted category stays disabled through a controlled recheck and reactivates on usable content',async()=>{
 let useful=false,calls=0;const h=await libraryHarness({rows:[a(1)],wiki:new Wikipedia(async()=>{calls++;return new Response(JSON.stringify({query:{pages:useful?[{pageid:20,title:nature(20).title,extract:natureIntro,fullurl:a(20).source}]:[]}}))})});
 try{h.lib.enterCategory('nature');await h.lib.load('nature');await h.flush();assert.equal(calls,3);assert.equal(h.lib.availability.nature.phase,'exhausted');assert(h.lib.disabledCategory('nature'));assert(!h.lib.disabledCategory('science'));useful=true;await h.lib.refresh('nature');await h.flush();assert.equal(h.lib.availability.nature.phase,'ready');assert(!h.lib.disabledCategory('nature'));assert.equal(h.lib.getFeed('nature')[0].id,'wiki:20')}
 finally{h.dispose()}
});
test('late category response is cancelled, cannot publish on a new screen, and background abort retains cards',async()=>{
 let release;const h=await libraryHarness({rows:[a(1)],wiki:new Wikipedia(()=>new Promise(resolve=>release=()=>resolve(response([30]))))});
 try{h.lib.enterCategory('nature');const pending=h.lib.load('nature');await h.flush();h.lib.enterCategory('all');release();await pending;await h.flush();assert.equal(h.lib.getFeed('nature').length,0);assert(!h.lib.getFeed('all').some(a=>a.id==='wiki:30'));const current=h.lib.getFeed('all')[0].id;
  const background=h.lib.load('all');await h.flush();await h.appState('background');release();await background;assert.equal(h.lib.getFeed('all')[0].id,current);h.lib.setDiscovery(false);await h.appState('active');assert.equal(h.lib.getFeed('all')[0].id,current);
 }finally{h.dispose()}
});
test('shared rate limit survives category switch, reconnect and manual retry without issuing more HTTP',async()=>{
 let calls=0;const h=await libraryHarness({rows:[a(1)],wiki:new Wikipedia(async()=>{calls++;return new Response('{}',{status:429,headers:{'Retry-After':'120'}})})});
 try{await h.lib.load('all');await h.flush();assert.equal(calls,1);assert.equal(h.lib.availability.all.phase,'limit');h.lib.enterCategory('nature');await h.lib.load('nature');await h.flush();assert.equal(calls,1);assert(!h.lib.disabledCategory('nature'));await h.network(false);await h.network(true);h.lib.retryFeed();await h.flush();assert.equal(calls,1);assert(h.lib.online)}finally{h.dispose()}
});
test('a usable global discovery reactivates its depleted category without a new lifecycle event',async()=>{
 const wiki={batch:async(category,exclude,limit,signal,profile,options)=>{if(category==='all'){const article=nature(55);await options.onChunk([article]);return [article]}return []}};
 const h=await libraryHarness({rows:[a(1)],wiki});try{h.lib.enterCategory('nature');await h.lib.load('nature');await h.flush();assert(h.lib.disabledCategory('nature'));h.lib.enterCategory('all');await h.lib.load('all');await h.flush();assert.equal(h.lib.availability.nature.phase,'ready');assert(!h.lib.disabledCategory('nature'))}finally{h.dispose()}
});
