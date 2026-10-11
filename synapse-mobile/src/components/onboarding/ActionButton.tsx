import React,{useEffect} from 'react';
import {Image,Pressable,StyleSheet,View,type StyleProp,type ViewStyle} from 'react-native';
import Animated,{useAnimatedStyle,useSharedValue,withTiming,withSequence,cancelAnimation,Easing} from 'react-native-reanimated';
import {Label,useTheme} from '../Atoms';
import {ONBOARDING_MOTION,type MotionEnvironment,type OrganicShapeKind} from '../../content/onboardingPresentation';
import {OrganicShapeSlot} from '../OnboardingMotionSlots';
const easeOut=Easing.bezier(.22,1,.36,1);
function usePressBounce(motion:MotionEnvironment,disabled:boolean){
 const y=useSharedValue(0),enabled=!disabled&&!motion.reduced&&motion.visible&&motion.appActive;
 useEffect(()=>{if(!enabled){cancelAnimation(y);y.value=0}return()=>cancelAnimation(y)},[enabled]);
 return {style:useAnimatedStyle(()=>({transform:[{translateY:y.value}]})),onPressIn:()=>{cancelAnimation(y);if(enabled)y.value=withTiming(ONBOARDING_MOTION.bounce.translateY,{duration:70,easing:easeOut})},onPressOut:()=>{cancelAnimation(y);y.value=enabled?withSequence(withTiming(-1,{duration:96,easing:easeOut}),withTiming(0,{duration:64,easing:easeOut})):0}};
}
export interface ActionButtonProps {label:string;onPress:()=>void;disabled?:boolean;shapeKind?:OrganicShapeKind;motion:MotionEnvironment;style?:StyleProp<ViewStyle>;testID?:string}
export function ActionButton({label,onPress,disabled=false,shapeKind='round-action',motion,style,testID}:ActionButtonProps){
 const {palette}=useTheme(),bounce=usePressBounce(motion,disabled);
 return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPressIn={bounce.onPressIn} onPressOut={bounce.onPressOut} onPress={onPress} style={[styles.hitbox,style]}>
  <Animated.View pointerEvents="none" style={[styles.shapeWrapper,bounce.style]}><OrganicShapeSlot kind={shapeKind} size={50} motion={motion}/></Animated.View>
  <Image source={require('../../../assets/onboarding/arrow.png')} style={[styles.arrow,{tintColor:palette.ink}]} resizeMode="contain" accessible={false}/>
 </Pressable>;
}
export function SkipButton({label,onPress,disabled=false,motion}:{label:string;onPress:()=>void;disabled?:boolean;motion:MotionEnvironment}){
 const {palette}=useTheme(),bounce=usePressBounce(motion,disabled);
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPressIn={bounce.onPressIn} onPressOut={bounce.onPressOut} onPress={onPress} style={{minHeight:48,paddingHorizontal:24,paddingVertical:12,justifyContent:'center'}}>
  <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,{borderRadius:28,backgroundColor:palette.surface},bounce.style]}/><Label style={{fontSize:16,lineHeight:22,includeFontPadding:false,textAlign:'center'}}>Salta</Label>
 </Pressable>;
}
const styles=StyleSheet.create({hitbox:{width:56,height:56,alignItems:'center',justifyContent:'center'},shapeWrapper:{position:'absolute',width:50,height:50,alignItems:'center',justifyContent:'center'},arrow:{width:24,height:17}});
