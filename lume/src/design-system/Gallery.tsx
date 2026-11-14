import {useState} from 'react';
import {View} from 'react-native';
import {Label} from './primitives';
import {Action,ChoiceGroup,Field,NavigationRow,PageScroll,Section,Surface,ToggleRow} from './components';
import {typography} from './tokens';
export const profileVariants=['plain','grouped','cards'] as const;
export function ProfileOptionsExample({variant}:{variant:typeof profileVariants[number]}){
 const rows=<>{[{title:'Articoli salvati',icon:'bookmark-outline',value:'12'},{title:'Cronologia',icon:'history',value:'36'},{title:'Impostazioni',icon:'tune',value:undefined}].map((row,index)=><NavigationRow key={row.title} title={row.title} icon={row.icon as 'tune'} value={row.value} onPress={()=>{}} variant={variant} last={index===2} style={variant==='cards'?{marginBottom:8}:variant==='grouped'&&index>0?{marginTop:2}:undefined}/>)}</>;
 return variant==='grouped'?<View style={{borderRadius:24,overflow:'hidden'}}>{rows}</View>:<View>{rows}</View>;
}
/** Development-only destination. All controls use local state, never user preferences. */
export function DesignGallery({bottom=16}:{bottom?:number}){
 const [checked,setChecked]=useState(true),[choice,setChoice]=useState('a'),[text,setText]=useState('');
 return <PageScroll bottom={bottom}>
  <Label style={[typography.page,{marginBottom:24}]}>Elementi di Lume</Label>
  <Section title="Controlli"><Surface style={{padding:16,gap:16}}><ChoiceGroup label="Scelta" value={choice} options={[{value:'a',label:'Prima'},{value:'b',label:'Seconda'}]} onChange={setChoice}/><ToggleRow title="Interruttore" value={checked} onChange={setChecked}/><ToggleRow title="Non disponibile" value={false} disabled onChange={()=>{}}/><Field accessibilityLabel="Campo di prova" placeholder="Scrivi qui" value={text} onChangeText={setText}/><Action title="Azione principale" onPress={()=>setText('Completato')}/><Action title="Azione non disponibile" disabled onPress={()=>{}}/></Surface></Section>
  <Section title="Stati"><Surface style={{padding:16,gap:12}}><Label>Caricamento in corso…</Label><Label>Nessun elemento salvato</Label><Label>Sei offline · contenuti disponibili sul telefono</Label><Label>Impossibile salvare. Riprova.</Label></Surface></Section>
  {profileVariants.map((variant,index)=><Section key={variant} title={`${index+1}. ${['Righe aperte','Gruppo morbido · scelto','Schede separate'][index]}`}><ProfileOptionsExample variant={variant}/></Section>)}
 </PageScroll>;
}
