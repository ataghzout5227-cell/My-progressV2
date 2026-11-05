import React, {memo} from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Defs, LinearGradient, Stop, Rect, Path} from 'react-native-svg';

// Continuous full-screen electric artwork, based on the approved Ascend Figma direction.
// All paths are generated deterministically once; no network calls or animated redraws.
let seed=310719;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const filaments=[];
function lightning(x,y,vx,vy,steps,width,depth){
  let a=x,b=y,points=['M'+x.toFixed(1)+' '+y.toFixed(1)];
  for(let i=0;i<steps;i++){
    a+=vx+(random()-.5)*17;b+=vy+(random()-.5)*14;
    points.push('L'+a.toFixed(1)+' '+b.toFixed(1));
    if(depth>0&&i>1&&random()<.21){
      const direction=random()<.5?-1:1;
      lightning(a,b,vx*.7+direction*(4+random()*9),vy*.7+(random()-.5)*8,
        Math.max(3,Math.floor(steps*.34)),width*.50,depth-1);
    }
  }
  filaments.push({d:points.join(' '),width});
}
lightning(-25,14,13,10,58,4.6,3);
lightning(415,-35,-13,11,60,4.3,3);
lightning(-32,365,12,8,44,3.5,3);
lightning(416,438,-14,7,45,3.7,3);
lightning(45,876,10,-10,34,3.6,2);
lightning(365,878,-10,-11,33,3.4,2);
for(let i=0;i<15;i++)
  lightning(random()*420-15,random()*815,(random()-.5)*10,5+random()*7,
    5+Math.floor(random()*11),.65,1);

const palette=[
  {color:'#51FF00',scale:16/4.4,opacity:.055},
  {color:'#70FF1E',scale:7/4.4,opacity:.14},
  {color:'#9BFF52',scale:2.8/4.4,opacity:.55},
  {color:'#E0FFC5',scale:.85/4.4,opacity:.86},
];
// Batch hundreds of filament segments into a few vector paths for smooth Android scrolling.
const buckets=new Map();
for(const item of filaments){
  const thickness=Math.max(.25,Math.round(item.width*2)/2);
  if(!buckets.has(thickness))buckets.set(thickness,[]);
  buckets.get(thickness).push(item.d);
}
const rendered=palette.flatMap((layer,i)=>
  Array.from(buckets.entries()).map(([thickness,paths],j)=>
    <Path key={i+'-'+j} d={paths.join(' ')} fill="none"
      stroke={layer.color} strokeWidth={Math.max(.12,thickness*layer.scale)}
      strokeLinecap="round" strokeLinejoin="round"
      opacity={layer.opacity*(thickness<1?.28:1)}/>
  )
);
function ElectricBackground({tab='Home',settings=false}){
  const opacity=settings?.42:
    tab==='Home'?.86:tab==='Achievements'?.79:
    tab==='Running'?.59:tab==='Workout'?.64:
    tab==='Journal'?.38:.52;
  return <View pointerEvents="none" style={[StyleSheet.absoluteFillObject,{opacity}]}>
    <Svg width="100%" height="100%" viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="ambient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#17260F"/>
          <Stop offset="45%" stopColor="#0C110A"/>
          <Stop offset="100%" stopColor="#111A0F"/>
        </LinearGradient>
      </Defs>
      <Rect width="390" height="844" fill="url(#ambient)"/>
      {rendered}
      <Rect width="390" height="844" fill="#090E08" opacity=".17"/>
    </Svg>
  </View>;
}
export default memo(ElectricBackground);
