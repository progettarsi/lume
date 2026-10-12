import React,{createContext,useContext,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Text,View,findNodeHandle,useWindowDimensions,type ViewStyle,type StyleProp} from 'react-native';
import Animated,{cancelAnimation,Easing,useAnimatedProps,useAnimatedStyle,useSharedValue,withRepeat,withSequence,withTiming} from 'react-native-reanimated';
import Svg,{Path,SvgXml} from 'react-native-svg';
import {useTheme} from './Atoms';
import {ONBOARDING_MOTION as M,type MotionEnvironment,type OrganicShapeKind} from '../content/onboardingPresentation';
import {revealedTitleLines,type TitleLine} from '../content/onboardingTitleLayout';
import {onboardingVector} from '../content/onboardingVectors';
const ease=Easing.bezier(.45,0,.55,1);
export function OrganicShapeSlot({kind,size,motion,style}:{kind:OrganicShapeKind;size:number;motion:MotionEnvironment;style?:StyleProp<ViewStyle>}){
 const {palette}=useTheme(),phase=useSharedValue(0),rotation=useSharedValue(0),drift=useSharedValue(0);
 const complex=kind==='identity-action'||kind==='interests-action'||kind==='round-action'||kind==='preparation';
 const moving=!motion.reduced&&motion.appActive&&motion.visible;
 useEffect(()=>{
  cancelAnimation(phase);cancelAnimation(rotation);cancelAnimation(drift);
  if(moving){
   if(complex){rotation.value=withRepeat(withTiming(rotation.value+360,{duration:M.arrowShape.rotationDuration,easing:Easing.linear}),-1,false);phase.value=0}
   else drift.value=withRepeat(withSequence(withTiming(1,{duration:M.background.duration/4,easing:ease}),withTiming(-1,{duration:M.background.duration/2,easing:ease}),withTiming(0,{duration:M.background.duration/4,easing:ease})),-1,false);
  }else if(motion.reduced){phase.value=0;rotation.value=0;drift.value=0}
  return()=>{cancelAnimation(phase);cancelAnimation(rotation);cancelAnimation(drift)};
 },[moving,complex,motion.reduced,kind]);
 const transform=useAnimatedStyle(()=>({transform:complex?[{rotate:`${rotation.value}deg`},{scale:1+Math.sin(phase.value*Math.PI)*.02}]:[{translateX:drift.value*M.background.translateX},{translateY:drift.value*M.background.translateY},{rotate:`${drift.value*M.background.rotation}deg`},{scale:1+drift.value*.02}]}));
 const staticKind=kind==='round-action'?'interests-action':kind;
 return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{width:size,height:size},style]}><Animated.View style={[{width:size,height:size},transform]}>
  {staticKind?<SvgXml xml={onboardingVector(staticKind,palette.ink,palette.paper,palette.active)} width={size} height={size}/>:<View style={{width:size,height:size,borderRadius:size/2,backgroundColor:palette.active}}/>}
 </Animated.View></View>;
}
const EMPTY_TITLE_LINES:TitleLine[]=[];
export type TitleSession={title:string;key:string;animating:boolean};
export const OnboardingTitleContext=createContext<React.MutableRefObject<TitleSession>|null>(null);
export const OnboardingScrollContext=createContext<React.RefObject<any>|undefined>(undefined);
export function useOnboardingExit(active:boolean,reduced:boolean,appActive:boolean){
 const previous=useRef(active),opacity=useSharedValue(1);
 useLayoutEffect(()=>{cancelAnimation(opacity);if(previous.current&&!active&&!reduced&&appActive){opacity.value=0;opacity.value=withTiming(1,{duration:220,easing:Easing.bezier(.22,1,.36,1)})}else opacity.value=1;previous.current=active;return()=>cancelAnimation(opacity)},[active,reduced,appActive]);
 return useAnimatedStyle(()=>({opacity:opacity.value}));
}
export function OnboardingTitleSlot({title,titleKey,motion,center=false,minLines=2,initialReveal=false,onTitleMeasure}:{title:string;titleKey:string;motion:MotionEnvironment;center?:boolean;minLines?:1|2;initialReveal?:boolean;onTitleMeasure?:(text:string,lines:TitleLine[])=>void}){
 const {palette}=useTheme(),{width,fontScale}=useWindowDimensions(),shared=useContext(OnboardingTitleContext),own=useRef<TitleSession>({title,key:titleKey,animating:false}),session=shared??own;
 const first=useRef(true),previous=useRef({title:session.current.title,key:session.current.key}),node=useRef<View>(null);
 const [paint,setPaint]=useState({title,count:Array.from(title).length}),[pending,setPending]=useState<{from:string;to:string}|null>(null),[slotWidth,setSlotWidth]=useState(0);
 const [layouts,setLayouts]=useState<Record<string,TitleLine[]>>({});
 const size=width<360?32:36,line=width<360?39:43;
 const layoutKey=(text:string)=>JSON.stringify([text,slotWidth,fontScale,size,center]);
 const fromLines=pending?(pending.from?layouts[layoutKey(pending.from)]:EMPTY_TITLE_LINES):undefined,toLines=layouts[layoutKey(title)];
 useLayoutEffect(()=>{
  let cancelled=false;
  const old=previous.current,different=old.key!==titleKey&&old.title!==title,interrupted=session.current.animating;
  previous.current={title,key:titleKey};session.current.title=title;session.current.key=titleKey;
  const reveal=first.current&&initialReveal;first.current=false;
  const animated=(different&&!interrupted||reveal)&&!motion.reduced&&motion.visible&&motion.appActive;
  const from=reveal?'':old.title;
  session.current.animating=animated;
  setPending(animated?{from,to:title}:null);
  setPaint({title:animated?from:title,count:Array.from(animated?from:title).length});
  void AccessibilityInfo.isScreenReaderEnabled().then(enabled=>{if(enabled&&!cancelled&&motion.visible&&motion.appActive&&node.current){const handle=findNodeHandle(node.current);if(handle)AccessibilityInfo.setAccessibilityFocus(handle)}});
  return()=>{cancelled=true};
 },[title,titleKey,motion.reduced,motion.visible,motion.appActive]);
 useEffect(()=>{
  if(!pending||!fromLines||!toLines)return;
  let timer:ReturnType<typeof setTimeout>|undefined,cancelled=false,remaining=Array.from(pending.from).length,n=0;
  const targetCount=Array.from(pending.to).length;
  const type=()=>{if(cancelled)return;if(n<targetCount){setPaint({title:pending.to,count:++n});timer=setTimeout(type,M.titles.typeInterval)}else{session.current.animating=false;setPending(null)}};
  const erase=()=>{if(cancelled)return;if(remaining){setPaint({title:pending.from,count:--remaining});timer=setTimeout(erase,M.titles.eraseInterval)}else{setPaint({title:pending.to,count:0});timer=setTimeout(type,M.titles.pause)}};
  timer=setTimeout(erase,M.titles.eraseInterval);
  return()=>{cancelled=true;if(timer)clearTimeout(timer)};
 },[pending,fromLines,toLines]);
 const font={fontFamily:'Newsreader_400Regular',fontSize:size,lineHeight:line,letterSpacing:-.35,color:palette.ink,textAlign:center?'center' as const:'left' as const};
 const measure=(text:string,lines:TitleLine[])=>{onTitleMeasure?.(text,lines);const key=layoutKey(text);setLayouts(old=>JSON.stringify(old[key])===JSON.stringify(lines)?old:{...old,[key]:lines})};
 const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
 const painted=layouts[layoutKey(paint.title)];
 return <View ref={node} testID="onboarding-title-slot" accessible accessibilityRole="header" accessibilityLabel={title.replace(/\n/g,' ')} onLayout={e=>setSlotWidth(e.nativeEvent.layout.width)} style={{minHeight:center?line:line*minLines,overflow:'hidden'}}>
  <Text {...hidden} key={layoutKey(title)} onTextLayout={e=>measure(title,e.nativeEvent.lines)} style={[font,{opacity:0}]}>{title}</Text>
  {pending&&pending.from!==title&&<Text {...hidden} key={layoutKey(pending.from)} onTextLayout={e=>measure(pending.from,e.nativeEvent.lines)} style={[font,{position:'absolute',left:0,right:0,top:0,opacity:0}]}>{pending.from}</Text>}
  {painted?revealedTitleLines(paint.title,painted,paint.count).map((row,i)=><Text {...hidden} key={i} numberOfLines={1} style={[font,{textAlign:'left',position:'absolute',left:row.x,top:row.y,width:Math.max(1,row.width+2)}]}>{row.text}</Text>):<Text {...hidden} style={[font,{position:'absolute',left:0,right:0,top:0}]}>{paint.title}</Text>}
 </View>;
}
