const {revisionInput}=require('../.test-build/revision.js');
const {test}=require('node:test');const assert=require('node:assert/strict');
const {hasRevision,readerContinuation,readerParagraphs,continuation}=require('../.test-build/text.js');
const {mergeArticle}=require('../.test-build/articleState.js');const {Wikipedia}=require('../.test-build/wikipedia.js');
const lead='La prima frase definisce il soggetto. La seconda spiega il contesto.';
const tail='Un approfondimento aggiunge i fatti principali senza ripetere la definizione.';
const a={id:'wiki:12',title:'Prova',category:'general',preview:[lead],paragraphs:[lead,tail],complete:true,textVersion:2,fetchedAt:1,source:'https://it.wikipedia.org/wiki/Prova',revision:4};
const revised={...a,simplified:[tail+' Un altro fatto completa la spiegazione.'],simplifiedVersion:3,simplifiedPreview:JSON.stringify(a.preview),simplifiedInput:revisionInput(a)};
test('reader preserves lead, uses only revised continuation, and ignores legacy or differently anchored revisions',()=>{
 assert(hasRevision(revised));assert.deepEqual(readerParagraphs(revised),[lead,...revised.simplified]);assert.deepEqual(revised.preview,a.preview);
 assert.deepEqual(readerContinuation({...revised,simplifiedVersion:undefined}),[tail]);assert(!hasRevision({...revised,preview:['Una nuova introduzione.']}));
});
test('cached continuation metadata survives preview and bookmark merges',()=>{
 const merged=mergeArticle(revised,{...a,complete:false,paragraphs:[lead]});assert(hasRevision(merged));assert.deepEqual(readerParagraphs(merged),readerParagraphs(revised));
 const incoming={...revised,simplified:undefined,simplifiedVersion:undefined,simplifiedPreview:undefined};assert(hasRevision(mergeArticle(revised,incoming)));
});
test('different paragraph grouping cannot repeat the already visible introduction',()=>{
 assert.deepEqual(continuation([lead+' '+tail],[lead]),[tail]);
 assert.deepEqual(continuation(['La prima frase definisce il soggetto.','La seconda spiega il contesto.',tail],[lead]),[tail]);
});
test('full Wikipedia download preserves the exact card introduction for the return animation',async()=>{
 const transport=async()=>new Response(JSON.stringify({parse:{text:'<div><p>'+lead+'</p><p>'+tail+'</p></div>',revid:5}}));
 const wiki=new Wikipedia(transport);const full=await wiki.full({...a,complete:false});assert.deepEqual(full.preview,a.preview);assert.deepEqual(full.paragraphs,[lead,tail]);assert.equal(full.revision,5);
});
