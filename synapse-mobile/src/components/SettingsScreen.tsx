import {haptics} from '../haptics';
import {Alert,View,Linking} from 'react-native';
import {iconLicenses} from '../design-system/iconLicenses';
import {Label,useTheme} from './Atoms';
import {Action,ChoiceGroup,NavigationRow,PageScroll,Section,Surface,ToggleRow} from '../design-system/components';
import type {Settings,ThemeMode} from '../content/types';
import type {GeminiConfigurationState} from '../content/geminiIntegration';
import {typography} from '../theme';

export function SettingsScreen({settings,gemini,onTheme,onUpdate,onGemini,onGallery,onPreview,bottom,active=true,focusRequest=0}:{settings:Settings;gemini:GeminiConfigurationState;onTheme:(value:ThemeMode)=>void;onUpdate:(value:Partial<Settings>|((current:Settings)=>Partial<Settings>))=>Settings|void;onGemini:()=>void;onGallery:()=>void;onPreview:()=>void;bottom:number;active?:boolean;focusRequest?:number}){
  const {palette}=useTheme();
  const toggle=(key:'autoHideCategories'|'linkDiscoveries'|'hapticsEnabled')=>{const next=onUpdate(old=>({[key]:old[key]===false}));return next?next[key]!==false:settings[key]===false};
  return <View style={{flex:1,display:active?'flex':'none'}} accessibilityElementsHidden={!active} importantForAccessibility={active?'auto':'no-hide-descendants'}><PageScroll bottom={bottom}>
    <Section title="Aspetto"><Surface style={{padding:16,gap:12}}><Label strong style={typography.title}>Tema</Label><ChoiceGroup label="Tema" value={settings.themeMode} options={[{value:'automatic',label:'Automatico'},{value:'light',label:'Chiaro'},{value:'dark',label:'Scuro'}]} onChange={onTheme}/><Label muted style={typography.detail}>Automatico segue il dispositivo.</Label></Surface></Section>
    <Section title="Lettura"><Surface style={{padding:16,gap:12}}><Label strong style={typography.title}>Dimensione del testo</Label><ChoiceGroup label="Dimensione del testo" value={settings.size} options={[{value:18,label:'Piccolo'},{value:20,label:'Medio'},{value:23,label:'Grande'}]} onChange={size=>onUpdate({size})}/><View style={{padding:14,backgroundColor:palette.paper,borderRadius:16}}><Label style={{fontSize:settings.size,lineHeight:settings.size*1.5}}>Una piccola scoperta cambia il modo di vedere il mondo.</Label></View></Surface></Section>
    <Section title="Home"><Surface><ToggleRow title="Nascondi categorie" description="Durante lo scorrimento degli articoli. Ricompaiono tornando indietro." value={settings.autoHideCategories} onChange={()=>toggle('autoHideCategories')}/><ToggleRow title="Collega le scoperte" description="Ogni tanto, piccole storie collegate tra loro." value={settings.linkDiscoveries!==false} onChange={()=>toggle('linkDiscoveries')}/></Surface></Section>
    <Section title="Interazioni"><Surface><ToggleRow title="Feedback aptico" description="Tocchi, selezioni e rivelazione del testo. Rispetta le impostazioni del dispositivo." value={settings.hapticsEnabled!==false} onChange={()=>{const enabled=toggle('hapticsEnabled');haptics.configure(enabled);return enabled}}/></Surface></Section>
    <Section title="Integrazioni"><Surface style={{overflow:'hidden'}}><NavigationRow focusRequest={focusRequest} icon="auto-fix" title="Gemini" description={gemini.busy?'Aggiornamento in corso…':gemini.status==='error'?'Configurazione da controllare':!gemini.configured?'Facoltativo · da configurare':settings.aiEnabled?'Attivo':'Disattivato'} onPress={onGemini}/></Surface></Section>
    <Section title="Informazioni"><Surface style={{overflow:'hidden'}}><NavigationRow icon="open-in-new" title="useAnimations" description="Icone animate · licenza MIT" onPress={()=>Alert.alert('useAnimations',iconLicenses.useAnimations,[{text:'Chiudi'},{text:'Sito',onPress:()=>void Linking.openURL('https://useanimations.com/').catch(()=>{})}],{cancelable:true})}/><NavigationRow icon="open-in-new" title="Phosphor Icons" description="Icone statiche · licenza MIT" onPress={()=>Alert.alert('Phosphor Icons',iconLicenses.phosphor,[{text:'Chiudi'},{text:'Sito',onPress:()=>void Linking.openURL('https://phosphoricons.com/').catch(()=>{})}],{cancelable:true})}/></Surface></Section>
    {__DEV__&&<Section title="Sviluppo"><View style={{gap:12}}><Action title="Galleria del design system" onPress={onGallery}/><Action title="Anteprima primo avvio" secondary onPress={onPreview}/></View></Section>}
  </PageScroll></View>;
}
