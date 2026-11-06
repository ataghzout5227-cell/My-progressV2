import React,{useEffect,useMemo,useState} from 'react';
import {View,Text,TouchableOpacity,ScrollView,Alert,StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {analytics,calculateXP,levelInfo,availableThemes} from './progression';
import {KEYS} from './dataSafety';
import {requestWidgetUpdate} from 'react-native-android-widget';
import {AscendProgressWidget} from './AscendProgressWidget';

const DARK='#172019',SOFT='#A6B4A6',WHITE='#F2F8F0';
const pad=n=>String(n).padStart(2,'0');
const formatTime=ms=>pad(Math.floor(ms/60000))+':'+pad(Math.floor(ms/1000)%60);
const today=()=>{let d=new Date();return [d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-')};
const presets={
 aurora:{style:'storm',lightningColor:'#00E5FF',intensity:85},
 royal:{style:'plasma',lightningColor:'#A855F7',intensity:85},
 legend:{style:'strike',lightningColor:'#FFD447',intensity:100}
};
export default function FeatureHub({section,data,achievementCount=0,appearance,onAppearanceChange,onClose}){
 const accent=appearance.lightningColor||'#A3FF29';
 const [focusSessions,setFocusSessions]=useState([]);
 const [active,setActive]=useState(null);
 const [now,setNow]=useState(Date.now());
 const [duration,setDuration]=useState(25);
 const [ready,setReady]=useState(false);
 useEffect(()=>{let alive=true;Promise.all([AsyncStorage.getItem(KEYS.focus),AsyncStorage.getItem('ascend-2.8-active-focus')]).then(([sessions,running])=>{
   if(!alive)return;
   try{if(sessions)setFocusSessions(JSON.parse(sessions))}catch(e){}
   try{if(running)setActive(JSON.parse(running))}catch(e){}
   setReady(true);
 }).catch(()=>setReady(true));return()=>{alive=false}},[]);
 useEffect(()=>{if(!active?.startedAt||active.paused)return;const timer=setInterval(()=>setNow(Date.now()),500);return()=>clearInterval(timer)},[active]);
 const xp=calculateXP(data,focusSessions,achievementCount);
 const level=levelInfo(xp),series=analytics(data,focusSessions),maxKm=Math.max(1,...series.map(s=>s.km));
 const elapsed=active?(active.elapsedMs||0)+(active.startedAt&&!active.paused?Math.max(0,now-active.startedAt):0):0;
 const goalMs=(active?.minutes||duration)*60000;
 const sessionDone=elapsed>=goalMs;
 const setAndStore=next=>{setActive(next);AsyncStorage.setItem('ascend-2.8-active-focus',JSON.stringify(next)).catch(()=>Alert.alert('Save error','Focus timer status could not be saved.'))};
 const start=()=>{if(active)return;setNow(Date.now());setAndStore({id:'focus-'+Date.now(),minutes:duration,startedAt:Date.now(),elapsedMs:0,paused:false})};
 const pause=()=>{if(!active||active.paused)return;setAndStore({...active,elapsedMs:elapsed,startedAt:null,paused:true})};
 const resume=()=>{if(!active||!active.paused)return;setNow(Date.now());setAndStore({...active,startedAt:Date.now(),paused:false})};
 const reset=()=>Alert.alert('Discard focus session?','This unfinished session will not earn XP.',[
  {text:'Cancel',style:'cancel'},{text:'Discard',style:'destructive',onPress:()=>setAndStore(null)}]);
 const complete=async()=>{
   if(!active||!sessionDone)return;
   if(focusSessions.some(s=>s.id===active.id))return setAndStore(null);
   const next=[...focusSessions,{id:active.id,date:today(),durationMinutes:active.minutes,completed:true,createdAt:new Date().toISOString()}];
   try{await AsyncStorage.setItem(KEYS.focus,JSON.stringify(next));setFocusSessions(next);setAndStore(null);
     const updatedLevel=levelInfo(calculateXP(data,next,achievementCount));
     requestWidgetUpdate({widgetName:'AscendProgress',renderWidget:()=> <AscendProgressWidget level={updatedLevel.level} xp={updatedLevel.totalXP} goal={Object.values(data.goalChecks||{}).filter(Boolean).length} color={accent}/>}).catch(()=>{});
     Alert.alert('Focus completed','Session saved. You earned 25 XP!')}
   catch(e){Alert.alert('Unable to save','Please retry. Your timer has not been discarded.')}
 };
 const item=(title,value)=> <View style={styles.stat}><Text style={{color:accent,fontSize:25,fontWeight:'900'}}>{value}</Text><Text style={styles.caption}>{title}</Text></View>;
 return <View style={styles.root}>
   <View style={styles.head}><View style={{flex:1}}><Text style={[styles.title,{color:accent}]}>{section==='Analytics'?'Analytics':section==='Focus'?'Focus Mode':section==='Themes'?'Unlockable Themes':'XP & Levels'}</Text><Text style={styles.muted}>Ascend 2.8 · Your personal progress</Text></View>
     <TouchableOpacity accessibilityLabel="Close" onPress={onClose} style={styles.close}><Text style={styles.white}>✕</Text></TouchableOpacity></View>
   {section==='Levels'?<>
     <View style={styles.card}><Text style={styles.muted}>YOUR LEVEL</Text><Text style={[styles.title,{fontSize:34,color:accent}]}>Level {level.level} · {level.name}</Text>
     <Text style={styles.white}>{level.totalXP} total XP</Text>
     <View style={styles.track}><View style={{height:11,width:Math.min(100,level.progress*100)+'%',borderRadius:9,backgroundColor:accent}}/></View>
     <Text style={styles.muted}>{level.current} / {level.next} XP to next level</Text></View>
     <View style={styles.card}><Text style={styles.heading}>How you earn XP</Text>
       {['Planned run +100','Logged run +70','Workout day +60','30-day check-in +40','Completed focus +25','Achievement +150'].map(x=><Text key={x} style={styles.white}>• {x}</Text>)}
       <Text style={styles.muted}>XP comes from unique saved activities. Edits and repeated visits do not duplicate rewards.</Text>
     </View>
   </>:null}
   {section==='Analytics'?<>
     <View style={styles.stats}>{item('RUNS',series.reduce((x,y)=>x+y.runs,0))}{item('WORKOUTS',series.reduce((x,y)=>x+y.workouts,0))}{item('GOAL DAYS',series.reduce((x,y)=>x+y.goals,0))}</View>
     <View style={styles.card}><Text style={styles.heading}>Distance · Last 7 days</Text><View style={styles.bars}>
     {series.map(d=><View key={d.date} style={styles.barItem}><Text style={styles.small}>{d.km?d.km.toFixed(1):''}</Text>
       <View style={[styles.bar,{height:Math.max(4,Math.round(115*d.km/maxKm)),backgroundColor:accent}]}/><Text style={styles.small}>{d.label}</Text></View>)}</View></View>
     <View style={styles.card}><Text style={styles.heading}>Activity summary</Text>
       <Text style={styles.white}>Distance logged: {series.reduce((x,y)=>x+y.km,0).toFixed(2)} km</Text>
       <Text style={styles.white}>Focus: {series.reduce((x,y)=>x+y.focusMinutes,0)} minutes</Text>
       <Text style={styles.muted}>Chart uses dated manual runs. Completed plan runs remain included in your existing running totals.</Text>
     </View>
   </>:null}
   {section==='Focus'?<>
     <View style={styles.card}><Text style={styles.muted}>DISTRACTION-FREE TIMER</Text><Text style={[styles.clock,{color:accent}]}>{formatTime(Math.max(0,goalMs-elapsed))}</Text>
       <Text style={styles.muted}>{active?(sessionDone?'Session complete — save your progress':active.paused?'Paused':'Stay focused'):'Choose your session length'}</Text>
       {!active?<View style={styles.row}>{[15,25,45,60].map(x=><TouchableOpacity key={x} onPress={()=>setDuration(x)} style={[styles.pill,duration===x&&{borderColor:accent}]}><Text style={styles.white}>{x}m</Text></TouchableOpacity>)}</View>:null}
       {!active?<TouchableOpacity onPress={start} style={[styles.primary,{backgroundColor:accent}]}><Text style={styles.primaryText}>Start focus session</Text></TouchableOpacity>:<>
         {sessionDone?<TouchableOpacity onPress={complete} style={[styles.primary,{backgroundColor:accent}]}><Text style={styles.primaryText}>Save completed session · +25 XP</Text></TouchableOpacity>:<TouchableOpacity onPress={active.paused?resume:pause} style={[styles.primary,{backgroundColor:accent}]}><Text style={styles.primaryText}>{active.paused?'Resume':'Pause'}</Text></TouchableOpacity>}
         <TouchableOpacity onPress={reset} style={styles.secondary}><Text style={styles.white}>Discard session</Text></TouchableOpacity>
       </>}
     </View>
     <View style={styles.card}><Text style={styles.heading}>Recent sessions</Text>
       {focusSessions.length===0?<Text style={styles.muted}>No completed focus sessions yet.</Text>:[...focusSessions].reverse().slice(0,8).map(s=><Text style={styles.white} key={s.id}>{s.date} · {s.durationMinutes} minutes · +25 XP</Text>)}
     </View>
   </>:null}
   {section==='Themes'?<>
     <Text style={styles.muted}>Your current appearance is preserved unless you explicitly select an unlocked preset. Every existing color and lightning style remains free.</Text>
     {availableThemes(level.level,achievementCount).filter(t=>t.id!=='standard').map(t=><View key={t.id} style={styles.card}>
       <Text style={[styles.heading,{color:t.unlocked?accent:WHITE}]}>{t.label} {t.unlocked?'✓':'🔒'}</Text>
       <Text style={styles.muted}>{t.unlocked?'Available now':'Unlock at level '+t.level}</Text>
       <TouchableOpacity disabled={!t.unlocked} onPress={()=>{onAppearanceChange({...appearance,...presets[t.id]});Alert.alert('Theme applied',t.label+' is now your active appearance.')}}
         style={[styles.primary,{backgroundColor:t.unlocked?accent:'#4B534A'}]}>
         <Text style={styles.primaryText}>{t.unlocked?'Apply theme':'Locked'}</Text></TouchableOpacity>
     </View>)}
   </>:null}
 </View>;
}
const styles=StyleSheet.create({
 root:{gap:15,paddingBottom:12},head:{flexDirection:'row',alignItems:'center',gap:10},
 title:{fontSize:25,fontWeight:'900'},heading:{color:WHITE,fontSize:18,fontWeight:'800'},
 muted:{color:SOFT,fontSize:12,lineHeight:19},white:{color:WHITE,fontSize:14},
 small:{color:SOFT,fontSize:10},caption:{color:SOFT,fontSize:10},
 close:{backgroundColor:'#314031',padding:11,borderRadius:12},
 card:{backgroundColor:DARK,borderWidth:1,borderColor:'#374637',borderRadius:18,padding:17,gap:12},
 stats:{flexDirection:'row',gap:9},stat:{flex:1,alignItems:'center',backgroundColor:DARK,borderRadius:13,padding:10,gap:5},
 track:{height:11,backgroundColor:'#354034',borderRadius:9,overflow:'hidden'},
 bars:{height:160,flexDirection:'row',alignItems:'flex-end',gap:9},
 barItem:{flex:1,alignItems:'center',justifyContent:'flex-end',gap:7},
 bar:{width:'65%',minHeight:4,borderTopLeftRadius:6,borderTopRightRadius:6},
 clock:{fontSize:57,fontWeight:'900',textAlign:'center',letterSpacing:2},
 row:{flexDirection:'row',gap:8,justifyContent:'space-between'},
 pill:{borderRadius:12,borderWidth:1,borderColor:'#445343',padding:11,minWidth:59,alignItems:'center'},
 primary:{borderRadius:13,padding:13,alignItems:'center'},primaryText:{color:'#101910',fontWeight:'900'},
 secondary:{borderRadius:13,padding:13,borderColor:'#445343',borderWidth:1,alignItems:'center'}
});
