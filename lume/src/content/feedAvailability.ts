import type {Article} from './types';
import {reserveArticleBytes} from './reserve';
import {identity,seenArticle,type Learning} from './recommendations';
import {previewOnly,RESERVE_TARGET,PREVIEW_BYTES,RESERVE_BYTES} from './reserve';
import {articleBytes} from './cache';

export const FEED_ATTEMPTS=3,FEED_TIMEOUT=10000,RECHECK_MS=5*60000;
export type FeedPhase='idle'|'loading'|'searching'|'retrying'|'ready'|'exhausted'|'service'|'limit'|'unavailable';
export type FeedState={phase:FeedPhase;after?:number;attempts?:number;exhausted?:boolean};
export const FEED_COPY={
 loading:{title:'La prossima scoperta',message:'Carichiamo gli articoli…',icon:'cloud-download-outline'},
 searching:{title:'Altre scoperte',message:'Cerchiamo altri articoli…',icon:'magnify'},
 retrying:{title:'Un momento',message:'Non riusciamo a caricare nuovi articoli. Riproviamo tra poco.',icon:'cloud-refresh-outline'},
 service:{title:'Servizio temporaneamente indisponibile',message:'Non riusciamo a caricare nuovi articoli. Riprova tra poco.',icon:'cloud-alert-outline'},
 limit:{title:'Una breve pausa',message:'Abbiamo raggiunto il limite di richieste. Riprova tra poco.',icon:'timer-sand'},
 unavailable:{title:'Caricamento non disponibile',message:'Non riusciamo a caricare questi articoli. Riprova più tardi.',icon:'information-outline'},
 exhausted:{title:'Altre scoperte ti aspettano',message:'Per ora non ci sono nuovi articoli in questa categoria.',icon:'compass-outline'},
 allEmpty:{title:'Nuove scoperte in arrivo',message:'Per ora non abbiamo trovato nuove anteprime. Riprova tra poco.',icon:'compass-outline'},
 offline:{title:'Sei offline',message:'Non ci sono articoli disponibili offline. Collegati per caricarli.',icon:'cloud-off-outline'},
 offlineCategory:{title:'Sei offline',message:'Questa categoria richiede una connessione. Puoi continuare con gli articoli locali in Per Te.',icon:'cloud-off-outline'},
 return:'Ti riportiamo a Per Te tra pochi secondi.',retry:'Riprova',home:'Vai a Per Te',cancel:'Annulla ritorno',connect:'Controlla connessione',
 offlineShort:'📴 Sei offline',offlineRepeat:'📴 Sei offline · Alcuni articoli si ripetono',offlineLarge:'📴 Offline · Contenuti ripetuti',
} as const;
export function waitForFeed(ms:number,signal:AbortSignal):Promise<void>{return new Promise((resolve,reject)=>{
 const cancel=()=>{clearTimeout(timer);signal.removeEventListener('abort',cancel);reject(signal.reason)};
 const timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve()},ms);
 signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel();
})}
function assertActive(signal:AbortSignal){if(signal.aborted)throw signal.reason??new Error('Richiesta annullata')}
/** One request per attempt. Empty responses advance the provider; transport
 * retries are disabled for this path so the budgets cannot multiply. */
export async function recoverFeed(request:(attempt:number)=>Promise<number>,signal:AbortSignal,onState:(state:FeedState)=>void=()=>{},wait=waitForFeed,now=Date.now):Promise<FeedState>{
 let validEmpty=0,last:FeedPhase='service';
 for(let attempt=1;attempt<=FEED_ATTEMPTS;attempt++){
  assertActive(signal);onState({phase:attempt===1?'loading':validEmpty===attempt-1?'searching':'retrying',attempts:attempt});
  try{const added=await request(attempt);assertActive(signal);if(added>0)return {phase:'ready',attempts:attempt};validEmpty++;last='exhausted'}
  catch(error){assertActive(signal);const e=error as {kind?:string;retryAfterMs?:number;recoverable?:boolean};
   if(e.kind==='limit')return {phase:'limit',attempts:attempt,after:now()+Math.max(30000,e.retryAfterMs??0)};
   if(e.retryAfterMs)return {phase:'service',attempts:attempt,after:now()+Math.max(30000,e.retryAfterMs)};
   if(e.recoverable===false||e.kind==='content')return {phase:'unavailable',attempts:attempt,after:now()+RECHECK_MS};
   last='service';if(attempt<FEED_ATTEMPTS){onState({phase:'retrying',attempts:attempt});await wait(750*2**(attempt-1),signal)}
  }
 }
 // Any failed request means that availability has not been established.
 return {phase:validEmpty===FEED_ATTEMPTS?'exhausted':last==='exhausted'?'service':last,attempts:FEED_ATTEMPTS,after:now()+(validEmpty===FEED_ATTEMPTS?RECHECK_MS:30000)};
}
export function repeatedArticle(a:Article,learning:Learning,served:Set<string>){return !!a.readAt||seenArticle(a,learning)||served.has(a.id)}
/** Local readability is independent of acquisition/editorial filters and seen.
 * Keep bounded previews, deduplicate aliases, and place unseen contents first. */
export function offlineReserve(rows:Article[],learning:Learning,served:Set<string>,avoid:string[]=[]):Article[]{
 const sources=new Set<string>(),ids=new Set<string>();let bytes=0;
 const usable=rows.filter(a=>a&&typeof a.id==='string'&&Array.isArray(a.preview)&&a.preview.length&&a.preview.every(p=>typeof p==='string'&&!!p.trim()));
 usable.sort((a,b)=>Number(repeatedArticle(a,learning,served))-Number(repeatedArticle(b,learning,served))||Number(avoid.includes(a.id))-Number(avoid.includes(b.id))||b.fetchedAt-a.fetchedAt);
 const ordered:Article[]=[];
 while(usable.length){const tier=repeatedArticle(usable[0],learning,served);let index=usable.findIndex(a=>repeatedArticle(a,learning,served)===tier&&!avoid.includes(a.id)&&a.category!==ordered.at(-1)?.category);if(index<0)index=0;ordered.push(...usable.splice(index,1))}
 return ordered.filter(a=>{const key=identity(a),size=reserveArticleBytes(a);if(ids.size>=RESERVE_TARGET||ids.has(a.id)||sources.has(key)||size>PREVIEW_BYTES||bytes+size>RESERVE_BYTES)return false;ids.add(a.id);sources.add(key);bytes+=size;return true});
}
export function offlineContinuation(current:Article[],position:number,local:Article[],learning:Learning,served:Set<string>){
 if(!current.length)return offlineReserve(local,learning,served);
 const prefix=current.slice(0,position+1),future=current.slice(position+1),keys=new Set([...prefix,...future].map(identity));
 const fresh=offlineReserve(local,learning,served).filter(a=>!repeatedArticle(a,learning,served)&&!keys.has(identity(a)));
 if(future.length||fresh.length)return [...prefix,...future,...fresh];
 const alternatives=offlineReserve(local,learning,served,prefix.slice(-2).map(a=>a.id)).filter(a=>a.id!==prefix.at(-1)?.id&&identity(a)!==identity(prefix.at(-1)!));
 // Reset the window around the current card, so repeated identities never
 // collide as React keys and a single local card remains usable.
 return [...prefix.slice(-1),...alternatives];
}
export function categoryDisabled(id:string,online:boolean,state?:FeedState){return id!=='all'&&(!online||state?.phase==='exhausted'||!!state?.exhausted)}
export function canRecheck(state:FeedState|undefined,now=Date.now()){return !state?.after||state.after<=now}

/** Single cancellable navigation clock. Background time never counts. */
export class FeedReturnClock{
 remaining=5000;private started=0;private active=false;cancelled=false;done=false;
 constructor(private now=Date.now){}
 resume(){if(!this.active&&!this.cancelled&&!this.done){this.started=this.now();this.active=true}}
 pause(){this.tick();this.active=false}
 cancel(){this.pause();this.cancelled=true}
 tick(){if(this.active){const now=this.now();this.remaining=Math.max(0,this.remaining-(now-this.started));this.started=now;if(!this.remaining){this.done=true;this.active=false}}return this.remaining}
}
