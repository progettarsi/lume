import {useFonts} from 'expo-font';
import {fontAssets} from '../../src/design-system/fonts';
// Isolated native fixture. This entry is never imported by the product.
import 'react-native-gesture-handler';
import React,{useEffect,useRef,useState} from 'react';
import {ScrollView,View} from 'react-native';
import {registerRootComponent} from 'expo';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useSharedValue} from 'react-native-reanimated';
import {ThemeContext,Button,Label} from '../../src/components/Atoms';
import {CategoryRail} from '../../src/components/CategoryRail';
import {GeminiSettings} from '../../src/components/GeminiSettings';
import {GeminiIntegration,type GeminiConfigurationState} from '../../src/content/geminiIntegration';
import {categoryRailItems,emptyRegistry} from '../../src/content/categoryRegistry';
import {light,dark} from '../../src/theme';
function Fixture(){
 const [fonts]=useFonts(fontAssets);
 const [ids,setIds]=useState(['science','technology','history','nature','geography','arts']),[selected,setSelected]=useState('all'),[online,setOnline]=useState(true),[exhausted,setExhausted]=useState(false),[night,setNight]=useState(false),[reduced,setReduced]=useState(false),[log,setLog]=useState('Pronto'),[key,setKey]=useState(''),[fail,setFail]=useState(false);
 const failure=useRef(fail);failure.current=fail;const [state,setState]=useState<GeminiConfigurationState>({status:'loading',configured:false,enabled:false,busy:true,message:'Carichiamo la configurazione…',actions:[]});
 const controller=useRef<GeminiIntegration|null>(null),timers=useRef<ReturnType<typeof setTimeout>[]>([]);
 if(!controller.current)controller.current=new GeminiIntegration(async()=>null,async()=>{await new Promise(r=>setTimeout(r,300));if(failure.current)throw Error('Fixture disk failure')},()=>{},setState);
 useEffect(()=>{void controller.current!.load();return()=>timers.current.forEach(clearTimeout)},[]);
 const progress=useSharedValue(0),palette=night?dark:light;
 const action=(label:string,fn:()=>void)=><Button key={label} label={label} onPress={fn} reduced={reduced} style={{backgroundColor:palette.surface,borderRadius:18,paddingHorizontal:10}}><Label>{label}</Label></Button>;
 if(!fonts)return null;
 return <ThemeContext.Provider value={{palette,progress}}><SafeAreaView style={{flex:1,backgroundColor:palette.paper,paddingHorizontal:20}}>
  <Label strong style={{fontSize:20,marginVertical:12}}>Verifica categorie · dati simulati</Label>
  <CategoryRail selected={selected} items={categoryRailItems({...emptyRegistry(),visible:ids},selected,online,exhausted?{[selected]:{phase:'exhausted'}}:{})} reducedOverride={reduced} onSelect={id=>{setSelected(id);setLog('Selezionata '+id)}} onInteractionStart={()=>setLog('Interazione')} onInteractionEnd={()=>setLog('Ferma · '+selected)}/>
  <Label accessibilityLiveRegion="polite">{log}</Label>
  <ScrollView keyboardShouldPersistTaps="handled">
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:6,marginVertical:12}}>
    {action('Inserisci',()=>setIds(old=>old.includes('music')?old:['science','music',...old.filter(id=>id!=='science')]))}
    {action('Rimuovi',()=>setIds(old=>old.filter(id=>id!=='science'&&id!=='music')))}
    {action('Riordina',()=>setIds(old=>[...old].reverse()))}
    {action('Rapido',()=>{setIds(['science','music','history','nature']);timers.current.push(setTimeout(()=>setIds(['history','nature','music']),60),setTimeout(()=>setIds(['science','music','nature','history','technology','geography','arts']),120))})}
    {action('Offline',()=>setOnline(v=>!v))}{action('Esaurita',()=>{setSelected('science');setIds(old=>old.includes('science')?old:['science',...old]);setExhausted(true)})}
    {action('Per Te e rimuovi',()=>{setSelected('all');setIds(old=>old.filter(id=>id!=='science'));setExhausted(false)})}
    {action('Scuro',()=>setNight(v=>!v))}{action('Ridotto',()=>setReduced(v=>!v))}{action('Errore salvataggio',()=>setFail(v=>!v))}
   </View>
   {exhausted&&<Label>Categoria esaurita. Per Te resta disponibile; la selezionata resta fino al ritorno.</Label>}
   <GeminiSettings state={state} aiKey={key} keyEdited={!!key} onChangeKey={setKey} aiEnabled={state.enabled} onToggleEnabled={on=>controller.current!.setEnabled(on)} onSaveKey={()=>void controller.current!.save(key).then(()=>setKey('')).catch(()=>{})} onRemoveKey={()=>void controller.current!.remove().catch(()=>{})} reducedOverride={reduced}/>
  </ScrollView>
 </SafeAreaView></ThemeContext.Provider>;
}
registerRootComponent(()=> <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><Fixture/></SafeAreaProvider></GestureHandlerRootView>);
