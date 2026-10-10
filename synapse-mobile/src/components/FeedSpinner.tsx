import {useEffect} from 'react';
import Animated,{useSharedValue,useAnimatedStyle,withRepeat,withTiming,Easing,cancelAnimation} from 'react-native-reanimated';
import Svg,{Path} from 'react-native-svg';
import {useTheme} from './Atoms';
import {useMotionPreference} from '../useMotionPreference';

// Thin, tapered arc aligned with the Newsreader wordmark's optical centre.
export function FeedSpinner(){
 const {palette}=useTheme(),reduced=useMotionPreference(),angle=useSharedValue(0);
 useEffect(()=>{angle.value=reduced?0:withRepeat(withTiming(360,{duration:1200,easing:Easing.linear}),-1,false);return()=>cancelAnimation(angle)},[reduced]);
 const rotation=useAnimatedStyle(()=>({transform:[{rotate:`${angle.value}deg`}]}));
 return <Animated.View accessible accessibilityRole="progressbar" accessibilityLabel="Caricamento" style={[{width:24,height:24},rotation]}><Svg width={24} height={24} viewBox="0 0 24 24"><Path fill={palette.accent} d="M12 2 C17.52 2 22 6.48 22 12 C22 17.52 17.52 22 12 22 L12 20.8 C16.86 20.8 20.8 16.86 20.8 12 C20.8 7.14 16.86 3.2 12 3.2 Z"/></Svg></Animated.View>;
}
