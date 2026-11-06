import {cloud} from './cloud';
import * as FileSystem from 'expo-file-system/legacy';
import {decode} from 'base64-arraybuffer';

const BUCKET='ascend-private-media';
const date=()=>new Date().toISOString();
const withoutLocalImage=book=>{
  const {coverUri,...safe}=book;
  return safe;
};
const objectName=(userId,id,epoch)=>userId+'/books/'+id.replace(/[^a-z0-9_-]/gi,'_')+'-'+epoch+'.jpg';

export async function uploadBookCover(userId,book){
  if(!book.coverUri?.startsWith('file://'))return book;
  if(book.cloudCoverSource===book.coverUri&&book.cloudCoverPath)return book;
  const path=objectName(userId,book.id,Date.now());
  const raw=await FileSystem.readAsStringAsync(book.coverUri,{encoding:FileSystem.EncodingType.Base64});
  const {error}=await cloud.storage.from(BUCKET).upload(path,decode(raw),{
    contentType:'image/jpeg',upsert:false,cacheControl:'3600'
  });
  if(error)throw error;
  return {...book,cloudCoverPath:path,cloudCoverSource:book.coverUri};
}
export async function saveBookToCloud(userId,book){
  const uploaded=await uploadBookCover(userId,book);
  const payload=withoutLocalImage(uploaded);
  delete payload.cloudCoverSource;
  const {error}=await cloud.from('ascend_books').upsert({
    user_id:userId,id:book.id,book:payload,updated_at:uploaded.updatedAt||date()
  },{onConflict:'user_id,id'});
  if(error)throw error;
  return uploaded;
}
export async function fetchBooksFromCloud(userId){
  const {data,error}=await cloud.from('ascend_books').select('id,book,updated_at').eq('user_id',userId).limit(2000);
  if(error)throw error;
  const remote=data.map(r=>({...r.book,id:r.id,updatedAt:r.book.updatedAt||r.updated_at}));
  const signed=await Promise.all(remote.map(async book=>{
    if(!book.cloudCoverPath)return book;
    const {data:link,error:linkError}=await cloud.storage.from(BUCKET).createSignedUrl(book.cloudCoverPath,3600);
    return {...book,cloudCoverUrl:linkError?null:link?.signedUrl||null};
  }));
  return signed;
}
export function mergeBooks(local,remote){
  const byId=new Map();
  for(const b of remote){if(b?.id)byId.set(b.id,b)}
  for(const b of local){
    if(!b?.id)continue;
    const previous=byId.get(b.id);
    if(!previous||Date.parse(b.updatedAt||b.createdAt||'2000-01-01')>=Date.parse(previous.updatedAt||'2000-01-01'))
      byId.set(b.id,b);
  }
  return [...byId.values()].sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));
}
export async function saveAppearanceMedia(userId,appearance){
  if(!appearance.backgroundUri?.startsWith('file://'))return appearance;
  if(appearance.cloudBackgroundSource===appearance.backgroundUri&&appearance.cloudBackgroundPath)return appearance;
  const path=userId+'/background-'+Date.now()+'.jpg';
  const raw=await FileSystem.readAsStringAsync(appearance.backgroundUri,{encoding:FileSystem.EncodingType.Base64});
  const {error}=await cloud.storage.from(BUCKET).upload(path,decode(raw),{contentType:'image/jpeg',upsert:false});
  if(error)throw error;
  return {...appearance,cloudBackgroundPath:path,cloudBackgroundSource:appearance.backgroundUri};
}
export async function remoteAppearance(userId,appearance){
  if(!appearance?.cloudBackgroundPath)return appearance;
  const {data,error}=await cloud.storage.from(BUCKET).download(appearance.cloudBackgroundPath);
  if(error)throw error;
  // A remote cover is not a local file path; download is handled separately on device.
  return appearance;
}
