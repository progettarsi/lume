import {useSyncExternalStore} from 'react';
import {AccessibilityInfo} from 'react-native';
import {useReducedMotion} from 'react-native-reanimated';
// Buttons and newly mounted scenes share one native listener/query. A system
// event supersedes an older asynchronous read, including after unsubscribe.
let snapshot:boolean|undefined,revision=0,subscription:ReturnType<typeof AccessibilityInfo.addEventListener>|undefined;
const listeners=new Set<()=>void>();
function publish(value:boolean){if(snapshot===value)return;snapshot=value;for(const listener of listeners)listener()}
function subscribe(listener:()=>void){
 listeners.add(listener);
 if(!subscription){
  subscription=AccessibilityInfo.addEventListener('reduceMotionChanged',value=>{revision++;publish(value)});
  const request=++revision;
  void AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(request===revision&&listeners.size)publish(value)}).catch(()=>{});
 }
 return()=>{listeners.delete(listener);if(!listeners.size){revision++;subscription?.remove();subscription=undefined}};
}
export function useMotionPreference(){
 const initial=useReducedMotion();
 return useSyncExternalStore(subscribe,()=>snapshot??initial,()=>initial);
}
