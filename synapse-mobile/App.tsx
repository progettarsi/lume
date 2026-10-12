import {ProfileMenuRow} from './src/components/ProfileMenuRow';
import {ProfileHeader} from './src/components/ProfileHeader';
import {SearchComposer} from './src/components/SearchComposer';
import 'react-native-gesture-handler';
import React,{useEffect,useLayoutEffect,useRef,useState,useMemo,useCallback} from 'react';
import { ActivityIndicator,AppState,BackHandler,Keyboard,KeyboardAvoidingView,Platform,Pressable,ScrollView,StyleSheet,TextInput,View,useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider,useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated,{FadeInUp,FadeOutDown,useAnimatedStyle,useSharedValue,withSpring,withTiming} from 'react-native-reanimated';
import { useFonts } from 'expo-font';
import { Newsreader_400Regular } from '@expo-google-fonts/newsreader/400Regular';
import { Newsreader_500Medium } from '@expo-google-fonts/newsreader/500Medium';
import { SourceSans3_400Regular } from '@expo-google-fonts/source-sans-3/400Regular';
import { SourceSans3_600SemiBold } from '@expo-google-fonts/source-sans-3/600SemiBold';
import { StatusBar } from 'expo-status-bar';
import {useMotionPreference} from './src/useMotionPreference';
import { useLibrary } from './src/useLibrary';
import {useOnboarding} from './src/useOnboarding';

import {OnboardingScreen,LocalProfileEditor} from './src/components/OnboardingScreen';
import { CATEGORIES } from './src/content/categories';
import { body,heading,light,dark,spring } from './src/theme';
import { Button,Icon,Label,ThemeContext } from './src/components/Atoms';
import {useKeyboardLift} from './src/useKeyboardLift';
import {ArticleList} from './src/components/ArticleList';
import {useReturnRows} from './src/components/useReturnRows';
import { CategoryRail } from './src/components/CategoryRail';
import { Feed,FeedBottomFade,type OpenArticle,type Origin } from './src/components/Feed';
import { Reader } from './src/components/Reader';
import {Dock} from './src/components/Dock';
import {FeedStatus,OfflineNotice} from './src/components/FeedStatus';
import {StatusMessage} from './src/components/StatusMessage';
import {DismissibleNotice} from './src/components/DismissibleNotice';
import {ShuffleButton} from './src/components/ShuffleButton';
import {FeedSpinner} from './src/components/FeedSpinner';
import { getAIKey,putAIKey } from './src/key';

import {rankLocal,continuation,hasRevision} from './src/content/text';
import {articleStatus,aiFailure,type ReaderStatus} from './src/content/readerStatus';
import {captureRef,releaseCapture} from './src/captureTheme';
import {ThemeReveal,type ThemeSnapshot} from './src/components/ThemeReveal';
import type { Article } from './src/content/types';
import {GeminiIntegration,type GeminiConfigurationState} from './src/content/geminiIntegration';
import {GeminiSettings} from './src/components/GeminiSettings';
type Collection='saved'|'history'|'settings'|null;
export default function App(){
  const [fonts,error]=useFonts({Newsreader_400Regular,Newsreader_500Medium,SourceSans3_400Regular,SourceSans3_600SemiBold});
  return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider>{fonts||error?<Synapse/>:<View style={styles.loader}><ActivityIndicator color={light.accent}/></View>}</SafeAreaProvider></GestureHandlerRootView>;
}
function Synapse(){
  const lib=useLibrary(),insets=useSafeAreaInsets(),window=useWindowDimensions(),frame=useRef<View>(null),input=useRef<TextInput>(null),shuffleNode=useRef<View>(null);
  const [viewportHeight,setViewportHeight]=useState(window.height);
  const keyboardLift=useKeyboardLift();
  const width=Math.min(window.width,Platform.OS==='web'?440:window.width),height=viewportHeight,top=insets.top+16,bottom=Math.max(insets.bottom,16),reduced=useMotionPreference();
  const [appActive,setAppActive]=useState(AppState.currentState==='active');
  const onboarding=useOnboarding(lib,reduced,appActive);

  const [editIdentity,setEditIdentity]=useState(false);
  const [settledIndex,setSettledIndex]=useState(0);
  const [route,setRoute]=useState<'home'|'profile'>('home'),[collection,setCollection]=useState<Collection>(null),[searchOpen,setSearchOpen]=useState(false),[category,setCategory]=useState('all'),[index,setIndex]=useState(0);
  const [query,setQuery]=useState(''),[results,setResults]=useState<Article[]>([]),[searchBusy,setSearchBusy]=useState(false),[searchError,setSearchError]=useState(''),[randomBusy,setRandomBusy]=useState(false),[toast,setToast]=useState('');
  const [reader,setReader]=useState<{article:Article;origin:Origin;session:number;context:string}|null>(null),[readerOpen,setReaderOpen]=useState(false),[aiKey,setAIKey]=useState(''),[keyEdited,setKeyEdited]=useState(false);
  const keyRevision=useRef(0),gemini=useRef<GeminiIntegration|null>(null);
  const [geminiState,setGeminiState]=useState<GeminiConfigurationState>({status:'loading',configured:false,enabled:false,busy:true,message:'Carichiamo la configurazione…',actions:[]});
  if(!gemini.current)gemini.current=new GeminiIntegration(getAIKey,putAIKey,(key,enabled)=>lib.configureAI(key,enabled),setGeminiState);
  const [aiStatus,setAIStatus]=useState<{id:string;message:string;busy:boolean;notice?:ReaderStatus}>({id:'',message:'',busy:false}),[feedRevision,setFeedRevision]=useState(0);
  const lastHomeTap=useRef(0);
  const [removedSaved,setRemovedSaved]=useState<{article:Article;token:number}[]>([]),removalToken=useRef(0),removalVersions=useRef(new Map<string,number>());
  useEffect(()=>{const sub=AppState.addEventListener('change',state=>{setAppActive(state==='active');});return()=>sub.remove()},[]);
  const revise=async(full:Article,abort:AbortController,retry=false)=>{
    if(abort.signal.aborted)return;
    setAIStatus({id:full.id,message:'',busy:true,notice:hasRevision(full)?undefined:{kind:'revising',message:'Puoi leggere il testo originale mentre arriva la revisione.'}});
    try{const adapted=await lib.revise(full,abort.signal,retry);if(abort.signal.aborted)return;
      if(adapted)setReader(old=>old?.article.id===full.id?{...old,article:adapted}:old);else lib.finishAIOpen();
      setAIStatus({id:full.id,message:'',busy:false});
    }catch(error){if(abort.signal.aborted)return;lib.finishAIOpen();setAIStatus({id:full.id,message:'',busy:false,notice:aiFailure(error instanceof Error?error.message:'Puoi riprovare tra poco.')})}
  };
  const loadReader=async(article:Article,abort:AbortController,retry=false)=>{
    await lib.full(article,abort.signal).then(async full=>{if(abort.signal.aborted)return;lib.originalReady();setReader(old=>old?.article.id===article.id?{...old,article:full}:old);if(lib.settings.aiEnabled&&full.complete)await revise(full,abort,retry);else {lib.finishAIOpen();setAIStatus({id:article.id,message:'',busy:false,notice:articleStatus(full,full.contentIssueKind==='offline'?false:lib.online)})}}).catch(()=>{if(!abort.signal.aborted)setAIStatus({id:article.id,message:'',busy:false,notice:articleStatus({...article,complete:false},lib.online)})});
  };
  const retryAI=()=>{if(!reader||!readerOpen||aiStatus.busy)return;readerRequest.current?.abort();const abort=new AbortController();readerRequest.current=abort;setAIStatus({id:reader.article.id,message:'',busy:true,notice:{kind:'loading',message:'L’anteprima resta leggibile mentre arriva l’approfondimento.'}});void lib.checkConnection().catch(()=>{}).then(()=>{if(!abort.signal.aborted)void loadReader(reader.article,abort,true)})};
  const persistAIKey=async(notify=false)=>{
    const revision=keyRevision.current,value=aiKey;
    try{await gemini.current!.save(value);if(keyRevision.current===revision){setKeyEdited(false);setAIKey('');lib.updateSettings({aiEnabled:!!value.trim()});if(notify)setToast('Chiave aggiornata')}}
    catch{setToast('Chiave non salvata. Riprova.')}
  };
  const homeHeight=Math.max(0,height-top-132);
  const dockTop=bottom+14+Math.max(60,Math.ceil(18*window.fontScale+28)),fadeHeight=dockTop+90;
  const palette=lib.settings.dark?dark:light,theme=useSharedValue(lib.settings.dark?1:0),page=useSharedValue(0),collectionP=useSharedValue(0),searchP=useSharedValue(0),chips=useSharedValue(0);
  const categoryEntry=useRef(0),desiredTheme=useRef<boolean|null>(null),themeRequest=useRef(0),snapshotRef=useRef<ThemeSnapshot|null>(null);
  const [snapshot,setSnapshot]=useState<ThemeSnapshot|null>(null);
  const randomRequest=useRef<AbortController|null>(null),readerRequest=useRef<AbortController|null>(null),previousIndex=useRef(0);
  const readerSession=useRef(0),activeReader=useRef(reader),activeReaderOpen=useRef(readerOpen);activeReader.current=reader;activeReaderOpen.current=readerOpen;
  const lastCollection=useRef<Exclude<Collection,null>>('saved');if(collection)lastCollection.current=collection;
  const displayCollection=lastCollection.current;
  const liveRows=useMemo(()=>(displayCollection==='saved'?lib.cache.filter(a=>a.saved):lib.history).map(a=>lib.settings.aiEnabled||!a.simplified?a:{...a,simplified:undefined}),[displayCollection,lib.cache,lib.history,lib.settings.aiEnabled]);
  const collectionReturn=useReturnRows(liveRows),searchReturn=useReturnRows(results);
  const saved=useMemo(()=>new Set(lib.cache.filter(a=>a.saved).map(a=>a.id)),[lib.cache]);
  const feedArticles=lib.getFeed(category),visibleArticle=feedArticles[index],feedState=lib.availability[category]??{phase:'idle' as const};
  const [endedCategory,setEndedCategory]=useState(''),[offlineRepeated,setOfflineRepeated]=useState(false);
  const centralFeed=!visibleArticle||(!lib.online&&category!=='all')||(endedCategory===category&&feedState.phase==='exhausted');
  useEffect(()=>{if(lib.online)setOfflineRepeated(false);else if(visibleArticle&&lib.isRepeated(visibleArticle))setOfflineRepeated(true)},[lib.online,visibleArticle?.id,lib.cache]);
  useEffect(()=>{if(feedArticles.length>index+1||feedState.phase==='ready')setEndedCategory('')},[feedArticles.length,index,feedState.phase]);
  useLayoutEffect(()=>{const correction=lib.feedCorrection;if(correction?.category===category){setIndex(correction.position);previousIndex.current=correction.position}},[lib.feedCorrection]);
  useEffect(()=>{if(category==='all')lib.completeCategoryReturn()},[category]);
  const readerArticle=useMemo(()=>reader?(lib.settings.aiEnabled||!reader.article.simplified?reader.article:{...reader.article,simplified:undefined}):undefined,[reader?.article,lib.settings.aiEnabled]);
  useEffect(()=>{gemini.current!.setEnabled(lib.settings.aiEnabled)},[lib.settings.aiEnabled]);
  useEffect(()=>{const eligible=lib.ready&&!!onboarding.state?.completed&&!onboarding.bootError&&!onboarding.active&&appActive&&route==='home'&&!reader&&!searchOpen&&!collection&&settledIndex===index;lib.observeAI(eligible?visibleArticle:undefined,`${category}:${feedRevision}`)},[lib.ready,onboarding.bootError,onboarding.active,onboarding.state?.completed,appActive,route,reader,searchOpen,collection,settledIndex,index,category,feedRevision,visibleArticle?.id,aiKey,keyEdited,lib.settings.aiEnabled,lib.online]);

  useEffect(()=>{if(lib.ready&&!!onboarding.state?.completed&&!onboarding.bootError&&!onboarding.active&&route==='home'&&!reader&&!searchOpen&&!collection&&visibleArticle)void lib.prepare(visibleArticle)},[lib.ready,onboarding.bootError,onboarding.active,onboarding.state?.completed,route,reader,searchOpen,collection,visibleArticle?.id,lib.online]);
  useLayoutEffect(()=>{theme.value=lib.settings.dark?1:0},[lib.settings.dark]);
  const themeContext=useMemo(()=>({palette,progress:theme}),[palette,theme]);
  const paper=useMemo(()=>({backgroundColor:palette.paper}),[palette]);
  const homeStyle=useAnimatedStyle(()=>({transform:[{translateX:-page.value*width}]})),profileStyle=useAnimatedStyle(()=>({transform:[{translateX:(1-page.value)*width}]})),collectionStyle=useAnimatedStyle(()=>({transform:[{translateX:(1-collectionP.value)*width}]})),searchStyle=useAnimatedStyle(()=>({transform:[{translateY:(1-searchP.value)*height}]})),chipStyle=useAnimatedStyle(()=>({transform:[{translateY:-48*Math.max(0,Math.min(1,chips.value))}]})),feedStyle=useAnimatedStyle(()=>({transform:[{translateY:48*(1-Math.max(0,Math.min(1,chips.value)))}]}));
  useEffect(()=>{page.value=reduced?(route==='home'?0:1):withSpring(route==='home'?0:1,spring)},[route,reduced]);
  useEffect(()=>{collectionP.value=reduced?(collection?1:0):withSpring(collection?1:0,spring)},[collection,reduced]);
  useEffect(()=>{searchP.value=reduced?(searchOpen?1:0):withSpring(searchOpen?1:0,spring);if(searchOpen){const timer=setTimeout(()=>input.current?.focus(),30);return()=>clearTimeout(timer)}},[searchOpen,reduced]);
  const composerLift=useAnimatedStyle(()=>({bottom:Math.max(keyboardLift.value+12,bottom+16)})),searchViewport=useAnimatedStyle(()=>({marginBottom:Math.max(keyboardLift.value,0)+100}));
  useEffect(()=>{const enabled=!!onboarding.state&&!onboarding.bootError&&route==='home'&&!searchOpen&&!collection;lib.setDiscovery(enabled);if(lib.ready&&enabled&&!reader)void lib.load(category,index)},[lib.ready,!!onboarding.state,onboarding.bootError,category,index,lib.online,lib.loading,route,searchOpen,collection,reader]);
  useEffect(()=>{void gemini.current!.load()},[]);
  useEffect(()=>{
    const abort=new AbortController();if(!searchOpen)return()=>abort.abort();
    if(!query.trim()){setResults(lib.cache.filter(a=>!a.readAt).slice(0,8));setSearchBusy(false);setSearchError('');return()=>abort.abort()}
    setSearchBusy(true);setSearchError('');setResults(old=>rankLocal(query,old));
    const timer=setTimeout(()=>void lib.search(query,abort.signal).then(items=>{if(!abort.signal.aborted){setResults(items);setSearchBusy(false)}}).catch((error)=>{if(!abort.signal.aborted){if(__DEV__)console.warn('Ricerca Synapse:',error instanceof Error?error.message:String(error));setSearchBusy(false);setSearchError('Ricerca non disponibile. Riprova.')}}),260);
    return()=>{clearTimeout(timer);abort.abort()};
  },[query,searchOpen,lib.online]);
  useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{
    if(!onboarding.state||onboarding.bootError)return true;
    if(onboarding.active){if(Keyboard.isVisible()){Keyboard.dismiss();return true}if(onboarding.busy)return true;if(onboarding.stage==='intro'&&!onboarding.replay)return false;onboarding.navigate('back');return true}
    if(reader){close();return true}if(searchOpen){dismissSearch();return true}if(collection){setCollection(null);return true}if(route==='profile'){setRoute('home');return true}return false;
  });return()=>sub.remove()},[reader,searchOpen,collection,route,onboarding.state,onboarding.bootError,onboarding.active,onboarding.stage,onboarding.replay,onboarding.revision,onboarding.busy]);
  useEffect(()=>()=>{randomRequest.current?.abort();readerRequest.current?.abort()},[]);
  const open:OpenArticle=(article,node,kind,title)=>{
    if(activeReader.current?.article.id===article.id&&!activeReaderOpen.current){reopen();return}
    if(!article.paragraphs.length&&!lib.online){setToast('Articolo non disponibile offline');return}
    Keyboard.dismiss();readerRequest.current?.abort();const abort=new AbortController();readerRequest.current=abort;
    const show=(origin:Origin)=>{if(abort.signal.aborted)return;activeReaderOpen.current=true;
      collectionReturn.finish();searchReturn.finish();
      if(origin.kind==='row'){if(searchOpen)searchReturn.hold(article.id);else if(collection)collectionReturn.hold(article.id)}
      lib.activate(article);setReader({article,origin,session:++readerSession.current,context:`${route}:${collection}:${searchOpen}`});setReaderOpen(true);setAIStatus({id:article.id,message:'',busy:true,notice:{kind:'loading',message:'L’anteprima resta leggibile mentre arriva l’approfondimento.'}});void lib.read(article).catch(()=>setToast('Cronologia non aggiornata'));
      void loadReader(article,abort);
    };
    if(node&&frame.current){frame.current.measureInWindow((fx,fy)=>node.measureInWindow((x,y,w,h)=>{
      const scale=kind==='home'?w/(width-48):1,normalHeight=h/scale;
      show({x:kind==='home'?24:x-fx,y:y-fy-normalHeight/2*(1-scale),width:kind==='home'?width-48:w,height:normalHeight,kind,title});
    }))}
    else show({x:24,y:top+100,width:width-48,height:120,kind});
  };
  const close=()=>{
    lib.abandonAIOpen();
    readerRequest.current?.abort();
    // The opening geometry is already valid. Never wait for a hidden/unmounted source.
    if(reader?.origin.kind==='shuffle')setReader(old=>old?{...old,origin:{...old.origin,y:height-bottom-16-56}}:old);
    activeReaderOpen.current=false;setReaderOpen(false);
  };
  const reopen=()=>{
    if(!reader)return;lib.beginAIOpen();collectionReturn.restore();searchReturn.restore();activeReaderOpen.current=true;setReaderOpen(true);
    if(readerRequest.current?.signal.aborted){const abort=new AbortController();readerRequest.current=abort;setAIStatus({id:reader.article.id,message:'',busy:true,notice:{kind:'loading',message:'L’anteprima resta leggibile mentre arriva l’approfondimento.'}});void loadReader(reader.article,abort)}
  };
  // The measured opening endpoint stays immutable even when storage changes.
  const returnNear=()=>{if(activeReaderOpen.current||activeReader.current?.session!==reader?.session)return;collectionReturn.near();searchReturn.near()};
  const closed=()=>{if(activeReaderOpen.current||activeReader.current?.session!==reader?.session)return;lib.activate();setReader(null);collectionReturn.finish();searchReturn.finish();if(searchOpen)input.current?.focus()};
  const save=(a:Article,only=false)=>{
    removalVersions.current.set(a.id,++removalToken.current);setRemovedSaved(old=>old.filter(e=>e.article.id!==a.id));
    void lib.save(a,only).catch(()=>setToast('Salvataggio non riuscito'));
  };
  const removeSaved=(article:Article)=>{
    const token=++removalToken.current;removalVersions.current.set(article.id,token);
    setRemovedSaved(old=>[...old.filter(e=>e.article.id!==article.id),{article,token}].slice(-32));
    void lib.setSaved(article,false).catch(()=>{if(removalVersions.current.get(article.id)!==token)return;setRemovedSaved(old=>old.filter(e=>e.token!==token));setToast('Rimozione non salvata. Il segnalibro è stato ripristinato.')});
  };
  const undoSaved=()=>{
    const entry=removedSaved.at(-1);if(!entry)return;
    const token=++removalToken.current;removalVersions.current.set(entry.article.id,token);setRemovedSaved(old=>old.filter(e=>e.token!==entry.token));
    void lib.setSaved(entry.article,true).catch(()=>{if(removalVersions.current.get(entry.article.id)!==token)return;if(lib.isSaved(entry.article.id)){setToast('Segnalibro presente; scrittura non confermata.');return}setRemovedSaved(old=>[...old.filter(e=>e.article.id!==entry.article.id),{article:entry.article,token}].slice(-32));setToast('Ripristino non salvato. Puoi riprovare con Annulla.')});
  };
  const random=async()=>{
    randomRequest.current?.abort();const abort=new AbortController();randomRequest.current=abort;setRandomBusy(true);
    try{const article=await lib.random(abort.signal);if(abort.signal.aborted)return;if(article)open(article,shuffleNode.current,'shuffle');else setToast('Nessun articolo disponibile')}
    catch{if(!abort.signal.aborted)setToast('Non è stato possibile aprire un articolo')}
    finally{if(randomRequest.current===abort)setRandomBusy(false)}
  };
  const selectCategory=(id:string)=>{if(id===category||lib.disabledCategory(id))return;setEndedCategory('');lib.enterCategory(id);const ordered=['all',...lib.categoryIds],direction=ordered.indexOf(id)>ordered.indexOf(category)?1:-1;categoryEntry.current=reduced?0:direction*24;setCategory(id);setIndex(0);previousIndex.current=0;chips.value=reduced?0:withSpring(0,spring)};
  const finishTheme=(image:ThemeSnapshot)=>{if(snapshotRef.current?.id!==image.id)return;snapshotRef.current=null;setSnapshot(null);releaseCapture(image.uri)};
  const changeTheme=async()=>{
    const id=++themeRequest.current,next=!(desiredTheme.current??lib.settings.dark);desiredTheme.current=next;
    if(reduced||Platform.OS==='web'||!frame.current){lib.updateSettings({dark:next});return}
    try{
      const uri=await captureRef(frame.current,{format:'png',result:'tmpfile'});
      if(id!==themeRequest.current){releaseCapture(uri);return}
      const previous=snapshotRef.current,image={uri,x:0,y:0,dark:next,id};snapshotRef.current=image;setSnapshot(image);
      if(previous)releaseCapture(previous.uri);
    }catch{if(id===themeRequest.current)lib.updateSettings({dark:next})}
  };
  useEffect(()=>()=>{themeRequest.current++;if(snapshotRef.current)releaseCapture(snapshotRef.current.uri)},[]);
  const dismissSearch=()=>{Keyboard.dismiss();randomRequest.current?.abort();setRandomBusy(false);setSearchOpen(false)};
  const refreshHome=()=>{lib.settleCategories();setEndedCategory('');chips.value=reduced?0:withSpring(0,spring);void lib.refresh(category)};
  const navigate=(next:'home'|'profile')=>{
    const now=Date.now();if(next==='home'&&route==='home'&&!readerOpen&&!collection&&!searchOpen){if(now-lastHomeTap.current<350){lastHomeTap.current=0;refreshHome();return}lastHomeTap.current=now}else lastHomeTap.current=0;
    if(next==='home'&&route!=='home')lib.settleCategories();Keyboard.dismiss();randomRequest.current?.abort();setRandomBusy(false);readerRequest.current?.abort();setSearchOpen(false);setCollection(null);setRoute(next)};
  const sourceRows=collectionReturn.rows,searchRows=searchReturn.rows;
  return <ThemeContext.Provider value={themeContext}><View style={styles.webFrame}><Animated.View ref={frame} collapsable={false} onLayout={e=>setViewportHeight(e.nativeEvent.layout.height)} style={[{width,flex:1,overflow:Platform.OS==='web'?'clip' as 'hidden':'hidden'},paper]}>
    <StatusBar style={lib.settings.dark?'light':'dark'}/>
    {!lib.ready?<View style={styles.loader}><ActivityIndicator color={palette.accent}/><Label>{lib.error}</Label></View>:!onboarding.state||onboarding.bootError?<OnboardingScreen key={onboarding.devSandbox?'sandbox':onboarding.replay?'replay':'onboarding'} binding={onboarding}/>:<>
      <View pointerEvents={onboarding.active?'none':'box-none'} accessibilityElementsHidden={onboarding.active} importantForAccessibility={onboarding.active?'no-hide-descendants':'auto'} style={{flex:1}}>
      <Animated.View style={[StyleSheet.absoluteFill,paper,homeStyle]} pointerEvents={route==='home'&&!searchOpen&&!collection&&!readerOpen?'auto':'none'} aria-hidden={route!=='home'||searchOpen||!!collection||readerOpen} accessibilityElementsHidden={route!=='home'||searchOpen||!!collection||readerOpen} importantForAccessibility={route!=='home'||searchOpen||!!collection||readerOpen?'no-hide-descendants':'auto'}>
        <View style={{paddingTop:top+8,paddingHorizontal:24,paddingBottom:10,zIndex:2}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Label style={styles.wordmark}>Synapse</Label></View><View pointerEvents="box-none" style={{height:48,overflow:'hidden'}}><Animated.View style={chipStyle}><CategoryRail selected={category} onSelect={selectCategory} items={lib.categoryRail} onInteractionStart={lib.beginCategoryInteraction} onInteractionEnd={lib.endCategoryInteraction}/></Animated.View></View></View>
        <Animated.View style={[{position:'absolute',top:top+84,left:0,right:0,height:homeHeight},feedStyle]}>{homeHeight>0&&!centralFeed&&<Feed key={`${category}:${feedRevision}`} articles={feedArticles} height={homeHeight} size={lib.settings.size} saved={saved} readerOpen={readerOpen} entry={categoryEntry.current} onOpen={open} onSave={save} covered={reader?.origin.kind==='home'?reader.article.id:undefined} position={index} onIndex={next=>setIndex(lib.trimFeed(category,next))} onEndReached={()=>{if(category!=='all'&&feedState.phase==='exhausted')setEndedCategory(category);else lib.retryFeed()}} onVisible={setSettledIndex} onDirection={hidden=>{chips.value=reduced?(hidden?1:0):withSpring(hidden?1:0,spring)}}/>}</Animated.View>
        {!centralFeed&&<FeedBottomFade height={fadeHeight}/>}
        {lib.loading&&<View pointerEvents="none" style={{position:'absolute',right:24,top:top+19}}><FeedSpinner/></View>}
        {centralFeed&&route==='home'&&!searchOpen&&!collection&&!reader&&<View style={{position:'absolute',top:top+142,bottom:bottom+110,left:0,right:0}}><FeedStatus key={category+':'+(!lib.online?'offline':feedState.phase==='exhausted'?'exhausted':'recover')} central state={feedState} online={lib.online} category={category} active={appActive} homeReady={lib.homeReady()} onHome={()=>selectCategory('all')} onRetry={lib.retryFeed}/></View>}
        {!centralFeed&&lib.online&&['service','limit','unavailable'].includes(feedState.phase)&&<View style={{position:'absolute',bottom:dockTop+6,left:24,right:24,backgroundColor:palette.paper}}><FeedStatus state={feedState} online category={category} active={appActive&&route==='home'} homeReady={lib.homeReady()} onHome={()=>selectCategory('all')} onRetry={lib.retryFeed}/></View>}
        {!lib.online&&<View pointerEvents="none" style={{position:'absolute',bottom:dockTop+6,left:8,right:8}}><OfflineNotice repeated={offlineRepeated}/></View>}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill,paper,profileStyle]} pointerEvents={route==='profile'&&!collection&&!searchOpen&&!readerOpen?'auto':'none'} aria-hidden={route!=='profile'||!!collection||searchOpen||readerOpen} accessibilityElementsHidden={route!=='profile'||!!collection||searchOpen||readerOpen} importantForAccessibility={route!=='profile'||!!collection||searchOpen||readerOpen?'no-hide-descendants':'auto'}>
        <ProfileHeader name={onboarding.state?.profile.name} photoUri={onboarding.state?.profile.photoUri} top={top+12}/>
        <ScrollView contentContainerStyle={{paddingBottom:bottom+110}}><View style={{paddingHorizontal:24}}><Button label="Modifica nome e foto" onPress={()=>setEditIdentity(v=>!v)}><Label>{onboarding.state?.profile.name||'Modifica nome e foto'}</Label></Button>{editIdentity&&<LocalProfileEditor binding={onboarding}/>}</View>
        <View style={{paddingHorizontal:24}}>{([{id:'saved',title:'Articoli salvati',icon:'bookmark-outline',count:lib.cache.filter(a=>a.saved).length},{id:'history',title:'Cronologia',icon:'history',count:lib.history.length},{id:'settings',title:'Impostazioni',icon:'tune',count:undefined}] as const).map(row=><ProfileMenuRow key={row.id} icon={row.icon} title={row.title} count={row.count} onPress={()=>setCollection(row.id)}/>)}</View></ScrollView>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill,paper,collectionStyle]} pointerEvents={collection&&!searchOpen&&!readerOpen?'auto':'none'} aria-hidden={!collection||searchOpen||readerOpen} accessibilityElementsHidden={!collection||searchOpen||readerOpen} importantForAccessibility={!collection||searchOpen||readerOpen?'no-hide-descendants':'auto'}>
        <View style={[styles.headingRow,{paddingTop:top}]}><Button label="Torna al profilo" onPress={()=>{Keyboard.dismiss();setCollection(null)}}><Icon name="arrow-left"/></Button><Label accessibilityRole="header" style={styles.collectionTitle}>{displayCollection==='saved'?'Salvati':displayCollection==='history'?'Cronologia':'Impostazioni'}</Label></View>
        {displayCollection==='settings'?<ScrollView key={displayCollection} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:24,paddingBottom:bottom+110}} keyboardShouldPersistTaps="handled">
          <>
            {__DEV__&&<View><Button label="Anteprima primo avvio" onPress={()=>onboarding.developmentPreview()}><Label>Anteprima primo avvio</Label></Button><Button label="Anteprima ripresa dagli interessi" onPress={()=>onboarding.developmentPreview('interests')}><Label>Anteprima ripresa dagli interessi</Label></Button></View>}
            <Label strong style={{fontSize:18,marginBottom:16}}>Dimensione del testo</Label><View style={{flexDirection:'row',gap:6}}>{[18,20,23].map((n,i)=><Button key={n} label={['Testo piccolo','Testo medio','Testo grande'][i]} onPress={()=>lib.updateSettings({size:n})} style={{flex:1,borderRadius:24,backgroundColor:lib.settings.size===n?palette.active:palette.surface}}><Label style={{color:palette.ink}}>{['Piccolo','Medio','Grande'][i]}</Label></Button>)}</View>
            <Label muted style={{fontSize:lib.settings.size,lineHeight:lib.settings.size*1.5,marginVertical:24}}>Una piccola scoperta può cambiare il modo in cui guardiamo il mondo.</Label>
            <Pressable accessibilityRole="switch" accessibilityState={{checked:lib.settings.dark}} onPress={()=>void changeTheme()} style={[styles.menu,{borderColor:palette.line}]}><Label strong style={{flex:1,fontSize:19}}>Tema scuro</Label><Icon name={lib.settings.dark?'toggle-switch':'toggle-switch-off-outline'} size={42}/></Pressable>
            <GeminiSettings
              state={geminiState}
              aiKey={aiKey}
              keyEdited={keyEdited}
              onChangeKey={v=>{keyRevision.current++;setAIKey(v);setKeyEdited(true)}}
              onSaveKey={()=>void persistAIKey(true)}
              onRemoveKey={()=>{keyRevision.current++;void gemini.current!.remove().then(()=>{setAIKey('');setKeyEdited(false);lib.updateSettings({aiEnabled:false})}).catch(()=>setToast('Chiave non rimossa. Riprova.'))}}
              aiEnabled={lib.settings.aiEnabled}
              onToggleEnabled={enabled=>lib.updateSettings({aiEnabled:enabled})}
            />
          </>
        </ScrollView>:<ArticleList key={displayCollection} removalEnabled={!reader} onRemove={displayCollection==='saved'?removeSaved:undefined} articles={sourceRows} onOpen={open} hiddenId={collectionReturn.released?undefined:reader?.article.id} returnId={reader?.article.id} animate={collectionReturn.animate} bottomPadding={bottom+110} empty={<View style={{paddingTop:42}}><Label style={{fontFamily:heading,fontSize:28}}>{displayCollection==='saved'?'Le tue prossime riletture':'Le tue scoperte, qui'}</Label></View>}/>}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill,paper,searchStyle]} pointerEvents={searchOpen&&!readerOpen?'auto':'none'} aria-hidden={!searchOpen||readerOpen} accessibilityElementsHidden={!searchOpen||readerOpen} importantForAccessibility={!searchOpen||readerOpen?'no-hide-descendants':'auto'}>
        <Label accessibilityRole="header" style={[styles.pageTitle,{paddingTop:top+12}]}>Cerca</Label>
        <Animated.View style={[{flex:1},searchViewport]}><ArticleList articles={searchRows} onOpen={open} hiddenId={searchReturn.released?undefined:reader?.article.id} returnId={reader?.article.id} animate={searchReturn.animate} bottomPadding={24} footer={<>{searchBusy&&<StatusMessage compact status={{kind:'loading',message:'Cerco gli articoli pertinenti…'}}/>}{!!searchError&&<StatusMessage compact status={{kind:'network',message:searchError}}/>}{!searchBusy&&!searchError&&!!query.trim()&&!searchRows.length&&<Label muted style={{paddingVertical:24}}>Nessun articolo trovato.</Label>}</>}/></Animated.View>
        <Animated.View style={[{position:'absolute',left:0,right:0,backgroundColor:palette.paper,paddingHorizontal:24,paddingTop:12,flexDirection:'row',gap:10},composerLift]}>
          <SearchComposer inputRef={input} value={query} onChange={setQuery} onClose={dismissSearch}/>
          <View ref={shuffleNode} collapsable={false} style={{width:56,height:56,borderRadius:28,backgroundColor:palette.active}}><ShuffleButton busy={randomBusy} onPress={()=>void random()}/></View>
        </Animated.View>
      </Animated.View>
      {!searchOpen&&<Dock selected={route} onNavigate={navigate} onSearch={()=>{setSearchOpen(true);input.current?.focus()}} bottom={bottom} availableWidth={width-32} disabled={readerOpen} closing={!!reader&&!readerOpen}/>}
      {reader&&<Reader key={reader.session} article={readerArticle!} aiMessage={aiStatus.id===reader.article.id?aiStatus.message:''} aiBusy={aiStatus.busy} onRetryAI={lib.settings.aiEnabled?retryAI:undefined} onRetryArticle={retryAI} notice={aiStatus.id===reader.article.id?aiStatus.notice:undefined} origin={reader.origin} open={readerOpen} width={width} height={height} top={top} bottom={bottom} size={lib.settings.size} saved={saved.has(reader.article.id)} onClose={close} onReopen={reopen} onClosed={closed} onReturnNear={returnNear} returnDetached={collectionReturn.changed||searchReturn.changed||reader.context!==`${route}:${collection}:${searchOpen}`||reader.origin.kind==='home'&&visibleArticle?.id!==reader.article.id} onSave={()=>save(reader.article)}/>}
      {snapshot&&<ThemeReveal key={snapshot.id} snapshot={snapshot} width={width} height={height} topInset={insets.top} onReady={()=>{if(snapshotRef.current?.id===snapshot.id)lib.updateSettings({dark:snapshot.dark})}} onDone={()=>finishTheme(snapshot)}/>}
      {removedSaved.length>0&&collection==='saved'&&!reader&&<Animated.View entering={reduced?undefined:FadeInUp.duration(180)} exiting={reduced?undefined:FadeOutDown.duration(150)} accessibilityLiveRegion="polite" style={[styles.toast,{bottom:bottom+94,left:24,right:24,backgroundColor:palette.surface,borderRadius:18,flexDirection:'row',alignItems:'center',gap:8}]}><Label style={{flex:1,fontSize:14}}>{removedSaved.length===1?'Segnalibro rimosso':`${removedSaved.length} segnalibri rimossi`}</Label><Pressable accessibilityRole="button" accessibilityLabel="Annulla ultima rimozione dai salvati" onPress={undoSaved} style={{padding:12,minHeight:48}}><Label strong>Annulla</Label></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Chiudi avviso di rimozione" onPress={()=>setRemovedSaved([])} style={{minWidth:48,minHeight:48,alignItems:'center',justifyContent:'center'}}><Icon name="close" size={18}/></Pressable></Animated.View>}
      {!!toast&&<DismissibleNotice key={toast} reduced={reduced} closeColor={palette.paper} onDismiss={()=>setToast(current=>current===toast?'':current)} style={[styles.toast,{bottom:bottom+174,backgroundColor:palette.ink}]}><Label style={{color:palette.paper,fontSize:15,paddingRight:42,minHeight:48,textAlignVertical:'center'}}>{toast}</Label></DismissibleNotice>}
      </View>
      {onboarding.active&&<View style={[StyleSheet.absoluteFill,{zIndex:200}]}><OnboardingScreen key={onboarding.devSandbox?'sandbox':onboarding.replay?'replay':'onboarding'} binding={onboarding}/></View>}
    </>}
  </Animated.View></View></ThemeContext.Provider>;
}
const styles=StyleSheet.create({loader:{flex:1,backgroundColor:light.paper,justifyContent:'center',alignItems:'center',gap:16},webFrame:{flex:1,alignItems:'center',backgroundColor:'#ece9e3'},wordmark:{fontFamily:'Newsreader_400Regular',fontSize:41,lineHeight:46,letterSpacing:-1.3,marginBottom:20},pageTitle:{fontFamily:heading,fontSize:38,lineHeight:42,letterSpacing:-.9,paddingHorizontal:24,paddingBottom:25},menu:{minHeight:82,flexDirection:'row',alignItems:'center',gap:15,borderBottomWidth:StyleSheet.hairlineWidth},headingRow:{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:20,paddingBottom:20},collectionTitle:{fontFamily:heading,fontSize:34,lineHeight:38,letterSpacing:-.8},input:{fontFamily:body,fontSize:18,padding:16,borderRadius:20},composer:{flex:1,minWidth:0,height:56,borderRadius:28,flexDirection:'row',alignItems:'center',paddingRight:12},toast:{position:'absolute',alignSelf:'center',paddingHorizontal:18,paddingVertical:10,borderRadius:24,zIndex:90}});





