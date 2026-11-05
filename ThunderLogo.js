import React from 'react';
import {View} from 'react-native';
import Svg, {Defs, Path, LinearGradient, Stop} from 'react-native-svg';

// Thunder A is the single selectable brand mark; its color is user-controlled.
export default function ThunderLogo({color='#A3FF29',size=42}){
  return <View accessibilityLabel="Ascend Thunder A logo" style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Defs>
        <LinearGradient id="thunder" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.64}/>
          <Stop offset="42%" stopColor={color}/>
          <Stop offset="100%" stopColor={color}/>
        </LinearGradient>
      </Defs>
      <Path d="M55 5 L17 54 H42 L30 91 L83 38 H57 L70 5 Z" fill="url(#thunder)" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/>
      <Path d="M50 20 L32 49 H51" fill="none" stroke="#FFFFFF" strokeOpacity=".36" strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  </View>;
}
