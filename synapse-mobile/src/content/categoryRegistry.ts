import {CATEGORIES,categoryId,normalizeTopic} from './categories';
import type {Article} from './types';
import {identity,type Learning} from './recommendations';
import type {FeedState} from './feedAvailability';
import type {TopicProposal} from './classification';

export const REGISTRY_VERSION=1,RAIL_LIMIT=8;
const INITIAL=['science','technology','history','nature','geography','arts'];
export type TopicRecord={id:string;label:string;parent?:string;evidence:string[];verified:boolean};
export type CategoryRegistry={version:1;topics:Record<string,TopicRecord>;visible:string[]};
export function emptyRegistry():CategoryRegistry{return {version:1,topics:{},visible:INITIAL}}
export function parseRegistry(raw:string|null):CategoryRegistry{
 try{const x=JSON.parse(raw||'null');if(x?.version!==REGISTRY_VERSION||!Array.isArray(x.visible))return emptyRegistry();const topics:Record<string,TopicRecord>={};
  for(const v of Object.values(x.topics||{}).slice(0,64) as TopicRecord[]){if(!v||typeof v.label!=='string'||!Array.isArray(v.evidence))continue;const id=categoryId(v.id)||categoryId(v.label)||`proposal:${normalizeTopic(v.label)}`;topics[id]={id,label:CATEGORIES.find(c=>c.id===id)?.label||v.label.slice(0,24),parent:categoryId(v.parent||''),evidence:[...new Set(v.evidence.filter(s=>typeof s==='string'))].slice(-8),verified:!!categoryId(id)&&v.verified===true}}
  return {version:1,topics,visible:[...new Set<string>(x.visible.map((s:string)=>typeof s==='string'?categoryId(s):undefined).filter(Boolean))].slice(0,RAIL_LIMIT)};
 }catch{return emptyRegistry()}
}
export function observeTopics(registry:CategoryRegistry,rows:Article[],proposals:TopicProposal[]=[]):CategoryRegistry{
 const topics={...registry.topics};for(const a of rows){if(!a.classification||a.classification.confidence<.35||!a.preview.length)continue;const source=identity(a);for(const [id,t] of Object.entries(topics))if(id!==a.category&&t.evidence.includes(source))topics[id]={...t,evidence:t.evidence.filter(s=>s!==source)};const c=CATEGORIES.find(c=>c.id===a.category);if(!c)continue;const old=topics[c.id];topics[c.id]={id:c.id,label:c.label,parent:c.parent,verified:true,evidence:[...new Set([...(old?.evidence||[]),source])].slice(-8)}}
 for(const p of proposals.slice(0,4)){const known=categoryId(p.label),id=known||`proposal:${normalizeTopic(p.label)}`;if(!topics[id]&&Object.keys(topics).length<64)topics[id]={id,label:p.label,parent:p.parent,evidence:[],verified:false}}
 return {...registry,topics};
}
function interest(id:string,p:Learning){const distinct=new Set([...(p.recent||[]).filter(s=>s.category===id),...Object.values(p.bookmarks||{}).filter(s=>s.on&&s.category===id)].map(s=>s.id));const saves=Object.values(p.bookmarks||{}).filter(b=>b.on&&b.category===id).length;return distinct.size>=3||saves>=2}
function score(id:string,p:Learning,rows:Article[]){const recent=(p.recent||[]).filter(s=>s.category===id).reduce((sum,s)=>sum+s.weight*Math.pow(.5,Math.max(0,(p.sequence||0)-s.order)/3),0);return Math.log1p(p.categories[id]||0)+Math.log1p(recent)*2+Math.min(2,rows.filter(a=>a.category===id&&!a.readAt).length)*.25}
/** Membership/order changes only on an explicit safe checkpoint. A selected
 * exhausted category stays present until navigation has completed. Offline
 * preserves the last membership, including dynamically activated topics. */
export function settleRegistry(r:CategoryRegistry,p:Learning,rows:Article[],availability:Record<string,FeedState>,selected='all',online=true):CategoryRegistry{
 if(!online)return r;
 const eligible=CATEGORIES.filter(c=>r.visible.includes(c.id)||INITIAL.includes(c.id)||r.topics[c.id]?.verified&&r.topics[c.id].evidence.length>=2&&interest(c.id,p)&&rows.some(a=>a.category===c.id&&a.preview.length)).map(c=>c.id).filter(id=>id===selected||!(availability[id]?.phase==='exhausted'||availability[id]?.exhausted));
 if(selected!=='all'&&!eligible.includes(selected)&&categoryId(selected))eligible.push(selected);
 // An incumbent is overtaken only by a margin of 1.5. Reversing that
 // order requires the same margin in the other direction, not a boundary tick.
 eligible.sort((a,b)=>{const difference=score(b,p,rows)-score(a,p,rows);return Math.abs(difference)>=1.5?difference:(r.visible.indexOf(a)<0?99:r.visible.indexOf(a))-(r.visible.indexOf(b)<0?99:r.visible.indexOf(b))});
 const incumbents=eligible.filter(id=>r.visible.includes(id));
 let visible=[...incumbents,...eligible.filter(id=>!incumbents.includes(id)).slice(0,Math.max(0,RAIL_LIMIT-incumbents.length))].sort((a,b)=>eligible.indexOf(a)-eligible.indexOf(b));if(selected!=='all'&&!visible.includes(selected))visible=[...visible.slice(0,RAIL_LIMIT-1),selected];
 const index=r.visible.indexOf(selected);if(index>=0&&visible.includes(selected)){visible=visible.filter(id=>id!==selected);visible.splice(Math.min(index,visible.length),0,selected)}
 return {...r,visible};
}
export type CategoryRailItem={id:string;label:string;icon:string;selected:boolean;order:number;visible:boolean;enabled:boolean;reason?:'offline'|'exhausted'|'service'|'limit'|'unavailable';actions:('select'|'retry'|'home')[]};
export function categoryRailItems(r:CategoryRegistry,selected:string,online:boolean,states:Record<string,FeedState>):CategoryRailItem[]{
 return ['all',...r.visible].map((id,order)=>{const c=CATEGORIES.find(c=>c.id===id),s=states[id];const reason=id==='all'?undefined:!online?'offline':s?.exhausted||s?.phase==='exhausted'?'exhausted':['service','limit','unavailable'].includes(s?.phase||'')?s!.phase as 'service'|'limit'|'unavailable':undefined;const enabled=!reason||['service','limit','unavailable'].includes(reason);
  return {id,label:id==='all'?'Per Te':c?.label||'Enciclopedia',icon:c?.icon||'compass-outline',selected:id===selected,order,visible:true,enabled,reason,actions:id==='all'?['select']:enabled?['select',...(reason?['retry' as const]:[])]:id===selected?['home']:[]};
 });
}
