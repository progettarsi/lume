import React,{useState} from 'react';
import {View,Pressable,TextInput,StyleSheet,Linking,Platform} from 'react-native';
import Animated,{FadeIn,FadeOut,LinearTransition} from 'react-native-reanimated';
import {Label,Icon,Button,useTheme} from './Atoms';
import {useMotionPreference} from '../useMotionPreference';
import type {GeminiConfigurationState} from '../content/geminiIntegration';

const AI_STUDIO_URL='https://aistudio.google.com/apikey';
const DOCS_URL='https://ai.google.dev/gemini-api/docs/api-key';

export function GeminiSettings({
  state,
  aiKey,
  keyEdited,
  onChangeKey,
  onSaveKey,
  onRemoveKey,
  aiEnabled,
  onToggleEnabled,
  reducedOverride,
}:{
  state:GeminiConfigurationState;
  aiKey:string;
  keyEdited:boolean;
  onChangeKey:(val:string)=>void;
  onSaveKey:()=>void;
  onRemoveKey:()=>void;
  aiEnabled:boolean;
  onToggleEnabled:(enabled:boolean)=>void;
  reducedOverride?:boolean;
}){
  const {palette}=useTheme(),systemReduced=useMotionPreference(),noMotion=reducedOverride??systemReduced;
  const [guideOpen,setGuideOpen]=useState(false);

  const openAiStudio=()=>{
    void Linking.openURL(AI_STUDIO_URL).catch(()=>{});
  };

  const openDocs=()=>{
    void Linking.openURL(DOCS_URL).catch(()=>{});
  };

  // State badge presentation
  const badgeConfig=state.busy
    ? {icon:'progress-clock' as const,label:'Aggiornamento in corso…',color:palette.muted}
    : state.status==='error'
    ? {icon:'alert-circle-outline' as const,label:'Problema di configurazione',color:palette.accent}
    : state.configured
    ? state.enabled
      ? {icon:'check-circle-outline' as const,label:'Configurato e attivo',color:palette.accent}
      : {icon:'pause-circle-outline' as const,label:'Configurato (disattivato)',color:palette.muted}
    : {icon:'information-outline' as const,label:'Non configurato',color:palette.muted};

  return <View style={styles.container}>
    {/* Header */}
    <View style={styles.header}>
      <Label accessibilityRole="header" strong style={styles.sectionTitle}>Integrazione Gemini</Label>
      <Label muted style={styles.sectionSubtitle}>
        Usa Gemini per rielaborare i testi e migliorare la classificazione degli articoli. Richiede una chiave API personale.
      </Label>
    </View>

    {/* Status Card */}
    <View style={[styles.card,{backgroundColor:palette.surface,borderColor:palette.line}]}>
      <View style={styles.statusRow}>
        <Icon name={badgeConfig.icon} size={22} color={badgeConfig.color}/>
        <Label strong style={{fontSize:16,flex:1,color:palette.ink}}>{badgeConfig.label}</Label>
      </View>
      <Label muted accessibilityLiveRegion="polite" style={styles.statusMessage}>
        {state.message}
      </Label>
    </View>

    {/* Toggle Switch */}
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{checked:aiEnabled}}
      accessibilityLabel="Attiva o disattiva l'integrazione con Gemini"
      onPress={()=>onToggleEnabled(!aiEnabled)}
      style={[styles.menuRow,{borderColor:palette.line}]}
    >
      <View style={{flex:1,gap:2}}>
        <Label strong style={{fontSize:18}}>Abilita Gemini</Label>
        <Label muted style={{fontSize:14}}>Rielaborazione testi e classificazione semantica</Label>
      </View>
      <Icon name={aiEnabled?'toggle-switch':'toggle-switch-off-outline'} size={42} color={aiEnabled?palette.accent:palette.muted}/>
    </Pressable>

    {/* Key Input Section */}
    <View style={styles.inputSection}>
      <Label strong style={{fontSize:16,marginBottom:4}}>
        {state.configured?'Sostituisci la chiave API':'Chiave API personale'}
      </Label>
      <TextInput
        accessibilityLabel="Chiave API Gemini personale"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={aiKey}
        onChangeText={onChangeKey}
        placeholder={state.configured?'Chiave memorizzata (inserisci per sostituire)':'Incolla qui la chiave (es. AIza…)'}
        placeholderTextColor={palette.muted}
        style={[styles.input,{color:palette.ink,backgroundColor:palette.surface,borderColor:palette.line}]}
      />

      <View style={styles.actionRow}>
        <Button
          reduced={noMotion}
          disabled={!keyEdited||!aiKey.trim()||state.busy}
          label="Salva chiave API"
          onPress={onSaveKey}
          style={[styles.actionBtn,{backgroundColor:keyEdited&&aiKey.trim()&&!state.busy?palette.active:palette.surface,opacity:keyEdited&&aiKey.trim()&&!state.busy?1:0.5}]}
        >
          <Label strong style={{color:palette.ink}}>Salva chiave</Label>
        </Button>

        {state.configured&&(
          <Button
            reduced={noMotion}
            disabled={state.busy}
            label="Rimuovi chiave Gemini"
            onPress={onRemoveKey}
            style={[styles.actionBtn,{backgroundColor:palette.surface}]}
          >
            <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
              <Icon name="delete-outline" size={18} color={palette.accent}/>
              <Label strong style={{color:palette.accent}}>Rimuovi</Label>
            </View>
          </Button>
        )}
      </View>
    </View>

    {/* Helpful Links */}
    <View style={[styles.linksRow,{borderColor:palette.line}]}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Ottieni una chiave API su Google AI Studio"
        onPress={openAiStudio}
        style={styles.linkItem}
      >
        <Icon name="open-in-new" size={18} color={palette.accent}/>
        <Label strong style={{color:palette.accent,fontSize:15}}>Ottieni una chiave API</Label>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mostra o nascondi la guida alla configurazione"
        onPress={()=>setGuideOpen(!guideOpen)}
        style={styles.linkItem}
      >
        <Icon name={guideOpen?'chevron-up':'help-circle-outline'} size={18} color={palette.ink}/>
        <Label strong style={{color:palette.ink,fontSize:15}}>
          {guideOpen?'Chiudi guida':'Come configurarla'}
        </Label>
      </Pressable>
    </View>

    {/* Guide Accordion */}
    {guideOpen&&(
      <Animated.View
        entering={noMotion?undefined:FadeIn.duration(200)}
        exiting={noMotion?undefined:FadeOut.duration(150)}
        layout={noMotion?undefined:LinearTransition.duration(200)}
        style={[styles.guideBox,{backgroundColor:palette.surface,borderColor:palette.line}]}
      >
        <Label strong style={{fontSize:16,marginBottom:8}}>Guida rapida alla configurazione</Label>

        <View style={styles.guideStep}>
          <Label strong style={{color:palette.accent,fontSize:14}}>1.</Label>
          <Label style={styles.guideStepText}>
            Apri Google AI Studio all'indirizzo <Label strong style={{color:palette.accent}} onPress={openAiStudio}>aistudio.google.com/apikey</Label> con il tuo account Google.
          </Label>
        </View>

        <View style={styles.guideStep}>
          <Label strong style={{color:palette.accent,fontSize:14}}>2.</Label>
          <Label style={styles.guideStepText}>
            Seleziona o crea un progetto Google Cloud appropriato e tocca "Create API key" (Crea chiave API).
          </Label>
        </View>

        <View style={styles.guideStep}>
          <Label strong style={{color:palette.accent,fontSize:14}}>3.</Label>
          <Label style={styles.guideStepText}>
            Copia la chiave generata e incollala nel campo qui sopra in Synapse, poi tocca "Salva chiave".
          </Label>
        </View>

        <View style={[styles.guideDisclaimer,{borderColor:palette.line}]}>
          <Label muted style={{fontSize:13,lineHeight:18}}>
            • <Label strong style={{fontSize:13}}>Facoltativa</Label>: l'integrazione è del tutto opzionale. L'applicazione funziona perfettamente anche senza Gemini consultando Wikipedia.
          </Label>
          <Label muted style={{fontSize:13,lineHeight:18}}>
            • <Label strong style={{fontSize:13}}>Cosa viene inviato</Label>: vengono inviati a Google solo titolo, estratti e introduzioni degli articoli enciclopedici da rielaborare o classificare. Non vengono mai inviati salvataggi, cronologia di lettura o profilo personale.
          </Label>
          <Label muted style={{fontSize:13,lineHeight:18}}>
            • <Label strong style={{fontSize:13}}>Limiti e disponibilità</Label>: dipendono esclusivamente dal servizio di Google. Un abbonamento consumer (come Google One) non garantisce quota API per gli sviluppatori, e la quota gratuita non è illimitata.
          </Label>
        </View>

        <Pressable accessibilityRole="link" onPress={openDocs} style={{flexDirection:'row',alignItems:'center',gap:6,marginTop:8}}>
          <Icon name="open-in-new" size={16} color={palette.muted}/>
          <Label muted style={{fontSize:13,textDecorationLine:'underline'}}>Documentazione ufficiale chiavi API Gemini</Label>
        </Pressable>
      </Animated.View>
    )}
  </View>;
}

const styles=StyleSheet.create({
  container:{gap:16,paddingVertical:12},
  header:{gap:6,marginBottom:4},
  sectionTitle:{fontSize:20,lineHeight:24},
  sectionSubtitle:{fontSize:15,lineHeight:21},
  card:{padding:16,borderRadius:18,borderWidth:StyleSheet.hairlineWidth,gap:8},
  statusRow:{flexDirection:'row',alignItems:'center',gap:10},
  statusMessage:{fontSize:14,lineHeight:20},
  menuRow:{minHeight:64,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:8},
  inputSection:{gap:8,marginTop:8},
  input:{fontFamily:'SourceSans3_400Regular',fontSize:16,paddingHorizontal:16,paddingVertical:14,borderRadius:16,borderWidth:StyleSheet.hairlineWidth},
  actionRow:{flexDirection:'row',gap:12,alignItems:'center',marginTop:4},
  actionBtn:{paddingHorizontal:18,paddingVertical:10,borderRadius:20,minHeight:44,justifyContent:'center',alignItems:'center'},
  linksRow:{flexDirection:'row',flexWrap:'wrap',gap:16,paddingVertical:12,borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth},
  linkItem:{flexDirection:'row',alignItems:'center',gap:6,minHeight:36},
  guideBox:{padding:16,borderRadius:18,borderWidth:StyleSheet.hairlineWidth,gap:12,marginTop:4},
  guideStep:{flexDirection:'row',gap:8,alignItems:'flex-start'},
  guideStepText:{flex:1,fontSize:14,lineHeight:20},
  guideDisclaimer:{paddingTop:10,borderTopWidth:StyleSheet.hairlineWidth,gap:6},
});
