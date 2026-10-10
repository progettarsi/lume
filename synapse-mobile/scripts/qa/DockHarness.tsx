import {registerRootComponent} from 'expo';
import {useState,useEffect} from 'react';
import {View,ScrollView,useWindowDimensions} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useSharedValue} from 'react-native-reanimated';
import {useFonts} from 'expo-font';
import {Newsreader_500Medium} from '@expo-google-fonts/newsreader/500Medium';
import {SourceSans3_400Regular} from '@expo-google-fonts/source-sans-3/400Regular';
import {SourceSans3_600SemiBold} from '@expo-google-fonts/source-sans-3/600SemiBold';
import {Dock} from '../../src/components/Dock';
import {StatusMessage} from '../../src/components/StatusMessage';
import {Label,Button,ThemeContext} from '../../src/components/Atoms';
import {light,dark} from '../../src/theme';
import type {ReaderStatus} from '../../src/content/readerStatus';
const states:ReaderStatus[]=[
 {kind:'loading',message:'Carico l’approfondimento. L’anteprima resta leggibile.'},
 {kind:'revising',message:'Gemini prepara la revisione. Puoi leggere il testo originale.'},
 {kind:'offline',message:'L’anteprima è disponibile offline. L’approfondimento non è ancora stato scaricato.',action:'article'},
 {kind:'network',message:'Non è stato possibile scaricare l’approfondimento. L’anteprima resta disponibile.',action:'article'},
 {kind:'ai',message:'La revisione non è disponibile. Il testo originale resta leggibile.',action:'ai'},
 {kind:'content',message:'Il testo della voce è insufficiente. Puoi consultare la fonte.',action:'source'}
];
function Harness(){
 const [fonts]=useFonts({Newsreader_500Medium,SourceSans3_400Regular,SourceSans3_600SemiBold}),{width}=useWindowDimensions();
 const [route,setRoute]=useState<'home'|'profile'>('home'),[isDark,setDark]=useState(false),[large,setLarge]=useState(false),[reduced,setReduced]=useState(false),[status,setStatus]=useState(0),[action,setAction]=useState(0);
 const progress=useSharedValue(0),palette=isDark?dark:light;useEffect(()=>{progress.value=isDark?1:0},[isDark]);
 if(!fonts)return <View/>;
 return <GestureHandlerRootView style={{flex:1}}><ThemeContext.Provider value={{palette,progress}}><View style={{flex:1,backgroundColor:palette.paper}}>
  <ScrollView contentContainerStyle={{padding:24,paddingTop:40,paddingBottom:120}}>
   <Label accessibilityRole="header" style={{fontFamily:'Newsreader_500Medium',fontSize:30,marginBottom:16}}>Dock e messaggi · QA</Label>
   <Label muted style={{fontSize:14,marginBottom:12}}>Componenti reali, dati simulati. Nessuna rete, chiave o raccolta personale.</Label>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:20}}>
    <Button label="Tema QA" onPress={()=>setDark(v=>!v)}><Label>Tema {isDark?'scuro':'chiaro'}</Label></Button>
    <Button label="Font QA" onPress={()=>setLarge(v=>!v)}><Label>Font {large?'1,5':'1'}</Label></Button>
    <Button label="Movimento QA" onPress={()=>setReduced(v=>!v)}><Label>Movimento {reduced?'ridotto':'normale'}</Label></Button>
   </View>
   <Label strong style={{marginBottom:16}}>Destinazione: {route==='home'?'Home':'Profilo'}</Label>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:20}}>{states.map((s,i)=><Button key={s.kind} label={'Stato '+s.kind} onPress={()=>setStatus(i)}><Label style={{fontSize:14}}>{s.kind}</Label></Button>)}</View>
   <StatusMessage status={states[status]} reducedOverride={reduced} fontScaleOverride={large?1.5:1} onAction={states[status].action?()=>setAction(n=>n+1):undefined} actionLabel={states[status].action==='source'?'Consulta Wikipedia':states[status].action==='ai'?'Riprova Gemini':'Riprova caricamento'}/>
   <Label muted>Azioni simulate: {action}</Label>
  </ScrollView>
  <Dock key={large?'large':'normal'} selected={route} onNavigate={setRoute} onSearch={()=>setStatus(0)} bottom={16} availableWidth={width-32} reducedOverride={reduced} fontScaleOverride={large?1.5:1}/>
 </View></ThemeContext.Provider></GestureHandlerRootView>;
}
registerRootComponent(Harness);
