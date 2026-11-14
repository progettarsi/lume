const {test}=require('node:test');
const assert=require('node:assert/strict');
const {ProfileIdentitySession}=require('../.test-build/profileIdentity');
const {OnboardingController,initialOnboarding}=require('../.test-build/onboarding');

function fixture(){
 const state=initialOnboarding({preferenceKeys:[],visits:0,saved:0,read:0});state.completed=true;state.stage='home';state.profile={name:'Ada',photoUri:'local:old'};state.draft={name:'Ada',photoUri:'local:old',interests:['science']};
 const writes=[],removed=[];let fail=false,next=0;
 const c=new OnboardingController(state,async s=>{if(fail)throw Error('disk');writes.push(s)});
 const port={pick:async()=>({kind:'picked',uri:'picker:source',width:800,height:600}),copy:async()=>`local:new-${++next}`,remove:async uri=>removed.push(uri),exists:async()=>true};
 const refs=()=>[c.state.profile.photoUri,c.state.draft.photoUri].filter(Boolean);
 const edit=()=>new ProfileIdentitySession(port,refs,identity=>c.profile(identity),c.state.profile);
 return {c,port,writes,removed,edit,setFail:value=>fail=value};
}
test('profile name and photo remain drafts until one atomic durable save',async()=>{
 const f=fixture(),s=f.edit();s.setName('  Sofia  ');await s.pick();
 assert.deepEqual(f.c.state.profile,{name:'Ada',photoUri:'local:old'});assert.equal(f.writes.length,0);assert.deepEqual(f.removed,[]);
 assert.equal(await s.save(),true);assert.equal(f.writes.length,1);assert.deepEqual(f.c.state.profile,{name:'Sofia',photoUri:'local:new-1'});assert.deepEqual(f.c.state.draft.interests,['science']);assert.equal(f.c.state.draft.photoUri,'local:new-1');assert.deepEqual(f.removed,['local:old']);
});
test('discard removes draft copies and preserves the original photo and identity',async()=>{
 const f=fixture(),s=f.edit();await s.pick();await s.pick();assert.deepEqual(f.removed,['local:new-1']);await s.discard();await s.discard();
 assert.deepEqual(f.removed,['local:new-1','local:new-2']);assert.equal(f.c.state.profile.photoUri,'local:old');assert.equal(f.writes.length,0);
});
test('photo removal is reversible by cancel and is committed only by Save',async()=>{
 const f=fixture(),cancel=f.edit();await cancel.pick(true);await cancel.discard();assert.deepEqual(f.removed,[]);assert.equal(f.c.state.profile.photoUri,'local:old');
 const save=f.edit();await save.pick(true);assert.equal(await save.save(),true);assert.equal(f.c.state.profile.photoUri,undefined);assert.equal(f.c.state.draft.photoUri,undefined);assert.deepEqual(f.removed,['local:old']);
});
test('failed persistence preserves both original and draft photo for retry',async()=>{
 const f=fixture(),s=f.edit();await s.pick();f.setFail(true);await assert.rejects(s.save(),/disk/);assert.equal(f.c.state.profile.photoUri,'local:old');assert.deepEqual(f.removed,[]);assert.equal(s.busy,false);assert.equal(s.dirty,true);
 f.setFail(false);assert.equal(await s.save(),true);assert.equal(f.c.state.profile.photoUri,'local:new-1');assert.deepEqual(f.removed,['local:old']);
});
test('closing during picker work cannot publish a late photo and cleans its copy',async()=>{
 const f=fixture();let release;f.port.copy=()=>new Promise(resolve=>release=resolve);const s=f.edit(),pending=s.pick();await Promise.resolve();await s.discard();release('local:late');await assert.rejects(pending,/chiusa/);assert.deepEqual(f.removed,['local:late']);assert.equal(f.writes.length,0);assert.equal(f.c.state.profile.photoUri,'local:old');
});
test('double Save is coalesced and optional name and photo may both be removed',async()=>{
 const f=fixture(),s=f.edit();s.setName('');await s.pick(true);const first=s.save(),second=s.save();assert.equal(await first,true);assert.equal(await second,false);assert.equal(f.writes.length,1);assert.deepEqual(f.c.state.profile,{name:'',photoUri:undefined});
});
