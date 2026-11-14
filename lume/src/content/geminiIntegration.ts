import {serialWrites} from './articleState';
export type GeminiConfigurationState={status:'loading'|'missing'|'ready'|'disabled'|'saving'|'error';configured:boolean;enabled:boolean;busy:boolean;message:string;actions:('save'|'remove'|'enable'|'disable')[]};
/** The view receives status and actions, never the stored credential. Key
 * persistence uses the same native SecureStore/session-only web gateway. */
export class GeminiIntegration{
 private key='';private enabled=false;private revision=0;private writes=serialWrites();
 state:GeminiConfigurationState={status:'loading',configured:false,enabled:false,busy:true,message:'Carichiamo la configurazione…',actions:[]};
 constructor(private read:()=>Promise<string|null>,private write:(key:string)=>Promise<void>,private configure:(key:string,enabled:boolean)=>void,private changed:(state:GeminiConfigurationState)=>void=()=>{}){}
 private publish(status:GeminiConfigurationState['status'],message:string){this.state={status,configured:!!this.key,enabled:this.enabled,busy:status==='saving'||status==='loading',message,actions:status==='saving'||status==='loading'?[]:['save',...(this.key?['remove' as const]:[]),this.enabled?'disable':'enable']};this.changed(this.state)}
 private ready(){this.configure(this.key,this.enabled);this.publish(!this.key?'missing':this.enabled?'ready':'disabled',!this.key?'Inserisci una chiave personale Gemini.':this.enabled?'Gemini configurato. Wikipedia resta disponibile.':'Chiave custodita; Gemini disattivato.')}
 async load(){const revision=this.revision;try{const key=await this.read();if(revision!==this.revision)return;this.key=(key||'').trim();this.ready()}catch{if(revision===this.revision)this.publish('error','Configurazione non disponibile. Riprova.')}}
 setEnabled(enabled:boolean){this.enabled=enabled;if(this.state.busy){this.configure(this.key,this.enabled);this.publish(this.state.status,this.state.message)}else this.ready()}
 async save(value:string){const key=value.trim(),revision=++this.revision;this.publish('saving','Salviamo la configurazione…');try{await this.writes(()=>this.write(key));if(revision!==this.revision)return;this.key=key;this.ready()}catch{if(revision===this.revision)this.publish('error','Chiave non salvata. Riprova.');throw Error('Chiave non salvata')}}
 remove(){return this.save('')}
}
