import React,{useEffect,useState} from 'react';
import {Alert,AppState,Image,Platform,Text,TouchableOpacity,View} from 'react-native';
import {getAppIconState,setAppIcon,supportsAlternateIcons} from 'expo-awesome-app-icon';

const OPTIONS=[
 {key:'cat',label:'Night Cat',source:require('./assets/mascots/cat.png')},
 {key:'ghost',label:'Dream Ghost',source:require('./assets/mascots/ghost.png')},
 {key:'bunny',label:'Shadow Bunny',source:require('./assets/mascots/bunny.png')},
 {key:'doodle',label:'Doodle Cat',source:require('./assets/mascots/doodle.png')},
 {key:'flame',label:'Pink Flame',source:require('./assets/mascots/flame.png')}
];
// The in-app Thunder A color is deliberately independent of launcher icon selection.
export default function AppIconSettings({accent='#A3FF29'}){
 const [selected,setSelected]=useState(null);
 const [installed,setInstalled]=useState(null);
 const [pending,setPending]=useState(false);
 const [busy,setBusy]=useState(false);
 const supported=Platform.OS==='android'&&supportsAlternateIcons();
 const refresh=()=>{
   if(!supported)return;
   try{
     const info=getAppIconState();
     setSelected(info.selected);
     setInstalled(info.installed);
     setPending(info.isPending);
   }catch(error){}
 };
 useEffect(()=>{
   refresh();
   const sub=AppState.addEventListener('change',state=>{if(state==='active')refresh()});
   return()=>sub.remove();
 },[supported]);
 const choose=async name=>{
   if(!supported||busy)return;
   setBusy(true);
   try{
     // Apply natively now instead of waiting for a background transition:
     // some Samsung launchers do not complete the queued transition reliably.
     await setAppIcon(name);
     refresh();
     Alert.alert('Icon updated','Your launcher may briefly close Ascend or take a few seconds to refresh. Check the phone home screen.');
   }catch(error){Alert.alert('App icon',error?.message||'Unable to change your home screen icon.')}
   finally{setBusy(false)}
 };
 return <View style={{backgroundColor:'rgba(22,30,21,.96)',borderColor:accent+'77',borderWidth:1,borderRadius:20,padding:16,gap:15}}>
   <Text style={{color:'#F5FFF0',fontSize:21,fontWeight:'900'}}>App icon</Text>
   <Text style={{color:'#B4C2AE',fontSize:12,lineHeight:18}}>Choose an icon for your phone. The Ascend header and theme colors stay unchanged.</Text>
   <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-around',rowGap:16,columnGap:8}}>
     {OPTIONS.map(item=><TouchableOpacity key={item.key} disabled={!supported||busy} onPress={()=>choose(item.key)}
       accessibilityRole="button" accessibilityLabel={'Choose '+item.label+' app icon'}
       accessibilityState={{selected:selected===item.key,disabled:!supported||busy}}
       style={{width:83,alignItems:'center',gap:6,opacity:supported?1:0.5}}>
       <View style={{width:70,height:70,borderRadius:17,borderWidth:selected===item.key?3:1,borderColor:selected===item.key?accent:'#576457',padding:selected===item.key?2:0,overflow:'hidden'}}>
         <Image source={item.source} resizeMode="contain" style={{width:64,height:64,borderRadius:13}}/>
       </View>
       <Text numberOfLines={2} style={{color:selected===item.key?accent:'#DCE8D8',fontSize:11,fontWeight:'800',textAlign:'center'}}>{item.label}</Text>
       {selected===item.key?<Text style={{color:accent,fontSize:10}}>{pending?'Pending':installed===item.key?'Selected':'Selected'}</Text>:null}
     </TouchableOpacity>)}
   </View>
   <TouchableOpacity disabled={!supported||busy} onPress={()=>choose(null)} style={{padding:12,alignItems:'center',borderRadius:12,borderWidth:1,borderColor:accent+'99',backgroundColor:accent+'14'}}>
     <Text style={{color:accent,fontWeight:'800',fontSize:13}}>Restore original Ascend icon</Text>
   </TouchableOpacity>
   {pending?<Text style={{color:accent,fontSize:12}}>Android is applying your selection. Return to your phone home screen.</Text>:null}
   {!supported?<Text style={{color:'#B4C2AE',fontSize:12}}>Launcher icon selection is unavailable on this build.</Text>:null}
 </View>;
}
