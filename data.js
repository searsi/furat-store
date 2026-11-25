import {firebaseConfig} from './config.js';
export const demo={name:'متجر فرات الصياد',whatsapp:'',logo:'',categories:['العسل الطبيعي','منتجات الطيور'],products:[{id:'honey',name:'عسل طبيعي',category:'العسل الطبيعي',description:'منتج تجريبي',image:'',active:true,variants:[{name:'ربع كيلو',price:10000},{name:'نصف كيلو',price:18000},{name:'كيلو',price:35000}]},{id:'bird',name:'محفز إنتاج البيض',category:'منتجات الطيور',description:'منتج تجريبي',image:'',active:true,variants:[{name:'عبوة',price:15000}]}]};
export const configured=Boolean(firebaseConfig.apiKey&&firebaseConfig.projectId);let db,auth,fs,au;
if(configured){const app=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js');fs=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');au=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');const a=app.initializeApp(firebaseConfig);db=fs.getFirestore(a);auth=au.getAuth(a);}
export async function load({fresh=false}={}){if(!configured)return JSON.parse(localStorage.getItem('furat-demo')||JSON.stringify(demo));const [s,p]=await Promise.all([(fresh?fs.getDocFromServer:fs.getDoc)(fs.doc(db,'store','settings')),(fresh?fs.getDocsFromServer:fs.getDocs)(fs.collection(db,'products'))]);return {...demo,products:[],...(s.exists()?s.data():{}),products:p.docs.map(d=>({...d.data(),id:d.id}))};}
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
export async function save(s,old){if(!configured){localStorage.setItem('furat-demo',JSON.stringify(s));return;}if(!navigator.onLine)throw Error('لا يوجد اتصال بالإنترنت');if(auth.currentUser?.uid!=='6XWgBHSbD5VgsljI836gcxfX20S2')throw Error('الحساب غير مخول');const batch=fs.writeBatch(db);const {products,...settings}=s;const {products:previous,...oldSettings}=old;let count=0;const prior=new Map(previous.map(p=>[p.id,p]));const ids=new Set(products.map(p=>p.id));if(!equal(settings,oldSettings)){batch.set(fs.doc(db,'store','settings'),settings);count++;}for(const p of products){if(equal(p,prior.get(p.id)))continue;const {id,...rest}=p;batch.set(fs.doc(db,'products',id),rest);count++;}for(const p of previous)if(!ids.has(p.id)){batch.delete(fs.doc(db,'products',p.id));count++;}if(count>500)throw Error('التعديل يتجاوز 500 عملية؛ لم يتم الحفظ');if(count)await batch.commit();}
export const login=(email,password)=>au.signInWithEmailAndPassword(auth,email,password);export const logout=()=>au.signOut(auth);export const watch=cb=>configured?au.onAuthStateChanged(auth,cb):cb(null);
export const money=n=>Number(n).toLocaleString('en-US')+' د.ع';export const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e};
export function picture(src,emoji='🍯'){if(!/^data:image\/(jpeg|png|webp);base64,/.test(src||''))return el('div',emoji,'placeholder');const i=el('img');i.loading='lazy';i.decoding='async';i.src=src;i.alt='صورة المنتج';return i;}

// V7.5: one atomic increment per counted visit, Iraq UTC+3.
const iraqDay=(ms=Date.now())=>Math.floor((ms+10800000)/86400000);
export async function countVisit(){
 if(!configured||!navigator.onLine)return;
 const run=async()=>{
  const now=Date.now(),key='furat-last-visit-v75';
  let last=0;try{last=Number(localStorage.getItem(key))||0}catch{}
  if(now>=last&&now-last<1800000)return;
  const day=iraqDay(now);
  await fs.setDoc(fs.doc(db,'visitDays',String(day)),{day,count:fs.increment(1)},{merge:true});
  try{localStorage.setItem(key,String(now))}catch{}
 };
 if(navigator.locks)await navigator.locks.request('furat-visit-v75',run);else await run();
}
export async function visitStats(){
 if(!configured||auth.currentUser?.uid!=='6XWgBHSbD5VgsljI836gcxfX20S2')throw Error('الإحصائيات غير متاحة');
 const day=iraqDay(),d=new Date(Date.now()+10800000),start=Math.floor(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)/86400000),col=fs.collection(db,'visitDays');
 const sum=async q=>(await fs.getAggregateFromServer(q,{visits:fs.sum('count')})).data().visits||0;
 const [total,month,today]=await Promise.all([sum(col),sum(fs.query(col,fs.where('day','>=',start),fs.where('day','<=',day))),fs.getDocFromServer(fs.doc(db,'visitDays',String(day)))]);
 return {total,month,today:today.data()?.count||0};
}
