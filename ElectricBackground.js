import React, {memo, useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Defs, LinearGradient, Stop, Rect, Path} from 'react-native-svg';
import {normalizeAppearance} from './AppearanceSettings';

// Deterministic vector artwork: distinct branching, sharp, flowing and minimal styles.
function createPaths(style){
 let seed=style==='storm'?310719:style==='strike'?913:812;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const parts=[];
 function bolt(x,y,dx,dy,steps,width,depth,curve=false){
   let path='M'+x.toFixed(1)+' '+y.toFixed(1);
   let a=x,b=y;
   for(let n=0;n<steps;n++){
     a+=dx+(rand()-.5)*(curve?5:style==='strike'?24:16);
     b+=dy+(rand()-.5)*(curve?6:style==='strike'?18:13);
     if(curve)path+=' Q'+(a-11).toFixed(1)+' '+(b-11).toFixed(1)+' '+a.toFixed(1)+' '+b.toFixed(1);
     else path+=' L'+a.toFixed(1)+' '+b.toFixed(1);
     if(depth>0&&n>1&&rand()<(style==='storm'?.23:.09)){
       bolt(a,b,dx*.68+(rand()-.5)*19,dy*.75+(rand()-.5)*12,
         Math.max(3,Math.floor(steps*.33)),width*.50,depth-1,curve);
     }
   }
   parts.push({path,width});
 }
 if(style==='storm'){
   bolt(-30,5,13,10,59,4.6,3);
   bolt(415,-30,-13,11,60,4.3,3);
   bolt(-25,375,12,8,45,3.4,3);
   bolt(418,441,-14,7,46,3.5,3);
   bolt(35,878,10,-10,34,3.5,2);
   bolt(360,873,-10,-11,34,3.4,2);
 }else if(style==='strike'){
   bolt(35,-40,10,16,54,4.7,2);
   bolt(380,-10,-11,18,52,4.4,2);
   bolt(-40,330,13,12,46,4,2);
   bolt(420,350,-13,13,45,4,2);
 }else{
   bolt(5,10,8,10,75,1.6,0);
   bolt(390,0,-8,10,74,1.4,0);
   bolt(0,830,8,-10,68,1.25,0);
   bolt(390,830,-8,-10,68,1.25,0);
 }
 if(style!=='minimal')for(let i=0;i<(style==='storm'?10:5);i++){
   bolt(rand()*420-15,rand()*830,(rand()-.5)*8,6+rand()*7,5+Math.floor(rand()*12),.7,0,false);
 }
 const buckets=new Map();
 parts.forEach(item=>{
   const width=Math.max(.25,Math.round(item.width*2)/2);
   if(!buckets.has(width))buckets.set(width,[]);
   buckets.get(width).push(item.path);
 });
 return Array.from(buckets,([width,group])=>({width,d:group.join(' ')}));
}
const ARTWORK={
 storm:createPaths('storm'),strike:createPaths('strike'),
 minimal:createPaths('minimal')
};
const layers=[
 {scale:3.6,opacity:.055},
 {scale:1.65,opacity:.17},
 {scale:.63,opacity:.49},
 {scale:.22,opacity:.85}
];
function ElectricBackground({tab='Home',settings=false,appearance,photoMode=false}){
 const config=normalizeAppearance(appearance);
 const isMinimal=config.style==='minimal';
 const activityOpacity=settings?.62:
   tab==='Home'?1:tab==='Achievements'?.92:
   tab==='Running'?.72:tab==='Workout'?.75:tab==='Journal'?.53:.72;
 const intensity=config.intensity/100;
 const opacity=activityOpacity*intensity;
 const artwork=ARTWORK[config.style]||ARTWORK.storm;
 const shapes=useMemo(()=>layers.flatMap((layer,i)=>artwork.map((item,j)=>
   <Path key={i+'-'+j} d={item.d} fill="none"
     stroke={i===3?'#F8FFF1':config.lightningColor}
     strokeWidth={Math.max(.1,item.width*layer.scale*(isMinimal?.62:1))}
     strokeLinecap="round" strokeLinejoin="round"
     opacity={layer.opacity*(item.width<1?.35:1)}/>
 )),[config.style,config.lightningColor]);
 if(photoMode&&!config.showLightningOnPhoto)return null;
 return <View pointerEvents="none" style={[StyleSheet.absoluteFillObject,{opacity:Math.min(1,opacity)}]}>
   <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
     <Defs><LinearGradient id="ambient" x1="0%" y1="0%" x2="100%" y2="100%">
       <Stop offset="0%" stopColor="#0A110C"/>
       <Stop offset="45%" stopColor="#0C100D"/>
       <Stop offset="100%" stopColor="#151A14"/>
     </LinearGradient></Defs>
     {!photoMode?<Rect width="390" height="844" fill="url(#ambient)"/>:null}
     {shapes}
   </Svg>
 </View>;
}
export default memo(ElectricBackground);
