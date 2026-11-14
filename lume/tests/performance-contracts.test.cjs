const {test}=require('node:test'),assert=require('node:assert/strict');
const {withCatalogue}=require('../.test-build/catalogue'),{rankRecommendations,emptyLearning}=require('../.test-build/recommendations'),{reserveArticles,RESERVE_TARGET}=require('../.test-build/reserve'),{LibraryViews}=require('../.test-build/libraryViews');
test('unchanged catalogue editions keep their identities across saves and unrelated downloads',()=>{
 const first=withCatalogue([]),again=withCatalogue(first);assert.equal(first.length,150);for(let i=0;i<first.length;i++)assert.equal(again[i],first[i]);
 const saved={...first[0],saved:true},changed=withCatalogue([saved,...first.slice(1)]);assert.equal(changed[0],saved);for(let i=1;i<first.length;i++)assert.equal(changed[i],first[i]);
});
test('bounded recommendation ranking returns the exact prefix of full ranking',()=>{
 const rows=withCatalogue([]),profile=emptyLearning(),all=rankRecommendations(rows,profile,()=>.5);
 for(const limit of [0,1,8,30,64])assert.deepEqual(rankRecommendations(rows,profile,()=>.5,[],0,limit).map(a=>a.id),all.slice(0,limit).map(a=>a.id));
 const reserve=reserveArticles(rows,profile,new Set());assert.equal(reserve.length,RESERVE_TARGET);assert.deepEqual(reserveArticles(rows,profile,new Set(),'all',1).map(a=>a.id),reserve.slice(0,1).map(a=>a.id));
});
test('category selection ranks only its own candidates and reuses the computed view',()=>{
 const rows=withCatalogue([]),profile=emptyLearning();let ranked=0;
 const views=new LibraryViews((candidates,...args)=>{ranked++;assert(candidates.every(a=>a.category==='science'));return reserveArticles(candidates,...args)});
 const first=views.reserve(rows,profile,new Set(),0,'science');assert(first.length);assert.equal(views.reserve(rows,profile,new Set(),0,'science'),first);assert.equal(ranked,1);
});

test('consuming a few cards filters the existing reserve immediately and postpones another ranking until it is low',()=>{
 const rows=withCatalogue([]);let profile=emptyLearning(),ranked=0;const served=new Set();
 const views=new LibraryViews((...args)=>{ranked++;return reserveArticles(...args)}),first=views.reserve(rows,profile,served,0);
 for(let i=0;i<5;i++){served.add(first[i].id);profile={...profile,seen:[...profile.seen,first[i].id]};const remaining=views.reserve(rows,profile,served,i+1);assert(!remaining.some(a=>served.has(a.id)));assert.equal(remaining.length,29-i)}
 assert.equal(ranked,1);
 for(let i=5;i<11;i++)served.add(first[i].id);
 assert.equal(views.reserve(rows,profile,served,11).length,30);assert.equal(ranked,2);
});

test('indexed categories retain Italian alias and Unicode casing semantics',()=>{
 const {CATEGORIES,categoryId,normalizeTopic}=require('../.test-build/categories');
 const samples=['CURIOSITÀ','Società','ÈCOLOGIA','İSTANBUL','ΣΟΣ','Arte e cultura','Musicale','sconosciuto'];
 for(const value of [...samples,...CATEGORIES.flatMap(c=>c.aliases||[])]){
  const original=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it').replace(/[^a-z0-9]+/g,' ').trim();
  assert.equal(normalizeTopic(value),original(value));
  assert.equal(categoryId(value),CATEGORIES.find(c=>c.aliases?.some(a=>original(a)===original(value)))?.id);
 }
});