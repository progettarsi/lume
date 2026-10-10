import {useCallback,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {AccessibilityInfo,Platform,Pressable,type StyleProp,type ViewStyle} from 'react-native';
import {Gesture,GestureDetector} from 'react-native-gesture-handler';
import Animated,{cancelAnimation,FadeOut,runOnJS,useAnimatedStyle,useSharedValue,withSpring,withTiming} from 'react-native-reanimated';
import {Icon} from './Atoms';
import {spring} from '../theme';

// Mounted once per notice occurrence, not per render or cache update.
export function DismissibleNotice({children,reduced,onDismiss,closeColor,style,timeoutEnabled=true}:{children:ReactNode;reduced:boolean;onDismiss?:()=>void;closeColor?:string;style?:StyleProp<ViewStyle>;timeoutEnabled?:boolean}){
 const [visible,setVisible]=useState(true),[interacting,setInteracting]=useState(false);
 const x=useSharedValue(0),start=useSharedValue(0),width=useSharedValue(1),committed=useSharedValue(false),callback=useRef(onDismiss);callback.current=onDismiss;
 const dismiss=useCallback(()=>{setVisible(false);callback.current?.()},[]);
 useEffect(()=>{
  if(!visible||interacting||!timeoutEnabled)return;
  let active=true,timer:ReturnType<typeof setTimeout>|undefined;
  // Android can extend the default for users who need more time to act.
  const recommended=Platform.OS==='android'?AccessibilityInfo.getRecommendedTimeoutMillis(2000):Promise.resolve(2000);
  void recommended.catch(()=>2000).then(duration=>{if(active)timer=setTimeout(dismiss,Math.max(2000,duration))});
  return()=>{active=false;if(timer)clearTimeout(timer)};
 },[visible,interacting,timeoutEnabled]);
 const pan=useMemo(()=>Gesture.Pan().maxPointers(1).activeOffsetX([-12,12]).failOffsetY([-9,9])
  .onStart(()=>{if(committed.value)return;cancelAnimation(x);start.value=x.value;runOnJS(setInteracting)(true)})
  .onUpdate(e=>{if(!committed.value)x.value=start.value+e.translationX})
  .onEnd((_e,success)=>{if(!committed.value&&success&&Math.abs(x.value)>=width.value*.25){committed.value=true;if(reduced)runOnJS(dismiss)();else x.value=withTiming(Math.sign(x.value)*width.value,{duration:160},finished=>{if(finished)runOnJS(dismiss)()})}})
  .onFinalize(()=>{if(!committed.value){x.value=reduced?0:withSpring(0,{...spring,overshootClamping:true});runOnJS(setInteracting)(false)}}),[reduced,dismiss]);
 const motion=useAnimatedStyle(()=>({opacity:1-Math.min(.7,Math.abs(x.value)/width.value),transform:[{translateX:x.value}]}));
 if(!visible)return null;
 return <GestureDetector gesture={pan}><Animated.View accessibilityLiveRegion="polite" exiting={reduced?undefined:FadeOut.duration(160)} style={[style,motion]} onLayout={e=>{width.value=Math.max(1,e.nativeEvent.layout.width)}} onAccessibilityEscape={dismiss}>
  {children}
  <Pressable accessibilityRole="button" accessibilityLabel="Chiudi messaggio" onPress={dismiss} onPressIn={()=>setInteracting(true)} onPressOut={()=>setInteracting(false)} style={{position:'absolute',right:0,top:0,minWidth:48,minHeight:48,alignItems:'center',justifyContent:'center'}}><Icon name="close" size={18} color={closeColor}/></Pressable>
 </Animated.View></GestureDetector>;
}
