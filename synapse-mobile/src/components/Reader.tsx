import {sourceInfo,sourceName} from '../content/edition';
import {typography} from '../theme';
import {useEffect,useLayoutEffect,useRef,useState,useMemo} from 'react';
import {View,Linking,StyleSheet,ActivityIndicator,AccessibilityInfo} from 'react-native';
import Animated,{useAnimatedStyle,useSharedValue,withSpring,withTiming,withSequence,cancelAnimation,runOnJS,runOnUI,useReducedMotion,useAnimatedReaction,useAnimatedScrollHandler,useAnimatedRef,scrollTo,interpolateColor,type SharedValue} from 'react-native-reanimated';
import {heading,spring} from '../theme';
import {Label,Icon,useTheme,Button} from './Atoms';
import {SaveButton} from './SaveButton';
import {ShuffleIcon,SHUFFLE_ICON_SIZE} from './ShuffleButton';
import {ReaderReveal} from './ReaderReveal';
import {ReaderNotice} from './ReaderNotice';
import type {ReaderStatus} from '../content/readerStatus';
import {ReaderExit} from './ReaderExit';
import {nearReturn,returnFinished} from '../content/readerReturn';
import {TitleWords,type TitleGeometry} from './TitleWords';
import type {Article} from '../content/types';
import type {Origin} from './Feed';
import {readerContinuation,hasRevision} from '../content/text';
import {categoryLabel} from '../content/categories';
import {LinearGradient} from 'expo-linear-gradient';
import {safeSourceUrl} from '../content/safeSourceUrl';
function phase(p:number,start:number,end:number){'worklet';const t=Math.max(0,Math.min(1,(p-start)/(end-start)));return t*t*(3-2*t)}
export function Reader({article:incomingArticle,origin,open,width,height,top,bottom,size,saved,onClose,onReopen,onClosed,onSave,aiMessage:incomingMessage,aiBusy:incomingBusy,onRetryAI,onRetryArticle,notice:incomingNotice,onReturnNear,returnDetached=false,reducedOverride,returnPaper,onDoubleTapSave}:{article:Article;origin:Origin;open:boolean;width:number;height:number;top:number;bottom:number;size:number;saved:boolean;onClose:()=>void;onReopen:()=>void;onClosed:()=>void;onSave:()=>void;aiMessage?:string;aiBusy?:boolean;onRetryAI?:()=>void;onRetryArticle?:()=>void;notice?:ReaderStatus;onReturnNear?:()=>void;returnDetached?:boolean;reducedOverride?:boolean;returnPaper?:string;onDoubleTapSave?:()=>void}){
  const {palette}=useTheme(),systemReduced=useReducedMotion(),[reduced,setReduced]=useState(systemReduced),progress=useSharedValue(0),scroll=useSharedValue(0),target=useRef(open);target.current=open;
  useEffect(()=>{
    let listening=true;
    const subscription=AccessibilityInfo.addEventListener('reduceMotionChanged',enabled=>{if(listening)setReduced(enabled)});
    void AccessibilityInfo.isReduceMotionEnabled().then(enabled=>{if(listening)setReduced(enabled)}).catch(()=>{});
    return()=>{listening=false;subscription.remove()};
  },[]);
  const motionReduced=reducedOverride??reduced;
  // A late edition must not change native extent or the return geometry mid-close.
  const lastOpen=useRef({article:incomingArticle,aiMessage:incomingMessage,aiBusy:incomingBusy,notice:incomingNotice});
  if(open)lastOpen.current={article:incomingArticle,aiMessage:incomingMessage,aiBusy:incomingBusy,notice:incomingNotice};
  const {article,aiMessage,aiBusy,notice}=lastOpen.current;
  const [sourceNotice,setSourceNotice]=useState<ReaderStatus|null>(null);
  const effectiveNotice=sourceNotice||notice;
  const row=origin.kind==='row',shuffle=origin.kind==='shuffle',destinationY=top+72;
  const preview=useRef(article.preview).current;
  const revision=hasRevision(article),[titleLayout,setTitleLayout]=useState<TitleGeometry|null>(null);
  // Available text stays readable while a download/revision is pending. Busy
  // describes the request, not the visibility of an already available edition.
  const edition=JSON.stringify(readerContinuation({...article,preview}));
  const paragraphs=useMemo<string[]>(()=>JSON.parse(edition),[edition]);
  const active=useSharedValue(open),viewport=useSharedValue(0),scrolled=useSharedValue(false),bodyY=useSharedValue(0),expandedY=useSharedValue(0);
  const noticeY=useSharedValue(-1),noticeHeight=useSharedValue(0),[noticeVisible,setNoticeVisible]=useState(false),hasNotice=!!effectiveNotice;
  // Count the dismissal deadline only when the footer can actually be seen.
  // The UI observes scroll/layout; JS changes only on crossing the boundary.
  useAnimatedReaction(()=>{
    const start=16+bodyY.value+expandedY.value+noticeY.value;
    return hasNotice&&active.value&&progress.value>.98&&noticeY.value>=0&&noticeHeight.value>0&&scroll.value+viewport.value>start+Math.min(48,noticeHeight.value)&&scroll.value<start+noticeHeight.value;
  },(visible,previous)=>{if(visible!==previous)runOnJS(setNoticeVisible)(visible)});
  const scrollRef=useAnimatedRef<Animated.ScrollView>(),returnScroll=useSharedValue(0),exit=useSharedValue(0);
  useLayoutEffect(()=>{active.value=open},[open]);
  const onScroll=useAnimatedScrollHandler(e=>{
    scroll.value=Math.max(0,e.contentOffset.y);
    viewport.value=e.layoutMeasurement.height;
    if(active.value&&scroll.value>1)scrolled.value=true;
  });
  const touch=useRef<{x:number;y:number;moved:boolean}|null>(null),lastTap=useRef<{x:number;y:number;time:number}|null>(null);
  const openLink=async(url:string)=>{try{await Linking.openURL(url);setSourceNotice(null)}catch{setSourceNotice({kind:'network',message:'Impossibile aprire il collegamento. Controlla che sia disponibile un browser.'})}};
  const openSource=()=>{const safe=safeSourceUrl(article.source);if(safe)return openLink(safe);setSourceNotice({kind:'content',message:article.contentIssue||'Approfondimento non disponibile per questa voce.',action:'source'})};
  const completed=()=>{if(!target.current)onClosed()};
  const closing=useSharedValue(false),didComplete=useSharedValue(false),didHandOff=useSharedValue(false);
  // The source preview retains its own native layout throughout the morph.
  // A nested feed is narrower than the full reader; never rewrap it mid-flight.
  const embedded=origin.kind==='home'&&!!returnPaper;
  const handOff=()=>{if(!target.current)onReturnNear?.()};
  useAnimatedReaction(()=>({closing:closing.value,y:returnScroll.value}),next=>{
    if(next.closing)scrollTo(scrollRef,0,next.y,false);
  });
  useAnimatedReaction(()=>closing.value&&nearReturn(progress.value,returnScroll.value),atEnd=>{
    if(atEnd&&!didHandOff.value){didHandOff.value=true;runOnJS(handOff)()}
  });
  // Finish on the visible endpoint, independent of a spring completion callback.
  useAnimatedReaction(()=>closing.value&&returnFinished(progress.value,returnScroll.value),(atEnd)=>{
    if(atEnd&&!didComplete.value){didComplete.value=true;runOnJS(completed)()}
  });
  // First return the native scroll quickly while the page barely contracts.
  // Both legs are animations, not an input lock. Reopen cancels from the current
  // scroll/paint/geometry; it does not restore a stale saved offset.
  useLayoutEffect(()=>{
    if(row&&!titleLayout)return;
    runOnUI((opening:boolean,noMotion:boolean)=>{
      'worklet';
      cancelAnimation(returnScroll);cancelAnimation(exit);cancelAnimation(progress);
      closing.value=!opening;didComplete.value=false;didHandOff.value=false;
      const geometry={...spring,stiffness:520,damping:40,mass:.7,energyThreshold:.0001,overshootClamping:true};
      if(opening){
        exit.value=noMotion?0:withTiming(0,{duration:110});
        progress.value=noMotion?1:withSpring(1,geometry);
      }else{
        returnScroll.value=scroll.value;
        scrollTo(scrollRef,0,scroll.value,false); // Stop native momentum at its current position.
        const duration=noMotion?0:scroll.value>.5?140:100;
        returnScroll.value=withTiming(0,{duration});
        exit.value=withTiming(1,{duration});
        progress.value=noMotion?0:scroll.value>.5&&progress.value>.94
          ?withSequence(withTiming(.94,{duration}),withSpring(0,geometry))
          :withSpring(0,geometry);
      }
    })(open,motionReduced);
  },[open,motionReduced,!!titleLayout]);
  useEffect(()=>()=>{cancelAnimation(progress);cancelAnimation(returnScroll);cancelAnimation(exit)},[]);
  // Capture every geometry input. A restricted dependency list kept the IME-open
  // origin in this mapper after close supplied the IME-closed shuffle endpoint.
  const surface=useAnimatedStyle(()=>{const p=Math.max(0,Math.min(1,progress.value));return {opacity:returnDetached?phase(p,0,.12):1,left:origin.x*(1-p),top:origin.y*(1-p),width:origin.width+(width-origin.width)*p,height:origin.height+(height-origin.height)*p,borderRadius:shuffle?28*(1-p):0,backgroundColor:shuffle?interpolateColor(Math.min(1,p/.14),[0,1],[palette.active,palette.paper]):returnPaper?interpolateColor(p,[0,1],[returnPaper,palette.paper]):palette.paper}});
  const content=useAnimatedStyle(()=>{const p=Math.max(0,Math.min(1,progress.value));const scale=shuffle?origin.width/width+(1-origin.width/width)*p:1;
    // Centre the miniature around its title, rather than squeezing an unscaled page into a circle.
    return {width,height,opacity:shuffle?phase(p,.12,.25):embedded?phase(p,.65,.9):1,overflow:'hidden',transformOrigin:'top left',transform:[{translateX:shuffle?0:-(embedded?24:origin.x)*(1-p)},{translateY:shuffle?(origin.height/2-destinationY*scale)*(1-p):row?((origin.title?.y??48)-destinationY)*(1-p):-destinationY*(1-p)},{scale}]};
  });
  const sourcePreview=useAnimatedStyle(()=>{const p=Math.max(0,Math.min(1,progress.value));return {opacity:1-phase(p,.65,.9),transform:[{translateX:24*p},{translateY:destinationY*p}]}});
  const expanded=useAnimatedStyle(()=>({opacity:phase(progress.value,.55,.82),overflow:'hidden'}));
  const controls=useAnimatedStyle(()=>({height:phase(progress.value,.58,1)*(top+56),transform:[{translateY:-10*(1-progress.value)}],overflow:'hidden'}));
  const iconStyle=useAnimatedStyle(()=>{const p=Math.max(0,Math.min(1,progress.value));return {
    left:(origin.width+(width-origin.width)*p-SHUFFLE_ICON_SIZE)/2,
    top:(origin.height+(height-origin.height)*p-SHUFFLE_ICON_SIZE)/2,
    transform:[{scale:1-.25*phase(progress.value,0,.12)},{rotate:`${-25*phase(progress.value,0,.12)}deg`}],
  }});
  const iconClip=useAnimatedStyle(()=>{const visible=SHUFFLE_ICON_SIZE*(1-phase(progress.value,0,.12));return {height:visible,top:(SHUFFLE_ICON_SIZE-visible)/2,overflow:'hidden'}});
  const metaStyle=useAnimatedStyle(()=>({width:phase(1-progress.value,.75,1)*Math.max(0,origin.width-30),overflow:'hidden'}));
  const titleClip=useAnimatedStyle(()=>({top:phase(progress.value,.88,1)*(destinationY-16)}));
  // Scroll moves the title as a layer; it must not reapply font/layout props.
  const titleScroll=useAnimatedStyle(()=>({transform:[{translateY:-scroll.value*Math.max(0,Math.min(1,progress.value))}]}));
  const returnGradient=useAnimatedStyle(()=>({opacity:1-Math.max(0,Math.min(1,progress.value))}));
  const rowHandoff=useAnimatedStyle(()=>({opacity:returnDetached?phase(progress.value,0,.12):1}),[returnDetached]);
  // A detached return is paint only. Even if its final animation callback is
  // delayed, the old page must never intercept the new page's input or focus.
  return <Animated.View style={[StyleSheet.absoluteFill,{zIndex:40}]} pointerEvents={!open&&returnDetached?'none':'box-none'} accessibilityElementsHidden={!open&&returnDetached} importantForAccessibility={!open&&returnDetached?'no-hide-descendants':'auto'} accessibilityViewIsModal={open}>
    <Animated.View style={[styles.surface,surface]}>
      <Animated.View style={content}>
        <Animated.ScrollView ref={scrollRef} scrollEnabled={open} onScroll={onScroll} onLayout={e=>{viewport.value=e.nativeEvent.layout.height}} scrollEventThrottle={16} showsVerticalScrollIndicator={false} style={{position:'absolute',top:destinationY-16,left:0,right:0,bottom:0}} contentContainerStyle={{paddingHorizontal:24,paddingTop:16,paddingBottom:bottom+40}}>
          <View onTouchStart={e=>{touch.current={x:e.nativeEvent.pageX,y:e.nativeEvent.pageY,moved:false}}} onTouchMove={e=>{if(touch.current&&Math.hypot(e.nativeEvent.pageX-touch.current.x,e.nativeEvent.pageY-touch.current.y)>8)touch.current.moved=true}} onTouchCancel={()=>{touch.current=null}} onTouchEnd={()=>{const tap=touch.current;touch.current=null;if(!tap||tap.moved){lastTap.current=null;return}if(!open){lastTap.current=null;onReopen();return}if(onDoubleTapSave){const now=Date.now(),previous=lastTap.current;if(previous&&now-previous.time<=280&&Math.hypot(tap.x-previous.x,tap.y-previous.y)<=24){lastTap.current=null;onDoubleTapSave()}else lastTap.current={x:tap.x,y:tap.y,time:now}}}}>
            <View>{row?<View accessible accessibilityRole="header" accessibilityLabel={article.title} style={{height:titleLayout?.height||88,marginBottom:22}}/>:<Label accessibilityRole="header" style={styles.title}>{article.title}</Label>}</View>
            <View onLayout={e=>{bodyY.value=e.nativeEvent.layout.y}}>
              <Animated.View style={row&&returnPaper?expanded:undefined}>{preview.map((p,i)=><Label key={`preview-${i}`} style={{fontSize:size,lineHeight:size*1.47,marginBottom:22}}>{p}</Label>)}</Animated.View>
              <Animated.View style={expanded} onLayout={e=>{expandedY.value=e.nativeEvent.layout.y}}>
                <ReaderExit exit={exit} scroll={scroll} viewport={viewport} bodyY={bodyY} expandedY={expandedY} reduced={motionReduced} size={size}>
                <ReaderReveal paragraphs={paragraphs} size={size} scroll={scroll} viewport={viewport} scrolled={scrolled} bodyY={bodyY} expandedY={expandedY} progress={progress} active={active} reduced={motionReduced}/>
                {effectiveNotice&&<View onLayout={e=>{noticeY.value=e.nativeEvent.layout.y;noticeHeight.value=e.nativeEvent.layout.height}}><ReaderNotice status={effectiveNotice} onArticle={onRetryArticle} onAI={onRetryAI} onSource={openSource} timeoutEnabled={noticeVisible&&open}/></View>}
                {!effectiveNotice&&aiMessage&&<View style={{marginBottom:18}}>{aiBusy&&<ActivityIndicator size="small" color={palette.accent} style={{alignSelf:'flex-start',marginBottom:8}}/>}<Label muted accessibilityLiveRegion="polite" style={{fontSize:13,lineHeight:18}}>{aiMessage}</Label>{!aiBusy&&!revision&&article.complete&&readerContinuation({...article,simplified:undefined}).length>0&&onRetryAI&&<Button label="Riprova revisione Gemini" onPress={onRetryAI}><Label style={{fontSize:14,color:palette.accent}}>Riprova con Gemini</Label></Button>}</View>}
                <View style={{borderTopWidth:1,borderColor:palette.line,marginTop:16,paddingTop:20}}>{revision&&!aiBusy&&<View style={{flexDirection:'row',gap:8,alignItems:'flex-start',marginBottom:10}}><Icon name="auto-fix" size={16} color={palette.muted}/><Label muted style={{flex:1,fontSize:13,lineHeight:18}}>Approfondimento revisionato con Gemini. Verifica la fonte per i dettagli.</Label></View>}<Button label={"Apri la fonte "+sourceName(article)} onPress={openSource}><Label style={{color:palette.accent}}>Approfondisci su {sourceName(article)} ↗</Label></Button><Label muted style={{fontSize:12,lineHeight:18}}>Fonte: {sourceInfo(article).attribution} · CC BY-SA. {article.revision?`Revisione ${article.revision}. `:''}Selezione divulgativa del testo; consulta la fonte per la voce completa.</Label><Button label="Licenza del testo" onPress={()=>void openLink(sourceInfo(article).license)}><Label muted style={{fontSize:12}}>Licenza e attribuzione ↗</Label></Button></View>
                </ReaderExit>
              </Animated.View>
            </View>
          </View>
        </Animated.ScrollView>
      </Animated.View>
      {embedded&&<Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{position:'absolute',top:0,left:0,width:origin.width,height:origin.height,overflow:'hidden'},sourcePreview]}><Label style={styles.title}>{article.title}</Label>{preview.map((paragraph,index)=><Label key={index} style={{fontSize:size,lineHeight:size*1.47,marginBottom:22}}>{paragraph}</Label>)}</Animated.View>}
      {shuffle&&<Animated.View pointerEvents="none" style={[{position:'absolute',width:SHUFFLE_ICON_SIZE,height:SHUFFLE_ICON_SIZE},iconStyle]}><Animated.View style={[{alignItems:'center',justifyContent:'center'},iconClip]}><ShuffleIcon/></Animated.View></Animated.View>}
      {origin.kind==='home'&&<Animated.View pointerEvents="none" style={[{position:'absolute',bottom:0,left:0,right:0,height:145},returnGradient]}><LinearGradient colors={[(returnPaper||palette.paper)+'00',returnPaper||palette.paper,returnPaper||palette.paper]} locations={[0,.68,1]} style={StyleSheet.absoluteFill}/></Animated.View>}
    </Animated.View>
    {row&&<>
      {!titleLayout&&<View style={{position:'absolute',left:origin.x,top:origin.y+(origin.title?.y??48),width:origin.width-30}}><TitleWords title={article.title} size={25}/></View>}
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',left:24,top:destinationY,width:width-48,opacity:0}}><TitleWords title={article.title} size={36} onGeometry={setTitleLayout}/></View>
      <Animated.View pointerEvents="box-none" style={[{position:'absolute',left:0,right:0,bottom:0,overflow:'hidden'},titleClip,rowHandoff]}><Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill,titleScroll]}>{titleLayout?.words.map((box,i)=><MorphWord key={`${article.id}:${i}`} text={article.title.split(/\s+/)[i]} source={origin.title?.words[i]||box} destination={box} origin={origin} destinationY={destinationY} progress={progress} onReopen={()=>{if(!open)onReopen()}}/>)}</Animated.View></Animated.View>
      <Animated.View pointerEvents="none" style={[{position:'absolute',left:origin.x,top:origin.y+21},metaStyle,rowHandoff]}><Label muted numberOfLines={1} style={{fontSize:12,lineHeight:18}}>{categoryLabel(article.category)}</Label></Animated.View>
    </>}
    <Animated.View pointerEvents={open?'auto':'none'} style={[{position:'absolute',top:0,left:0,right:0,backgroundColor:palette.paper},controls]}><View style={[styles.header,{paddingTop:top}]}><Button label="Chiudi approfondimento" onPress={onClose}><Icon name="arrow-left"/></Button><Label muted style={{flex:1,fontSize:14}}>Articolo</Label><SaveButton saved={saved} onPress={onSave} active={open} reduced={motionReduced}/></View></Animated.View>
  </Animated.View>;
}
function MorphWord({text,source,destination,origin,destinationY,progress,onReopen}:{text:string;source:{x:number;y:number};destination:{x:number;y:number;width:number};origin:Origin;destinationY:number;progress:SharedValue<number>;onReopen:()=>void}){
  const animated=useAnimatedStyle(()=>{const p=Math.max(0,Math.min(1,progress.value)),q=phase(p,.22,.77),sourceX=origin.x+(origin.title?.x||0)+source.x,sourceY=origin.y+(origin.title?.y??48)+source.y;
    return {left:sourceX+(24+destination.x-sourceX)*q,top:sourceY+(destinationY+destination.y-sourceY)*phase(p,0,1)-phase(p,.88,1)*(destinationY-16),fontSize:25+11*q,lineHeight:29+11*q,letterSpacing:-.5-.2*q};
  });
  return <Label accessible={false} onPress={onReopen} style={[styles.morph,{width:destination.width+4},animated]}>{text}</Label>;
}
const styles=StyleSheet.create({surface:{position:'absolute',overflow:'hidden'},header:{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:24,paddingBottom:8},title:{...typography.feed,letterSpacing:-.7,marginBottom:22},morph:{position:'absolute',fontFamily:heading,includeFontPadding:false}});


