const {revisionInput}=require('../.test-build/revision.js');
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const {Wikipedia}=require('../.test-build/wikipedia');
const {paragraphsFromExtract,generalAudienceScore,readerContinuation,readerParagraphs,makePreview}=require('../.test-build/text');
const {simplify}=require('../.test-build/simplifier');
const intro='La luce del Sole contiene diversi colori. Le molecole dell’atmosfera diffondono la luce in tutte le direzioni e le lunghezze d’onda più corte vengono diffuse maggiormente. Per questo il cielo appare blu.';
const a={id:'wiki:2447890',title:'Azotus',category:'general',source:'https://it.wikipedia.org/wiki/Azotus',preview:[],paragraphs:[],fetchedAt:1};
test('real Azotus source cannot become contextless Gaza/Ashdod fragments',()=>{
 const page=JSON.parse(fs.readFileSync('tests/fixtures/azotus.json','utf8')).query.pages[0];
 assert.deepEqual(paragraphsFromExtract(page.extract),[]);
 assert.equal(generalAudienceScore('Azotus',page.extract.split('\n').slice(2).filter(Boolean)),-1);
});
test('empty disambiguation pageprop rejects feed and search even when prose looks suitable',async()=>{
 let params;
 const wiki=new Wikipedia(async url=>{params=new URL(url).searchParams;return new Response(JSON.stringify({query:{pages:[{pageid:1,title:'Il cielo',extract:intro,pageprops:{disambiguation:''}}]}}))});
 assert.deepEqual(await wiki.search('cielo'),[]);assert(params.get('prop').includes('pageprops'));assert.equal(params.get('ppprop'),'disambiguation');
});
test('cached disambiguation cannot be marked complete on a full fetch',async()=>{
 const wiki=new Wikipedia(async()=>new Response(JSON.stringify({parse:{text:'<div><p>'+intro+'</p></div>',revid:3,properties:[{name:'disambiguation',value:''}]}})));
 await assert.rejects(wiki.full(a),/disambiguazione/);
});
test('empty or contextless full responses fail rather than pretending a preview is complete',async()=>{
 const wiki=new Wikipedia(async()=>new Response(JSON.stringify({query:{pages:[{pageid:1,title:'Prova',extract:'Una definizione lasciata a metà:'}]}})));
 await assert.rejects(wiki.full(a),/insufficiente|introduzione/);
});
test('editorial word limit applies to classic and cached AI editions, ending at a sentence',()=>{
 const sentence='Questa frase completa contiene dieci parole per spiegare questo fatto.';
 const full={...a,title:'Prova',preview:[sentence],paragraphs:[sentence,...Array.from({length:200},()=>Array.from({length:5},()=>sentence).join(' '))],complete:true};
 const all=readerParagraphs(full);assert(all.join(' ').split(/\s+/).length<=1100);assert(all.at(-1).endsWith('.'));
 const ai={...full,simplified:full.paragraphs,simplifiedVersion:3,simplifiedPreview:JSON.stringify(full.preview),simplifiedInput:revisionInput(full)};assert(readerParagraphs(ai).join(' ').split(/\s+/).length<=1100);
 assert.deepEqual(makePreview(['parola '.repeat(1200)+'.'],1100,24,true),[]);
});
test('Gemini continuation is applied immediately, preserves the preview and caps excessive output',async()=>{
 const original=global.fetch;const sentence='Questo approfondimento chiarisce il contesto usando soltanto informazioni della fonte.';
 global.fetch=async()=>new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({paragraphs:[Array.from({length:70},()=>sentence).join(' ')]})}]}}]}));
 try{const result=await simplify([sentence],'key',undefined,'Prova',[intro]);assert(result.join(' ').split(/\s+/).length<=350);const edition={...a,title:'Prova',preview:[intro],complete:true,simplified:result,simplifiedVersion:3,simplifiedPreview:JSON.stringify([intro])};edition.simplifiedInput=revisionInput(edition);assert.deepEqual(readerContinuation(edition),result);assert.deepEqual(readerParagraphs(edition),[intro,...result]);}finally{global.fetch=original}
});
test('formatversion 2 parse properties use an object, including empty disambiguation values',async()=>{
 const a={id:'wiki:1',title:'Il cielo',source:'https://it.wikipedia.org/wiki/Cielo',preview:['Il cielo appare blu.'],paragraphs:['Il cielo appare blu.'],fetchedAt:1,category:'science'};
 for(const properties of [{}, {displaytitle:'Il cielo'}]){const w=new Wikipedia(async()=>new Response(JSON.stringify({parse:{text:'<div><p>Il cielo appare blu.</p><p>Le molecole diffondono i colori della luce.</p></div>',properties}})));assert((await w.full(a)).complete)}
 const w=new Wikipedia(async()=>new Response(JSON.stringify({parse:{text:'<p>Il cielo appare blu.</p>',properties:{disambiguation:''}}})));await assert.rejects(w.full(a),/disambiguazione/);
});
