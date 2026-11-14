export function safeSourceUrl(url:string):string|undefined{
  if(!url||typeof url!=='string')return undefined;
  try{
    const parsed=new URL(url.trim());
    if(parsed.protocol!=='https:')return undefined;
    const host=parsed.hostname.toLowerCase();
    if(!/^[a-z0-9.-]+$/.test(host))return undefined;
    if(host!=='wikipedia.org'&&!host.endsWith('.wikipedia.org')&&host!=='wikivoyage.org'&&!host.endsWith('.wikivoyage.org'))return undefined;
    return parsed.href;
  }catch{
    return undefined;
  }
}
