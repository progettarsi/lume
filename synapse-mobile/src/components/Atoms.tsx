import React,{createContext,useContext} from 'react';
import { Pressable,StyleSheet,type TextStyle,type ViewStyle,type StyleProp,type TextProps } from 'react-native';
import Animated,{useAnimatedStyle,useSharedValue,withSpring,type SharedValue} from 'react-native-reanimated';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { body,bold,light,spring,type Palette } from '../theme';
import {useMotionPreference} from '../useMotionPreference';
export const ThemeContext=createContext<{palette:Palette;progress:SharedValue<number>}>({palette:light,progress:{value:0} as SharedValue<number>});
export const useTheme=()=>useContext(ThemeContext);
export function Label({children,style,muted=false,strong=false,...props}:{children:React.ReactNode;style?:React.ComponentProps<typeof Animated.Text>['style'];muted?:boolean;strong?:boolean;numberOfLines?:number;accessibilityRole?:'header'}&Omit<TextProps,'children'|'style'|'accessibilityRole'>){
  // ThemeReveal crossfades the captured old scene. The live scene uses one
  // authoritative palette, without an idle colour mapper for every text node.
  const {palette}=useTheme();return <Animated.Text {...props} style={[{fontFamily:strong?bold:body,fontSize:17,color:muted?palette.muted:palette.ink},style]}>{children}</Animated.Text>;
}
export function Icon({name,size=24,color}:{name:React.ComponentProps<typeof MaterialCommunityIcons>['name'];size?:number;color?:string}){
  const {palette}=useTheme();return <MaterialCommunityIcons accessible={false} aria-hidden importantForAccessibility="no" name={name} size={size} color={color||palette.ink}/>;
}
export function Button({children,onPress,label,style,disabled=false,reduced}:{children:React.ReactNode;onPress:()=>void;label:string;style?:StyleProp<ViewStyle>;disabled?:boolean;reduced?:boolean}){
  const systemReduced=useMotionPreference(),noMotion=reduced??systemReduced;
  const scale=useSharedValue(1),animated=useAnimatedStyle(()=>({transform:[{scale:scale.value}]}));
  React.useEffect(()=>{if(noMotion)scale.value=1},[noMotion]);
  return <Animated.View style={[{justifyContent:'center'},style,animated]}><Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPressIn={()=>scale.value=noMotion?1:withSpring(.94,spring)} onPressOut={()=>scale.value=noMotion?1:withSpring(1,spring)} onPress={onPress} style={styles.hit}>{children}</Pressable></Animated.View>;
}
const styles=StyleSheet.create({hit:{minWidth:48,minHeight:48,alignItems:'center',justifyContent:'center'}});
