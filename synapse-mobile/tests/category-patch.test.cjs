const {test}=require('node:test'),assert=require('node:assert/strict');
const {CLASSIFICATION_VERSION,classifyLocal,ensureClassification,classificationKey,topicalMetadata,ClassificationPreparation,validateClassifications,parseClassificationCache,geminiClassifications}=require('../.test-build/classification');
const {CATEGORIES,categoryId}=require('../.test-build/categories');
const {emptyRegistry,observeTopics,settleRegistry,categoryRailItems,parseRegistry}=require('../.test-build/categoryRegistry');
const {emptyLearning,learn,reconcileCategories,identity}=require('../.test-build/recommendations');
const {categoryMigration}=require('../.test-build/categoryMigration');
const {GeminiIntegration}=require('../.test-build/geminiIntegration');
const {Wikipedia}=require('../.test-build/wikipedia');
const {libraryHarness}=require('./helpers/libraryHarness.cjs');
const a=(title,text,extra={})=>({id:'wiki:'+title,title,category:'curiosity',preview:[text],paragraphs:[text],source:'https://it.wikipedia.org/wiki/'+encodeURIComponent(title),fetchedAt:1,...extra});
const context='Un esempio concreto mostra il funzionamento del fenomeno: le parti interagiscono fra loro e producono un risultato osservabile in condizioni precise. Questa relazione permette di spiegare il risultato attraverso un meccanismo verificabile.';
const samples=[
 ['Democrazia','La democrazia è una forma di governo nella quale il potere viene esercitato dal popolo attraverso elezioni e rappresentanti.','politics'],
 ['Jazz','Il jazz è un genere musicale sviluppato fra la fine del XIX secolo e l’inizio del XX. La musica unisce improvvisazione e ritmo.','music'],
 ['Federico Fellini','Federico Fellini è stato un regista e sceneggiatore italiano. I suoi film raccontano la società del dopoguerra.','cinema'],
 ['DNA','Il DNA è una molecola biologica che contiene le informazioni genetiche necessarie allo sviluppo degli organismi.','biology'],
 ['Stoicismo','Lo stoicismo è una scuola filosofica che propone una riflessione sull’etica e sul rapporto con la natura.','philosophy'],
 ['Inflazione','L’inflazione è un aumento del livello generale dei prezzi nell’economia. Modifica il potere d’acquisto della moneta.','economics'],
 ['Buco nero','Un buco nero è un oggetto astronomico con un campo gravitazionale da cui non può sfuggire la luce.','astronomy'],
 ['Marie Curie','Marie Curie è stata una fisica e chimica. Studiò la radioattività e contribuì alla scienza moderna.','science'],
 ['Ada Lovelace','Ada Lovelace è stata una matematica. Il suo lavoro riguarda anche la storia dell’informatica.','mathematics'],
 ['Niccolò Machiavelli','Niccolò Machiavelli è stato un filosofo e scrittore italiano. La sua riflessione si concentra sulla politica.','philosophy'],
 ['2001: Odissea nello spazio','2001: Odissea nello spazio è un film diretto dal regista Stanley Kubrick. Il racconto riguarda un viaggio fra pianeti e stelle.','cinema'],
 ['Il principe','Il principe è un’opera della letteratura italiana. Questo libro analizza il governo e la politica.','literature'],
 ['Memoria','La memoria è una funzione cognitiva che consente di conservare informazioni. È studiata dalla psicologia.','psychology'],
 ['Penicillina','La penicillina è un antibiotico usato in medicina contro alcune malattie batteriche.','medicine'],
 ['Mimetismo','Il mimetismo è la capacità degli animali di somigliare all’ambiente. Gli uccelli e le piante offrono molti esempi.','nature'],
 ['Islanda','L’Islanda è un’isola e uno Stato dell’Europa settentrionale. Il suo territorio comprende montagne e vulcani.','geography'],
 ['Pompei','Pompei è una città antica studiata dall’archeologia. Gli scavi permettono di ricostruire la storia romana.','history'],
 ['Internet','Internet è una rete informatica che collega computer in tutto il mondo. Questa tecnologia permette lo scambio di dati.','technology'],
 ['Impressionismo','L’impressionismo è un movimento artistico nato nella pittura. I pittori dipingevano spesso all’aperto.','arts'],
 ['Cacao','Il cacao è un alimento utilizzato in cucina per preparare il cioccolato.','food'],
 ['Maratona','La maratona è una gara sportiva di corsa inclusa nei giochi olimpici.','sport'],
 ['Esperanto','L’esperanto è una lingua costruita per facilitare la comunicazione nella società.','society'],
 ['Circo','Il circo è uno spettacolo che presenta esibizioni di acrobati e prestigiatori.','entertainment'],
 ['Oggetto ignoto','Questo oggetto possiede caratteristiche peculiari la cui funzione resta incerta.','general'],
];
test('diverse local semantic corpus includes biographies, ambiguity and a neutral fallback',()=>{
 for(const [title,text,expected] of samples){const result=classifyLocal(a(title,text));assert.equal(result.category,expected,title);assert.equal(result.classification.provider,'local');assert(result.topics.every(t=>CATEGORIES.some(c=>c.id===t)));assert(!result.topics.includes(result.category))}
});
test('administrative metadata and acquisition topic cannot become semantic evidence',()=>{
 const row=a('Jazz',samples[1][1],{category:'politics',sourceCategories:['Categoria:Wikipedia senza fonti','Categoria:Nati nel 1900','Categoria:Pagine di politica da correggere'],retrieval:{topic:'politics',method:'links'}});
 assert.equal(classifyLocal(row).category,'music');assert.deepEqual(topicalMetadata(row.sourceCategories),[]);
 assert.equal(classifyLocal(a('Mistero',samples.at(-1)[1],{category:'music'})).category,'general');
});
test('fingerprints invalidate changed introduction, source metadata, revision and rules; bookmarks do not',()=>{
 const row=classifyLocal(a('Jazz',samples[1][1])),key=classificationKey(row);assert.equal(classificationKey({...row,saved:true}),key);assert.equal(ensureClassification(row),row);
 for(const patch of [{revision:2},{preview:['Un’altra introduzione completa.']},{sourceCategories:['Categoria:Musica']}])assert.notEqual(classificationKey({...row,...patch}),key);
 assert.equal(ensureClassification({...row,classification:{...row.classification,version:0}}).classification.version,CLASSIFICATION_VERSION);
});
test('rapper definition outweighs incidental cinema and invalidates old classification cache',()=>{
 const row=a('Vegas Jones','Vegas Jones, pseudonimo di Matteo Privitera (Cinisello Balsamo, 28 settembre 1994), è un rapper italiano. Il nome Vegas è dovuto all\'ammirazione dell\'artista per le opere cinematografiche di Quentin Tarantino, in particolare per il personaggio di Vincent Vega, Jones è invece in onore di Nasir Jones, rapper americano.');
 const oldKey='1:'+row.id+':0:old',cached={...row,category:'general',classification:{version:1,fingerprint:oldKey,provider:'local',confidence:0}};
 assert.equal(ensureClassification(cached).category,'music');assert.notEqual(classificationKey(row),oldKey);
 assert.equal(classifyLocal(a('Rapporto e rappresentazione','Questo rapporto descrive una rappresentazione di elementi senza un tema specifico.')).category,'general');
 assert.deepEqual(parseClassificationCache(JSON.stringify({[oldKey]:{id:row.id,categoryId:'general',topics:[],confidence:.9}})),{});
});
const result=(rows,id='music')=>({articles:rows.map(a=>({id:a.id,categoryId:id,topics:['Musicale','music'],confidence:.9,proposal:null}))});
test('structured classification validates identity, cardinality, confidence, known IDs and separate proposals',()=>{
 const rows=[a('Jazz',samples[1][1])];assert.deepEqual(validateClassifications(result(rows),rows)[0].topics,[]);
 for(const change of [{categoryId:'invented'},{confidence:2},{topics:['Gossip']},{id:'another'},{proposal:{label:'Una nuova categoria',parent:'science'}}])assert.throws(()=>validateClassifications({articles:[{...result(rows).articles[0],...change}]},rows));
 assert.throws(()=>validateClassifications({articles:[]},rows));assert.throws(()=>validateClassifications({articles:[...result(rows).articles,...result(rows).articles]},rows));
 const proposal=validateClassifications({articles:[{...result(rows).articles[0],proposal:{label:'Robotica',parent:'technology'}}]},rows)[0].proposal;assert.equal(proposal.label,'Robotica');
});
test('Gemini disabled makes no requests; small batches deduplicate, cache and bound calls',async()=>{
 let calls=0;const service=new ClassificationPreparation(async rows=>{calls++;assert(rows.length<=4);return result(rows)}),rows=Array.from({length:12},(_,i)=>classifyLocal(a('Jazz '+i,samples[1][1]))),signal=new AbortController().signal;
 service.enqueue(rows);assert.deepEqual(await service.prepare(signal),[]);assert.equal(calls,0);
 service.configure('fixture',true);service.enqueue([...rows,...rows]);assert.equal((await service.prepare(signal)).length,4);assert.equal((await service.prepare(signal)).length,4);assert.deepEqual(await service.prepare(signal),[]);assert.equal(calls,2);assert.equal(service.cached(rows[0]).classification.provider,'gemini');
 const restored=new ClassificationPreparation();restored.cache=parseClassificationCache(JSON.stringify(service.cache));assert.equal(restored.cached(rows[0]).classification.provider,'gemini');assert.equal(restored.cached({...rows[0],revision:2}).classification.provider,'local');service.dispose();
});
test('slow, failed, quota and invalid Gemini responses retain local classification',async()=>{
 const row=classifyLocal(a('Jazz',samples[1][1]));for(const generator of [()=>new Promise(()=>{}),async()=>{throw Error('quota')},async()=>({articles:[{id:row.id,categoryId:'wrong',topics:[],confidence:1}]})]){
  const service=new ClassificationPreparation(generator,Date.now,8);service.configure('fixture',true);service.enqueue([row]);const start=Date.now();assert.deepEqual(await service.prepare(new AbortController().signal),[]);assert(Date.now()-start<200);assert.equal(service.cached(row).category,'music');assert(!service.hasPending());service.dispose();
 }
});
test('late responses after disable, key change or cancellation are discarded',async()=>{
 for(const action of ['disable','key','abort']){let release;const service=new ClassificationPreparation(rows=>new Promise(r=>release=()=>r(result(rows,'politics')))),signal=new AbortController(),row=classifyLocal(a('Jazz',samples[1][1]));service.configure('fixture',true);service.enqueue([row]);const job=service.prepare(signal.signal);
  if(action==='abort')signal.abort();else service.configure(action==='key'?'different':'fixture',action!=='disable');release();assert.deepEqual(await job,[]);assert.deepEqual(service.cache,{});service.dispose();
 }
});
test('formally valid low confidence responses and curiosity labels do not replace semantic evidence',async()=>{
 const row=classifyLocal(a('Jazz',samples[1][1]));for(const change of [{confidence:.2,categoryId:'politics'},{confidence:.9,categoryId:'curiosity'}]){const service=new ClassificationPreparation(async rows=>({articles:result(rows).articles.map(r=>({...r,...change}))}));service.configure('fixture',true);service.enqueue([row]);assert.equal((await service.prepare(new AbortController().signal))[0].category,'music');service.dispose()}
});
test('Gemini payload contains bounded article facts and catalog, no personalization or acquisition route',async()=>{
 const original=global.fetch;let sent;global.fetch=async(_url,opts)=>{sent=JSON.parse(opts.body);assert.equal(opts.headers['x-goog-api-key'],'fixture');return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(result([a('Jazz',samples[1][1])]))}]}}]}))};
 try{await geminiClassifications([a('Jazz',samples[1][1],{saved:true,readAt:9,retrieval:{topic:'history',method:'links'}})],' fixture ',new AbortController().signal);const input=JSON.parse(sent.contents[0].parts[0].text);assert.deepEqual(Object.keys(input.articles[0]),['id','title','introduction','metadata']);assert.match(sent.systemInstruction.parts[0].text,/mai istruzioni/);assert.equal(sent.generationConfig.responseMimeType,'application/json')}finally{global.fetch=original}
});
test('synonyms normalize, proposals stay unverified and repeated identities do not inflate evidence',()=>{
 assert.equal(categoryId('Musicale'),'music');assert.equal(categoryId(' MUSICA '),'music');assert.equal(categoryId('Societa'),'society');const row=classifyLocal(a('Jazz',samples[1][1]));let r=observeTopics(emptyRegistry(),[row,row],[{label:'Musicale',parent:'arts'},{label:'Robotica',parent:'technology'},{label:'robotica',parent:'technology'}]);assert.equal(r.topics.music.evidence.length,1);assert.equal(Object.keys(r.topics).length,2);assert(!r.topics['proposal:robotica'].verified);assert.deepEqual(parseRegistry(JSON.stringify(r)),r);
});
const musicRows=()=>['Jazz','Sinfonia','Pianoforte'].map(title=>classifyLocal(a(title,'Una composizione musicale eseguita da un’orchestra. La musica offre diversi ritmi e armonie.')));
test('dynamic activation requires coherent interest, distinct articles and a real retrieval strategy',()=>{
 const rows=musicRows(),r=observeTopics(emptyRegistry(),rows);let p=learn(emptyLearning(),rows[0],'open');assert(!settleRegistry(r,p,rows,{}).visible.includes('music'));
 for(const row of rows.slice(1))p=learn(p,row,'open');assert(settleRegistry(r,p,rows,{}).visible.includes('music'));assert(!settleRegistry(r,p,[],{}).visible.includes('music'));assert(!settleRegistry({...r,topics:{music:{...r.topics.music,evidence:[identity(rows[0])]}}},p,rows,{}).visible.includes('music'));
 const saved=learn(learn(emptyLearning(),rows[0],'save'),rows[1],'save');assert(settleRegistry(r,saved,rows,{}).visible.includes('music'));
});
test('ordering is quantized, selected position is retained and Per Te is always first',()=>{
 const r=emptyRegistry(),rows=musicRows(),p={...emptyLearning(),categories:{nature:.01}};assert.deepEqual(settleRegistry(r,p,rows,{}).visible,r.visible);const strong={...p,categories:{nature:100}};const next=settleRegistry(r,strong,rows,{},'history');assert.equal(next.visible.indexOf('history'),r.visible.indexOf('history'));assert.equal(categoryRailItems(next,'history',true,{})[0].id,'all');assert(categoryRailItems(next,'history',true,{}).find(c=>c.id==='history').selected);
});
test('small preference changes across a score boundary cannot swap incumbents repeatedly',()=>{
 const r=emptyRegistry(),p={...emptyLearning(),categories:{science:3.47,nature:3.5}},first=settleRegistry(r,p,[],{});assert(first.visible.indexOf('science')<first.visible.indexOf('nature'));const next=settleRegistry(first,{...p,categories:{science:3.5,nature:3.47}},[],{});assert.deepEqual(next.visible,first.visible);
});
test('activated categories survive interest decay and capacity pressure until confirmed exhaustion',()=>{
 const rows=musicRows(),r=observeTopics(emptyRegistry(),rows),p=learn(learn(emptyLearning(),rows[0],'save'),rows[1],'save'),activated=settleRegistry(r,p,rows,{});assert(activated.visible.includes('music'));assert(settleRegistry(activated,emptyLearning(),[],{}).visible.includes('music'));assert(!settleRegistry(activated,p,rows,{music:{phase:'exhausted'}}).visible.includes('music'));
});
test('reclassified identities cannot remain evidence for a formerly assigned theme',()=>{
 const rows=musicRows(),r=observeTopics(emptyRegistry(),rows),corrected=observeTopics(r,[{...rows[0],category:'politics'}]);assert.equal(corrected.topics.music.evidence.length,2);assert(!corrected.topics.music.evidence.includes(identity(rows[0])));assert(corrected.topics.politics.evidence.includes(identity(rows[0])));
});
test('exhaustion removes only after selected return; service errors and offline preserve membership; contents reactivate',()=>{
 const r=emptyRegistry(),states={nature:{phase:'exhausted',attempts:3,exhausted:true}},p=emptyLearning(),rows=[];assert(settleRegistry(r,p,rows,states,'nature').visible.includes('nature'));assert(!settleRegistry(r,p,rows,states,'all').visible.includes('nature'));assert.deepEqual(settleRegistry(r,p,rows,states,'all',false),r);assert(settleRegistry(r,p,rows,{nature:{phase:'service'}}).visible.includes('nature'));
 const offline=categoryRailItems(r,'all',false,{});assert(offline[0].enabled);assert(offline.slice(1).every(c=>!c.enabled&&c.reason==='offline'));const depleted=settleRegistry(r,p,rows,states);assert(settleRegistry(depleted,p,rows,{nature:{phase:'ready'}}).visible.includes('nature'));
});
test('reclassification moves reversible bookmarks and recent opens once, preserving unknown historical aggregates',()=>{
 const row=a('Jazz',samples[1][1],{category:'entertainment'}),classified=classifyLocal(row);let p=learn(learn(emptyLearning(),row,'open'),row,'save');p={...p,categories:{...p.categories,entertainment:p.categories.entertainment+2}};const next=reconcileCategories(p,[classified]);assert(Math.abs(next.categories.entertainment-2)<.001);assert(Math.abs(next.categories.music-5.2)<.001);assert.equal(reconcileCategories(next,[classified]),next);
 const removed=learn(next,classified,'unsave');assert(Math.abs(removed.categories.music-.2)<.001);assert.deepEqual(learn(removed,classified,'save').categories,next.categories);assert.equal(next.seen.length,p.seen.length);
 const off=learn(p,row,'unsave'),corrected=reconcileCategories(off,[classified]);assert.equal(corrected.bookmarks[identity(row)].category,'music');assert.equal(learn(corrected,classified,'save').categories.music,5.2);
});
test('migration preserves saved, history, text, preferences and title-only uncertain visits',()=>{
 const row=a('Jazz',samples[1][1],{saved:true,readAt:123,category:'entertainment'}),p=learn(emptyLearning(),row,'save'),visit={...row,preview:[],paragraphs:[],id:'old',source:'https://it.wikipedia.org/wiki/Old'};const next=categoryMigration(p,[row],[visit]);assert.equal(next.articles[0].category,'music');assert(next.articles[0].saved);assert.equal(next.articles[0].readAt,123);assert.equal(next.visits[0].category,'entertainment');assert.equal(next.profile.categoryVersion,1);assert.deepEqual(categoryMigration(next.profile,next.articles,next.visits),next);
});
test('all activatable topics filter unrelated links, expose seeds and progress to topic search within three requests',async()=>{
 for(const c of CATEGORIES.filter(c=>c.id!=='curiosity')){const sample=samples.find(([, ,id])=>id===c.id);assert(sample,c.id);const params=[],wiki=new Wikipedia(async url=>{params.push(new URL(url).searchParams);const pages=params.length<3?[{pageid:1,title:'Oggetto ignoto',extract:samples.at(-1)[1]+context}]:[{pageid:2,title:sample[0],extract:sample[1]+context}];return new Response(JSON.stringify({query:{pages}}))});let rows=[];
  for(let attempt=1;attempt<=3&&!rows.length;attempt++)rows=await wiki.batch(c.id,new Set(),1,undefined,emptyLearning(),{maxRounds:1,requestAttempts:1,alternative:attempt>1,strategyAttempt:attempt});
  assert.equal(rows.length,1,c.id);assert.equal(rows[0].category,c.id);assert.equal(params.length,3);assert.equal(params[2].get('generator'),'search');assert.equal(rows[0].retrieval.method,'topic-search');
 }
});
test('configuration load/save/removal uses gateway, exposes no key, serializes writes and recovers failure',async()=>{
 let key='fixture-secret',fail=false;const calls=[],config=new GeminiIntegration(async()=>key,async value=>{if(fail)throw Error('disk');key=value},(k,enabled)=>calls.push({k,enabled}));await config.load();assert(config.state.configured);assert.equal(config.state.status,'disabled');assert(!JSON.stringify(config.state).includes('fixture-secret'));config.setEnabled(true);assert.equal(config.state.status,'ready');await Promise.all([config.save(' first '),config.save('second')]);assert.equal(key,'second');fail=true;await assert.rejects(config.remove());assert(config.state.configured);assert.equal(config.state.status,'error');fail=false;await config.remove();assert.equal(config.state.status,'missing');assert.equal(key,'');assert.equal(calls.at(-1).k,'');
});
test('first load uses local labels without waiting for an unresponsive Gemini generator',async()=>{
 let calls=0;const h=await libraryHarness({rows:[a('Improvvisazione jazz',samples[1][1]+context)],categoryGenerator:()=>{calls++;return new Promise(()=>{})},wiki:{batch:async()=>[]}});try{h.lib.configureAI('fixture',true);assert(h.lib.ready);assert.equal(h.lib.getFeed('all')[0].category,'music');assert.equal(calls,0);h.lib.beginCategoryInteraction();await h.lib.track(musicRows()[0],'save');await h.flush();const before=h.lib.categoryIds;h.lib.settleCategories();await h.flush();assert.deepEqual(h.lib.categoryIds,before);h.lib.endCategoryInteraction()}finally{h.dispose()}
});
test('real Wikipedia snapshot covers every semantic topic; GPS and solar system keep their reviewed meaning',()=>{
 const snapshots=[require('../docs/category-retrieval-0.1.12.json'),require('../docs/category-retrieval-supplement-0.1.12.json')],rows=snapshots.flatMap(s=>s.sources),classified=rows.map(classifyLocal);
 for(const c of CATEGORIES.filter(c=>c.id!=='curiosity'))assert(classified.some(a=>a.category===c.id&&rows.find(r=>r.id===a.id)?.eligible&&rows.find(r=>r.id===a.id)?.readable),c.id);
 const expected={'GPS':'technology','Sistema solare':'astronomy','Jazz':'music','Cabaret':'entertainment','Circo':'entertainment','Danza':'entertainment','Illusionismo':'entertainment','Mimetismo':'nature','Setonix brachyurus':'nature','Vombatidae':'nature','DNA':'biology','Vaccino':'medicine','Parlamento':'politics','Poesia':'literature','Serendipità':'general'};
 for(const [title,category] of Object.entries(expected))assert.equal(classified.find(a=>a.title===title)?.category,category,title);
});
test('late preparation corrects future cards and bookmark ledger while the visible card remains fixed',async()=>{
 const rows=Array.from({length:30},(_,i)=>a('Improvvisazione jazz '+i,samples[1][1]+context,{fetchedAt:30-i}));let release;const h=await libraryHarness({rows,categoryGenerator:input=>new Promise(r=>release=()=>r(result(input,'politics'))),wiki:{batch:async()=>[]}});
 try{const before=h.lib.getFeed('all')[0];h.lib.configureAI('fixture',true);await h.flush();assert(release);await h.lib.save(before,true);await h.flush();release();await h.flush();const after=h.lib.getFeed('all');assert.equal(after[0].id,before.id);assert.equal(after[0].category,'music');assert(after.slice(1).some(a=>a.category==='politics'));assert.equal(h.disk.profile.bookmarks[identity(before)].category,'politics');await h.lib.setSaved(before,false);await h.flush();assert.equal(h.disk.profile.categories.politics,0);await h.lib.setSaved(before,true);await h.flush();assert.equal(h.disk.profile.categories.politics,5);await h.lib.read(before);await h.flush();assert.equal(h.disk.profile.categories.politics,5.2);assert.equal(h.disk.rows.find(a=>a.id===before.id).category,'politics')}
 finally{h.dispose()}
});
