// Isolated native fixture entry, never imported by the production application.
// Uses the real Reader with deterministic content; no storage, network or key.
import React,{useEffect,useRef,useState} from 'react';
import {View,Text,Pressable,useWindowDimensions} from 'react-native';
import {registerRootComponent} from 'expo';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider,useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFonts} from 'expo-font';
import {Newsreader_500Medium} from '@expo-google-fonts/newsreader/500Medium';
import {SourceSans3_400Regular} from '@expo-google-fonts/source-sans-3/400Regular';
import {SourceSans3_600SemiBold} from '@expo-google-fonts/source-sans-3/600SemiBold';
import {useSharedValue} from 'react-native-reanimated';
import {Reader} from '../../src/components/Reader';
import {ThemeContext} from '../../src/components/Atoms';
import {dark} from '../../src/theme';
import type {Article} from '../../src/content/types';
const lead='Questa introduzione rimane identica in tutte le edizioni. Il testo descrive una passeggiata lungo il fiume e le osservazioni raccolte durante il percorso.';
const sentence='Il sentiero segue la riva tra alberi e prati. Le persone attraversano il ponte e osservano il paesaggio. La luce cambia nel corso della giornata, mentre il rumore dell’acqua accompagna la passeggiata.';
const classic=Array.from({length:20},(_,i)=>`Passaggio ${i+1}. ${sentence}`);
const gemini=Array.from({length:5},(_,i)=>`Revisione ${i+1}. Il percorso lungo il fiume permette di osservare alberi, prati e ponti. La luce e il suono dell’acqua cambiano durante la giornata. Ogni tratto offre una prospettiva diversa sul paesaggio.`);
function fixture(kind:string):Article{
  const a:Article={id:'qa:'+kind,title:'Il percorso lungo il fiume',source:'https://it.wikipedia.org/wiki/Fiume',category:'science',preview:[lead],paragraphs:[lead,...(kind==='Breve'?[sentence]:classic)],complete:kind!=='Arrivo',fetchedAt:1,textVersion:3};
  if(kind==='Arrivo')a.paragraphs=[lead];
  if(kind==='Cache')Object.assign(a,{simplified:gemini,simplifiedVersion:2,simplifiedPreview:JSON.stringify(a.preview)});
  return a;
}
function Harness(){
 const [fonts]=useFonts({Newsreader_500Medium,SourceSans3_400Regular,SourceSans3_600SemiBold});
 return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider>{fonts&&<Cases/>}</SafeAreaProvider></GestureHandlerRootView>;
}
function Cases(){
 const w=useWindowDimensions(),insets=useSafeAreaInsets(),paint=useSharedValue(1);
 const [kind,setKind]=useState('Lungo'),[article,setArticle]=useState(()=>fixture('Lungo')),[open,setOpen]=useState(true),[mounted,setMounted]=useState(true),[run,setRun]=useState(0),[saved,setSaved]=useState(false),[busy,setBusy]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{if(kind!=='Arrivo')return;const first=setTimeout(()=>setArticle({...fixture('Lungo'),id:'qa:Arrivo'}),900);const second=setTimeout(()=>{setArticle({...fixture('Cache'),id:'qa:Arrivo'});setBusy(false)},2200);return()=>{clearTimeout(first);clearTimeout(second)}},[kind,run]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 const choose=(next:string)=>{if(timer.current)clearTimeout(timer.current);setKind(next);setArticle(fixture(next));setBusy(next==='Arrivo'||next==='Cache');setMounted(true);setOpen(true);setRun(n=>n+1)};
 const action=(label:string,press:()=>void)=><Pressable key={label} accessibilityLabel={'QA '+label} onPress={press} style={{padding:8,backgroundColor:'#474139',margin:2,flex:1}}><Text style={{color:'#efe9df',fontSize:12,textAlign:'center'}}>{label}</Text></Pressable>;
 return <ThemeContext.Provider value={{palette:dark,progress:paint}}><View style={{flex:1,backgroundColor:dark.paper}}>
  {mounted&&<Reader key={run} article={article} origin={{kind:'home',x:0,y:insets.top+80,width:w.width,height:w.height-190}} open={open} width={w.width} height={w.height-105} top={insets.top+16} bottom={16} size={kind==='Grande'?23:20} saved={saved} onClose={()=>setOpen(false)} onReopen={()=>setOpen(true)} onClosed={()=>setMounted(false)} onSave={()=>setSaved(s=>!s)} aiBusy={busy} aiMessage={busy?'QA: revisione in attesa':kind==='Arrivo'||kind==='Cache'?'QA: revisione disponibile':''}/>}
  <View style={{position:'absolute',bottom:insets.bottom,left:0,right:0,zIndex:100,backgroundColor:'#35302c'}}>
   <Text style={{color:'#efe9df',fontSize:11,textAlign:'center'}}>{kind} · {article.simplified?'Gemini fixture':article.complete?'classico disponibile':'solo anteprima'} · {open?'aperto':'chiusura'} · run {run}</Text>
   <View style={{flexDirection:'row'}}>{['Lungo','Breve','Cache','Arrivo','Grande'].map(label=>action(label,()=>choose(label)))}</View>
   <View style={{flexDirection:'row'}}>{action('Inversione',()=>{setOpen(false);timer.current=setTimeout(()=>setOpen(true),60)})}{action('Aggiorna',()=>{setSaved(s=>!s);setArticle(a=>({...a,paragraphs:[...a.paragraphs],fetchedAt:Date.now()}))})}{action('Riapri',()=>choose(kind))}</View>
  </View>
 </View></ThemeContext.Provider>;
}
registerRootComponent(Harness);
