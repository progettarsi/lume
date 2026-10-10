// Read-only public-source probe. No personal profile, credentials or Gemini.
// Run after compiling test modules. Explicit cap: four HTTP calls, no retries.
const {Wikipedia}=require('../../.test-build/wikipedia');
const {CATEGORIES}=require('../../.test-build/categories');
const {assessEditorial}=require('../../.test-build/editorial');
const {classifyLocal}=require('../../.test-build/classification');
const {generalAudienceScore,makePreview,paragraphsFromExtract}=require('../../.test-build/text');
const fs=require('node:fs');
(async()=>{
 const topics=CATEGORIES.filter(c=>c.id!=='curiosity'),supplement=process.argv[3]==='--supplement',titles=supplement?['Mimetismo','Migrazione degli uccelli','Quokka','Wombat','Illusionismo','Circo','Danza','Cabaret']:[...new Set(topics.flatMap(c=>c.seeds.slice(0,2)))],wiki=new Wikipedia();let calls=0;const sources=[];
 for(let index=0;index<titles.length;index+=11){if(calls>=4)throw Error('Probe budget exceeded');calls++;const data=await wiki.request({action:'query',titles:titles.slice(index,index+11).join('|'),prop:'extracts|info|revisions|categories|pageprops',exintro:'1',explaintext:'1',exlimit:'max',inprop:'url',rvprop:'ids',ppprop:'disambiguation',cllimit:'24',clshow:'!hidden',redirects:'1'},undefined,1);
  for(const p of data.query?.pages||[]){if(p.missing||Object.hasOwn(p.pageprops||{},'disambiguation'))continue;const paragraphs=paragraphsFromExtract(p.extract||''),row=classifyLocal({id:'wiki:'+p.pageid,title:p.title,category:'general',paragraphs,preview:makePreview(paragraphs),source:p.fullurl,revision:p.revisions?.[0]?.revid,sourceCategories:(p.categories||[]).map(c=>c.title),fetchedAt:0});sources.push({requestedBy:topics.filter(c=>c.seeds.slice(0,2).includes(p.title)).map(c=>c.id),...row,readable:generalAudienceScore(row.title,paragraphs)>=.45,eligible:assessEditorial(row).eligible})}
 }
 const report={calls,topics:topics.map(c=>({id:c.id,matching:sources.filter(a=>a.category===c.id&&a.readable&&a.eligible).map(a=>a.title)})),sources};
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({calls,topics:report.topics,missing:report.topics.filter(c=>!c.matching.length).map(c=>c.id)},null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1});
