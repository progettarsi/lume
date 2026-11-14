import type {Article} from './types';

const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const strings=(value:unknown):value is string[]=>Array.isArray(value)&&value.every(item=>typeof item==='string');
const finite=(value:unknown)=>typeof value==='number'&&Number.isFinite(value);
/** JSON syntax alone does not make a persisted row safe for rendering/ranking.
 * Ignore malformed rows in memory; keep their original database data intact. */
export function storedArticle(value:unknown):Article|undefined{
 if(!record(value))return;
 if(!['id','title','category','source'].every(key=>typeof value[key]==='string')||!(value.id as string).trim()||!strings(value.preview)||!strings(value.paragraphs)||!finite(value.fetchedAt))return;
 for(const key of ['simplified','topics','sourceCategories'])if(value[key]!==undefined&&!strings(value[key]))return;
 for(const key of ['revision','readAt','textVersion','simplifiedVersion'])if(value[key]!==undefined&&!finite(value[key]))return;
 for(const key of ['saved','complete','simplifiedPrepared'])if(value[key]!==undefined&&typeof value[key]!=='boolean')return;
 for(const key of ['contentIssue','simplifiedPreview','simplifiedInput'])if(value[key]!==undefined&&typeof value[key]!=='string')return;
 if(value.contentIssueKind!==undefined&&!['network','limit','content','offline'].includes(value.contentIssueKind as string))return;
 const edition=value.edition;
 if(edition!==undefined&&(!record(edition)||edition.version!==1||!strings(edition.continuation)||!strings(edition.sourcePassages)||!strings(edition.related)))return;
 const provenance=value.provenance;
 if(provenance!==undefined&&(!record(provenance)||!['wikipedia','wikivoyage'].includes(provenance.provider as string)||!['title','url','license','attribution'].every(key=>typeof provenance[key]==='string')||provenance.revision!==undefined&&!finite(provenance.revision)||provenance.section!==undefined&&typeof provenance.section!=='string'))return;
 const verification=value.verification;
 if(verification!==undefined&&(!record(verification)||verification.version!==1||typeof verification.fingerprint!=='string'||typeof verification.reviewId!=='string'))return;
 const classification=value.classification;
 if(classification!==undefined&&(!record(classification)||!finite(classification.version)||typeof classification.fingerprint!=='string'||!['local','gemini'].includes(classification.provider as string)||!finite(classification.confidence)))return;
 const retrieval=value.retrieval;
 if(retrieval!==undefined&&(!record(retrieval)||typeof retrieval.method!=='string'||retrieval.topic!==undefined&&typeof retrieval.topic!=='string'))return;
 const sequence=value.feedSequence;
 if(sequence!==undefined&&(!record(sequence)||!finite(sequence.order)||!finite(sequence.lastPathStart)))return;
 return value as Article;
}
