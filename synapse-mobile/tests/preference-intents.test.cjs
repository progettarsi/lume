const {test}=require('node:test'),assert=require('node:assert/strict');
const {LatestWrite}=require('../.test-build/latestWrite');
const {libraryHarness}=require('./helpers/libraryHarness.cjs');
test('slow preference storage has one pending latest snapshot and preserves the final value after an older failure',async()=>{
 const writes=[],errors=[];let finish;
 const writer=new LatestWrite(value=>{writes.push(value);return new Promise((resolve,reject)=>finish={resolve,reject})},e=>errors.push(e));
 writer.submit(0);for(let i=1;i<=1000;i++)writer.submit(i);assert.deepEqual(writes,[0]);
 finish.reject(Error('old write'));await new Promise(setImmediate);assert.equal(errors.length,1);assert.deepEqual(writes,[0,1000]);finish.resolve();await new Promise(setImmediate);
 writer.submit(1001);assert.deepEqual(writes,[0,1000,1001]);finish.resolve();
});
test('preference intents compose synchronously before React rerenders and duplicate selections do not grow the disk queue',async()=>{
 const h=await libraryHarness({online:false});
 try{
  const initial=h.lib.currentSettings().autoHideCategories;
  for(let i=0;i<1001;i++)h.lib.updateSettings(old=>({autoHideCategories:!old.autoHideCategories}));
  assert.equal(h.lib.currentSettings().autoHideCategories,!initial);
  h.lib.updateSettings({size:23});h.lib.updateSettings({size:20});
  for(let i=0;i<1000;i++)h.lib.updateSettings({size:20});
  await h.flush();assert.equal(h.lib.settings.size,20);assert.equal(h.disk.settings.size,20);assert.equal(h.disk.settings.autoHideCategories,!initial);assert(h.calls.putSettings<=3);
 }finally{h.dispose()}
});
