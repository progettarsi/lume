// Isolated UI fixture. No library, storage, credential or external service access.
import React,{useState} from 'react';
import {BackHandler,Image,Platform,View,ScrollView,Pressable} from 'react-native';
import {registerRootComponent} from 'expo';
import {useFonts} from 'expo-font';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider,useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSharedValue} from 'react-native-reanimated';
import {fontAssets} from '../../src/design-system/fonts';
import {light,dark} from '../../src/theme';
import {Label,ThemeContext} from '../../src/components/Atoms';
import {PageHeader,PageKeyboard,PageScroll} from '../../src/design-system/components';
import {ProfileOptionsExample,DesignGallery,profileVariants} from '../../src/design-system/Gallery';
import {ProfileHeader} from '../../src/components/ProfileHeader';
import {SettingsScreen} from '../../src/components/SettingsScreen';
import {GeminiSettings} from '../../src/components/GeminiSettings';
import {Dock} from '../../src/components/Dock';
import {parseSettings} from '../../src/content/settings';
import type {GeminiConfigurationState} from '../../src/content/geminiIntegration';

function Fixture(){
 const insets=useSafeAreaInsets(),progress=useSharedValue(0);
 const [page,setPage]=useState('profile'),[variant,setVariant]=useState(1),[night,setNight]=useState(false),[key,setKey]=useState(''),[configured,setConfigured]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(false),[online,setOnline]=useState(true),[longName,setLongName]=useState(false);
 const [settings,setSettings]=useState(parseSettings(null));const palette=night?dark:light;
 const state:GeminiConfigurationState={status:busy?'saving':error?'error':configured?settings.aiEnabled?'ready':'disabled':'missing',configured,enabled:settings.aiEnabled,busy,message:busy?'Salviamo la configurazione…':error?'Chiave non salvata. Riprova.':configured?'Chiave custodita sul telefono.':'Inserisci una chiave personale Gemini.',actions:[]};
 const back=()=>setPage(page==='gemini'?'settings':'profile');
 React.useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{back();return true});return()=>sub.remove()},[page]);
 const control=(title:string,action:()=>void)=><Pressable accessibilityRole="button" accessibilityLabel={'QA '+title} onPress={action} style={{paddingHorizontal:12,minHeight:44,justifyContent:'center'}}><Label style={{fontSize:12}}>{title}</Label></Pressable>;
 return <ThemeContext.Provider value={{palette,progress}}><View style={{flex:1,width:'100%',maxWidth:440,alignSelf:'center',backgroundColor:palette.paper,paddingBottom:insets.bottom}}>
  <View style={{flex:1}}>
   {page==='profile'?<><ProfileHeader name={longName?'Alessandro Massimiliano della Rovere':'Alex'} photoUri={Platform.OS==='web'?require('../../assets/icon.png'):Image.resolveAssetSource(require('../../assets/icon.png')).uri} top={insets.top+28} onEdit={()=>setLongName(v=>!v)}/><ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'center',paddingHorizontal:24,paddingTop:24,paddingBottom:126}}><ProfileOptionsExample variant={profileVariants[variant]}/></ScrollView><Dock selected="profile" onNavigate={()=>setPage('profile')} onSearch={()=>setPage('settings')} bottom={16} availableWidth={340}/></>:page==='gallery'?<><PageHeader title="Design system" backLabel="Profilo" onBack={back} top={insets.top+16}/><DesignGallery/></>:<PageKeyboard><PageHeader title={page==='gemini'?'Gemini':'Impostazioni'} backLabel="Indietro" onBack={back} top={insets.top+16}/>{page==='settings'?<SettingsScreen settings={settings} gemini={state} bottom={16} onTheme={themeMode=>{setSettings(s=>({...s,themeMode}));setNight(themeMode==='dark')}} onUpdate={patch=>setSettings(s=>({...s,...patch}))} onGemini={()=>setPage('gemini')} onGallery={()=>setPage('gallery')} onPreview={()=>{}}/>:<PageScroll><GeminiSettings state={state} aiKey={key} keyEdited={!!key} onChangeKey={setKey} onSaveKey={()=>{setConfigured(true);setKey('')}} onRemoveKey={()=>{setConfigured(false);setSettings(s=>({...s,aiEnabled:false}))}} aiEnabled={settings.aiEnabled} onToggleEnabled={aiEnabled=>setSettings(s=>({...s,aiEnabled}))} online={online} onRetryConfiguration={()=>setError(false)}/></PageScroll>}</PageKeyboard>}
  </View>
  <View style={{backgroundColor:palette.surface}}><ScrollView horizontal>{control('Profilo',()=>setPage('profile'))}{control('Stile '+(variant+1),()=>setVariant(v=>(v+1)%3))}{control('Tema',()=>setNight(v=>!v))}{control('Impostazioni',()=>setPage('settings'))}{control('Galleria',()=>setPage('gallery'))}</ScrollView><ScrollView horizontal>{control('Chiave',()=>setConfigured(v=>!v))}{control('Errore',()=>setError(v=>!v))}{control('Attesa',()=>setBusy(v=>!v))}{control('Offline',()=>setOnline(v=>!v))}{control('Nome lungo',()=>setLongName(v=>!v))}</ScrollView></View>
 </View></ThemeContext.Provider>;
}
function Harness(){const [ready]=useFonts(fontAssets);return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider>{ready&&<Fixture/>}</SafeAreaProvider></GestureHandlerRootView>}
registerRootComponent(Harness);
