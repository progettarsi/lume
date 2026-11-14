import {categoryId} from './categories';
import {ensureClassification} from './classification';
import {reconcileCategories,type Learning} from './recommendations';
import type {Article} from './types';
export function migrateArticleCategory(a:Article):Article{
 // Metadata-only visits retain uncertain history; no category is invented from
 // a title-only biography or an old acquisition route.
 if(!a.preview.some(p=>p.trim())&&!a.paragraphs.some(p=>p.trim()))return {...a,category:categoryId(a.category)||a.category};
 return ensureClassification(a);
}
export function categoryMigration(profile:Learning,articles:Article[],visits:Article[]){
 const categories:Record<string,number>={};for(const [id,value] of Object.entries(profile.categories)){const canonical=categoryId(id)||id;categories[canonical]=(categories[canonical]||0)+value}
 profile={...profile,categories,bookmarks:Object.fromEntries(Object.entries(profile.bookmarks||{}).map(([id,s])=>[id,{...s,category:categoryId(s.category)||s.category}])),recent:(profile.recent||[]).map(s=>({...s,category:categoryId(s.category)||s.category}))};
 const rows=articles.map(migrateArticleCategory),byId=new Map(rows.map(a=>[a.id,a]));
 const history=visits.map(a=>({...migrateArticleCategory(byId.get(a.id)||a),readAt:a.readAt}));
 return {articles:rows,visits:history,profile:{...reconcileCategories(profile,rows),categoryVersion:1}};
}
