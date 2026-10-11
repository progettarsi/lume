import {Pressable,StyleSheet} from 'react-native';
import {Icon,Label,useTheme} from './Atoms';

export function ProfileMenuRow({icon,title,count,onPress}:{icon:React.ComponentProps<typeof Icon>['name'];title:string;count?:number;onPress:()=>void}){
  const {palette}=useTheme();
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.row,{borderColor:palette.line}]}><Icon name={icon}/><Label strong style={{flex:1,fontSize:19}}>{title}</Label>{count!==undefined&&<Label muted>{count}</Label>}<Icon name="chevron-right" size={20}/></Pressable>;
}
const styles=StyleSheet.create({row:{minHeight:82,flexDirection:'row',alignItems:'center',gap:15,borderBottomWidth:StyleSheet.hairlineWidth}});
