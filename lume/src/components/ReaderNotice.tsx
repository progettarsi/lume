import {StatusMessage} from './StatusMessage';
import type {ReaderStatus} from '../content/readerStatus';
export function ReaderNotice({status,onArticle,onAI,onSource,timeoutEnabled=true}:{status:ReaderStatus;onArticle?:()=>void;onAI?:()=>void;onSource:()=>void;timeoutEnabled?:boolean}){
  const action=status.action==='article'?onArticle:status.action==='ai'?onAI:status.action==='source'?onSource:undefined;
  const label=status.action==='article'?'Riprova caricamento':status.action==='ai'?'Riprova revisione Gemini':'Consulta Wikipedia';
  return <StatusMessage status={status} onAction={action} actionLabel={label} timeoutEnabled={timeoutEnabled}/>;
}
