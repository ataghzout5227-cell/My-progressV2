import React,{useEffect,useState} from 'react';
import {Alert,Image,Platform,Text,TouchableOpacity,View} from 'react-native';
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
 const [pending,setPending]=useState(false);
 const [busy,setBusy]=useState(false);
 const supported=Platform.OS==='android'&&supportsAlternateIcons();
 useEffect(()=>{
   if(!supported)return;
   try{const info=getAppIconState();setSelected(info.selected);setPending(info.isPending)}catch(error){}
 },[supported]);
 const choose=async name=>{
   if(!supported||busy)return;
   setBusy(true);
   try{
     await setAppIcon(name,{deferUntilBackground:true});
     const state=getAppIconState();
     setSelected(state.selected);setPending(state.isPending);
   }catch(error){Alert.alert('App icon',error?.message||'Unable to change your home screen icon.')}
   finally{setBusy(false)}
 };
 return <View style={{backgroundColor:'rgba(22,30,21,.96)',borderColor:accent+'77',borderWidth:1,borderRadius:20,padding:17,gap:14}}>
   <Text style={{color:'#F5FFF0',fontSize:21,fontWeight:'900'}}>App icon</Text>
   <Text style={{color:'#B4C2AE',fontSize:12,lineHeight:19}}>Pick a mascot for your phone's home screen. Your Thunder A header and theme colors won't change.</Text>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:12,justifyContent:'space-between'}}>
     {OPTIONS.map(item=><TouchableOpacity key={item.key} disabled={!supported||busy} onPress={()=>choose(item.key)}
       accessibilityRole="button" accessibilityLabel={'Choose '+item.label+' app icon'}
       accessibilityState={{selected:selected===item.key,disabled:!supported||busy}}
       style={{width:'30%',gap:7,alignItems:'center',opacity:supported?1:0.5}}>
       <Image source={item.source} style={{width:'100%',aspectRatio:1,borderRadius:22,borderWidth:selected===item.key?3:1,borderColor:selected===item.key?accent:'#6B746B'}}/>
       <Text style={{color:selected===item.key?accent:'#DCE8D8',fontSize:11,fontWeight:'800',textAlign:'center'}}>{item.label}</Text>
     </TouchableOpacity>)}
   </View>
   <TouchableOpacity disabled={!supported||busy} onPress={()=>choose(null)} style={{padding:13,alignItems:'center',borderRadius:12,borderWidth:1,borderColor:accent+'99',backgroundColor:accent+'14'}}>
     <Text style={{color:accent,fontWeight:'800'}}>Restore original Ascend app icon</Text>
   </TouchableOpacity>
   {pending?<Text style={{color:accent,fontSize:12}}>Icon selected. Return to the phone home screen to apply it.</Text>:null}
   {!supported?<Text style={{color:'#B4C2AE',fontSize:12}}>Launcher icon selection is available in the Android APK.</Text>:null}
 </View>;
}
