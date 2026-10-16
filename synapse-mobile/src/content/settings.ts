import {DEFAULT_SETTINGS,type Settings,type ThemeMode} from './types';
import {categoryOrder} from './categories';

/** Persisted preferences may come from an older version or an interrupted migration. */
export function parseSettings(json:string|null|undefined):Settings{
  let value:Record<string,unknown>={};
  try{const parsed:unknown=JSON.parse(json||'{}');if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))value=parsed as Record<string,unknown>}catch{}
  return {
    themeMode:value.themeMode==='automatic'||value.themeMode==='light'||value.themeMode==='dark'?value.themeMode:typeof value.dark==='boolean'?(value.dark?'dark':'light'):DEFAULT_SETTINGS.themeMode,
    hapticsEnabled:typeof value.hapticsEnabled==='boolean'?value.hapticsEnabled:true,
    aiEnabled:typeof value.aiEnabled==='boolean'?value.aiEnabled:DEFAULT_SETTINGS.aiEnabled,
    linkDiscoveries:typeof value.linkDiscoveries==='boolean'?value.linkDiscoveries:true,
    autoHideCategories:typeof value.autoHideCategories==='boolean'?value.autoHideCategories:DEFAULT_SETTINGS.autoHideCategories,
    size:typeof value.size==='number'&&[18,20,23].includes(value.size)?value.size:DEFAULT_SETTINGS.size,
    categories:categoryOrder(Array.isArray(value.categories)?value.categories.filter((id):id is string=>typeof id==='string'):[]),
  };
}

/** Resolve appearance without persisting the device's temporary theme. */
export function isDarkTheme(mode:ThemeMode,systemScheme:'light'|'dark'|'unspecified'|null|undefined):boolean{
  return mode==='dark'||mode==='automatic'&&systemScheme==='dark';
}
