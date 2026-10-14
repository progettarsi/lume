import {motion,layers} from '../theme';
import {SheetSurface,Field} from '../design-system/components';
import React,{forwardRef,useEffect,useImperativeHandle,useLayoutEffect,useReducer,useRef,useState} from 'react';
import {Alert,Image,Keyboard,Pressable,ScrollView,StyleSheet,TextInput,View} from 'react-native';
import Animated,{cancelAnimation,Easing,runOnJS,useAnimatedStyle,useSharedValue,withTiming,type SharedValue} from 'react-native-reanimated';
import {Gesture,GestureDetector} from 'react-native-gesture-handler';
import {Button,Icon,Label,useTheme} from './Atoms';
import {body,heading,light} from '../theme';
import type {OnboardingBinding} from '../useOnboarding';
import type {ProfileIdentitySession} from '../content/profileIdentity';

export type ProfileEditorHandle={requestClose:()=>void};
type Props={open:boolean;binding:OnboardingBinding;onClose:()=>void;height:number;top:number;bottom:number;keyboard:SharedValue<number>;reduced:boolean};
const ease=Easing.bezier(.22,1,.36,1);
export const ProfileEditorSheet=forwardRef<ProfileEditorHandle,Props>(function ProfileEditorSheet({open,binding,onClose,height,top,bottom,keyboard,reduced},ref){
 const {palette}=useTheme(),[mounted,setMounted]=useState(false),[,render]=useReducer(n=>n+1,0),[error,setError]=useState(''),[unavailable,setUnavailable]=useState(''),[saving,setSaving]=useState(false);
 const session=useRef<ProfileIdentitySession | undefined>(undefined),latestOpen=useRef(open);latestOpen.current=open;
 const progress=useSharedValue(0),sheetHeight=useSharedValue(500),dragStart=useSharedValue(1);
 const hide=()=>{if(!latestOpen.current)setMounted(false)};
 useLayoutEffect(()=>{
  cancelAnimation(progress);
  if(open){session.current=binding.createProfileEditor();setError('');setUnavailable('');setMounted(true);progress.value=reduced?1:withTiming(1,{duration:motion.profile.sheetEnter,easing:ease});}
  else{void session.current?.discard();if(reduced){progress.value=0;hide()}else progress.value=withTiming(0,{duration:motion.profile.sheetExit,easing:ease},finished=>{if(finished)runOnJS(hide)()});}
  return()=>cancelAnimation(progress);
 },[open]);
 useEffect(()=>()=>{void session.current?.discard()},[]);
 useEffect(()=>{if(reduced){cancelAnimation(progress);progress.value=open?1:0;if(!open)hide()}},[reduced]);
 const leave=()=>{Keyboard.dismiss();void session.current?.discard();onClose()};
 const requestClose=()=>{
  if(!latestOpen.current)return;
  progress.value=reduced?1:withTiming(1,{duration:motion.profile.settle,easing:ease});
  if(saving)return;
  if(session.current?.dirty)Alert.alert('Lasciare le modifiche?','Nome e foto non sono ancora stati salvati.',[{text:'Continua a modificare',style:'cancel'},{text:'Scarta modifiche',style:'destructive',onPress:leave}]);else leave();
 };
 useImperativeHandle(ref,()=>({requestClose}));
 const pick=async(remove=false)=>{
  const current=session.current;if(!current||current.busy)return;
  setError('');const job=current.pick(remove);render();
  try{const result=await job;if(result==='denied'&&session.current===current&&latestOpen.current)setError('Foto non disponibile o accesso negato. Puoi continuare senza foto.');if(result==='saved'&&session.current===current)setUnavailable('');}
  catch(e){if(session.current===current&&latestOpen.current)setError(e instanceof Error?e.message:'Foto non disponibile. Riprova.');}
  finally{render()}
 };
 const save=async()=>{
  const current=session.current;if(!current||current.busy||!current.dirty)return;
  setSaving(true);setError('');
  try{if(await current.save()){Keyboard.dismiss();onClose()}}
  catch{setError('Non riesco a salvare sul telefono. I dati precedenti sono conservati. Riprova.');}
  finally{setSaving(false);render()}
 };
 const overlayStyle=useAnimatedStyle(()=>({opacity:progress.value*.32}));
 const panelStyle=useAnimatedStyle(()=>({bottom:keyboard.value,maxHeight:Math.max(160,height-top-keyboard.value-12),transform:[{translateY:sheetHeight.value*(1-progress.value)}]}));
 const gesture=Gesture.Pan().enabled(open&&!saving).onBegin(()=>{cancelAnimation(progress);dragStart.value=progress.value}).onUpdate(e=>{progress.value=Math.max(0,Math.min(1,dragStart.value-e.translationY/sheetHeight.value))}).onEnd(e=>{if(e.translationY>96||e.velocityY>800)runOnJS(requestClose)();else progress.value=reduced?1:withTiming(1,{duration:motion.profile.settle,easing:ease})}).onFinalize(()=>{if(progress.value>0&&progress.value<1)progress.value=reduced?1:withTiming(1,{duration:motion.profile.settle,easing:ease})});
 if(!mounted)return null;
 const current=session.current,identity=current?.value,photoUri=identity?.photoUri,busy=!!current?.busy;
 return <View pointerEvents={open?'auto':'none'} accessibilityElementsHidden={!open} importantForAccessibility={open?'auto':'no-hide-descendants'} style={[StyleSheet.absoluteFill,{zIndex:layers.sheet}]}>
  <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,{backgroundColor:light.ink},overlayStyle]}/>
  <Pressable accessible={false} onPress={requestClose} style={StyleSheet.absoluteFill}/>
  <SheetSurface accessibilityViewIsModal aria-modal={open} style={[styles.panel,{backgroundColor:palette.paper},panelStyle]} onLayout={e=>{sheetHeight.value=e.nativeEvent.layout.height}}>
   <GestureDetector gesture={gesture}><View accessible={false} style={styles.handleHit}><View style={[styles.handle,{backgroundColor:palette.line}]}/></View></GestureDetector>
   <View style={styles.heading}><Label accessibilityRole="header" style={styles.title}>Nome e foto</Label><Button disabled={saving} label="Chiudi modifica profilo" onPress={requestClose} style={{width:48,height:48,borderRadius:24,backgroundColor:palette.surface}}><Icon name="close"/></Button></View>
   <ScrollView style={{flexGrow:0}} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    <View style={styles.photoRow}><Pressable accessibilityRole="button" accessibilityLabel={photoUri?'Cambia foto':'Aggiungi foto'} disabled={busy} onPress={()=>void pick()} style={[styles.photo,{backgroundColor:palette.surface,borderColor:palette.line}]}>{photoUri&&unavailable!==photoUri?<Image source={{uri:photoUri}} onError={()=>{setUnavailable(photoUri);setError('Questa foto non è più disponibile. Scegline un’altra o rimuovila.')}} style={styles.photoImage}/>:<Icon name="account-plus-outline" size={32}/>}</Pressable><View style={{flex:1,alignItems:'flex-start'}}><Button disabled={busy} label={photoUri?'Cambia foto':'Aggiungi foto'} onPress={()=>void pick()}><Label style={{color:palette.accent,fontSize:16}}>{photoUri?'Cambia foto':'Aggiungi foto'}</Label></Button>{!!photoUri&&<Button disabled={busy} label="Rimuovi foto" onPress={()=>void pick(true)}><Label muted style={{fontSize:15}}>Rimuovi foto</Label></Button>}</View></View>
    <Label muted style={styles.field}>Nome · facoltativo</Label><Field accessibilityLabel="Nome nel profilo, facoltativo" editable={!saving} value={identity?.name??''} onChangeText={name=>{current?.setName(name);render()}} maxLength={96} placeholder="Il tuo nome" placeholderTextColor={palette.muted} autoCapitalize="words" autoCorrect={false} returnKeyType="done" onSubmitEditing={()=>Keyboard.dismiss()} style={[styles.input,{backgroundColor:palette.surface,borderColor:palette.line,color:palette.ink}]}/>
    <Label muted style={styles.hint}>Nome e foto rimangono sul dispositivo.</Label><Label accessibilityLiveRegion="polite" style={[styles.error,{color:palette.accent}]}>{error}</Label>
   </ScrollView>
   <View style={[styles.actions,{paddingBottom:bottom+12}]}><Button disabled={saving} label="Annulla modifica profilo" onPress={requestClose} style={[styles.action,{backgroundColor:palette.surface}]}><Label>Annulla</Label></Button><Button disabled={!current?.dirty||busy} label="Salva nome e foto" onPress={()=>void save()} style={[styles.action,{backgroundColor:palette.active,opacity:(!current?.dirty||busy)? .5:1}]}><Label strong>{saving?'Salvo…':'Salva'}</Label></Button></View>
  </SheetSurface>
 </View>;
});
const styles=StyleSheet.create({panel:{position:'absolute',left:0,right:0,borderTopLeftRadius:28,borderTopRightRadius:28,overflow:'hidden'},handleHit:{height:28,alignItems:'center',justifyContent:'center'},handle:{width:38,height:4,borderRadius:2},heading:{paddingHorizontal:24,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},title:{fontFamily:heading,fontSize:30,lineHeight:34,letterSpacing:-.6},content:{paddingHorizontal:24},photoRow:{minHeight:96,flexDirection:'row',alignItems:'center',gap:18,marginTop:26,marginBottom:28},photo:{width:88,height:88,borderRadius:44,borderWidth:1,overflow:'hidden',alignItems:'center',justifyContent:'center'},photoImage:{width:88,height:88},field:{fontSize:14,marginBottom:9},input:{fontFamily:body,fontSize:18,minHeight:55,borderRadius:28,borderWidth:1,paddingHorizontal:17,paddingVertical:12},hint:{fontSize:14,lineHeight:20,marginTop:12,marginBottom:16},error:{fontSize:14,lineHeight:20,minHeight:20},actions:{paddingHorizontal:24,paddingTop:18,flexDirection:'row',gap:10},action:{flex:1,minHeight:52,borderRadius:28}});
