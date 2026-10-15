// Browser preview adapter only. Android and iOS use storage.ts / SQLite.
import type { Article,Settings } from './content/types';
import { parseSettings } from './content/settings';
import {mergeArticle} from './content/articleState';
import {storedArticle} from './content/storedArticle';
import { evictable } from './content/cache';
import {parseLearning,migrateLearning,type Learning} from './content/recommendations';
import {parseAIMetrics,type AIMetrics} from './content/aiPreparation';
import {categoryMigration} from './content/categoryMigration';
import {parseRegistry,type CategoryRegistry} from './content/categoryRegistry';
import {parseClassificationCache,type ClassificationCache} from './content/classification';
import {recoverOnboarding,parseOnboarding,setInitialInterests,type OnboardingState} from './content/onboarding';
let rows:Article[]=[];
let visits:Article[]=[];
const write=()=>localStorage.setItem('synapse-native-articles',JSON.stringify(rows));
export async function initStorage(){
 const read=(key:string):Article[]=>{try{const value:unknown=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value.map(storedArticle).filter((a):a is Article=>!!a):[]}catch{return []}};
 rows=read('synapse-native-articles');visits=read('synapse-native-visits');
}
export async function getArticles(){return [...rows].sort((a,b)=>b.fetchedAt-a.fetchedAt)}
export async function initOnboarding(){
 // Recover a multi-key preview write before reading the authoritative state.
 const journal=localStorage.getItem('synapse-native-onboarding-journal');
 if(journal){const before=JSON.parse(journal) as [string,string|null][];for(const [key,value] of before)value===null?localStorage.removeItem(key):localStorage.setItem(key,value);localStorage.removeItem('synapse-native-onboarding-journal')}
 const state=recoverOnboarding(localStorage.getItem('synapse-native-onboarding'),localStorage.getItem('synapse-native-onboarding-backup'),{preferenceKeys:['settings','learning','category-registry','category-classifications','ai-metrics'].filter(k=>localStorage.getItem('synapse-native-'+k)!==null),visits:visits.length,saved:rows.filter(a=>a.saved).length,read:rows.filter(a=>a.readAt).length});
 localStorage.setItem('synapse-native-onboarding',JSON.stringify(state));return state;
}
export async function putOnboarding(next:OnboardingState,applyInterests=false){
 const keys=['synapse-native-onboarding','synapse-native-onboarding-backup','synapse-native-learning'],before=keys.map(k=>[k,localStorage.getItem(k)] as [string,string|null]);
 const old=parseOnboarding(before[0][1]);if(old&&next.revision<=old.revision){if(JSON.stringify(old)===JSON.stringify(next))return applyInterests?getLearning():undefined;throw Error('Configurazione modificata: riapri l’app per riprendere.')}
 parseOnboarding(JSON.stringify(next));const learning=applyInterests&&next.origin==='fresh'?setInitialInterests(await getLearning(),next.draft.interests):undefined;
 localStorage.setItem('synapse-native-onboarding-journal',JSON.stringify(before));
 try{if(learning)await putLearning(learning);if(before[0][1])localStorage.setItem(keys[1],before[0][1]);localStorage.setItem(keys[0],JSON.stringify(next));localStorage.removeItem('synapse-native-onboarding-journal');return learning}
 catch(error){for(const [k,v] of before)v===null?localStorage.removeItem(k):localStorage.setItem(k,v);localStorage.removeItem('synapse-native-onboarding-journal');throw error}
}
export async function putArticles(articles:Article[]){for(const a of articles){const old=rows.find(r=>r.id===a.id);rows=rows.filter(r=>r.id!==a.id);rows.push(mergeArticle(old,a))}write()}
export async function putSavedArticle(article:Article,saved:boolean,learning?:Learning){const before=[...rows],raw=localStorage.getItem('synapse-native-learning');try{if(!rows.some(a=>a.id===article.id))await putArticles([article]);await setSaved(article.id,saved);if(learning)await putLearning(learning)}catch(error){rows=before;write();if(raw!==null)localStorage.setItem('synapse-native-learning',raw);throw error}}
export async function markRead(id:string){const stamp=Date.now();rows=rows.map(a=>a.id===id?{...a,readAt:stamp}:a);const a=rows.find(r=>r.id===id);if(a){visits=[{...a,paragraphs:[],preview:[],complete:false,simplified:undefined},...visits.filter(v=>v.id!==id)].slice(0,500);localStorage.setItem('synapse-native-visits',JSON.stringify(visits))}write()}
export async function getHistory(_knownArticles?:Article[]){const cache=new Map(rows.map(a=>[a.id,a]));return visits.map(a=>({...cache.get(a.id)||a,readAt:a.readAt}))}
export async function setSaved(id:string,saved:boolean){rows=rows.map(a=>a.id===id?{...a,saved}:a);write()}
export async function getSettings():Promise<Settings>{try{return parseSettings(localStorage.getItem('synapse-native-settings'))}catch{return parseSettings(null)}}
export async function putSettings(settings:Settings){localStorage.setItem('synapse-native-settings',JSON.stringify(settings))}
export async function getLearning(){return parseLearning(localStorage.getItem('synapse-native-learning'))}
export async function migrateProfile(articles:Article[],visits:Article[]){const raw=localStorage.getItem('synapse-native-learning'),old=parseLearning(raw);if(old.version===3)return old;const next=migrateLearning(old,articles,visits);if(raw&&!localStorage.getItem('synapse-native-learning-pre-v3-backup'))localStorage.setItem('synapse-native-learning-pre-v3-backup',raw);const clean=(a:Article)=>{const value={...a} as Article&{readingMetadata?:unknown};delete value.readingMetadata;return value};rows=rows.map(clean);visits=visits.map(clean);write();localStorage.setItem('synapse-native-visits',JSON.stringify(visits));await putLearning(next);return next}
export async function putLearning(learning:Learning){localStorage.setItem('synapse-native-learning',JSON.stringify(learning))}
export async function migrateCategories(){const profile=await getLearning();if(profile.categoryVersion===1)return profile;const next=categoryMigration(profile,rows,visits),keys=['synapse-native-articles','synapse-native-visits','synapse-native-learning'],before=keys.map(k=>localStorage.getItem(k));if(!localStorage.getItem('synapse-native-category-pre-v1-backup'))localStorage.setItem('synapse-native-category-pre-v1-backup',JSON.stringify({keys,values:before}));try{localStorage.setItem(keys[0],JSON.stringify(next.articles));localStorage.setItem(keys[1],JSON.stringify(next.visits));await putLearning(next.profile);rows=next.articles;visits=next.visits;return next.profile}catch(error){keys.forEach((k,i)=>before[i]===null?localStorage.removeItem(k):localStorage.setItem(k,before[i]!));throw error}}
export async function putClassifiedArticles(items:Article[],learning:Learning){const old=[...rows],raw=localStorage.getItem('synapse-native-learning');try{await putArticles(items);await putLearning(learning)}catch(error){rows=old;write();if(raw===null)localStorage.removeItem('synapse-native-learning');else localStorage.setItem('synapse-native-learning',raw);throw error}}
export async function getCategoryRegistry(){return parseRegistry(localStorage.getItem('synapse-native-category-registry'))}
export async function putCategoryRegistry(value:CategoryRegistry){localStorage.setItem('synapse-native-category-registry',JSON.stringify(value))}
export async function getClassificationCache(){return parseClassificationCache(localStorage.getItem('synapse-native-category-classifications'))}
export async function putClassificationCache(value:ClassificationCache){localStorage.setItem('synapse-native-category-classifications',JSON.stringify(value))}
export async function getAIMetrics(){return parseAIMetrics(localStorage.getItem('synapse-native-ai-metrics'))}
export async function putAIMetrics(metrics:AIMetrics){localStorage.setItem('synapse-native-ai-metrics',JSON.stringify(metrics))}
export async function prune(protect:Set<string>){const ids=evictable(rows,protect);rows=rows.filter(a=>!ids.includes(a.id));write();return ids}
