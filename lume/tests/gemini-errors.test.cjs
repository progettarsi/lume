const {test}=require('node:test');const assert=require('node:assert/strict');
const {simplify,SimplificationError}=require('../.test-build/simplifier');
const {geminiClassifications,ClassificationError}=require('../.test-build/classification');

const article={id:'wiki:1',title:'Test',category:'science',paragraphs:['Un paragrafo completo con abbastanza parole per il test.'],preview:['Un paragrafo completo.'],complete:true,source:'https://it.wikipedia.org/wiki/Test',fetchedAt:1};

test('simplifier distinguishes HTTP 401/403, 400 with/without API_KEY_INVALID, 429 and 5xx',async()=>{
  const originalFetch=global.fetch;
  const SECRET_KEY='secret_user_gemini_key_12345';
  try{
    // 401 -> auth
    global.fetch=async()=>new Response('{}',{status:401});
    await assert.rejects(simplify(article.paragraphs,SECRET_KEY),err=>{
      assert(err instanceof SimplificationError);
      assert.equal(err.kind,'auth');
      assert.match(err.message,/non valida/);
      assert(!err.message.includes(SECRET_KEY));
      return true;
    });

    // 403 -> auth
    global.fetch=async()=>new Response('{}',{status:403});
    await assert.rejects(simplify(article.paragraphs,SECRET_KEY),err=>{
      assert(err instanceof SimplificationError);
      assert.equal(err.kind,'auth');
      return true;
    });

    // 400 without API_KEY_INVALID -> content (not auth)
    global.fetch=async()=>new Response(JSON.stringify({error:{message:'Invalid prompt argument'}}),{status:400});
    await assert.rejects(simplify(article.paragraphs,SECRET_KEY),err=>{
      assert(err instanceof SimplificationError);
      assert.notEqual(err.kind,'auth');
      assert.equal(err.kind,'content');
      assert.match(err.message,/Gemini ha rifiutato la richiesta\. Puoi riprovare\./);
      assert(!err.message.includes(SECRET_KEY));
      return true;
    });

    // 400 with API_KEY_INVALID -> auth
    global.fetch=async()=>new Response(JSON.stringify({error:{message:'API_KEY_INVALID'}}),{status:400});
    await assert.rejects(simplify(article.paragraphs,SECRET_KEY),err=>{
      assert(err instanceof SimplificationError);
      assert.equal(err.kind,'auth');
      assert.match(err.message,/non valida/);
      return true;
    });

    // 429 -> quota
    global.fetch=async()=>new Response('{}',{status:429});
    await assert.rejects(simplify(article.paragraphs,SECRET_KEY),err=>{
      assert(err instanceof SimplificationError);
      assert.equal(err.kind,'quota');
      return true;
    });

    // 503 -> network (momentaneamente non disponibile)
    global.fetch=async()=>new Response('{}',{status:503});
    await assert.rejects(simplify(article.paragraphs,SECRET_KEY),err=>{
      assert(err instanceof SimplificationError);
      assert.equal(err.kind,'network');
      assert.match(err.message,/momentaneamente non disponibile/);
      return true;
    });
  }finally{
    global.fetch=originalFetch;
  }
});

test('classification distinguishes HTTP 401/403, 400 with/without API_KEY_INVALID, 429 and 5xx without exposing key',async()=>{
  const originalFetch=global.fetch;
  const SECRET_KEY='secret_user_gemini_key_99999';
  const signal=new AbortController().signal;
  try{
    // 401 -> auth
    global.fetch=async()=>new Response('{}',{status:401});
    await assert.rejects(geminiClassifications([article],SECRET_KEY,signal),err=>{
      assert(err instanceof ClassificationError);
      assert.equal(err.kind,'auth');
      assert(!err.message.includes(SECRET_KEY));
      return true;
    });

    // 400 without API_KEY_INVALID -> content (not auth)
    global.fetch=async()=>new Response(JSON.stringify({error:{message:'Bad request'}}),{status:400});
    await assert.rejects(geminiClassifications([article],SECRET_KEY,signal),err=>{
      assert(err instanceof ClassificationError);
      assert.notEqual(err.kind,'auth');
      assert.equal(err.kind,'content');
      assert.match(err.message,/Gemini ha rifiutato la richiesta\. Puoi riprovare\./);
      assert(!err.message.includes(SECRET_KEY));
      return true;
    });

    // 400 with API_KEY_INVALID -> auth
    global.fetch=async()=>new Response(JSON.stringify({error:{message:'API_KEY_INVALID'}}),{status:400});
    await assert.rejects(geminiClassifications([article],SECRET_KEY,signal),err=>{
      assert(err instanceof ClassificationError);
      assert.equal(err.kind,'auth');
      assert(!err.message.includes(SECRET_KEY));
      return true;
    });

    // 429 -> quota
    global.fetch=async()=>new Response('{}',{status:429});
    await assert.rejects(geminiClassifications([article],SECRET_KEY,signal),err=>{
      assert(err instanceof ClassificationError);
      assert.equal(err.kind,'quota');
      return true;
    });

    // 500 -> network
    global.fetch=async()=>new Response('{}',{status:500});
    await assert.rejects(geminiClassifications([article],SECRET_KEY,signal),err=>{
      assert(err instanceof ClassificationError);
      assert.equal(err.kind,'network');
      return true;
    });
  }finally{
    global.fetch=originalFetch;
  }
});
