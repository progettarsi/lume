import {DEFAULT_SETTINGS,type Settings} from './types';
import {categoryOrder} from './categories';

/** Persisted preferences may come from an older version or an interrupted migration. */
export function parseSettings(json:string|null|undefined):Settings{
  let value:Record<string,unknown>={};
  try{const parsed:unknown=JSON.parse(json||'{}');if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))value=parsed as Record<string,unknown>}catch{}
  return {
    dark:typeof value.dark==='boolean'?value.dark:DEFAULT_SETTINGS.dark,
    aiEnabled:typeof value.aiEnabled==='boolean'?value.aiEnabled:DEFAULT_SETTINGS.aiEnabled,
    size:typeof value.size==='number'&&[18,20,23].includes(value.size)?value.size:DEFAULT_SETTINGS.size,
    categories:categoryOrder(Array.isArray(value.categories)?value.categories.filter((id):id is string=>typeof id==='string'):[]),
  };
}
