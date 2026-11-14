import {memo,useEffect,useRef,useCallback} from 'react';
import {haptics} from '../haptics';
import {revealHapticStep} from '../content/revealHaptics';
import {View,StyleSheet} from 'react-native';
import Animated,{useSharedValue,useAnimatedStyle,useAnimatedReaction,withTiming,cancelAnimation,Easing,runOnUI,runOnJS,type SharedValue} from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';
import {Label,useTheme} from './Atoms';
import {revealFrontier,reflowFrontier} from '../content/reveal';

const EDGE=36;
type Props={open:boolean;paragraphs:string[];size:number;scroll:SharedValue<number>;viewport:SharedValue<number>;scrolled:SharedValue<boolean>;bodyY:SharedValue<number>;expandedY:SharedValue<number>;progress:SharedValue<number>;active:SharedValue<boolean>;reduced:boolean};
export const ReaderReveal=memo(function ReaderReveal({open,paragraphs,size,scroll,viewport,scrolled,bodyY,expandedY,progress,active,reduced}:Props){
  const {palette}=useTheme(),height=useSharedValue(0),sweep=useSharedValue(0),frontier=useSharedValue(0),paintReady=useSharedValue(false);
  const latest=useRef({open,reduced}),alive=useRef(true),deadline=useRef(Date.now()+2600);
  latest.current={open,reduced};
  const pulseAt=useSharedValue(0),hapticFinished=useSharedValue(false),hapticDeadline=deadline.current;
  const signalReveal=useCallback(()=>{if(alive.current&&latest.current.open&&!latest.current.reduced&&!scrolled.value&&Date.now()<=deadline.current)haptics.emit('reveal')},[scrolled]);
  useAnimatedReaction(()=>({height:height.value,ready:active.value&&progress.value>=.82}), (next,previous)=>{
    if(!next.ready||next.height<=0)return;
    paintReady.value=true;
    if(reduced){sweep.value=next.height;return}
    if(!previous?.ready||next.height!==previous.height){
      // Retarget without rewinding on reopen, relayout, or an arriving edition.
      sweep.value=Math.max(sweep.value,frontier.value);
      sweep.value=withTiming(Math.max(next.height,sweep.value),{duration:Math.min(1800,Math.max(600,next.height*.65)),easing:Easing.linear});
    }
  },[reduced]);
  useAnimatedReaction(()=>revealFrontier(0,sweep.value,height.value,scroll.value+viewport.value,16+bodyY.value+expandedY.value,viewport.value,size*1.5,scrolled.value,reduced), next=>{
    frontier.value=Math.max(frontier.value,next);
  },[reduced,size]);
  useAnimatedReaction(()=>frontier.value,(next,previous)=>{
    const time=Date.now(),visibleEnd=scroll.value+viewport.value-(16+bodyY.value+expandedY.value);
    const eligible=!hapticFinished.value&&!reduced&&active.value&&progress.value>=.82&&!scrolled.value&&time<=hapticDeadline;
    if(revealHapticStep(previous??-1,next,height.value,visibleEnd,eligible)&&time-pulseAt.value>=70){pulseAt.value=time;runOnJS(signalReveal)()}
    if(height.value>0&&next>=height.value)hapticFinished.value=true;
  },[reduced,hapticDeadline,signalReveal]);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;cancelAnimation(sweep)}},[]);
  // Native Text may paint before its first onLayout has installed the cover's
  // measured geometry. Keep its paint hidden from the initial native commit;
  // Wait for the opening threshold too, then latch: reversing never hides it.
  // Opacity does not change layout or duplicate the accessible content.
  const paint=useAnimatedStyle(()=>({opacity:reduced||paintReady.value?1:0}),[reduced]);
  const cover=useAnimatedStyle(()=>({opacity:reduced||frontier.value>=height.value&&height.value>0?0:1,transform:[{translateY:frontier.value}]}),[reduced]);
  return <Animated.View style={[styles.text,{opacity:reduced?1:0},paint]} onLayout={e=>{
    const next=e.nativeEvent.layout.height;
    runOnUI((layoutHeight:number)=>{
      'worklet';
      frontier.value=reflowFrontier(frontier.value,height.value,layoutHeight);
      height.value=layoutHeight;

    })(next);
  }}>
    {paragraphs.map((p,i)=><Label key={i} style={{fontSize:size,lineHeight:size*1.5,marginBottom:22}}>{p}</Label>)}
    {/* One text layer: this cover affects paint only, never Text width/content.
        No offscreen alpha mask or duplicated accessible/shaped text. */}
    <Animated.View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill,cover]}>
      <LinearGradient colors={[palette.paper+'00',palette.paper]} style={{height:EDGE}}/>
      <View style={{position:'absolute',top:EDGE,left:0,right:0,bottom:0,backgroundColor:palette.paper}}/>
    </Animated.View>
  </Animated.View>;
});
const styles=StyleSheet.create({text:{overflow:'hidden'}});
