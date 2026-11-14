const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),babel=require('@babel/core');
// Execute serialized production worklets in a separate realm, rather than only
// testing the JS callback (which missed the release-only recursive closure crash).
const compiled=babel.transformFileSync('src/components/onboarding/MaterialLoadingIndicator.tsx',{configFile:false,babelrc:false,presets:['babel-preset-expo'],plugins:['react-native-worklets/plugin']}).code;
function fixture(props){const shared=[],effects=[];let frame,enabled=false,reaction;const clock={setActive:v=>{enabled=v}},mod={exports:{}};
 const react={useRef:v=>({current:v}),useEffect:fn=>effects.push(fn),useMemo:fn=>fn(),useCallback:fn=>fn()};react.default=react;
 const animated={createAnimatedComponent:x=>x,View:'AnimatedView'};
 const reanimated={default:animated,useSharedValue:value=>{const s={value};shared.push(s);return s},useFrameCallback:(fn)=>{frame=fn;return clock},useAnimatedReaction:(read,act)=>{reaction={read,act}},useAnimatedProps:fn=>fn(),useAnimatedStyle:fn=>fn(),runOnJS:fn=>fn};
 vm.runInNewContext(compiled,{global:{Error},module:mod,exports:mod.exports,require:id=>id==='react'?react:id==='react-native'?{View:'View',StyleSheet:{create:v=>v}}:id==='react-native-reanimated'?{__esModule:true,...reanimated}:id==='react-native-svg'?{__esModule:true,default:'Svg',Path:'Path'}:id==='../../content/materialLoading'?require('../.test-build/materialLoading'):id==='react/jsx-runtime'?{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}:require(id)});
 mod.exports.MaterialLoadingIndicator({size:32,color:'#fff',active:true,reduced:false,frozen:false,...props});const cleanups=effects.map(fn=>fn());
 const run=(fn,...args)=>{assert(fn.__initData?.code,'Must exercise worklet serialization');return vm.runInNewContext('('+fn.__initData.code+')').apply({__closure:fn.__closure},args)};
 return {shared,frame:ms=>{if(enabled)run(frame,{timeSincePreviousFrame:ms})},freeze:()=>{shared[3].value=true;run(reaction.act,true,false)},dispose:()=>cleanups.forEach(fn=>fn?.()),get enabled(){return enabled}};
}
test('serialized loader survives many full cycles, freezes once and stops on unmount',()=>{let emitted=0;const f=fixture({onFreeze:()=>emitted++});f.frame(null);for(let n=0;n<1400;n++)f.frame(16.25);assert.equal(f.shared[0].value.toFixed(3),'35.000');const at=f.shared[0].value;f.freeze();f.frame(650);assert.equal(f.shared[0].value,at);assert.equal(emitted,1);f.freeze();assert.equal(emitted,1);f.dispose();assert(!f.enabled);});
test('hidden and reduced loaders do not keep an animation clock running',()=>{for(const props of [{active:false},{reduced:true},{frozen:true}]){const f=fixture(props);assert(!f.enabled);f.frame(650);assert.equal(f.shared[0].value,0);f.dispose()}});
