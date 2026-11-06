import {cloud} from './cloud';
import * as FileSystem from 'expo-file-system/legacy';
import {decode} from 'base64-arraybuffer';

// A local cache remains available offline. Only signed-in users can reach cloud data.
// The Journal is cloud-backed (user-requested). Its PIN stays strictly device-local.
const MEDIA='ascend-private-media';
export const PROGRESS_KEY='ascend-v1';
export const APPEARANCE_KEY='ascend-appearance-v1';
export const SYNC_INFO='ascend-cloud-sync-v2';
const remoteAppearance=appearance=>{
  if(!appearance)return null;
  const {backgroundUri,cloudBackgroundSource,cloudBackgroundUrl,...safe}=appearance;
  return {...safe,backgroundUri:null};
};
export function cloudPayload(progress,appearance){
  const {pin,...safe}=progress||{};
  delete safe.ascendAppearance;
  return {...safe,ascendAppearance:remoteAppearance(appearance)};
}
export function cloudProgress(remote,local){
  if(!remote||typeof remote!=='object')return local;
  const {ascendAppearance,...progress}=remote;
  return {...local,...progress,pin:local.pin||''};
}
export async function fetchCloudState(userId){
  const {data,error}=await cloud.from('ascend_state').select('data,updated_at').eq('user_id',userId).maybeSingle();
  if(error)throw error;
  return data;
}
export async function pushCloudState(userId,progress,appearance){
  const {error}=await cloud.from('ascend_state').upsert({
    user_id:userId,data:cloudPayload(progress,appearance),updated_at:new Date().toISOString()
  },{onConflict:'user_id'});
  if(error)throw error;
}
export function isEmptyProgress(d){
  return !(d.runs?.length||Object.keys(d.workouts||{}).length||Object.values(d.runChecks||{}).some(Boolean)||
    Object.values(d.goalChecks||{}).some(Boolean)||(d.cycles||[]).length||(d.journal||[]).length);
}
export async function prepareCloudBackground(userId,appearance){
  if(!appearance?.backgroundUri?.startsWith('file://'))return appearance;
  if(appearance.cloudBackgroundSource===appearance.backgroundUri&&appearance.cloudBackgroundPath)return appearance;
  const filename=userId+'/appearance/background-'+Date.now()+'.jpg';
  const base64=await FileSystem.readAsStringAsync(appearance.backgroundUri,{encoding:FileSystem.EncodingType.Base64});
  const {error}=await cloud.storage.from(MEDIA).upload(filename,decode(base64),{
    contentType:'image/jpeg',upsert:false,cacheControl:'3600'
  });
  if(error)throw error;
  return {...appearance,cloudBackgroundPath:filename,cloudBackgroundSource:appearance.backgroundUri};
}
export async function downloadCloudBackground(remoteAppearanceValue){
  if(!remoteAppearanceValue?.cloudBackgroundPath)return remoteAppearanceValue;
  const {data,error}=await cloud.storage.from(MEDIA).createSignedUrl(remoteAppearanceValue.cloudBackgroundPath,600);
  if(error)throw error;
  if(!data?.signedUrl||!FileSystem.documentDirectory)throw Error('Unable to access cloud background.');
  const filename=FileSystem.documentDirectory+'ascend-cloud-background-'+Date.now()+'.jpg';
  const result=await FileSystem.downloadAsync(data.signedUrl,filename);
  if(result.status!==200)throw Error('Unable to retrieve cloud background image.');
  return {...remoteAppearanceValue,backgroundUri:filename,cloudBackgroundSource:filename};
}
