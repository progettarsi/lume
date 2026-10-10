const fs=require('fs'),path=require('path'),{performance}=require('perf_hooks');
const corpus=require('./personalization-corpus.cjs');
const root=path.resolve(__dirname,'../..'),qa=path.join(root,'releases/qa/personalization-v3-2026-10-10');
const before=require(path.join(qa,'baseline-build/recommendations')),after=require(path.join(root,'.test-build/recommendations'));
const now=Date.now();
function profile(engine,events){return events.reduce((p,e)=>engine.learn(p,e.article,e.kind,...(engine===before?[0,now]:[now])),engine.emptyLearning())}
function metrics(order){const top=order.slice(0,10);return {target:top.filter(a=>a.category==='science').length,previous:top.filter(a=>a.category==='nature').length,first:top.some(a=>a.category==='science')?top.findIndex(a=>a.category==='science')+1:null,variety:new Set(top.map(a=>a.category)).size,order:top.map(a=>a.id)}}
const results={method:'80 synthetic candidates, 8 labelled themes, 20 shared seeds; no measured user satisfaction',scenarios:{}};
for(const [name,events] of Object.entries(corpus.scenarios)){
 const rows=name==='scarce'?corpus.rows.filter(a=>a.category!=='science'||a.id==='candidate-0-0'):corpus.rows;
 const samples=[];for(let seed=1;seed<=20;seed++){
 const old=profile(before,events),next=profile(after,events),cold=before.rankRecommendations(rows,profile(before,name==='switch'?corpus.events(1,20):[]),corpus.rng(seed));
 samples.push({beforeRank:metrics(before.rankRecommendations(rows,old,corpus.rng(seed))),beforeShown:metrics(cold),after:metrics(after.rankRecommendations(rows,next,corpus.rng(seed))),restart:JSON.stringify(after.rankRecommendations(rows,next,()=>.5).map(a=>a.id))===JSON.stringify(after.rankRecommendations(rows,after.parseLearning(JSON.stringify(next)),()=>.5).map(a=>a.id))});
 }
 results.scenarios[name]={samples,mean:Object.fromEntries(['beforeRank','beforeShown','after'].map(k=>[k,Object.fromEntries(['target','previous','first','variety'].map(m=>[m,samples.filter(x=>x[k][m]!==null).reduce((s,x)=>s+x[k][m],0)/Math.max(1,samples.filter(x=>x[k][m]!==null).length)]))]))};
}
results.interactions=Array.from({length:6},(_,n)=>({count:n,save:metrics(after.rankRecommendations(corpus.rows,profile(after,corpus.events(0,n)),()=>.5)),open:metrics(after.rankRecommendations(corpus.rows,profile(after,corpus.events(0,n,'open')),()=>.5))}));
results.cpu={};for(const [name,engine] of [['before',before],['after',after]]){const p=profile(engine,corpus.scenarios.switch),times=[];for(let i=0;i<100;i++){const t=performance.now();engine.rankRecommendations(corpus.rows,p,()=>.5);times.push(performance.now()-t)}times.sort((a,b)=>a-b);results.cpu[name]={medianMs:times[50],p95Ms:times[95]}}
fs.writeFileSync(path.join(qa,'comparison.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify({scenarios:Object.fromEntries(Object.entries(results.scenarios).map(([k,v])=>[k,v.mean])),interactions:results.interactions,cpu:results.cpu},null,2));

