const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseSettings,isDarkTheme}=require('../.test-build/settings');

test('theme migration preserves old explicit choices and defaults fresh installs to automatic',()=>{
  assert.equal(parseSettings(null).themeMode,'automatic');
  assert.equal(parseSettings('{"dark":true}').themeMode,'dark');
  assert.equal(parseSettings('{"dark":false}').themeMode,'light');
  for(const themeMode of ['automatic','light','dark']){
    const settings=parseSettings(JSON.stringify({themeMode,dark:themeMode!=='dark',size:23,aiEnabled:true,autoHideCategories:false}));
    assert.equal(settings.themeMode,themeMode);
    assert.deepEqual(parseSettings(JSON.stringify(settings)),settings);
    assert.equal(settings.size,23);assert.equal(settings.aiEnabled,true);assert.equal(settings.autoHideCategories,false);
  }
  assert.equal(parseSettings('{"themeMode":"invalid","dark":true}').themeMode,'dark');
  assert.equal(parseSettings('{"themeMode":null}').themeMode,'automatic');
});

test('automatic follows successive device changes while manual modes override them',()=>{
  const schemes=['light','dark','light',null,undefined,'unspecified','dark'];
  assert.deepEqual(schemes.map(scheme=>isDarkTheme('automatic',scheme)),[false,true,false,false,false,false,true]);
  for(const scheme of schemes){assert.equal(isDarkTheme('light',scheme),false);assert.equal(isDarkTheme('dark',scheme),true)}
  assert.equal(parseSettings(JSON.stringify(parseSettings('{"themeMode":"automatic"}'))).themeMode,'automatic');
});
