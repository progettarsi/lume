const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {CURATED_ARTICLES:rows}=require('../.test-build/curatedData'),{withCatalogue}=require('../.test-build/catalogue');
const {wordCount,isVerified,makeEdition,completeSentence}=require('../.test-build/edition');
const {offlineReserve}=require('../.test-build/feedAvailability'),{reserveArticles,RESERVE_TARGET}=require('../.test-build/reserve');
const {emptyLearning,identity,rankRecommendations}=require('../.test-build/recommendations');
const {AIPreparation}=require('../.test-build/aiPreparation');
const {libraryHarness}=require('./helpers/libraryHarness.cjs');
const reviews=require('../docs/DISCOVERY-CATALOGUE-REVIEW.json');

test('150 reviewed editions: balanced categories, complete briefs, unique sources and bound review hashes',()=>{
 assert.equal(rows.length,150);assert.equal(reviews.articles.length,150);const count={};const sources=new Set();
 for(const a of rows){assert(isVerified(a),a.title);assert(wordCount(a.preview.join(' '))>=40&&wordCount(a.preview.join(' '))<=80,a.title);assert(a.edition.continuation.length,a.title);assert(wordCount([...a.preview,...a.edition.continuation].join(' '))<=300);assert(a.preview.every(completeSentence));assert(a.provenance.revision>0);assert(a.provenance.license.includes('by-sa/4.0'));assert(a.edition.sourcePassages.length);assert(!sources.has(identity(a)),a.title);sources.add(identity(a));count[a.category]=(count[a.category]||0)+1;
 const report=reviews.articles.find(r=>r.reviewId===a.verification.reviewId);assert(report&&report.semanticReview!=='pending');assert.equal(report.editionSha256,crypto.createHash('sha256').update(a.verification.fingerprint).digest('hex'));assert(!isVerified({...a,source:a.source+'/altered'}));}
 assert(Object.keys(count).length>=10);assert(Object.values(count).every(n=>n>=8&&n<=30));
});

test('offline rotation reaches all 150 without mounting a 150-card feed or exhausting the reserve',()=>{const seen=new Set(),profile=emptyLearning();for(let i=0;i<5;i++){const batch=offlineReserve(rows,profile,seen);assert.equal(batch.length,30);for(const a of batch){assert(!seen.has(a.id),a.title);assert(isVerified(a));seen.add(a.id)}}assert.equal(seen.size,150);assert.equal(offlineReserve(rows,profile,seen).length,30);assert.equal(reserveArticles(rows,emptyLearning(),new Set()).length,RESERVE_TARGET)});

test('catalogue merge preserves old bookmarks/read state and discards stale rewrites only on approved editions',()=>{const a=rows[0],old={...a,verification:undefined,edition:undefined,saved:true,preview:['Vecchio testo salvato.'],paragraphs:['Vecchio testo salvato.']};assert.deepEqual(withCatalogue([old]).find(x=>x.id===a.id).preview,old.preview);const restored=withCatalogue([{...a,readAt:42,simplified:['Vecchia revisione.']}]).find(x=>x.id===a.id);assert.equal(restored.readAt,42);assert.equal(restored.simplified,undefined);assert(isVerified(restored));});

test('real library starts offline with catalogue without persisting all 150 entries',async()=>{const h=await libraryHarness({online:false,catalogue:true,rows:[]});try{assert(h.lib.ready);assert.equal(h.lib.cache.length,150);assert.equal(h.lib.getFeed('all').length,30);assert.equal(h.disk.rows.length,0);assert(h.lib.getFeed('all').every(isVerified));await h.lib.read(h.lib.getFeed('all')[0]);await h.flush();assert(h.disk.rows.length<150);assert.equal(h.lib.cache.length,150)}finally{h.dispose()}});

test('30 dynamic/problematic cases keep complete meaning boundaries and never truncate a sentence',()=>{const cases=require('./fixtures/discovery/dynamic-cases.json'),report=[];let admitted=0,ideal=0;assert.equal(cases.length,30);for(const c of cases){const a=makeEdition(c.article);if(c.expect==='reject')assert.equal(a,undefined,c.name);else{assert(a,c.name);admitted++;const words=wordCount(a.preview.join(' '));if(words>=40&&words<=80)ideal++;assert(words<=120,c.name);assert(a.preview.every(completeSentence));for(const p of a.edition.sourcePassages)assert(c.article.paragraphs.join(' ').includes(p),c.name)}report.push({name:c.name,expected:c.expect,admitted:!!a,words:a?wordCount(a.preview.join(' ')):0})}assert(ideal/admitted>=.8);});

test('unpublished Gemini preparation shares speculative allowance and never rewrites verified editions',async()=>{const ai=new AIPreparation(async a=>a,async()=>[],async()=>{});ai.configure('fixture',true);let n=0;const make=async a=>{n++;return a};await ai.prepareDiscovery(rows[0],new AbortController().signal,make);assert.equal(n,0);for(let i=0;i<3;i++)await ai.prepareDiscovery({...rows[i],verification:undefined},new AbortController().signal,make);assert.equal(n,2);});

test('changing Gemini settings invalidates an unpublished response and quota errors preserve the original',async()=>{let finish;const ai=new AIPreparation(async a=>a,async()=>[],async()=>{}),a={...rows[0],verification:undefined};ai.configure('fixture',true);const p=ai.prepareDiscovery(a,new AbortController().signal,()=>new Promise(r=>finish=r));ai.configure('',false);finish({...a,preview:['Late rewrite.']});assert.equal(await p,a);ai.configure('fixture',true);const {SimplificationError}=require('../.test-build/simplifier');assert.equal(await ai.prepareDiscovery(a,new AbortController().signal,async()=>{throw new SimplificationError('Quota','quota')}),a);assert(!ai.canPrepare({...rows[1],verification:undefined}));});


test('discovery rewrite uses source-only input, leaves original untouched, rejects incomplete output and skips verified text',async()=>{
 const {rewriteDiscovery}=require('../.test-build/discoveryAI'),a={...rows[0],verification:undefined},original=JSON.stringify(a),before=global.fetch;let calls=0,body;let paragraphs=[...a.preview,...a.edition.continuation];
 global.fetch=async(url,options)=>{calls++;body=JSON.parse(options.body);return {ok:true,status:200,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({paragraphs})}]}}]})}};
 try{const b=await rewriteDiscovery(a,'fixture-key',new AbortController().signal);assert.notEqual(b,a);assert.equal(JSON.stringify(a),original);assert.deepEqual(b.preview,a.preview);assert.equal(b.verification,undefined);assert(body.systemInstruction.parts[0].text.includes('ESCLUSIVAMENTE'));assert(JSON.parse(body.contents[0].parts[0].text).sourceText.length>0);
 await rewriteDiscovery(rows[0],'fixture-key',new AbortController().signal);assert.equal(calls,1);
 paragraphs=['Frammento troppo corto.'];await assert.rejects(()=>rewriteDiscovery(a,'fixture-key',new AbortController().signal));
 const c=new AbortController();c.abort();assert.equal(await rewriteDiscovery(a,'fixture-key',c.signal),a);assert.equal(calls,2);
 }finally{global.fetch=before}
});
