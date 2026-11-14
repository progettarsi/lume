import type {RefObject} from 'react';
import {TextInput,View} from 'react-native';
import {Button,Icon,useTheme} from './Atoms';
import {body} from '../theme';

export function SearchComposer({value,onChange,onClose,inputRef}:{value:string;onChange:(value:string)=>void;onClose:()=>void;inputRef?:RefObject<TextInput|null>}){
  const {palette}=useTheme();
  return <View style={{flex:1,minWidth:0,height:56,borderRadius:28,flexDirection:'row',alignItems:'center',paddingRight:12,backgroundColor:palette.surface}}><Button label="Chiudi ricerca" onPress={onClose}><Icon name="arrow-left" size={21}/></Button><TextInput ref={inputRef} accessibilityLabel="Cerca nella raccolta" placeholder="Cerca un argomento" placeholderTextColor={palette.muted} value={value} onChangeText={onChange} returnKeyType="search" autoCorrect={false} style={{flex:1,minWidth:0,fontFamily:body,fontSize:18,color:palette.ink,paddingVertical:12}}/>{!!value&&<Button label="Cancella ricerca" onPress={()=>onChange('')}><Icon name="close" size={19}/></Button>}</View>;
}
