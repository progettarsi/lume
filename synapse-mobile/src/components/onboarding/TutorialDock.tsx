import React from 'react';
import {Pressable,View} from 'react-native';
import Animated,{useAnimatedStyle,useSharedValue,type SharedValue} from 'react-native-reanimated';
import {Icon,Label,useTheme} from '../Atoms';
import {tutorialDockCells} from '../../content/tutorialFeed';
const steps=[{label:'Feed',icon:'compass-outline'},{label:'Categorie',icon:'shape-outline'},{label:'Salvati',icon:'bookmark-outline'}] as const;
function Tab({i,index,position,inner,wide,onSelect,disabled}:{i:number;index:number;position:SharedValue<number>;inner:number;wide:number;onSelect:(n:number)=>void;disabled:boolean}){
 const {palette}=useTheme();
 const labelWidth=useSharedValue(52);
 const cell=useAnimatedStyle(()=>{const c=tutorialDockCells(position.value,inner,wide,3)[i];return{width:c.width,transform:[{translateX:c.left}]}});
 const glyph=useAnimatedStyle(()=>{const c=tutorialDockCells(position.value,inner,wide,3)[i];return{opacity:.6+.4*c.weight,transform:[{translateX:(c.width-24)/2*(1-c.weight)+(c.width-24-7-labelWidth.value)/2*c.weight}]}});
 const text=useAnimatedStyle(()=>{const c=tutorialDockCells(position.value,inner,wide,3)[i];return{left:(c.width-24-7-labelWidth.value)/2+31,width:labelWidth.value+1,opacity:Math.max(0,(1-Math.abs(position.value-i)-.5)*2)}});
 const highlight=useAnimatedStyle(()=>({opacity:tutorialDockCells(position.value,inner,wide,3)[i].weight}));
 return <Animated.View style={[{position:'absolute',left:9+3*i,top:9,height:46,overflow:'hidden',borderRadius:23},cell]}><Animated.View pointerEvents="none" style={[{position:'absolute',inset:0,borderRadius:23,backgroundColor:palette.active},highlight]}/><Pressable accessibilityRole="tab" accessibilityState={{selected:index===i,disabled}} accessibilityLabel={`${steps[i].label}, passaggio ${i+1} di 3`} disabled={disabled} onPress={()=>onSelect(i)} style={{flex:1,minHeight:46,justifyContent:'center'}}><Animated.View style={[{position:'absolute',width:24,height:24},glyph]}><Icon name={steps[i].icon} size={24}/></Animated.View><Label accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" strong numberOfLines={1} onTextLayout={e=>{if(e.nativeEvent.lines[0])labelWidth.value=e.nativeEvent.lines[0].width}} style={{position:'absolute',width:wide,fontSize:16,lineHeight:20,opacity:0}}>{steps[i].label}</Label><Label accessible={false} strong numberOfLines={1} style={[{position:'absolute',fontSize:16,lineHeight:20},text]}>{steps[i].label}</Label></Pressable></Animated.View>;
}
export function TutorialDock({index,position,onSelect,width,disabled=false}:{index:number;position:SharedValue<number>;reduced:boolean;onSelect:(n:number)=>void;width:number;disabled?:boolean}){
 const {palette}=useTheme(),inner=width-18-6,wide=inner*2.3/4.3;
 return <View testID="tutorial-dock" style={{width,height:64,borderRadius:32,backgroundColor:palette.surface}}>{steps.map((s,i)=><Tab key={s.label} {...{i,index,position,inner,wide,onSelect,disabled}}/>)}</View>;
}
