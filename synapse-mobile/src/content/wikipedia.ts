import { CATEGORIES } from './categories';
import { generalAudienceScore, makePreview, paragraphsFromExtract } from './text';
import type { Article } from './types';
import {PERSONALIZATION} from './personalization';
import {chooseCategory,discoveryAnchor,rankRecommendations,emptyLearning,type Learning} from './recommendations';
import {paragraphsFromHtml} from './html';
import {discoveryCandidates} from './editorial';
import {classifyLocal} from './classification';
declare const __DEV__:boolean;
const ENDPOINT='https://it.wikipedia.org/w/api.php';
type Page={pageid:number;title:string;extract?:string;fullurl?:string;revisions?:{revid:number}[];missing?:boolean;pageprops?:Record<string,string>;categories?:{title:string}[]};
type Response={query?:{pages?:Page[]};parse?:{text:string;revid?:number;properties?:{name:string;value:string}[]|Record<string,string>};continue?:Record<string,string>;error?:{code:string;info:string}};
export class WikiError extends Error { constructor(message:string,public kind:'network'|'limit'|'content'='network',public retryAfterMs=0,public recoverable=true,public status?:number){super(message)} }
export function retryDelay(value:string|null,now=Date.now()){const seconds=Number(value);return value&&Number.isFinite(seconds)?Math.max(0,seconds*1000):Math.max(0,Date.parse(value||'')-now)||1000}
export class Wikipedia {
  private cursors=new Map<string,Record<string,string>>();
  private usedSeeds=new Set<string>();
  private categoryIndex=0;
  private linkIndex=new Map<string,number>();
  private serviceAfter=0;private serviceKind:'network'|'limit'='limit';
  private shuffledSeeds=new Map(CATEGORIES.map(c=>[c.id,c.seeds.map(s=>({s,n:Math.random()})).sort((a,b)=>a.n-b.n).map(r=>r.s)]));
  constructor(private fetcher:typeof fetch=globalThis.fetch.bind(globalThis)){}
  async request(params:Record<string,string>, signal?:AbortSignal,attempts=2):Promise<Response>{
    if(signal?.aborted)throw signal.reason;
    if(Date.now()<this.serviceAfter)throw new WikiError('Il servizio richiede una pausa. Riprova tra poco.',this.serviceKind,this.serviceAfter-Date.now());
    const url=new URL(ENDPOINT);Object.entries({format:'json',formatversion:'2',origin:'*',...params}).forEach(([k,v])=>url.searchParams.set(k,v));
    for(let attempt=0;attempt<attempts;attempt++){
      if(signal?.aborted)throw signal.reason||new Error('Richiesta annullata');
      const controller=new AbortController();
      const abort=()=>controller.abort(signal?.reason);signal?.addEventListener('abort',abort,{once:true});
      const timeout=setTimeout(()=>controller.abort(),10000);
      let retrySeconds=0;
      try{
      const response=await this.fetcher(url.toString(),{signal:controller.signal,headers:{'User-Agent':'Synapse/0.1.3 (personal educational reader; app.synapse.reader) ReactNative/0.86','Api-User-Agent':'Synapse/0.1.3 (personal educational reader; app.synapse.reader)','Accept':'application/json'}});
      if(response.status===429||response.status===503){
        const delay=retryDelay(response.headers.get('Retry-After'));
        if(response.status===429){this.serviceAfter=Date.now()+delay;this.serviceKind='limit';throw new WikiError('Il servizio richiede una pausa. Riprova tra poco.','limit',delay)}
        if(attempt===attempts-1||delay>5000){this.serviceAfter=Date.now()+delay;this.serviceKind='network';throw new WikiError('Non riusciamo a caricare nuovi articoli. Riprova tra poco.','network',delay)}
        retrySeconds=Math.max(1,delay/1000);
      }else{
      if(!response.ok)throw new WikiError('Non riusciamo a caricare nuovi articoli. Riprova tra poco.','network',0,response.status>=500||response.status===408,response.status);
      const data=await response.json() as Response;
      if(controller.signal.aborted)throw controller.signal.reason||new Error('Richiesta annullata');
      if(data.error)throw new WikiError('Non riusciamo a caricare questi articoli. Riprova più tardi.',/maxlag|ratelimited/.test(data.error.code)?'limit':'content',30000,false);return data;
      }
      }catch(error){if(signal?.aborted)throw signal.reason||error;if(error instanceof WikiError)throw error;throw new WikiError('Non riusciamo a caricare nuovi articoli. Riprova tra poco.')}
      finally{clearTimeout(timeout);signal?.removeEventListener('abort',abort)}
      if(signal?.aborted)throw signal.reason||new Error('Richiesta annullata');
      await new Promise<void>((resolve,reject)=>{
        const done=()=>{signal?.removeEventListener('abort',cancel);resolve()};
        const timer=setTimeout(done,retrySeconds*1000);
        const cancel=()=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel);reject(signal?.reason||new Error('Richiesta annullata'))};
        signal?.addEventListener('abort',cancel,{once:true});
        if(signal?.aborted)cancel();
      });
    }
    throw new WikiError('Richiesta non riuscita');
  }
  private articles(data:Response,category:string):Article[]{return (data.query?.pages||[]).flatMap(p=>{
    const paragraphs=paragraphsFromExtract(p.extract||'');
    if(p.missing||Object.prototype.hasOwnProperty.call(p.pageprops||{},'disambiguation')||(p.categories||[]).some(c=>/disambiguazione/i.test(c.title))||generalAudienceScore(p.title,paragraphs)<.45)return [];
    return [classifyLocal({id:`wiki:${p.pageid}`,title:p.title,category:'general',paragraphs,preview:makePreview(paragraphs),source:p.fullurl||`https://it.wikipedia.org/wiki/${encodeURIComponent(p.title)}`,revision:p.revisions?.[0]?.revid,fetchedAt:Date.now(),textVersion:3,sourceCategories:(p.categories||[]).map(c=>c.title),retrieval:{topic:category,method:'wikipedia'}})];
  })}
  // TextExtracts permits multiple extracts only in introduction mode.
  private props={action:'query',prop:'extracts|info|revisions|categories|pageprops',ppprop:'disambiguation',cllimit:'24',clshow:'!hidden',explaintext:'1',exsectionformat:'wiki',exlimit:'max',exintro:'1',inprop:'url',rvprop:'ids',redirects:'1'};
  async full(article:Article,signal?:AbortSignal):Promise<Article>{
    const identity:Record<string,string>=article.id.startsWith('wiki:')?{pageids:article.id.slice(5)}:{titles:decodeURIComponent(new URL(article.source).pathname.split('/wiki/')[1]).replaceAll('_',' ')};
    const {exintro,...fullProps}=this.props;
    const parseIdentity:Record<string,string>=identity.pageids?{pageid:identity.pageids}:{page:identity.titles};
    let parsed:Response|undefined;
    try{parsed=await this.request({action:'parse',...parseIdentity,prop:'text|revid|properties',redirects:'1'},signal)}catch(error){if(signal?.aborted||!(error instanceof WikiError)||error.kind!=='content')throw error}
    const properties=parsed?.parse?.properties;
    if(Array.isArray(properties)?properties.some(p=>p.name==='disambiguation'):Object.prototype.hasOwnProperty.call(properties||{},'disambiguation'))throw new WikiError('Questa voce è una disambiguazione, non un articolo divulgativo. Apri Wikipedia per scegliere la voce corretta.','content');
    if(parsed?.parse?.text){const paragraphs=paragraphsFromHtml(parsed.parse.text);if(paragraphs.length)return {...article,paragraphs,preview:article.preview,simplified:undefined,simplifiedVersion:undefined,simplifiedPreview:undefined,simplifiedInput:undefined,simplifiedPrepared:undefined,complete:true,contentIssue:undefined,contentIssueKind:undefined,textVersion:3,revision:parsed.parse.revid||article.revision}}
    const data=parsed?.query?parsed:await this.request({...fullProps,...identity,exlimit:'1'},signal);
    const page=data.query?.pages?.[0];
    if(Object.prototype.hasOwnProperty.call(page?.pageprops||{},'disambiguation'))throw new WikiError('Questa voce è una disambiguazione, non un articolo divulgativo.','content');
    const paragraphs=paragraphsFromExtract(page?.extract||'');
    return paragraphs.length&&!page?.missing?{...article,source:page!.fullurl||article.source,paragraphs,preview:article.preview,simplified:undefined,simplifiedVersion:undefined,simplifiedPreview:undefined,simplifiedInput:undefined,simplifiedPrepared:undefined,complete:true,contentIssue:undefined,contentIssueKind:undefined,textVersion:3,revision:page?.revisions?.[0]?.revid||article.revision}:(()=>{throw new WikiError('Testo insufficiente o privo di un’introduzione chiara. Consulta la fonte Wikipedia.','content')})();
  }
  async batch(categoryId:string,exclude:Set<string>,limit=6,signal?:AbortSignal,learning:Learning=emptyLearning(),options:{maxRounds?:number;requestAttempts?:number;alternative?:boolean;strategyAttempt?:number;preferInterest?:boolean;onChunk?:(rows:Article[])=>Promise<void>|void}={}):Promise<Article[]>{
    const output:Article[]=[];
    const identities=new Set<string>();
    for(let round=0;round<Math.min(5,options.maxRounds??5)&&output.length<limit;round++){
      const category=CATEGORIES.find(c=>c.id===(categoryId==='all'?chooseCategory(learning):categoryId))||CATEGORIES[this.categoryIndex++%CATEGORIES.length];
      const count=categoryId==='all'?Math.min(2,limit):limit;
      const seeds=(this.shuffledSeeds.get(category.id)||category.seeds).filter(s=>!this.usedSeeds.has(s)).slice(0,count);
      let data:Response;
      const request=(params:Record<string,string>)=>this.request(params,signal,options.requestAttempts??2);
      const anchorSignal=!options.alternative&&categoryId==='all'&&round===0&&(options.preferInterest||Math.random()<PERSONALIZATION.anchorProbability)?discoveryAnchor(learning):undefined;
      const explore=!anchorSignal&&categoryId==='all'&&round===0&&Math.random()<.3;
      if(anchorSignal){data=await request({...this.props,generator:'search',gsrsearch:anchorSignal.title,gsrnamespace:'0',gsrlimit:'12'})}
      else if(explore){data=await request({...this.props,generator:'random',grnnamespace:'0',grnfilterredir:'nonredirects',grnlimit:'6'})}
      else if(options.strategyAttempt===3&&categoryId!=='all'){data=await request({...this.props,generator:'search',gsrsearch:category.wiki,gsrnamespace:'0',gsrlimit:'12'})}
      else if(seeds.length&&!options.alternative&&(round%2===0||category.id==='curiosity')){data=await request({...this.props,titles:seeds.join('|')});seeds.forEach(s=>this.usedSeeds.add(s))}
      else{
        // Linked discoveries avoid being trapped in the first alphabetical category members.
        const anchors=this.shuffledSeeds.get(category.id)||category.seeds,index=this.linkIndex.get(category.id)??0;
        const cursor=this.cursors.get(category.id),anchor=cursor?.titles||anchors[index%anchors.length];
        data=await request({...this.props,generator:'links',titles:anchor,gplnamespace:'0',gpllimit:'12',...cursor});
        if(signal?.aborted)throw signal.reason;
        if(data.continue)this.cursors.set(category.id,{...data.continue,titles:anchor});else {this.cursors.delete(category.id);this.linkIndex.set(category.id,index+1)}
      }
      const chunkSources=new Set(identities),chunkIds=new Set(output.map(a=>a.id));
      const method=anchorSignal?'interest-search':explore?'random':options.strategyAttempt===3&&categoryId!=='all'?'topic-search':seeds.length&&!options.alternative?'seeds':'links';
      const available=this.articles(data,anchorSignal?.category||(explore?'general':category.id)).map(a=>({...a,retrieval:{topic:category.id,method}})).filter(a=>{
        // Acquisition provenance never substitutes for semantic relevance.
        if(categoryId!=='all'&&a.category!==categoryId)return false;
        const source=decodeURIComponent(new URL(a.source).pathname).replaceAll('_',' ').toLocaleLowerCase('it');
        if(exclude.has(a.id)||exclude.has(source)||chunkSources.has(source)||chunkIds.has(a.id))return false;
        chunkSources.add(source);chunkIds.add(a.id);return true;
      });
      const eligible=discoveryCandidates(available,categoryId==='all'?available.length:limit-output.length,output.slice(-3));
      const rows=categoryId==='all'?rankRecommendations(eligible,learning,()=>.5,output.slice(-3)).slice(0,limit-output.length):eligible;
      const chunk:Article[]=[];
      for(const a of rows){
        const source=decodeURIComponent(new URL(a.source).pathname).replaceAll('_',' ').toLocaleLowerCase('it');
        if(output.length>=limit)break;
        if(!exclude.has(a.id)&&!exclude.has(source)&&!identities.has(source)&&!output.some(b=>b.id===a.id)){output.push(a);chunk.push(a);identities.add(source)}
      }
      if(chunk.length)await options.onChunk?.(chunk);
      if(signal?.aborted)throw signal.reason||new Error('Richiesta annullata');
    }
    return output.slice(0,limit);
  }
  async search(query:string,signal?:AbortSignal):Promise<Article[]>{
    if(!query.trim())return [];
    // The API's search ordering is retained; cache presence never boosts ranking.
    const data=await this.request({...this.props,generator:'search',gsrsearch:query,gsrnamespace:'0',gsrlimit:'12'},signal);
    const pages=data.query?.pages as (Page&{index?:number})[]|undefined;
    if(pages)pages.sort((a,b)=>(a.index||0)-(b.index||0));
    return this.articles(data,'general');
  }
  async random(exclude:Set<string>,signal?:AbortSignal):Promise<Article|undefined>{
    for(let i=0;i<3;i++){
      const data=await this.request({...this.props,generator:'random',grnnamespace:'0',grnfilterredir:'nonredirects',grnlimit:'3'},signal);
      const article=discoveryCandidates(this.articles(data,'general').filter(a=>!exclude.has(a.id)&&!exclude.has(decodeURIComponent(new URL(a.source).pathname).replaceAll('_',' ').toLocaleLowerCase('it'))),1)[0];if(article)return article;
    }
  }
}
