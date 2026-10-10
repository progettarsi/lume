const {test}=require('node:test');const assert=require('node:assert/strict');
const {mergeArticle,serialWrites}=require('../.test-build/articleState.js');
const a={id:'wiki:1',title:'A',category:'science',paragraphs:['intro'],preview:['intro'],source:'https://it.wikipedia.org/wiki/A',fetchedAt:1};
test('a completed download cannot resurrect a removed bookmark',()=>{
 const local={...a,saved:false,readAt:10};const stale={...a,saved:true,complete:true,paragraphs:['full']};
 assert.equal(mergeArticle(local,stale).saved,false);assert.equal(mergeArticle(local,stale).readAt,10);
 assert.equal(mergeArticle({...local,saved:true},{...a,saved:false}).saved,true);
});
test('opening a preview never downgrades a complete cached article',()=>{
 const full={...a,complete:true,paragraphs:['full'],simplified:['simple'],saved:true};
 const result=mergeArticle(full,a);assert.deepEqual(result.paragraphs,['full']);assert.deepEqual(result.simplified,['simple']);assert.equal(result.complete,true);
});
test('rapid save and unsave writes finish in user order, even after a failure',async()=>{
 const enqueue=serialWrites(),order=[];let release;const gate=new Promise(resolve=>release=resolve);
 const first=enqueue(async()=>{await gate;order.push('save');throw Error('failed')});
 const second=enqueue(async()=>{order.push('unsave');return false});
 const failed=assert.rejects(first,/failed/);release();await failed;assert.equal(await second,false);assert.deepEqual(order,['save','unsave']);
});
test('an already cancelled optional AI request performs no network call',async()=>{
 const {simplify}=require('../.test-build/simplifier.js');const abort=new AbortController();abort.abort();
 const original=globalThis.fetch;let requests=0;globalThis.fetch=async()=>{requests++;throw Error('unexpected')};
 try{assert.equal(await simplify(['test'],'key',abort.signal),undefined);assert.equal(requests,0)}finally{globalThis.fetch=original}
});
