import {Capacitor} from '@capacitor/core';
import {SecureStorage,KeychainAccess} from '@aparajita/capacitor-secure-storage';
const memory=new Map(),legacyKeys=new Set();
export function clearLegacyBrowserSession(){for(const key of legacyKeys){try{localStorage.removeItem(key);}catch{}}legacyKeys.clear();}
export const accountStorage={
 async getItem(key){
  if(Capacitor.isNativePlatform()){const saved=await SecureStorage.get(key);if(saved!=null)return saved;let previous=null;try{previous=localStorage.getItem(key);}catch{}if(previous){await SecureStorage.set(key,previous,false,false,KeychainAccess.whenUnlockedThisDeviceOnly);localStorage.removeItem(key);}return previous;}
  if(memory.has(key))return memory.get(key);
  // Migrate the previous SDK session once; new web tokens remain in memory until the cookie exchange.
  try{const previous=localStorage.getItem(key);if(previous){legacyKeys.add(key);memory.set(key,previous);return previous;}}catch{}
  return null;
 },
 async setItem(key,value){if(Capacitor.isNativePlatform())await SecureStorage.set(key,value,false,false,KeychainAccess.whenUnlockedThisDeviceOnly);else memory.set(key,value);},
 async removeItem(key){if(Capacitor.isNativePlatform())await SecureStorage.remove(key);else{memory.delete(key);try{localStorage.removeItem(key);}catch{}}},
};
const EMAIL_KEY='immigra.last-email.v1';
export function lastAccountEmail(){try{return localStorage.getItem(EMAIL_KEY)||'';}catch{return '';}}
export function rememberAccountEmail(email){try{if(email)localStorage.setItem(EMAIL_KEY,email.trim());else localStorage.removeItem(EMAIL_KEY);}catch{}}
