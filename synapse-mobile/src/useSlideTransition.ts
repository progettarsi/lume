import {useCallback,useLayoutEffect,useRef,useState} from 'react';
import {cancelAnimation,runOnJS,useSharedValue,withSpring} from 'react-native-reanimated';
import {spring} from './theme';

/** Retain paint through the actual exit, then release the hidden native tree.
 * Every completion is versioned: a queued old exit cannot unmount a reopen. */
export function useSlideTransition(open:boolean,reduced:boolean,onClosed?:()=>void,keepMounted=false){
 const progress=useSharedValue(0),[retained,setRetained]=useState(false);
 const visited=useRef(false);
 const current=useRef({open,onClosed,revision:0,presented:false});current.current.open=open;current.current.onClosed=onClosed;
 const finish=useCallback((revision:number)=>{
  const latest=current.current;if(latest.open||latest.revision!==revision)return;
  setRetained(false);if(latest.presented){latest.presented=false;latest.onClosed?.();}
 },[]);
 useLayoutEffect(()=>{
  const revision=++current.current.revision;
  cancelAnimation(progress);
  if(!open&&!current.current.presented){progress.value=0;return()=>cancelAnimation(progress)}
  if(open){visited.current=true;current.current.presented=true;setRetained(true);}
  if(reduced){progress.value=open?1:0;if(!open)finish(revision)}
  else progress.value=withSpring(open?1:0,spring,finished=>{if(finished&&!open)runOnJS(finish)(revision)});
  return()=>cancelAnimation(progress);
 },[open,reduced,finish,progress]);
 return {progress,mounted:open||retained||(keepMounted&&visited.current),painting:open||retained};
}
