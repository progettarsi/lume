const {test}=require('node:test');const assert=require('node:assert/strict');
const {revealFrontier,reflowFrontier}=require('../.test-build/reveal');
test('initial viewport preserves the sweep; fast scroll reveals its whole viewport and half a screen ahead',()=>{
 assert.equal(revealFrontier(0,40,8000,700,500,700,30,false,false),40);
 assert.equal(revealFrontier(40,70,8000,5700,500,700,30,true,false),5550);
});
test('returning upward, reopen and an unrelated update cannot rewind the frontier',()=>{
 const first=revealFrontier(0,70,8000,5700,500,700,30,true,false);
 assert.equal(revealFrontier(first,100,8000,700,500,700,30,true,false),first);
 assert.equal(revealFrontier(first,0,8000,700,500,700,30,false,false),first);
});
test('reflow exposes available text instead of hiding previously read lines; reduced motion bypasses the effect',()=>{
 assert.equal(reflowFrontier(400,800,1200),1200);
 assert.equal(reflowFrontier(800,800,1200),1200);
 assert.equal(reflowFrontier(0,0,1200),0);
 assert.equal(reflowFrontier(400,800,800),400);
 assert.equal(revealFrontier(0,0,8000,700,500,700,34.5,false,true),8000);
});
test('short or not-yet-downloaded continuation has no invented hidden height',()=>{
 assert.equal(revealFrontier(0,0,0,5000,500,700,30,true,false),0);
 assert.equal(revealFrontier(0,0,80,5000,500,700,30,true,false),80);
});
