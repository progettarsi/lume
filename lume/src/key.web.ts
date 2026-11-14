// Preview keeps credentials only for this session, never in localStorage or source.
let key='';
export const getAIKey=async()=>key;
export const putAIKey=async(value:string)=>{key=value.trim()};
