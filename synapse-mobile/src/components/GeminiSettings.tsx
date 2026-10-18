import {haptics} from '../haptics';
import React,{useEffect,useState} from 'react';
import {Alert,Linking,Pressable,View} from 'react-native';
import {Label,Icon,useTheme} from './Atoms';
import {Action,Field,Section,Surface,ToggleRow} from '../design-system/components';
import {typography} from '../theme';
import {Collapsible} from './Collapsible';
import type {GeminiConfigurationState} from '../content/geminiIntegration';

export function GeminiSettings({state,aiKey,keyEdited,onChangeKey,onSaveKey,onRemoveKey,aiEnabled,onToggleEnabled,online=true,onRetryConfiguration,reducedOverride}:{
 state:GeminiConfigurationState;aiKey:string;keyEdited:boolean;onChangeKey:(value:string)=>void;onSaveKey:()=>void;onRemoveKey:()=>void;aiEnabled:boolean;onToggleEnabled:(value:boolean)=>void|boolean;online?:boolean;onRetryConfiguration?:()=>void;reducedOverride?:boolean;
}){
 const {palette}=useTheme();
 const [guide,setGuide]=useState(false),[privacy,setPrivacy]=useState(false),[replace,setReplace]=useState(false),[linkError,setLinkError]=useState('');
 useEffect(()=>{if(!keyEdited)setReplace(false)},[keyEdited]);
 const open=(url:string)=>{setLinkError('');void Linking.openURL(url).catch(()=>setLinkError('Impossibile aprire il collegamento. Controlla che sia disponibile un browser.'))};
 const link=(title:string,url:string)=><Pressable accessibilityRole="link" accessibilityLabel={title} onPress={()=>open(url)} style={{minHeight:48,justifyContent:'center'}}><Label strong style={{color:palette.accent,fontSize:15}}>{title} ↗</Label></Pressable>;
 const disclosure=(title:string,value:boolean,set:React.Dispatch<React.SetStateAction<boolean>>)=><Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{expanded:value}} onPress={()=>{set(current=>!current);haptics.emit('selection')}} style={{minHeight:56,flexDirection:'row',alignItems:'center',gap:12}}><Label strong style={{flex:1,fontSize:16}}>{title}</Label><Icon name={value?'chevron-up':'chevron-down'} size={20}/></Pressable>;
 return <View>
  <Label muted style={[typography.body,{marginBottom:24}]}>Rielabora i testi e aiuta a classificare gli articoli. È facoltativo: Lume funziona anche senza Gemini.</Label>
  <Section title="Stato"><Surface style={{padding:16,gap:8}}><View style={{flexDirection:'row',gap:10,alignItems:'center'}}><Icon name={state.status==='error'?'alert-circle-outline':state.configured?'check-circle-outline':'information-outline'} color={palette.accent}/><Label strong style={[typography.title,{flex:1}]}>{state.busy?'Aggiornamento in corso…':state.status==='error'?'Configurazione da controllare':!state.configured?'Da configurare':aiEnabled?'Attivo':'Disattivato'}</Label></View><Label muted accessibilityLiveRegion="polite" style={typography.detail}>{state.message}</Label>{state.status==='error'&&onRetryConfiguration&&<Action title="Rileggi configurazione" secondary onPress={onRetryConfiguration}/>}</Surface></Section>
  {!online&&<Surface style={{padding:16,marginBottom:24}}><Label strong>Sei offline</Label><Label muted style={typography.detail}>Puoi gestire la chiave sul telefono. Gemini tornerà disponibile quando sarai connesso.</Label></Surface>}
  {state.configured&&<Section title="Utilizzo"><Surface><ToggleRow title="Abilita Gemini" description="Rielaborazione dei testi e classificazione degli articoli." value={aiEnabled} disabled={state.busy} onChange={onToggleEnabled}/></Surface></Section>}
  <Section title="Chiave personale"><Surface style={{padding:16,gap:12}}>
   {(!state.configured||replace)?<><Label strong>{state.configured?'Sostituisci la chiave API':'Configura Gemini'}</Label><Field accessibilityLabel="Chiave API Gemini personale" secureTextEntry autoComplete="off" textContentType="none" autoCapitalize="none" autoCorrect={false} editable={!state.busy} value={aiKey} onChangeText={onChangeKey} placeholder="Incolla la chiave API"/><Label muted style={typography.detail}>Usa un progetto con quota gratuita e fatturazione disattivata. Lume non verifica il piano né attiva la fatturazione.</Label><Action title={state.busy?'Salvataggio…':'Salva chiave'} disabled={!keyEdited||!aiKey.trim()||state.busy} onPress={onSaveKey}/>{replace&&<Action title="Annulla sostituzione" secondary disabled={state.busy} onPress={()=>{onChangeKey('');setReplace(false)}}/>}</>:<><Label muted style={typography.detail}>La chiave è memorizzata sul dispositivo e non viene mostrata.</Label><Action title="Sostituisci chiave" secondary disabled={state.busy} onPress={()=>setReplace(true)}/><Action title="Rimuovi chiave" secondary disabled={state.busy} onPress={()=>Alert.alert('Rimuovere la chiave?','Gemini verrà disattivato. Gli articoli di Wikipedia restano disponibili.',[{text:'Annulla',style:'cancel'},{text:'Rimuovi',style:'destructive',onPress:onRemoveKey}])}/></>}
   {state.status==='error'&&<Label accessibilityLiveRegion="polite" style={typography.detail}>{state.message}</Label>}
  </Surface></Section>
  <Section title="Aiuto"><Surface style={{paddingHorizontal:16,paddingBottom:8}}>
   {link('Ottieni una chiave API','https://aistudio.google.com/apikey')}
   {disclosure('Come configurarla',guide,setGuide)}
   <Collapsible expanded={guide} reducedOverride={reducedOverride}><View style={{gap:12,paddingBottom:12}}><Label style={typography.detail}>1. Apri Google AI Studio con il tuo account Google.</Label><Label style={typography.detail}>2. Seleziona un progetto con quota gratuita e fatturazione disattivata, poi scegli “Create API key”. Non attivare “Set up billing”.</Label><Label style={typography.detail}>3. Incolla qui la chiave e tocca “Salva chiave”.</Label>{link('Documentazione ufficiale','https://ai.google.dev/gemini-api/docs/api-key')}</View></Collapsible>
   {disclosure('Privacy, limiti e disponibilità',privacy,setPrivacy)}
   <Collapsible expanded={privacy} reducedOverride={reducedOverride}><View style={{gap:12,paddingBottom:16}}><Label style={typography.detail}>A Google vengono inviati titolo, testo e metadati enciclopedici necessari. Profilo personale, salvataggi e cronologia restano sul telefono.</Label><Label style={typography.detail}>La quota gratuita non è illimitata. Un abbonamento consumer Google non garantisce quota per le API. Se il servizio non risponde o la quota termina, rimane disponibile il testo originale di Wikipedia.</Label></View></Collapsible>
   {!!linkError&&<Label accessibilityLiveRegion="polite" style={[typography.detail,{paddingVertical:12}]}>{linkError}</Label>}
  </Surface></Section>
 </View>;
}
