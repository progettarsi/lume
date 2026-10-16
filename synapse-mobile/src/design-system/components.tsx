import {haptics} from '../haptics';
import React,{forwardRef,useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,findNodeHandle,KeyboardAvoidingView,Platform,Pressable,ScrollView,StyleSheet,Switch,TextInput,View,useWindowDimensions,type StyleProp,type ViewStyle,type TextInputProps,type ViewProps} from 'react-native';
import Animated from 'react-native-reanimated';
import {Button,Icon,Label,useTheme,SurfaceContext} from './primitives';
import {body,bold,metrics,radius,space,typography,secondaryText} from './tokens';

export function useReturnFocus(ref:React.RefObject<View|null>,request:number){
  useEffect(()=>{if(!request)return;let alive=true;let frame=0;
    void AccessibilityInfo.isScreenReaderEnabled().then(enabled=>{if(alive&&enabled)frame=requestAnimationFrame(()=>{const tag=findNodeHandle(ref.current);if(alive&&tag)AccessibilityInfo.setAccessibilityFocus(tag)})});
    return()=>{alive=false;cancelAnimationFrame(frame)};
  },[request]);
}
type IconName=React.ComponentProps<typeof Icon>['name'];
export function IconBadge({name}:{name:IconName}){
  const {palette}=useTheme();
  return <View accessible={false} style={[styles.badge,{backgroundColor:palette.active}]}><Icon name={name} color={palette.accent}/></View>;
}
export function Surface({children,style,...props}:ViewProps){
  const {palette}=useTheme();return <SurfaceContext.Provider value="surface"><View {...props} style={[{backgroundColor:palette.surface,borderRadius:radius.card},style]}>{children}</View></SurfaceContext.Provider>;
}
export function Section({title,children}:{title:string;children:React.ReactNode}){
  const {palette}=useTheme();return <View style={{gap:space.sm,marginBottom:space.section}}><Label accessibilityRole="header" style={[typography.section,{color:palette.muted,marginLeft:space.lg}]}>{title.toLocaleUpperCase('it')}</Label>{children}</View>;
}
export function NavigationRow({title,description,icon,value,onPress,style,variant='grouped',last=false,focusRequest=0}:{title:string;description?:string;icon:IconName;value?:string;onPress:()=>void;style?:StyleProp<ViewStyle>;variant?:'plain'|'grouped'|'cards';last?:boolean;focusRequest?:number}){
  const {palette}=useTheme(),rowRef=useRef<View>(null);useReturnFocus(rowRef,focusRequest);
  return <Pressable ref={rowRef} accessibilityRole="button" accessibilityLabel={[title,description,value].filter(Boolean).join(', ')} onPress={()=>{onPress();haptics.emit('tap')}} style={({pressed})=>[styles.row,{backgroundColor:pressed?palette.active:variant==='plain'?'transparent':palette.surface,borderRadius:variant==='cards'?radius.card:0,borderBottomWidth:variant==='plain'&&!last?StyleSheet.hairlineWidth:0,borderColor:palette.line},style]}>
    <IconBadge name={icon}/><View style={{flex:1,gap:3}}><Label strong style={typography.title}>{title}</Label>{!!description&&<Label muted style={[typography.detail,{color:secondaryText(palette,'active')}]}>{description}</Label>}</View>{value!==undefined&&<Label muted style={[typography.detail,{color:secondaryText(palette,'active')}]}>{value}</Label>}<Icon name="chevron-right" size={20} color={palette.muted}/>
  </Pressable>;
}
export function ToggleRow({title,description,value,onChange,disabled=false}:{title:string;description?:string;value:boolean;onChange:(value:boolean)=>void;disabled?:boolean}){
  const {palette}=useTheme();
  return <Pressable accessibilityRole="switch" accessibilityLabel={title} accessibilityHint={description} accessibilityState={{checked:value,disabled}} disabled={disabled} onPress={()=>{if(disabled)return;onChange(!value);haptics.emit(value?'off':'on')}} style={[styles.row,{opacity:disabled ? .5 : 1}]}>
    <View style={{flex:1,gap:4}}><Label strong style={typography.title}>{title}</Label>{!!description&&<Label muted style={typography.detail}>{description}</Label>}</View>
    <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants"><Switch accessible={false} focusable={false} importantForAccessibility="no" value={value} disabled={disabled} trackColor={{false:palette.line,true:palette.accent}} thumbColor={value?palette.paper:palette.muted}/></View>
  </Pressable>;
}
export function ChoiceGroup<T extends string|number>({label,value,options,onChange}:{label:string;value:T;options:readonly {value:T;label:string}[];onChange:(value:T)=>void}){
  const {palette}=useTheme(),{fontScale}=useWindowDimensions(),[widths,setWidths]=useState<Record<string,number>>({});
  const key=(text:string)=>text+':'+fontScale;
  return <View>
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',opacity:0,width:2048,height:0,overflow:'hidden'}}>
      {options.map(option=><Label key={key(option.label)} strong numberOfLines={1} onLayout={e=>{const width=Math.ceil(e.nativeEvent.layout.width)+1,k=key(option.label);if(width>1)setWidths(old=>old[k]===width?old:{...old,[k]:width})}} style={{alignSelf:'flex-start',fontSize:15}}>{option.label}</Label>)}
    </View>
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{options.map(option=><Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={label+': '+option.label} accessibilityState={{checked:value===option.value}} onPress={()=>{if(value===option.value)return;onChange(option.value);haptics.emit('selection')}} style={({pressed})=>({flexGrow:1,flexShrink:0,flexBasis:Math.max(86,(widths[key(option.label)]??option.label.length*8.5*fontScale)+24),maxWidth:'100%',minHeight:metrics.touch,paddingHorizontal:10,paddingVertical:12,borderRadius:radius.control,backgroundColor:value===option.value?palette.active:pressed?palette.line:palette.paper,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:value===option.value?palette.accent:'transparent'})}><Label numberOfLines={1} strong={value===option.value} style={{fontSize:15,textAlign:'center'}}>{option.label}</Label></Pressable>)}</View>
  </View>;
}
export const Field=forwardRef<TextInput,TextInputProps>(function Field({style,editable=true,...props},ref){
  const {palette}=useTheme();return <TextInput {...props} ref={ref} editable={editable} placeholderTextColor={palette.muted} style={[styles.field,{backgroundColor:palette.paper,borderColor:palette.muted,color:palette.ink,opacity:editable?1:.6},style]}/>;
});
export function Action({title,onPress,disabled=false,secondary=false}:{title:string;onPress:()=>void;disabled?:boolean;secondary?:boolean}){
  const {palette}=useTheme();return <Button label={title} onPress={onPress} disabled={disabled} style={{minHeight:metrics.controlHeight,paddingHorizontal:20,borderRadius:radius.pill,backgroundColor:secondary?palette.surface:palette.active,opacity:disabled ? .5 : 1}}><Label strong style={{fontSize:16}}>{title}</Label></Button>;
}
/** The non-collapsible host owns accessibility; transforms alone do not hide a scene. */
export function ScreenLayer({active,style,children}:{active:boolean;style?:React.ComponentProps<typeof Animated.View>['style'];children:React.ReactNode}){
  return <View collapsable={false} pointerEvents={active?'box-none':'none'} accessibilityElementsHidden={!active} importantForAccessibility={active?'auto':'no-hide-descendants'} aria-hidden={!active} style={[StyleSheet.absoluteFill,{zIndex:active?1:0,overflow:'hidden'}]}><Animated.View collapsable={false} pointerEvents={active?'box-none':'none'} accessibilityElementsHidden={!active} importantForAccessibility={active?'auto':'no-hide-descendants'} style={style}>{children}</Animated.View></View>;
}
export function PageHeader({title,onBack,backLabel,top=0,active=true}:{title:string;onBack:()=>void;backLabel:string;top?:number;active?:boolean}){
  const {palette}=useTheme(),titleRef=useRef<View>(null);
  useEffect(()=>{if(!active)return;let alive=true;void AccessibilityInfo.isScreenReaderEnabled().then(enabled=>{if(alive&&enabled){const tag=findNodeHandle(titleRef.current);if(tag)AccessibilityInfo.setAccessibilityFocus(tag)}});return()=>{alive=false}},[active,title]);
  return <View style={[styles.header,{paddingTop:top}]}><Button label={backLabel} onPress={onBack} style={{width:48,height:48,borderRadius:24,backgroundColor:palette.surface}}><Icon name="arrow-left"/></Button><View ref={titleRef} accessible accessibilityRole="header" accessibilityLabel={title} style={{flex:1}}><Label accessible={false} style={typography.collection}>{title}</Label></View></View>;
}
export function PageScroll({children,bottom=16,...props}:React.ComponentProps<typeof ScrollView>&{bottom?:number}){
  return <ScrollView {...props} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} style={[{flex:1},props.style]} contentContainerStyle={[{paddingHorizontal:metrics.pageInset,paddingTop:8,paddingBottom:bottom+24},props.contentContainerStyle]}>{children}</ScrollView>;
}
export function PageKeyboard({children}:{children:React.ReactNode}){
  return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>{children}</KeyboardAvoidingView>;
}
export function SheetSurface({style,...props}:React.ComponentProps<typeof Animated.View>){
  const {palette}=useTheme();return <Animated.View {...props} style={[{position:'absolute',left:0,right:0,borderTopLeftRadius:radius.sheet,borderTopRightRadius:radius.sheet,overflow:'hidden',backgroundColor:palette.paper},style]}/>;
}
const styles=StyleSheet.create({
  badge:{width:42,height:42,borderRadius:16,alignItems:'center',justifyContent:'center'},
  row:{minHeight:84,flexDirection:'row',alignItems:'center',gap:14,paddingHorizontal:16,paddingVertical:18},
  field:{fontFamily:body,fontSize:16,minHeight:52,borderWidth:1,borderRadius:radius.control,paddingHorizontal:16,paddingVertical:14},
  header:{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:20,paddingBottom:20},
});
