import {fontAssets} from '../../src/design-system/fonts';
import {registerRootComponent} from 'expo';
import {useState} from 'react';
import {View,useWindowDimensions} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useSharedValue} from 'react-native-reanimated';
import {useFonts} from 'expo-font';
import {Reader} from '../../src/components/Reader';
import type {Article} from '../../src/content/types';
import {StatusMessage} from '../../src/components/StatusMessage';
import {Button,Label,ThemeContext} from '../../src/components/Atoms';
import {dark} from '../../src/theme';
const lead='Il sentiero segue la riva tra alberi e prati. Le persone attraversano il ponte e osservano il paesaggio.';
const fixture:Article={id:'qa:notice-reader',title:'Il sentiero lungo il fiume',source:'https://it.wikipedia.org/wiki/Fiume',category:'science',preview:[lead],paragraphs:[lead,...Array.from({length:6},(_,i)=>`Tratto ${i+1}. ${lead} La luce cambia nel corso della giornata, mentre il rumore dell’acqua accompagna la passeggiata.`)],complete:true,fetchedAt:1,textVersion:3};
function Harness(){
 const [fonts]=useFonts(fontAssets),[revision,setRevision]=useState(0),[waiting,setWaiting]=useState(true),[reduced,setReduced]=useState(false),[actions,setActions]=useState(0),[reader,setReader]=useState(false),[readerOpen,setReaderOpen]=useState(false),progress=useSharedValue(1),{width,height}=useWindowDimensions();
 if(!fonts)return <View/>;
 return <GestureHandlerRootView style={{flex:1}}><ThemeContext.Provider value={{palette:dark,progress}}><View style={{flex:1,backgroundColor:dark.paper,padding:24,paddingTop:60,gap:16}}>
  <Label strong>Errori · QA isolata, nessuna rete</Label>
  <Button label="Mostra errore" onPress={()=>{setWaiting(false);setRevision(n=>n+1)}}><Label>Mostra errore</Label></Button>
  <Button label="Mostra caricamento" onPress={()=>{setWaiting(true);setRevision(n=>n+1)}}><Label>Mostra caricamento</Label></Button>
  <Button label="Movimento QA" onPress={()=>setReduced(v=>!v)}><Label>Movimento {reduced?'ridotto':'normale'}</Label></Button>
  <Label>Riprove simulate: {actions}</Label>
  <Button label="Lettore con errore in fondo" onPress={()=>{setReader(true);setReaderOpen(true)}}><Label>Lettore con errore in fondo</Label></Button>
  <View style={{position:'absolute',bottom:120,left:24,right:24}}><StatusMessage key={revision} status={{kind:waiting?'loading':'network',message:waiting?'Caricamento simulato…':'Download non disponibile. L’anteprima resta leggibile.'}} reducedOverride={reduced} onAction={waiting?undefined:()=>{setActions(n=>n+1);setWaiting(true)}} actionLabel="Riprova"/></View>
  {reader&&<Reader article={fixture} origin={{kind:'home',x:0,y:0,width,height:height-100}} open={readerOpen} width={width} height={height} top={40} bottom={20} size={20} saved={false} onClose={()=>setReaderOpen(false)} onReopen={()=>setReaderOpen(true)} onClosed={()=>setReader(false)} onSave={()=>{}} notice={{kind:'ai',message:'Revisione simulata non disponibile. Il testo originale resta leggibile.',action:'ai'}} onRetryAI={()=>setActions(n=>n+1)} reducedOverride={reduced}/>}
 </View></ThemeContext.Provider></GestureHandlerRootView>;
}
registerRootComponent(Harness);
