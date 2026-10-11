import React from 'react';
import {Image,View,type ViewStyle,type StyleProp} from 'react-native';
import {Label,useTheme} from './Atoms';
import {heading} from '../theme';
import type {MotionEnvironment,OrganicShapeKind} from '../content/onboardingPresentation';
const SHAPES={
 'identity-action':require('../../assets/onboarding/button-identity.png'),
 'interests-action':require('../../assets/onboarding/button-interests.png'),
 preparation:require('../../assets/onboarding/cookie-preparation.png'),
 flower:require('../../assets/onboarding/flower.png'),
 'soft-boom':require('../../assets/onboarding/soft-boom.png'),
 'soft-burst':require('../../assets/onboarding/soft-burst.png'),
 puffy:require('../../assets/onboarding/puffy.png'),
};
/** Correct static assets until C supplies real organic path interpolation.
 * B sizes a wrapper and preserves the source aspect ratio. */
export function OrganicShapeSlot({kind,size,motion,style}:{kind:OrganicShapeKind;size:number;motion:MotionEnvironment;style?:StyleProp<ViewStyle>}){
 return <View pointerEvents="none" accessible={false} style={[{width:size,height:size},style]}><Image source={SHAPES[kind]} resizeMode="contain" style={{width:size,height:size}}/></View>;
}
export function OnboardingTitleSlot({title,titleKey,motion}:{title:string;titleKey:string;motion:MotionEnvironment}){
 const {palette}=useTheme();return <View testID="onboarding-title-slot" style={{minHeight:86}}><Label accessibilityRole="header" style={{fontFamily:heading,fontSize:36,lineHeight:43,color:palette.ink}}>{title}</Label></View>;
}
export type TutorialGestureSlotProps={cardIndex:0|1;hintStopped:boolean;motion:MotionEnvironment;onInteract:()=>void;onSwipe:(direction:'next'|'previous')=>void;children:React.ReactNode};
/** B places two cards here; C implements the interruptible UI-thread gesture.
 * The accessible next-card button remains available in every phase. */
export function TutorialGestureSlot({children,..._props}:TutorialGestureSlotProps){return <View testID="tutorial-gesture-slot">{children}</View>}
