const fs=require('fs'),path=require('path');
const proposal=JSON.parse(fs.readFileSync('tools/agent-orchestration/.runtime/discovery-candidates-37e72d2b/response.json','utf8'));
const candidates=JSON.parse(proposal.changes.find(c=>c.path==='synapse-mobile/docs/DISCOVERY-CANDIDATES.json').content);
if(!Array.isArray(candidates)||candidates.length!==240||candidates.some(c=>typeof c.title!=='string'||!/^\w+$/.test(c.category)))throw Error('Invalid inventory');
const dir='releases/qa/discovery-2026-10-14/sources';fs.mkdirSync(dir,{recursive:true});
let next=0,ok=0,failed=0,servicePauses=0,paused=false;
async function worker(){while(next<candidates.length){const i=next++,c=candidates[i],file=path.join(dir,String(i).padStart(3,'0')+'.json');if(fs.existsSync(file)){ok++;continue}try{
const url=new URL('https://it.wikipedia.org/w/api.php');Object.entries({action:'query',format:'json',formatversion:'2',prop:'extracts|info|revisions|pageprops',explaintext:'1',exsectionformat:'wiki',exlimit:'1',inprop:'url',rvprop:'ids',redirects:'1',titles:c.title}).forEach(([k,v])=>url.searchParams.set(k,v));
const response=await fetch(url,{headers:{'User-Agent':'Lume/0.2 (educational reader; source preparation)'},signal:AbortSignal.timeout(20000)});if(response.status===429||response.status===503){const delay=Math.max(60000,Number(response.headers.get('retry-after')||60)*1000);console.log('Service pause',delay);if(++servicePauses>3){next=i;paused=true;return}await new Promise(r=>setTimeout(r,delay));next=i;continue}if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();const page=data.query?.pages?.[0];if(!page||page.missing||page.pageprops?.disambiguation!==undefined||!page.extract)throw Error('No article');fs.writeFileSync(file,JSON.stringify({candidate:c,page},null,2));ok++;
}catch(e){failed++;fs.appendFileSync(path.join(dir,'failures.log'),JSON.stringify({i,...c,error:e.message})+'\n')}
if((ok+failed)%25===0)console.log({done:ok+failed,ok,failed});await new Promise(r=>setTimeout(r,6500));}}
new Promise(r=>setTimeout(r,90000)).then(()=>worker()).then(()=>console.log({complete:!paused&&next>=candidates.length,paused,ok,failed}));

