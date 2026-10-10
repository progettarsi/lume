// Reproducible diagnostic corpus, not a representative estimate of all Wikipedia.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),folder=path.join(root,'releases/qa/editorial-selection-2026-10-09');
const {Wikipedia}=require(path.join(folder,'baseline/wikipedia'));
const {CATEGORIES}=require(path.join(folder,'baseline/categories'));
const {paragraphsFromHtml}=require(path.join(folder,'baseline/html'));
const wiki=new Wikipedia(),props={action:'query',prop:'extracts|info|revisions|categories|pageprops',ppprop:'disambiguation',cllimit:'12',explaintext:'1',exsectionformat:'wiki',exlimit:'max',exintro:'1',inprop:'url',rvprop:'ids',redirects:'1'};
async function main(){
 const requests=[],candidates=[],ids=new Set();
 const add=(page,category,route,anchor)=>{if(!page||ids.has(page.pageid)||candidates.length>=50)return;ids.add(page.pageid);candidates.push({page,category,route,anchor})};
 async function fetch(params,label){const at=performance.now();const response=await wiki.request({...props,...params});requests.push({label,params,elapsedMs:performance.now()-at,response});fs.writeFileSync(path.join(folder,'capture-progress.json'),JSON.stringify(requests,null,2));return response.query?.pages||[]}
 // Two initial themes per category from the previous actual configuration.
 for(const c of CATEGORIES){const titles=[c.seeds[0],c.seeds[2]];for(const page of await fetch({titles:titles.join('|')},'seeds:'+c.id))add(page,c.id,'tema iniziale',titles.join(' / '))}
 // Explicit umbrella controls make the diagnostic stratum visible, not hidden.
 const controls=[['Storia','history'],['Geografia','geography'],['Fisica','science'],['Tecnologia','technology'],['Arte','arts'],['Sport','sport']];
 const pages=await fetch({titles:controls.map(x=>x[0]).join('|')},'controlli ombrello');for(const page of pages)add(page,controls.find(x=>x[0]===page.title)?.[1]||'general','controllo ombrello','controllo esplicito');
 // Unfiltered returned order, first two unique links from each old anchor.
 for(const c of CATEGORIES){if(candidates.length>=50)break;const pages=await fetch({generator:'links',titles:c.seeds[0],gplnamespace:'0',gpllimit:'12'},'links:'+c.id);let used=0;for(const page of pages){if(ids.has(page.pageid))continue;add(page,c.id,'collegamento',c.seeds[0]);if(++used===2)break}}
 const corpus={capturedAt:new Date().toISOString(),method:'Previous first/third seed of each category; six explicit umbrella controls; first two unfiltered unique links per old anchor until 50. No user preferences. API order frozen by this archive.',requests,candidates};
 fs.writeFileSync(path.join(folder,'corpus.json'),JSON.stringify(corpus,null,2));console.log(JSON.stringify({candidates:candidates.length,requests:requests.length,errors:candidates.filter(x=>x.page.missing).length}));
 if(candidates.length!==50)throw Error('Corpus incomplete; retain captured responses and inspect before retrying.');
}
async function htmlCorpus(){
 const previous=fs.existsSync(path.join(folder,'corpus.json'))?JSON.parse(fs.readFileSync(path.join(folder,'corpus.json'),'utf8')):undefined;
 const seedPrior=fs.existsSync(path.join(folder,'seed-probe.json'))?JSON.parse(fs.readFileSync(path.join(folder,'seed-probe.json'),'utf8')):undefined;
 const archived=[...(previous?.requests||[]),...(seedPrior?.requests||[])];
 let fileNumber=Math.max(200,...fs.readdirSync(path.join(folder,'html')).map(f=>Number(f.split('.')[0])||0));
 const requests=[],candidates=[],ids=new Set(),cached=new Map();fs.mkdirSync(path.join(folder,'html'),{recursive:true});
 const add=(page,category,route,anchor)=>{if(!page||ids.has(page.pageid)||candidates.length>=50)return false;ids.add(page.pageid);candidates.push({page,category,route,anchor});return true};
 async function get(title){
  if(cached.has(title))return cached.get(title);
  const url='https://it.wikipedia.org/wiki/'+encodeURIComponent(title.replaceAll(' ','_')),at=performance.now();
  const prior=archived.find(x=>x.title===title&&x.file&&fs.existsSync(path.join(folder,'html',x.file)));
  const r=prior?{status:prior.status,ok:prior.status===200}:await fetch(url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'Synapse/0.1.7 (personal educational reader; app.synapse.reader)'}});if(r.status===429||r.status===503)throw Error('Wikipedia rate limit: stop without repeating.');
  const html=prior?fs.readFileSync(path.join(folder,'html',prior.file),'utf8'):await r.text();const file=prior?.file||String(++fileNumber).padStart(3,'0')+'.html';if(!prior)fs.writeFileSync(path.join(folder,'html',file),html);
  const content=html.match(/<div[^>]*class="[^"]*mw-parser-output[^\"]*"[^>]*>([\s\S]*)/i)?.[1]||'';
  const lead=content.split(/<h2\b/i)[0],paragraphs=paragraphsFromHtml('<div>'+lead+'</div>');
  const resolved=html.match(/<h1[^>]*id="firstHeading"[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g,'').trim()||title;
  const canonical=html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]||url;
  const page={pageid:Number(html.match(/"wgArticleId":(\d+)/)?.[1])||canonical,title:resolved,fullurl:canonical,extract:paragraphs.join('\n\n'),revisions:[{revid:Number(html.match(/"wgCurRevisionId":(\d+)/)?.[1])||undefined}],missing:!r.ok,pageprops:/disambig|disambiguazione/i.test(html.match(/"wgCategories":(\[[^\]]+\])/)?.[1]||'')?{disambiguation:''}:{}};
  const links=[...new Set([...lead.matchAll(/href="(?:https?:\/\/it\.wikipedia\.org)?\/wiki\/([^"#]+)(?:#[^"]*)?"/g)].map(m=>decodeURIComponent(m[1])).filter(t=>!t.includes(':')).map(t=>t.replaceAll('_',' ')))];
  requests.push({title,url,status:r.status,elapsedMs:prior?.elapsedMs??performance.now()-at,file,revision:page.revisions[0].revid});const item={page,links};cached.set(title,item);
  fs.writeFileSync(path.join(folder,'html-progress.json'),JSON.stringify({requests,candidates},null,2));await new Promise(resolve=>setTimeout(resolve,300));return item;
 }
 if(process.argv.includes('--probe-seeds')){
  const current=require(path.join(root,'.test-build/categories')).CATEGORIES,assess=require(path.join(root,'.test-build/editorial')).assessEditorial,makePreview=require(path.join(root,'.test-build/text')).makePreview,paragraphsFromExtract=require(path.join(root,'.test-build/text')).paragraphsFromExtract;
  const oldTitles=new Set(CATEGORIES.flatMap(c=>c.seeds)),results=[];
  for(const category of current)for(const title of category.seeds){if(oldTitles.has(title))continue;const {page}=await get(title),paragraphs=paragraphsFromExtract(page.extract),article={id:'wiki:'+page.pageid,title:page.title,source:page.fullurl,category:category.id,paragraphs,preview:makePreview(paragraphs),fetchedAt:0};results.push({requested:title,category:category.id,page,assessment:assess(article)})}
  fs.writeFileSync(path.join(folder,'seed-probe.json'),JSON.stringify({capturedAt:new Date().toISOString(),requests,results},null,2));console.log(JSON.stringify(results.map(r=>({title:r.requested,resolved:r.page.title,missing:r.page.missing,preview:r.page.extract.length,eligible:r.assessment.eligible,preferred:r.assessment.preferred}))));return;
 }
 for(const c of CATEGORIES)for(const title of [c.seeds[0],c.seeds[2]])add((await get(title)).page,c.id,'tema iniziale precedente',title);
 for(const [title,category] of [['Storia','history'],['Geografia','geography'],['Fisica','science'],['Tecnologia','technology'],['Arte','arts'],['Sport','sport']])add((await get(title)).page,category,'controllo ombrello','controllo esplicito');
 for(const c of CATEGORIES){if(candidates.length>=50)break;const anchor=await get(c.seeds[0]);let used=0;for(const title of anchor.links){const item=await get(title);if(add(item.page,c.id,'collegamento dalla introduzione',c.seeds[0]))used++;if(used===2||candidates.length>=50)break}}
 fs.writeFileSync(path.join(folder,'corpus.json'),JSON.stringify({capturedAt:new Date().toISOString(),method:'HTML introductions, because API returned HTTP 429. Previous first/third seed of each category; six explicit umbrella controls; first two unique main-namespace links in each introduction until 50. Not API generator ordering or a representative feed. All HTML and revision IDs archived.',requests,candidates},null,2));
 console.log(JSON.stringify({candidates:candidates.length,requests:requests.length}));if(candidates.length!==50)throw Error('Incomplete corpus');
}
(process.argv.includes('--html')||process.argv.includes('--probe-seeds')?htmlCorpus():main()).catch(error=>{console.error(error.message);process.exitCode=1});
