import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AscendProgressWidget} from './AscendProgressWidget';
import {calculateXP,levelInfo} from './progression';
import {KEYS} from './dataSafety';

export async function widgetTaskHandler(props){
  if(!['WIDGET_ADDED','WIDGET_UPDATE','WIDGET_RESIZED'].includes(props.widgetAction))return;
  if(props.widgetInfo?.widgetName!=='AscendProgress')return;
  try{
    const [progress,focus,look]=await Promise.all([
      AsyncStorage.getItem(KEYS.legacy),
      AsyncStorage.getItem(KEYS.focus),
      AsyncStorage.getItem(KEYS.appearance)
    ]);
    const data=progress?JSON.parse(progress):{};
    const sessions=focus?JSON.parse(focus):[];
    const appearance=look?JSON.parse(look):{};
    const level=levelInfo(calculateXP(data,sessions));
    const today=new Date().toISOString().slice(0,10);
    const days=new Set([
      ...(data.runs||[]).map(r=>r.date),
      ...Object.keys(data.workouts||{}),
      ...Object.entries(data.goalChecks||{}).filter(([,v])=>v).map(([k])=>k)
    ]);
    let cursor=new Date();cursor.setHours(12,0,0,0);
    if(!days.has([cursor.getFullYear(),String(cursor.getMonth()+1).padStart(2,'0'),String(cursor.getDate()).padStart(2,'0')])){
      cursor.setDate(cursor.getDate()-1);
    }
    let streak=0;for(let i=0;i<365;i++){
      const day=[cursor.getFullYear(),String(cursor.getMonth()+1).padStart(2,'0'),String(cursor.getDate()).padStart(2,'0')].join('-');
      if(!days.has(day))break;streak++;cursor.setDate(cursor.getDate()-1);
    }
    props.renderWidget(<AscendProgressWidget level={level.level} xp={level.totalXP} streak={streak}
      goal={Object.values(data.goalChecks||{}).filter(Boolean).length} color={appearance.lightningColor||'#A3FF29'}/>);
  }catch(e){props.renderWidget(<AscendProgressWidget/>);}
}
