import {motion} from '../theme';
import {useEffect,useRef} from 'react';
import {StyleSheet,View} from 'react-native';
import Animated,{Easing,useAnimatedStyle,useSharedValue,withTiming,runOnJS,cancelAnimation} from 'react-native-reanimated';
export type ThemeSnapshot={uri:string;x:number;y:number;dark:boolean;id:number};
/** Crossfade two complete palettes without individually flashing foreground colours. */
export function ThemeReveal({snapshot,width,height,topInset,onReady,onDone}:{snapshot:ThemeSnapshot;width:number;height:number;topInset:number;onReady:()=>void;onDone:()=>void}){
  const opacity=useSharedValue(1),started=useRef(false);
  const fade=useAnimatedStyle(()=>({opacity:opacity.value}));
  useEffect(()=>()=>cancelAnimation(opacity),[]);
  const reveal=()=>{
    if(started.current)return;started.current=true;onReady();
    opacity.value=withTiming(0,{duration:motion.theme.duration,easing:Easing.inOut(Easing.quad)},finished=>{if(finished)runOnJS(onDone)()});
  };
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill,{zIndex:100}]}>
    <Animated.View style={[{position:'absolute',left:0,right:0,top:topInset,bottom:0,overflow:'hidden'},fade]}>
      <Animated.Image source={{uri:snapshot.uri}} resizeMode="stretch" fadeDuration={0} onLoad={reveal} onError={()=>{if(!started.current){started.current=true;onReady();onDone()}}} style={{position:'absolute',left:0,top:-topInset,width,height}}/>
    </Animated.View>
  </View>;
}
