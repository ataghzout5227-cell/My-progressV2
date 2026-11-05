import React, {useMemo} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Check, RotateCcw, Link2, Unlink2, Minus, Plus} from 'lucide-react-native';
import ThunderLogo from './ThunderLogo';

export const DEFAULT_APPEARANCE={
  style:'storm',lightningColor:'#A3FF29',intensity:70,logoMatch:true,logoColor:'#A3FF29'
};
export const COLOR_OPTIONS=[
  {label:'Lime',color:'#A3FF29'},{label:'Blue',color:'#299FFF'},
  {label:'Purple',color:'#A855F7'},{label:'Red',color:'#FF4545'},
  {label:'Gold',color:'#FFD447'},{label:'Cyan',color:'#00E5FF'},
  {label:'White',color:'#F3F8FF'}
];
export const LIGHTNING_STYLES=[
  {id:'storm',label:'Storm',description:'Branching, powerful bolts'},
  {id:'strike',label:'Strike',description:'Sharp dramatic bolts'},
  {id:'plasma',label:'Plasma',description:'Flowing electric currents'},
  {id:'minimal',label:'Minimal',description:'Fine understated streaks'}
];
export function normalizeAppearance(value){
  if(!value||typeof value!=='object')return {...DEFAULT_APPEARANCE};
  const styles=LIGHTNING_STYLES.map(item=>item.id);
  const colors=COLOR_OPTIONS.map(item=>item.color);
  return {
    style:styles.includes(value.style)?value.style:DEFAULT_APPEARANCE.style,
    lightningColor:colors.includes(value.lightningColor)?value.lightningColor:DEFAULT_APPEARANCE.lightningColor,
    intensity:Number.isFinite(value.intensity)?Math.max(0,Math.min(100,Math.round(value.intensity/5)*5)):70,
    logoMatch:value.logoMatch!==false,
    logoColor:colors.includes(value.logoColor)?value.logoColor:DEFAULT_APPEARANCE.logoColor
  };
}
function Palette({title,selected,onSelect}){
  return <View style={{gap:10}}>
    <Text style={[styles.label,{color:selected}]}>{title}</Text>
    <View style={styles.palette}>
      {COLOR_OPTIONS.map(item=><TouchableOpacity key={item.color} activeOpacity={.8}
        accessibilityRole="button" accessibilityLabel={item.label}
        accessibilityState={{selected:selected===item.color}}
        onPress={()=>onSelect(item.color)}
        style={[styles.swatchBorder,selected===item.color&&styles.selectedBorder]}>
        <View style={[styles.swatch,{backgroundColor:item.color}]}>
          {selected===item.color?<Check size={18} color="#101610" strokeWidth={3}/>:null}
        </View>
        <Text style={[styles.colorLabel,selected===item.color&&{color:'#EFFFE2'}]}>{item.label}</Text>
      </TouchableOpacity>)}
    </View>
  </View>;
}
export default function AppearanceSettings({appearance,onChange}){
  const selected=useMemo(()=>normalizeAppearance(appearance),[appearance]);
  const logoColor=selected.logoMatch?selected.lightningColor:selected.logoColor;
  const set=(patch)=>onChange(normalizeAppearance({...selected,...patch}));
  return <View style={[styles.panel,{borderColor:selected.lightningColor+'77'}]}>
    <View style={styles.top}>
      <View style={{flex:1}}>
        <Text style={styles.title}>Appearance</Text>
        <Text style={styles.sub}>Make Ascend yours. Changes apply instantly and save automatically.</Text>
      </View>
      <ThunderLogo color={logoColor} size={58}/>
    </View>
    <View style={styles.separator}/>
    <Text style={[styles.label,{color:selected.lightningColor}]}>LIGHTNING STYLE</Text>
    <View style={styles.stylesGrid}>{LIGHTNING_STYLES.map(item=><TouchableOpacity key={item.id} onPress={()=>set({style:item.id})}
      accessibilityRole="button" accessibilityState={{selected:selected.style===item.id}}
      style={[styles.styleChoice,selected.style===item.id&&{borderColor:selected.lightningColor,backgroundColor:'rgba(43,59,33,.95)'}]}>
      <View style={styles.styleTop}><Text style={styles.styleName}>{item.label}</Text>{selected.style===item.id?<Check size={16} color={selected.lightningColor}/>:null}</View>
      <Text style={styles.styleSub}>{item.description}</Text>
    </TouchableOpacity>)}</View>
    <Palette title="LIGHTNING COLOR" selected={selected.lightningColor} onSelect={color=>set({lightningColor:color})}/>
    <View style={styles.intensityHeader}><Text style={[styles.label,{color:selected.lightningColor}]}>LIGHTNING INTENSITY</Text><Text style={styles.number}>{selected.intensity}%</Text></View>
    <View style={styles.intensityRow}>
      <TouchableOpacity accessibilityLabel="Decrease lightning intensity" onPress={()=>set({intensity:selected.intensity-5})}
        style={styles.adjust}><Minus size={19} color="#DDF8C7"/></TouchableOpacity>
      <View style={styles.meterOuter}>
        <View style={[styles.meterInner,{width:selected.intensity+'%',backgroundColor:selected.lightningColor}]}/>
      </View>
      <TouchableOpacity accessibilityLabel="Increase lightning intensity" onPress={()=>set({intensity:selected.intensity+5})}
        style={styles.adjust}><Plus size={19} color="#DDF8C7"/></TouchableOpacity>
    </View>
    <View style={styles.separator}/>
    <Text style={[styles.label,{color:selected.lightningColor}]}>THUNDER A LOGO</Text>
    <View style={styles.logoPreview}><ThunderLogo color={logoColor} size={78}/>
      <View style={{flex:1,gap:5}}><Text style={styles.styleName}>Thunder A</Text>
      </View>
    </View>
    <TouchableOpacity style={styles.match} onPress={()=>set({logoMatch:!selected.logoMatch})} accessibilityRole="switch"
      accessibilityState={{checked:selected.logoMatch}}>
      {selected.logoMatch?<Link2 size={20} color={selected.lightningColor}/>:<Unlink2 size={20} color="#B1BEAB"/>}
      <View style={{flex:1}}><Text style={styles.styleName}>Match lightning color</Text><Text style={styles.styleSub}>{selected.logoMatch?'Logo follows your lightning color':'Choose a separate logo color below'}</Text></View>
      <View style={[styles.toggle,selected.logoMatch&&{backgroundColor:selected.lightningColor}]}>
        <View style={[styles.toggleKnob,selected.logoMatch&&{alignSelf:'flex-end'}]}/>
      </View>
    </TouchableOpacity>
    {!selected.logoMatch?<Palette title="LOGO COLOR" selected={selected.logoColor} onSelect={color=>set({logoColor:color})}/>:null}
    <TouchableOpacity onPress={()=>onChange({...DEFAULT_APPEARANCE})} style={styles.reset}>
      <RotateCcw size={17} color="#C4D4BA"/><Text style={styles.resetText}>Restore default appearance</Text>
    </TouchableOpacity>
    <Text style={styles.foot}>Preferences stay saved on this device when you close and reopen the app.</Text>
  </View>;
}
const styles=StyleSheet.create({
  panel:{backgroundColor:'rgba(22,30,21,.96)',borderColor:'#45683B',borderWidth:1,borderRadius:20,padding:17,gap:17},
  top:{flexDirection:'row',alignItems:'center',gap:12},title:{color:'#F5FFF0',fontSize:22,fontWeight:'900'},
  sub:{color:'#AEBDA6',fontSize:12,lineHeight:18,marginTop:4},
  separator:{height:1,backgroundColor:'#3A5034'},
  label:{fontSize:11,letterSpacing:1.6,fontWeight:'900',color:'#C6E9AF'},
  stylesGrid:{flexDirection:'row',flexWrap:'wrap',gap:9},
  styleChoice:{width:'48%',minHeight:78,borderRadius:13,borderWidth:1,borderColor:'#3E4B38',padding:11,backgroundColor:'#20291F',gap:6},
  styleTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  styleName:{fontSize:14,fontWeight:'800',color:'#F1F8ED'},
  styleSub:{fontSize:11,lineHeight:16,color:'#B5C2AF'},
  palette:{flexDirection:'row',flexWrap:'wrap',gap:6},
  swatchBorder:{minWidth:66,alignItems:'center',gap:6,padding:5,borderRadius:12,borderWidth:1,borderColor:'transparent'},
  selectedBorder:{borderColor:'#BFE4B2',backgroundColor:'#263621'},
  swatch:{width:34,height:34,borderRadius:17,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#FFFFFF22'},
  colorLabel:{fontSize:10,color:'#AAB8A3',fontWeight:'700'},
  intensityHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  number:{color:'#F1FFEA',fontSize:14,fontWeight:'900'},
  intensityRow:{flexDirection:'row',alignItems:'center',gap:10},
  adjust:{width:39,height:39,backgroundColor:'#273524',borderRadius:12,alignItems:'center',justifyContent:'center'},
  meterOuter:{height:10,flex:1,backgroundColor:'#3A4A34',borderRadius:20,overflow:'hidden'},
  meterInner:{height:10,borderRadius:20},
  logoPreview:{flexDirection:'row',alignItems:'center',gap:13,padding:11,borderRadius:15,backgroundColor:'#1B261B'},
  match:{flexDirection:'row',alignItems:'center',gap:9},
  toggle:{width:47,height:27,borderRadius:16,backgroundColor:'#485044',padding:3,justifyContent:'center'},
  toggleKnob:{width:21,height:21,borderRadius:11,backgroundColor:'#F7FFF2',alignSelf:'flex-start'},
  reset:{flexDirection:'row',gap:9,alignItems:'center',justifyContent:'center',paddingVertical:13,borderWidth:1,borderColor:'#4E6148',borderRadius:13},
  resetText:{color:'#CBDCC2',fontSize:13,fontWeight:'800'},
  foot:{color:'#9EAD9A',fontSize:11,lineHeight:16}
});
