// Separate applicationId build only. Real SQLite/picker and production UI; never
// accesses production data, keys or profile, and has no reset/disinstall action.
import React,{useEffect,useState} from 'react';
import {AppState,BackHandler,Keyboard,View,ScrollView} from 'react-native';
import {registerRootComponent} from 'expo';
import {StatusBar} from 'expo-status-bar';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useFonts,Newsreader_400Regular,Newsreader_500Medium} from '@expo-google-fonts/newsreader';
import {SourceSans3_400Regular,SourceSans3_600SemiBold} from '@expo-google-fonts/source-sans-3';
import {useSharedValue} from 'react-native-reanimated';
import {useLibrary} from '../../src/useLibrary';
import {useOnboarding} from '../../src/useOnboarding';
import {OnboardingScreen,LocalProfileEditor} from '../../src/components/OnboardingScreen';
import {Button,Label,ThemeContext} from '../../src/components/Atoms';
import {light,dark} from '../../src/theme';
import {useMotionPreference} from '../../src/useMotionPreference';
function Fixture(){
 const lib=useLibrary(),systemReduced=useMotionPreference(),[reduced,setReduced]=useState(false),[preparationPreview,setPreparationPreview]=useState(false),[active,setActive]=useState(AppState.currentState==='active'),b=useOnboarding(lib,reduced||systemReduced,active),progress=useSharedValue(0),palette=lib.settings.dark?dark:light;
 useEffect(()=>{const s=AppState.addEventListener('change',v=>setActive(v==='active'));return()=>s.remove()},[]);
 useEffect(()=>{lib.setDiscovery(!!lib.onboarding&&!lib.onboardingError);if(lib.ready&&lib.onboarding)void lib.load('all')},[lib.ready,!!lib.onboarding,lib.loading,lib.online]);
 useEffect(()=>{const s=BackHandler.addEventListener('hardwareBackPress',()=>{if(!b.active)return false;if(Keyboard.isVisible()){Keyboard.dismiss();return true}if(b.stage==='intro')return false;b.navigate('back');return true});return()=>s.remove()},[b.stage,b.active,b.revision]);
 const shown=preparationPreview?{...b,active:true,stage:'preparation' as const,navigate:()=>{setPreparationPreview(false);if(b.replay)b.navigate('skip')}}:b;
 return <ThemeContext.Provider value={{palette,progress}}><View style={{flex:1,backgroundColor:palette.paper}}>
  <StatusBar style={lib.settings.dark?'light':'dark'}/>
  <View style={{position:'absolute',top:28,right:12,zIndex:500,flexDirection:'row',gap:10}}><Button label="Tema QA" onPress={()=>lib.updateSettings({dark:!lib.settings.dark})}><Label style={{fontSize:12}}>QA · {lib.settings.dark?'scuro':'chiaro'}</Label></Button><Button label="Movimento ridotto QA" onPress={()=>setReduced(v=>!v)}><Label style={{fontSize:12}}>{reduced?'Statico':'Movimento'}</Label></Button></View>
  {!lib.ready?<Label>Caricamento QA</Label>:shown.active||shown.bootError?<OnboardingScreen binding={shown}/>:<ScrollView contentContainerStyle={{padding:24,gap:16}}><Label accessibilityRole="header">Home QA · configurazione completata</Label><Label>{lib.getFeed('all').length} anteprime · {lib.history.length} visite · {lib.cache.filter(a=>a.saved).length} salvati</Label><Label>Nome locale: {b.state?.profile.name||'vuoto'}</Label><Button label="Replay QA" onPress={b.replayTutorial}><Label>Rivedi il tutorial</Label></Button><Button label="Anteprima preparazione QA" onPress={()=>setPreparationPreview(true)}><Label>Anteprima grafica · conteggio reale</Label></Button><LocalProfileEditor binding={b}/></ScrollView>}
 </View></ThemeContext.Provider>;
}
function Root(){const [fonts,error]=useFonts({Newsreader_400Regular,Newsreader_500Medium,SourceSans3_400Regular,SourceSans3_600SemiBold});return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider>{fonts||error?<Fixture/>:<View/>}</SafeAreaProvider></GestureHandlerRootView>}
registerRootComponent(Root);
