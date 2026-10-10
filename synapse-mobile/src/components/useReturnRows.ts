import {useRef,useState} from 'react';
import {returnDisposition,localReturnReorder} from '../content/readerReturn';

// Storage may record a visit immediately. Its visual order has a separate
// handoff, driven by the reader's position, never by a timeout or measurement.
export function useReturnRows<T extends {id:string}>(live:T[]){
  const latest=useRef(live);latest.current=live;
  const [held,setHeld]=useState<{id:string;rows:T[]}|null>(null),[handoffRows,setHandoffRows]=useState<T[]|null>(null);
  const released=handoffRows!==null,next=handoffRows??live;
  return {
    rows:held?(handoffRows??held.rows):live,
    changed:!!held&&returnDisposition(held.rows,next,held.id)!=='attached',
    released,
    animate:!!held&&released&&localReturnReorder(held.rows,next,held.id),
    hold:(id:string)=>{setHeld({id,rows:[...latest.current]});setHandoffRows(null)},
    // Latch the handoff too. Further async changes wait for the visual endpoint.
    near:()=>{if(held)setHandoffRows([...latest.current])},
    restore:()=>setHandoffRows(null),
    finish:()=>{setHeld(null);setHandoffRows(null)},
  };
}
