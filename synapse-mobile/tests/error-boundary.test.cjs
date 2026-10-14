const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),babel=require('@babel/core');

const compiled=babel.transformFileSync('src/components/AppErrorBoundary.tsx',{
  configFile:false,
  babelrc:false,
  presets:['babel-preset-expo']
}).code;

function setup(){
  const mod={exports:{}};
  const react=require('react');
  const reactNative={
    View:'View',
    StyleSheet:{create:v=>v},
    Appearance:{getColorScheme:()=>'light'}
  };
  const tokens={
    light:{paper:'#F7F1E3',ink:'#353629',muted:'#6E6B59',surface:'#EAE3CF',accent:'#62653C',active:'#D6D5AD',line:'#DCD5BF'},
    dark:{paper:'#1B1915',ink:'#F2EBDD',muted:'#BFB49F',surface:'#353228',accent:'#C4C08C',active:'#514E36',line:'#4B4638'},
    radius:{pill:999},
    metrics:{controlHeight:52},
    typography:{title:{fontSize:18}}
  };
  const primitives={
    ThemeContext:react.createContext({palette:tokens.light}),
    Label:(props)=>react.createElement('Label',props,props.children),
    Button:(props)=>react.createElement('Button',props,props.children)
  };
  vm.runInNewContext(compiled,{
    global:{Error},
    module:mod,
    exports:mod.exports,
    require:id=>{
      if(id==='react')return react;
      if(id==='react-native')return reactNative;
      if(id.includes('tokens'))return tokens;
      if(id.includes('primitives'))return primitives;
      if(id==='react/jsx-runtime'||id==='react/jsx-dev-runtime')return require('react/jsx-runtime');
      return require(id);
    }
  });
  return mod.exports.AppErrorBoundary;
}

test('AppErrorBoundary renders children when no error occurs',()=>{
  const AppErrorBoundary=setup();
  const boundary=new AppErrorBoundary({children:'ok'});
  assert.equal(boundary.render(),'ok');
});

test('AppErrorBoundary catches error and displays fallback UI with Italian copy and retry button',()=>{
  const AppErrorBoundary=setup();
  const error=new Error('boom');
  const derived=AppErrorBoundary.getDerivedStateFromError(error);
  assert.equal(derived.hasError,true);
  assert.equal(derived.error,error);

  let notified=null;
  const boundary=new AppErrorBoundary({children:'child',onError:(e)=>notified=e});
  boundary.componentDidCatch(error,{componentStack:''});
  assert.equal(notified,error);

  boundary.state={hasError:true,error};
  const tree=boundary.render();
  // Check that the tree contains "Qualcosa è andato storto" and "Riprova"
  function collect(node){
    if(!node)return [];
    if(typeof node==='string')return [node];
    const res=[];
    if(node.props?.children){
      const ch=Array.isArray(node.props.children)?node.props.children:[node.props.children];
      for(const c of ch)res.push(...collect(c));
    }
    if(node.props?.label)res.push(node.props.label);
    return res;
  }
  const texts=collect(tree);
  assert(texts.includes('Qualcosa è andato storto'),'Fallback should display Italian error message');
  assert(texts.includes('Riprova'),'Fallback should display retry button');

  // Verify reset
  let updatedState=null;
  boundary.setState=fn=>{
    updatedState=typeof fn==='function'?fn(boundary.state):fn;
  };
  boundary.reset();
  assert.equal(updatedState.hasError,false);
  assert.equal(updatedState.error,null);
});
