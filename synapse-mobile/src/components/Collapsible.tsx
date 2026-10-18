import {useLayoutEffect,type ReactNode} from 'react';
import {View} from 'react-native';
import Animated,{cancelAnimation,Easing,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
import {motion} from '../theme';
import {useMotionPreference} from '../useMotionPreference';

/** A changing clipping viewport moves neighbours without reflowing/scaling
 * its text. The absolute inner content always has its final width/layout. */
export function Collapsible({expanded,children,reducedOverride}:{expanded:boolean;children:ReactNode;reducedOverride?:boolean}){
 const systemReduced=useMotionPreference(),reduced=reducedOverride??systemReduced;
 const progress=useSharedValue(expanded?1:0),height=useSharedValue(0);
 useLayoutEffect(()=>{cancelAnimation(progress);progress.value=reduced?(expanded?1:0):withTiming(expanded?1:0,{duration:expanded?motion.surface.enter:motion.surface.exit,easing:Easing.out(Easing.cubic)});return()=>cancelAnimation(progress)},[expanded,reduced,progress]);
 const clip=useAnimatedStyle(()=>({height:height.value*progress.value,opacity:progress.value}));
 return <Animated.View pointerEvents={expanded?'auto':'none'} accessibilityElementsHidden={!expanded} importantForAccessibility={expanded?'auto':'no-hide-descendants'} style={[{overflow:'hidden'},clip]}>
  <View collapsable={false} onLayout={e=>{height.value=e.nativeEvent.layout.height}} style={{position:'absolute',top:0,left:0,right:0}}>{children}</View>
 </Animated.View>;
}
