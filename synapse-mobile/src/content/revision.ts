import type {Article} from './types';
// Bump when prompt, model allowlist, extraction or generation parameters change.
export const REVISION_CONFIG='continuation-1:gemini-3.1/3.5-flash-lite:t.2:1900:350:minimal:json1';
// Exact identity avoids hash collisions. Stored only alongside the local text;
// never included in diagnostics. Credentials do not determine output validity.
export function revisionInput(a:Article){return JSON.stringify([REVISION_CONFIG,a.id,a.source,a.title,a.revision??null,a.textVersion??null,a.preview,a.paragraphs])}
export function validRevision(a:Article){return !!a.simplified?.length&&a.simplifiedVersion===3&&a.simplifiedInput===revisionInput(a)}
export function revisedArticle(a:Article,text:string[]):Article{return {...a,simplified:text,simplifiedVersion:3,simplifiedPreview:JSON.stringify(a.preview),simplifiedInput:revisionInput(a)}}
