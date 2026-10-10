// Reproducible JS cost comparison; host timings are not device FPS or latency.
const {performance}=require('node:perf_hooks'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),old=path.join(root,'releases/qa/performance-2026-10-09/before/contracts'),next=path.join(root,'.test-build');
const input='Le molecole dell’atmosfera diffondono la luce in tutte le direzioni. Le lunghezze d’onda più corte vengono diffuse maggiormente, per questo il cielo appare blu. Nel 1871 questo fenomeno fu descritto con un modello fisico. ';
const rows=Array.from({length:80},(_,i)=>({id:`wiki:${i}`,title:`Diffusione della luce ${i}`,category:i%2?'nature':'science',source:`https://it.wikipedia.org/wiki/Luce_${i}`,paragraphs:Array.from({length:12},()=>input),preview:[input],complete:true,fetchedAt:1}));
const profile=require(path.join(next,'recommendations')).emptyLearning(),served=new Set(),views=new (require(path.join(next,'libraryViews')).LibraryViews)();
function time(fn,count){const times=[];for(let i=0;i<count;i++){const start=performance.now();fn();times.push(performance.now()-start)}times.sort((a,b)=>a-b);return {medianMs:+times[Math.floor(times.length/2)].toFixed(3),maxMs:+times.at(-1).toFixed(3),runs:count}}
const before=require(path.join(old,'reserve')).reserveArticles,after=require(path.join(next,'reserve')).reserveArticles;
const expected=before(rows,profile,served).map(a=>a.id),actual=after(rows,profile,served).map(a=>a.id);require('node:assert/strict').deepEqual(actual,expected);
const result={platform:process.platform,node:process.version,articles:80,paragraphsPerArticle:12,coldBefore:time(()=>before(rows,profile,served),12),coldAfter:time(()=>after(rows,profile,served),12),unrelatedUIBefore:time(()=>before(rows,profile,served),30),unrelatedUIAfter:time(()=>views.reserve(rows,profile,served,0),30),identicalOrder:true};
const output=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'releases/qa/performance-2026-10-09/benchmark-library.json');
fs.writeFileSync(output,JSON.stringify(result,null,2));console.log(result);
