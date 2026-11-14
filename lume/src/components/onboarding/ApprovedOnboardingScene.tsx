import {surfaceTones} from '../../theme';
import React,{useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Keyboard,Platform,Pressable,ScrollView,StyleSheet,View,useWindowDimensions} from 'react-native';
import Animated,{cancelAnimation,Easing,interpolate,interpolateColor,runOnJS,useAnimatedProps,useAnimatedStyle,useDerivedValue,useSharedValue,withDelay,withSequence,withTiming} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg,{Path,SvgXml} from 'react-native-svg';
import {Button,Icon,Label,useTheme} from '../Atoms';
import {OnboardingTitleContext,OnboardingTitleSlot,OrganicShapeSlot,type TitleSession} from '../OnboardingMotionSlots';
import {onboardingBrand} from '../../content/onboardingBrand';
import {STAGES,TUTORIAL} from '../../content/onboarding';
import type {OnboardingBinding} from '../../useOnboarding';
import type {MotionEnvironment} from '../../content/onboardingPresentation';
import {useKeyboardLift} from '../../useKeyboardLift';
import {IdentityStage} from './IdentityStage';
import {InterestsStage} from './InterestsStage';
import {TutorialStage} from './TutorialStage';
import {TutorialDock} from './TutorialDock';
import {MaterialLoadingIndicator} from './MaterialLoadingIndicator';
import {InterestScrollMask} from './InterestScrollMask';

const AnimatedPath=Animated.createAnimatedComponent(Path);
const ease=Easing.bezier(.22,1,.36,1);
function clamp(n:number){'worklet';return Math.max(0,Math.min(1,n))}
function presence(f:number,n:number){'worklet';return clamp(1-Math.abs(f-n))}
function phase(n:number,a:number,b:number){'worklet';const t=clamp((n-a)/(b-a));return t*t*(3-2*t)}
function value(f:number,values:number[]){'worklet';return interpolate(f,[0,1,2,3,4],values,'clamp')}
type FrozenShape={path:string;rotation:number};

/** One persistent scene: only surfaces move, never the layout of text inside them. */
export function ApprovedOnboardingScene({binding:b}:{binding:OnboardingBinding}){
 const {palette}=useTheme(),window=useWindowDimensions(),insets=useSafeAreaInsets();
 const [size,setSize]=useState({width:window.width,height:window.height}),[index,setIndex]=useState(Math.min(2,b.tutorialIndex));
 const [titleHeight,setTitleHeight]=useState(86),[copyHeight,setCopyHeight]=useState(50);
 const [introTitleWidth,setIntroTitleWidth]=useState(180);
 const measureIntro=useCallback((text:string,lines:{width:number}[])=>{if(text==='Benvenuto!'&&lines[0])setIntroTitleWidth(lines[0].width)},[]);
 const [introReady,setIntroReady]=useState(b.reduced);
 const [commandedPage,setCommandedPage]=useState({index:Math.min(2,b.tutorialIndex),revision:0});
 const target=Math.min(4,STAGES.indexOf(b.stage||'intro')),tutorial=b.stage==='tutorial',identity=b.stage==='identity',preparing=b.stage==='preparation';
 const title=target===0?'Benvenuto!':target<3?'Parlami un po’ di te':target===3?TUTORIAL[index].title:'Sto preparando tutto per te…';
 const titleKey=target<3&&target>0?'about-you':`${target}:${index}`;
 const [tutorialMounted,setTutorialMounted]=useState(tutorial),[presented,setPresented]=useState(preparing),[frozen,setFrozen]=useState<FrozenShape|null>(null);
 const scene=useSharedValue(target),zoom=useSharedValue(0),intro=useSharedValue(b.reduced?1:0),position=useSharedValue(index);
 const bounce=useSharedValue(0),hintOffset=useSharedValue(91);
 const identityScroll=useRef<ScrollView>(null),nameFocused=useRef(false);
 const revealName=()=>{if(nameFocused.current)identityScroll.current?.scrollToEnd({animated:false})};
 const rawKeyboard=useKeyboardLift(),keyboardSession=useSharedValue(false),session=useRef<TitleSession>({title,key:titleKey,animating:false}),completion=useRef(false),live=useRef(b);live.current=b;
 const {width:w,height:h}=size,footer=h-Math.max(79,insets.bottom+45),snippetTop=window.fontScale>1.15?Math.max(280,113+titleHeight+5+copyHeight+24):280,snippetHeight=Math.min(420,Math.max(180,h-snippetTop-142)),snippetWidth=w-32,identityTop=window.fontScale>1.15?Math.max(Math.min(310,h*.35),117+titleHeight+5+copyHeight+24):Math.min(310,h*.35),interestsTop=window.fontScale>1.15?Math.max(272,117+titleHeight+5+copyHeight+24):272,loaderY=window.fontScale>1.15?Math.max(h*.47,80+titleHeight+5+copyHeight+70):h*.47;
 const snippetPaper=surfaceTones(palette).snippet;
 const [fallback,setFallback]=useState(false);
 const active=b.appActive,reduced=b.reduced,busy=b.busy||!active,ready=preparing&&presented&&(b.preparation.kind==='ready'||fallback);
 // Android's picker may hide the IME without its closing-animation callback,
 // leaving native animated height/state stale. Focus restoration is not input:
 // arm from a real input press or RN's independent keyboard visibility event.
 const allowKeyboard=active&&!b.photoBusy;
 useEffect(()=>{
  const shown=Keyboard.addListener('keyboardDidShow',event=>{if(live.current.appActive&&!live.current.photoBusy&&event.endCoordinates.height>0)keyboardSession.value=true});
  const hidden=Keyboard.addListener('keyboardDidHide',()=>{keyboardSession.value=false});
  return()=>{shown.remove();hidden.remove()};
 },[]);
 const keyboard=useDerivedValue(()=>allowKeyboard&&keyboardSession.value?rawKeyboard.value:0);
 useLayoutEffect(()=>{if(!allowKeyboard){keyboardSession.value=false;nameFocused.current=false;identityScroll.current?.scrollTo({y:0,animated:false})}},[allowKeyboard]);
 const motion:MotionEnvironment={reduced,appActive:active,visible:b.active};
 const complete=useCallback(()=>{completion.current=true;live.current.navigate('enter')},[]);
 useLayoutEffect(()=>{
  Keyboard.dismiss();cancelAnimation(scene);
  if(target===3)setTutorialMounted(true);
  if(target!==4){setPresented(false);setFrozen(null);completion.current=false;cancelAnimation(zoom);zoom.value=0}
  const settled=()=>{if(target===4){setPresented(true);live.current.presentPreparation()}};
  if(reduced||!active){scene.value=target;settled()}
  else scene.value=withTiming(target,{duration:760,easing:ease},done=>{if(done)runOnJS(settled)()});
  return()=>cancelAnimation(scene);
 },[target,reduced,active]);
 useEffect(()=>{cancelAnimation(intro);if(reduced){intro.value=1;setIntroReady(true)}else if(active)intro.value=withDelay(120,withTiming(1,{duration:260,easing:ease},done=>{if(done)runOnJS(setIntroReady)(true)}));return()=>cancelAnimation(intro)},[reduced,active]);
 useEffect(()=>{position.value=reduced?index:withTiming(index,{duration:320,easing:ease})},[index,reduced]);
 useEffect(()=>{
  cancelAnimation(zoom);
  if(!preparing||!frozen||!active||completion.current)return;
  if(reduced){zoom.value=1;complete()}
  else zoom.value=withTiming(1,{duration:1050*(1-zoom.value),easing:Easing.bezier(.4,0,.2,1)},done=>{if(done)runOnJS(complete)()});
  return()=>cancelAnimation(zoom);
 },[frozen,preparing,active,reduced,complete]);
 useEffect(()=>{if(b.error&&completion.current){cancelAnimation(zoom);zoom.value=0;completion.current=false}},[b.error]);
 useEffect(()=>{if(!active||reduced){cancelAnimation(bounce);bounce.value=0}return()=>cancelAnimation(bounce)},[active,reduced]);
 const acceptFreeze=useCallback((shape:FrozenShape)=>setFrozen(shape),[]);
 const updateIndex=useCallback((n:number)=>setIndex(n),[]);
 const shell=useAnimatedStyle(()=>({opacity:1-phase(zoom.value,.86,1),backgroundColor:palette.paper}));
 const background=useAnimatedStyle(()=>({opacity:value(scene.value,[0,0,.22,.035,.22])*(1-phase(zoom.value,0,.28))}));
 const brandStyle=useAnimatedStyle(()=>({opacity:presence(scene.value,0)*intro.value,transform:[{translateY:-scene.value*h*.65},{scale:.94+.06*intro.value}]}));
 const titleStyle=useAnimatedStyle(()=>({top:value(scene.value,[h*.49,117,117,113,80]),opacity:(1-phase(zoom.value,0,.28))*(1-presence(scene.value,1)*clamp(keyboard.value/120))}));
 const titleAlign=useAnimatedStyle(()=>({transform:[{translateX:presence(scene.value,0)*(w-48-introTitleWidth)/2}]}));
 useEffect(()=>{cancelAnimation(hintOffset);const offset=target===0?(window.fontScale>1.15?titleHeight+16:66):titleHeight+5;hintOffset.value=reduced||!active?offset:withTiming(offset,{duration:320,easing:ease});return()=>cancelAnimation(hintOffset)},[titleHeight,target,window.fontScale,reduced,active]);
 const hintStyle=useAnimatedStyle(()=>({top:hintOffset.value}));
 const identityStyle=useAnimatedStyle(()=>{const lift=keyboard.value*presence(scene.value,1),end=Math.min(h-142,footer-lift-45);return{top:Math.min(interpolate(lift,[0,180],[identityTop,160],'clamp'),Math.max(insets.top+56,end-96)),bottom:h-end,opacity:presence(scene.value,1),transform:[{translateY:(scene.value-1)*-64}]}});
 const interestsStyle=useAnimatedStyle(()=>({opacity:scene.value>2?clamp(1-(scene.value-2)/.4):presence(scene.value,2),transform:[{translateY:(scene.value-2)*-78}]}));
 const snippet=useAnimatedStyle(()=>{
  const entry=clamp(scene.value-2),fold=clamp(scene.value-3),width=scene.value<3?104+(snippetWidth-104)*entry:snippetWidth+(104-snippetWidth)*fold,height=scene.value<3?24+(snippetHeight-24)*entry:snippetHeight+(104-snippetHeight)*fold;
  return {left:(w-width)/2,top:scene.value<3?snippetTop+(snippetHeight-height)/2:snippetTop+(loaderY-52-snippetTop)*fold,width,height,borderRadius:scene.value<3?72-44*entry:28+24*fold,opacity:scene.value<3?entry:clamp((1-fold)/.32)};
 });
 const snippetContent=useAnimatedStyle(()=>{const width=value(scene.value,[104,104,104,snippetWidth,104]);return{left:(width-snippetWidth)/2,opacity:1-phase(scene.value,3,3.55)}});
 const dockStyle=useAnimatedStyle(()=>({left:value(scene.value,[w/2,w/2,w/2,24,w/2]),top:footer-32,width:value(scene.value,[0,0,0,w-114,0]),opacity:presence(scene.value,3)}));
 const backStyle=useAnimatedStyle(()=>({left:value(scene.value,[-84,24,24,24,-84]),top:value(scene.value,[56,56,56,51,51]),opacity:zoom.value?0:1}));
 const skipStyle=useAnimatedStyle(()=>({opacity:presence(scene.value,1),left:value(scene.value,[w+40,w/2+34-41,w+40,w+40,w+40]),top:footer-29-keyboard.value*presence(scene.value,1)}));
 const action=useAnimatedStyle(()=>{const f=scene.value,s=value(f,[52,52,52,58,104]),x=value(f,[w/2,w/2-49,w/2,w-53,w/2]),y=value(f,[footer,footer,footer,footer,loaderY]);return{left:x-s/2,top:y-s/2-keyboard.value*presence(scene.value,1),width:s,height:s,opacity:scene.value<.5?intro.value:1}});
 const bounceStyle=useAnimatedStyle(()=>({transform:[{translateY:bounce.value}]}));
 const actionFace=useAnimatedStyle(()=>({opacity:1-clamp(scene.value-3),transform:[{scale:value(scene.value,[1,1,1,58/52,2])}]}));
 const loaderStyle=useAnimatedStyle(()=>({opacity:clamp(scene.value-3)*(frozen?0:1),transform:[{scale:value(scene.value,[52,52,52,58,104])/104}]}));
 const prepCopy=useAnimatedStyle(()=>({opacity:presence(scene.value,4)*(1-phase(zoom.value,0,.28)),transform:[{translateY:50*(1-presence(scene.value,4))}]}));
 const expansion=useAnimatedStyle(()=>{const d=Math.hypot(w,h)*3,s=(104+(d-104)*zoom.value*zoom.value)/104;return{opacity:frozen?1:0,backgroundColor:'transparent',transform:[{scale:s}]}});
 const expansionProps=useAnimatedProps(()=>({fill:interpolateColor(phase(zoom.value,.6,1),[0,1],[palette.active,palette.paper])}));
 const hint=target===0?'':target===1?'Come ti chiami? Nome e foto sono facoltativi e rimangono sul dispositivo.':target===2?'Scegli gli argomenti che ti incuriosiscono. Puoi continuare anche senza selezionarne.':target===3?TUTORIAL[index].body:'Un momento, le prime scoperte stanno arrivando.';
 const brand=onboardingBrand(palette.ink,palette.paper);
 if(!b.state||b.bootError)return <View style={[styles.boot,{backgroundColor:palette.paper}]}><Label accessibilityLiveRegion="polite">{b.bootError||'Apro la configurazione sul telefono…'}</Label>{!!b.bootError&&<Button label="Riprova" onPress={()=>void b.retryBoot()}><Label>Riprova</Label></Button>}</View>;
 return <OnboardingTitleContext.Provider value={session}><Animated.View testID="approved-onboarding" onLayout={e=>setSize(e.nativeEvent.layout)} style={[StyleSheet.absoluteFill,{overflow:'hidden'},shell]}>
  <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill,background]}><OrganicShapeSlot kind="flower" size={450} motion={{...motion,visible:target>=2}} style={{position:'absolute',left:-190,top:-180}}/><OrganicShapeSlot kind="soft-boom" size={320} motion={{...motion,visible:target>=2}} style={{position:'absolute',right:-90,bottom:-65}}/></Animated.View>
  <Animated.View pointerEvents="none" style={[{position:'absolute',top:h*.29,left:w/2-59,width:118,height:118,alignItems:'center'},brandStyle]}><SvgXml xml={brand.logo} width={118} height={118} accessible={false}/></Animated.View>
  <Animated.View pointerEvents="none" style={[{position:'absolute',left:24,right:24,zIndex:5},titleStyle]}><Animated.View style={titleAlign}><OnboardingTitleSlot title={title} titleKey={titleKey} motion={motion} center={false} onTitleMeasure={measureIntro} onPaintHeight={setTitleHeight} minLines={1} initialReveal={target===0}/></Animated.View><Animated.View style={[{position:'absolute',left:0,right:0},hintStyle]}><OnboardingCopy text={hint} color={target===3?palette.ink:palette.muted} center={target===0} motion={motion} onHeight={setCopyHeight}/></Animated.View></Animated.View>
  <Animated.View pointerEvents={identity?'auto':'none'} accessibilityElementsHidden={!identity} importantForAccessibility={identity?'auto':'no-hide-descendants'} style={[{position:'absolute',left:24,right:24,top:Math.min(310,h*.35),bottom:142},identityStyle]}><ScrollView ref={identityScroll} onLayout={revealName} onContentSizeChange={revealName} keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:24}}><IdentityStage onNamePress={()=>{if(allowKeyboard)keyboardSession.value=true}} onNameFocus={focused=>{nameFocused.current=focused;revealName()}} binding={b} motion={{...motion,visible:identity}} usableHeight={h-insets.top-insets.bottom} fontScale={window.fontScale} embedded/></ScrollView></Animated.View>
  <Animated.View pointerEvents={target===2?'auto':'none'} accessibilityElementsHidden={target!==2} importantForAccessibility={target===2?'auto':'no-hide-descendants'} style={[{position:'absolute',left:24,right:24,top:interestsTop,bottom:165},interestsStyle]}><InterestScrollMask visible={target===2}><InterestsStage binding={b} motion={{...motion,visible:target===2}} embedded/></InterestScrollMask></Animated.View>
  <Animated.View testID="tutorial-snippet" pointerEvents={tutorial?'auto':'none'} accessibilityElementsHidden={!tutorial} importantForAccessibility={tutorial?'auto':'no-hide-descendants'} style={[{position:'absolute',overflow:'hidden',backgroundColor:snippetPaper,shadowColor:'#000',shadowOffset:{width:0,height:5},shadowOpacity:.125,shadowRadius:13,elevation:2,borderWidth:StyleSheet.hairlineWidth,borderColor:palette.line},snippet]}><Animated.View style={[{position:'absolute',top:0,width:snippetWidth,height:snippetHeight},snippetContent]}>{tutorialMounted&&<TutorialStage binding={b} motion={{...motion,visible:tutorial}} onIndex={updateIndex} commandedPage={commandedPage}/>}</Animated.View></Animated.View>
  <Animated.View pointerEvents={tutorial?'auto':'none'} accessibilityElementsHidden={!tutorial} importantForAccessibility={tutorial?'auto':'no-hide-descendants'} style={[{position:'absolute',height:64,overflow:'hidden',borderRadius:32,backgroundColor:palette.surface},dockStyle]}><TutorialDock index={index} position={position} reduced={reduced} disabled={busy} onSelect={n=>setCommandedPage(old=>({index:n,revision:old.revision+1}))} width={w-114}/></Animated.View>
  <Animated.View pointerEvents={target>0&&target<4?'auto':'none'} accessibilityElementsHidden={target===0||target===4} importantForAccessibility={target===0||target===4?'no-hide-descendants':'auto'} style={[{position:'absolute',width:48,height:48,zIndex:15},backStyle]}><Button label={tutorial?'Torna alla personalizzazione':'Indietro'} disabled={busy} onPress={()=>b.navigate('back')}><Icon name="arrow-left" size={26}/></Button></Animated.View>
  <Animated.View pointerEvents={identity?'auto':'none'} accessibilityElementsHidden={!identity} importantForAccessibility={identity?'auto':'no-hide-descendants'} style={[{position:'absolute',width:82,height:58,borderRadius:29,backgroundColor:palette.surface,zIndex:14},skipStyle]}><Button label="Salta nome e foto" disabled={busy} onPress={()=>b.navigate('skip')} style={{flex:1}}><Label muted>Salta</Label></Button></Animated.View>
  <Animated.View testID="onboarding-persistent-action" pointerEvents={preparing?'none':'auto'} accessibilityElementsHidden={preparing} importantForAccessibility={preparing?'no-hide-descendants':'auto'} style={[{position:'absolute',zIndex:13},action]}><Animated.View style={[StyleSheet.absoluteFill,{alignItems:'center',justifyContent:'center'},actionFace]}><OrganicShapeSlot kind="interests-action" size={52} motion={{...motion,visible:target<4}}/></Animated.View><Animated.View style={[StyleSheet.absoluteFill,{alignItems:'center',justifyContent:'center'},loaderStyle]}><MaterialLoadingIndicator size={104} color={palette.active} active={active&&preparing&&b.preparation.kind==='loading'} reduced={reduced} frozen={ready} onFreeze={acceptFreeze}/></Animated.View>{!preparing&&<Pressable accessibilityRole="button" accessibilityLabel={tutorial?'Salta il tutorial':'Continua'} disabled={busy||target===0&&!introReady} onPressIn={()=>{bounce.value=reduced?0:withTiming(2,{duration:70})}} onPressOut={()=>{bounce.value=reduced?0:withSequence(withTiming(-1,{duration:80}),withTiming(0,{duration:80}))}} onPress={()=>b.navigate(tutorial?'skip':'next')} style={[StyleSheet.absoluteFill,{alignItems:'center',justifyContent:'center',minHeight:48,minWidth:48}]}><Animated.View style={bounceStyle}><Icon name="arrow-right" size={tutorial?22:32}/></Animated.View></Pressable>}</Animated.View>
  <Animated.View pointerEvents={preparing?'auto':'none'} accessibilityElementsHidden={!preparing} importantForAccessibility={preparing?'auto':'no-hide-descendants'} style={[{position:'absolute',left:24,right:24,top:Math.max(h*.63,loaderY+110),alignItems:'center',gap:16},prepCopy]}><Label accessibilityLiveRegion="polite" muted style={{textAlign:'center',fontSize:17,lineHeight:25}}>{b.preparation.message}</Label>{preparing&&b.preparation.canRetry&&<View style={{flexDirection:'row',gap:16}}><Button label="Riprova caricamento" disabled={busy} onPress={b.retryFeed}><Label>Riprova</Label></Button>{b.preparation.canEnter&&<Button label="Continua con gli articoli disponibili" disabled={busy} onPress={()=>setFallback(true)}><Label>Continua</Label></Button>}</View>}{!!b.error&&<><Label style={{color:palette.accent}}>{b.error}</Label><Button label="Riprova ingresso nella Home" onPress={()=>b.navigate('enter')} disabled={busy}><Label>Riprova</Label></Button></>}</Animated.View>
  {!!frozen&&<Animated.View pointerEvents="none" style={[{position:'absolute',left:w/2-52,top:loaderY-52,width:104,height:104,zIndex:20},expansion]}><Svg width={104} height={104} viewBox="0 0 100 100"><AnimatedPath d={frozen.path} animatedProps={expansionProps} transform={`rotate(${frozen.rotation} 50 50)`}/></Svg></Animated.View>}
 </Animated.View></OnboardingTitleContext.Provider>;
}
function OnboardingCopy({text,color,center,motion,onHeight}:{text:string;color:string;center:boolean;motion:MotionEnvironment;onHeight:(height:number)=>void}){
 const previous=useRef({text,center}),[old,setOld]=useState({text:'',center}),progress=useSharedValue(1);
 useLayoutEffect(()=>{if(previous.current.text===text){if(motion.reduced||!motion.appActive)progress.value=1;return}setOld(previous.current);previous.current={text,center};cancelAnimation(progress);progress.value=motion.reduced||!motion.appActive?1:0;if(!motion.reduced&&motion.appActive)progress.value=withTiming(1,{duration:340,easing:ease});return()=>cancelAnimation(progress)},[text,motion.reduced,motion.appActive]);
 const outgoing=useAnimatedStyle(()=>({opacity:1-progress.value,transform:[{translateY:-8*progress.value}]})),incoming=useAnimatedStyle(()=>({opacity:progress.value,transform:[{translateY:8*(1-progress.value)}]}));
 return <View><Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{position:'absolute',left:0,right:0},outgoing]}><Label style={{fontSize:17,lineHeight:25,color,textAlign:old.center?'center':'left'}}>{old.text}</Label></Animated.View><Animated.View style={incoming} onLayout={e=>onHeight(e.nativeEvent.layout.height)}><Label style={{fontSize:17,lineHeight:25,color,textAlign:center?'center':'left'}}>{text}</Label></Animated.View></View>;
}
const styles=StyleSheet.create({boot:{flex:1,padding:24,gap:20,justifyContent:'center'}});
