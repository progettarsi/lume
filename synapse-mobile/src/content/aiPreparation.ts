import type {Article} from './types';
import {validRevision,revisionInput,revisedArticle} from './revision';
import {continuation} from './text';
import {SimplificationError} from './simplifier';
export const AI_DWELL_MS=3500,AI_SPEC_PER_MINUTE=2;
type Clock={now:()=>number;set:(fn:()=>void,delay:number)=>unknown;clear:(id:unknown)=>void};
const clock:Clock={now:Date.now,set:(fn,ms)=>setTimeout(fn,ms),clear:id=>clearTimeout(id as ReturnType<typeof setTimeout>)};
export class DwellGate{
 private identity='';private timer:unknown;
 constructor(private fire:()=>void,private time:Clock=clock,private threshold=AI_DWELL_MS){}
 update(identity:string){if(identity===this.identity)return;this.clear();this.identity=identity;if(identity)this.timer=this.time.set(()=>{this.timer=undefined;this.fire()},this.threshold)}
 clear(){if(this.timer!==undefined)this.time.clear(this.timer);this.timer=undefined;this.identity=''}
}
export type AIMetrics={preparations:number;adoptedPreparations:number;specStarted:number;usedInFlight:number;usedCached:number;unused:number;cancelled:number;failures:number;opens:{classicMs:number;aiMs:number;mode:string}[]};
export const emptyAIMetrics=():AIMetrics=>({preparations:0,adoptedPreparations:0,specStarted:0,usedInFlight:0,usedCached:0,unused:0,cancelled:0,failures:0,opens:[]});
export function parseAIMetrics(value:string|null):AIMetrics{const clean=emptyAIMetrics();try{const x=JSON.parse(value||'null');for(const k of ['preparations','adoptedPreparations','specStarted','usedInFlight','usedCached','unused','cancelled','failures'] as const)if(Number.isSafeInteger(x?.[k])&&x[k]>=0)clean[k]=x[k];clean.opens=(Array.isArray(x?.opens)?x.opens:[]).filter((s:{classicMs:number;aiMs:number;mode:string})=>s&&Number.isFinite(s.classicMs)&&Number.isFinite(s.aiMs)&&s.classicMs>=0&&s.aiMs>=0&&['cache','inflight','explicit','fallback'].includes(s.mode)).slice(-40).map((s:{classicMs:number;aiMs:number;mode:string})=>({classicMs:s.classicMs,aiMs:s.aiMs,mode:s.mode}));}catch{}return clean}
type Job={id:string;input:string;abort:AbortController;claimed:boolean;spec:boolean;generated:boolean;epoch:number;original?:Article;full:Promise<Article>;result:Promise<Article|undefined>};
export class AIPreparation{
 private key='';private enabled=false;private epoch=0;private job?:Job;private starts:number[]=[];
 private attempted=new Set<string>();private pauseUntil=0;private blocked=false;private failed=new Map<string,Error>();
 private opening?:{at:number;classic:number;mode:string};
 metrics=emptyAIMetrics();
 constructor(private full:(a:Article,s:AbortSignal)=>Promise<Article>,private generate:(a:Article,key:string,s:AbortSignal)=>Promise<string[]|undefined>,private save:(a:Article)=>Promise<void>,private report:(m:AIMetrics)=>void=()=>{},private now=Date.now){}
 configure(key:string,enabled:boolean){key=key.trim();if(key===this.key&&enabled===this.enabled)return false;this.cancel(true);this.key=key;this.enabled=enabled;this.epoch++;this.attempted.clear();this.failed.clear();this.pauseUntil=0;this.blocked=false;return true}
 available(){return this.enabled&&!!this.key}
 canPrepare(a:Article){this.starts=this.starts.filter(t=>this.now()-t<60000);return this.available()&&!this.job&&!validRevision(a)&&!this.blocked&&this.now()>=this.pauseUntil&&this.starts.length<AI_SPEC_PER_MINUTE&&!this.attempted.has(revisionInput(a))}
 cancel(force=false){const j=this.job;if(j&&(!j.claimed||force)){j.abort.abort();if(j.generated&&!j.claimed){this.metrics.unused++;this.metrics.cancelled++}this.job=undefined;this.emit()}}
 claim(id:string){const j=this.job;if(j?.id===id&&!j.abort.signal.aborted){if(j.spec&&!j.claimed){this.metrics.adoptedPreparations++;if(j.generated)this.metrics.usedInFlight++;this.emit()}j.claimed=true;return true}this.cancel();return false}
 fullInFlight(a:Article){const j=this.job;if(j?.id===a.id&&!j.abort.signal.aborted){if(JSON.stringify(JSON.parse(j.input)[6])===JSON.stringify(a.preview)&&(!a.complete||revisionInput(a)===(j.original?revisionInput(j.original):j.input)))return j.full;this.cancel(true)}return undefined}
 beginOpen(){this.opening={at:this.now(),classic:0,mode:'explicit'}}
 abandonOpen(){this.opening=undefined}
 originalReady(){if(this.opening)this.opening.classic=this.now()-this.opening.at}
 finishOpen(mode:string,opening=this.opening){if(this.opening&&opening===this.opening){this.metrics.opens.push({classicMs:this.opening.classic,aiMs:this.now()-this.opening.at,mode});this.metrics.opens=this.metrics.opens.slice(-40);this.opening=undefined;this.emit()}}
 async prepare(a:Article,signal:AbortSignal){if(!this.canPrepare(a)||signal.aborted)return;this.starts.push(this.now());this.attempted.add(revisionInput(a));this.metrics.preparations++;this.emit();return this.start(a,true,signal)}
 async request(a:Article,signal:AbortSignal,retry=false):Promise<Article|undefined>{
  const opening=this.opening,epoch=this.epoch;if(!this.available()||signal.aborted)return;
  if(validRevision(a)){if(a.simplifiedPrepared){this.metrics.usedCached++;this.metrics.unused=Math.max(0,this.metrics.unused-1);this.emit();a={...a,simplifiedPrepared:false};await this.save(a)}if(signal.aborted||epoch!==this.epoch)return;this.finishOpen('cache',opening);return a}
  const existing=this.job;if(existing?.id===a.id&&revisionInput(await existing.full)!==revisionInput(a)&&this.job===existing)this.cancel(true);if(this.job&&this.job.id!==a.id)this.cancel(true);if(signal.aborted||epoch!==this.epoch||!this.available())return;
  if(this.claim(a.id)){const job=this.job!;const abort=()=>{if(this.job===job)this.cancel(true);else job.abort.abort()};signal.addEventListener('abort',abort,{once:true});try{const result=await job.result;if(signal.aborted)return;this.finishOpen(result?'inflight':'fallback',opening);return result}finally{signal.removeEventListener('abort',abort)}}
  if(!retry&&(this.blocked||this.now()<this.pauseUntil||this.failed.has(revisionInput(a)))){this.finishOpen('fallback',opening);throw this.failed.get(revisionInput(a))||new SimplificationError('Revisione Gemini temporaneamente sospesa dopo un errore del servizio.')}
  const result=await this.start(a,false,signal);if(signal.aborted)return;this.finishOpen(result?'explicit':'fallback',opening);return result;
 }
 private start(a:Article,spec:boolean,signal:AbortSignal){
  const abort=new AbortController(),epoch=this.epoch,key=this.key;
  const j={id:a.id,input:revisionInput(a),abort,claimed:!spec,spec,generated:false,epoch} as Job;this.job=j;
  const cancel=()=>{if(!spec||!j.claimed){if(this.job===j)this.cancel(true);else abort.abort()}};signal.addEventListener('abort',cancel,{once:true});
  j.full=a.complete&&a.textVersion===3?Promise.resolve(a):this.full(a,abort.signal);
  j.result=(async()=>{let input=j.input;try{
   const full=await j.full;if(abort.signal.aborted||epoch!==this.epoch)return;j.original=full;input=revisionInput(full);this.attempted.add(input);if(this.attempted.size>200)this.attempted.delete(this.attempted.values().next().value!);if(abort.signal.aborted||epoch!==this.epoch)return;
   if(!full.complete)throw new SimplificationError('Approfondimento originale non disponibile.');
   if(validRevision(full))return full;
   if(!continuation(full.paragraphs,full.preview).length)return full;
   if(spec&&!j.claimed){j.generated=true;this.metrics.specStarted++;this.emit()}const text=await this.generate(full,key,abort.signal);if(!text||abort.signal.aborted||epoch!==this.epoch)return;
   const revised={...revisedArticle(full,text),simplifiedPrepared:spec&&!j.claimed};await this.save(revised);if(abort.signal.aborted||epoch!==this.epoch)return;
   this.failed.delete(input);this.pauseUntil=0;this.blocked=false;
   if(j.generated&&!j.claimed){this.metrics.unused++;this.emit()}
   return revised;
  }catch(error){if(abort.signal.aborted||epoch!==this.epoch)return;const failure=error instanceof Error?error:new Error('Revisione non disponibile');this.metrics.failures++;if(j.generated&&!j.claimed)this.metrics.unused++;this.failed.set(input,failure);if(this.failed.size>80)this.failed.delete(this.failed.keys().next().value!);
   const kind=error instanceof SimplificationError?error.kind:'network';this.pauseUntil=this.now()+(kind==='quota'?600000:60000);if(kind==='auth')this.blocked=true;this.emit();if(!spec||j.claimed)throw failure;
  }finally{signal.removeEventListener('abort',cancel);if(this.job===j)this.job=undefined}})();
  // A foreground claimant may await the same result even while full downloads.
  void j.result.catch(()=>{});return j.result;
 }
 private emit(){this.report({...this.metrics,opens:[...this.metrics.opens]})}
}
