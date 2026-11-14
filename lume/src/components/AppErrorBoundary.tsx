import React,{Component,type ReactNode,type ErrorInfo} from 'react';
import {View,StyleSheet,Appearance} from 'react-native';
import {light,dark,radius,metrics,typography} from '../design-system/tokens';
import {Button,Label,ThemeContext} from '../design-system/primitives';

type Props={children:ReactNode;onError?:(error:Error,info:ErrorInfo)=>void};
type State={hasError:boolean;error:Error|null};

export class AppErrorBoundary extends Component<Props,State>{
  state:State={hasError:false,error:null};
  static getDerivedStateFromError(error:Error):State{return {hasError:true,error}}
  componentDidCatch(error:Error,info:ErrorInfo){this.props.onError?.(error,info)}
  reset=()=>{this.setState({hasError:false,error:null})};
  render(){
    if(!this.state.hasError)return this.props.children;
    const palette=Appearance.getColorScheme()==='dark'?dark:light;
    return <ThemeContext.Provider value={{palette,progress:{value:0} as any}}>
      <View style={[styles.root,{backgroundColor:palette.paper}]}>
        <Label strong style={[typography.title,{fontSize:22,color:palette.ink,textAlign:'center',marginBottom:12}]}>Qualcosa è andato storto</Label>
        <Button label="Riprova" onPress={this.reset} style={[styles.btn,{backgroundColor:palette.active}]}>
          <Label strong style={{fontSize:16,color:palette.ink}}>Riprova</Label>
        </Button>
      </View>
    </ThemeContext.Provider>;
  }
}

const styles=StyleSheet.create({
  root:{flex:1,alignItems:'center',justifyContent:'center',padding:24},
  btn:{minHeight:metrics.controlHeight,paddingHorizontal:24,borderRadius:radius.pill}
});
