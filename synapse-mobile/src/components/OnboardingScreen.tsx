import React,{useState} from 'react';
import {Image,KeyboardAvoidingView,Platform,Pressable,ScrollView,TextInput,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Label,Button,Icon,useTheme} from './Atoms';
import {heading,body} from '../theme';
import {TUTORIAL,DEMO_CARDS} from '../content/onboarding';
import type {OnboardingBinding} from '../useOnboarding';
import {OnboardingTitleSlot,OrganicShapeSlot,TutorialGestureSlot} from './OnboardingMotionSlots';

/** Phase A working presentation. B may replace layout only, preserving binding.
 * C owns the integration slots named below, with static endpoints until then. */
export function OnboardingScreen({binding:b}:{binding:OnboardingBinding}){
 const {palette}=useTheme(),insets=useSafeAreaInsets();
 const [name,setName]=useState(b.state?.draft.name??'');
 if(!b.state||b.bootError)return <View style={{flex:1,padding:24,paddingTop:insets.top+40,gap:20,justifyContent:'center'}}><Label>{b.bootError||'Apro la configurazione sul telefono…'}</Label>{!!b.bootError&&<Button label="Riprova" onPress={()=>void b.retryBoot()}><Label>Riprova</Label></Button>}</View>;
 const tutorial=TUTORIAL[b.tutorialIndex],title=b.stage==='intro'?'Benvenuto!':b.stage==='identity'||b.stage==='interests'?'Parlami un po’ di te':b.stage==='tutorial'?tutorial.title:'Sto preparando tutto per te…';
 const motion={reduced:b.reduced,appActive:b.appActive,visible:b.active};
 const next=b.stage==='preparation'?(b.preparation.kind==='loading'?'Preparo dieci articoli':'Entra nella Home'):'Continua';
 return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{flexGrow:1,paddingHorizontal:24,paddingTop:insets.top+32,paddingBottom:16,gap:20}}>
   <OnboardingTitleSlot title={title} titleKey={b.stage==='identity'||b.stage==='interests'?'about-you':b.stage==='tutorial'?tutorial.id:b.stage!} motion={motion}/>
   {b.stage==='intro'&&<><View testID="onboarding-bulb-slot" style={{alignSelf:'center',alignItems:'center',justifyContent:'center',marginVertical:40,width:128,height:128,borderRadius:64,backgroundColor:'#1d1b19'}}><Image source={require('../../assets/onboarding/bulb.png')} style={{width:49,height:73}} accessible={false}/></View><Label>Piccole scoperte, ogni giorno. Nessun account necessario.</Label></>}
   {b.stage==='identity'&&<>
    <Label>Nome e foto sono facoltativi e rimangono sul dispositivo.</Label>
    <IdentityPhoto binding={b}/>
    <TextInput accessibilityLabel="Il tuo nome, facoltativo" editable={!b.busy} value={name} onChangeText={v=>{setName(v);b.updateDraft({name:v})}} placeholder="Il tuo nome" placeholderTextColor={palette.muted} maxLength={96} autoCapitalize="words" style={{fontFamily:body,color:palette.ink,fontSize:20,padding:16,borderRadius:28,backgroundColor:palette.surface}}/>
   </>}
   {b.stage==='interests'&&<><Label>Scegli gli argomenti che ti incuriosiscono. Puoi continuare anche senza selezionarne.</Label><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{b.options.map(c=>{const selected=b.draft!.interests.includes(c.id);return <Pressable key={c.id} accessibilityRole="checkbox" accessibilityState={{checked:selected,disabled:b.busy}} disabled={b.busy} accessibilityLabel={c.label} onPress={()=>b.toggleInterest(c.id)} style={{minHeight:48,paddingHorizontal:16,paddingVertical:12,borderRadius:28,backgroundColor:selected?palette.active:palette.surface}}><Label>{selected?'✓ ':''}{c.label}</Label></Pressable>})}</View><Label muted>Gli interessi sono selezionabili anche se il feed non ha ancora articoli per tutti.</Label></>}
   {b.stage==='tutorial'&&<>
    <Label>{b.tutorialIndex+1} di 4 · Dimostrazione</Label><Label>{tutorial.body}</Label>
    <TutorialGestureSlot cardIndex={b.demo.card as 0|1} hintStopped={b.demo.hintStopped} motion={motion} onInteract={()=>b.interactDemo(()=>{})} onSwipe={direction=>b.interactDemo(d=>d.swipe(direction))}><View style={{padding:20,borderRadius:24,backgroundColor:palette.surface,gap:14}}>
     <Label style={{fontFamily:heading,fontSize:26}}>{DEMO_CARDS[b.demo.card].title}</Label><Label>{DEMO_CARDS[b.demo.card].preview}</Label>
     {b.tutorialIndex===0&&<Button label="Prova la prossima scheda" onPress={()=>b.interactDemo(d=>d.swipe(d.card===0?'next':'previous'))}><Label>Prova un’altra scheda</Label></Button>}
     {b.tutorialIndex===1&&<View style={{flexDirection:'row',gap:8}}>{['Per Te','Scienza','Arte'].map((c,i)=><Button key={c} label={c} onPress={()=>b.interactDemo(d=>{d.category=['all','science','arts'][i];d.card=i===2?1:0})}><Label>{c}</Label></Button>)}</View>}
     {b.tutorialIndex===2&&<><Button label="Prova apertura" onPress={()=>b.interactDemo(d=>{d.opened=!d.opened})}><Label>{b.demo.opened?'Chiudi esempio':'Apri esempio'}</Label></Button><Button label="Prova salvataggio" onPress={()=>b.interactDemo(d=>{d.saved=!d.saved})}><Label>{b.demo.saved?'Rimuovi esempio dai salvati':'Salva esempio'}</Label></Button></>}
     {b.tutorialIndex===3&&<View testID="tutorial-dock-slot" style={{flexDirection:'row',justifyContent:'space-between'}}>{(['home','profile','search'] as const).map((id,i)=><Button key={id} label={['Home','Profilo','Cerca'][i]} onPress={()=>b.interactDemo(d=>{d.destination=id})}><Label>{['Home','Profilo','Cerca'][i]}</Label></Button>)}</View>}
    </View></TutorialGestureSlot><Label muted>{tutorial.hint}</Label>
   </>}
   {b.stage==='preparation'&&<><View testID="onboarding-preparation-shape-slot" style={{alignItems:'center',marginVertical:32}}><View style={{width:132,height:132,alignItems:'center',justifyContent:'center'}}><OrganicShapeSlot kind="preparation" size={132} motion={motion} style={{position:'absolute'}}/><Image source={require('../../assets/onboarding/compass.png')} style={{width:52,height:52}} accessible={false}/></View></View><Label accessibilityLiveRegion="polite">{b.preparation.message}</Label>{b.preparation.canRetry&&<Button disabled={b.busy} label="Riprova caricamento" onPress={b.retryFeed}><Label>Riprova</Label></Button>}</>}
   {!!b.error&&<Label accessibilityLiveRegion="polite">{b.error}</Label>}
   {b.devSandbox&&<Button label="Esci dall’anteprima di sviluppo" onPress={b.closeDevelopment}><Label>Esci dall’anteprima</Label></Button>}
  </ScrollView>
  <View style={{paddingHorizontal:24,paddingBottom:Math.max(insets.bottom,16),gap:8,flexDirection:'row',justifyContent:'space-between',backgroundColor:palette.paper}}>
   {(b.stage!=='intro'||b.replay)&&<Button disabled={b.busy} label="Indietro" onPress={()=>b.navigate('back')}><Icon name="arrow-left"/></Button>}
   <Button disabled={b.busy||b.stage==='preparation'&&!b.preparation.canEnter} label={next} onPress={()=>b.navigate(b.stage==='preparation'?'enter':'next')} style={{backgroundColor:palette.active,borderRadius:28,paddingHorizontal:18}}><Label>{next}</Label></Button>
   {(b.stage==='identity'||b.stage==='tutorial')&&<Button disabled={b.busy} label={b.stage==='tutorial'?'Salta tutorial':'Salta nome e foto'} onPress={()=>b.navigate('skip')}><Label>Salta</Label></Button>}
  </View>
 </KeyboardAvoidingView>;
}
export function IdentityPhoto({binding:b}:{binding:OnboardingBinding}){
 const {palette}=useTheme();return <View style={{alignItems:'center',gap:8}}><Pressable accessibilityRole="button" accessibilityLabel={b.photoUri?'Sostituisci foto':'Aggiungi foto'} disabled={b.busy||b.devSandbox} onPress={()=>void b.pickPhoto()} style={{minHeight:80,minWidth:80,borderRadius:48,backgroundColor:palette.surface,alignItems:'center',justifyContent:'center'}}>{b.photoUri?<Image source={{uri:b.photoUri}} onError={b.reportPhotoUnavailable} style={{width:80,height:80,borderRadius:40}}/>:<Icon name="account-plus-outline" size={32}/>}</Pressable>{!!(b.active?b.state?.draft.photoUri:b.state?.profile.photoUri)&&<Button disabled={b.busy} label="Rimuovi foto" onPress={()=>void b.pickPhoto(true)}><Label>Rimuovi foto</Label></Button>}{!!b.photoError&&<Label accessibilityLiveRegion="polite">{b.photoError}</Label>}</View>;
}
export function LocalProfileEditor({binding:b}:{binding:OnboardingBinding}){
 const {palette}=useTheme(),[name,setName]=useState(b.state?.profile.name??'');
 return <View style={{gap:8,paddingVertical:12}}><Label strong>Dati sul dispositivo</Label><IdentityPhoto binding={b}/><TextInput accessibilityLabel="Nome nel profilo" value={name} onChangeText={setName} maxLength={96} editable={!b.busy} placeholder="Il tuo nome" placeholderTextColor={palette.muted} style={{fontFamily:body,fontSize:18,color:palette.ink,padding:12,backgroundColor:palette.surface,borderRadius:24}}/><Button disabled={b.busy} label="Salva nome" onPress={()=>void b.saveProfile(name)}><Label>Salva nome</Label></Button><Label muted>Nome e foto non creano un account e non vengono inviati a Gemini.</Label>{!!b.error&&<Label accessibilityLiveRegion="polite">{b.error}</Label>}</View>;
}
