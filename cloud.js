import 'react-native-url-polyfill/auto';
import {createClient,processLock} from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// These are PUBLIC client credentials. Database access is restricted by Supabase Auth + RLS.
// Never add a service_role or secret key to the mobile application.
const url='https://xspibysdevaqqprefzpk.supabase.co';
const publishableKey='sb_publishable_DqQGTukh-qek5aKp14DjMA_9udCpdte';

const sessionStorage={
  getItem:async key=>SecureStore.getItemAsync(key),
  setItem:async(key,value)=>SecureStore.setItemAsync(key,value),
  removeItem:async key=>SecureStore.deleteItemAsync(key),
};

export const cloud=createClient(url,publishableKey,{
  auth:{
    storage:sessionStorage,
    autoRefreshToken:true,
    persistSession:true,
    detectSessionInUrl:false,
    lock:processLock,
  },
});
