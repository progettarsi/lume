import {CATEGORIES} from './categories';
import type {CategoryRegistry} from './categoryRegistry';
import type {Learning} from './recommendations';
import type {FeedState} from './feedAvailability';
import type {Article} from './types';
import {identity} from './recommendations';

export const ONBOARDING_VERSION=1;
export const STAGES=['intro','identity','interests','tutorial','preparation','home'] as const;
export type OnboardingStage=typeof STAGES[number];
export type LocalIdentity={name:string;photoUri?:string};
export type OnboardingDraft=LocalIdentity&{interests:string[]};
export type OnboardingState={version:1;revision:number;stage:OnboardingStage;tutorialIndex:number;completed:boolean;origin:'fresh'|'legacy';draft:OnboardingDraft;profile:LocalIdentity};
export type MigrationEvidence={preferenceKeys:string[];visits:number;saved:number;read:number};
export function normalizeName(value:string){return Array.from(value.normalize('NFC').replace(/\s+/gu,' ').replace(/[\p{Cc}\u202a-\u202e\u2066-\u2069]/gu,'').trim()).slice(0,48).join('')}
export function validInterests(ids:string[]){return [...new Set(ids)].filter(id=>CATEGORIES.some(c=>c.id===id))}
export function initialOnboarding(e:MigrationEvidence):OnboardingState{
 // Preference rows existed only after the old app had initialized or been used.
 // Cached previews alone are deliberately not evidence of an existing user.
 const existing=e.preferenceKeys.length>0||e.visits>0||e.saved>0||e.read>0;
 return {version:1,revision:0,stage:existing?'home':'intro',tutorialIndex:0,completed:existing,origin:existing?'legacy':'fresh',draft:{name:'',interests:[]},profile:{name:''}};
}
export function parseOnboarding(raw:string|null):OnboardingState|undefined{
 if(raw===null)return undefined;
 const x=JSON.parse(raw);
 const identity=(v:any)=>v&&typeof v.name==='string'&&normalizeName(v.name)===v.name&&(v.photoUri===undefined||typeof v.photoUri==='string'&&v.photoUri.length<2048);
 if(x?.version!==1||!Number.isSafeInteger(x.revision)||x.revision<0||!STAGES.includes(x.stage)||!Number.isInteger(x.tutorialIndex)||x.tutorialIndex<0||x.tutorialIndex>3||typeof x.completed!=='boolean'||x.completed!==(x.stage==='home')||!['fresh','legacy'].includes(x.origin)||!identity(x.draft)||!identity(x.profile)||!Array.isArray(x.draft.interests)||x.draft.interests.some((s:unknown)=>typeof s!=='string'))throw Error('Configurazione locale non leggibile. Riprova senza cancellare i dati.');
 return {...x,draft:{...x.draft,interests:validInterests(x.draft.interests)}};
}
export function recoverOnboarding(raw:string|null,backup:string|null,e:MigrationEvidence){
 try{const state=parseOnboarding(raw);if(state)return state}catch(error){const recovered=parseOnboarding(backup);if(recovered)return recovered;throw error}
 const previous=parseOnboarding(backup);return previous??initialOnboarding(e);
}
export function interestOptions(registry:CategoryRegistry,available:Set<string>){
 // The registry's canonical catalog, never its availability-filtered rail.
 return CATEGORIES.map(c=>({id:c.id,label:registry.topics[c.id]?.label||c.label,available:available.has(c.id),selectable:true as const}));
}
export function setInitialInterests(p:Learning,ids:string[]):Learning{
 const clean=validInterests(ids);
 if(JSON.stringify(p.initialInterests?.ids)===JSON.stringify(clean))return p;
 return {...p,initialInterests:{version:1,ids:clean,sequence:p.initialInterests?.sequence??(p.sequence||0)}};
}
export const ONBOARDING_PRELOAD=10;
export function usablePreviewCount(rows:Article[]){return new Set(rows.filter(a=>a.preview.some(p=>p.trim())).map(identity)).size}
export type Preparation={kind:'loading'|'ready'|'partial'|'offline-empty'|'error';message:string;canEnter:boolean;canRetry:boolean;count:number;target:number};
export function preparationState(count:number,online:boolean,loading:boolean,state:FeedState):Preparation{
 const progress={count,target:ONBOARDING_PRELOAD};
 if(count>=ONBOARDING_PRELOAD)return {...progress,kind:'ready',message:online?'Le prime dieci scoperte sono pronte.':'Le scoperte sul telefono sono pronte.',canEnter:true,canRetry:false};
 if(!online)return {...progress,kind:count?'partial':'offline-empty',message:count?`Sei offline. ${count} scoperte sono già sul telefono: puoi iniziare con queste.`:'Sei offline e non ci sono ancora articoli sul telefono. Collegati e riprova, oppure entra nella Home.',canEnter:true,canRetry:true};
 if(loading||['idle','loading','searching','retrying','ready'].includes(state.phase))return {...progress,kind:'loading',message:`Preparo dieci scoperte su Wikipedia. ${count} già pronte.`,canEnter:false,canRetry:false};
 return {...progress,kind:count?'partial':'error',message:count?`${count} scoperte sono pronte, ma la connessione si è interrotta. Riprova o inizia con queste.`:'Non riesco a caricare nuovi articoli. Puoi riprovare o entrare nella Home.',canEnter:true,canRetry:true};
}
export const TUTORIAL=[
 {id:'swipe',title:'Una scoperta alla volta',body:'Scorri verso l’alto per passare al prossimo articolo. Tocca il titolo per approfondire.',hint:'Puoi provare qui, oppure continuare.'},
 {id:'categories',title:'Segui la curiosità',body:'Per Te mescola le scoperte. Le categorie ti aiutano a esplorare un argomento.',hint:'La scelta di un interesse non garantisce articoli già disponibili.'},
 {id:'learning',title:'Il feed impara da te',body:'Le aperture contano poco, i salvataggi di più. Puoi rimuovere un salvataggio quando vuoi.',hint:'Le preferenze restano sul telefono. Wikipedia e Gemini, se attivo, possono usare la connessione.'},
 {id:'dock',title:'Ritrova le tue scoperte',body:'Home per il feed, Profilo per salvati, cronologia e impostazioni. Cerca per esplorare Wikipedia.',hint:'Due tocchi rapidi su Home aggiornano le scoperte.'},
] as const;
export const DEMO_CARDS=[{id:'demo:aurora',title:'Aurora polare',category:'Scienza',preview:'Il cielo si illumina quando le particelle solari incontrano l’atmosfera.'},{id:'demo:origami',title:'Origami',category:'Arte',preview:'Una piega dopo l’altra, un foglio diventa una forma.'}] as const;
export class TutorialDemo{
 card=0;saved=false;opened=false;category='all';destination:'home'|'profile'|'search'='home';hintStopped=false;
 interact(){this.hintStopped=true}
 swipe(direction:'next'|'previous'){this.interact();this.card=Math.max(0,Math.min(1,this.card+(direction==='next'?1:-1)))}
}
export type OnboardingCommit=(next:OnboardingState,applyInterests:boolean)=>Promise<void>;
/** Serialized durable intents. Navigation also carries the rendered revision:
 * a second press from an old screen is discarded without a timer. */
export class OnboardingController{
 state:OnboardingState;busy=false;error='';replayIndex:number|null=null;
 private replayRevision=1_000_000;
 get navigationRevision(){return this.replayIndex===null?this.state.revision:this.replayRevision}
 private tail:Promise<unknown>=Promise.resolve();
 private pendingDraft:Partial<OnboardingDraft>|undefined;
 get draftValue(){return {...this.state.draft,...this.pendingDraft}}
 constructor(state:OnboardingState,private commit:OnboardingCommit,private notify:()=>void=()=>{}){this.state=state}
 private write(update:(s:OnboardingState)=>OnboardingState,interests=false){
  const job=this.tail.catch(()=>{}).then(async()=>{const next=update(this.state);if(next===this.state)return;try{await this.commit(next,interests);this.state=next;this.error=''}catch(error){this.error='Non riesco a salvare sul telefono. I dati precedenti sono conservati. Riprova.';throw error}finally{this.notify()}});this.tail=job;return job;
 }
 draft(patch:Partial<OnboardingDraft>){
  const clean={...patch,...(patch.name!==undefined?{name:normalizeName(patch.name)}:{}),...(patch.interests?{interests:validInterests(patch.interests)}:{})};
  const pending={...this.pendingDraft,...(clean.name!==undefined?{name:clean.name}:{}),...(clean.interests?{interests:clean.interests}:{})};this.pendingDraft=pending;this.notify();
  return this.write(s=>({...s,revision:s.revision+1,draft:{...s.draft,...pending,...clean}})).then(()=>{if(this.pendingDraft===pending)this.pendingDraft=undefined});
 }
 profile(patch:Partial<LocalIdentity>){return this.write(s=>{const profile={...s.profile,...patch,...(patch.name!==undefined?{name:normalizeName(patch.name)}:{})};return {...s,revision:s.revision+1,profile,draft:s.completed?{...s.draft,...profile,photoUri:profile.photoUri}:s.draft}})}
 async navigate(action:'next'|'back'|'skip'|'enter',revision:number){
  if(this.replayIndex!==null){if(revision!==this.replayRevision)return;this.replayRevision++;if(action==='back'){if(this.replayIndex===0)this.replayIndex=null;else this.replayIndex--}else if(action==='skip'||this.replayIndex===3)this.replayIndex=null;else this.replayIndex++;this.notify();return}
  if(this.busy||revision!==this.state.revision||this.state.completed)return;
  if(action==='skip'&&!['identity','tutorial'].includes(this.state.stage)||action==='enter'&&this.state.stage!=='preparation')return;
  this.busy=true;this.notify();
  const pending=this.pendingDraft;
  try{await this.write(s=>{
   s=pending?{...s,draft:{...s.draft,...pending}}:s;
   let stage=s.stage,index=s.tutorialIndex;
   if(action==='back'){if(stage==='intro')return s;if(stage==='tutorial'&&index>0)index--;else stage=STAGES[STAGES.indexOf(stage)-1]}
   else if(stage==='tutorial'){if(action==='skip'||index===3)stage='preparation';else index++}
   else if(stage==='preparation')stage='home';
   else stage=STAGES[STAGES.indexOf(stage)+1];
   return {...s,revision:s.revision+1,stage,tutorialIndex:index,completed:stage==='home',profile:stage==='home'?{name:s.draft.name,photoUri:s.draft.photoUri}:s.profile};
  },this.state.stage==='interests'||this.state.stage==='preparation');if(this.pendingDraft===pending)this.pendingDraft=undefined}finally{this.busy=false;this.notify()}
 }
 replay(){if(this.state.completed){this.replayRevision++;this.replayIndex=0;this.notify()}}
 clearError(){this.error='';this.notify()}
 idle(){return this.tail}
}
