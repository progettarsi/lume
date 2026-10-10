// Return regression fixture, never imported by the production entry. No personal
// storage/network/key. Real Reader, ArticleList and return-order controller.
import React,{useEffect,useRef,useState} from 'react';
import {View,Text,Pressable,FlatList,TextInput,Keyboard,useWindowDimensions} from 'react-native';
import {registerRootComponent} from 'expo';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider,useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFonts} from 'expo-font';
import {Newsreader_500Medium} from '@expo-google-fonts/newsreader/500Medium';
import {SourceSans3_400Regular} from '@expo-google-fonts/source-sans-3/400Regular';
import {SourceSans3_600SemiBold} from '@expo-google-fonts/source-sans-3/600SemiBold';
import {useSharedValue} from 'react-native-reanimated';
import {Reader} from '../../src/components/Reader';
import {ArticleList} from '../../src/components/ArticleList';
import {useReturnRows} from '../../src/components/useReturnRows';
import {ShuffleButton} from '../../src/components/ShuffleButton';
import {ThemeContext,Label} from '../../src/components/Atoms';
import {dark,heading} from '../../src/theme';
import type {Article} from '../../src/content/types';
import type {Origin,OpenArticle} from '../../src/components/Feed';

const lead='Questa introduzione rimane identica nella verifica. Il percorso segue il fiume tra alberi e prati, osservando il paesaggio e i ponti lungo la riva.';
const sentence='Le persone attraversano il ponte e osservano il paesaggio. La luce cambia nel corso della giornata, mentre il rumore dell’acqua accompagna la passeggiata. Il sentiero permette di riconoscere alberi, prati e piccoli affluenti.';
const article:Article={id:'return-qa',title:'Il percorso lungo il fiume',category:'science',source:'https://it.wikipedia.org/wiki/Fiume',preview:[lead],paragraphs:[lead,...Array.from({length:20},(_,i)=>`Passaggio ${i+1}. ${sentence}`)],complete:true,textVersion:3,fetchedAt:1,saved:true};
type Source='Home'|'Ricerca'|'Shuffle'|'Salvati'|'Cronologia';
function rowsFor(deep:boolean){const count=deep?500:8;return Array.from({length:count},(_,i)=>i===(deep?499:4)?article:{...article,id:`row-${i}`,title:`Scoperta ${i+1}`,saved:true})}
function Harness(){
 const [fonts]=useFonts({Newsreader_500Medium,SourceSans3_400Regular,SourceSans3_600SemiBold});
 return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider>{fonts&&<Cases/>}</SafeAreaProvider></GestureHandlerRootView>;
}
function Cases(){
 const w=useWindowDimensions(),insets=useSafeAreaInsets(),paint=useSharedValue(1),frame=useRef<View>(null),card=useRef<View>(null),shuffle=useRef<View>(null),list=useRef<FlatList<Article>>(null),input=useRef<TextInput>(null);
 const h=w.height-156,top=insets.top+16;
 const [source,setSource]=useState<Source>('Home'),[large,setLarge]=useState(false),[reduced,setReduced]=useState(false),[deep,setDeep]=useState(false);
 const [model,setModel]=useState(()=>rowsFor(false)),returns=useReturnRows(model);
 const [reader,setReader]=useState<{origin:Origin;run:number}|null>(null),[open,setOpen]=useState(false),[edition,setEdition]=useState(article),[saved,setSaved]=useState(true),[near,setNear]=useState(0),[closed,setClosed]=useState(0),[visits,setVisits]=useState(0),[note,setNote]=useState('Tocca il titolo. Scorri il lettore fino al fondo.');
 const openRef=useRef(open);openRef.current=open;
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),run=useRef(0);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 const openArticle:OpenArticle=(a,node,kind,title)=>{
   if(a.id!==article.id||!frame.current||!node)return;
   Keyboard.dismiss();
   frame.current.measureInWindow((fx,fy)=>node.measureInWindow((x,y,width,height)=>{
     returns.hold(article.id);setEdition(article);setSaved(true);setReader({origin:{kind,x:x-fx,y:y-fy,width,height,title},run:++run.current});setOpen(true);setVisits(n=>n+1);
     if(source==='Cronologia')setModel(old=>[old.find(row=>row.id===article.id)!,...old.filter(row=>row.id!==article.id)]);
     setNote('Visita registrata; destinazione congelata.');
   }));
 };
 const chooseSource=(next:Source,isDeep=false)=>{if(timer.current)clearTimeout(timer.current);Keyboard.dismiss();setReader(null);setOpen(false);returns.finish();setSource(next);setDeep(isDeep);setModel(rowsFor(isDeep));setEdition(article);setSaved(true);setNote(isDeep?'Avanza con Lista ↓ o scorri fino al titolo target.':'Tocca Il percorso lungo il fiume.')};
 const close=()=>{openRef.current=false;setOpen(false)};
 const reopen=()=>{if(!reader)return;returns.restore();openRef.current=true;setOpen(true);setNote('Stessa istanza, inversione dalla posizione corrente.')};
 const remove=()=>{setSaved(false);setModel(old=>old.filter(row=>row.id!==article.id));setNote('Salvato rimosso dal modello; riga di ritorno conservata.')};
 const button=(label:string,action:()=>void,selected=false)=><Pressable key={label} accessibilityLabel={'Verifica '+label} onPress={action} style={{flex:1,margin:2,paddingVertical:9,backgroundColor:selected?'#82513e':'#474139'}}><Text style={{color:'#efe9df',fontSize:12,textAlign:'center'}}>{label}</Text></Pressable>;
 return <ThemeContext.Provider value={{palette:dark,progress:paint}}><View style={{flex:1,backgroundColor:dark.paper}}>
  <View ref={frame} collapsable={false} style={{height:h,overflow:'hidden',backgroundColor:dark.paper}}>
   <Label style={{paddingTop:top,fontFamily:heading,fontSize:30,paddingHorizontal:24,marginBottom:18}}>{source}{deep?' · fondo lista':''}</Label>
   {source==='Home'?<Pressable onPress={()=>openArticle(article,card.current,'home')}><View ref={card} collapsable={false} style={{marginHorizontal:24,height:h-top-110,overflow:'hidden',opacity:reader?0:1}}><Label style={{fontFamily:heading,fontSize:40,lineHeight:44,marginBottom:22}}>{article.title}</Label><Label style={{fontSize:large?23:20,lineHeight:30}}>{lead}</Label></View></Pressable>:source!=='Shuffle'?<ArticleList listRef={list} articles={returns.rows} onOpen={openArticle} hiddenId={reader&&!returns.released?article.id:undefined} returnId={reader?article.id:undefined} animate={returns.animate} bottomPadding={100} reducedOverride={reduced}/>:null}
   {(source==='Ricerca'||source==='Shuffle')&&<View style={{position:'absolute',bottom:16,left:24,right:24,flexDirection:'row',gap:10}}><TextInput ref={input} accessibilityLabel="Query della verifica" defaultValue="fiume" style={{flex:1,height:56,backgroundColor:dark.surface,color:dark.ink,padding:16,borderRadius:28}}/><View ref={shuffle} collapsable={false} style={{width:56,height:56,borderRadius:28,backgroundColor:dark.active}}><ShuffleButton busy={false} onPress={()=>openArticle(article,shuffle.current,'shuffle')}/></View></View>}
   {reader&&<Reader key={reader.run} article={edition} origin={reader.origin} open={open} width={w.width} height={h} top={top} bottom={16} size={large?23:20} saved={saved} reducedOverride={reduced} returnDetached={returns.changed} onClose={close} onReopen={reopen} onClosed={()=>{if(openRef.current)return;setClosed(n=>n+1);setReader(null);returns.finish();setNote('Chiusura completata; ordine aggiornato.');if(source==='Ricerca'||source==='Shuffle')input.current?.focus()}} onReturnNear={()=>{if(openRef.current)return;returns.near();setNear(n=>n+1);setNote('Titolo quasi rientrato: inizia il riordino.')}} onSave={remove}/>}
  </View>
  <View style={{position:'absolute',bottom:insets.bottom,left:0,right:0,backgroundColor:'#35302c'}}>
   <Text style={{color:dark.ink,fontSize:10,textAlign:'center'}}>{source} · {open?'aperto':reader?'chiusura':'chiuso'} · istanza {reader?.run??run.current} · visite {visits} · riordini {near} · finali {closed}</Text>
   <Text style={{color:dark.muted,fontSize:10,textAlign:'center'}}>{note} · modello #{model.findIndex(a=>a.id===article.id)} / visivo #{returns.rows.findIndex(a=>a.id===article.id)}</Text>
   <View style={{flexDirection:'row'}}>{button('Grande',()=>setLarge(v=>!v),large)}{button('Ridotto',()=>setReduced(v=>!v),reduced)}</View>
   <View style={{flexDirection:'row'}}>{(['Home','Ricerca','Shuffle','Salvati','Cronologia'] as Source[]).map(s=>button(s,()=>chooseSource(s),source===s))}</View>
   <View style={{flexDirection:'row'}}>{button('Lista ↓',()=>{if(deep&&source==='Cronologia'&&!reader){list.current?.scrollToEnd({animated:false});setNote('Avanza con Lista ↓ o scorri fino al titolo target.')}else chooseSource('Cronologia',true)})}{button('Chiudi',close)}{button('Riapri',reopen)}{button('Inverti',()=>{close();timer.current=setTimeout(reopen,90)})}{button('Arrivo',()=>{close();timer.current=setTimeout(()=>{setEdition({...article,paragraphs:[lead,sentence]});setNote('Nuova edizione arrivata durante chiusura.')},60)})}</View>
  </View>
 </View></ThemeContext.Provider>;
}
registerRootComponent(Harness);
