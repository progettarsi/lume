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
 // Version 1 originally had four tutorial moments. Keep the interrupted
 // configuration and its revision; only map the retired last moment to Saves.
 return {...x,tutorialIndex:Math.min(x.tutorialIndex,TUTORIAL.length-1),draft:{...x.draft,interests:validInterests(x.draft.interests)}};
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
 {id:'swipe',title:'Una scoperta alla volta',body:'Tocca l’articolo per approfondire. Scorri verso l’alto per esplorare il feed.',hint:'Puoi provare qui, oppure continuare.'},
 {id:'categories',title:'Segui la tua curiosità',body:'Ogni articolo indica il suo argomento. Nella Home, la barra delle categorie ti aiuta a esplorare ciò che ti incuriosisce.',hint:'La scelta di un interesse non garantisce articoli già disponibili.'},
 {id:'learning',title:'Il feed impara da te',body:'Tocca due volte un articolo per salvarlo. I salvataggi guidano il tuo feed.',hint:'Le preferenze restano sul telefono. Wikipedia e Gemini, se attivo, possono usare la connessione.'},
] as const;
export const DEMO_CARDS=[
 {id:'demo:aurora',title:'Aurora polare',category:'Scienza',preview:'Il cielo si illumina quando le particelle solari incontrano l’atmosfera.'},
 {id:'demo:origami',title:'Origami',category:'Arte',preview:'Una piega dopo l’altra, un foglio diventa una forma.'},
 {id:'demo:bioluminescenza',title:'Bioluminescenza',category:'Scienza',preview:'Dalle lucciole agli abissi, alcuni esseri viventi producono luce.'},
] as const;
export class TutorialDemo{
 card=0;saved=false;opened=false;category='all';destination:'home'|'profile'|'search'='home';hintStopped=false;
 interact(){this.hintStopped=true}
 swipe(direction:'next'|'previous'){this.interact();this.card=Math.max(0,Math.min(DEMO_CARDS.length-1,this.card+(direction==='next'?1:-1)))}
}
export type OnboardingCommit=(next:OnboardingState,applyInterests:boolean)=>Promise<void>;
/** Serialized durable intents. Navigation also carries the rendered revision:
 * a second press from an old screen is discarded without a timer. */
export class OnboardingController{
 state:OnboardingState;busy=false;error='';replayIndex:number|null=null;tutorialNavigationRevision=0;
 private replayRevision=1_000_000;
 get navigationRevision(){return this.replayIndex===null?this.state.revision:this.replayRevision}
 private tail:Promise<unknown>=Promise.resolve();
 private pendingDraft:Partial<OnboardingDraft>|undefined;
 private tutorialIntent=0;
 get draftValue(){return {...this.state.draft,...this.pendingDraft}}
 constructor(state:OnboardingState,private commit:OnboardingCommit,private notify:()=>void=()=>{}){this.state=state.tutorialIndex>=TUTORIAL.length?{...state,tutorialIndex:TUTORIAL.length-1}:state}
 private write(update:(s:OnboardingState)=>OnboardingState,interests=false){
  const job=this.tail.catch(()=>{}).then(async()=>{const next=update(this.state);if(next===this.state)return;try{await this.commit(next,interests);this.state=next;this.error=''}catch(error){this.error='Non riesco a salvare sul telefono. I dati precedenti sono conservati. Riprova.';throw error}finally{this.notify()}});this.tail=job;return job;
 }
 draft(patch:Partial<OnboardingDraft>){
  const clean={...patch,...(patch.name!==undefined?{name:normalizeName(patch.name)}:{}),...(patch.interests?{interests:validInterests(patch.interests)}:{})};
  const pending={...this.pendingDraft,...(clean.name!==undefined?{name:clean.name}:{}),...(clean.interests?{interests:clean.interests}:{})};this.pendingDraft=pending;this.notify();
  return this.write(s=>({...s,revision:s.revision+1,draft:{...s.draft,...pending,...clean}})).then(()=>{if(this.pendingDraft===pending)this.pendingDraft=undefined});
 }
 profile(patch:Partial<LocalIdentity>){return this.write(s=>{const profile={...s.profile,...patch,...(patch.name!==undefined?{name:normalizeName(patch.name)}:{})};return {...s,revision:s.revision+1,profile,draft:s.completed?{...s.draft,...profile,photoUri:profile.photoUri}:s.draft}})}
 seekTutorial(index:number){
  if(!Number.isInteger(index)||index<0||index>=TUTORIAL.length)return Promise.resolve();
  if(this.replayIndex!==null){this.replayIndex=index;this.replayRevision++;this.notify();return Promise.resolve()}
  const intent=++this.tutorialIntent;
  // Coalesce queued scroll positions, without disabling or moving the feed
  // while SQLite saves. A pending exit always wins over a later stale scroll.
  return this.write(s=>intent!==this.tutorialIntent||s.stage!=='tutorial'||s.completed||s.tutorialIndex===index?s:{...s,revision:s.revision+1,tutorialIndex:index});
 }
 async navigate(action:'next'|'back'|'skip'|'enter',revision:number){
  if(this.replayIndex!==null){if(revision!==this.replayRevision||action==='enter')return;this.replayRevision++;this.tutorialNavigationRevision++;if(action==='back'||action==='skip'||this.replayIndex===TUTORIAL.length-1)this.replayIndex=null;else this.replayIndex++;this.notify();return}
  if(this.busy||revision!==this.state.revision||this.state.completed)return;
  if(action==='skip'&&!['identity','tutorial'].includes(this.state.stage)||action==='enter'&&this.state.stage!=='preparation')return;
  // Preparation belongs to the visual loading/zoom handoff. Only its explicit
  // completion can leave this stage; hardware Back cannot rewind a download.
  if(this.state.stage==='preparation'&&action!=='enter')return;
  this.busy=true;this.notify();
  const pending=this.pendingDraft;
  try{await this.write(s=>{
   s=pending?{...s,draft:{...s.draft,...pending}}:s;
   let stage=s.stage,index=s.tutorialIndex;
   if(action==='back'){if(stage==='intro')return s;stage=stage==='tutorial'?'interests':STAGES[STAGES.indexOf(stage)-1]}
   else if(stage==='tutorial'){if(action==='skip'||index===TUTORIAL.length-1)stage='preparation';else index++}
   else if(stage==='preparation')stage='home';
   else stage=STAGES[STAGES.indexOf(stage)+1];
   return {...s,revision:s.revision+1,stage,tutorialIndex:index,completed:stage==='home',profile:stage==='home'?{name:s.draft.name,photoUri:s.draft.photoUri}:s.profile};
  },this.state.stage==='interests'||this.state.stage==='preparation');if(this.state.stage==='tutorial')this.tutorialNavigationRevision++;if(this.pendingDraft===pending)this.pendingDraft=undefined}finally{this.busy=false;this.notify()}
 }
 replay(){if(this.state.completed){this.replayRevision++;this.replayIndex=0;this.notify()}}
 clearError(){this.error='';this.notify()}
 idle(){return this.tail}
}
