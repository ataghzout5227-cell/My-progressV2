// Pure, deterministic scoring. XP is recomputed from unique saved activities,
// so edits, restoring backups or reopening screens cannot award duplicate XP.
export const XP={plannedRun:100,manualRun:70,workout:60,goal:40,focus:25,achievement:150};
const rankNames=['Rookie','Starter','Striver','Climber','Achiever','Warrior','Elite','Legend'];
const numeric=v=>Number.isFinite(Number(v))?Number(v):0;
export function calculateXP(data={},focusSessions=[],unlockedAchievements=0){
  const checked=Object.values(data.runChecks||{}).filter(Boolean).length;
  const manualIds=new Set((data.runs||[]).map((r,i)=>r.id||'run:'+r.date+':'+i));
  const workouts=Object.values(data.workouts||{}).filter(w=>w&&(
    w.completed||numeric(w.pushups)>0||numeric(w.plankMinutes)>0||numeric(w.plankSeconds)>0
  )).length;
  const checkedGoals=Object.values(data.goalChecks||{}).filter(Boolean).length;
  const archived=(data.cycles||[]).reduce((n,c)=>n+Math.max(0,numeric(c.completed)),0);
  const uniqueFocus=new Set(focusSessions.filter(x=>x&&x.completed===true&&numeric(x.durationMinutes)>=5).map((x,i)=>x.id||'focus:'+i));
  return checked*XP.plannedRun+manualIds.size*XP.manualRun+workouts*XP.workout+
    (checkedGoals+archived)*XP.goal+uniqueFocus.size*XP.focus+
    Math.max(0,unlockedAchievements)*XP.achievement;
}
// Each level needs a little more than the last. Balanced pace, no punishment.
export function levelInfo(totalXP){
  const xp=Math.max(0,Math.floor(totalXP||0));
  let level=1,start=0,cost=300;
  while(xp>=start+cost&&level<500){
    start+=cost;level++;cost=300+100*(level-1);
  }
  return {level,name:rankNames[Math.min(rankNames.length-1,Math.floor((level-1)/5))],
    totalXP:xp,current:xp-start,next:cost,progress:(xp-start)/cost};
}
export function availableThemes(level,achievementCount){
  const list=[{id:'standard',label:'Custom Lightning',level:1},
    {id:'aurora',label:'Aurora Storm',level:4},
    {id:'royal',label:'Royal Plasma',level:8},
    {id:'legend',label:'Legend Strike',level:15}];
  return list.map(t=>({...t,unlocked:level>=t.level||(t.id==='royal'&&achievementCount>=6)}));
}
export function analytics(data={},focusSessions=[]){
  const dayList=[];
  const now=new Date();now.setHours(12,0,0,0);
  for(let i=6;i>=0;i--){
    const d=new Date(now);d.setDate(now.getDate()-i);
    const date=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
    const runs=(data.runs||[]).filter(r=>r.date===date);
    const workout=data.workouts?.[date];
    const focus=focusSessions.filter(s=>s.completed&&s.date===date);
    dayList.push({date,label:d.toLocaleDateString(undefined,{weekday:'short'}),km:runs.reduce((sum,r)=>sum+numeric(r.km),0),
      runs:runs.length,workouts:workout&&(workout.completed||numeric(workout.pushups)>0)?1:0,
      goals:data.goalChecks?.[date]?1:0,
      focusMinutes:focus.reduce((sum,s)=>sum+numeric(s.durationMinutes),0)});
  }
  return dayList;
}
