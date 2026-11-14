import {useEffect,useState} from 'react';
import {AccessibilityInfo} from 'react-native';
import {useReducedMotion} from 'react-native-reanimated';
export function useMotionPreference(){
 const initial=useReducedMotion(),[reduced,setReduced]=useState(initial);
 useEffect(()=>{let active=true;const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);void AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(active)setReduced(value)}).catch(()=>{});return()=>{active=false;sub.remove()}},[]);
 return reduced;
}
