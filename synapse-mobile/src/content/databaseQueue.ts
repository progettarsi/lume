import {serialWrites} from './articleState';
/** One owner/connection, serial reads AND writes, bounded recovery for invalid Android handles. */
export function databaseQueue<T>(open:()=>Promise<T>,close:(db:T)=>Promise<void>){
  const enqueue=serialWrites();let connection:T|undefined;
  return function run<R>(operation:(db:T)=>Promise<R>):Promise<R>{return enqueue(async()=>{
    for(let attempt=0;attempt<2;attempt++){
      try{connection??=await open();return await operation(connection)}catch(error){
        if(attempt||!(/NativeDatabase\.(?:prepareAsync|execAsync)|database.*closed/i.test(String(error))&&/NullPointerException|closed/i.test(String(error))))throw error;
        const old=connection;connection=undefined;if(old)await close(old).catch(()=>{});
      }
    }
    throw new Error('Archivio locale non disponibile. Riavvia l’app e riprova.');
  })};
}
