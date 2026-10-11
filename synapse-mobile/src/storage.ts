import * as SQLite from 'expo-sqlite';
import type { Article, Settings } from './content/types';
import { parseSettings } from './content/settings';
import { evictable } from './content/cache';
import {mergeArticle} from './content/articleState';
import {databaseQueue} from './content/databaseQueue';
import {parseLearning,migrateLearning,type Learning} from './content/recommendations';
import {parseAIMetrics,type AIMetrics} from './content/aiPreparation';
import {categoryMigration} from './content/categoryMigration';
import {parseRegistry,type CategoryRegistry} from './content/categoryRegistry';
import {parseClassificationCache,type ClassificationCache} from './content/classification';
import {recoverOnboarding,parseOnboarding,setInitialInterests,type OnboardingState} from './content/onboarding';
type Row={id:string;json:string;saved:number;read_at:number|null;touched:number};
const decode=(r:Row):Article=>({...JSON.parse(r.json),saved:!!r.saved,readAt:r.read_at||undefined,fetchedAt:r.touched});
const run=databaseQueue(async()=>{
  const db=await SQLite.openDatabaseAsync('synapse.db',{useNewConnection:true});
  try{
    await db.execAsync('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS articles(id TEXT PRIMARY KEY,json TEXT NOT NULL,saved INTEGER NOT NULL DEFAULT 0,read_at INTEGER,touched INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS preferences(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS visits(id TEXT PRIMARY KEY,json TEXT NOT NULL,read_at INTEGER NOT NULL); PRAGMA user_version=2;');
    await db.getFirstAsync('SELECT 1');return db;
  }catch(error){await db.closeAsync().catch(()=>{});throw error}
},db=>db.closeAsync());
const articles=async(db:SQLite.SQLiteDatabase)=>(await db.getAllAsync<Row>('SELECT * FROM articles ORDER BY touched DESC')).map(decode);
export function initStorage(){return run(async()=>{})}
export function initOnboarding(){return run(async db=>{
 const rows=await db.getAllAsync<{key:string;value:string}>('SELECT key,value FROM preferences');
 const values=new Map(rows.map(r=>[r.key,r.value]));
 const count=await db.getFirstAsync<{saved:number;read:number}>('SELECT COALESCE(SUM(saved),0) AS saved,COUNT(read_at) AS read FROM articles');
 const visits=await db.getFirstAsync<{n:number}>('SELECT COUNT(*) AS n FROM visits');
 const raw=values.get('onboarding')??null;
 const state=recoverOnboarding(raw,values.get('onboarding-backup')??null,{preferenceKeys:rows.map(r=>r.key).filter(k=>!k.startsWith('onboarding')),saved:count?.saved??0,read:count?.read??0,visits:visits?.n??0});
 if(raw!==JSON.stringify(state))await db.withTransactionAsync(async()=>{
  if(raw)await db.runAsync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)','onboarding-recovery-source',raw);
  await db.runAsync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)','onboarding',JSON.stringify(state));
 });
 return state;
})}
export function putOnboarding(next:OnboardingState,applyInterests=false){return run(async db=>{
 let learning:Learning|undefined;
 await db.withTransactionAsync(async()=>{
  const row=await db.getFirstAsync<{value:string}>('SELECT value FROM preferences WHERE key=?','onboarding');
  const old=parseOnboarding(row?.value??null);
  if(old&&next.revision<=old.revision){if(JSON.stringify(old)===JSON.stringify(next)){if(applyInterests){const p=await db.getFirstAsync<{value:string}>('SELECT value FROM preferences WHERE key=?','learning');learning=parseLearning(p?.value??null)}return}throw Error('Configurazione modificata: riapri l’app per riprendere.');}
  parseOnboarding(JSON.stringify(next));
  if(applyInterests&&next.origin==='fresh'){
   const p=await db.getFirstAsync<{value:string}>('SELECT value FROM preferences WHERE key=?','learning');
   learning=setInitialInterests(parseLearning(p?.value??null),next.draft.interests);
   await db.runAsync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)','learning',JSON.stringify(learning));
  }
  if(row)await db.runAsync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)','onboarding-backup',row.value);
  await db.runAsync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)','onboarding',JSON.stringify(next));
 });return learning;
})}
export function getArticles(){return run(articles)}
// Transactions reuse the owned connection; every public operation passes through the same queue.
export function putArticles(items:Article[]){return run(async db=>{
  await db.withTransactionAsync(async()=>{for(const a of items){
    const row=await db.getFirstAsync<Row>('SELECT * FROM articles WHERE id=?',a.id);
    const merged=mergeArticle(row?decode(row):undefined,a);
    await db.runAsync('INSERT INTO articles(id,json,touched) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json,touched=excluded.touched',a.id,JSON.stringify(merged),a.fetchedAt);
  }});
})}
export function putSavedArticle(article:Article,saved:boolean,learning?:Learning){return run(async db=>{
  await db.withTransactionAsync(async()=>{
    const row=await db.getFirstAsync<Row>('SELECT * FROM articles WHERE id=?',article.id);
    // A bookmark intent (including undo) must not overwrite a newer cached edition.
    const merged={...(row?decode(row):article),saved};
    await db.runAsync('INSERT INTO articles(id,json,saved,touched) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json,saved=excluded.saved,touched=excluded.touched',article.id,JSON.stringify(merged),saved?1:0,article.fetchedAt);
    if(learning)await db.runAsync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)','learning',JSON.stringify(learning));
  });
})}
export function markRead(id:string){const stamp=Date.now();return run(async db=>{
  const row=await db.getFirstAsync<Row>('SELECT * FROM articles WHERE id=?',id);if(!row)return;
  const article={...decode(row),paragraphs:[],preview:[],simplified:undefined,simplifiedInput:undefined,simplifiedPrepared:undefined,complete:false,readAt:stamp};
  await db.withTransactionAsync(async()=>{await db.runAsync('UPDATE articles SET read_at=? WHERE id=?',stamp,id);await db.runAsync('INSERT OR REPLACE INTO visits(id,json,read_at) VALUES(?,?,?)',id,JSON.stringify(article),stamp);await db.runAsync('DELETE FROM visits WHERE id NOT IN (SELECT id FROM visits ORDER BY read_at DESC LIMIT 500)')});
})}
export function getHistory(){return run(async db=>{const rows=await db.getAllAsync<{json:string}>('SELECT json FROM visits ORDER BY read_at DESC');const cached=new Map((await articles(db)).map(a=>[a.id,a]));return rows.map(r=>{const a=JSON.parse(r.json) as Article;return {...(cached.get(a.id)||a),readAt:a.readAt}})})}
export function setSaved(id:string,saved:boolean){return run(db=>db.runAsync('UPDATE articles SET saved=? WHERE id=?',saved?1:0,id))}
export function getSettings():Promise<Settings>{return run(async db=>{const r=await db.getFirstAsync<{value:string}>('SELECT value FROM preferences WHERE key=?','settings');return parseSettings(r?.value)})}
export function putSettings(settings:Settings){return run(db=>db.runAsync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)','settings',JSON.stringify(settings)))}
export function getLearning(){return run(async db=>{const r=await db.getFirstAsync<{value:string}>('SELECT value FROM preferences WHERE key=?','learning');return parseLearning(r?.value||null)})}
export function migrateProfile(articles:Article[],visits:Article[]){return run(async db=>{
 const row=await db.getFirstAsync<{value:string}>('SELECT value FROM preferences WHERE key=?','learning'),old=parseLearning(row?.value||null);
 if(old.version===3)return old;
 const next=migrateLearning(old,articles,visits);
 await db.withTransactionAsync(async()=>{
  if(row)await db.runAsync('INSERT OR IGNORE INTO preferences(key,value) VALUES(?,?)','learning-pre-v3-backup',row.value);
  // Retire derived metadata only; preserve every article, visit and explicit setting.
  for(const table of ['articles','visits'])for(const entry of await db.getAllAsync<{id:string;json:string}>(`SELECT id,json FROM ${table}`)){
   const value=JSON.parse(entry.json);if('readingMetadata' in value){delete value.readingMetadata;await db.runAsync(`UPDATE ${table} SET json=? WHERE id=?`,JSON.stringify(value),entry.id)}
  }
  await db.runAsync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)','learning',JSON.stringify(next));
 });return next;
})}
export function putLearning(learning:Learning){return run(db=>db.runAsync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)','learning',JSON.stringify(learning)))}
export function migrateCategories(){return run(async db=>{
 const raw=await db.getFirstAsync<{value:string}>('SELECT value FROM preferences WHERE key=?','learning'),profile=parseLearning(raw?.value||null);
 if(profile.categoryVersion===1)return profile;
 const rows=await articles(db),visits=await db.getAllAsync<{id:string;json:string}>('SELECT id,json FROM visits'),next=categoryMigration(profile,rows,visits.map(r=>JSON.parse(r.json)));
 await db.withTransactionAsync(async()=>{
  await db.runAsync('INSERT OR IGNORE INTO preferences(key,value) VALUES(?,?)','category-pre-v1-backup',JSON.stringify({learning:raw?.value||null,articles:rows,visits}));
  for(const a of next.articles)await db.runAsync('UPDATE articles SET json=? WHERE id=?',JSON.stringify(a),a.id);
  for(const a of next.visits)await db.runAsync('UPDATE visits SET json=? WHERE id=?',JSON.stringify(a),a.id);
  await db.runAsync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)','learning',JSON.stringify(next.profile));
 });return next.profile;
})}
export function putClassifiedArticles(items:Article[],learning:Learning){return run(async db=>{
 await db.withTransactionAsync(async()=>{for(const a of items){const row=await db.getFirstAsync<Row>('SELECT * FROM articles WHERE id=?',a.id);const merged=mergeArticle(row?decode(row):undefined,a);await db.runAsync('INSERT INTO articles(id,json,touched) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json,touched=excluded.touched',a.id,JSON.stringify(merged),a.fetchedAt)}await db.runAsync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)','learning',JSON.stringify(learning))});
})}
export function getCategoryRegistry(){return run(async db=>{const r=await db.getFirstAsync<{value:string}>('SELECT value FROM preferences WHERE key=?','category-registry');return parseRegistry(r?.value||null)})}
export function putCategoryRegistry(value:CategoryRegistry){return run(db=>db.runAsync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)','category-registry',JSON.stringify(value)))}
export function getClassificationCache(){return run(async db=>{const r=await db.getFirstAsync<{value:string}>('SELECT value FROM preferences WHERE key=?','category-classifications');return parseClassificationCache(r?.value||null)})}
export function putClassificationCache(value:ClassificationCache){return run(db=>db.runAsync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)','category-classifications',JSON.stringify(value)))}
export function getAIMetrics(){return run(async db=>{const r=await db.getFirstAsync<{value:string}>('SELECT value FROM preferences WHERE key=?','ai-metrics');return parseAIMetrics(r?.value||null)})}
export function putAIMetrics(metrics:AIMetrics){return run(db=>db.runAsync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)','ai-metrics',JSON.stringify(metrics)))}
export function prune(protect:Set<string>){return run(async db=>{const ids=evictable(await articles(db),protect);await db.withTransactionAsync(async()=>{for(const id of ids)await db.runAsync('DELETE FROM articles WHERE id=? AND saved=0',id)});return ids})}
