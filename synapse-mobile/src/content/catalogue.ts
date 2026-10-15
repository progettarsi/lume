import type {Article} from './types';
import {CURATED_ARTICLES} from './curatedData';
import {isVerified} from './edition';
import {mergeArticle} from './articleState';
const bundled=CURATED_ARTICLES.filter(isVerified);
/** Bundle is immutable; storage contains only articles the user actually touched. */
export function withCatalogue(rows:Article[]):Article[]{
 const map=new Map(rows.map(a=>[a.id,a]));
 for(const a of bundled){const old=map.get(a.id);if(!old)map.set(a.id,a);else if(!old.saved&&!(isVerified(old)&&old.verification?.fingerprint===a.verification?.fingerprint&&old.category===a.category&&!old.simplified))map.set(a.id,mergeArticle(old,a))}
 return [...map.values()];
}
export const catalogueSize=bundled.length;
