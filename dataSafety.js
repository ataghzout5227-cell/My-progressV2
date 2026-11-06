import AsyncStorage from '@react-native-async-storage/async-storage';

// Keep legacy asc​end-v1 untouched in structure: all 2.7.1 progress and journal data
// remain accessible to both versions. New records live under versioned keys.
export const KEYS={
  legacy:'ascend-v1',appearance:'ascend-appearance-v1',
  snapshot:'ascend-2.8-pre-migration-backup',
  migration:'ascend-2.8-migration-complete',
  focus:'ascend-2.8-focus',
  prefs:'ascend-2.8-preferences'
};
export async function prepareMigration(){
  const existing=await AsyncStorage.getItem(KEYS.legacy);
  if(existing!==null){
    let parsed;
    try{parsed=JSON.parse(existing)}catch(e){throw new Error('Your existing progress could not be parsed. No data has been changed.')}
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Existing progress is not valid. No data has been changed.');
  }
  if((await AsyncStorage.getItem(KEYS.migration))==='complete')return;
  // Write the recovery snapshot BEFORE modifying any user data. Never overwrite it.
  if((await AsyncStorage.getItem(KEYS.snapshot))===null){
    const backup={
      schema:1,createdAt:new Date().toISOString(),
      progress:existing,
      appearance:await AsyncStorage.getItem(KEYS.appearance),
      focus:await AsyncStorage.getItem(KEYS.focus)
    };
    await AsyncStorage.setItem(KEYS.snapshot,JSON.stringify(backup));
  }
  await AsyncStorage.setItem(KEYS.migration,'complete');
}
export async function exportRecoveryBackup(){
  const current=await AsyncStorage.getItem(KEYS.legacy);
  const safeProgress=current===null?{}:JSON.parse(current);
  // The Journal is exported only on the user's explicit action. Never export the PIN.
  delete safeProgress.pin;
  return JSON.stringify({
    format:'ascend-backup',version:2,exportedAt:new Date().toISOString(),
    progress:safeProgress,
    appearance:JSON.parse((await AsyncStorage.getItem(KEYS.appearance))||'null'),
    focus:JSON.parse((await AsyncStorage.getItem(KEYS.focus))||'[]')
  },null,2);
}
export function validateImport(raw){
  const obj=JSON.parse(raw);
  // Ascend 2.7.1 exports {app:'Ascend', date, data:{...}} including journal, excluding the PIN.
  if(obj.app==='Ascend'&&obj.data&&typeof obj.data==='object')return {format:'ascend-backup',version:2,progress:obj.data,appearance:null,focus:[]};
  if(obj.format!=='ascend-backup'||obj.version!==2)throw new Error('Not an Ascend backup from version 2.7.1 or 2.8.');
  if(!obj.progress||typeof obj.progress!=='object'||Array.isArray(obj.progress))throw new Error('Backup does not contain valid progress.');
  if(obj.progress.journal!=null&&!Array.isArray(obj.progress.journal))throw new Error('Journal structure is invalid.');
  return obj;
}
export async function importBackupSafely(obj,{keepCurrentPin=true}={}){
  const current=await AsyncStorage.getItem(KEYS.legacy);
  const before=current?JSON.parse(current):{};
  // Write a separate rollback copy, without touching the original migration snapshot.
  await AsyncStorage.setItem('ascend-2.8-before-import',JSON.stringify({
    date:new Date().toISOString(),progress:before,
    appearance:await AsyncStorage.getItem(KEYS.appearance),
    focus:await AsyncStorage.getItem(KEYS.focus)
  }));
  const restored={...obj.progress};
  if(keepCurrentPin&&before.pin)restored.pin=before.pin;
  else delete restored.pin;
  await AsyncStorage.setItem(KEYS.legacy,JSON.stringify(restored));
  if(obj.appearance&&typeof obj.appearance==='object')
    await AsyncStorage.setItem(KEYS.appearance,JSON.stringify(obj.appearance));
  if(Array.isArray(obj.focus))
    await AsyncStorage.setItem(KEYS.focus,JSON.stringify(obj.focus));
  return restored;
}
