// Lume was previously called Synapse. Installed copies keep their data under the
// old names until these helpers move it once to the new names.

export const DATABASE='lume.db';
export const LEGACY_DATABASE='synapse.db';
export const AI_KEY='lume-ai-key';
export const LEGACY_AI_KEY='synapse-ai-key';
export const PHOTO_FOLDER='lume-profile';
export const LEGACY_PHOTO_FOLDER='synapse-profile';
export const WEB_PREFIX='lume-';
export const LEGACY_WEB_PREFIX='synapse-native-';
export const WEB_KEYS=['articles','visits','onboarding','onboarding-backup','onboarding-journal','settings','learning','learning-pre-v3-backup','category-registry','category-pre-v1-backup','category-classifications','ai-metrics'] as const;
export const webKey=(name:string)=>WEB_PREFIX+name;

type Db={getFirstAsync<T>(sql:string,...args:unknown[]):Promise<T|null>;closeAsync():Promise<void>};
export type LegacyDatabasePort<D extends Db>={open(name:string):Promise<D>;backup(source:D,destination:D):Promise<void>;remove(name:string):Promise<void>};
const hasArticles=async(db:Db)=>!!(await db.getFirstAsync("SELECT 1 AS present FROM sqlite_master WHERE type='table' AND name='articles'"));
const articleCount=async(db:Db)=>(await db.getFirstAsync<{n:number}>('SELECT COUNT(*) AS n FROM articles'))?.n??0;

/**
 * Copies the legacy database into a still empty current database with SQLite's
 * online backup, then removes the legacy file once the copy is verified. A failed
 * copy propagates, leaving the legacy file and an empty current database so the
 * next launch tries again. Returns true when legacy data was adopted.
 */
export async function adoptLegacyDatabase<D extends Db>(db:D,port:LegacyDatabasePort<D>):Promise<boolean>{
 if(await hasArticles(db))return false;
 const legacy=await port.open(LEGACY_DATABASE);let adopted=false,verified=false;
 try{
  if(await hasArticles(legacy)){
   await port.backup(legacy,db);adopted=true;
   verified=await hasArticles(db)&&await articleCount(db)===await articleCount(legacy);
  }else verified=true;
 }finally{await legacy.closeAsync().catch(()=>{})}
 if(verified)await port.remove(LEGACY_DATABASE).catch(()=>{});
 return adopted;
}

type SecretStore={getItemAsync(key:string):Promise<string|null>;setItemAsync(key:string,value:string):Promise<void>;deleteItemAsync(key:string):Promise<void>};
/** Reads the AI key, moving a key saved under the legacy name on first access. */
export async function readSecret(store:SecretStore):Promise<string|null>{
 const current=await store.getItemAsync(AI_KEY);if(current!==null)return current;
 const legacy=await store.getItemAsync(LEGACY_AI_KEY);if(legacy===null)return null;
 await store.setItemAsync(AI_KEY,legacy);await store.deleteItemAsync(LEGACY_AI_KEY).catch(()=>{});return legacy;
}
export async function writeSecret(store:SecretStore,value:string){
 const key=value.trim();
 if(key)await store.setItemAsync(AI_KEY,key);else await store.deleteItemAsync(AI_KEY);
 await store.deleteItemAsync(LEGACY_AI_KEY).catch(()=>{});
}

type KeyValue={getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void};
/** Moves browser-preview values to the new prefix; values already moved win. */
export function migrateWebKeys(storage:KeyValue){
 for(const name of WEB_KEYS){
  const old=LEGACY_WEB_PREFIX+name,value=storage.getItem(old);if(value===null)continue;
  if(storage.getItem(webKey(name))===null)storage.setItem(webKey(name),value);
  storage.removeItem(old);
 }
}
