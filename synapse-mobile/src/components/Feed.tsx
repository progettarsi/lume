import {typography} from '../theme';
import { useRef,useState,useEffect,useLayoutEffect,useCallback,useMemo,memo,type ComponentProps } from 'react';
import { View,StyleSheet,type LayoutRectangle } from 'react-native';
import { Gesture,GestureDetector } from 'react-native-gesture-handler';
import Animated,{useAnimatedStyle,useAnimatedReaction,useSharedValue,withSpring,withTiming,withDelay,withSequence,cancelAnimation,runOnJS,runOnUI,useAnimatedRef,measure} from 'react-native-reanimated';
import {useMotionPreference} from '../useMotionPreference';
import {LinearGradient} from 'expo-linear-gradient';
import type { Article } from '../content/types';
import {isVerified} from '../content/edition';
import { CATEGORIES,categoryLabel } from '../content/categories';
import { heading,spring } from '../theme';
import { Label,Icon,useTheme } from './Atoms';
import type { TitleGeometry } from './TitleWords';
import { SaveButton } from './SaveButton';
import {swipeTarget} from '../content/paging';
import {FEED_WINDOW} from '../content/reserve';
export type Origin=LayoutRectangle&{kind:'home'|'row'|'shuffle';title?:TitleGeometry};
export type OpenArticle=(a:Article,node:View|null,kind:Origin['kind'],title?:TitleGeometry,geometry?:LayoutRectangle)=>void;
export function FeedBottomFade({height}:{height:number}){
 const {palette}=useTheme();
 return <LinearGradient pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" colors={[palette.paper+'00',palette.paper,palette.paper]} locations={[0,Math.min(1,90/height),1]} style={{position:'absolute',bottom:0,left:0,right:0,height}}/>;
}
export function Feed({articles,height,size,saved,onOpen,onSave,onIndex,onDirection,onVisible,onEndReached,covered,readerOpen,entry=0,position=0,presentation,reducedOverride,cardInsets,showTopFade=true,active=true}:{articles:Article[];height:number;size:number;saved:Set<string>;onOpen:OpenArticle;onSave:(a:Article,only?:boolean)=>void;onIndex:(index:number)=>void;onDirection:(hidden:boolean)=>void;onVisible?:(index:number)=>void;onEndReached?:()=>void;covered?:string;readerOpen:boolean;entry?:number;position?:number;presentation?:number;reducedOverride?:boolean;cardInsets?:number[];showTopFade?:boolean;active?:boolean}){
  const {palette}=useTheme(),upward=useSharedValue(0),fadePresence=useSharedValue(0);
  const systemReduced=useMotionPreference(),reduced=reducedOverride??systemReduced;
  const [visible,setVisible]=useState(position),reportedPosition=useRef(position),offset=useSharedValue(position*height),target=useSharedValue(position),anchor=useSharedValue(position),start=useSharedValue(0),direction=useSharedValue(0),lastTranslation=useSharedValue(0),x=useSharedValue(0);
  const revision=presentation??0,latest=useRef(revision),presented=useRef(revision);latest.current=revision;
  const displayIndex=presented.current===revision?visible:Math.max(0,Math.min(position,articles.length-1));
  const alive=useRef(true);
  useLayoutEffect(()=>{alive.current=true;return()=>{alive.current=false;cancelAnimation(offset);cancelAnimation(x)}},[]);
  const callbacks=useRef({onOpen,onSave,onIndex,onDirection,onVisible,onEndReached});callbacks.current={onOpen,onSave,onIndex,onDirection,onVisible,onEndReached};
  const count=useSharedValue(articles.length);
  const dragging=useSharedValue(false),firstMounted=useSharedValue(Math.max(0,position-2)),lastMounted=useSharedValue(Math.min(articles.length-1,position+3));
  const epoch=useSharedValue(revision),gestureEpoch=useSharedValue(-1);
  useLayoutEffect(()=>{
    const next=Math.max(0,Math.min(position,articles.length-1));presented.current=revision;reportedPosition.current=next;setVisible(next);
    runOnUI((token:number,n:number,h:number,length:number,from:number,noMotion:boolean)=>{
      'worklet';cancelAnimation(offset);cancelAnimation(x);epoch.value=token;gestureEpoch.value=-1;dragging.value=false;
      offset.value=n*h;target.value=n;anchor.value=n;start.value=n*h;direction.value=0;lastTranslation.value=0;
      count.value=length;firstMounted.value=Math.max(0,n-2);lastMounted.value=Math.min(length-1,n+3);upward.value=0;fadePresence.value=0;
      if(noMotion)x.value=0;else{if(Math.abs(x.value)<.5)x.value=from;x.value=withTiming(0,{duration:210})}
    })(revision,next,height,articles.length,entry,reduced);
  },[revision]);
  useLayoutEffect(()=>{count.value=articles.length},[articles.length]);
  useLayoutEffect(()=>{firstMounted.value=Math.max(0,displayIndex-2);lastMounted.value=Math.min(articles.length-1,displayIndex+3)},[displayIndex,articles.length]);
  const reportVisible=useCallback((index:number,token:number)=>{if(alive.current&&latest.current===token)callbacks.current.onVisible?.(index)},[]);
  const reportDirection=useCallback((hidden:boolean,token:number)=>{if(alive.current&&latest.current===token)callbacks.current.onDirection(hidden)},[]);
  const openCard=useCallback<OpenArticle>((...args)=>{if(alive.current&&latest.current===revision)callbacks.current.onOpen(...args)},[revision]);
  const saveCard=useCallback((a:Article,only?:boolean)=>callbacks.current.onSave(a,only),[]);
  useAnimatedReaction(()=>({index:Math.abs(x.value)<.5&&Math.abs(offset.value-target.value*height)<.5?target.value:-1,token:epoch.value}),(value,previous)=>{if(value.index>=0)upward.value=0;if(value.index!==previous?.index||value.token!==previous?.token)runOnJS(reportVisible)(value.index,value.token)});
  useAnimatedReaction(()=>upward.value,(value,previous)=>{if(value!==previous)fadePresence.value=reduced?value:withTiming(value,{duration:120})});
  useLayoutEffect(()=>{runOnUI((noMotion:boolean,h:number)=>{'worklet';if(noMotion){cancelAnimation(x);cancelAnimation(offset);x.value=0;offset.value=target.value*h}})(reduced,height)},[reduced,height]);
  // Keyboard/inset changes must keep the selected card aligned with its new page size.
  useLayoutEffect(()=>{runOnUI((h:number)=>{'worklet';cancelAnimation(offset);offset.value=target.value*h})(height)},[height]);
  useLayoutEffect(()=>{const next=Math.max(0,Math.min(position,articles.length-1)),changed=reportedPosition.current!==next;if(changed){reportedPosition.current=next;setVisible(next)}runOnUI((n:number,external:boolean,length:number,h:number,noMotion:boolean)=>{'worklet';if(external||target.value>=length){cancelAnimation(offset);const delta=n-target.value;offset.value+=delta*h;start.value+=delta*h;anchor.value=Math.max(0,anchor.value+delta);target.value=n;if(!dragging.value)offset.value=noMotion?n*h:withSpring(n*h,{stiffness:360,damping:34,mass:.8,overshootClamping:true})}})(next,changed,articles.length,height,reduced)},[position,articles.length]);
  const commit=useCallback((index:number,token:number)=>{if(!alive.current||latest.current!==token)return;reportedPosition.current=index;setVisible(index);callbacks.current.onIndex(index)},[]);
  const reportEnd=useCallback((token:number)=>{if(alive.current&&latest.current===token)callbacks.current.onEndReached?.()},[]);
  // Refills update the limit, not the recognizer under an active finger.
  const pan=useMemo(()=>Gesture.Pan().activeOffsetY([-10,10]).failOffsetX([-24,24])
    .onStart(()=>{gestureEpoch.value=epoch.value;dragging.value=true;cancelAnimation(offset);anchor.value=Math.max(0,Math.min(Math.max(1,count.value)-1,Math.round(offset.value/height)));start.value=offset.value;direction.value=0;lastTranslation.value=0})
    .onUpdate(e=>{
      if(!dragging.value||gestureEpoch.value!==epoch.value)return;
      const low=Math.max(0,firstMounted.value,anchor.value-1)*height,high=Math.min(Math.max(0,count.value-1),lastMounted.value,anchor.value+1)*height;
      offset.value=Math.max(low,Math.min(high,start.value-e.translationY));
      const delta=e.translationY-lastTranslation.value;lastTranslation.value=e.translationY;
      if(Math.abs(delta)>1){const next=delta<0?1:-1;if(next!==direction.value){direction.value=next;upward.value=next===1?1:0;runOnJS(reportDirection)(next===1,gestureEpoch.value)}};
    })
    .onEnd(e=>{
      if(!dragging.value||gestureEpoch.value!==epoch.value)return;
      const next=Math.max(firstMounted.value,Math.min(lastMounted.value,swipeTarget(anchor.value,anchor.value*height-offset.value,e.velocityY,height,Math.max(1,count.value))));target.value=next;
      offset.value=reduced?next*height:withSpring(next*height,{stiffness:360,damping:34,mass:.8,velocity:-e.velocityY,overshootClamping:true,energyThreshold:.0001});
      runOnJS(commit)(next,gestureEpoch.value);if(next===anchor.value&&next===count.value-1&&e.translationY<-24)runOnJS(reportEnd)(gestureEpoch.value);
    })
    .onFinalize((_,success)=>{if(gestureEpoch.value!==epoch.value)return;dragging.value=false;if(!success){upward.value=0;offset.value=reduced?target.value*height:withSpring(target.value*height,{stiffness:360,damping:34,overshootClamping:true})}}),[height,reduced,offset,anchor,target,start,direction,lastTranslation,count,reportDirection,commit,reportEnd,upward,dragging,firstMounted,lastMounted,epoch,gestureEpoch]);
  const track=useAnimatedStyle(()=>({transform:[{translateY:-offset.value},{translateX:x.value}]}));
  // Keep the gradient fixed at the viewport edge and clear resting content.
  // Page displacement includes the spring, so settlement fades it out smoothly.
  const topFade=useAnimatedStyle(()=>{
    const distance=Math.abs(offset.value-Math.round(offset.value/height)*height);
    const progress=Math.max(0,Math.min(1,(distance-.5)/90));
    return {opacity:!showTopFade||readerOpen?0:fadePresence.value*progress*progress*(3-2*progress)};
  });
  // Reserve refills must not resize the transformed native host and restore a
  // stale initial transform. Its bound is the existing finite feed contract;
  // only the nearby cards are mounted and gestures still use the live count.
  return <GestureDetector gesture={pan}><View style={{flex:1,overflow:'hidden'}}><Animated.View style={[{height:Math.max(FEED_WINDOW,articles.length)*height},track]}>
    {articles.slice(Math.max(0,displayIndex-2),displayIndex+4).map((article,j)=>{const i=Math.max(0,displayIndex-2)+j,inset=Math.max(0,Math.min(height-1,cardInsets?.[i]??0));return <View key={presentation===undefined?(cardInsets?`${i}:${article.id}`:article.id):i} pointerEvents={i===displayIndex?'auto':'none'} accessibilityElementsHidden={i!==displayIndex} importantForAccessibility={i===displayIndex?'auto':'no-hide-descendants'} style={{position:'absolute',top:i*height,left:0,right:0,height,paddingTop:inset}}><FeedCard article={article} height={height-inset} size={size} saved={saved.has(article.id)} hidden={covered===article.id} hideMeta={covered===article.id&&readerOpen} active={active&&i===displayIndex&&!readerOpen} reduced={reduced} onOpen={openCard} onSave={saveCard}/></View>})}
    {!articles.length&&<View style={{padding:24}}><Label>La prossima scoperta sta arrivando.</Label></View>}
  </Animated.View><Animated.View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{position:'absolute',top:0,left:0,right:0,height:90},topFade]}><LinearGradient colors={[palette.paper,palette.paper+'00']} style={StyleSheet.absoluteFill}/></Animated.View></View></GestureDetector>;
}
export const FeedCard=memo(function FeedCard({article,height,size,saved,hidden,hideMeta,reduced,onOpen,onSave,natural=false,active=true}:{article:Article;height:number;size:number;saved:boolean;hidden:boolean;hideMeta:boolean;reduced:boolean;onOpen:OpenArticle;onSave:(a:Article,only?:boolean)=>void;natural?:boolean;active?:boolean}){
  const {palette}=useTheme(),node=useAnimatedRef<View>(),press=useSharedValue(1);
  useLayoutEffect(()=>{cancelAnimation(press);press.value=1;return()=>cancelAnimation(press)},[reduced,article.id,onOpen]);
  const style=useAnimatedStyle(()=>({transform:[{scale:press.value}]}));
  const openArticle=useCallback((geometry:LayoutRectangle|null)=>onOpen(article,node.current,'home',undefined,geometry??undefined),[article,onOpen]);
  // Pressure/release are native UI worklets even while JS is persisting or
  // ranking. Only a recognized semantic action crosses to the JS thread.
  const single=useMemo(()=>Gesture.Tap().enabled(active).maxDistance(14).maxDuration(450).onBegin(()=>{press.value=reduced?1:withTiming(.985,{duration:80})}).onEnd((_,ok)=>{press.value=reduced?1:withSpring(1,spring);if(ok){const box=measure(node);runOnJS(openArticle)(box?{x:box.pageX,y:box.pageY,width:box.width,height:box.height}:null)}}).onFinalize(()=>press.value=reduced?1:withSpring(1,spring)),[active,reduced,openArticle,press]);
  return <View style={{height:natural?undefined:height,minHeight:natural?height:undefined,paddingHorizontal:24,paddingTop:4}}>
    <View style={[styles.meta,{opacity:hideMeta?0:1}]}><View style={[styles.badge,{backgroundColor:palette.surface}]}><Icon name={(CATEGORIES.find(c=>c.id===article.category)?.icon||'tag-outline') as ComponentProps<typeof Icon>['name']} size={17}/><Label style={{fontSize:14}}>{categoryLabel(article.category)}</Label>{isVerified(article)&&<View accessible accessibilityLabel="Selezione Lume, controlli automatici"><Icon name="check-decagram" size={17} color={palette.accent}/></View>}</View><View style={{flex:1}}/><SaveButton key={article.id} saved={saved} onPress={()=>onSave(article)} active={active&&!hideMeta} reduced={reduced}/></View>
    <GestureDetector gesture={single}><Animated.View ref={node} collapsable={false} style={[natural?styles.naturalReading:styles.reading,style,{opacity:hidden?0:1}]} accessible accessibilityRole="button" accessibilityLabel={`Approfondisci: ${article.title}`} accessibilityActions={[{name:'activate',label:'Apri articolo'},{name:'longpress',label:'Salva articolo'}]} onAccessibilityAction={e=>e.nativeEvent.actionName==='longpress'?onSave(article,true):onOpen(article,node.current,'home')}>
      <Label accessibilityRole="header" style={styles.title}>{article.title}</Label>{article.preview.map((p,i)=><Label key={i} style={{fontSize:size,lineHeight:size*1.47,marginBottom:22}}>{p}</Label>)}
    </Animated.View></GestureDetector>
  </View>;
});
const styles=StyleSheet.create({meta:{flexDirection:'row',gap:7,alignItems:'center',marginBottom:16},badge:{flexDirection:'row',gap:6,alignItems:'center',borderRadius:24,paddingVertical:8,paddingHorizontal:10},reading:{flex:1,overflow:'hidden'},naturalReading:{overflow:'visible'},title:{...typography.feed,letterSpacing:-.7,marginBottom:22},fade:{position:'absolute',bottom:0,left:0,right:0,height:145},confirmation:{position:'absolute',top:'40%',left:'50%',marginLeft:-32,width:64,height:64,borderRadius:24,alignItems:'center',justifyContent:'center'}});


