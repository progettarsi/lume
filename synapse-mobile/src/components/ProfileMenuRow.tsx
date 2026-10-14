import {Icon} from './Atoms';
import {NavigationRow} from '../design-system/components';

export function ProfileMenuRow({icon,title,count,onPress,focusRequest=0}:{icon:React.ComponentProps<typeof Icon>['name'];title:string;count?:number;onPress:()=>void;focusRequest?:number}){
  return <NavigationRow focusRequest={focusRequest} icon={icon} title={title} value={count===undefined?undefined:String(count)} onPress={onPress}/>;
}
