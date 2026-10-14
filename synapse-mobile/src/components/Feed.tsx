import {typography} from '../theme';
import { useRef,useState,useEffect,useLayoutEffect,useCallback,useMemo,memo } from 'react';
import { View,StyleSheet,type LayoutRectangle } from 'react-native';
import { Gesture,GestureDetector } from 'react-native-gesture-handler';
import Animated,{useAnimatedStyle,useAnimatedReaction,useSharedValue,withSpring,withTiming,cancelAnimation,runOnJS} from 'react-native-reanimated';
import {useMotionPreference} from '../useMotionPreference';
import * as Haptics from 'expo-haptics';
import {LinearGradient} from 'expo-linear-gradient';
import type { Article } from '../content/types';
import {isVerified} from '../content/edition';
import { categoryLabel } from '../content/categories';
import { heading,spring } from '../theme';
import { Label,Icon,useTheme } from './Atoms';
import type { TitleGeometry } from './TitleWords';
import { SaveButton } from './SaveButton';
import {swipeTarget} from '../content/paging';
export type Origin=LayoutRectangle&{kind:'home'|'row'|'shuffle';title?:TitleGeometry};
export type OpenArticle=(a:Article,node:View|null,kind:Origin['kind'],title?:TitleGeometry)=>void;
export function FeedBottomFade({height}:{height:number}){
 const {palette}=useTheme();
 return <LinearGradient pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" colors={[palette.paper+'00',palette.paper,palette.paper]} locations={[0,Math.min(1,90/height),1]} style={{position:'absolute',bottom:0,left:0,right:0,height}}/>;
}
export function Feed({articles,height,size,saved,onOpen,onSave,onIndex,onDirection,onVisible,onEndReached,covered,readerOpen,entry=0,position=0,reducedOverride,cardInsets,showTopFade=true}:{articles:Article[];height:number;size:number;saved:Set<string>;onOpen:OpenArticle;onSave:(a:Article,only?:boolean)=>void;onIndex:(index:number)=>void;onDirection:(hidden:boolean)=>void;onVisible?:(index:number)=>void;onEndReached?:()=>void;covered?:string;readerOpen:boolean;entry?:number;position?:number;reducedOverride?:boolean;cardInsets?:number[];showTopFade?:boolean}){
  const {palette}=useTheme(),upward=useSharedValue(0),fadePresence=useSharedValue(0);
  const systemReduced=useMotionPreference(),reduced=reducedOverride??systemReduced;
  const [visible,setVisible]=useState(position),reportedPosition=useRef(position),offset=useSharedValue(position*height),target=useSharedValue(position),anchor=useSharedValue(position),start=useSharedValue(0),direction=useSharedValue(0),lastTranslation=useSharedValue(0),x=useSharedValue(entry);
  const callbacks=useRef({onOpen,onSave,onIndex,onDirection,onVisible,onEndReached});callbacks.current={onOpen,onSave,onIndex,onDirection,onVisible,onEndReached};
  const count=useSharedValue(articles.length);
  useLayoutEffect(()=>{count.value=articles.length},[articles.length]);
  const reportVisible=useCallback((index:number)=>callbacks.current.onVisible?.(index),[]);
  const reportDirection=useCallback((hidden:boolean)=>callbacks.current.onDirection(hidden),[]);
  const openCard=useCallback<OpenArticle>((...args)=>callbacks.current.onOpen(...args),[]);
  const saveCard=useCallback((a:Article,only?:boolean)=>callbacks.current.onSave(a,only),[]);
  useAnimatedReaction(()=>Math.abs(x.value)<.5&&Math.abs(offset.value-target.value*height)<.5?target.value:-1,(index,previous)=>{if(index>=0)upward.value=0;if(index!==previous)runOnJS(reportVisible)(index)});
  useAnimatedReaction(()=>upward.value,(value,previous)=>{if(value!==previous)fadePresence.value=reduced?value:withTiming(value,{duration:120})});
  useLayoutEffect(()=>{x.value=reduced?0:withTiming(0,{duration:210})},[]);
  useLayoutEffect(()=>{if(reduced){cancelAnimation(x);cancelAnimation(offset);x.value=0;offset.value=target.value*height}},[reduced,height]);
  // Keyboard/inset changes must keep the selected card aligned with its new page size.
  useLayoutEffect(()=>{cancelAnimation(offset);offset.value=target.value*height},[height]);
  useLayoutEffect(()=>{if(reportedPosition.current!==position){reportedPosition.current=position;cancelAnimation(offset);offset.value+=(position-target.value)*height;target.value=position;offset.value=reduced?position*height:withSpring(position*height,{stiffness:360,damping:34,mass:.8,overshootClamping:true});setVisible(position)}},[position]);
  const commit=useCallback((index:number)=>{reportedPosition.current=index;setVisible(index);callbacks.current.onIndex(index)},[]);
  const reportEnd=useCallback(()=>callbacks.current.onEndReached?.(),[]);
  // Refills update the limit, not the recognizer under an active finger.
  const pan=useMemo(()=>Gesture.Pan().activeOffsetY([-10,10]).failOffsetX([-24,24])
    .onStart(()=>{cancelAnimation(offset);anchor.value=Math.max(0,Math.min(Math.max(1,count.value)-1,Math.round(offset.value/height)));start.value=offset.value;direction.value=0;lastTranslation.value=0})
    .onUpdate(e=>{
      const low=Math.max(0,(anchor.value-1)*height),high=Math.min(Math.max(0,count.value-1),(anchor.value+1))*height;
      offset.value=Math.max(low,Math.min(high,start.value-e.translationY));
      const delta=e.translationY-lastTranslation.value;lastTranslation.value=e.translationY;
      if(Math.abs(delta)>1){const next=delta<0?1:-1;if(next!==direction.value){direction.value=next;upward.value=next===1?1:0;runOnJS(reportDirection)(next===1)}};
    })
    .onEnd(e=>{
      const next=swipeTarget(anchor.value,anchor.value*height-offset.value,e.velocityY,height,Math.max(1,count.value));target.value=next;
      offset.value=reduced?next*height:withSpring(next*height,{stiffness:360,damping:34,mass:.8,velocity:-e.velocityY,overshootClamping:true,energyThreshold:.0001});
      runOnJS(commit)(next);if(next===anchor.value&&next===count.value-1&&e.translationY<-24)runOnJS(reportEnd)();
    })
    .onFinalize((_,success)=>{if(!success){upward.value=0;offset.value=reduced?target.value*height:withSpring(target.value*height,{stiffness:360,damping:34,overshootClamping:true})}}),[height,reduced,offset,anchor,target,start,direction,lastTranslation,count,reportDirection,commit,reportEnd,upward]);
  const track=useAnimatedStyle(()=>({transform:[{translateY:-offset.value},{translateX:x.value}]}));
  // Keep the gradient fixed at the viewport edge and clear resting content.
  // Page displacement includes the spring, so settlement fades it out smoothly.
  const topFade=useAnimatedStyle(()=>{
    const distance=Math.abs(offset.value-Math.round(offset.value/height)*height);
    const progress=Math.max(0,Math.min(1,(distance-.5)/90));
    return {opacity:!showTopFade||readerOpen?0:fadePresence.value*progress*progress*(3-2*progress)};
  });
  return <GestureDetector gesture={pan}><View style={{flex:1,overflow:'hidden'}}><Animated.View style={[{height:articles.length*height},track]}>
    {articles.slice(Math.max(0,visible-2),visible+4).map((article,j)=>{const i=Math.max(0,visible-2)+j,inset=Math.max(0,Math.min(height-1,cardInsets?.[i]??0));return <View key={cardInsets?`${i}:${article.id}`:article.id} pointerEvents={i===visible?'auto':'none'} accessibilityElementsHidden={i!==visible} importantForAccessibility={i===visible?'auto':'no-hide-descendants'} style={{position:'absolute',top:i*height,left:0,right:0,height,paddingTop:inset}}><FeedCard article={article} height={height-inset} size={size} saved={saved.has(article.id)} hidden={covered===article.id} hideMeta={covered===article.id&&readerOpen} reduced={reduced} onOpen={openCard} onSave={saveCard}/></View>})}
    {!articles.length&&<View style={{padding:24}}><Label>La prossima scoperta sta arrivando.</Label></View>}
  </Animated.View><Animated.View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{position:'absolute',top:0,left:0,right:0,height:90},topFade]}><LinearGradient colors={[palette.paper,palette.paper+'00']} style={StyleSheet.absoluteFill}/></Animated.View></View></GestureDetector>;
}
export const FeedCard=memo(function FeedCard({article,height,size,saved,hidden,hideMeta,reduced,onOpen,onSave,natural=false}:{article:Article;height:number;size:number;saved:boolean;hidden:boolean;hideMeta:boolean;reduced:boolean;onOpen:OpenArticle;onSave:(a:Article,only?:boolean)=>void;natural?:boolean}){
  const {palette}=useTheme(),node=useRef<View>(null),feedback=useSharedValue(0),press=useSharedValue(1);
  const [confirmed,setConfirmed]=useState(false);
  useEffect(()=>{if(!confirmed)return;const timer=setTimeout(()=>{feedback.value=reduced?0:withTiming(0,{duration:130});setConfirmed(false)},420);return()=>clearTimeout(timer)},[confirmed,reduced]);
  useEffect(()=>{if(reduced){cancelAnimation(press);cancelAnimation(feedback);press.value=1;feedback.value=confirmed?1:0}},[reduced,confirmed]);
  const style=useAnimatedStyle(()=>({transform:[{scale:press.value}]})),bookmark=useAnimatedStyle(()=>({transform:[{scale:feedback.value}],opacity:feedback.value>0?1:0}));
  const double=Gesture.Tap().numberOfTaps(2).maxDistance(7).maxDuration(200).maxDelay(280).runOnJS(true).onEnd((_,ok)=>{if(ok){onSave(article,true);setConfirmed(true);feedback.value=reduced?1:withSpring(1,spring);void Haptics.selectionAsync().catch(()=>{})}});
  const single=Gesture.Tap().maxDistance(7).maxDuration(250).runOnJS(true).onBegin(()=>{press.value=reduced?1:withTiming(.985,{duration:80})}).onEnd((_,ok)=>{press.value=reduced?1:withSpring(1,spring);if(ok)onOpen(article,node.current,'home')}).onFinalize(()=>press.value=reduced?1:withSpring(1,spring));
  return <View style={{height:natural?undefined:height,minHeight:natural?height:undefined,paddingHorizontal:24,paddingTop:4}}>
    <View style={[styles.meta,{opacity:hideMeta?0:1}]}><View style={[styles.badge,{backgroundColor:palette.surface}]}><Icon name="tag-outline" size={17}/><Label style={{fontSize:14}}>{categoryLabel(article.category)}</Label>{isVerified(article)&&<View accessible accessibilityLabel="Selezione Lume, controlli automatici"><Icon name="check-decagram" size={17} color={palette.accent}/></View>}</View><View style={{flex:1}}/><SaveButton gestureManaged saved={saved} onPress={()=>onSave(article)}/></View>
    <GestureDetector gesture={Gesture.Exclusive(double,single)}><Animated.View ref={node} style={[natural?styles.naturalReading:styles.reading,style,{opacity:hidden?0:1}]} accessible accessibilityRole="button" accessibilityLabel={`Approfondisci: ${article.title}`} accessibilityActions={[{name:'activate',label:'Apri articolo'},{name:'longpress',label:'Salva articolo'}]} onAccessibilityAction={e=>e.nativeEvent.actionName==='longpress'?onSave(article,true):onOpen(article,node.current,'home')}>
      <Label accessibilityRole="header" style={styles.title}>{article.title}</Label>{article.preview.map((p,i)=><Label key={i} style={{fontSize:size,lineHeight:size*1.47,marginBottom:22}}>{p}</Label>)}
      <Animated.View pointerEvents="none" style={[styles.confirmation,{backgroundColor:palette.active},bookmark]}><Icon name="bookmark" size={36}/></Animated.View>
    </Animated.View></GestureDetector>
  </View>;
});
const styles=StyleSheet.create({meta:{flexDirection:'row',gap:7,alignItems:'center',marginBottom:16},badge:{flexDirection:'row',gap:6,alignItems:'center',borderRadius:24,paddingVertical:8,paddingHorizontal:10},reading:{flex:1,overflow:'hidden'},naturalReading:{overflow:'visible'},title:{...typography.feed,letterSpacing:-.7,marginBottom:22},fade:{position:'absolute',bottom:0,left:0,right:0,height:145},confirmation:{position:'absolute',top:'40%',left:'50%',marginLeft:-32,width:64,height:64,borderRadius:24,alignItems:'center',justifyContent:'center'}});


