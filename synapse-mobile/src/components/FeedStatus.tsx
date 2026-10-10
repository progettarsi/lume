import {useEffect,useRef,useState} from 'react';
import {View,ScrollView,useWindowDimensions} from 'react-native';
import {Label,Icon,Button,useTheme} from './Atoms';
import {useMotionPreference} from '../useMotionPreference';
import {heading} from '../theme';
import {FEED_COPY,FeedReturnClock,type FeedState} from '../content/feedAvailability';
export function FeedStatus({state,online,category,central=false,active,homeReady,onHome,onRetry}:{state:FeedState;online:boolean;category:string;central?:boolean;active:boolean;homeReady:boolean;onHome:()=>void;onRetry:()=>void}){
 const {palette}=useTheme(),reduced=useMotionPreference(),clock=useRef(new FeedReturnClock()),[remaining,setRemaining]=useState(5000),[cancelled,setCancelled]=useState(false),callbacks=useRef({onHome,homeReady});callbacks.current={onHome,homeReady};
 const terminal=category!=='all'&&(!online||state.phase==='exhausted'),returning=terminal&&central&&homeReady;
 useEffect(()=>{
  if(cancelled){clock.current.cancel();return}
  if(!returning){clock.current.pause();return}
  if(!active){clock.current.pause();return}
  clock.current.resume();const timer=setInterval(()=>{const left=clock.current.tick();setRemaining(left);if(clock.current.done){clearInterval(timer);if(callbacks.current.homeReady)callbacks.current.onHome()}},reduced?1000:100);
  return()=>{clearInterval(timer);clock.current.pause()};
 },[returning,active,reduced,cancelled]);
 const p=!online?category==='all'?FEED_COPY.offline:FEED_COPY.offlineCategory:state.phase==='exhausted'?category==='all'?FEED_COPY.allEmpty:FEED_COPY.exhausted:FEED_COPY[state.phase==='idle'||state.phase==='ready'?'loading':state.phase];
 const waiting=['idle','loading','searching','retrying'].includes(state.phase)&&online;
 if(!central)return <View style={{flexDirection:'row',alignItems:'center',gap:8,padding:8}}><Icon name={p.icon} size={20} color={palette.accent}/><Label accessibilityLiveRegion="polite" style={{flex:1,fontSize:13,lineHeight:18}}>{p.message}</Label>{!waiting&&<Button label={FEED_COPY.retry} onPress={onRetry}><Label strong style={{fontSize:13,color:palette.accent}}>{FEED_COPY.retry}</Label></Button>}</View>;
 const content=<View style={{alignItems:central?'center':'flex-start',gap:central?16:8,padding:central?24:12}}>
  <Icon name={p.icon} size={central?68:22} color={palette.accent}/>
  <Label accessibilityRole="header" style={{fontFamily:central?heading:undefined,fontSize:central?30:16,textAlign:central?'center':'left'}}>{p.title}</Label>
  <Label accessibilityLiveRegion="polite" style={{fontSize:16,lineHeight:23,textAlign:central?'center':'left'}}>{p.message}</Label>
  {terminal?<Button label={FEED_COPY.home} onPress={()=>{clock.current.cancel();setCancelled(true);onHome()}} style={{backgroundColor:palette.active,borderRadius:24,paddingHorizontal:16}}><Label strong>{FEED_COPY.home}</Label></Button>:!waiting&&<Button label={online?FEED_COPY.retry:FEED_COPY.connect} onPress={onRetry}><Label strong style={{color:palette.accent}}>{online?FEED_COPY.retry:FEED_COPY.connect}</Label></Button>}
  {returning&&!cancelled&&<View style={{alignSelf:'stretch',gap:8,marginTop:12}}>
   <Label style={{textAlign:'center',fontSize:14}}>{FEED_COPY.return}</Label>
   <View accessible={false} importantForAccessibility="no-hide-descendants" style={{height:3,backgroundColor:palette.line,borderRadius:2,overflow:'hidden'}}><View style={{height:3,width:`${remaining/50}%`,backgroundColor:palette.accent}}/></View>
   <Button label={FEED_COPY.cancel} onPress={()=>{clock.current.cancel();setCancelled(true)}}><Label style={{fontSize:14}}>{FEED_COPY.cancel}</Label></Button>
  </View>}
 </View>;
 return central?<ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'center'}}>{content}</ScrollView>:content;
}
export function OfflineNotice({repeated}:{repeated:boolean}){
 const {palette}=useTheme(),{fontScale}=useWindowDimensions();
 return <View pointerEvents="none" style={{alignItems:'center',paddingVertical:5,paddingHorizontal:8,backgroundColor:palette.paper}}>
  <Label numberOfLines={1} accessibilityLabel={repeated?FEED_COPY.offlineRepeat:FEED_COPY.offlineShort} accessibilityLiveRegion="polite" style={{fontSize:13,color:palette.ink}}>{repeated?fontScale>2.5?'📴 Offline · ↻':fontScale>1.8?'📴 Offline · Ripetuti':fontScale>1.2?FEED_COPY.offlineLarge:FEED_COPY.offlineRepeat:fontScale>1.2?'📴 Offline':FEED_COPY.offlineShort}</Label>
 </View>;
}
