import React,{useEffect,useState} from 'react';
import {Alert,AppState,Image,Platform,Text,TouchableOpacity,View} from 'react-native';
import {getAppIconState,setAppIcon,supportsAlternateIcons} from 'expo-awesome-app-icon';

const OPTIONS=[
 {key:'sunny-sprite',label:'Sunny Sprite',source:require('./assets/mascots/sunny-sprite.png')},
 {key:'mono-peek',label:'Mono Peek',source:require('./assets/mascots/mono-peek.png')},
 {key:'red-cat',label:'Red Cat',source:require('./assets/mascots/red-cat.png')},
 {key:'sleepy-cat',label:'Sleepy Cat',source:require('./assets/mascots/sleepy-cat.png')},
 {key:'night-watcher',label:'Night Watcher',source:require('./assets/mascots/night-watcher.png')},
 {key:'ink-emblem',label:'Ink Emblem',source:require('./assets/mascots/ink-emblem.png')},
 {key:'yin-yang',label:'Yin Yang',source:require('./assets/mascots/yin-yang.png')}
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
     // Restore the immediate icon switch used in the reliable 2.7.5 release.
     await setAppIcon(name);
     refresh();
     Alert.alert('Icon updated', 'The app may close while Android refreshes the icon.');
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
       style={{width:68,alignItems:'center',gap:6,opacity:supported?1:0.5}}>
       <View style={{width:64,height:64,borderRadius:16,borderWidth:selected===item.key?3:1,borderColor:selected===item.key?accent:'#576457',padding:selected===item.key?2:0,overflow:'hidden'}}>
         <Image source={item.source} resizeMode="contain" style={{width:58,height:58,borderRadius:12}}/>
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
