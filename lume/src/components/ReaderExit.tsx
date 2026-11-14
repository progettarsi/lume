import {View,StyleSheet,useWindowDimensions} from 'react-native';
import Animated,{useAnimatedStyle,useSharedValue,type SharedValue} from 'react-native-reanimated';
import {useTheme} from './Atoms';
import type {ReactNode} from 'react';
import {exitCut} from '../content/readerReturn';

// Paint-only retreat. Keep native scroll extent and the shaped text unchanged.
// The user retained the existing accelerated reverse expansion.
export function ReaderExit({children,exit,scroll,viewport,bodyY,expandedY,reduced,size}:{children:ReactNode;exit:SharedValue<number>;scroll:SharedValue<number>;viewport:SharedValue<number>;bodyY:SharedValue<number>;expandedY:SharedValue<number>;reduced:boolean;size:number}){
  const {palette}=useTheme(),height=useSharedValue(0),{fontScale}=useWindowDimensions();
  const cover=useAnimatedStyle(()=>{
    const cut=exitCut(height.value,scroll.value,viewport.value,16+bodyY.value+expandedY.value,exit.value,size*1.5*fontScale);
    return {opacity:reduced||exit.value<=0?0:1,transform:[{translateY:cut}]};
  },[reduced,size,fontScale]);
  return <Animated.View style={{overflow:'hidden'}} onLayout={e=>{height.value=e.nativeEvent.layout.height}}>
    {children}
    <Animated.View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill,cover]}>
      <View style={[StyleSheet.absoluteFill,{backgroundColor:palette.paper}]}/>
    </Animated.View>
  </Animated.View>;
}
