import React,{useLayoutEffect,useRef,useState} from 'react';
import {Modal,StyleSheet,View,useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ThemeContext,useTheme} from '../Atoms';
import {Reader} from '../Reader';
import type {OpenArticle,Origin} from '../Feed';
import {DEMO_CARDS} from '../../content/onboarding';
import type {Article} from '../../content/types';
import type {MotionEnvironment} from '../../content/onboardingPresentation';
import type {OnboardingBinding} from '../../useOnboarding';
import {TutorialFeed,type TutorialFeedHandle} from './TutorialFeed';
// Demo interactions never mutate the real library or train personalization.
const details=[
 'Le aurore nascono dall’incontro tra le particelle cariche del vento solare e i gas dell’atmosfera terrestre. Il campo magnetico guida queste particelle verso le regioni polari.\n\nL’ossigeno può produrre luce verde o rossa; l’azoto aggiunge sfumature blu e viola. Ogni colore racconta qualcosa dell’altitudine e dell’energia di questo incontro.',
 'L’origami è l’arte di piegare la carta. Partendo da un foglio si possono costruire figure, animali e strutture geometriche senza tagli né colla.\n\nUna sequenza semplice di pieghe può dare vita a una forma sorprendente.',
 'La bioluminescenza è luce prodotta da organismi viventi attraverso reazioni chimiche. È presente nelle lucciole, in molti animali marini e in alcuni funghi.\n\nPuò aiutare a comunicare, attirare prede o confondere un predatore.',
];
const articles:Article[]=DEMO_CARDS.map((a,i)=>({id:a.id,title:a.title,category:a.category==='Arte'?'arts':'science',preview:[a.preview],paragraphs:[a.preview,...details[i].split('\n\n')],source:'https://it.wikipedia.org/wiki/'+encodeURIComponent(a.title.replaceAll(' ','_')),fetchedAt:0,complete:true}));
export interface TutorialStageProps{binding:OnboardingBinding;motion:MotionEnvironment;onIndex?:(index:number)=>void;commandedPage?:{index:number;revision:number}}
export function TutorialStage({binding:b,motion,onIndex,commandedPage}:TutorialStageProps){
 const theme=useTheme(),{palette}=theme,insets=useSafeAreaInsets(),window=useWindowDimensions();
 const paper=palette.paper==='#1d1b19'?'#272320':'#f1ede6',saved=useRef(new Set<string>()),feed=useRef<TutorialFeedHandle>(null);
 const [reader,setReader]=useState<{article:Article;origin:Origin}|null>(null),[readerOpen,setReaderOpen]=useState(false),[readerSize,setReaderSize]=useState({width:window.width,height:window.height});
 const [activeIndex,setActiveIndex]=useState(Math.min(2,b.tutorialIndex)),navigation=useRef(b.tutorialNavigationRevision);
 useLayoutEffect(()=>{if(navigation.current!==b.tutorialNavigationRevision){navigation.current=b.tutorialNavigationRevision;feed.current?.goTo(Math.min(2,b.tutorialIndex))}},[b.tutorialNavigationRevision,b.tutorialIndex]);
 useLayoutEffect(()=>{if(commandedPage?.revision)feed.current?.goTo(commandedPage.index)},[commandedPage?.revision]);
 const save=(a:Article,only=false)=>{if(only||!saved.current.has(a.id))saved.current.add(a.id);else saved.current.delete(a.id);b.interactDemo(d=>{d.saved=saved.current.size>0})};
 const open:OpenArticle=(article,node,kind,title)=>{const show=(x:number,y:number,width:number,height:number)=>{b.interactDemo(d=>{d.opened=true});setReader({article,origin:{x,y,width,height,kind,title}});setReaderOpen(true)};if(node)node.measureInWindow(show);else show(40,insets.top+280,window.width-80,300)};
 const close=()=>{setReaderOpen(false);b.interactDemo(d=>{d.opened=false})};
 const report=(n:number)=>{setActiveIndex(n);onIndex?.(n);b.seekTutorial(n)};
 const reduced=motion.reduced||!motion.appActive;
 return <View testID="tutorial-home" style={{flex:1}}>
  <ThemeContext.Provider value={{...theme,palette:{...palette,paper}}}><TutorialFeed ref={feed} initialIndex={activeIndex} articles={articles} saved={saved.current} cardInsets={[0,0,0]} bottomInset={0} readerOpen={readerOpen} covered={reader?.article.id} blocked={!!reader} motion={motion} onOpen={open} onSave={save} onIndex={report} onInteract={()=>b.interactDemo(()=>{})} onEndReached={()=>{if(activeIndex===articles.length-1&&!reader&&!b.busy&&motion.visible&&motion.appActive)b.navigate('skip')}}/></ThemeContext.Provider>
  <Modal visible={!!reader} transparent statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={close}><View pointerEvents="box-none" style={StyleSheet.absoluteFill} onLayout={e=>setReaderSize(e.nativeEvent.layout)}>{reader&&<Reader article={reader.article} origin={reader.origin} open={readerOpen} width={readerSize.width} height={readerSize.height} top={insets.top} bottom={insets.bottom} size={20} saved={saved.current.has(reader.article.id)} onClose={close} onReopen={()=>setReaderOpen(true)} onClosed={()=>setReader(null)} onSave={()=>save(reader.article)} onDoubleTapSave={()=>save(reader.article,true)} returnPaper={paper} reducedOverride={reduced}/>}</View></Modal>
 </View>;
}
