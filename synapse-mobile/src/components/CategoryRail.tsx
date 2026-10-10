import {useEffect,useRef,useState} from 'react';
import {Pressable,View,ScrollView,StyleSheet} from 'react-native';
import Animated,{useAnimatedStyle,useSharedValue,withSpring} from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';
import {CATEGORIES} from '../content/categories';
import {Label,useTheme} from './Atoms';
import {useMotionPreference} from '../useMotionPreference';
export function CategoryRail({selected,onSelect,order=[],disabled=()=>false}:{selected:string;onSelect:(id:string)=>void;order?:string[];disabled?:(id:string)=>boolean}){
  const {palette}=useTheme(),reduced=useMotionPreference(),width=useRef(0),content=useRef(0),[atEnd,setAtEnd]=useState(false);
  return <View style={styles.rail} onLayout={e=>{width.current=e.nativeEvent.layout.width;setAtEnd(content.current<=width.current)}}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:6,paddingRight:24}} onContentSizeChange={w=>{content.current=w;setAtEnd(w<=width.current)}} onScroll={e=>setAtEnd(e.nativeEvent.contentOffset.x+width.current>=content.current-4)} scrollEventThrottle={32}>
      {[{id:'all',label:'Per te'},...(order.length?order.flatMap(id=>CATEGORIES.filter(c=>c.id===id)):CATEGORIES)].map(c=><Chip key={c.id} label={c.label} disabled={disabled(c.id)} reduced={reduced} selected={selected===c.id} onPress={()=>onSelect(c.id)}/>)}
    </ScrollView>
    {!atEnd&&<LinearGradient pointerEvents="none" colors={[palette.paper+'00',palette.paper]} start={{x:0,y:.5}} end={{x:1,y:.5}} style={styles.fade}/>}
  </View>;
}
function Chip({label,selected,onPress,reduced,disabled}:{label:string;selected:boolean;onPress:()=>void;reduced:boolean;disabled:boolean}){
  const {palette}=useTheme(),fill=useSharedValue(selected?1:0),press=useSharedValue(1);
  useEffect(()=>{fill.value=reduced?(selected?1:0):withSpring(selected?1:0,{stiffness:550,damping:30,mass:.55});if(reduced)press.value=1},[selected,reduced]);
  const selection=useAnimatedStyle(()=>({transform:[{scale:fill.value}]})),pulse=useAnimatedStyle(()=>({transform:[{scale:press.value}]}));
  return <Animated.View style={pulse}><Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{selected,disabled}} accessibilityLabel={label} onPress={onPress} onPressIn={()=>press.value=reduced?1:withSpring(.96,{stiffness:650,damping:32})} onPressOut={()=>press.value=reduced?1:withSpring(1,{stiffness:650,damping:32})} style={[styles.chip,{backgroundColor:palette.surface,opacity:disabled?.45:1}]}>
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,{borderRadius:24,backgroundColor:palette.active},selection]}/><Label strong style={{fontSize:15}}>{label}</Label>
  </Pressable></Animated.View>;
}
const styles=StyleSheet.create({rail:{height:48,overflow:'hidden'},chip:{height:44,paddingHorizontal:18,borderRadius:24,justifyContent:'center',overflow:'hidden'},fade:{position:'absolute',right:-1,top:0,bottom:0,width:32}});
