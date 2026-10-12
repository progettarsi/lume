import React from 'react';
import {Image,StyleSheet,View} from 'react-native';
import {Label,useTheme} from './Atoms';
import {heading} from '../theme';

export function ProfileHeader({name,photoUri,top}:{name?:string;photoUri?:string;top:number}){
 const {palette}=useTheme(),displayName=name?.trim(),personalized=!!displayName&&!!photoUri?.trim();
 return <View style={[styles.row,{paddingTop:top}]}>
  {personalized&&<Image source={{uri:photoUri}} accessible={false} importantForAccessibility="no" style={[styles.avatar,{backgroundColor:palette.surface}]}/>}
  <Label accessibilityRole="header" style={styles.title}>{personalized?displayName:'Profilo'}</Label>
 </View>;
}

const styles=StyleSheet.create({
 row:{flexDirection:'row',alignItems:'center',gap:14,paddingHorizontal:24,paddingBottom:25},
 avatar:{width:48,height:48,borderRadius:24},
 title:{flex:1,minWidth:0,fontFamily:heading,fontSize:38,lineHeight:42,letterSpacing:-.9},
});
