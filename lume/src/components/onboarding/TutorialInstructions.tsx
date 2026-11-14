import React,{useState} from 'react';
import {View,useWindowDimensions} from 'react-native';
import Animated,{useAnimatedStyle,type SharedValue} from 'react-native-reanimated';
import {Label} from '../Atoms';
import {OnboardingTitleSlot} from '../OnboardingMotionSlots';
import {TUTORIAL} from '../../content/onboarding';
function Instruction({index,active,position,reduced,onHeight}:{index:number;active:number;position:SharedValue<number>;reduced:boolean;onHeight:(height:number)=>void}){
 const style=useAnimatedStyle(()=>({opacity:reduced?(Math.round(position.value)===index?1:0):Math.max(0,1-Math.abs(position.value-index)*2),transform:[{translateY:reduced?0:Math.max(-1,Math.min(1,index-position.value))*8}]}));
 return <Animated.View pointerEvents="none" aria-hidden={active!==index} accessibilityElementsHidden={active!==index} importantForAccessibility={active===index?'auto':'no-hide-descendants'} onLayout={e=>onHeight(e.nativeEvent.layout.height)} style={[{position:'absolute',left:0,right:0,top:0,gap:8},style]}>
  <Label accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{fontFamily:'Newsreader_400Regular',fontSize:36,lineHeight:43,opacity:0}}>{TUTORIAL[index].title}</Label>
  <Label style={{fontSize:17,lineHeight:25}}>{TUTORIAL[index].body}</Label>
 </Animated.View>;
}
export function TutorialInstructions({index,position,reduced,motion}:{index:number;position:SharedValue<number>;reduced:boolean;motion:import('../../content/onboardingPresentation').MotionEnvironment}){
 const {fontScale}=useWindowDimensions(),[heights,setHeights]=useState<number[]>([]);
 return <View testID="tutorial-instructions" style={{marginHorizontal:24,height:heights.filter(Boolean).length===TUTORIAL.length?Math.max(...heights):Math.ceil(169*fontScale),marginBottom:16}}>
  <View pointerEvents="none" style={{position:'absolute',left:0,right:0,top:0}}><OnboardingTitleSlot title={TUTORIAL[index].title} titleKey={`tutorial-${index}`} motion={motion}/></View>
  {TUTORIAL.map((step,i)=><Instruction key={step.id} index={i} active={index} {...{position,reduced}} onHeight={height=>setHeights(old=>{if(old[i]===height)return old;const next=[...old];next[i]=height;return next})}/>)}
 </View>;
}
