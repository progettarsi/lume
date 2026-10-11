const {test}=require('node:test'),assert=require('node:assert/strict');
const {GeminiIntegration}=require('../.test-build/geminiIntegration');
const {emptyRegistry,observeTopics,settleRegistry,restoreRegistry,parseRegistry}=require('../.test-build/categoryRegistry');
const {classifyLocal}=require('../.test-build/classification');
const {emptyLearning,learn}=require('../.test-build/recommendations');
const {libraryHarness}=require('./helpers/libraryHarness.cjs');
const intro='Una composizione musicale eseguita da una orchestra, con ritmi e armonie diversi. La musica è organizzata attraverso strumenti e suoni, offrendo un esempio chiaro della relazione tra struttura e ascolto.';
const rows=['Jazz','Sinfonia','Pianoforte','Musica classica'].map((title,i)=>classifyLocal({id:'fixture:'+i,title,category:'general',preview:[intro],paragraphs:[intro],source:'https://it.wikipedia.org/wiki/'+encodeURIComponent(title),fetchedAt:i,textVersion:3}));
test('enable changes preserve loading/saving status and the final private gateway configuration',async()=>{
 let finishRead,finishWrite;const configured=[];
 const c=new GeminiIntegration(()=>new Promise(r=>finishRead=r),()=>new Promise(r=>finishWrite=r),(key,on)=>configured.push([key,on]));
 const load=c.load();c.setEnabled(true);assert(c.state.busy);assert.equal(c.state.status,'loading');finishRead('fixture-old');await load;
 const save=c.save('fixture-new');await new Promise(setImmediate);c.setEnabled(false);assert.equal(c.state.status,'saving');assert(c.state.busy);assert.equal(c.state.enabled,false);finishWrite();await save;
 assert.equal(c.state.status,'disabled');assert.deepEqual(configured.at(-1),['fixture-new',false]);assert(!JSON.stringify(c.state).includes('fixture-'));
});
test('previously activated categories revive after interest decay; restoration preserves incumbent/selected order',()=>{
 let p=learn(learn(emptyLearning(),rows[0],'save'),rows[1],'save'),r=settleRegistry(observeTopics(emptyRegistry(),rows),p,rows,{});
 assert(r.topics.music.activated);r=settleRegistry(r,p,rows,{music:{phase:'exhausted'}},'all');assert(!r.visible.includes('music'));r=parseRegistry(JSON.stringify(r));
 const before=r.visible,restored=restoreRegistry(r,emptyLearning(),rows,{music:{phase:'ready'}},'history');assert(restored.visible.includes('music'));assert.deepEqual(restored.visible.filter(id=>id!=='music'),before);assert.equal(restored.visible.indexOf('history'),before.indexOf('history'));
 assert.deepEqual(restoreRegistry(r,p,rows,{music:{phase:'service'}}),r);assert.deepEqual(restoreRegistry(r,p,rows,{music:{phase:'ready'}},'all',false),r);
 const full={...r,visible:['science','technology','history','nature','geography','arts','cinema','biology']};assert.equal(restoreRegistry(full,p,rows,{music:{phase:'ready'},biology:{phase:'exhausted'}},'history').visible.length,8);
});
test('reader completion is a safe activation checkpoint; a touching rail defers it until release',async()=>{
 const h=await libraryHarness({rows,wiki:{batch:async()=>[]}});
 try{h.lib.activate(rows[0]);await h.lib.track(rows[0],'save');await h.lib.track(rows[1],'save');await h.flush();assert(!h.lib.categoryIds.includes('music'));
 h.lib.beginCategoryInteraction();h.lib.activate();await h.flush();assert(!h.lib.categoryIds.includes('music'));h.lib.endCategoryInteraction();await h.flush();assert(h.lib.categoryIds.includes('music'));
 h.lib.enterCategory('music');await h.flush();assert(h.lib.getFeed('music').length);assert(h.lib.getFeed('music').every(a=>a.category==='music'));
 await h.network(false);assert(h.lib.categoryRail.find(c=>c.id==='music').reason==='offline');assert(h.lib.getFeed('all').length);await h.network(true);assert(h.lib.categoryRail.find(c=>c.id==='music').enabled);
 }finally{h.dispose()}
});
test('opening a frozen card cannot change its label when a newer canonical full edition is cached',async()=>{
 const original={...rows[0],complete:true,textVersion:3},h=await libraryHarness({rows:[original],wiki:{batch:async()=>[]}});
 try{const card=h.lib.getFeed('all')[0],corrected={...original,category:'politics',topics:[],classification:{...original.classification,provider:'gemini',confidence:.9}};await h.lib.remember([corrected]);await h.flush();
 const reader=await h.lib.full(card,new AbortController().signal);assert.equal(reader.category,'music');assert.equal(h.lib.cache.find(a=>a.id===card.id).category,'politics');assert.equal(reader.complete,true);
 }finally{h.dispose()}
});
