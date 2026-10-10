import {useEffect,useRef,useState,useMemo} from 'react';
import {Pressable,View,ScrollView,StyleSheet} from 'react-native';
import Animated,{
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  LinearTransition,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';
import {CATEGORIES} from '../content/categories';
import type {CategoryRailItem} from '../content/categoryRegistry';
import {Icon,Label,useTheme} from './Atoms';
import {useMotionPreference} from '../useMotionPreference';

export function CategoryRail({
  selected,
  onSelect,
  items,
  order=[],
  disabled=()=>false,
  onInteractionStart,
  onInteractionEnd,
  reducedOverride,
}:{
  selected:string;
  onSelect:(id:string)=>void;
  items?:CategoryRailItem[];
  order?:string[];
  disabled?:(id:string)=>boolean;
  onInteractionStart?:()=>void;
  onInteractionEnd?:()=>void;
  reducedOverride?:boolean;
}){
  const {palette}=useTheme(),systemReduced=useMotionPreference();
  const reduced=reducedOverride??systemReduced;
  const width=useRef(0),content=useRef(0),[atEnd,setAtEnd]=useState(false);

  // Normalize rail items deriving solely from contracts; fallback for legacy harnesses
  const railItems = useMemo(()=>{
    if(items) return items.filter(c=>c.visible);
    return [
      {id:'all',label:'Per Te',icon:'compass-outline',selected:selected==='all',order:0,visible:true,enabled:true,actions:['select' as const]},
      ...(order.length?order.flatMap(id=>CATEGORIES.filter(c=>c.id===id)):CATEGORIES).map((c,i)=>({
        id:c.id,
        label:c.label,
        icon:c.icon||'tag-outline',
        selected:selected===c.id,
        order:i+1,
        visible:true,
        enabled:!disabled(c.id),
        actions:['select' as const],
      }))
    ];
  },[items,order,selected,disabled]);

  return <View style={styles.rail} onLayout={e=>{width.current=e.nativeEvent.layout.width;setAtEnd(content.current<=width.current)}}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      onTouchStart={onInteractionStart}
      onTouchEnd={onInteractionEnd}
      onTouchCancel={onInteractionEnd}
      onScrollBeginDrag={onInteractionStart}
      onMomentumScrollBegin={onInteractionStart}
      onMomentumScrollEnd={onInteractionEnd}
      onScrollEndDrag={onInteractionEnd}
      onContentSizeChange={w=>{content.current=w;setAtEnd(w<=width.current)}}
      onScroll={e=>setAtEnd(e.nativeEvent.contentOffset.x+width.current>=content.current-4)}
      scrollEventThrottle={32}
    >
      {railItems.map(c=>(
        <RailChip
          key={c.id}
          id={c.id}
          label={c.label}
          icon={c.icon}
          reason={c.reason}
          disabled={!c.enabled}
          reduced={reduced}
          selected={selected===c.id}
          onPress={()=>onSelect(c.id)}
        />
      ))}
    </ScrollView>
    {!atEnd&&<LinearGradient pointerEvents="none" colors={[palette.paper+'00',palette.paper]} start={{x:0,y:.5}} end={{x:1,y:.5}} style={styles.fade}/>}
  </View>;
}

function RailChip({
  id,
  label,
  icon,
  reason,
  selected,
  onPress,
  reduced,
  disabled,
}:{
  id:string;
  label:string;
  icon?:string;
  reason?:'offline'|'exhausted'|'service'|'limit'|'unavailable';
  selected:boolean;
  onPress:()=>void;
  reduced:boolean;
  disabled:boolean;
}){
  const {palette}=useTheme(),fill=useSharedValue(selected?1:0),press=useSharedValue(1);

  useEffect(()=>{
    fill.value=reduced?(selected?1:0):withSpring(selected?1:0,{stiffness:550,damping:30,mass:.55});
    if(reduced)press.value=1;
  },[selected,reduced]);

  const selection=useAnimatedStyle(()=>({transform:[{scale:fill.value}]}));
  const pulse=useAnimatedStyle(()=>({transform:[{scale:press.value}]}));

  // Reanimated layout transitions for entry, exit and neighbor coordination
  const layoutTransition = reduced
    ? undefined
    : LinearTransition.springify().damping(28).stiffness(380).mass(0.7);

  const enteringAnim = reduced
    ? undefined
    : FadeIn.duration(180);

  const exitingAnim = reduced
    ? undefined
    : FadeOut.duration(140);

  // Accessible hint and label
  const accessibilityLabel = reason==='offline'
    ? `${label}, non disponibile offline`
    : reason==='exhausted'
    ? `${label}, esaurito`
    : label;

  return (
    <Animated.View
      layout={layoutTransition}
      entering={enteringAnim}
      exiting={exitingAnim}
      style={pulse}
    >
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        accessibilityState={{selected,disabled}}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={disabled?`Categoria momentaneamente non selezionabile (${reason||'non disponibile'})`:undefined}
        onPress={onPress}
        onPressIn={()=>press.value=reduced?1:withSpring(.96,{stiffness:650,damping:32})}
        onPressOut={()=>press.value=reduced?1:withSpring(1,{stiffness:650,damping:32})}
        style={[
          styles.chip,
          {
            backgroundColor:palette.surface,
            opacity:disabled?0.42:1,
          }
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill,{borderRadius:24,backgroundColor:palette.active},selection]}
        />
        <View style={styles.chipContent}>
          {!!icon&&(
            <Icon
              name={icon as any}
              size={18}
              color={disabled?palette.muted:selected?palette.ink:palette.ink}
            />
          )}
          <Label strong style={{fontSize:15}}>{label}</Label>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles=StyleSheet.create({
  rail:{height:48,overflow:'hidden'},
  scrollContent:{gap:6,paddingRight:24,alignItems:'center'},
  chip:{height:44,paddingHorizontal:16,borderRadius:24,justifyContent:'center',overflow:'hidden'},
  chipContent:{flexDirection:'row',alignItems:'center',gap:7},
  fade:{position:'absolute',right:-1,top:0,bottom:0,width:32},
});
