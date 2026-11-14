const {test}=require('node:test'),assert=require('node:assert/strict');
const {assessEditorial,discoveryCandidates,orderEditorial,EDITORIAL_TUNING}=require('../.test-build/editorial');
const {Wikipedia}=require('../.test-build/wikipedia');
const {CATEGORIES}=require('../.test-build/categories');
const {appendDiscoveries,reserveArticles}=require('../.test-build/reserve');
const {emptyLearning}=require('../.test-build/recommendations');
const lead='La capillarità è un fenomeno che permette all’acqua di risalire in tubi sottili. Le forze tra il liquido e la superficie provocano questo movimento anche contro la gravità, come nelle fibre di una carta assorbente.';
const umbrella='La storia è la disciplina che si occupa dello studio del passato attraverso le fonti. Comprende conoscenze relative a tutte le attività umane e permette di costruire una narrazione continua dei cambiamenti della società.';
const weak='Questa voce descrive un insieme articolato di tradizioni e forme culturali. I suoi elementi appartengono a periodi diversi e sono discussi in numerose pubblicazioni, con terminologie che variano a seconda del contesto.';
const a=(id,title='Capillarità',text=lead,category='science')=>({id:'wiki:'+id,title,category,paragraphs:[text],preview:[text],source:'https://it.wikipedia.org/wiki/'+id,fetchedAt:1});
const page=row=>({pageid:Number(row.id.split(':')[1]),title:row.title,extract:row.paragraphs.join('\n'),fullurl:row.source});

test('short complete definitions survive, without admitting fragments or empty context',()=>{
 const text='Il Braille è un sistema di lettura e scrittura tattile a rilievo per non vedenti e ipovedenti, messo a punto dal francese Louis Braille nel XIX secolo.';
 const {generalAudienceScore}=require('../.test-build/text');assert(text.length<180);assert(generalAudienceScore('Braille',[text])>=.45);
 assert(generalAudienceScore('Braille',[text.slice(0,-1)])<0);assert(generalAudienceScore('Breve',['Una tecnica utile.'])<0);
});

test('editorial specificity requires the definition and context, never a title alone',()=>{
 assert(assessEditorial(a(1,'Storia',lead)).preferred);assert(!assessEditorial(a(2,'Un episodio preciso',umbrella)).eligible);
 assert(assessEditorial(a(3,'Capillarità',lead)).preferred);assert(!assessEditorial(a(4,'Capillarità','Un fenomeno interessante.')).eligible);
 const beside='La capillarità è un fenomeno fisico studiato dalla scienza dei fluidi. Lo studio usa tubi sottili perché l’acqua risale grazie alle forze che agiscono tra il liquido e la superficie, come accade nella carta assorbente.';
 assert(assessEditorial(a(5,'Capillarità',beside)).preferred);
});
test('a quantified mechanism does not become an umbrella because it mentions every component',()=>{
 const text='Il paradosso della nave di Teseo è un esperimento mentale sulla continuità di un oggetto. Si sostituiscono tutte le parti della nave nel corso del tempo e ci si chiede se questo cambiamento conservi la sua identità originaria.';
 const result=assessEditorial(a(1,'Nave di Teseo',text,'philosophy'));assert(result.eligible);assert(result.preferred);assert(!result.reasons.some(s=>s.includes('Portata generale')));
});
test('scarcity keeps one readable fallback per response without admitting insufficient or umbrella texts',()=>{
 const rows=[a(1,'Tradizioni',weak),a(2,'Forme culturali',weak),a(3,'Storia',umbrella),a(4,'Breve','Poche parole.')];
 const selected=discoveryCandidates(rows,6);assert.equal(selected.length,1);assert.equal(selected[0].id,rows[0].id);
 const enough=discoveryCandidates([rows[0],a(5)],6);assert.equal(enough[0].id,'wiki:5');assert.equal(enough.length,2);
});
test('new tail favours a different subject/category and leaves published cards fixed',()=>{
 const old=[a(1),a(2)],same=a(3,'Capillarità nei tubi'),different=a(4,'Un ponte','Un ponte è un manufatto che permette di attraversare un fiume o un ostacolo. Questa costruzione serve a collegare le due rive e viene utilizzata per il passaggio di persone e veicoli, come nei percorsi di una città.','history');
 assert.equal(orderEditorial([same,different],old)[0].id,different.id);
 const appended=appendDiscoveries(old,[same,different],emptyLearning(),new Set());assert.deepEqual(appended.slice(0,2),old);assert.equal(appended[2].id,different.id);
});
test('exclusions and aliases are applied before a small discovery limit',async()=>{
 const rows=[a(1),a(2),{...a(3),source:a(2).source},a(4)];let calls=0;const wiki=new Wikipedia(async()=>{calls++;return new Response(JSON.stringify({query:{pages:rows.map(page)}}))});
 const selected=await wiki.batch('science',new Set(['wiki:1']),2,undefined,emptyLearning(),{maxRounds:1});assert.equal(calls,1);assert.deepEqual(new Set(selected.map(a=>a.id)),new Set(['wiki:2','wiki:4']));
});
test('a readable fallback is published before a slower refill, within the same request limit',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve});let calls=0,published=[];
 const wiki=new Wikipedia(async()=>{calls++;if(calls===2)await gate;return new Response(JSON.stringify({query:{pages:[page(calls===1?a(1,'Tradizioni',weak):a(2))]}}))});
 const pending=wiki.batch('all',new Set(),6,undefined,emptyLearning(),{maxRounds:2,onChunk:rows=>{published.push(...rows)}});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(calls,2);assert.equal(published.length,1);assert.equal(published[0].id,'wiki:1');
 release();assert.equal((await pending).length,2);assert.equal(calls,2);
});
test('search retains explicit umbrella intent, while discovery and offline reserve filter it',async()=>{
 const wiki=new Wikipedia(async()=>new Response(JSON.stringify({query:{pages:[page(a(1,'Storia',umbrella))]}})));
 assert.equal((await wiki.search('Storia')).length,1);assert.equal((await wiki.batch('history',new Set(),6,undefined,emptyLearning(),{maxRounds:1})).length,0);
 assert.equal(reserveArticles([a(1,'Storia',umbrella),a(2)],emptyLearning(),new Set()).length,1);
});
test('discovery still has every broad category and one internal switch restores base selection',()=>{
 assert.equal(CATEGORIES.length,22);for(const c of CATEGORIES)assert(c.seeds.length>=6,c.id);
 const rows=[a(1,'Storia',umbrella),a(2,'Tradizioni',weak)];try{EDITORIAL_TUNING.enabled=false;assert(assessEditorial(rows[0]).eligible);assert.deepEqual(discoveryCandidates(rows),rows);assert.deepEqual(orderEditorial(rows),rows)}finally{EDITORIAL_TUNING.enabled=true}
});
