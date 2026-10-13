import React,{type ReactNode} from 'react';
import {StyleSheet,View} from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import {LinearGradient} from 'expo-linear-gradient';
import Animated,{useAnimatedScrollHandler,useAnimatedStyle,useSharedValue} from 'react-native-reanimated';
import {scrollEdgeOpacity} from '../../content/onboardingLayout';

/** Alpha belongs to the chip viewport; the moving decorations stay outside. */
export function InterestScrollMask({children,visible}:{children:ReactNode;visible:boolean}){
 const offset=useSharedValue(0),viewport=useSharedValue(0),content=useSharedValue(0);
 const scroll=useAnimatedScrollHandler(e=>{if(visible)offset.value=Math.max(0,e.contentOffset.y)});
 const top=useAnimatedStyle(()=>({opacity:1-scrollEdgeOpacity(offset.value,32)}));
 const bottom=useAnimatedStyle(()=>({opacity:1-scrollEdgeOpacity(content.value-viewport.value-offset.value,28)}));
 return <MaskedView testID="interest-alpha-mask" style={{flex:1}} androidRenderingMode={visible?'software':'hardware'} maskElement={
  <View pointerEvents="none" accessible={false} style={{flex:1}}>
   <View style={{height:32}}><LinearGradient colors={['#00000000','#000000']} style={StyleSheet.absoluteFill}/><Animated.View style={[StyleSheet.absoluteFill,{backgroundColor:'#000'},top]}/></View>
   <View style={{flex:1,backgroundColor:'#000'}}/>
   <View style={{height:28}}><LinearGradient colors={['#000000','#00000000']} style={StyleSheet.absoluteFill}/><Animated.View style={[StyleSheet.absoluteFill,{backgroundColor:'#000'},bottom]}/></View>
  </View>
 }>
  <Animated.ScrollView onLayout={e=>{viewport.value=e.nativeEvent.layout.height}} onContentSizeChange={(_,height)=>{content.value=height}} onScroll={scroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:30}}>{children}</Animated.ScrollView>
 </MaskedView>;
}
