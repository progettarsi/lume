const {test}=require('node:test'),assert=require('node:assert/strict');
const {libraryHarness}=require('./helpers/libraryHarness.cjs');
test('warm category entry reuses its published feed and preserves its ordered prefix',async()=>{
 const h=await libraryHarness({catalogue:true});
 try{h.lib.setDiscovery(false);h.lib.enterCategory('science');await h.flush();const first=h.lib.getFeed('science');assert(first.length);
  for(let i=0;i<100;i++)h.lib.enterCategory('science');await h.flush();assert.strictEqual(h.lib.getFeed('science'),first);
  h.lib.enterCategory('nature');await h.flush();h.lib.enterCategory('science');await h.flush();assert.strictEqual(h.lib.getFeed('science'),first);
 }finally{h.dispose()}
});
