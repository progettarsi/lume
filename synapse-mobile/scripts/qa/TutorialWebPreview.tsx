import {useFonts} from 'expo-font';
import {fontAssets} from '../../src/design-system/fonts';
// Visual fallback only: isolated in-memory demo, no library or network access.
import React,{useState} from 'react';
import {View} from 'react-native';
import {registerRootComponent} from 'expo';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useSharedValue} from 'react-native-reanimated';
import {ThemeContext,Button,Label} from '../../src/components/Atoms';
import {TutorialStage} from '../../src/components/onboarding/TutorialStage';
import {TutorialDemo} from '../../src/content/onboarding';
import {light,dark} from '../../src/theme';
import type {OnboardingBinding} from '../../src/useOnboarding';
function Root(){
 const [fonts,error]=useFonts(fontAssets);
 const [isDark,setDark]=useState(true),[reduced,setReduced]=useState(false),[index,setIndex]=useState(0),[demo,setDemo]=useState(new TutorialDemo()),[ended,setEnded]=useState(false),progress=useSharedValue(0),palette=isDark?dark:light;
 const b={tutorialIndex:index,tutorialNavigationRevision:0,demo,interactDemo:(fn:(d:TutorialDemo)=>void)=>setDemo(old=>{const next=Object.assign(new TutorialDemo(),old);next.interact();fn(next);return next}),seekTutorial:setIndex,navigate:()=>setEnded(true),busy:false} as unknown as OnboardingBinding;
 return <ThemeContext.Provider value={{palette,progress}}><View style={{flex:1,backgroundColor:palette.paper,alignItems:'center',justifyContent:'center'}}>
  <View style={{flexDirection:'row',gap:12,padding:12}}><Button label="Tema anteprima" onPress={()=>setDark(!isDark)}><Label>Tema</Label></Button><Button label="Movimento anteprima" onPress={()=>setReduced(!reduced)}><Label>{reduced?'Statico':'Movimento'}</Label></Button><Button label="Ricomincia anteprima" onPress={()=>{setEnded(false);setIndex(0)}}><Label>Ricomincia</Label></Button></View>
  <View testID="tutorial-preview-frame" style={{width:384,height:832,overflow:'hidden',backgroundColor:palette.paper}}>
   <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width:384,height:832},insets:{top:24,bottom:24,left:0,right:0}}}>
    {fonts||error?ended?<Label>Anteprima conclusa</Label>:<TutorialStage binding={b} motion={{reduced,visible:true,appActive:true}}/>:<View/>}
   </SafeAreaProvider></GestureHandlerRootView>
  </View>
 </View></ThemeContext.Provider>;
}
registerRootComponent(Root);
