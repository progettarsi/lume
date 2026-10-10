import type {Article} from './types';

/** Downloaded text cannot overwrite a user's bookmark or downgrade a complete article. */
export function mergeArticle(previous:Article|undefined,incoming:Article):Article{
  const content=previous?.complete&&!incoming.complete
    ?{paragraphs:previous.paragraphs,preview:previous.preview,complete:true,simplified:previous.simplified,simplifiedVersion:previous.simplifiedVersion,simplifiedPreview:previous.simplifiedPreview,simplifiedInput:previous.simplifiedInput,simplifiedPrepared:previous.simplifiedPrepared,textVersion:previous.textVersion,contentIssue:previous.contentIssue,contentIssueKind:previous.contentIssueKind}:{};
  const simplified=incoming.simplified||(previous?.revision===incoming.revision&&previous?.textVersion===incoming.textVersion?previous?.simplified:undefined);
  const revisionMeta=incoming.simplified?{simplifiedVersion:incoming.simplifiedVersion,simplifiedPreview:incoming.simplifiedPreview,simplifiedInput:incoming.simplifiedInput,simplifiedPrepared:incoming.simplifiedPrepared}:simplified?{simplifiedVersion:previous?.simplifiedVersion,simplifiedPreview:previous?.simplifiedPreview,simplifiedInput:previous?.simplifiedInput,simplifiedPrepared:previous?.simplifiedPrepared}:{};
  return {...incoming,simplified,...revisionMeta,...content,saved:previous?.saved??false,readAt:previous?.readAt??incoming.readAt};
}

/** Writes run in invocation order, even when an earlier write fails. */
export function serialWrites(){
  let tail:Promise<unknown>=Promise.resolve();
  return function enqueue<T>(work:()=>Promise<T>):Promise<T>{
    const result=tail.then(work);tail=result.catch(()=>{});return result;
  };
}
