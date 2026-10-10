const {test}=require('node:test'),assert=require('node:assert/strict');
const {BookmarkWriter,removalArmed,settleDuration}=require('../.test-build/bookmark');
test('removal follows current distance, disarms on reversal and never uses velocity to cross the threshold',()=>{
 for(const width of [240,360,720]){assert(!removalArmed(-width*.41,width));assert(removalArmed(-width*.43,width));assert(!removalArmed(-width*.2,width));assert(!removalArmed(12,width))}
 assert(!removalArmed(-100,0));assert(settleDuration(300,9000)>=110);assert(settleDuration(300,20)<=210);
});
test('remove and undo persist in order, retaining the latest optimistic intent',async()=>{
 const writer=new BookmarkWriter(),writes=[];let visible=true,release;const gate=new Promise(r=>release=r),apply=v=>visible=v;
 const remove=writer.set('a',false,true,async()=>{await gate;writes.push(false)},apply);
 const undo=writer.set('a',true,false,async()=>{writes.push(true)},apply);assert.equal(visible,true);release();await Promise.all([remove,undo]);assert.deepEqual(writes,[false,true]);assert.equal(visible,true);
});
test('two failures roll back to durable saved state, not the failed optimistic removal',async()=>{
 const writer=new BookmarkWriter();let visible=true;const fail=async()=>{throw Error('disk')},apply=v=>visible=v;
 const outcomes=await Promise.allSettled([writer.set('a',false,true,fail,apply),writer.set('a',true,false,fail,apply)]);
 assert(outcomes.every(r=>r.status==='rejected'));assert.equal(visible,true);
});
test('failed undo restores the successful durable removal, without blocking another article',async()=>{
 const writer=new BookmarkWriter(),visible={a:true,b:true},apply=id=>v=>visible[id]=v;
 await writer.set('a',false,true,async()=>{},apply('a'));
 await assert.rejects(writer.set('a',true,false,async()=>{throw Error('disk')},apply('a')));assert.equal(visible.a,false);
 await writer.set('b',false,true,async()=>{},apply('b'));assert.equal(visible.b,false);
 await writer.set('a',true,false,async()=>{},apply('a'));assert.equal(visible.a,true);
});
test('a late failure cannot overwrite a newer successful save',async()=>{
 const writer=new BookmarkWriter();let visible=true,release;const gate=new Promise(r=>release=r),apply=v=>visible=v;
 const remove=writer.set('a',false,true,async()=>{await gate;throw Error('disk')},apply);
 const save=writer.set('a',true,false,async()=>{},apply);release();await Promise.allSettled([remove,save]);assert.equal(visible,true);
});
