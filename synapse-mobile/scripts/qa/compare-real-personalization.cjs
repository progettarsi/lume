const fs=require('fs'),{performance}=require('perf_hooks'),path=require('path');
const qa=path.resolve('releases/qa/personalization-v3-2026-10-10'),old=require(path.join(qa,'baseline-build/recommendations')),next=require('../../.test-build/recommendations'),{Wikipedia}=require('../../.test-build/wikipedia');
const corpus=JSON.parse(fs.readFileSync('releases/qa/editorial-selection-2026-10-09/corpus.json','utf8'));
const rows=corpus.candidates.flatMap(x=>new Wikipedia().articles({query:{pages:[x.page]}},x.category));
const out={method:corpus.method,warning:'Stratified historical Wikipedia corpus, not user-labelled relevance. Report category presence only, including scarcity.',candidates:rows.length,categories:{}};
for(const category of [...new Set(rows.map(a=>a.category))]){const signals=rows.filter(a=>a.category===category).slice(0,3);let a=old.emptyLearning(),b=next.emptyLearning();for(const s of signals){a=old.learn(a,s,'save');b=next.learn(b,s,'save')}
 const remaining=rows.filter(r=>!signals.some(s=>s.id===r.id));const rank=(engine,p)=>engine.rankRecommendations(remaining,p,()=>.5).slice(0,10).map(a=>({title:a.title,category:a.category}));out.categories[category]={signals:signals.map(a=>a.title),available:remaining.filter(a=>a.category===category).length,before:rank(old,a),after:rank(next,b)};
}
const synthetic=require('./personalization-corpus.cjs'),times={before:[],after:[]};let a=old.emptyLearning(),b=next.emptyLearning();for(const e of synthetic.scenarios.switch){a=old.learn(a,e.article,e.kind);b=next.learn(b,e.article,e.kind)}
for(let i=0;i<240;i++){for(const name of i%2?['before','after']:['after','before']){const engine=name==='before'?old:next,p=name==='before'?a:b,t=performance.now();engine.rankRecommendations(synthetic.rows,p,()=>.5);if(i>=40)times[name].push(performance.now()-t)}}
out.cpuInterleaved=Object.fromEntries(Object.entries(times).map(([k,v])=>{v.sort((a,b)=>a-b);return [k,{median:v[100],p95:v[190],samples:v.length}]}));
fs.writeFileSync(path.join(qa,'real-corpus-and-cpu.json'),JSON.stringify(out,null,2));console.log(JSON.stringify({candidates:out.candidates,categories:Object.fromEntries(Object.entries(out.categories).map(([k,v])=>[k,{available:v.available,before:v.before.filter(x=>x.category===k).length,after:v.after.filter(x=>x.category===k).length}])),cpu:out.cpuInterleaved}));
