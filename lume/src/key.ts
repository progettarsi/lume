import * as SecureStore from 'expo-secure-store';
import {readSecret,writeSecret} from './content/legacyNames';
export const getAIKey=()=>readSecret(SecureStore);
export const putAIKey=(key:string)=>writeSecret(SecureStore,key);
