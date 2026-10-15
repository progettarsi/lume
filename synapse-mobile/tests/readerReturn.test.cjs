const {test}=require('node:test');const assert=require('node:assert/strict');
const {returnDisposition,localReturnReorder,nearReturn,returnFinished,exitCut}=require('../.test-build/readerReturn');
const rows=Array.from({length:500},(_,i)=>({id:String(i)}));
test('a visit can move to an offscreen first position without changing the measured opening endpoint',()=>{
 const id='450',latest=[rows[450],...rows.filter(a=>a.id!==id)];
 assert.equal(returnDisposition(rows,latest,id),'moved');
 assert.equal(localReturnReorder(rows,latest,id),true);
 assert.equal(rows[450].id,id);
});
test('bottom-up exit retains legible lines in a deep viewport until the native return brings the preview back',()=>{
 const start=500,viewport=700;
 for(const scroll of [7000,3500,800]){
   const top=scroll-start,cut=exitCut(8000,scroll,viewport,start,1,30);
   assert.equal(cut,top+90);
   assert.ok(cut>top);
 }
 assert.equal(exitCut(8000,0,viewport,start,1,30),0);
 assert.equal(exitCut(8000,7000,viewport,start,0,30),7200);
 assert.equal(exitCut(0,7000,viewport,start,1,30),0);
});
test('removed saved row has an explicit handoff; unrelated result changes do not trigger a long layout animation',()=>{
 assert.equal(returnDisposition(rows,rows.filter(a=>a.id!=='450'),'450'),'removed');
 assert.equal(localReturnReorder(rows,rows.filter(a=>a.id!=='450'),'450'),true);
 assert.equal(localReturnReorder(rows,rows.slice(0,20),'450'),false);
 assert.equal(returnDisposition(rows,[...rows],'450'),'attached');
});
test('visual handoff and unmount require scroll to have returned, and use different endpoints',()=>{
 assert.equal(nearReturn(.11,4000),false);
 assert.equal(nearReturn(.13,0),false);
 assert.equal(nearReturn(.11,0),true);
 assert.equal(returnFinished(.002,0),false);
 assert.equal(returnFinished(.001,0),true);
 assert.equal(returnFinished(.0005,0),true);
 assert.equal(returnFinished(0,4000),false);
 assert.equal(returnFinished(0,0),true);
});
