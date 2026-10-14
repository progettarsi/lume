import type {Article} from './types';
import {isVerified} from './edition';
import {simplify} from './simplifier';
/** Only called for complete, unpublished background candidates; no automatic badge. */
export async function rewriteDiscovery(a:Article,key:string,signal:AbortSignal):Promise<Article>{
 if(isVerified(a)||!a.complete||!a.edition||signal.aborted)return a;
 const rows=await simplify(a.edition.sourcePassages,key,signal,a.title,[],'discovery');
 if(!rows||signal.aborted)return a;
 return {...a,preview:rows.slice(0,1),edition:{...a.edition,continuation:rows.slice(1)},simplified:undefined,verification:undefined};
}
