import {CATEGORIES,categoryOrder} from './categories';
import type {Article} from './types';
import {PERSONALIZATION as P} from './personalization';
import {assessEditorial,repetitionScorer} from './editorial';
type Signal={id:string;category:string;tokens:string[];title:string;weight:number;order:number;kind:'open'|'save'};
type Bookmark=Signal&{on:boolean};
export type Learning={seen:string[];categories:Record<string,number>;topics:Record<string,number>;updatedAt:number;version?:number;categoryVersion?:number;bookmarks?:Record<string,Bookmark>;opens?:Record<string,number>;recent?:Signal[];sequence?:number};
export const emptyLearning=():Learning=>({seen:[],categories:{},topics:{},updatedAt:Date.now(),version:3,bookmarks:{},opens:{},recent:[],sequence:0});
export function identity(a:Article):string{try{return decodeURIComponent(new URL(a.source).pathname).replaceAll('_',' ').toLocaleLowerCase('it')}catch{return a.id}}
export function seenArticle(a:Article,learning:Learning){return !!a.readAt||learning.seen.includes(a.id)||learning.seen.includes(identity(a))}
const stop=new Set('della delle degli nella nelle dello dallo dalla storia effetto questo questa questi queste quello quella hanno essere viene vengono anche quando molto delle della attraverso quindi permette esempio infatti primo prima parte forma mondo anni come sono sulla sulle degli quale quali oltre altri altre tutti tutte stato stata stati state della delle'.split(' '));
export function interestTerms(a:Article){
 const words=(s:string)=>(s.toLocaleLowerCase('it').match(/[\p{L}]{5,}/gu)||[]).filter(w=>!stop.has(w));
 const title=words(a.title),counts=new Map<string,number>();for(const w of words(a.preview.join(' ').slice(0,1800)))counts.set(w,(counts.get(w)||0)+1);
 return [...new Set([...title,...(a.topics||[]).map(id=>'topic:'+id),...[...counts].sort((a,b)=>b[1]-a[1]).map(([w])=>w)])].slice(0,P.maxTerms);
}
function weighted(old:Learning,category:string,terms:string[],weight:number){const categories={...old.categories,[category]:Math.max(0,(old.categories[category]||0)+weight)},topics={...old.topics};for(const w of terms)topics[w]=Math.max(0,(topics[w]||0)+weight);return {...old,categories,topics};}
function remember(next:Learning,input:Signal){const {id,category,tokens,title,weight,order,kind}=input;const s:Signal={id,category,tokens,title,weight,order,kind};return {...next,recent:[...(next.recent||[]).filter(e=>!(e.id===s.id&&e.kind===s.kind)),s].sort((a,b)=>a.order-b.order).slice(-P.recentLimit)}}
// Aggregates v1/v2 mix unknowable temporal contributions: rebuild, never subtract a guess.
export function migrateLearning(old:Learning,articles:Article[],visits:Article[]):Learning{
 if(old.version===P.version)return old;
 let next=emptyLearning();next.seen=[...new Set([...old.seen,...visits.flatMap(a=>[a.id,identity(a)])])];
 const known=new Map([...visits,...articles].map(a=>[identity(a),a]));
 const opened=new Map(visits.map(a=>[identity(a),a]));for(const id of Object.keys(old.opens||{})){const a=known.get(id);if(a)opened.set(id,a)}
 for(const a of [...opened.values()].sort((a,b)=>(a.readAt||0)-(b.readAt||0)))next=learn(next,a,'open');
 for(const a of articles.filter(a=>a.saved))next=learn(next,a,'save');
 // Historical data establish continuity, not a fabricated recent burst.
 return {...next,recent:[],sequence:0,bookmarks:Object.fromEntries(Object.entries(next.bookmarks||{}).map(([id,b])=>[id,{...b,order:0}]))};
}
export function learn(old:Learning,a:Article,event:'open'|'save'|'unsave'|'seen',now=Date.now()):Learning{
 const id=identity(a);
 if(event==='seen')return {...old,seen:[...new Set([...old.seen,a.id,id])]};
 if(event==='open'&&old.opens?.[id]!==undefined)return old;
 const previous=old.bookmarks?.[id];
 if(event==='save'&&previous?.on||event==='unsave'&&!previous?.on)return old;
 const order=(old.sequence||0)+1,signal:Signal={id,category:a.category,tokens:interestTerms(a),title:a.title,weight:event==='open'?P.openWeight:P.saveWeight,order,kind:event==='open'?'open':'save'};
 let next={...old,updatedAt:now};
 if(event==='open'){
  next=weighted(next,a.category,signal.tokens,P.openWeight);next.seen=[...new Set([...old.seen,a.id,id])];
  next.opens={...old.opens,[id]:now};next.sequence=order;return remember(next,signal);
 }
 if(event==='unsave'){
  next=weighted(next,previous!.category,previous!.tokens,-previous!.weight);
  return {...next,bookmarks:{...old.bookmarks,[id]:{...previous!,on:false}},recent:(old.recent||[]).filter(e=>!(e.kind==='save'&&e.id===id))};
 }
 // Re-saving restores the same contribution/order: undo cannot manufacture recency.
 const saved=previous??signal;next=weighted(next,saved.category,saved.tokens,saved.weight);
 next.bookmarks={...old.bookmarks,[id]:{...saved,on:true}};next.sequence=previous?old.sequence:order;
 return saved.order===0?next:remember(next,saved);
}
/** Move only independently attributable contributions. Old aggregate opens
 * outside recent memory cannot be reconstructed: leave those mass values alone.
 * Off bookmarks are also corrected so undo restores the new category exactly. */
export function reconcileCategories(old:Learning,rows:Article[]):Learning{
 const bySource=new Map(rows.filter(a=>a.classification&&a.classification.confidence>=.35).map(a=>[identity(a),a]));
 if(![...Object.values(old.bookmarks||{}),...(old.recent||[])].some(s=>bySource.has(s.id)&&bySource.get(s.id)!.category!==s.category))return old;
 let next={...old,categories:{...old.categories},bookmarks:{...old.bookmarks},recent:[...(old.recent||[])]};
 const move=(from:string,to:string,weight:number)=>{if(from===to)return;next.categories[from]=Math.max(0,(next.categories[from]||0)-weight);next.categories[to]=(next.categories[to]||0)+weight};
 for(const [id,b] of Object.entries(next.bookmarks)){const a=bySource.get(id);if(!a||b.category===a.category)continue;if(b.on)move(b.category,a.category,b.weight);next.bookmarks[id]={...b,category:a.category}}
 next.recent=next.recent.map(s=>{const a=bySource.get(s.id);if(!a||s.category===a.category)return s;if(s.kind==='open')move(s.category,a.category,s.weight);return {...s,category:a.category}});
 return next;
}
function recentScores(p:Learning){const categories:Record<string,number>={},topics:Record<string,number>={};let mass=0;
 for(const e of p.recent||[]){const w=e.weight*Math.pow(.5,Math.max(0,(p.sequence||0)-e.order)/P.recentHalfLife);mass+=w;categories[e.category]=(categories[e.category]||0)+w;for(const t of e.tokens)topics[t]=(topics[t]||0)+w}
 return {categories,topics,mass};
}
function affinity(a:Article,p:Learning,r:ReturnType<typeof recentScores>){const terms=interestTerms(a),category=Math.min(3,Math.log1p(p.categories[a.category]||0))*P.categoryWeight;
 const topic=terms.reduce((s,t)=>s+Math.min(3,Math.log1p(p.topics[t]||0)),0)/Math.max(1,terms.length)*P.topicWeight;
 const recent=((r.categories[a.category]||0)+terms.reduce((s,t)=>s+(r.topics[t]||0),0)/Math.max(1,terms.length))/(r.mass+P.confidenceMass)*P.recentWeight;
 return category+topic+recent;
}
export function personalizedCategories(p:Learning,fallback:string[]=[]){const r=recentScores(p);return categoryOrder(fallback).sort((a,b)=>((p.categories[b]||0)+2*(r.categories[b]||0))-((p.categories[a]||0)+2*(r.categories[a]||0)))}
export function chooseCategory(p:Learning,random=Math.random):string{
 const r=recentScores(p),values=CATEGORIES.map(c=>Math.min(3,Math.log1p(p.categories[c.id]||0))+(r.categories[c.id]||0)/(r.mass+P.confidenceMass)*P.recentWeight),total=values.reduce((a,b)=>a+b,0);
 const weights=values.map(v=>P.exploration/CATEGORIES.length+(1-P.exploration)*(total?v/total:1/CATEGORIES.length));let pick=random();for(let i=0;i<weights.length;i++){pick-=weights[i];if(pick<=0)return CATEGORIES[i].id}return CATEGORIES.at(-1)!.id;
}
export function discoveryAnchor(p:Learning,random=Math.random){
 const signals=[...(p.recent||[]),...Object.values(p.bookmarks||{}).filter(b=>b.on)];const unique=[...new Map(signals.map(s=>[s.id,s])).values()];
 // One accidental opening must not steer acquisition.
 const candidates=unique.filter(s=>s.weight>=P.saveWeight||unique.filter(t=>t.category===s.category).length>=3);
 const weights=candidates.map(s=>s.weight*Math.pow(.5,Math.max(0,(p.sequence||0)-s.order)/P.recentHalfLife)),total=weights.reduce((a,b)=>a+b,0);let pick=random()*total;
 for(let i=0;i<candidates.length;i++){pick-=weights[i];if(pick<=0)return candidates[i]}return undefined;
}
export function explainRecommendation(a:Article,p:Learning,random=.5){const interest=affinity(a,p,recentScores(p)),editorial=Math.max(0,assessEditorial(a).score)*P.editorialWeight,exploration=random*P.noise;return {score:interest+editorial+exploration,interest,editorial,exploration}}
export function rankRecommendations(rows:Article[],p:Learning,random=Math.random,recent:Article[]=[],_now=Date.now()):Article[]{
 const r=recentScores(p),ids=new Set<string>();const scored=rows.filter(a=>{const id=identity(a);if(seenArticle(a,p)||ids.has(id))return false;ids.add(id);return true}).map(article=>({article,interest:affinity(article,p,r),quality:Math.max(0,assessEditorial(article).score)*P.editorialWeight,noise:random()*P.noise}));
 const output:Article[]=[],previous=recent.slice(-3),repetition=repetitionScorer();
 while(scored.length){const history=[...previous,...output].slice(-3),explore=(recent.length+output.length+1)%P.exploreEvery===0;let best=-1,value=-Infinity;
  for(let i=0;i<scored.length;i++){const s=scored[i];if(history.length>=2&&s.article.category===history.at(-1)?.category&&s.article.category===history.at(-2)?.category)continue;
   const adjusted=(explore?-s.interest*.25:s.interest)+s.quality+s.noise-repetition(s.article,history);if(adjusted>value){value=adjusted;best=i}}
  output.push(scored.splice(best<0?0:best,1)[0].article);
 }return output;
}
export function parseLearning(json:string|null):Learning{
 try{const x=JSON.parse(json||'null');if(!x||!Array.isArray(x.seen))return {...emptyLearning(),version:1};
 const scores=(v:unknown):Record<string,number>=>Object.fromEntries(Object.entries(v&&typeof v==='object'?v:{}).filter(([k,n])=>k.length<500&&typeof n==='number'&&Number.isFinite(n)&&n>=0));
 const signal=(v:any):v is Signal=>v&&typeof v.id==='string'&&typeof v.category==='string'&&typeof v.title==='string'&&Array.isArray(v.tokens)&&v.tokens.every((t:unknown)=>typeof t==='string')&&Number.isFinite(v.weight)&&v.weight>=0&&v.weight<=P.saveWeight&&Number.isFinite(v.order)&&v.order>=0&&(v.kind==='save'||v.kind==='open');
 const bookmarks:Record<string,Bookmark>={};for(const [k,v] of Object.entries(x.bookmarks||{}))if(signal(v)&&typeof (v as Bookmark).on==='boolean')bookmarks[k]=v as Bookmark;
 return {seen:x.seen.filter((s:unknown)=>typeof s==='string'),categories:scores(x.categories),topics:scores(x.topics),updatedAt:Number.isFinite(x.updatedAt)?x.updatedAt:Date.now(),version:x.version===3?3:x.version===2?2:1,categoryVersion:x.categoryVersion===1?1:undefined,bookmarks,opens:scores(x.opens),recent:Array.isArray(x.recent)?x.recent.filter(signal).slice(-P.recentLimit):[],sequence:Number.isFinite(x.sequence)?Math.max(0,x.sequence):0};
 }catch{return {...emptyLearning(),version:1}}
}
