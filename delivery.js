export const provinces=['بغداد','البصرة','نينوى','أربيل','دهوك','السليمانية','حلبجة','كركوك','صلاح الدين','ديالى','الأنبار','بابل','كربلاء','النجف','واسط','القادسية','ذي قار','ميسان','المثنى'];
export function fee(store,province){const d=store.delivery;if(!d)return null;const n=d.mode==='fixed'?d.fixed:d.rates?.[province];return Number.isSafeInteger(n)&&n>=0?n:null;}
