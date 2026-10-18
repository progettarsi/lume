const {test}=require('node:test'),assert=require('node:assert/strict');
const {paragraphsFromHtml,paragraphsFromHtmlAsync}=require('../.test-build/html');
const {rankRecommendations,rankRecommendationsAsync,emptyLearning}=require('../.test-build/recommendations');
const {CURATED_ARTICLES}=require('../.test-build/curatedData');
test('allocation-free byte accounting matches UTF-8 for accents, astral characters and lone surrogates',()=>{
 const {articleBytes}=require('../.test-build/cache');
 for(const title of ['Scoperta italiana','Città è più','🌗 📚','\ud800']){const a={id:title,title,preview:[title]};assert.equal(articleBytes(a),Buffer.byteLength(JSON.stringify(a)));assert.equal(articleBytes(a),Buffer.byteLength(JSON.stringify(a)))}
});
test('streaming semantic parser agrees across scheduling, entities, ignored branches and quoted tag attributes',async()=>{
 const html='<div><script>const hidden="<p>Questo testo non va letto.</p>";</script><p data-label="a > b">La luce &egrave; energia e si diffonde nell’aria.<br>Una spiegazione completa.</p><table>'+('<tr><td><p>Ignorato.</p></td></tr>'.repeat(50000))+'</table><h2>Storia</h2><p>Una spiegazione storica sufficientemente chiara.</p><p>Formula <span class="mwe-math-element">x</span> da escludere.</p></div>';
 const expected=['La luce è energia e si diffonde nell’aria. Una spiegazione completa.','Una spiegazione storica sufficientemente chiara.'];
 assert.deepEqual(paragraphsFromHtml(html),expected);
 let yielded=false;setTimeout(()=>yielded=true,0);assert.deepEqual(await paragraphsFromHtmlAsync(html),expected);assert(yielded);
});
test('large parsing aborts between batches and never publishes a partial edition',async()=>{
 const abort=new AbortController(),html='<table>'+('<tr><td>Ignorato</td></tr>'.repeat(200000))+'</table><p>Questa frase non deve essere consegnata.</p>';
 const pending=paragraphsFromHtmlAsync(html,abort.signal);setTimeout(()=>abort.abort(Error('cancelled')),0);await assert.rejects(pending,/cancelled/);
});
test('incremental ranking preserves the exact synchronous order, including diversity and consumed aliases',async()=>{
 const rows=CURATED_ARTICLES,learning={...emptyLearning(),seen:rows.slice(0,5).map(a=>a.id)};
 const sync=rankRecommendations(rows,learning,()=>.5,rows.slice(10,13),0,64);
 const asyncRows=await rankRecommendationsAsync(rows,learning,()=>.5,rows.slice(10,13),64);
 assert.deepEqual(asyncRows.map(a=>a.id),sync.map(a=>a.id));
 const abort=new AbortController();abort.abort(Error('obsolete'));await assert.rejects(rankRecommendationsAsync(rows,learning,()=>.5,[],64,abort.signal),/obsolete/);
});
