const {revisionInput}=require('../.test-build/revision.js');
const {test}=require('node:test');const assert=require('node:assert/strict');
const {Wikipedia,WikiError}=require('../.test-build/wikipedia.js');
const {makePreview,continuation,paragraphsFromExtract,generalAudienceScore,rankLocal}=require('../.test-build/text.js');
const {evictable}=require('../.test-build/cache.js');const {categoryOrder,CATEGORIES}=require('../.test-build/categories.js');
const intro='La luce del Sole contiene diversi colori. Le molecole dell’atmosfera diffondono la luce in tutte le direzioni e le lunghezze d’onda più corte vengono diffuse maggiormente. Per questo il cielo appare blu.';
const page=(id,title='Il cielo',index=1)=>({pageid:id,title,index,extract:intro+'\n\n'+intro,fullurl:'https://it.wikipedia.org/wiki/Cielo_'+id,revisions:[{revid:900}]});
const mock=pages=>async()=>new Response(JSON.stringify({query:{pages}}));
const article=(id,extra={})=>({id,title:id,category:'science',paragraphs:[intro],preview:[intro],source:'https://it.wikipedia.org',fetchedAt:Number(id)||1,...extra});
test('native requests identify Lume instead of the blocked generic okhttp agent',async()=>{
 const wiki=new Wikipedia(async(url,options)=>{assert(options.headers['User-Agent'].startsWith('Lume/'+require('../package.json').version+' '));assert.match(options.headers['Api-User-Agent'],/^Lume\//);assert.equal(options.headers.Accept,'application/json');assert.equal(new URL(url).protocol,'https:');return new Response(JSON.stringify({query:{pages:[page(1)]}}))});
 assert.equal((await wiki.search('cielo')).length,1);
});
test('HTTP refusal retains its status rather than masquerading as an offline connection',async()=>{
 const wiki=new Wikipedia(async()=>new Response('Blocked user agent',{status:403}));await assert.rejects(wiki.search('cielo'),e=>e instanceof WikiError&&e.kind==='network'&&e.status===403&&!e.recoverable&&!e.message.includes('403'));
});
test('default fetch retains its browser receiver',async()=>{
 const original=globalThis.fetch;
 try{globalThis.fetch=function(){assert.equal(this,globalThis);return Promise.resolve(new Response(JSON.stringify({query:{pages:[page(1)]}})))};const wiki=new Wikipedia();assert.equal((await wiki.search('cielo')).length,1)}
 finally{globalThis.fetch=original}
});
test('cache bounded by count, preserving saved and protected articles',()=>{
 const rows=Array.from({length:40},(_,i)=>article(String(i),{saved:i<2}));
 const removed=evictable(rows,new Set(['2','3']),30,1e7);
 assert.equal(removed.length,8);assert(!removed.some(id=>['0','1','2','3'].includes(id)));
});
test('byte budget evicts large ordinary content, never saved',()=>{
 const rows=[article('1',{paragraphs:['😀'.repeat(1000)]}),article('2',{saved:true,paragraphs:['x'.repeat(5000)]}),article('3')];
 assert.deepEqual(evictable(rows,new Set(),30,1500),['1']);
});
test('category order survives invalid and duplicate ids, and includes all categories',()=>{
 const ids=categoryOrder(['food','food','invalid','science']);assert.equal(ids[0],'food');assert.equal(ids[1],'science');assert.equal(ids.length,CATEGORIES.length);
});
test('preview stays brief and continuation does not duplicate the introduction',()=>{
 const paragraphs=[intro,intro+' '+intro,'Il tramonto cambia il colore della luce che ci raggiunge.'],preview=makePreview(paragraphs,50);
 assert(preview.join(' ').split(/\s+/).length<=51);assert(!continuation(paragraphs,preview).includes(preview[0]));
 assert.deepEqual(continuation(['Una frase intera. Un seguito.'],['Una frase intera.']),['Un seguito.']);
});
test('format strips bibliography and excludes disambiguations',()=>{
 assert.equal(paragraphsFromExtract(intro+'\nBibliografia\n'+intro).length,1);
 assert.equal(generalAudienceScore('Lista di pianeti',[intro]),-1);
});
test('general audience filter uses catalogue content rather than a numeric title alone',()=>{
 assert.equal(generalAudienceScore('20546 Michaelfrühauf',[intro+' Il semiasse maggiore è indicato nel catalogo.']),-1);assert.equal(generalAudienceScore('NGC 1234',[intro+' La classificazione spettrale descrive la stella.']),-1);assert(generalAudienceScore('La Luna',[intro])>.45);assert(generalAudienceScore('2001: Odissea nello spazio',[intro])>.45);
});
test('search keeps API relevance ordering instead of page-id order',async()=>{
 const wiki=new Wikipedia(mock([page(100,'Secondo',2),page(200,'Primo',1)]));
 const rows=await wiki.search('cielo');assert.deepEqual(rows.map(a=>a.title),['Primo','Secondo']);assert.equal(rows[0].revision,900);
});
test('feed excludes already queued ids and never exceeds requested batch size',async()=>{
 const wiki=new Wikipedia(mock([page(1),page(2),page(3)]));const rows=await wiki.batch('science',new Set(['wiki:1']),2);assert.deepEqual(rows.map(a=>a.id),['wiki:2','wiki:3']);
});
test('random excludes the last pick and rejects unsuitable entries',async()=>{
 const wiki=new Wikipedia(mock([page(1),page(2,'Disambiguazione'),page(3)]));const a=await wiki.random(new Set(['wiki:1']));assert.equal(a.id,'wiki:3');
});
test('aborted search never reaches the network',async()=>{
 let called=false;const wiki=new Wikipedia(async()=>{called=true;return new Response('{}')});const abort=new AbortController();abort.abort();await assert.rejects(wiki.search('cielo',abort.signal));assert.equal(called,false);
});

test('cancelling while the response body downloads aborts the transport',async()=>{
 const abort=new AbortController();let transport;
 const wiki=new Wikipedia(async(_url,options)=>{transport=options.signal;return {ok:true,status:200,json:async()=>{abort.abort();return {query:{pages:[page(1)]}}}}});
 await assert.rejects(wiki.search('cielo',abort.signal));assert.equal(transport.aborted,true);
});

test('request timeout remains active until the response body completes',async()=>{
 const originalSet=global.setTimeout,originalClear=global.clearTimeout;let timeout,cleared=false,bodyStartedBeforeCleanup=false,transportAborted=false;
 global.setTimeout=(callback)=>{timeout=callback;return 123};global.clearTimeout=()=>{cleared=true};
 try{
  const wiki=new Wikipedia(async(_url,options)=>({ok:true,status:200,json:async()=>{bodyStartedBeforeCleanup=!cleared;timeout();transportAborted=options.signal.aborted;throw new Error('body interrupted')}}));
  await assert.rejects(wiki.search('cielo'),e=>e instanceof WikiError&&e.kind==='network');assert.equal(bodyStartedBeforeCleanup,true);assert.equal(transportAborted,true);assert.equal(cleared,true);
 }finally{global.setTimeout=originalSet;global.clearTimeout=originalClear}
});
test('malformed/API error is explicit, not an empty successful feed',async()=>{
 const wiki=new Wikipedia(async()=>new Response(JSON.stringify({error:{code:'badvalue',info:'Bad request'}})));await assert.rejects(wiki.search('cielo'),e=>e instanceof WikiError&&e.kind==='content');
});
test('offline search boosts title matches without any saved/cache preference',()=>{
 const rows=rankLocal('luce',[article('1',{title:'Altro',paragraphs:[intro],saved:true}),article('2',{title:'Luce'})]);assert.equal(rows[0].id,'2');
});
test('optional AI without credentials performs no request',async()=>{
 const {simplify}=require('../.test-build/simplifier.js');await assert.rejects(simplify([intro],''),/chiave Gemini/);
});
test('batched feed requests introductions; full reader omits the boolean exintro flag',async()=>{
 const requests=[];const wiki=new Wikipedia(async url=>{requests.push(new URL(url));return new Response(JSON.stringify({query:{pages:[page(1)]}}))});
 const rows=await wiki.batch('science',new Set(),1);await wiki.full(rows[0]);
 assert.equal(requests[0].searchParams.get('exintro'),'1');assert.equal(requests[0].searchParams.has('exchars'),false);assert.equal(requests[1].searchParams.has('exintro'),false);assert.equal(requests[1].searchParams.has('exchars'),false);assert.equal(requests[1].searchParams.get('pageid'),'1');
});

const {swipeTarget}=require('../.test-build/paging.js');
const {feedTrimCount}=require('../.test-build/paging.js');
test('long reading sessions keep a bounded feed and preserve the selected article when trimming',()=>{
 let feed=Array.from({length:8},(_,i)=>i),position=0,next=8;
 for(let i=0;i<1000;i++){
  position++;const selected=feed[position],remove=feedTrimCount(position);feed=feed.slice(remove);position-=remove;
  assert.equal(feed[position],selected);
  if(feed.length-position<=4)for(let j=0;j<6;j++)feed.push(next++);
  assert(feed.length<=33);assert(position>=0);
 }
});
const {parseSettings}=require('../.test-build/settings.js');

test('invalid persisted preferences recover without breaking startup or enabling AI',()=>{
 for(const input of ['{','null','[]','{"categories":null,"size":-2,"aiEnabled":"false","dark":1}']){
  const settings=parseSettings(input);assert.equal(settings.aiEnabled,false);assert.equal(settings.size,20);assert.equal(settings.themeMode,'automatic');assert.equal(settings.categories.length,CATEGORIES.length);
 }
 assert.deepEqual(parseSettings('{"size":23,"dark":true,"aiEnabled":true,"categories":["food","food",null]}'),{size:23,themeMode:'dark',aiEnabled:true,autoHideCategories:true,linkDiscoveries:true,categories:categoryOrder(['food'])});
});
test('category auto-hide defaults on for old settings and preserves explicit choices',()=>{
 for(const input of [null,'{}','{"autoHideCategories":"false"}','{"autoHideCategories":0}'])assert.equal(parseSettings(input).autoHideCategories,true);
 for(const enabled of [false,true]){
  const settings=parseSettings(JSON.stringify({autoHideCategories:enabled}));
  assert.equal(settings.autoHideCategories,enabled);
  assert.equal(parseSettings(JSON.stringify({...settings,size:23,dark:true})).autoHideCategories,enabled);
 }
});
test('fast and long swipes advance only one article',()=>{
 assert.equal(swipeTarget(3,-2600,-12000,800,12),4);
 assert.equal(swipeTarget(3,2600,12000,800,12),2);
 assert.equal(swipeTarget(3,-20,-900,800,12),4);
});
test('swipe thresholds distinguish a drag back from a flick; boundaries stay valid',()=>{
 assert.equal(swipeTarget(3,-50,-100,800,12),3);
 assert.equal(swipeTarget(3,300,-800,800,12),4); // Release follows the reversed flick.
 assert.equal(swipeTarget(3,-300,800,800,12),2);
 assert.equal(swipeTarget(3,300,-100,800,12),2);
 assert.equal(swipeTarget(0,0,0,800,0),0);
 assert.equal(swipeTarget(0,700,700,800,12),0);
 assert.equal(swipeTarget(11,-2000,-9000,800,12),11);
});
