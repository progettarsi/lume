import {useTheme} from './Atoms';
import {AnimatedIcon} from './AnimatedIcon';
export function DockIcon({name,revision,active,reduced}:{name:'home'|'profile';revision:number;active:boolean;reduced:boolean}){
 const {palette}=useTheme();
 return <AnimatedIcon name={name==='profile'?'user':'home'} color={palette.ink} revision={revision} active={active} reduced={reduced}/>;
}
