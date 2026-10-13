import React,{useLayoutEffect} from 'react';
import {Image,Pressable,StyleSheet,View} from 'react-native';
import Animated,{cancelAnimation,Easing,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
import {Button,Label,useTheme} from '../Atoms';
import type {OnboardingBinding} from '../../useOnboarding';
import type {MotionEnvironment} from '../../content/onboardingPresentation';

const ease=Easing.bezier(.22,1,.36,1);
export function ProfilePhotoSlot({binding:b,motion,size,compact}:{binding:OnboardingBinding;motion:MotionEnvironment;size:number;compact:boolean}){
 const {palette}=useTheme(),uri=b.photoUri;
 const caption=useSharedValue(1);
 const removable=!!(b.active?b.state?.draft.photoUri:b.state?.profile.photoUri),controls=useSharedValue(removable?1:0);
 const instant=motion.reduced||!motion.appActive||!motion.visible;
 useLayoutEffect(()=>{cancelAnimation(caption);cancelAnimation(controls);caption.value=instant?1:0;if(!instant)caption.value=withTiming(1,{duration:280,easing:ease});controls.value=instant?(removable?1:0):withTiming(removable?1:0,{duration:320,easing:ease});return()=>{cancelAnimation(caption);cancelAnimation(controls)}},[uri,removable,instant]);
 const captionStyle=useAnimatedStyle(()=>({opacity:caption.value,transform:[{translateY:4*(1-caption.value)}]}));
 const actions=useAnimatedStyle(()=>({height:52*controls.value,opacity:controls.value,transform:[{translateY:4*(1-controls.value)}]}));
 const imageStyle={width:size,height:size,borderRadius:size/2};
 return <>
  <Pressable accessibilityRole="button" accessibilityLabel={uri?'Sostituisci foto profilo':'Aggiungi foto profilo'} accessibilityHint="Apre il selettore immagini di sistema" disabled={b.busy||b.devSandbox} onPress={()=>void b.pickPhoto()} style={{...imageStyle,overflow:'hidden',borderWidth:1,borderColor:palette.line,backgroundColor:palette.surface,alignItems:'center',justifyContent:'center'}}>
   {uri?<Image source={{uri}} onError={()=>b.reportPhotoUnavailable()} style={imageStyle}/>:<View style={{width:40,height:40,borderRadius:20,backgroundColor:palette.active,alignItems:'center',justifyContent:'center'}}><Image source={require('../../../assets/onboarding/photo-plus.png')} style={{width:18,height:18,tintColor:palette.ink}} resizeMode="contain" accessible={false}/></View>}
  </Pressable>
  <Animated.View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{height:22,width:'100%',marginTop:compact?12:16},captionStyle]}><Label style={{fontSize:15,lineHeight:22,textAlign:'center',color:palette.muted}}>{uri?'Modifica foto profilo':'Aggiungi foto profilo'}</Label></Animated.View>
  <Animated.View pointerEvents={removable?'auto':'none'} accessibilityElementsHidden={!removable} importantForAccessibility={removable?'auto':'no-hide-descendants'} style={[{overflow:'hidden',width:'100%',alignItems:'center'},actions]}><Button disabled={b.busy||!removable} label="Rimuovi foto" onPress={()=>void b.pickPhoto(true)} style={{marginTop:4}}><Label style={{color:palette.accent}}>Rimuovi foto</Label></Button></Animated.View>
 </>;
}
