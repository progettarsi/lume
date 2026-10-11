import React,{useEffect,useLayoutEffect,useRef} from 'react';
import {Keyboard,KeyboardAvoidingView,Platform,Pressable,TextInput,View,Image,StyleSheet,useWindowDimensions} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import Animated,{useSharedValue,useAnimatedStyle,withTiming,cancelAnimation,Easing} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Label,Button,Icon,useTheme} from './Atoms';
import {body} from '../theme';
import type {OnboardingBinding} from '../useOnboarding';
import {TUTORIAL} from '../content/onboarding';
import {OnboardingTitleSlot,OnboardingTitleContext,OnboardingScrollContext,OrganicShapeSlot,type TitleSession} from './OnboardingMotionSlots';
import {IntroStage} from './onboarding/IntroStage';
import {IdentityStage} from './onboarding/IdentityStage';
import {InterestsStage} from './onboarding/InterestsStage';
import {TutorialStage} from './onboarding/TutorialStage';
import {PreparationStage} from './onboarding/PreparationStage';
import {ActionButton,SkipButton} from './onboarding/ActionButton';
import type {MotionEnvironment} from '../content/onboardingPresentation';
import {useKeyboardLift} from '../useKeyboardLift';
function Scene({sceneKey,motion,children}:{sceneKey:string;motion:MotionEnvironment;children:React.ReactNode}){
 const entry=useSharedValue(1);
 useLayoutEffect(()=>{cancelAnimation(entry);if(motion.reduced||!motion.visible||!motion.appActive)entry.value=1;else{entry.value=0;entry.value=withTiming(1,{duration:220,easing:Easing.bezier(.22,1,.36,1)})}return()=>cancelAnimation(entry)},[sceneKey,motion.reduced,motion.visible,motion.appActive]);
 const style=useAnimatedStyle(()=>({opacity:entry.value,transform:[{translateY:(1-entry.value)*12}]}));
 return <Animated.View style={[{flex:1},style]}>{children}</Animated.View>;
}
export function OnboardingScreen({binding:b}:{binding:OnboardingBinding}){
 const {palette}=useTheme(),insets=useSafeAreaInsets(),{height,fontScale}=useWindowDimensions(),scroll=useRef<any>(null),session=useRef<TitleSession>({title:'Benvenuto!',key:'intro',animating:false});
 const keyboard=useKeyboardLift(),imeStyle=useAnimatedStyle(()=>({marginBottom:Platform.OS==='android'?keyboard.value:0}));
 useEffect(()=>{const s=Keyboard.addListener('keyboardDidShow',()=>{if(b.stage==='identity')scroll.current?.scrollToEnd({animated:!b.reduced})});return()=>s.remove()},[b.stage,b.reduced]);
 const identityScene=b.stage==='identity'||b.stage==='interests';
 const footerStyle=useAnimatedStyle(()=>({paddingBottom:Math.max(insets.bottom,16)+(identityScene?Math.max(0,64-keyboard.value):0)}));
 const motion:MotionEnvironment={reduced:b.reduced,appActive:b.appActive,visible:b.active};
 if(!b.state||b.bootError)return <View style={{flex:1,padding:24,paddingTop:insets.top+40,gap:20,justifyContent:'center',backgroundColor:palette.paper}}><Label accessibilityLiveRegion="polite">{b.bootError||'Apro la configurazione sul telefono…'}</Label>{!!b.bootError&&<Button label="Riprova" onPress={()=>void b.retryBoot()}><Label>Riprova</Label></Button>}</View>;
 const title=b.stage==='identity'||b.stage==='interests'?'Parlami un po’ di te':b.stage==='tutorial'?TUTORIAL[b.tutorialIndex].title:'Sto preparando\ntutto per te…';
 const key=b.stage==='identity'||b.stage==='interests'?'about-you':b.stage==='tutorial'?'tutorial-'+b.tutorialIndex:b.stage!;
 const busy=b.busy||!b.appActive,step=b.stage==='tutorial'?b.tutorialIndex:0;
 return <OnboardingTitleContext.Provider value={session}><OnboardingScrollContext.Provider value={scroll}><Animated.View style={[{flex:1},imeStyle]}><KeyboardAvoidingView style={{flex:1,backgroundColor:palette.paper}} behavior={Platform.OS==='ios'?'padding':undefined}>
  {(b.stage==='interests'||b.stage==='preparation')&&<View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill,{overflow:'hidden'}]}>
   <OrganicShapeSlot kind={b.stage==='interests'?'flower':'soft-burst'} size={b.stage==='interests'?450:280} motion={motion} style={b.stage==='interests'?{position:'absolute',top:-180,left:-190,opacity:.22}:{position:'absolute',top:-100,right:-110,opacity:.22}}/>
   <OrganicShapeSlot kind={b.stage==='interests'?'soft-boom':'puffy'} size={320} motion={motion} style={b.stage==='interests'?{position:'absolute',bottom:-65,right:-90,opacity:.22}:{position:'absolute',bottom:-65,left:-100,opacity:.22}}/>
  </View>}
  {b.stage==='intro'?<View style={{flex:1,paddingTop:insets.top+24}}><IntroStage motion={motion} onNext={()=>b.navigate('next')} busy={busy} bottomInset={insets.bottom}/></View>:<>
   {(b.stage==='identity'||b.stage==='interests')&&<View style={{paddingTop:insets.top+12,paddingHorizontal:24}}><Button label={b.stage==='identity'?'Torna all’introduzione':'Torna a nome e foto'} disabled={busy} onPress={()=>b.navigate('back')} style={{alignSelf:'flex-start',width:48,height:48}}><Icon name="arrow-left"/></Button></View>}
   <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" nestedScrollEnabled contentContainerStyle={{flexGrow:1,paddingHorizontal:24,paddingTop:b.stage==='identity'||b.stage==='interests'?12:insets.top+24,paddingBottom:24}}>
    {b.stage==='tutorial'&&<Label muted style={{fontSize:14,lineHeight:20,marginBottom:12}}>{step+1} di 4 · Dimostrazione</Label>}
    <View style={{marginBottom:b.stage==='tutorial'?20:4}}><OnboardingTitleSlot title={title} titleKey={key} motion={motion} minLines={identityScene?1:2}/></View>
    <Scene sceneKey={b.stage==='tutorial'?'tutorial-'+step:b.stage!} motion={motion}>
     {b.stage==='identity'&&<IdentityStage binding={b} motion={motion} usableHeight={height-insets.top-insets.bottom} fontScale={fontScale}/>}
     {b.stage==='interests'&&<InterestsStage binding={b} motion={motion}/>}
     {b.stage==='tutorial'&&<TutorialStage binding={b} motion={motion}/>}
     {b.stage==='preparation'&&<PreparationStage binding={b} motion={motion}/>}
    </Scene>
   </ScrollView>
   <Animated.View style={[footerStyle,{paddingHorizontal:24,paddingTop:12,minHeight:80,flexDirection:'row',flexWrap:'wrap',justifyContent:identityScene?'center':'space-between',alignItems:'center',gap:12}]}>
    {(b.stage==='tutorial'||b.stage==='preparation')&&<Button label="Indietro" disabled={busy} onPress={()=>b.navigate('back')} style={{width:56,height:56,borderRadius:28,backgroundColor:palette.surface}}><Icon name="arrow-left"/></Button>}
    <ActionButton label={b.stage==='preparation'?(b.preparation.canEnter?'Entra nella Home':'Preparo dieci articoli'):'Continua'} disabled={busy||b.stage==='preparation'&&!b.preparation.canEnter} onPress={()=>b.navigate(b.stage==='preparation'?'enter':'next')} shapeKind={b.stage==='identity'?'identity-action':b.stage==='interests'?'interests-action':'round-action'} motion={motion}/>
    {(b.stage==='identity'||b.stage==='tutorial')&&<SkipButton label={b.stage==='identity'?'Salta nome e foto':'Salta tutorial'} disabled={busy} onPress={()=>b.navigate('skip')} motion={motion}/>}
   </Animated.View>
  </>}
  {!!b.error&&<Label accessibilityLiveRegion="polite" style={{color:palette.accent,paddingHorizontal:24,paddingBottom:12}}>{b.error}</Label>}
  {b.devSandbox&&<Button label="Esci dall’anteprima di sviluppo" onPress={b.closeDevelopment}><Label>Esci dall’anteprima</Label></Button>}
 </KeyboardAvoidingView></Animated.View></OnboardingScrollContext.Provider></OnboardingTitleContext.Provider>;
}
export function IdentityPhoto({ binding: b }: { binding: OnboardingBinding }) {
  const { palette } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={b.photoUri ? 'Sostituisci foto' : 'Aggiungi foto'}
        disabled={b.busy || b.devSandbox}
        onPress={() => void b.pickPhoto()}
        style={{
          minHeight: 80,
          minWidth: 80,
          borderRadius: 48,
          backgroundColor: palette.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {b.photoUri ? (
          <Image
            source={{ uri: b.photoUri }}
            onError={b.reportPhotoUnavailable}
            style={{ width: 80, height: 80, borderRadius: 40 }}
          />
        ) : (
          <Icon name="account-plus-outline" size={32} />
        )}
      </Pressable>
      {!!(b.active ? b.state?.draft.photoUri : b.state?.profile.photoUri) && (
        <Button disabled={b.busy} label="Rimuovi foto" onPress={() => void b.pickPhoto(true)}>
          <Label>Rimuovi foto</Label>
        </Button>
      )}
      {!!b.photoError && (
        <Label accessibilityLiveRegion="polite">{b.photoError}</Label>
      )}
    </View>
  );
}

export function LocalProfileEditor({ binding: b }: { binding: OnboardingBinding }) {
  const { palette } = useTheme();
  const [name, setName] = React.useState(b.state?.profile.name ?? '');
  return (
    <View style={{ gap: 8, paddingVertical: 12 }}>
      <Label strong>Dati sul dispositivo</Label>
      <IdentityPhoto binding={b} />
      <TextInput
        accessibilityLabel="Nome nel profilo"
        value={name}
        onChangeText={value=>setName(Array.from(value).slice(0,48).join(''))}
        maxLength={96}
        editable={!b.busy}
        placeholder="Il tuo nome"
        placeholderTextColor={palette.muted}
        style={{
          fontFamily: body,
          fontSize: 18,
          color: palette.ink,
          padding: 12,
          backgroundColor: palette.surface,
          borderRadius: 24,
        }}
      />
      <Button disabled={b.busy} label="Salva nome" onPress={() => void b.saveProfile(name)}>
        <Label>Salva nome</Label>
      </Button>
      <Label muted>
        Nome e foto non creano un account e non vengono inviati a Gemini.
      </Label>
      {!!b.error && <Label accessibilityLiveRegion="polite">{b.error}</Label>}
    </View>
  );
}

const styles = StyleSheet.create({
  topBackHeader: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
