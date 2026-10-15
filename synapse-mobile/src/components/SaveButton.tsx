import { useEffect } from 'react';
import { Pressable,View } from 'react-native';
import Animated,{useAnimatedStyle,useSharedValue,withSpring,withTiming,cancelAnimation} from 'react-native-reanimated';
import { Icon,useTheme } from './Atoms';
import {useMotionPreference} from '../useMotionPreference';
export function SaveButton({saved,onPress}:{saved:boolean;onPress:()=>void}){
  const {palette}=useTheme(),reduced=useMotionPreference(),scale=useSharedValue(1);
  useEffect(()=>{if(reduced){cancelAnimation(scale);scale.value=1}return()=>cancelAnimation(scale)},[reduced]);
  const pulse=useAnimatedStyle(()=>({transform:[{scale:scale.value}]}));
  const activate=()=>{cancelAnimation(scale);scale.value=reduced?1:withTiming(.86,{duration:65},()=>{scale.value=withSpring(1,{stiffness:700,damping:27})});onPress()};
  // One press owns each bookmark intent; the surrounding feed pan handles drags.
  return <Pressable accessibilityRole="button" accessibilityLabel={saved?'Rimuovi dai salvati':'Salva articolo'} accessibilityState={{selected:saved}} onPress={activate} hitSlop={8} style={{width:48,height:48,borderRadius:24,backgroundColor:palette.surface,alignItems:'center',justifyContent:'center'}}>
    <Animated.View pointerEvents="none" style={[{width:24,height:24},pulse]}><Icon name={saved?'bookmark':'bookmark-outline'} color={saved?palette.accent:palette.ink}/></Animated.View>
  </Pressable>;
}
