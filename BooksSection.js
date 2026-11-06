import React,{useEffect,useMemo,useRef,useState} from 'react';
import {View,Text,TextInput,TouchableOpacity,Image,Alert,StyleSheet,ActivityIndicator} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {BookOpen,Plus,Minus,Camera,Trash2,CheckCircle,Edit3,ChevronLeft} from 'lucide-react-native';

// Books are stored separately, so no migration touches running, workouts, or private journal.
const STORAGE_KEY='ascend-books-v1';
const states=['Want to read','Reading','Finished'];
const today=()=>{
 const d=new Date();
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
};
const cleanCount=v=>{const n=Number(String(v).trim());return Number.isInteger(n)&&n>0&&n<=100000?n:null};
const cleanPage=(v,max)=>{const n=Number(String(v).trim());return Number.isInteger(n)&&n>=0&&n<=max?n:null};
const countPercent=book=>Math.round((book.page/book.pages)*100);
const inputProps={placeholderTextColor:'#A0AC9D',autoCorrect:false};
const getStyles=C=>StyleSheet.create({
 head:{flexDirection:'row',alignItems:'center',gap:10},
 title:{fontSize:30,color:C.text,fontWeight:'900'},
 sub:{color:C.muted,fontSize:13,lineHeight:19},
 card:{padding:16,borderRadius:18,backgroundColor:'rgba(26,36,27,0.95)',borderWidth:1,borderColor:C.teal+'55',gap:12},
 cardTitle:{fontSize:18,fontWeight:'900',color:C.text,flexShrink:1},
 tiny:{fontSize:11,color:C.muted},body:{fontSize:14,color:C.text},
 control:{borderWidth:1,borderColor:C.teal+'66',backgroundColor:C.teal+'13',borderRadius:12,padding:12,minWidth:48,alignItems:'center',justifyContent:'center'},
 button:{borderRadius:12,paddingVertical:13,paddingHorizontal:16,backgroundColor:C.teal,alignItems:'center',justifyContent:'center'},
 buttonText:{fontSize:14,fontWeight:'900',color:'#101911'},
 input:{color:C.text,borderRadius:12,backgroundColor:'#1B241C',borderWidth:1,borderColor:C.teal+'55',padding:13,fontSize:15},
 cover:{height:155,width:105,borderRadius:10,backgroundColor:'#243126'},
 coverEmpty:{height:155,width:105,borderRadius:10,backgroundColor:'#243126',alignItems:'center',justifyContent:'center',gap:8,padding:8},
 tabs:{flexDirection:'row',gap:6,flexWrap:'wrap'},
 chip:{paddingHorizontal:12,paddingVertical:10,backgroundColor:'#273026',borderRadius:11,borderWidth:1,borderColor:C.teal+'33'},
 track:{height:9,backgroundColor:C.teal+'24',borderRadius:99,overflow:'hidden'},
 bar:{height:'100%',backgroundColor:C.teal,borderRadius:99},
 row:{flexDirection:'row',alignItems:'center',gap:10},
 mutedBtn:{borderWidth:1,borderColor:C.teal+'66',borderRadius:12,padding:12,alignItems:'center',justifyContent:'center'},
});
export default function BooksSection({accent='#A3FF29',onBack}){
 const C=useMemo(()=>({teal:accent,text:'#F6F8F4',muted:'#AAB9AA'}),[accent]);
 const s=useMemo(()=>getStyles(C),[C]);
 const [books,setBooks]=useState([]);
 const [loaded,setLoaded]=useState(false);
 const [saving,setSaving]=useState(false);
 const [form,setForm]=useState(false);
 const [editId,setEditId]=useState(null);
 const [title,setTitle]=useState('');
 const [author,setAuthor]=useState('');
 const [pages,setPages]=useState('');
 const [page,setPage]=useState('0');
 const [status,setStatus]=useState('Want to read');
 const [cover,setCover]=useState(null);
 const [filter,setFilter]=useState('All');
 const [pageInputs,setPageInputs]=useState({});
 const queue=useRef(Promise.resolve());
 useEffect(()=>{let live=true;AsyncStorage.getItem(STORAGE_KEY).then(raw=>{
   if(!live)return;
   if(raw){const list=JSON.parse(raw);if(!Array.isArray(list))throw Error('Invalid saved books');setBooks(list)}
 }).catch(()=>Alert.alert('Books','Could not load saved books. Your existing data has not been changed.')).finally(()=>{if(live)setLoaded(true)});
 return()=>{live=false};},[]);
 const persist=list=>{
   setBooks(list);
   queue.current=queue.current.catch(()=>{}).then(()=>AsyncStorage.setItem(STORAGE_KEY,JSON.stringify(list))).catch(()=>{
     Alert.alert('Books save error','Your book update could not be stored. Please try again.');
   });
 };
 const reset=()=>{setForm(false);setEditId(null);setTitle('');setAuthor('');setPages('');setPage('0');setCover(null);setStatus('Want to read')};
 const create=()=>{reset();setForm(true)};
 const edit=book=>{setEditId(book.id);setTitle(book.title);setAuthor(book.author||'');setPages(String(book.pages));setPage(String(book.page));setCover(book.coverUri||null);setStatus(book.status);setForm(true)};
 const chooseCover=async()=>{
   setSaving(true);
   try{
     const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[2,3],quality:0.72});
     if(result.canceled||!result.assets?.[0]?.uri)return;
     if(!FileSystem.documentDirectory)throw Error('Private image storage unavailable.');
     const source=result.assets[0].uri;
     const dest=FileSystem.documentDirectory+'ascend-book-cover-'+Date.now()+'-'+Math.floor(Math.random()*100000)+'.jpg';
     await FileSystem.copyAsync({from:source,to:dest});
     const info=await FileSystem.getInfoAsync(dest);
     if(!info.exists||!info.size||info.size>10000000){
       await FileSystem.deleteAsync(dest,{idempotent:true});throw Error('Photo could not be saved. Choose an image under 10 MB.');
     }
     setCover(dest);
   }catch(e){Alert.alert('Book cover',e.message||'Could not select this image.')}
   finally{setSaving(false)}
 };
 const saveBook=()=>{
   const total=cleanCount(pages);
   if(!title.trim())return Alert.alert('Book title','Please enter a book title.');
   if(total===null)return Alert.alert('Total pages','Enter the total number of pages as a positive whole number.');
   const current=cleanPage(page,total);
   if(current===null)return Alert.alert('Current page','Enter a page number from 0 to '+total+'.');
   const old=books.find(b=>b.id===editId);
   const state=current===total?'Finished':status==='Finished'?'Reading':status;
   const record={
     id:editId||('book-'+Date.now()+'-'+Math.floor(Math.random()*100000)),
     title:title.trim(),author:author.trim(),pages:total,page:current,coverUri:cover,
     status:state,addedAt:old?.addedAt||today(),
     finishedAt:state==='Finished'?(old?.finishedAt||today()):null,
     history:old?.history||[]
   };
   if(old&&old.page!==current)record.history=[...record.history,{date:today(),page:current,from:old.page}].slice(-500);
   const next=old?books.map(b=>b.id===old.id?record:b):[record,...books];
   persist(next);reset();
 };
 const updatePage=(book,n)=>{
   const current=Number.isInteger(n)?Math.min(book.pages,Math.max(0,n)):book.page;
   if(current===book.page)return;
   const completed=current===book.pages;
   const next=books.map(b=>b.id===book.id?{...b,page:current,
      status:completed?'Finished':b.status==='Finished'?'Reading':b.status==='Want to read'?'Reading':b.status,
      finishedAt:completed?(b.finishedAt||today()):null,
      history:[...(b.history||[]),{date:today(),page:current,from:b.page}].slice(-500)
    }:b);
   persist(next);setPageInputs(v=>({...v,[book.id]:String(current)}));
 };
 const exact=book=>{
   const str=pageInputs[book.id]??String(book.page);
   const parsed=cleanPage(str,book.pages);
   if(parsed===null)return Alert.alert('Invalid page','Enter a whole number from 0 to '+book.pages);
   updatePage(book,parsed);
 };
 const markFinished=book=>{
   Alert.alert('Finish this book?','Record '+book.title+' as finished today?',[
     {text:'Cancel',style:'cancel'},
     {text:'Mark finished',onPress:()=>updatePage(book,book.pages)}
   ]);
 };
 const removeBook=book=>Alert.alert('Delete book?','Remove '+book.title+' and its reading history? This cannot be undone.',[
   {text:'Cancel',style:'cancel'},
   {text:'Delete',style:'destructive',onPress:()=>persist(books.filter(b=>b.id!==book.id))}
 ]);
 const visible=books.filter(b=>filter==='All'||b.status===filter);
 if(!loaded)return <View style={{padding:24}}><ActivityIndicator color={accent}/><Text style={s.sub}>Loading your books…</Text></View>;
 return <View style={{gap:17}}>
   <View style={s.head}>
     <TouchableOpacity accessibilityLabel="Back to Home" onPress={onBack} style={s.mutedBtn}><ChevronLeft size={21} color={accent}/></TouchableOpacity>
     <View style={{flex:1}}><Text style={s.title}>Books</Text><Text style={s.sub}>A record of the pages you've actually read.</Text></View>
   </View>
   <View style={s.row}>
     <View style={[s.card,{flex:1,padding:12}]}><Text style={{color:accent,fontSize:25,fontWeight:'900'}}>{books.filter(b=>b.status==='Reading').length}</Text><Text style={s.tiny}>READING</Text></View>
     <View style={[s.card,{flex:1,padding:12}]}><Text style={{color:accent,fontSize:25,fontWeight:'900'}}>{books.filter(b=>b.status==='Finished').length}</Text><Text style={s.tiny}>FINISHED</Text></View>
     <View style={[s.card,{flex:1,padding:12}]}><Text style={{color:accent,fontSize:25,fontWeight:'900'}}>{books.length}</Text><Text style={s.tiny}>TOTAL</Text></View>
   </View>
   {!form?<TouchableOpacity onPress={create} style={s.button}><View style={s.row}><Plus color="#101911" size={19}/><Text style={s.buttonText}>Add a book</Text></View></TouchableOpacity>:null}
   {form?<View style={s.card}>
     <Text style={s.cardTitle}>{editId?'Edit book':'Add a book'}</Text>
     <View style={s.row}>
       <TouchableOpacity onPress={chooseCover} disabled={saving} accessibilityLabel="Choose book cover photo from gallery">
         {cover?<Image source={{uri:cover}} style={s.cover} resizeMode="cover"/>:
           <View style={s.coverEmpty}><Camera color={accent} size={25}/><Text style={[s.tiny,{textAlign:'center'}]}>Choose cover</Text></View>}
       </TouchableOpacity>
       <View style={{flex:1,gap:10}}>
         <TextInput {...inputProps} value={title} onChangeText={setTitle} style={s.input} placeholder="Book title"/>
         <TextInput {...inputProps} value={author} onChangeText={setAuthor} style={s.input} placeholder="Author (optional)"/>
       </View>
     </View>
     <Text style={s.sub}>Enter the page count printed in your edition.</Text>
     <TextInput {...inputProps} value={pages} onChangeText={setPages} style={s.input} keyboardType="number-pad" placeholder="Total pages (e.g. 320)"/>
     <TextInput {...inputProps} value={page} onChangeText={setPage} style={s.input} keyboardType="number-pad" placeholder="Current page (0 if not started)"/>
     <View style={s.tabs}>{states.filter(x=>x!=='Finished').map(x=><TouchableOpacity key={x} onPress={()=>setStatus(x)} style={[s.chip,status===x&&{borderColor:accent,backgroundColor:accent+'25'}]}><Text style={{color:status===x?accent:C.text,fontWeight:'700'}}>{x}</Text></TouchableOpacity>)}</View>
     <TouchableOpacity disabled={saving} onPress={saveBook} style={s.button}><Text style={s.buttonText}>{editId?'Save book changes':'Save book'}</Text></TouchableOpacity>
     <TouchableOpacity onPress={reset} style={s.mutedBtn}><Text style={s.sub}>Cancel</Text></TouchableOpacity>
   </View>:null}
   <View style={s.tabs}>{['All',...states].map(x=><TouchableOpacity key={x} onPress={()=>setFilter(x)}
     style={[s.chip,filter===x&&{borderColor:accent,backgroundColor:accent+'24'}]}>
     <Text style={{color:filter===x?accent:C.text,fontSize:12,fontWeight:'800'}}>{x}</Text></TouchableOpacity>)}</View>
   {visible.length===0?<View style={s.card}><Text style={s.sub}>No books here yet. Add one when you're ready to read.</Text></View>:null}
   {visible.map(book=><View key={book.id} style={s.card}>
     <View style={s.row}>
       {book.coverUri?<Image source={{uri:book.coverUri}} style={s.cover} resizeMode="cover"/>:
         <View style={s.coverEmpty}><BookOpen color={accent} size={30}/></View>}
       <View style={{flex:1,gap:7}}>
         <Text style={s.cardTitle}>{book.title}</Text>
         {book.author?<Text style={s.sub}>{book.author}</Text>:null}
         <Text style={{color:accent,fontWeight:'800',fontSize:12}}>{book.status}</Text>
         <Text style={[s.body,{fontWeight:'900',fontSize:25,color:accent}]}>{countPercent(book)}%</Text>
         <View style={s.track}><View style={[s.bar,{width:countPercent(book)+'%'}]}/></View>
         <Text style={s.sub}>Page {book.page} of {book.pages}</Text>
       </View>
     </View>
     {book.status==='Finished'?<Text style={s.sub}>Completed {book.finishedAt||'previously'} · You can still adjust your pages.</Text>:null}
     <View style={[s.row,{justifyContent:'space-between'}]}>
       {[1,5,10].map(n=><TouchableOpacity key={'minus'+n} accessibilityLabel={'Subtract '+n+' pages'} style={[s.control,{flex:1,padding:10}]} onPress={()=>updatePage(book,book.page-n)}>
         <Text style={{color:C.text,fontWeight:'800'}}>−{n}</Text></TouchableOpacity>)}
       {[1,5,10].map(n=><TouchableOpacity key={'plus'+n} accessibilityLabel={'Add '+n+' pages'} style={[s.control,{flex:1,padding:10}]} onPress={()=>updatePage(book,book.page+n)}>
         <Text style={{color:accent,fontWeight:'800'}}>+{n}</Text></TouchableOpacity>)}
     </View>
     <View style={s.row}>
       <TextInput {...inputProps} style={[s.input,{flex:1}]} keyboardType="number-pad" value={pageInputs[book.id]??String(book.page)}
          onChangeText={v=>setPageInputs(o=>({...o,[book.id]:v}))} placeholder="Exact page"/>
       <TouchableOpacity onPress={()=>exact(book)} style={[s.button,{minWidth:80}]}><Text style={s.buttonText}>Set page</Text></TouchableOpacity>
     </View>
     <View style={s.row}>
       {book.status!=='Finished'?<TouchableOpacity onPress={()=>markFinished(book)} style={[s.mutedBtn,{flex:1}]}><View style={s.row}><CheckCircle size={16} color={accent}/><Text style={s.sub}>Finished</Text></View></TouchableOpacity>:null}
       <TouchableOpacity onPress={()=>edit(book)} style={[s.mutedBtn,{flex:1}]}><View style={s.row}><Edit3 size={16} color={accent}/><Text style={s.sub}>Edit</Text></View></TouchableOpacity>
       <TouchableOpacity onPress={()=>removeBook(book)} accessibilityLabel={'Delete '+book.title} style={s.mutedBtn}><Trash2 size={18} color="#FF8E91"/></TouchableOpacity>
     </View>
     {book.history?.length?<Text style={s.tiny}>Last update: {book.history[book.history.length-1].date} · Page {book.history[book.history.length-1].page}</Text>:null}
   </View>)}
   <Text style={s.sub}>Books and cover photos are saved locally on your device. No AI, subscription, or internet needed.</Text>
 </View>;
}
