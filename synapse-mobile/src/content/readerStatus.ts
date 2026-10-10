import type {Article} from './types';
export type ReaderStatus={kind:'loading'|'revising'|'network'|'offline'|'content'|'ai';message:string;action?:'article'|'ai'|'source'};
export function articleStatus(a:Article,online:boolean):ReaderStatus|undefined{
  if(a.complete)return undefined;
  if(!online)return {kind:'offline',message:'L’anteprima è disponibile offline. L’approfondimento non è ancora stato scaricato.',action:'article'};
  if(a.contentIssueKind==='content')return {kind:'content',message:a.contentIssue||'Approfondimento non disponibile per questa voce.',action:'source'};
  return {kind:'network',message:a.contentIssueKind==='limit'?'Wikipedia è momentaneamente occupata. L’anteprima resta disponibile.':'Non è stato possibile scaricare l’approfondimento. L’anteprima resta disponibile.',action:'article'};
}
export function aiFailure(message:string):ReaderStatus{return {kind:'ai',message:`Il testo originale resta leggibile. ${message}`,action:'ai'}};
