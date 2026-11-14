const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');
const {paragraphsFromHtml}=require('../.test-build/html.js');

test('mwe-math-element in descendant elements omits the entire paragraph without serializing',()=>{
  const html='<p>Paragrafo valido senza formule.</p><p>Paragrafo con <span class="mwe-math-element"><span class="mwe-math-mathml-inline">x=2</span></span> che deve essere scartato.</p><p>Altro paragrafo valido di spiegazione.</p>';
  const paragraphs=paragraphsFromHtml(html);
  assert.deepEqual(paragraphs,['Paragrafo valido senza formule.','Altro paragrafo valido di spiegazione.']);
});

test('depth beyond 200 is safely ignored without throwing stack overflow',()=>{
  let deeplyNested='Contenuto profondo che supera il limite di profondita consentito.';
  for(let i=0;i<210;i++)deeplyNested=`<span>${deeplyNested}</span>`;
  const html=`<p>${deeplyNested}</p><p>Testo normale di lunghezza sufficiente con punto finale.</p>`;
  // text() and walk() should not throw RangeError and should prune at depth 200
  let paragraphs;
  assert.doesNotThrow(()=>{paragraphs=paragraphsFromHtml(html);});
  assert.deepEqual(paragraphs,['Testo normale di lunghezza sufficiente con punto finale.']);
});

test('azotus.json fixture extract remains consistent',()=>{
  const fixture=JSON.parse(fs.readFileSync('tests/fixtures/azotus.json','utf8'));
  const page=fixture.query.pages[0];
  assert.ok(page.extract);
  assert.equal(page.title,'Azotus');
});
