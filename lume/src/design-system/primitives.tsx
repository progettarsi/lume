import {haptics} from '../haptics';
import React,{createContext,useContext} from 'react';
import { Pressable,StyleSheet,type TextStyle,type ViewStyle,type StyleProp,type TextProps } from 'react-native';
import Animated,{useAnimatedStyle,useSharedValue,withSpring,type SharedValue} from 'react-native-reanimated';
import Svg,{Path} from 'react-native-svg';
import {phosphorPaths,type IconName} from './phosphorPaths';
import { body,bold,light,spring,metrics,motion,secondaryText,type SurfaceRole,type Palette } from './tokens';
import {useMotionPreference} from '../useMotionPreference';
export const ThemeContext=createContext<{palette:Palette;progress:SharedValue<number>}>({palette:light,progress:{value:0} as SharedValue<number>});
export const SurfaceContext=createContext<SurfaceRole>('paper');
export const useTheme=()=>useContext(ThemeContext);
export function Label({children,style,muted=false,strong=false,...props}:{children:React.ReactNode;style?:React.ComponentProps<typeof Animated.Text>['style'];muted?:boolean;strong?:boolean;numberOfLines?:number;accessibilityRole?:'header'}&Omit<TextProps,'children'|'style'|'accessibilityRole'>){
  // ThemeReveal crossfades the captured old scene. The live scene uses one
  // authoritative palette, without an idle colour mapper for every text node.
  const {palette}=useTheme(),surface=useContext(SurfaceContext);return <Animated.Text {...props} style={[{fontFamily:strong?bold:body,fontSize:17,color:muted?secondaryText(palette,surface):palette.ink},style]}>{children}</Animated.Text>;
}
export function Icon({name,size=metrics.icon,color}:{name:IconName;size?:number;color?:string}){
  const {palette}=useTheme();return <Svg accessible={false} aria-hidden importantForAccessibility="no" width={size} height={size} viewBox="0 0 256 256">{phosphorPaths[name].map((d,i)=><Path key={i} d={d} fill={color||palette.ink}/>)}</Svg>;
}
export function Button({children,onPress,label,style,disabled=false,reduced,haptic=true}:{children:React.ReactNode;onPress:()=>void;label:string;style?:StyleProp<ViewStyle>;disabled?:boolean;reduced?:boolean;haptic?:boolean}){
  const systemReduced=useMotionPreference(),noMotion=reduced??systemReduced;
  const opacity=useSharedValue(1),animated=useAnimatedStyle(()=>({opacity:opacity.value*(disabled ? .5 : 1)}));
  React.useEffect(()=>{if(noMotion||disabled)opacity.value=1},[noMotion,disabled]);
  return <Animated.View style={[{justifyContent:'center'},style,animated]}><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPressIn={()=>opacity.value=noMotion?1:withSpring(motion.feedback.pressedOpacity,spring)} onPressOut={()=>opacity.value=noMotion?1:withSpring(1,spring)} onPress={()=>{if(disabled)return;onPress();if(haptic)haptics.emit('tap')}} style={styles.hit}>{children}</Pressable></Animated.View>;
}
const styles=StyleSheet.create({hit:{minWidth:metrics.touch,minHeight:metrics.touch,alignItems:'center',justifyContent:'center'}});
