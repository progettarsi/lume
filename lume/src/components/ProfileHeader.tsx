import {motion,typography} from '../theme';
import React,{useLayoutEffect,useState} from 'react';
import {Image,Pressable,StyleSheet,View} from 'react-native';
import Animated,{cancelAnimation,Easing,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
import {Label,useTheme} from './Atoms';
import {heading} from '../theme';

export function ProfileHeader({name,photoUri,top,onEdit,reduced=false}:{name?:string;photoUri?:string;top:number;onEdit:()=>void;reduced?:boolean}){
 const {palette}=useTheme(),title=name?.trim()||'Profilo';
 const [retainedPhoto,setRetainedPhoto]=useState(photoUri),photo=useSharedValue(photoUri?1:0);
 useLayoutEffect(()=>{if(photoUri)setRetainedPhoto(photoUri);cancelAnimation(photo);photo.value=reduced?(photoUri?1:0):withTiming(photoUri?1:0,{duration:motion.profile.photo,easing:Easing.bezier(.22,1,.36,1)});return()=>cancelAnimation(photo)},[photoUri,reduced]);
 const imageStyle=useAnimatedStyle(()=>({opacity:photo.value,transform:[{translateX:-14*(1-photo.value)}]}));
 // Reveal only the space already freed by the title; the photo keeps its
 // final geometry and cannot paint over the moving glyphs halfway through.
 const clipStyle=useAnimatedStyle(()=>({width:48*photo.value}));
 const titleStyle=useAnimatedStyle(()=>({transform:[{translateX:-62*(1-photo.value)}]}));
 return <View style={[styles.row,{paddingTop:top}]}>
  <Pressable accessibilityRole="button" accessibilityLabel={`Modifica nome e foto, ${title}`} accessibilityHint="Apre il pannello di modifica del profilo" onPress={onEdit} style={styles.hit}>
   <Animated.View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.avatarClip,clipStyle]}><Animated.View style={[styles.avatar,{backgroundColor:palette.surface},imageStyle]}>{retainedPhoto&&<Image source={{uri:retainedPhoto}} accessible={false} fadeDuration={0} style={styles.image}/>}</Animated.View></Animated.View>
   <Animated.View style={[styles.titleSlot,titleStyle]}><Label accessibilityRole="header" numberOfLines={2} style={styles.title}>{title}</Label></Animated.View>
  </Pressable>
 </View>;
}

const styles=StyleSheet.create({
 row:{paddingHorizontal:24,paddingBottom:25},hit:{minHeight:48,justifyContent:'center'},
 avatarClip:{position:'absolute',left:0,top:'50%',marginTop:-24,height:48,overflow:'hidden'},avatar:{width:48,height:48,borderRadius:24,overflow:'hidden'},image:{width:48,height:48},
 titleSlot:{marginLeft:62,minHeight:48,justifyContent:'center'},title:typography.page,
});
