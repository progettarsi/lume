import {fontAssets} from '../../src/design-system/fonts';
import React,{useState} from 'react';
import {Image,StyleSheet,View} from 'react-native';
import {registerRootComponent} from 'expo';
import {useFonts} from 'expo-font';
import {SafeAreaProvider,useSafeAreaInsets} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useSharedValue} from 'react-native-reanimated';
import {ProfileHeader} from '../../src/components/ProfileHeader';
import {ProfileMenuRow} from '../../src/components/ProfileMenuRow';
import {Button,Label,ThemeContext} from '../../src/components/Atoms';
import {dark} from '../../src/theme';
function Scene(){
 const insets=useSafeAreaInsets(),[photo,setPhoto]=useState(false),progress=useSharedValue(1);
 const uri=Image.resolveAssetSource(require('../../assets/icon.png')).uri;
 return <ThemeContext.Provider value={{palette:dark,progress}}><View style={styles.page}>
  <ProfileHeader top={insets.top+28} photoUri={photo?uri:undefined} onEdit={()=>{}}/>
  <View style={{paddingHorizontal:24}}><ProfileMenuRow icon="bookmark-outline" title="Articoli salvati" count={1} onPress={()=>{}}/><ProfileMenuRow icon="history" title="Cronologia" count={1} onPress={()=>{}}/><ProfileMenuRow icon="tune" title="Impostazioni" onPress={()=>{}}/></View>
  <View style={[styles.actions,{bottom:insets.bottom+60}]}><Label muted>Prova isolata del componente nativo. Nessun dato del profilo reale.</Label><Button label="Aggiungi foto demo" onPress={()=>setPhoto(true)} style={{backgroundColor:dark.active,borderRadius:28}}><Label>Aggiungi foto demo</Label></Button><Button label="Rimuovi foto demo" onPress={()=>setPhoto(false)} style={{backgroundColor:dark.surface,borderRadius:28}}><Label>Rimuovi foto demo</Label></Button></View>
 </View></ThemeContext.Provider>;
}
function Harness(){const [ready]=useFonts(fontAssets);return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider>{ready&&<Scene/>}</SafeAreaProvider></GestureHandlerRootView>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:dark.paper},actions:{position:'absolute',left:24,right:24,gap:12}});
registerRootComponent(Harness);
