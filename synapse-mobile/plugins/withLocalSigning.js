const { withAppBuildGradle } = require('expo/config-plugins');
module.exports = config => withAppBuildGradle(config, result => {
  let source=result.modResults.contents;
  if(!source.includes('SYNAPSE_STORE_PASSWORD')){
    source=source.replace(/signingConfigs\s*\{/,`signingConfigs {
        release {
            storeFile new File(rootDir.parentFile, '.credentials/synapse-release.p12')
            storePassword System.getenv('SYNAPSE_STORE_PASSWORD')
            keyAlias 'synapse'
            keyPassword System.getenv('SYNAPSE_STORE_PASSWORD')
        }`);
  }
  source=source.replace(/(buildTypes\s*\{[\s\S]*?debug\s*\{[\s\S]*?signingConfig\s+)signingConfigs\.release/,'$1signingConfigs.debug');
  source=source.replace(/(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?signingConfig\s+)signingConfigs\.debug/,'$1signingConfigs.release');
  result.modResults.contents=source;return result;
});
