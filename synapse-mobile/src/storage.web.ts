// Browser preview adapter only. Android and iOS use storage.ts / SQLite.
import type { Article,Settings } from './content/types';
import { parseSettings } from './content/settings';
import {mergeArticle} from './content/articleState';
import { evictable } from './content/cache';
import {parseLearning,migrateLearning,type Learning} from './content/recommendations';
import {parseAIMetrics,type AIMetrics} from './content/aiPreparation';
let rows:Article[]=[];
let visits:Article[]=[];
const write=()=>localStorage.setItem('synapse-native-articles',JSON.stringify(rows));
export async function initStorage(){try{rows=JSON.parse(localStorage.getItem('synapse-native-articles')||'[]');visits=JSON.parse(localStorage.getItem('synapse-native-visits')||'[]')}catch{rows=[];visits=[]}}
export async function getArticles(){return [...rows].sort((a,b)=>b.fetchedAt-a.fetchedAt)}
export async function putArticles(articles:Article[]){for(const a of articles){const old=rows.find(r=>r.id===a.id);rows=rows.filter(r=>r.id!==a.id);rows.push(mergeArticle(old,a))}write()}
export async function putSavedArticle(article:Article,saved:boolean,learning?:Learning){const before=[...rows],raw=localStorage.getItem('synapse-native-learning');try{if(!rows.some(a=>a.id===article.id))await putArticles([article]);await setSaved(article.id,saved);if(learning)await putLearning(learning)}catch(error){rows=before;write();if(raw!==null)localStorage.setItem('synapse-native-learning',raw);throw error}}
export async function markRead(id:string){const stamp=Date.now();rows=rows.map(a=>a.id===id?{...a,readAt:stamp}:a);const a=rows.find(r=>r.id===id);if(a){visits=[{...a,paragraphs:[],preview:[],complete:false,simplified:undefined},...visits.filter(v=>v.id!==id)].slice(0,500);localStorage.setItem('synapse-native-visits',JSON.stringify(visits))}write()}
export async function getHistory(){const cache=new Map(rows.map(a=>[a.id,a]));return visits.map(a=>({...cache.get(a.id)||a,readAt:a.readAt}))}
export async function setSaved(id:string,saved:boolean){rows=rows.map(a=>a.id===id?{...a,saved}:a);write()}
export async function getSettings():Promise<Settings>{try{return parseSettings(localStorage.getItem('synapse-native-settings'))}catch{return parseSettings(null)}}
export async function putSettings(settings:Settings){localStorage.setItem('synapse-native-settings',JSON.stringify(settings))}
export async function getLearning(){return parseLearning(localStorage.getItem('synapse-native-learning'))}
export async function migrateProfile(articles:Article[],visits:Article[]){const raw=localStorage.getItem('synapse-native-learning'),old=parseLearning(raw);if(old.version===3)return old;const next=migrateLearning(old,articles,visits);if(raw&&!localStorage.getItem('synapse-native-learning-pre-v3-backup'))localStorage.setItem('synapse-native-learning-pre-v3-backup',raw);const clean=(a:Article)=>{const value={...a} as Article&{readingMetadata?:unknown};delete value.readingMetadata;return value};rows=rows.map(clean);visits=visits.map(clean);write();localStorage.setItem('synapse-native-visits',JSON.stringify(visits));await putLearning(next);return next}
export async function putLearning(learning:Learning){localStorage.setItem('synapse-native-learning',JSON.stringify(learning))}
export async function getAIMetrics(){return parseAIMetrics(localStorage.getItem('synapse-native-ai-metrics'))}
export async function putAIMetrics(metrics:AIMetrics){localStorage.setItem('synapse-native-ai-metrics',JSON.stringify(metrics))}
export async function prune(protect:Set<string>){const ids=evictable(rows,protect);rows=rows.filter(a=>!ids.includes(a.id));write();return ids}
