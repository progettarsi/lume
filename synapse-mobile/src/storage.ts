import * as SQLite from 'expo-sqlite';
import type { Article, Settings } from './content/types';
import { parseSettings } from './content/settings';
import { evictable } from './content/cache';
import {mergeArticle} from './content/articleState';
import {databaseQueue} from './content/databaseQueue';
import {parseLearning,migrateLearning,type Learning} from './content/recommendations';
import {parseAIMetrics,type AIMetrics} from './content/aiPreparation';
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
export function getAIMetrics(){return run(async db=>{const r=await db.getFirstAsync<{value:string}>('SELECT value FROM preferences WHERE key=?','ai-metrics');return parseAIMetrics(r?.value||null)})}
export function putAIMetrics(metrics:AIMetrics){return run(db=>db.runAsync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)','ai-metrics',JSON.stringify(metrics)))}
export function prune(protect:Set<string>){return run(async db=>{const ids=evictable(await articles(db),protect);await db.withTransactionAsync(async()=>{for(const id of ids)await db.runAsync('DELETE FROM articles WHERE id=? AND saved=0',id)});return ids})}
