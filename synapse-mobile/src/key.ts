import * as SecureStore from 'expo-secure-store';
export const getAIKey=()=>SecureStore.getItemAsync('synapse-ai-key');
export const putAIKey=(key:string)=>key.trim()?SecureStore.setItemAsync('synapse-ai-key',key.trim()):SecureStore.deleteItemAsync('synapse-ai-key');
