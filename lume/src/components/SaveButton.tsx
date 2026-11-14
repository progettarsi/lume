import {useState} from 'react';
import {Pressable} from 'react-native';
import {useTheme} from './Atoms';
import {AnimatedIcon} from './AnimatedIcon';
import {useMotionPreference} from '../useMotionPreference';
export function SaveButton({saved,onPress,active=true,reduced:override,animationRevision=0}:{saved:boolean;onPress:()=>void;active?:boolean;reduced?:boolean;animationRevision?:number}){
 const {palette}=useTheme(),systemReduced=useMotionPreference(),[revision,setRevision]=useState(0);
 return <Pressable accessibilityRole="button" accessibilityLabel={saved?'Rimuovi dai salvati':'Salva articolo'} accessibilityState={{selected:saved}} onPress={()=>{setRevision(n=>n+1);onPress()}} hitSlop={8} style={{width:48,height:48,borderRadius:24,backgroundColor:palette.surface,alignItems:'center',justifyContent:'center'}}>
  <AnimatedIcon name="bookmark" color={saved?palette.accent:palette.ink} filled={saved} revision={revision+animationRevision} active={active} reduced={override??systemReduced}/>
 </Pressable>;
}
