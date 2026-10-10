import { useEffect } from 'react';
import { Pressable,View } from 'react-native';
import Animated,{useAnimatedStyle,useSharedValue,withSpring,withTiming,cancelAnimation} from 'react-native-reanimated';
import {Gesture,GestureDetector} from 'react-native-gesture-handler';
import { Icon,useTheme } from './Atoms';
import {useMotionPreference} from '../useMotionPreference';
export function SaveButton({saved,onPress,gestureManaged=false}:{saved:boolean;onPress:()=>void;gestureManaged?:boolean}){
  const {palette}=useTheme(),reduced=useMotionPreference(),scale=useSharedValue(1),fill=useSharedValue(saved?1:0);
  useEffect(()=>{cancelAnimation(fill);fill.value=reduced?(saved?1:0):withTiming(saved?1:0,{duration:150});if(reduced){cancelAnimation(scale);scale.value=1}},[saved,reduced]);
  const pulse=useAnimatedStyle(()=>({transform:[{scale:scale.value}]})),clip=useAnimatedStyle(()=>({height:24*fill.value}));
  const activate=()=>{cancelAnimation(scale);scale.value=reduced?1:withTiming(.86,{duration:65},()=>{scale.value=withSpring(1,{stiffness:700,damping:27})});onPress()};
  const tap=Gesture.Tap().maxDistance(10).runOnJS(true).onEnd((_,ok)=>{if(ok)activate()});
  const button=<Pressable accessibilityRole="button" accessibilityLabel={saved?'Rimuovi dai salvati':'Salva articolo'} accessibilityState={{selected:saved}} onPress={gestureManaged?undefined:activate} onAccessibilityTap={gestureManaged?activate:undefined} hitSlop={4} style={{width:48,height:48,borderRadius:24,backgroundColor:palette.surface,alignItems:'center',justifyContent:'center'}}>
    <Animated.View style={[{width:24,height:24},pulse]}><Icon name="bookmark-outline" color={saved?palette.accent:palette.ink}/><Animated.View style={[{position:'absolute',bottom:0,width:24,overflow:'hidden'},clip]}><View style={{position:'absolute',bottom:0}}><Icon name="bookmark" color={palette.accent}/></View></Animated.View></Animated.View>
  </Pressable>;
  return gestureManaged?<GestureDetector gesture={tap}>{button}</GestureDetector>:button;
}
