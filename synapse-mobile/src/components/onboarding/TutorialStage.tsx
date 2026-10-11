import React,{useRef,useState} from 'react';
import {AccessibilityInfo,Modal,View,StyleSheet,useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Label,Button,useTheme} from '../Atoms';
import {FeedCard,type OpenArticle,type Origin} from '../Feed';
import {CategoryRail} from '../CategoryRail';
import {Dock} from '../Dock';
import {Reader} from '../Reader';
import {ArticleRow} from '../ArticleRow';
import {ProfileMenuRow} from '../ProfileMenuRow';
import {SearchComposer} from '../SearchComposer';
import {ShuffleButton} from '../ShuffleButton';
import {heading} from '../../theme';
import {TUTORIAL,DEMO_CARDS} from '../../content/onboarding';
import {CATEGORIES} from '../../content/categories';
import type {Article} from '../../content/types';
import type {CategoryRailItem} from '../../content/categoryRegistry';
import type {MotionEnvironment} from '../../content/onboardingPresentation';
import {TutorialGestureSlot} from '../OnboardingMotionSlots';
import type {OnboardingBinding} from '../../useOnboarding';

// These editions and all interaction state belong only to this mounted demo.
// Product components receive local callbacks, never library/learning methods.
const articles:Article[]=DEMO_CARDS.map((card,i)=>({id:card.id,title:card.title,category:i===0?'science':'arts',preview:[card.preview],paragraphs:[card.preview,i===0?'Le aurore si osservano soprattutto vicino ai poli. I colori dipendono dai gas dell’atmosfera coinvolti nell’interazione.':'Nell’origami tradizionale la forma nasce da pieghe successive: basta un foglio, senza tagli.'],source:i===0?'https://it.wikipedia.org/wiki/Aurora_polare':'https://it.wikipedia.org/wiki/Origami',fetchedAt:0,complete:true}));
export interface TutorialStageProps{binding:OnboardingBinding;motion:MotionEnvironment}
export function TutorialStage({binding:b,motion}:TutorialStageProps){
  const {palette}=useTheme(),window=useWindowDimensions(),insets=useSafeAreaInsets();
  const saved=useRef(new Set<string>()),visited=useRef(new Set<string>());
  const [query,setQuery]=useState(''),[collection,setCollection]=useState<'saved'|'history'|'settings'|null>(null);
  const [reader,setReader]=useState<{article:Article;origin:Origin}|null>(null),[readerOpen,setReaderOpen]=useState(false);
  const [readerSize,setReaderSize]=useState({width:window.width,height:window.height});
  const tutorial=TUTORIAL[b.tutorialIndex],demo=b.demo;
  const reduced=motion.reduced||!motion.appActive||!motion.visible;
  const cardHeight=Math.max(260,Math.ceil(260*window.fontScale));
  const save=(article:Article,only=false)=>{if(only||!saved.current.has(article.id))saved.current.add(article.id);else saved.current.delete(article.id);b.interactDemo(d=>{d.saved=saved.current.size>0})};
  const open:OpenArticle=(article,node,kind,title)=>{
    const show=(x:number,y:number,width:number,height:number)=>{visited.current.add(article.id);b.interactDemo(d=>{d.opened=true});setReader({article,origin:{x,y,width,height,kind,title}});setReaderOpen(true)};
    if(node)node.measureInWindow(show);else show(24,insets.top+72,window.width-48,cardHeight);
  };
  const close=()=>{setReaderOpen(false);b.interactDemo(d=>{d.opened=false})};
  const next=()=>{b.interactDemo(d=>d.swipe(d.card===0?'next':'previous'));AccessibilityInfo.announceForAccessibility(articles[b.demo.card].title)};
  const card=(article:Article)=><FeedCard natural key={article.id} article={article} height={cardHeight} size={20} saved={saved.current.has(article.id)} hidden={false} hideMeta={false} reduced={reduced} onOpen={open} onSave={save}/>;
  const rows=(items:Article[])=><View>{items.map(article=><ArticleRow key={article.id} article={article} onOpen={open} reducedOverride={reduced}/>)}{!items.length&&<Label muted style={{paddingVertical:24}}>Nessun articolo nell’esempio.</Label>}</View>;
  const rail:CategoryRailItem[]=['all','science','arts'].map((id,order)=>({id,label:id==='all'?'Per Te':CATEGORIES.find(c=>c.id===id)!.label,icon:CATEGORIES.find(c=>c.id===id)?.icon||'compass-outline',selected:demo.category===id,order,visible:true,enabled:true,actions:['select']}));
  const navigate=(destination:'home'|'profile'|'search')=>{setCollection(null);b.interactDemo(d=>{d.destination=destination;if(destination==='home')d.card=0})};
  return <View>
    <Label style={styles.body}>{tutorial.body}</Label>
    <View style={styles.scene}>
      {b.tutorialIndex===0&&<><View style={styles.fullWidth}><TutorialGestureSlot cardIndex={demo.card as 0|1} hintStopped={demo.hintStopped} motion={motion} onInteract={()=>b.interactDemo(()=>{})} onSwipe={direction=>{b.interactDemo(d=>d.swipe(direction));AccessibilityInfo.announceForAccessibility(articles[b.demo.card].title)}}>{articles.map(card)}</TutorialGestureSlot></View><Button label="Prova un’altra scheda" reduced={reduced} onPress={next}><Label style={{color:palette.accent}}>Prova un’altra scheda</Label></Button></>}
      {b.tutorialIndex===1&&<><View style={styles.fullWidth}><CategoryRail selected={demo.category} items={rail} reducedOverride={reduced} onSelect={category=>b.interactDemo(d=>{d.category=category;d.card=category==='arts'?1:0})}/><View style={{marginTop:20}}>{card(articles[demo.category==='arts'?1:0])}</View></View><Label muted>Scegli una categoria per provare.</Label></>}
      {b.tutorialIndex===2&&<View style={styles.fullWidth}>{card(articles[1])}</View>}
      {b.tutorialIndex===3&&<>
        {demo.destination==='home'&&<View style={styles.fullWidth}>{card(articles[demo.card])}</View>}
        {demo.destination==='profile'&&<View>
          <Label accessibilityRole="header" style={styles.pageTitle}>{collection==='saved'?'Articoli salvati':collection==='history'?'Cronologia':collection==='settings'?'Impostazioni':'Profilo'}</Label>
          {collection===null?<>{([{id:'saved',title:'Articoli salvati',icon:'bookmark-outline',count:saved.current.size},{id:'history',title:'Cronologia',icon:'history',count:visited.current.size},{id:'settings',title:'Impostazioni',icon:'tune',count:undefined}] as const).map(row=><ProfileMenuRow key={row.id} icon={row.icon} title={row.title} count={row.count} onPress={()=>{b.interactDemo(()=>{});setCollection(row.id)}}/>)}</>:<><Button label="Torna al profilo" reduced={reduced} onPress={()=>setCollection(null)}><Label>Torna al profilo</Label></Button>{collection==='settings'?<Label muted style={{paddingVertical:24}}>Nell’app puoi scegliere tema, dimensione del testo e opzioni di Gemini.</Label>:rows(articles.filter(a=>(collection==='saved'?saved:visited).current.has(a.id)))}</>}
        </View>}
        {demo.destination==='search'&&<View><Label accessibilityRole="header" style={styles.pageTitle}>Cerca</Label><View style={{flexDirection:'row',gap:10}}><SearchComposer value={query} onChange={value=>{setQuery(value);b.interactDemo(()=>{})}} onClose={()=>navigate('home')}/><View style={{width:56,height:56,borderRadius:28,backgroundColor:palette.active}}><ShuffleButton busy={false} onPress={()=>{setQuery(articles[demo.card===0?1:0].title);b.interactDemo(d=>{d.card=d.card===0?1:0})}}/></View></View>{rows(articles.filter(a=>!query.trim()||a.title.toLocaleLowerCase('it').includes(query.trim().toLocaleLowerCase('it'))))}</View>}
        <View testID="tutorial-dock-slot" style={{height:Math.max(92,Math.ceil(18*window.fontScale+60)),marginTop:12}}><Dock selected={demo.destination==='profile'?'profile':'home'} onNavigate={navigate} onSearch={()=>navigate('search')} bottom={0} availableWidth={window.width-48} reducedOverride={reduced}/></View>
      </>}
    </View>
    <Label muted style={styles.hint}>Esempio interattivo: non modifica interessi, cronologia o salvati dell’app.</Label>
    <Label muted style={styles.hint}>{tutorial.hint}</Label>
    <Modal visible={!!reader} transparent statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={close}>
      <View style={[StyleSheet.absoluteFill,{backgroundColor:palette.paper}]} onLayout={e=>setReaderSize(e.nativeEvent.layout)}>
        {reader&&<Reader article={reader.article} origin={reader.origin} open={readerOpen} width={readerSize.width} height={readerSize.height} top={insets.top} bottom={insets.bottom} size={20} saved={saved.current.has(reader.article.id)} onClose={close} onReopen={()=>setReaderOpen(true)} onClosed={()=>setReader(null)} onSave={()=>save(reader.article)} reducedOverride={reduced}/>}</View>
    </Modal>
  </View>;
}
const styles=StyleSheet.create({body:{fontSize:17,lineHeight:25,marginBottom:24},scene:{marginBottom:20},fullWidth:{marginHorizontal:-24},hint:{fontSize:16,lineHeight:24,marginTop:12},pageTitle:{fontFamily:heading,fontSize:38,lineHeight:42,letterSpacing:-.9,paddingBottom:25}});
