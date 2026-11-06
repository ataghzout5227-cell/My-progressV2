import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateXP,levelInfo,availableThemes,analytics} from '../progression.js';

test('balanced XP is deterministic and independent of repeated renders',()=>{
 const state={runChecks:{a:true,b:false},runs:[{id:'run1',date:'2026-11-01',km:4}],workouts:{'2026-11-01':{completed:true}},goalChecks:{'2026-11-01':true}};
 const sessions=[{id:'focus1',date:'2026-11-01',completed:true,durationMinutes:25},{id:'focus1',date:'2026-11-01',completed:true,durationMinutes:25}];
 assert.equal(calculateXP(state,sessions,1),100+70+60+40+25+150);
 assert.equal(calculateXP(state,sessions,1),calculateXP(JSON.parse(JSON.stringify(state)),sessions,1));
});
test('focus sessions must be completed for XP',()=>{
 assert.equal(calculateXP({},[{id:'x',completed:false,durationMinutes:25}]),0);
 assert.equal(calculateXP({},[{id:'x',completed:true,durationMinutes:2}]),0);
});
test('levels are monotonic with increasing cost',()=>{
 assert.equal(levelInfo(0).level,1);
 assert.equal(levelInfo(299).level,1);
 assert.equal(levelInfo(300).level,2);
 assert.equal(levelInfo(700).level,3);
 assert.ok(levelInfo(3000).level>levelInfo(700).level);
});
test('unlocked themes preserve all existing free presets',()=>{
 assert.equal(availableThemes(1,0).filter(x=>x.unlocked).length,1);
 assert.ok(availableThemes(15,0).every(x=>x.unlocked));
});
test('analytics produces a seven day timeline without journal data',()=>{
 const day=analytics({runs:[],journal:[{body:'secret'}]},[]);
 assert.equal(day.length,7);
 assert.equal(day.reduce((sum,d)=>sum+d.km,0),0);
 assert.ok(!JSON.stringify(day).includes('secret'));
});
