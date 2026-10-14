import {useEffect,useReducer,useRef,useState} from 'react';
import {Keyboard} from 'react-native';
import {OnboardingController,initialOnboarding,interestOptions,preparationState,usablePreviewCount,TutorialDemo,type OnboardingStage} from './content/onboarding';
import {LocalPhoto} from './content/onboardingPhoto';
import {photoPort,cleanPhotos} from './onboardingPhoto';
import {ProfileIdentitySession} from './content/profileIdentity';
import type {useLibrary} from './useLibrary';
export function useOnboarding(lib:ReturnType<typeof useLibrary>,reduced:boolean,appActive:boolean){
 const [,render]=useReducer(n=>n+1,0),live=useRef(lib);live.current=lib;
 const durable=useRef<OnboardingController|null>(null),sandbox=useRef<OnboardingController|null>(null);
 if(!durable.current&&lib.onboarding)durable.current=new OnboardingController(lib.onboarding,(s,i)=>live.current.persistOnboarding(s,i),render);
 const controller=sandbox.current??durable.current,state=controller?.state,photo=useRef(new LocalPhoto(photoPort));
 const [photoBusy,setPhotoBusy]=useState(false),[photoError,setPhotoError]=useState(''),[photoUri,setPhotoUri]=useState<string>();
 const demo=useRef(new TutorialDemo()),[demoRevision,updateDemo]=useReducer(n=>n+1,0);
 const photoTask=useRef(false);
 const replay=controller?.replayIndex!==null&&controller?.replayIndex!==undefined;
 const active=!!controller&&(!state?.completed||replay),stage:OnboardingStage|undefined=replay?'tutorial':state?.stage;
 const revision=controller?.navigationRevision??0;
 const preparation=preparationState(usablePreviewCount(lib.getFeed('all')),lib.online,lib.loading,lib.availability.all??{phase:'idle'});
 const references=()=>controller?[controller.state.profile.photoUri,controller.state.draft.photoUri].filter((s):s is string=>!!s):[];
 useEffect(()=>{let alive=true;const uri=active?state?.draft.photoUri:state?.profile.photoUri;void photo.current.usable(uri).then(value=>{if(alive){setPhotoUri(value);if(uri&&!value)setPhotoError('Questa foto non è più disponibile. Puoi sceglierne un’altra o rimuoverla.');else setPhotoError('')}});return()=>{alive=false}},[state?.draft.photoUri,state?.profile.photoUri,active]);
 useEffect(()=>{if(durable.current)void cleanPhotos([durable.current.state.draft.photoUri,durable.current.state.profile.photoUri].filter((s):s is string=>!!s)).catch(()=>{})},[!!durable.current]);
 useEffect(()=>{if(sandbox.current?.state.completed){sandbox.current=null;render()}},[state?.completed,controller]);
 // Readiness is exposed to the screen. It freezes the loader and completes the
 // zoom before asking for durable entry, including reduced-motion handoffs.
 const navigate=(action:'next'|'back'|'skip'|'enter')=>{if(!controller||lib.onboardingError||photoTask.current||action==='enter'&&!preparation.canEnter)return;Keyboard.dismiss();void controller.navigate(action,revision).catch(()=>{})};
 const updateDraft=(patch:Parameters<OnboardingController['draft']>[0])=>{if(controller)void controller.draft(patch).catch(()=>{})};
 const identityTarget=()=>active&&!replay?'draft':'profile';
 const pickPhoto=async(remove=false)=>{
  if(!controller||controller.busy||photoTask.current||sandbox.current)return;photoTask.current=true;setPhotoBusy(true);setPhotoError('');const target=identityTarget();
  try{const current=()=>controller.state[target].photoUri,commit=(uri:string|undefined)=>controller[target]({photoUri:uri});
   if(remove)await photo.current.remove(current,commit,references);
   else {const result=await photo.current.replace(current,commit,references);if(result==='denied')setPhotoError('Foto non disponibile o accesso negato. Puoi continuare senza foto.');}
  }catch(error){setPhotoError(error instanceof Error?error.message:'Foto non salvata. Puoi continuare senza foto.')}
  finally{photoTask.current=false;setPhotoBusy(false)}
 };
 return {
  controller,state,draft:controller?.draftValue,stage,active,replay,revision,bootError:lib.onboardingError,retryBoot:lib.retryOnboarding,busy:!!controller?.busy||photoBusy,error:controller?.error||'',photoBusy,photoError,photoUri,
  reduced,appActive,motionEnabled:!reduced&&appActive&&active,
  tutorialIndex:replay?controller!.replayIndex!:state?.tutorialIndex??0,tutorialNavigationRevision:controller?.tutorialNavigationRevision??0,demo:demo.current,demoRevision,
  interactDemo:(action:(d:TutorialDemo)=>void)=>{demo.current.interact();action(demo.current);updateDemo()},
  options:interestOptions(lib.registry,new Set(lib.cache.filter(a=>a.preview.length).map(a=>a.category))),preparation,navigate,presentPreparation:()=>{},updateDraft,pickPhoto,
  seekTutorial:(index:number)=>{if(controller&&!lib.onboardingError)void controller.seekTutorial(index).catch(()=>{})},
  toggleInterest:(id:string)=>{if(!controller||controller.busy)return;const ids=controller.draftValue.interests;updateDraft({interests:ids.includes(id)?ids.filter(v=>v!==id):[...ids,id]})},
  reportPhotoUnavailable:()=>{setPhotoUri(undefined);setPhotoError('Questa foto non è più disponibile. Puoi sceglierne un’altra o rimuoverla.')},
  saveProfile:(name:string)=>controller?.profile({name}).catch(()=>{}),
  createProfileEditor:()=>controller?new ProfileIdentitySession(photoPort,references,identity=>controller.profile(identity),controller.state.profile):undefined,
  replayTutorial:()=>{demo.current=new TutorialDemo();controller?.replay();render()},
  retryFeed:()=>{if(!lib.loading&&preparation.canRetry)void lib.checkConnection().then(()=>lib.retryFeed()).catch(()=>{})},
  devSandbox:!!sandbox.current,
  developmentPreview:(step:OnboardingStage='intro')=>{if(!__DEV__)return;const value=initialOnboarding({preferenceKeys:[],visits:0,saved:0,read:0});value.stage=step==='home'?'intro':step;sandbox.current=new OnboardingController(value,async()=>{},render);demo.current=new TutorialDemo();render()},
  closeDevelopment:()=>{sandbox.current=null;render()},
 };
}
export type OnboardingBinding=ReturnType<typeof useOnboarding>;
