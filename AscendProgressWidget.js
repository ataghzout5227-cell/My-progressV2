'use no memo';
import React from 'react';
import {FlexWidget,TextWidget} from 'react-native-android-widget';

export function AscendProgressWidget({level=1,xp=0,streak=0,goal=0,color='#A3FF29'}){
  return <FlexWidget accessibilityLabel="Ascend level, streak and goal progress"
    style={{height:'match_parent',width:'match_parent',backgroundColor:'#131D14',
      borderRadius:20,padding:16,flexDirection:'column',justifyContent:'space-around'}}>
    <TextWidget text="ASCEND" style={{fontSize:15,fontWeight:'bold',color:color}}/>
    <FlexWidget style={{flexDirection:'row',justifyContent:'space-between',width:'match_parent'}}>
      <TextWidget text={'LEVEL '+level} style={{fontSize:20,fontWeight:'bold',color:'#FFFFFF'}}/>
      <TextWidget text={xp+' XP'} style={{fontSize:14,color:color}}/>
    </FlexWidget>
    <TextWidget text={streak+' day streak  ·  '+goal+'/30 goal days'} style={{fontSize:13,color:'#CFDDC8'}}/>
  </FlexWidget>;
}
