const {test}=require('node:test');const assert=require('node:assert/strict');
const {emptyLearning,learn,seenArticle,rankRecommendations,chooseCategory,personalizedCategories,parseLearning}=require('../.test-build/recommendations.js');
const {paragraphsFromHtml}=require('../.test-build/html.js');
const {paragraphsFromExtract,makePreview,continuation}=require('../.test-build/text.js');
const {simplify}=require('../.test-build/simplifier.js');
const {databaseQueue}=require('../.test-build/databaseQueue.js');
const a={id:'wiki:1',title:'Bioluminescenza marina',category:'nature',source:'https://it.wikipedia.org/wiki/Bioluminescenza',paragraphs:['La bioluminescenza è la produzione di luce da parte di organismi viventi. Questa luce deriva da una reazione chimica che avviene negli organismi.'],preview:[],fetchedAt:1};
const intro='La bioluminescenza è la produzione di luce da parte di organismi viventi.';
test('semantic HTML preserves lead and inline text, excludes tables, citations and navigation',()=>{
 const html=`<div class="mw-parser-output"><div class="hatnote"><p>Da non leggere, spiegazione di navigazione.</p></div><table><tr><td><p>Una didascalia che non fa parte del testo.</p></td></tr></table><p>La <b>bioluminescenza</b> è la produzione di luce da parte di organismi viventi.<sup class="reference">[1]</sup></p><h2>Origine</h2><p>La luce deriva da una reazione chimica negli organismi.</p><h2>Note</h2><ol><li>Una fonte non va mescolata alla narrazione.</li></ol><h2>Bibliografia</h2><p>Una pubblicazione che non è testo divulgativo.</p></div>`;
 assert.deepEqual(paragraphsFromHtml(html),[intro,'La luce deriva da una reazione chimica negli organismi.']);
});
test('short definitions survive, headings and auxiliary subsections never become prose',()=>{
 const text=intro+'\nLa luce è fredda.\n== Formula ==\nUna derivazione tecnica che non serve alla lettura quotidiana.\n=== Dettagli ===\nAltri dettagli tecnici non utili per il pubblico generale.\n== In natura ==\nLe lucciole emettono luce per comunicare fra loro.';
 assert.deepEqual(paragraphsFromExtract(text),[intro,'La luce è fredda.','Le lucciole emettono luce per comunicare fra loro.']);
 assert.deepEqual(paragraphsFromExtract('Il cielo appare blu. La sua luce dipende dall’atmosfera.'),['Il cielo appare blu. La sua luce dipende dall’atmosfera.']);
});
test('HTML entities decoded; paragraphs missing mathematical expressions omitted as a unit',()=>{
 assert.deepEqual(paragraphsFromHtml('<p>La luce &egrave; prodotta dagli organismi&nbsp;viventi.</p><p>Il risultato si ottiene da <math>x=1</math> e cambia sempre.</p><p><img src="geroglifico.png"/> per indicare una parola su questa pietra.</p>'),['La luce è prodotta dagli organismi viventi.']);
});
test('previews end on complete sentences and never resume with a chopped word',()=>{
 const p=['Questa è la prima frase. Questa seconda frase spiega il contesto con tutti i dettagli necessari.'];const preview=makePreview(p,8);
 assert.deepEqual(preview,['Questa è la prima frase.']);assert.deepEqual(continuation(p,preview),['Questa seconda frase spiega il contesto con tutti i dettagli necessari.']);
 assert(!makePreview([intro.repeat(1000)],1800,24).join('').endsWith('…'));
});
test('permanent seen ledger survives cache eviction, aliases and ranking',()=>{
 const profile=learn(emptyLearning(),a,'open');const seed={...a,id:'seed:light',source:'https://it.wikipedia.org/wiki/Bioluminescenza'};
 assert(seenArticle(seed,profile));assert.equal(rankRecommendations([seed,a,{...a,id:'wiki:2',source:'https://it.wikipedia.org/wiki/Lucciole'}],profile).length,1);
 assert(seenArticle(a,parseLearning(JSON.stringify(profile))));
});
test('saves weigh more than a quick opening, and category order follows interests',()=>{
 let profile=learn(emptyLearning(),a,'open');const opened=profile.categories.nature;
 profile=learn(profile,{...a,category:'geography'},'save');
 assert(profile.categories.geography>opened*10);assert.equal(personalizedCategories(profile)[0],'geography');
});
test('exploration still samples every category under extreme preferences',()=>{
 const profile={...emptyLearning(),categories:{geography:1e6}};const selected=new Set(Array.from({length:1000},(_,i)=>chooseCategory(profile,()=>i/1000)));
 assert(selected.has('geography'));assert(selected.has('curiosity'));assert(selected.has('nature'));assert(selected.size>=12);
});
test('elapsed calendar time does not infer changing reading preferences',()=>{
 const now=Date.now();const profile={...emptyLearning(),updatedAt:now-30*86400000,categories:{geography:10},topics:Object.fromEntries(Array.from({length:300},(_,i)=>['topic'+i,1]))};
 const next=learn(profile,a,'open',now);assert.equal(next.categories.geography,10);
 assert.deepEqual(parseLearning('{broken').seen,[]);
});
test('encountered feed cards are excluded, and removing a bookmark cancels its preference boost',()=>{
 let profile=learn(emptyLearning(),a,'seen');assert(seenArticle(a,profile));
 const base=profile.categories.nature||0;profile=learn(profile,a,'save');profile=learn(profile,a,'unsave');assert(Math.abs(profile.categories.nature-base)<.001);
});
test('diverse ranking avoids three same-category cards if alternatives exist',()=>{
 const rows=Array.from({length:8},(_,i)=>({...a,id:'wiki:'+i,source:'https://it.wikipedia.org/wiki/'+i,category:i<6?'nature':'food'}));const output=rankRecommendations(rows,emptyLearning(),()=>.5);
 assert.equal(output[2].category,'food');assert.equal(output.length,8);
});
test('Gemini uses structured output, title context and trimmed secret header',async()=>{
 const original=global.fetch;let sent;
 global.fetch=async(_,options)=>{sent=JSON.parse(options.body);assert.equal(options.headers['x-goog-api-key'],'key');return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({paragraphs:[intro,intro,intro]})}]}}]}))};
 try{assert.equal((await simplify(a.paragraphs,' key ',undefined,a.title,[intro])).length,3);assert.equal(sent.generationConfig.responseMimeType,'application/json');assert.equal(JSON.parse(sent.contents[0].parts[0].text).title,a.title);assert.equal(sent.generationConfig.thinkingConfig.thinkingLevel,'minimal');assert.equal(JSON.parse(sent.contents[0].parts[0].text).immutableIntroduction,intro);assert.equal(sent.generationConfig.responseSchema.properties.paragraphs.minItems,1)}finally{global.fetch=original}
});
test('Gemini distinguishes invalid key, quota, unfinished and malformed responses',async()=>{
 const original=global.fetch;
 try{
  for(const [status,message] of [[403,/non valida/],[429,/Quota/],[503,/momentaneamente/]]){global.fetch=async()=>new Response('{}',{status});await assert.rejects(simplify(a.paragraphs,'key'),message)}
  global.fetch=async()=>new Response(JSON.stringify({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'cut off'}]}}]}));await assert.rejects(simplify(a.paragraphs,'key'),/completato/);
  global.fetch=async()=>new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:'broken'}]}}]}));await assert.rejects(simplify(a.paragraphs,'key'),/non leggibile/);
 }finally{global.fetch=original}
});
test('cancellation after Gemini response does not leak into another reader',async()=>{
 const original=global.fetch;const abort=new AbortController();global.fetch=async()=>({ok:true,json:async()=>{abort.abort();return {}}});
 try{assert.equal(await simplify(a.paragraphs,'key',abort.signal),undefined)}finally{global.fetch=original}
});
test('missing Gemini model falls back only to the explicit free-tier model allowlist',async()=>{
 const original=global.fetch;const urls=[];
 global.fetch=async url=>{urls.push(url);return url.includes('gemini-3.1-flash-lite')?new Response('{}',{status:404}):new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({paragraphs:[intro,intro,intro]})}]}}]}))};
 try{assert.equal((await simplify(a.paragraphs,'key')).length,3);assert.equal(urls.length,2);assert(urls.every(url=>/models\/gemini-3\.(?:1|5)-flash-lite:generateContent$/.test(url)))}finally{global.fetch=original}
});
test('database serializes mixed readers and writers and opens only one connection',async()=>{
 let opens=0,active=0,max=0;const run=databaseQueue(async()=>({id:++opens}),async()=>{});
 await Promise.all(Array.from({length:60},(_,i)=>run(async db=>{active++;max=Math.max(max,active);await Promise.resolve();assert.equal(db.id,1);active--;return i})));
 assert.equal(opens,1);assert.equal(max,1);
});
test('database retries an invalid native handle once with a fresh connection',async()=>{
 let opens=0,closes=0;const run=databaseQueue(async()=>({id:++opens}),async()=>{closes++});
 const result=await run(async db=>{if(db.id===1)throw Error("Call to function 'NativeDatabase.prepareAsync' has been rejected: java.lang.NullPointerException");return db.id});
 assert.equal(result,2);assert.equal(opens,2);assert.equal(closes,1);assert.equal(await run(async db=>db.id),2);
});
test('database propagates unrelated failures without endless retries or resetting data',async()=>{
 let opens=0;const run=databaseQueue(async()=>({id:++opens}),async()=>{});await assert.rejects(run(async()=>{throw Error('constraint failed')}),/constraint/);assert.equal(opens,1);assert.equal(await run(async db=>db.id),1);
});
