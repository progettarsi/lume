import {motion as motionTokens} from '../theme';
import {useLayoutEffect,useState} from 'react';
import {View,Pressable,StyleSheet,useWindowDimensions} from 'react-native';
import Animated,{cancelAnimation,useSharedValue,useAnimatedStyle,withSpring} from 'react-native-reanimated';
import {useMotionPreference} from '../useMotionPreference';
import {Icon,Label,Button,useTheme} from './Atoms';
import {DockIcon} from './DockIcon';
type Destination='home'|'profile';
const motion=motionTokens.dock;
function visibility(p:number){'worklet';const t=Math.max(0,Math.min(1,p));return t*t*(3-2*t)}
// One continuous coordinate governs pill, tracks, icons and text. Text is laid
// out at its final intrinsic width; only its parent clips and its paint fades.
export function Dock({selected,onNavigate,onSearch,bottom,availableWidth,disabled=false,closing=false,reducedOverride,fontScaleOverride,iconRevision={home:0,profile:0},active=true,visible=true}:{selected:Destination;onNavigate:(id:Destination)=>void;onSearch:()=>void;bottom:number;availableWidth:number;disabled?:boolean;closing?:boolean;reducedOverride?:boolean;fontScaleOverride?:number;iconRevision?:Record<Destination,number>;active?:boolean;visible?:boolean}){
 const {palette}=useTheme(),window=useWindowDimensions(),reduced=useMotionPreference();
 const fontScale=fontScaleOverride??window.fontScale,p=useSharedValue(selected==='home'?0:1);
 const [labels,setLabels]=useState({home:32*fontScale,profile:40*fontScale,homeReady:false,profileReady:false});
 const noMotion=reducedOverride??reduced;
 useLayoutEffect(()=>{cancelAnimation(p);p.value=noMotion?(selected==='home'?0:1):withSpring(selected==='home'?0:1,motion);return()=>cancelAnimation(p)},[selected,noMotion]);
 const navHeight=Math.max(60,Math.ceil(18*fontScale+28)),pillHeight=Math.max(40,Math.ceil(18*fontScale+16));
 // Concentric capsules: the horizontal inset equals the vertical gap, including
 // text scaling. Budget both insets before distributing the two touch tracks.
 const inset=(navHeight-pillHeight)/2;
 const navWidth=Math.min(Math.max(128,availableWidth-68),Math.max(152,Math.max(labels.home,labels.profile)+56+48+2*inset)),inner=navWidth-2*inset;
 const home=Math.min(inner-48,labels.home+56),profile=Math.min(inner-48,labels.profile+56);
 const total=navWidth+68;
 // onLayout may quantize a fractional glyph advance before reporting it.
 // An upper pixel bound avoids ellipsis at that boundary at every density.
 const measure=(id:Destination,width:number)=>{const bound=Math.ceil(width)+1;if(width>0)setLabels(old=>old[id]===bound&&old.homeReady&&old.profileReady?old:{...old,[id]:bound,homeReady:id==='home'||old.homeReady,profileReady:id==='profile'||old.profileReady})};
 const pill=useAnimatedStyle(()=>{const q=Math.max(-.035,Math.min(1.035,p.value));const w=home+(profile-home)*q;return {transform:[{translateX:(inner-profile)*q+(w-home)/2},{scaleX:w/home}]}});
 const homeCell={width:inner};
 const profileCell=useAnimatedStyle(()=>{const q=Math.max(0,Math.min(1,p.value)),x=home+(inner-profile-home)*q;return {width:inner,transform:[{translateX:x}]}});
 const homeIcon=useAnimatedStyle(()=>{const q=Math.max(0,Math.min(1,p.value));return {opacity:1-.4*q,transform:[{translateX:12+((inner-profile)/2-24)*q}]}});
 const profileIcon=useAnimatedStyle(()=>{const q=Math.max(0,Math.min(1,p.value));return {opacity:.6+.4*q,transform:[{translateX:(inner-home)/2-12+(24-(inner-home)/2)*q}]}});
 const homeText=useAnimatedStyle(()=>({opacity:1-visibility(p.value/.5),transform:[{translateX:-4*visibility(p.value/.5)}]}));
 const profileText=useAnimatedStyle(()=>({opacity:visibility((p.value-.5)/.5),transform:[{translateX:4*(1-visibility((p.value-.5)/.5))}]}));
 const textSize=fontScaleOverride?14*fontScale:14,textLine=fontScaleOverride?18*fontScale:18;
 // Keep the measured dock warm beneath settings/search. Rebuilding it on
 // every return costs native text measurement and briefly hides its controls.
 return <View testID="synapse-dock" style={[styles.dock,{opacity:visible&&labels.homeReady&&labels.profileReady?1:0,bottom:bottom+14,width:total,marginLeft:-total/2,height:navHeight,zIndex:closing?45:20}]} pointerEvents={disabled||!visible?'none':'auto'} aria-hidden={disabled||!visible} accessibilityElementsHidden={disabled||!visible} importantForAccessibility={disabled||!visible?'no-hide-descendants':'auto'}>
  <View testID="dock-capsule" style={[styles.nav,{width:navWidth,height:navHeight,borderRadius:navHeight/2,backgroundColor:palette.surface}]}>
   <Animated.View testID="dock-pill" pointerEvents="none" accessible={false} style={[styles.pill,{left:inset,top:inset,width:home,height:pillHeight,borderRadius:pillHeight/2,backgroundColor:palette.active},pill]}/>
   <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.cell,{left:inset,height:navHeight-8},homeCell]}>
    <View style={styles.hit}>
     <Animated.View style={[styles.icon,homeIcon]}><DockIcon name="home" revision={iconRevision.home} active={visible&&active&&!disabled&&selected==='home'} reduced={noMotion}/></Animated.View>
     <Label allowFontScaling={fontScaleOverride===undefined} accessible={false} strong numberOfLines={1} style={[styles.label,{fontSize:textSize,lineHeight:textLine,width:labels.home},homeText]}>Home</Label>
    </View>
   </Animated.View>
   <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.cell,{left:inset,height:navHeight-8},profileCell]}>
    <View style={styles.hit}>
     <Animated.View style={[styles.icon,profileIcon]}><DockIcon name="profile" revision={iconRevision.profile} active={visible&&active&&!disabled&&selected==='profile'} reduced={noMotion}/></Animated.View>
     <Label allowFontScaling={fontScaleOverride===undefined} accessible={false} strong numberOfLines={1} style={[styles.label,{fontSize:textSize,lineHeight:textLine,width:labels.profile},profileText]}>Profilo</Label>
    </View>
   </Animated.View>
   <Pressable accessibilityRole="tab" accessibilityState={{selected:selected==='home'}} aria-selected={selected==='home'} accessibilityLabel="Home, due tocchi rapidi per aggiornare" onPress={()=>onNavigate('home')} style={[styles.hit,{position:'absolute',left:inset,top:4,height:navHeight-8,width:selected==='home'?home:inner-profile}]}/>
   <Pressable accessibilityRole="tab" accessibilityState={{selected:selected==='profile'}} aria-selected={selected==='profile'} accessibilityLabel="Profilo" onPress={()=>onNavigate('profile')} style={[styles.hit,{position:'absolute',left:inset+(selected==='home'?home:inner-profile),top:4,height:navHeight-8,width:selected==='home'?inner-home:profile}]}/>
   <View pointerEvents="none" accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.measure,{width:navWidth,height:navHeight}]}>
    {(['home','profile'] as const).map(id=><Label allowFontScaling={fontScaleOverride===undefined} key={`${id}:${fontScale}`} strong numberOfLines={1} onLayout={e=>measure(id,e.nativeEvent.layout.width)} style={{alignSelf:'flex-start',fontSize:textSize,lineHeight:textLine}}>{id==='home'?'Home':'Profilo'}</Label>)}
   </View>
  </View>
  <Button reduced={noMotion} label="Cerca" onPress={onSearch} style={{width:56,height:56,borderRadius:28,backgroundColor:palette.active}}><Icon name="magnify" size={27}/></Button>
 </View>;
}
const styles=StyleSheet.create({dock:{position:'absolute',left:'50%',flexDirection:'row',alignItems:'center',gap:12},nav:{overflow:'hidden'},pill:{position:'absolute'},cell:{position:'absolute',top:4,overflow:'hidden',minWidth:48},hit:{flex:1,justifyContent:'center',minHeight:48},icon:{position:'absolute',width:24,height:24,alignItems:'center',justifyContent:'center'},label:{position:'absolute',left:44,includeFontPadding:false},measure:{position:'absolute',left:0,top:0,opacity:0}});

