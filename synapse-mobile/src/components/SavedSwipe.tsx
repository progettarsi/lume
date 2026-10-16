import {haptics} from '../haptics';
import {useEffect,type ReactNode} from 'react';
import {AppState} from 'react-native';
import {Gesture,GestureDetector} from 'react-native-gesture-handler';
import Animated,{cancelAnimation,Easing,runOnJS,useAnimatedReaction,useAnimatedStyle,useSharedValue,withSpring,withTiming} from 'react-native-reanimated';
import {Icon,Label,useTheme} from './Atoms';
import {spring} from '../theme';
import {removalArmed,settleDuration} from '../content/bookmark';

export function SavedSwipe({children,onConfirm,onExited,removing,reduced,enabled=true}:{children:(confirm:()=>void)=>ReactNode;onConfirm:()=>void;onExited:()=>void;removing:boolean;reduced:boolean;enabled?:boolean}){
 const {palette}=useTheme(),x=useSharedValue(0),start=useSharedValue(0),width=useSharedValue(0),committed=useSharedValue(false),armed=useSharedValue(0),exit=useSharedValue(0);
 const thresholdSent=useSharedValue(false);
 const signalThreshold=()=>haptics.emit('threshold');
 const returnToRest=()=>{'worklet';x.value=reduced?0:withSpring(0,{...spring,overshootClamping:true})};
 useEffect(()=>{if(!removing&&committed.value){cancelAnimation(x);cancelAnimation(exit);committed.value=false;exit.value=reduced?0:withTiming(0,{duration:180});returnToRest();onExited()}},[removing]);
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>{if(state!=='active'&&!committed.value){cancelAnimation(x);returnToRest()}});return()=>sub.remove()},[reduced]);
 useAnimatedReaction(()=>removalArmed(x.value,width.value),(ready,previous)=>{if(ready!==previous)armed.value=reduced?(ready?1:0):withTiming(ready?1:0,{duration:150,easing:Easing.out(Easing.cubic)})},[reduced]);
 const confirm=(velocity=0)=>{'worklet';if(committed.value)return;committed.value=true;runOnJS(onConfirm)();if(reduced){runOnJS(onExited)();return}
  const duration=Math.max(180,settleDuration(width.value+x.value,velocity)+50);
  exit.value=withTiming(1,{duration,easing:Easing.out(Easing.cubic)});
  x.value=withTiming(-width.value,{duration,easing:Easing.out(Easing.cubic)},finished=>{if(finished)runOnJS(onExited)()});
 };
 const pan=Gesture.Pan().maxPointers(1).activeOffsetX(-12).failOffsetY([-9,9]).enabled(enabled&&!removing)
  .onBegin(()=>{cancelAnimation(x);start.value=x.value;thresholdSent.value=false})
  .onUpdate(e=>{if(!committed.value)x.value=Math.min(0,Math.max(-width.value,start.value+e.translationX));if(!committed.value&&!thresholdSent.value&&removalArmed(x.value,width.value)){thresholdSent.value=true;runOnJS(signalThreshold)()}})
  .onEnd((e,success)=>{if(success&&removalArmed(x.value,width.value))confirm(e.velocityX)})
  .onFinalize(()=>{if(!committed.value)returnToRest()});
 // Uniform radii avoid Android's non-uniform background path at zero-size mount.
 // The left corners sit outside the clip; only the right edge is revealed.
 const row=useAnimatedStyle(()=>({transform:[{translateX:x.value}]}));
 const surface=useAnimatedStyle(()=>({opacity:Math.min(1,-x.value/24)*(1-exit.value)}));
 const tint=useAnimatedStyle(()=>({opacity:armed.value*.2}));
 // Constant layout: reveal with clipping/opacity/transforms, never resize or scale text.
 const action=useAnimatedStyle(()=>{const p=Math.min(1,-x.value/Math.max(1,width.value*.28));return {opacity:p,transform:[{translateX:reduced?0:10*(1-p)}]}});
 const idleIcon=useAnimatedStyle(()=>({opacity:1-armed.value})),readyIcon=useAnimatedStyle(()=>({opacity:armed.value}));
 return <Animated.View style={{overflow:'hidden'}} onLayout={e=>{width.value=e.nativeEvent.layout.width}}>
  <Animated.View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={[{position:'absolute',top:0,bottom:0,left:0,right:0,backgroundColor:palette.active},surface]}>
   <Animated.View style={[{position:'absolute',top:0,bottom:0,left:0,right:0,backgroundColor:palette.accent},tint]}/>
   <Animated.View style={[{position:'absolute',right:0,top:0,bottom:0,width:'42%',justifyContent:'center',alignItems:'center',paddingHorizontal:10,gap:8},action]}>
    <Animated.View style={{width:28,height:28}}><Animated.View style={[{position:'absolute'},idleIcon]}><Icon name="bookmark-remove-outline" color={palette.ink} size={28}/></Animated.View><Animated.View style={[{position:'absolute'},readyIcon]}><Icon name="check" color={palette.ink} size={28}/></Animated.View></Animated.View>
    <Label numberOfLines={2} strong style={{fontSize:14,textAlign:'center'}}>Rimuovi dai salvati</Label>
   </Animated.View>
  </Animated.View>
  <GestureDetector gesture={pan}><Animated.View style={[{backgroundColor:palette.paper,overflow:'hidden',borderRadius:22,marginLeft:-22,paddingLeft:22},row]}>{children(()=>confirm())}</Animated.View></GestureDetector>
 </Animated.View>;
}
