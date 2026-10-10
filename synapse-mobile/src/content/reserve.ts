import type {Article} from './types';
import {articleBytes} from './cache';
import {generalAudienceScore} from './text';
import {identity,rankRecommendations,seenArticle,type Learning} from './recommendations';
import {assessEditorial,orderEditorial} from './editorial';

export const RESERVE_TARGET=30,RESERVE_LOW=20,RESERVE_BYTES=512*1024,PREVIEW_BYTES=16*1024;
export const CATEGORY_RESERVE=8,REFILL_AHEAD=12,FEED_WINDOW=64;
export const BACKGROUND_JOBS_PER_MINUTE=6,BACKGROUND_GAP=1800;
export function previewOnly(a:Article):Article{return {...a,paragraphs:a.preview,complete:false,simplified:undefined,simplifiedVersion:undefined,simplifiedPreview:undefined,simplifiedInput:undefined,simplifiedPrepared:undefined,contentIssue:undefined,contentIssueKind:undefined}}
export function reserveArticles(rows:Article[],learning:Learning,served:Set<string>,category='all'):Article[]{
  const ids=new Set<string>(),sources=new Set<string>();let bytes=0;
  const ranked=rankRecommendations(rows.filter(a=>a.preview.length&&!seenArticle(a,learning)&&!served.has(a.id)&&generalAudienceScore(a.title,a.paragraphs)>=.45&&assessEditorial(a).eligible),learning,()=>.5);
  if(category!=='all')ranked.sort((a,b)=>Number(b.category===category)-Number(a.category===category));
  return ranked.filter(a=>{
    const source=identity(a),size=articleBytes(previewOnly(a));
    if(ids.has(a.id)||sources.has(source)||size>PREVIEW_BYTES||bytes+size>RESERVE_BYTES||ids.size>=RESERVE_TARGET)return false;
    ids.add(a.id);sources.add(source);bytes+=size;return true;
  });
}
export function appendDiscoveries(current:Article[],incoming:Article[],learning:Learning,served:Set<string>):Article[]{
  const ids=new Set(current.map(a=>a.id)),sources=new Set(current.map(identity));
  const unique=incoming.filter(a=>{
    const source=identity(a);if(ids.size>=FEED_WINDOW||seenArticle(a,learning)||served.has(a.id)||ids.has(a.id)||sources.has(source))return false;
    ids.add(a.id);sources.add(source);return true;
  });
  return unique.length?[...current,...rankRecommendations(unique,learning,Math.random,current.slice(-3))]:current;
}
/** Re-rank the future only. The visible card and every preceding identity stay put. */
export function refreshFuture(current:Article[],incoming:Article[],learning:Learning,served:Set<string>,position:number){
  const prefix=current.slice(0,Math.max(0,position+1)),ids=new Set(prefix.map(identity));
  const future=[...current.slice(prefix.length),...incoming].filter(a=>{const id=identity(a);if(!a.preview.length||!assessEditorial(a).eligible||generalAudienceScore(a.title,a.paragraphs)<.45||ids.has(id)||served.has(a.id)||seenArticle(a,learning))return false;ids.add(id);return true});
  return [...prefix,...rankRecommendations(future,learning,()=>.5,prefix.slice(-3))].slice(0,FEED_WINDOW);
}
export type ReserveContext={enabled:boolean;category:string;pool:Article[];pendingFull:boolean;refresh?:boolean};
export function reserveContext(enabled:boolean,category:string,pool:()=>Article[],pendingFull:boolean):ReserveContext{
  // Suspension must not perform expensive selection before reserveDemand can
  // reject the work. Reader/persistence retains its explicit protection path.
  return {enabled,category,pool:enabled?pool():[],pendingFull};
}
export function reserveDemand(context:ReserveContext):string|null|undefined{
  if(!context.enabled)return undefined;
  if(context.refresh)return 'all';
  if(context.pool.length<RESERVE_LOW)return 'all';
  if(context.category!=='all'&&context.pool.filter(a=>a.category===context.category).length<CATEGORY_RESERVE)return context.category;
  if(context.pool.length<RESERVE_TARGET)return 'all';
  return context.pendingFull?null:undefined;
}
type Clock={now:()=>number;set:(fn:()=>void,delay:number)=>unknown;clear:(handle:unknown)=>void};
const realClock:Clock={now:Date.now,set:(fn,delay)=>setTimeout(fn,delay),clear:handle=>clearTimeout(handle as ReturnType<typeof setTimeout>)};
// One background job, with bounded API rounds, spacing, sliding request budget
// and finite automatic retries. Interactive work cancels it instead of waiting.
export class ReserveScheduler{
  private timer:unknown;private controller?:AbortController;private disposed=false;
  private jobs:number[]=[];private failures=new Map<string,{count:number;after:number}>();
  private next=0;running=false;
  constructor(private context:()=>ReserveContext,private work:(category:string|null,signal:AbortSignal)=>Promise<number>,private clock:Clock=realClock){}
  interrupt(){if(this.timer!==undefined)this.clock.clear(this.timer);this.timer=undefined;this.controller?.abort()}
  afterForeground(){this.next=Math.max(this.next,this.clock.now()+BACKGROUND_GAP);this.wake()}
  reset(wake=true){this.failures.clear();if(wake)this.wake()}
  dispose(){this.disposed=true;this.interrupt()}
  wake(){if(this.timer!==undefined)this.clock.clear(this.timer);this.timer=undefined;if(!this.disposed)void this.pump()}
  private later(delay:number){if(this.disposed)return;this.timer=this.clock.set(()=>{this.timer=undefined;void this.pump()},Math.max(1,delay))}
  private async pump(){
    if(this.disposed||this.running)return;
    const context=this.context();let demand=reserveDemand(context);if(demand===undefined)return;
    // A depleted category must not starve discoveries from other sources.
    if(demand!==null&&demand!=='all'&&(this.failures.get(demand)?.count??0)>=3)
      demand=context.pool.length<RESERVE_TARGET?'all':context.pendingFull?null:undefined;
    if(demand===undefined)return;
    const key=demand??'full',now=this.clock.now(),failure=this.failures.get(key);
    if(failure&&failure.count>=3)return;
    this.jobs=this.jobs.filter(t=>now-t<60000);
    const wait=Math.max(this.next-now,(failure?.after??0)-now,this.jobs.length>=BACKGROUND_JOBS_PER_MINUTE?this.jobs[0]+60000-now:0);
    if(wait>0){this.later(wait);return}
    const abort=new AbortController();this.controller=abort;this.running=true;this.jobs.push(now);
    try{
      const added=await this.work(demand,abort.signal);
      if(!abort.signal.aborted){if(added>0)this.failures.delete(key);else this.failed(key)}
    }catch{if(!abort.signal.aborted)this.failed(key)}
    finally{this.running=false;this.controller=undefined;this.next=this.clock.now()+BACKGROUND_GAP;this.wake()}
  }
  private failed(key:string){const count=(this.failures.get(key)?.count??0)+1;this.failures.set(key,{count,after:this.clock.now()+Math.min(300000,30000*2**(count-1))})}
}
