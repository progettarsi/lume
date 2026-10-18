import {useRef,type ReactNode} from 'react';

/** One bounded, warm scene avoids expensive remounts on rapid navigation.
 * Commit the final hidden props once (cleanup/security), then freeze parent
 * reconciliations until re-entry. Context/accessibility remain authoritative. */
export function CachedScene({active,children}:{active:boolean;children:ReactNode}){
 const scene=useRef(children),wasActive=useRef(active);
 if(active||wasActive.current)scene.current=children;
 wasActive.current=active;
 return scene.current;
}
