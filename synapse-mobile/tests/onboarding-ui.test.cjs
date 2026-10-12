const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function compileComponent(filePath) {
  return ts.transpileModule(fs.readFileSync(filePath, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
}

test('onboarding presentation components compile and export valid functions', () => {
  const introCode = compileComponent('src/components/onboarding/IntroStage.tsx');
  assert.ok(introCode.includes('IntroStage'));

  const identityCode = compileComponent('src/components/onboarding/IdentityStage.tsx');
  assert.ok(identityCode.includes('IdentityStage'));

  const actionBtnCode = compileComponent('src/components/onboarding/ActionButton.tsx');
  assert.ok(actionBtnCode.includes('ActionButton'));

  const chipCode = compileComponent('src/components/onboarding/InterestChip.tsx');
  assert.ok(chipCode.includes('InterestChip'));

  const interestsCode = compileComponent('src/components/onboarding/InterestsStage.tsx');
  assert.ok(interestsCode.includes('InterestsStage'));

  const tutorialCode = compileComponent('src/components/onboarding/TutorialStage.tsx');
  assert.ok(tutorialCode.includes('TutorialStage'));

  const prepCode = compileComponent('src/components/onboarding/PreparationStage.tsx');
  assert.ok(prepCode.includes('PreparationStage'));

  const screenCode = compileComponent('src/components/OnboardingScreen.tsx');
  assert.ok(screenCode.includes('OnboardingScreen'));
  assert.ok(screenCode.includes('IdentityPhoto'));
  assert.ok(screenCode.includes('LocalProfileEditor'));
});

test('onboarding wrapper delegates the same binding to the approved scene and preserves explicit profile editing', () => {
  const slots=[],saves=[],picks=[],ApprovedScene=function(){};let cursor=0,tree;
  const react={useState(value){const i=cursor++;if(!(i in slots))slots[i]=value;return [slots[i],next=>slots[i]=next]}};
  const jsx=(type,props)=>({type,props}),module={exports:{}};
  vm.runInNewContext(compileComponent('src/components/OnboardingScreen.tsx'),{module,exports:module.exports,Array,require(id){
    if(id==='react')return {__esModule:true,default:react,...react};if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};
    if(id==='react-native')return {View:'View',Image:'Image',Pressable:'Pressable',TextInput:'TextInput',StyleSheet:{create:v=>v}};
    if(id==='./Atoms')return {Label:'Label',Button:'Button',Icon:'Icon',useTheme:()=>({palette:{surface:'#35302c',ink:'#efe9df',muted:'#b6aea2'}})};
    if(id==='./onboarding/ApprovedOnboardingScene')return {ApprovedOnboardingScene:ApprovedScene};
    if(id==='../theme')return {body:'SourceSans3'};throw Error('Unexpected dependency: '+id);
  }});
  const b={stage:'tutorial',active:false,state:{profile:{name:'Privato',photoUri:'file:local/photo.jpg'},draft:{}},photoUri:'file:local/photo.jpg',busy:false,pickPhoto:remove=>picks.push(!!remove),saveProfile:name=>saves.push(name),reportPhotoUnavailable(){}};
  const wrapped=module.exports.OnboardingScreen({binding:b});assert.equal(wrapped.type,ApprovedScene);assert.equal(wrapped.props.binding,b);
  function nodes(root){if(!root||typeof root!=='object')return [];if(Array.isArray(root))return root.flatMap(nodes);return [root,...nodes(root.props?.children)]}
  const render=()=>{cursor=0;tree=module.exports.LocalProfileEditor({binding:b})};
  render();let input=nodes(tree).find(n=>n.type==='TextInput');assert.equal(input.props.accessibilityLabel,'Nome nel profilo');assert.equal(input.props.value,'Privato');assert.equal(input.props.maxLength,96);
  input.props.onChangeText('李 '+ '🙂'.repeat(60));render();input=nodes(tree).find(n=>n.type==='TextInput');assert.equal(Array.from(input.props.value).length,48);assert.deepEqual(saves,[]);
  nodes(tree).find(n=>n.type==='Button'&&n.props.label==='Salva nome').props.onPress();assert.deepEqual(saves,[input.props.value]);assert.equal(b.state.profile.name,'Privato');
  const photo=module.exports.IdentityPhoto({binding:b}),replace=nodes(photo).find(n=>n.type==='Pressable');assert.equal(replace.props.accessibilityLabel,'Sostituisci foto');replace.props.onPress();nodes(photo).find(n=>n.type==='Button'&&n.props.label==='Rimuovi foto').props.onPress();assert.deepEqual(picks,[false,true]);
  b.busy=true;assert(nodes(module.exports.IdentityPhoto({binding:b})).find(n=>n.type==='Pressable').props.disabled);
});
