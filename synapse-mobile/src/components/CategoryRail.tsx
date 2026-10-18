import {useEffect,useLayoutEffect,useRef,useState,useMemo} from 'react';
import {Pressable,View,StyleSheet} from 'react-native';
import Animated,{
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
  LinearTransition,
  FadeIn,
  withTiming,
  cancelAnimation,
  runOnJS,
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
  const width=useSharedValue(0),content=useSharedValue(0),scrollX=useSharedValue(0);
  const touch=useRef(false),drag=useRef(false),momentum=useRef(false),endFrame=useRef<number|undefined>(undefined);
  const begin=()=>{if(endFrame.current!==undefined)cancelAnimationFrame(endFrame.current);onInteractionStart?.()};
  const end=()=>{if(endFrame.current!==undefined)cancelAnimationFrame(endFrame.current);endFrame.current=requestAnimationFrame(()=>{endFrame.current=undefined;if(!touch.current&&!drag.current&&!momentum.current)onInteractionEnd?.()})};
  useEffect(()=>()=>{if(endFrame.current!==undefined)cancelAnimationFrame(endFrame.current);onInteractionEnd?.()},[]);

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
  type Ghost={item:CategoryRailItem;rect:{x:number;y:number;width:number;height:number};token:number};
  const previous=useRef(railItems),rects=useRef(new Map<string,Ghost['rect']>()),generation=useRef(0),[ghosts,setGhosts]=useState<Ghost[]>([]);
  const membership=railItems.map(c=>c.id).join(':');
  useLayoutEffect(()=>{
    const live=new Set(railItems.map(c=>c.id));
    const removed=reduced?[]:previous.current.filter(c=>!live.has(c.id)&&rects.current.has(c.id)).map(item=>({item,rect:rects.current.get(item.id)!,token:++generation.current}));
    setGhosts(old=>[...(reduced?[]:old.filter(g=>!live.has(g.item.id))),...removed]);
    previous.current=railItems;
  },[membership,reduced]);
  const exited=(token:number)=>setGhosts(old=>old.filter(g=>g.token!==token));
  // Both edge fades follow native geometry. Scrolling sends no per-frame JS
  // callbacks or React state updates, including during momentum/reversal.
  const scroll=useAnimatedScrollHandler(e=>{scrollX.value=e.contentOffset.x});
  const leftFade=useAnimatedStyle(()=>{
    const progress=Math.max(0,Math.min(1,scrollX.value/32));
    return {opacity:progress*progress*(3-2*progress)};
  });
  const rightFade=useAnimatedStyle(()=>({opacity:scrollX.value+width.value>=content.value-4?0:1}));

  return <View style={styles.rail} onLayout={e=>{width.value=e.nativeEvent.layout.width}}>
    <Animated.ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      onTouchStart={()=>{touch.current=true;begin()}}
      onTouchEnd={()=>{touch.current=false;end()}}
      onTouchCancel={()=>{touch.current=false;end()}}
      onScrollBeginDrag={()=>{drag.current=true;begin()}}
      onMomentumScrollBegin={()=>{momentum.current=true;begin()}}
      onMomentumScrollEnd={()=>{momentum.current=false;end()}}
      onScrollEndDrag={()=>{drag.current=false;end()}}
      onContentSizeChange={w=>{content.value=w}}
      onScroll={scroll}
      scrollEventThrottle={16}
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
          onLayout={rect=>rects.current.set(c.id,rect)}
        />
      ))}
      {ghosts.map(g=><RailChip {...g.item} key={`exit:${g.item.id}:${g.token}`} selected={selected===g.item.id} disabled reduced={reduced} onPress={()=>{}} ghost={g.rect} onExited={()=>exited(g.token)}/>)}
    </Animated.ScrollView>
    <Animated.View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.fade,{right:undefined,left:-1},leftFade]}><LinearGradient colors={[palette.paper,palette.paper+'00']} start={{x:0,y:.5}} end={{x:1,y:.5}} style={StyleSheet.absoluteFill}/></Animated.View>
    <Animated.View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.fade,rightFade]}><LinearGradient colors={[palette.paper+'00',palette.paper]} start={{x:0,y:.5}} end={{x:1,y:.5}} style={StyleSheet.absoluteFill}/></Animated.View>
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
  onLayout,
  ghost,
  onExited,
}:{
  id:string;
  label:string;
  icon?:string;
  reason?:'offline'|'exhausted'|'service'|'limit'|'unavailable';
  selected:boolean;
  onPress:()=>void;
  reduced:boolean;
  disabled:boolean;
  onLayout?:(rect:{x:number;y:number;width:number;height:number})=>void;
  ghost?:{x:number;y:number;width:number;height:number};
  onExited?:()=>void;
}){
  const {palette}=useTheme(),fill=useSharedValue(selected?1:0),press=useSharedValue(0),opacity=useSharedValue(1);

  useEffect(()=>{
    fill.value=reduced?(selected?1:0):withSpring(selected?1:0,{stiffness:550,damping:30,mass:.55});
    if(reduced)press.value=0;
  },[selected,reduced]);
  useEffect(()=>{if(ghost)opacity.value=withTiming(0,{duration:reduced?0:140},done=>{if(done&&onExited)runOnJS(onExited)()})},[ghost,reduced]);

  useEffect(()=>()=>{cancelAnimation(fill);cancelAnimation(press);cancelAnimation(opacity)},[]);

  const selection=useAnimatedStyle(()=>({transform:[{scale:fill.value}]}));
  const pulse=useAnimatedStyle(()=>({opacity:press.value}));
  const fading=useAnimatedStyle(()=>({opacity:opacity.value}));

  // Reanimated layout transitions for entry, exit and neighbor coordination
  const layoutTransition = reduced
    ? undefined
    : LinearTransition.springify().damping(28).stiffness(380).mass(0.7);

  const enteringAnim = reduced
    ? undefined
    : FadeIn.duration(180);

  // Accessible hint and label
  const accessibilityLabel = reason==='offline'
    ? `${label}, non disponibile offline`
    : reason==='exhausted'
    ? `${label}, esaurito`
    : label;

  return (
    <Animated.View
      layout={ghost?undefined:layoutTransition}
      entering={ghost?undefined:enteringAnim}
      onLayout={ghost?undefined:e=>onLayout?.(e.nativeEvent.layout)}
      pointerEvents={ghost?'none':'auto'}
      accessibilityElementsHidden={!!ghost}
      importantForAccessibility={ghost?'no-hide-descendants':'auto'}
      style={[ghost?{position:'absolute',left:ghost.x,top:ghost.y,width:ghost.width,height:ghost.height}:undefined,fading]}
    >
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        accessible={!ghost}
        focusable={!ghost&&!disabled}
        accessibilityState={{selected,disabled}}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={disabled?`Categoria momentaneamente non selezionabile (${reason||'non disponibile'})`:undefined}
        onPress={()=>{if(!ghost&&!disabled)onPress()}}
        onPressIn={()=>press.value=reduced?0:withTiming(.16,{duration:80})}
        onPressOut={()=>press.value=withTiming(0,{duration:100})}
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
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,{borderRadius:24,backgroundColor:palette.accent},pulse]}/>
        <View style={styles.chipContent}>
          {!!icon&&(
            <Icon
              name={icon as any}
              size={18}
              color={disabled?palette.muted:selected?palette.ink:palette.ink}
            />
          )}
          <Label strong numberOfLines={1} style={{fontSize:15}}>{label}</Label>
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
