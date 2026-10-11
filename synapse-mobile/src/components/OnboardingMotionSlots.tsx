import React,{createContext,useCallback,useContext,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {AccessibilityInfo,Text,View,findNodeHandle,useWindowDimensions,type ViewStyle,type StyleProp} from 'react-native';
import Animated,{cancelAnimation,Easing,useAnimatedProps,useAnimatedStyle,useSharedValue,withDelay,withRepeat,withSequence,withSpring,withTiming,runOnJS} from 'react-native-reanimated';
import Svg,{Path,SvgXml} from 'react-native-svg';
import {Gesture,GestureDetector} from 'react-native-gesture-handler';
import {useTheme} from './Atoms';
import {heading,spring} from '../theme';
import {ONBOARDING_MOTION as M,type MotionEnvironment,type OrganicShapeKind} from '../content/onboardingPresentation';
import {ORGANIC_POINTS} from '../content/onboardingShapes';
import {organicPath,tutorialTarget} from '../content/onboardingMotion';
import {onboardingVector} from '../content/onboardingVectors';
const AnimatedPath=Animated.createAnimatedComponent(Path),ease=Easing.bezier(.45,0,.55,1);
const circle=Array.from({length:128},(_,i)=>50+50*(i%2?Math.sin(-Math.PI/2+Math.floor(i/2)*Math.PI/32):Math.cos(-Math.PI/2+Math.floor(i/2)*Math.PI/32)));
export function OrganicShapeSlot({kind,size,motion,style}:{kind:OrganicShapeKind;size:number;motion:MotionEnvironment;style?:StyleProp<ViewStyle>}){
 const {palette}=useTheme(),phase=useSharedValue(0),rotation=useSharedValue(0),drift=useSharedValue(0);
 const complex=kind==='identity-action'||kind==='interests-action'||kind==='round-action'||kind==='preparation';
 const from=kind==='round-action'?circle:kind==='interests-action'?ORGANIC_POINTS['button-interests']:kind==='preparation'?ORGANIC_POINTS['cookie-preparation']:ORGANIC_POINTS['button-identity'];
 const to=kind==='interests-action'?ORGANIC_POINTS['button-identity']:ORGANIC_POINTS['button-interests'];
 const moving=!motion.reduced&&motion.appActive&&motion.visible;
 useEffect(()=>{
  cancelAnimation(phase);cancelAnimation(rotation);cancelAnimation(drift);
  if(moving){
   if(complex){rotation.value=withRepeat(withTiming(rotation.value+360,{duration:M.arrowShape.rotationDuration,easing:Easing.linear}),-1,false);phase.value=withRepeat(withSequence(withTiming(1,{duration:M.arrowShape.morphDuration,easing:ease}),withTiming(0,{duration:M.arrowShape.morphDuration,easing:ease})),-1,false)}
   else drift.value=withRepeat(withSequence(withTiming(1,{duration:M.background.duration/4,easing:ease}),withTiming(-1,{duration:M.background.duration/2,easing:ease}),withTiming(0,{duration:M.background.duration/4,easing:ease})),-1,false);
  }else if(motion.reduced){phase.value=0;rotation.value=0;drift.value=0}
  return()=>{cancelAnimation(phase);cancelAnimation(rotation);cancelAnimation(drift)};
 },[moving,complex,motion.reduced,kind]);
 const props=useAnimatedProps(()=>({d:organicPath(from,to,phase.value)}));
 const transform=useAnimatedStyle(()=>({transform:complex?[{rotate:`${rotation.value}deg`},{scale:1+Math.sin(phase.value*Math.PI)*.02}]:[{translateX:drift.value*M.background.translateX},{translateY:drift.value*M.background.translateY},{rotate:`${drift.value*M.background.rotation}deg`},{scale:1+drift.value*.02}]}));
 const staticKind=kind==='round-action'?undefined:kind;
 return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{width:size,height:size},style]}><Animated.View style={[{width:size,height:size},transform]}>
  {complex&&!motion.reduced?<Svg width={size} height={size} viewBox="0 0 100 100"><AnimatedPath animatedProps={props} fill={palette.active}/></Svg>:staticKind?<SvgXml xml={onboardingVector(staticKind,palette.ink,palette.paper,palette.active)} width={size} height={size}/>:<View style={{width:size,height:size,borderRadius:size/2,backgroundColor:palette.active}}/>}
 </Animated.View></View>;
}
export type TitleSession={title:string;key:string;animating:boolean};
export const OnboardingTitleContext=createContext<React.MutableRefObject<TitleSession>|null>(null);
export const OnboardingScrollContext=createContext<React.RefObject<any>|undefined>(undefined);
export function useOnboardingExit(active:boolean,reduced:boolean,appActive:boolean){
 const previous=useRef(active),opacity=useSharedValue(1);
 useLayoutEffect(()=>{cancelAnimation(opacity);if(previous.current&&!active&&!reduced&&appActive){opacity.value=0;opacity.value=withTiming(1,{duration:220,easing:Easing.bezier(.22,1,.36,1)})}else opacity.value=1;previous.current=active;return()=>cancelAnimation(opacity)},[active,reduced,appActive]);
 return useAnimatedStyle(()=>({opacity:opacity.value}));
}
export function OnboardingTitleSlot({title,titleKey,motion,center=false,minLines=2}:{title:string;titleKey:string;motion:MotionEnvironment;center?:boolean;minLines?:1|2}){
 const {palette}=useTheme(),{width}=useWindowDimensions(),shared=useContext(OnboardingTitleContext),own=useRef<TitleSession>({title,key:titleKey,animating:false}),session=shared??own;
 const previous=useRef({title:session.current.title,key:session.current.key}),[display,setDisplay]=useState(title),node=useRef<View>(null);
 const size=width<360?32:36,line=width<360?39:43;
 useLayoutEffect(()=>{
  let timer:ReturnType<typeof setTimeout>|undefined,cancelled=false;
  const old=previous.current,different=old.key!==titleKey&&old.title!==title,interrupted=session.current.animating;
  previous.current={title,key:titleKey};session.current.title=title;session.current.key=titleKey;
  const animated=different&&!interrupted&&!motion.reduced&&motion.visible&&motion.appActive;
  session.current.animating=animated;
  if(!animated)setDisplay(title);
  else{let letters=Array.from(old.title),target=Array.from(title),n=0;setDisplay(old.title);
   const type=()=>{if(cancelled)return;if(n<target.length){setDisplay(target.slice(0,++n).join(''));timer=setTimeout(type,M.titles.typeInterval)}else session.current.animating=false};
   const erase=()=>{if(cancelled)return;if(letters.length){letters.pop();setDisplay(letters.join(''));timer=setTimeout(erase,M.titles.eraseInterval)}else timer=setTimeout(type,M.titles.pause)};
   timer=setTimeout(erase,M.titles.eraseInterval);
  }
  void AccessibilityInfo.isScreenReaderEnabled().then(enabled=>{if(enabled&&!cancelled&&motion.visible&&motion.appActive&&node.current){const handle=findNodeHandle(node.current);if(handle)AccessibilityInfo.setAccessibilityFocus(handle)}});
  return()=>{cancelled=true;if(timer)clearTimeout(timer)};
 },[title,titleKey,motion.reduced,motion.visible,motion.appActive]);
 const font={fontFamily:'Newsreader_400Regular',fontSize:size,lineHeight:line,color:palette.ink,textAlign:center?'center' as const:'left' as const};
 // Reserve the complete destination title, independently of typing. Keeping a
 // previous tutorial title here left an extra blank line on return to identity.
 // Clip the outgoing overlay to this slot; it cannot cover the subtitle.
 return <View ref={node} testID="onboarding-title-slot" accessible accessibilityRole="header" accessibilityLabel={title.replace(/\n/g,' ')} style={{minHeight:center?line:line*minLines,overflow:'hidden'}}>
  <Text accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[font,{opacity:0}]}>{title}</Text>
  <Text accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[font,{position:'absolute',left:0,right:0,top:0}]}>{display}</Text>
 </View>;
}
export type TutorialGestureSlotProps={cardIndex:0|1;hintStopped:boolean;motion:MotionEnvironment;onInteract:()=>void;onSwipe:(direction:'next'|'previous')=>void;children:React.ReactNode};
export function TutorialGestureSlot({children,cardIndex,hintStopped,motion,onInteract,onSwipe}:TutorialGestureSlotProps){
 const [height,setHeight]=useState(218),offset=useSharedValue(0),target=useSharedValue(cardIndex),anchor=useSharedValue(cardIndex),start=useSharedValue(0),held=useSharedValue(false),stopped=useSharedValue(hintStopped),stride=height+18;
 const callbacks=useRef({onInteract,onSwipe});callbacks.current={onInteract,onSwipe};const external=useContext(OnboardingScrollContext);
 const interact=useCallback(()=>callbacks.current.onInteract(),[]),commit=useCallback((a:0|1,next:0|1)=>{if(a!==next)callbacks.current.onSwipe(next>a?'next':'previous')},[]);
 const enabled=motion.visible&&motion.appActive;
 useEffect(()=>{target.value=cardIndex;if(!held.value){cancelAnimation(offset);offset.value=motion.reduced||!enabled?cardIndex*stride:withSpring(cardIndex*stride,spring)}},[cardIndex,stride,motion.reduced,enabled]);
 useEffect(()=>{
  stopped.value=stopped.value||hintStopped;cancelAnimation(offset);
  if(!enabled||motion.reduced){offset.value=cardIndex*stride;return}
  if(!stopped.value&&cardIndex===0)offset.value=withDelay(M.swipeHint.initialDelay,withRepeat(withSequence(withTiming(height*M.swipeHint.travelFraction,{duration:M.swipeHint.moveDuration,easing:Easing.bezier(.22,1,.36,1)}),withTiming(0,{duration:M.swipeHint.returnDuration}),withDelay(M.swipeHint.pause,withTiming(0,{duration:0}))),M.swipeHint.maxLoops,false));
  else if(!held.value)offset.value=withSpring(cardIndex*stride,spring);
  return()=>cancelAnimation(offset);
 },[hintStopped,enabled,motion.reduced,height]);
 const pan=useMemo(()=>{
  const g=Gesture.Pan().enabled(enabled).activeOffsetY([-10,10]).failOffsetX([-24,24]).onTouchesDown(()=>{held.value=true;cancelAnimation(offset);if(!stopped.value){stopped.value=true;runOnJS(interact)()}}).onStart(()=>{anchor.value=target.value;start.value=offset.value}).onUpdate(e=>{offset.value=Math.max(0,Math.min(stride,start.value-e.translationY))}).onEnd(e=>{const next=tutorialTarget(anchor.value,e.translationY,height);target.value=next;offset.value=motion.reduced?next*stride:withSpring(next*stride,{...spring,velocity:-e.velocityY,overshootClamping:true});runOnJS(commit)(anchor.value,next)}).onFinalize(()=>{held.value=false;offset.value=motion.reduced?target.value*stride:withSpring(target.value*stride,spring)});
  if(external)g.blocksExternalGesture(external);return g;
 },[height,stride,enabled,motion.reduced,external,interact,commit]);
 const track=useAnimatedStyle(()=>({transform:[{translateY:-offset.value}]}));
 const cards=React.Children.toArray(children);
 return <GestureDetector gesture={pan}><View testID="tutorial-gesture-slot" style={{height:height+110,overflow:'hidden'}} accessible={false}>
  <Animated.View style={[{gap:18},track]}>{cards.map((card,i)=><View key={i} onLayout={e=>{const measured=e.nativeEvent.layout.height;setHeight(old=>Math.max(old,measured))}} pointerEvents={i===cardIndex?'auto':'none'} accessibilityElementsHidden={i!==cardIndex} importantForAccessibility={i!==cardIndex?'no-hide-descendants':'auto'} style={{minHeight:height}}>{card}</View>)}</Animated.View>
 </View></GestureDetector>;
}
