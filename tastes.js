/* Giappone 2026 — Assaggi: il libro dei timbri del viaggio.
   Ogni assaggio è una pagina: foto in cornice di carta, hanko del voto, sigillo di chi l'ha timbrato.
   Condivisione: db (tastes, stamps, people) + user + assets; tutto facoltativo, il libro resta leggibile senza. */
(function(){
"use strict";
const App=window.App,{h,$,$$}=App;
const t=k=>App.t(k),L=o=>App.L(o);
const ss={get(k){try{return sessionStorage.getItem(k)}catch(e){return null}},set(k,v){try{v==null?sessionStorage.removeItem(k):sessionStorage.setItem(k,v)}catch(e){}}};
const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

/* ───────── dati e logica pure ───────── */
/* persone: ordine di trip.meta.people, colori fissi (versioni notte in index.html come --p-<id>) */
const PEOPLE=[
  {id:"vincenzo",name:"Vincenzo",day:"#D63A1E",night:"#E4482A"},
  {id:"genny",name:"Genny",day:"#C9A24A",night:"#E3C77A"},
  {id:"andrea",name:"Andrea",day:"#1F3A5F",night:"#5B7BB8"},
  {id:"vivienne",name:"Vivienne",day:"#2E8B6B",night:"#6BBF9A"},
  {id:"mathieu",name:"Mathieu",day:"#7A5FC2",night:"#C7A3F0"},
  {id:"simone",name:"Simone",day:"#1C83A8",night:"#6FB4D6"}].map(p=>({...p,ini:p.name[0],c:`var(--p-${p.id})`}));
const person=id=>PEOPLE.find(p=>p.id===id)||null;
// REVIEW: Vincenzo e Vivienne hanno entrambi il sigillo "V": li distingue solo il colore (vermiglio/verde); i nomi compaiono negli indici e nella pagina grande (vedi Problemi)
/* voti: tre, non cinque; il punteggio serve solo al voto medio della scheda */
const RATINGS=[{id:"zeppin",k:"絶品",c:"var(--shu)",score:3},{id:"umai",k:"旨い",c:"var(--prussian)",score:2},{id:"futsu",k:"普通",c:"var(--stone)",score:1}];
const rating=id=>RATINGS.find(r=>r.id===id)||null;
/* famiglia della mappa di un posto o di un assaggio (stessi campi cat/dish/icon): "eat.noodle", "see.temple", "night.bar"… */
function familyOf(p){if(!p||!p.cat)return null;const F=App.FAMILIES||{};const what=p.cat==="eat"?"eat":p.cat==="night"?"night":"see";
  if(what==="see"&&p.cat==="trip")return"see.trip";const k=what==="eat"?(p.dish||p.icon):p.icon;const f=(F[what]||[]).find(([,ks])=>ks.includes(k));return f?what+"."+f[0]:null}
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ").trim();
const placeKey=x=>x.place||(x.placeName?"~"+norm(x.placeName)+"|"+(x.city||""):null);
/* podio dei posti: per numero di 絶品, a parità per 旨い (poi meno 普通, poi il più recente); solo posti con almeno un 絶品 o 旨い */
function podium(ts){const m=new Map();
  for(const x of ts){const k=placeKey(x);if(!k||!rating(x.rating))continue;let e=m.get(k);
    if(!e){e={key:k,place:x.place||null,name:x.placeName||"",city:x.city||"",zeppin:0,umai:0,futsu:0,n:0,last:-1,sample:x};m.set(k,e)}
    e[x.rating]++;e.n++;if((x.at||0)>e.last){e.last=x.at||0;e.sample=x}}
  return[...m.values()].filter(e=>e.zeppin+e.umai>0).sort((a,b)=>b.zeppin-a.zeppin||b.umai-a.umai||a.futsu-b.futsu||b.last-a.last).slice(0,3)}
/* indici combinabili, uno per gruppo: {who, city, rating, fam, place}; prima gli assaggi veri, poi gli esempi, ciascuno dal più recente */
function filterTastes(ts,idx={}){return ts.filter(x=>(!idx.who||x.who===idx.who)&&(!idx.city||x.city===idx.city)&&(!idx.rating||x.rating===idx.rating)&&(!idx.fam||familyOf(x)===idx.fam)&&(!idx.place||x.place===idx.place))
  .sort((a,b)=>(!!a.ex-!!b.ex)||(b.at||0)-(a.at||0))}
/* voto medio come uno dei tre hanko */
function avgRating(ts){const s=ts.map(x=>rating(x.rating)?.score).filter(Boolean);if(!s.length)return null;const m=s.reduce((a,b)=>a+b,0)/s.length;return m>=2.5?"zeppin":m>=1.5?"umai":"futsu"}
/* foto (piano E): lato lungo 1000 px, JPEG 0,72, al più 220 KB (se no 800 px e 0,65); miniatura 320 px, al più 28 KB, per righe del libro e podio.
   Orientamento EXIF applicato; il file si decodifica una volta sola. */
const PH_MAX=220*1024,TH_MAX=28*1024;
async function decodeImage(file){
  try{const bm=await createImageBitmap(file,{imageOrientation:"from-image"});return{src:bm,w:bm.width,h:bm.height,done:()=>{try{bm.close()}catch(e){}}}}
  catch(e){const url=URL.createObjectURL(file);const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error("image"));i.src=url});
    return{src:img,w:img.naturalWidth,h:img.naturalHeight,done:()=>URL.revokeObjectURL(url)}}}
async function jpegOf(im,max,q){const s=Math.min(1,max/Math.max(im.w,im.h)),cw=Math.max(1,Math.round(im.w*s)),ch=Math.max(1,Math.round(im.h*s));
  const c=document.createElement("canvas");c.width=cw;c.height=ch;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,cw,ch);x.imageSmoothingQuality="high";x.drawImage(im.src,0,0,cw,ch);
  const blob=await new Promise(r=>c.toBlob(r,"image/jpeg",q));if(!blob)throw new Error("toBlob");return blob}
async function resizeImage(file,max=1000,q=.72){const im=await decodeImage(file);try{return await jpegOf(im,max,q)}finally{im.done()}}
const dataUrlOf=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result));r.onerror=()=>rej(r.error||new Error("read"));r.readAsDataURL(blob)});
/* {blob: foto intera, thumb: data URL della miniatura} */
async function preparePhoto(file){const im=await decodeImage(file);
  try{let blob=await jpegOf(im,1000,.72);if(blob.size>PH_MAX)blob=await jpegOf(im,800,.65);
    // REVIEW: se anche a 800 px / 0,65 supera 220 KB si scende ancora (640 px / 0,55): il piano non dice cosa fare oltre il secondo tentativo
    if(blob.size>PH_MAX)blob=await jpegOf(im,640,.55);
    let tb=null;for(const[m,q]of[[320,.7],[320,.55],[320,.42],[240,.42]]){tb=await jpegOf(im,m,q);if(tb.size<=TH_MAX)break}
    return{blob,thumb:await dataUrlOf(tb)}}
  finally{im.done()}}
/* fase corrente secondo la data di Tokyo (come Oggi): la fase del giorno del viaggio, fuori dal viaggio nessuna */
function currentPhase(d=App.now()){const date=App.tokyoParts(d).date;const day=(App.data.trip?.days||[]).find(x=>x.date===date);return day?day.phase:null}

/* ───────── esempi (anteprima, mai scritti nel db) ───────── */
const EX_T=s=>Date.parse(s+":00+09:00");
const EXAMPLES=[
  {place:"fuunji-shinjuku",who:"vincenzo",rating:"zeppin",again:true,note:"Tsukemen densissima, venti minuti di coda e ne vale ognuno.",at:EX_T("2026-11-04T13:10")},
  {place:"fuunji-shinjuku",who:"genny",rating:"zeppin",again:false,note:"Il brodo di pesce mi ha convertita.",at:EX_T("2026-11-04T13:25")},
  {place:"fushimi-inari",who:"simone",rating:"zeppin",again:true,note:"All'alba: nessuno sui gradini fino in cima.",at:EX_T("2026-11-10T07:40")},
  {place:"kagizen-yoshifusa",who:"vivienne",rating:"umai",again:false,note:"Kuzukiri in black syrup, strange and lovely.",at:EX_T("2026-11-11T15:20")},
  {place:"wanaka-sennichimae",who:"andrea",rating:"umai",again:true,note:"Bollenti: aspettate un minuto, fidatevi.",at:EX_T("2026-11-13T20:05")},
  {place:"yaekatsu-shinsekai",who:"mathieu",rating:"futsu",again:false,note:"Il primo spiedino ottimo, al decimo un po' meno.",at:EX_T("2026-11-14T19:30")}];
/* sei timbri di quartiere d'esempio: [zona, chi, quando]; il terzo di ogni gruppo è "senza posizione" (asterisco) */
const EX_STAMPS=[["shinjuku",["vincenzo","genny","andrea","vivienne","mathieu","simone"],"2026-11-03T19:10"],["shibuya",["vincenzo","simone","genny"],"2026-11-04T17:40"],
  ["asakusa-ueno",["andrea","vivienne","mathieu"],"2026-11-05T10:20"],["gion-higashiyama",["genny","mathieu","vincenzo"],"2026-11-10T18:30"],
  ["nara-park",["simone","andrea"],"2026-11-12T11:05"],["dotonbori-namba",["vincenzo","vivienne","andrea","genny"],"2026-11-13T21:00"]];
function examples(){const P=App.data.places||[],ims=App.data.images?.images||[];
  return EXAMPLES.map((e,i)=>{const p=P.find(x=>x.id===e.place);if(!p)return null;const im=ims.find(x=>x.id===p.id)||ims.find(x=>x.id===p.zone);
    return{id:"ex"+i,ex:true,img:im?im.file:null,place:p.id,placeName:L(p.name),city:p.city,dish:p.dish||null,icon:p.icon||null,cat:p.cat,rating:e.rating,again:e.again,note:e.note,uid:null,who:e.who,at:e.at}}).filter(Boolean)}
/* gli esempi riempiono anche sei caselle dei Timbri, per vedere la pagina prima del viaggio */
function exampleStamps(){return EX_STAMPS.flatMap(([zone,who,at])=>who.map((w,i)=>({zone,who:w,uid:null,at:EX_T(at)+i*6e4,gps:i!==2,ex:true})))}

/* ───────── stato ───────── */
const TS={list:[],ok:false,stamps:[],stampsOk:false,me:null,assets:null,init:false,watching:false,unsub:[],idx:{},page:"book",ex:ss.get("tastesEx")==="1",
  busy:false,urls:{},full:{},fresh:null,freshStamp:null,delArm:null,local:{},trial:{},offer:{},locating:null};
/* timbri senza condivisione: {zona:{at,gps}} su questo telefono; le vecchie chiavi delle fasi (v53) si ignorano */
try{const o=JSON.parse(ls.get("tastesStamps")||"{}")||{};for(const[k,v]of Object.entries(o)){if(!(window.STAMPS||{})[k])continue;TS.local[k]=typeof v==="number"?{at:v,gps:false}:{at:+v.at||0,gps:!!v.gps}}}catch(e){TS.local={}}
const SH=()=>App.SH||{};
const shared=()=>SH().state==="on";
const canWrite=()=>shared()&&(App.canWrite?App.canWrite():false);
const canPost=()=>canWrite()&&!!TS.assets&&!!SH().uid;
/* gli esempi esistono solo a libro vuoto: appena c'è un assaggio vero spariscono, e non entrano mai in podio, contatori e indici */
const exOn=()=>TS.ex&&!TS.list.length;
const allTastes=()=>exOn()?examples():TS.list;
const allStamps=()=>exOn()&&!TS.stamps.length?exampleStamps():TS.stamps;
const visible=()=>{const v=$("#v-tastes");return v&&!v.hidden};

// REVIEW: ogni doc tastes/ e stamps/ porta anche "who" (id della persona, mai un nome) oltre a "uid": con la sola sottoscrizione a people/<mio uid> la pagina non saprebbe di chi sono gli assaggi degli altri (vedi Problemi)
/* una sottoscrizione su tastes, una su stamps, una su people/<uid>; partono appena la condivisione è pronta, anche fuori da Assaggi (servono alla scheda del posto) */
function watch(){const S=SH();if(TS.watching||S.state!=="on"||!S.db)return;TS.watching=true;
  const redraw=()=>{if(visible())render()};
  try{TS.unsub.push(S.db.collection("tastes").orderBy("at","desc").limit(500).onSnapshot(s=>{TS.ok=true;
    TS.list=s.docs.map(d=>({id:d.id,...(d.data()||{})})).filter(x=>rating(x.rating)&&typeof idOf(x)==="string");if(!TS.me&&S.uid){const mine=TS.list.find(x=>x.uid===S.uid&&person(x.who));if(mine)TS.me=mine.who}redraw()},()=>{TS.ok=false;redraw()}))}catch(e){}
  try{TS.unsub.push(S.db.collection("stamps").limit(300).onSnapshot(s=>{TS.stampsOk=true;TS.stamps=s.docs.map(d=>d.data()||{}).filter(x=>x.zone&&(window.STAMPS||{})[x.zone]&&person(x.who));redraw()},()=>{TS.stampsOk=false;redraw()}))}catch(e){}
  if(S.uid){try{TS.unsub.push(S.db.doc("people/"+S.uid).onSnapshot(s=>{const w=s.exists?s.data()?.who:null;if(person(w))TS.me=w;redraw()},()=>{}))}catch(e){}}}
async function init(){if(TS.init)return;TS.init=true;
  document.addEventListener("shareready",()=>{watch();if(visible())render()});
  const C=window.claude;if(C&&typeof C.use==="function"){try{TS.assets=await C.use("assets")}catch(e){TS.assets=null}}
  if(App.shareInit)App.shareInit();watch();if(visible())render()}
App.tastesInit=init;

/* ───────── pezzi ───────── */
// REVIEW: fuori da claude.ai (Firebase) la foto di un altro non sta in /_blob/: i doc vecchi portano "url" (solo se https), letto qui dopo la cache di questa visita (vedi Problemi del piano D)
const idOf=x=>typeof x.photo==="string"&&x.photo?x.photo:x.asset;
const FB=()=>!!(window.claude&&window.claude.firebase);
/* foto intera: cache di questa visita, url https dei doc vecchi, /_blob/ dentro claude.ai; con Firebase la foto sta in photos/<id> e si legge solo dalla pagina grande */
const srcOf=x=>{if(x.ex)return x.img?x.img+"?v="+(window.SITE_V||"1"):"";const id=idOf(x);
  return TS.urls[id]||TS.full[id]||(typeof x.url==="string"&&/^https:\/\//.test(x.url)?x.url:FB()?"":"/_blob/"+id)};
const thumbOf=x=>!x.ex&&typeof x.thumb==="string"&&/^data:image\/jpeg;base64,/.test(x.thumb)?x.thumb:"";
/* righe del libro e podio: prima la miniatura del doc */
const smallOf=x=>thumbOf(x)||srcOf(x);
const placeOf=x=>x.place?(App.data.places||[]).find(p=>p.id===x.place)||null:null;
const nameOf=x=>{const p=placeOf(x);return p?L(p.name):(x.placeName||"")};
const CITY={tokyo:"Tokyo",osaka:"Osaka",kyoto:"Kyoto",nara:"Nara",kobe:"Kobe",uji:"Uji",kamakura:"Kamakura",fuji:"Fuji"};
const cityName=c=>CITY[c]||c||"";
const CITY_ORDER=["tokyo","kamakura","fuji","kyoto","uji","nara","osaka","kobe"];
const iconFor=x=>{const I=window.ICONS||{};return I[x.dish]||I[x.icon]||App.icon(x)||I.ramen||""};
const fmtDay=ms=>App.fmtDate(App.tokyoParts(new Date(ms)).date,{day:"numeric",month:"short"});
/* data e ora nel formato unico del sito: "4 nov 13:10" */
const fmtWhen=ms=>{const p=App.tokyoParts(new Date(ms));return App.fmtDT(p.date,String(p.hh).padStart(2,"0")+":"+String(p.mm).padStart(2,"0"))};
function sealEl(who,cls="seal-p"){const p=person(who);return h("span",{class:cls,"data-p":p?p.id:null,style:{"--pc":p?p.c:"var(--stone)"},title:p?p.name:"?","aria-hidden":"true"},p?p.ini:"?")}
function hankoEl(r,cls="hk"){const R=rating(r);if(!R)return null;return h("span",{class:cls+" r-"+R.id,lang:"ja",title:t("tastes.r."+R.id)},h("span",{class:"hk-k"},[...R.k].map(c=>h("span",{},c))))}
function photoEl(x,cls,eager,big){const ph=h("span",{class:cls+(x.ex?" duo":"")});const src=big?srcOf(x)||thumbOf(x):smallOf(x);
  const miss=()=>{ph.classList.add("miss");ph.replaceChildren(h("span",{class:"miss-k",lang:"ja","aria-hidden":"true"},"味"))};
  if(!src){miss();return ph}
  if(x.ex)ph.append(h("span",{class:"ink"}));ph.append(h("img",{src,alt:"",loading:eager?"eager":"lazy",decoding:"async",onerror:miss}));return ph}
/* pagina grande con Firebase: photos/<id> si legge solo adesso; intanto si vede la miniatura */
async function loadFull(x,ph){const id=idOf(x),S=SH();if(x.ex||!FB()||!id||TS.urls[id]||TS.full[id]||!S.db)return;
  try{const s=await S.db.doc("photos/"+id).get();const d=s.exists?s.data():null;if(!d||typeof d.data!=="string"||!/^data:image\//.test(d.data))return;
    TS.full[id]=d.data;const img=ph.querySelector("img");if(img)img.src=d.data;else{ph.classList.remove("miss");ph.replaceChildren(h("img",{src:d.data,alt:"",decoding:"async"}))}}catch(e){}}

/* ── una pagina del libro ── */
function pageEl(x,i){const r=rating(x.rating),p=person(x.who),fam=familyOf(x);
  const tilt=[-1.5,1.2,-.8,1.5,-1.2,.8][i%6];
  return h("button",{type:"button",class:"tp"+(TS.fresh===x.id?" fresh":""),"data-id":x.id,style:{"--r":tilt+"deg"},
      "aria-label":`${nameOf(x)}, ${t("tastes.r."+r.id)}, ${p?p.name:""}`,onclick:()=>openPage(x)},
    h("span",{class:"tp-top"},photoEl(x,"tp-ph",i<8),hankoEl(x.rating,"hk tp-hk"),
      sealEl(x.who,"seal-p tp-seal"),
      h("span",{class:"tp-ico",style:{"--cc":x.cat?App.catColor(x.cat):"var(--ink)"},"aria-hidden":"true",html:iconFor(x)}),
      x.again?h("span",{class:"tp-again",lang:"ja","aria-hidden":"true",title:t("tastes.again")},"再"):null,
      x.ex?h("span",{class:"tp-rib","aria-hidden":"true"},h("span",{},t("tastes.example"))):null),
    h("span",{class:"tp-cap"},h("b",{},nameOf(x)),h("span",{class:"tp-city"},cityName(x.city)+(x.at?", "+fmtDay(x.at):"")),
      x.note?h("span",{class:"tp-note"},x.note):null))}

/* ── testata: titolo, linguette, conteggi ── */
function headEl(all){const real=all.filter(x=>!x.ex),n=real.length,who=new Set(real.map(x=>x.who)).size;
  const tab=(id,k)=>h("button",{type:"button",class:"inkline ta-tab","aria-pressed":String(TS.page===id),onclick:()=>{if(TS.page===id)return;TS.page=id;render()}},h("span",{class:"k",lang:"ja"},k),t("tastes."+id));
  return h("header",{class:"ta-head"},
    h("div",{class:"ta-title"},h("div",{class:"ta-t1"},h("h1",{},t("tastes.title")),h("span",{class:"ta-hanko",lang:"ja","aria-hidden":"true"},"味")),
      h("p",{class:"ta-sub"},n?(n===1?t("tastes.count1"):t("tastes.count").replace("{n}",n))+(who>1?", "+t("tastes.people").replace("{n}",who):""):t("tastes.lede")),
      SH().state==="none"?h("p",{class:"ta-sub ta-noshare"},t("tastes.noshare")):null,
      /* "Installa l'app": porta alla guida in Prima di partire */
      h("button",{type:"button",class:"ta-install",onclick:()=>{App.go("story");setTimeout(()=>{const el=$("#install");if(el)el.scrollIntoView({behavior:"auto",block:"start"})},60)}},h("span",{class:"k",lang:"ja","aria-hidden":"true"},"携"),h("span",{class:"u"},t(App.installed&&App.installed()?"install.done":"install.link")))),
    h("div",{class:"ta-tabs"},tab("book","帳"),tab("stamps","駅")))}

/* ── podio: tre pagine piccole sui gradini ── */
function podiumEl(all){all=all.filter(x=>!x.ex);if(all.length<3)return null;const top=podium(all);if(!top.length)return null;
  const KAN=["一","二","三"],MED=["gold","silver","bronze"];
  const step=(e,i)=>{const x=e.sample;
    return h("button",{type:"button",class:"pod pod-"+(i+1),onclick:()=>{TS.idx=e.place?{place:e.place}:{};TS.page="book";render();const b=$("#book");if(b)b.scrollIntoView({behavior:App.REDUCED?"auto":"smooth",block:"start"})}},
      h("span",{class:"pod-page",style:{"--r":[-3,2,4][i]+"deg"}},photoEl(x,"pod-ph",true),x.ex?h("span",{class:"tp-rib sm","aria-hidden":"true"},h("span",{},t("tastes.example"))):null),
      h("span",{class:"pod-medal m-"+MED[i],lang:"ja","aria-hidden":"true"},KAN[i]),
      h("b",{class:"pod-name"},e.place?nameOf({place:e.place}):e.name),
      h("span",{class:"pod-n"},h("span",{lang:"ja"},"絶品"),h("span",{class:"mono"},String(e.zeppin)),e.umai?h("span",{lang:"ja"},"旨い"):null,e.umai?h("span",{class:"mono"},String(e.umai)):null),
      h("span",{class:"pod-step","aria-hidden":"true"}))};
  const els=top.map(step);const order=els.length===3?[els[1],els[0],els[2]]:els.length===2?[els[1],els[0]]:els;
  return h("section",{class:"podium","aria-label":t("tastes.podium")},h("p",{class:"eyebrow"},t("tastes.podium")),h("div",{class:"pod-row","data-n":String(els.length)},order))}

/* ── indici ── */
function idxEl(all){all=all.filter(x=>!x.ex);if(!all.length)return null;const I=TS.idx,set=(g,v)=>{const n={...I};if(n[g]===v||v==null)delete n[g];else n[g]=v;TS.idx=n;render()};
  const cnt=(g,v)=>filterTastes(all,{...I,[g]:v,place:I.place}).length;
  const any=Object.keys(I).length>0;
  const ix=(g,v,kids,label,extra="")=>{const on=I[g]===v,n=cnt(g,v);return h("button",{type:"button",class:"ix"+extra,"aria-pressed":String(on),"aria-label":label+", "+n,title:label,disabled:!on&&!n?true:null,onclick:()=>set(g,v)},kids,h("span",{class:"n"},String(n)))};
  const cities=CITY_ORDER.filter(c=>all.some(x=>x.city===c)).concat([...new Set(all.map(x=>x.city))].filter(c=>c&&!CITY_ORDER.includes(c)));
  const fams=[];for(const what of["eat","see","night"])for(const[k]of(App.FAMILIES[what]||[])){const key=what+"."+k;if(all.some(x=>familyOf(x)===key))fams.push({key,what,k})}
  const I2=window.ICONS||{};
  const famIcon=f=>I2[(App.FAMILIES[f.what].find(x=>x[0]===f.k)||[,[f.k]])[1][0]]||"";
  return h("nav",{class:"ta-idx","aria-label":t("tastes.idx")},
    h("button",{type:"button",class:"ix ix-all","aria-pressed":String(!any),onclick:()=>{TS.idx={};render()}},t("tastes.all"),h("span",{class:"n"},String(all.length))),
    h("span",{class:"ix-g","aria-label":t("tastes.idx.who"),role:"group"},PEOPLE.map(p=>ix("who",p.id,[sealEl(p.id),h("span",{class:"ix-l"},p.name)],p.name," ix-who"))),
    cities.length>1?h("span",{class:"ix-g",role:"group","aria-label":t("tastes.idx.city")},cities.map(c=>ix("city",c,h("span",{class:"ix-l"},cityName(c)),cityName(c)))):null,
    h("span",{class:"ix-g",role:"group","aria-label":t("tastes.idx.rating")},RATINGS.map(r=>ix("rating",r.id,[hankoEl(r.id,"hk hk-s"),h("span",{class:"ix-l"},t("tastes.r."+r.id))],t("tastes.r."+r.id)," ix-r"))),
    fams.length>1?h("span",{class:"ix-g",role:"group","aria-label":t("tastes.idx.fam")},fams.map(f=>ix("fam",f.key,[h("span",{class:"gi","aria-hidden":"true",html:famIcon(f)}),h("span",{class:"ix-l"},t("genre."+f.what+"."+f.k+".s"))],t("genre."+f.what+"."+f.k)," ix-f"))):null,
    I.place?h("button",{type:"button",class:"ix ix-place","aria-pressed":"true",onclick:()=>set("place",null)},h("span",{class:"ix-l"},t("tastes.only")+": "+nameOf({place:I.place})),h("span",{class:"x","aria-hidden":"true"},"✕")):null)}

/* ── il libro ── */
function bookEl(all){const list=filterTastes(all,TS.idx);
  if(!all.length)return h("div",{class:"book-empty",id:"book"},h("div",{class:"be-page","aria-hidden":"true"},h("span",{class:"be-k",lang:"ja"},"味")),
    h("p",{},t("tastes.empty")),shared()&&!canPost()?h("p",{class:"be-sub"},t("tastes.empty.ro")):null);
  if(!list.length)return h("div",{class:"book-empty",id:"book"},h("p",{},t("tastes.emptyFilter")),h("button",{type:"button",class:"inkline",onclick:()=>{TS.idx={};render()}},t("tastes.all")));
  return h("div",{class:"book",id:"book"},list.map(pageEl))}

/* ── anteprima con esempi ── */
function previewEl(){return h("details",{class:"preview-box ta-preview",open:TS.ex?true:null},h("summary",{},TS.ex?t("tastes.ex.on"):t("tastes.ex.show")),
  h("div",{class:"preview-row"},h("button",{type:"button",class:"inkline",onclick:()=>{TS.ex=!TS.ex;ss.set("tastesEx",TS.ex?"1":null);TS.idx={};render()}},h("span",{class:"k",lang:"ja"},TS.ex?"消":"例"),TS.ex?t("tastes.ex.hide"):t("tastes.ex.show"))),
  h("p",{class:"preview-note"},t("tastes.ex.note")))}

/* ── timbri di quartiere: 29 caselle nell'ordine della rotta (Tokyo I, Kansai, Tokyo II) ── */
const stampZones=()=>(window.STAMP_ORDER||[]).map(id=>(App.data.zones||[]).find(z=>z.id===id)).filter(Boolean);
/* nome corto della zona: prima parte, salvo quando la prima parte è la città (Kōbe – Sannomiya); le parole lunghe con il trattino morbido */
const SOFT={Shimokitazawa:"Shimo\u00ADkitazawa",Shinsaibashi:"Shinsai\u00ADbashi"};
const zoneShortName=z=>{const ps=L(z.name).split(/ \(|,| e | and | & /)[0].split(/\s+[\u2013-]\s+/);const n=ps.length>1&&/^k[oō]be$/i.test(ps[0])?ps[1]:ps[0];return SOFT[n]||n};
/* la posizione è dentro la zona: raggio della zona più 300 m */
const zoneIn=(z,pos)=>!!pos&&App.km(pos.lat,pos.lng,z.lat,z.lng)<=(z.radiusKm||1)+.3;
/* anteprima di un altro giorno (#oggi=…): i timbri sono una prova in memoria, mai scritti */
const preview=()=>Math.abs(App.now().getTime()-Date.now())>6e4;
/* si raccolgono dal primo giorno del viaggio (data di Tokyo, anche in anteprima) */
const stampOpen=()=>{const d=App.data.trip?.days||[];return!!d.length&&App.tokyoParts(App.now()).date>=d[0].date};
/* timbri visibili: condivisi (o esempi) più quelli di questo telefono e le prove */
function stampState(){const S=SH(),all=allStamps(),local=!shared();
  return stampZones().map(z=>{const st=all.filter(x=>x.zone===z.id).sort((a,b)=>(a.at||0)-(b.at||0)),own=TS.trial[z.id]||(local?TS.local[z.id]:null);
    const mine=!!own||st.some(x=>x.uid&&x.uid===S.uid);const first=st.length?st[0].at:own?own.at:null;
    const gps=st.some(x=>x.gps!==false)||!!(own&&own.gps);
    return{z,st,whos:[...new Set(st.map(x=>x.who))].filter(person),mine,done:st.length>0||!!own,at:first,gps,ex:st.some(x=>x.ex),trial:!!TS.trial[z.id]}})}
/* podio di chi ne ha di più: zone distinte per persona */
function stampPodium(all){const m=new Map();for(const x of all){if(!person(x.who))continue;let e=m.get(x.who);if(!e){e={who:x.who,zones:new Set(),last:0};m.set(x.who,e)}e.zones.add(x.zone);e.last=Math.max(e.last,x.at||0)}
  return[...m.values()].map(e=>({who:e.who,n:e.zones.size,last:e.last})).sort((a,b)=>b.n-a.n||a.last-b.last).slice(0,3)}
const herePos=()=>{try{return App.todayDebug().TD.pos}catch(e){return null}};
function stampsEl(){const S=SH(),local=!shared(),open=stampOpen(),rows=stampState(),n=rows.filter(r=>r.done).length,tot=rows.length,pos=herePos();
  const can=open&&(local||canWrite()&&!!S.uid);
  const pod=local?[]:stampPodium(allStamps());const KAN=["一","二","三"];
  const top=h("div",{class:"st-top"},
    h("div",{class:"st-count"},h("p",{class:"st-n"},h("b",{class:"mono"},String(n)),h("span",{}," "+t("tastes.stamps.of").replace("{t}",tot))),
      h("span",{class:"st-bar",style:{"--p":(tot?n/tot*100:0).toFixed(1)+"%"},role:"img","aria-label":t("tastes.stamps.count").replace("{n}",n).replace("{t}",tot)},h("i",{})),
      open?null:h("p",{class:"st-soon"},t("tastes.stamps.soon"))),
    pod.length?h("ol",{class:"st-pod","aria-label":t("tastes.stamps.podium")},h("li",{class:"eyebrow"},t("tastes.stamps.podium")),
      pod.map((e,i)=>h("li",{class:"st-pr"},h("span",{class:"st-rk",lang:"ja","aria-hidden":"true"},KAN[i]),sealEl(e.who),h("span",{class:"st-pn"},person(e.who).name),h("b",{class:"mono"},String(e.n))))):null);
  const tiles=rows.map((r,i)=>{const z=r.z,off=TS.offer[z.id],busy=TS.locating===z.id,near=open&&!r.mine&&zoneIn(z,pos);
    const dt=r.at?fmtDay(r.at):"";
    const act=can&&!r.mine?[
      h("button",{type:"button",class:"zs-b here",disabled:busy?true:null,"aria-label":t("tastes.here")+": "+zoneShortName(z),onclick:()=>hereTap(z)},h("span",{class:"k",lang:"ja","aria-hidden":"true"},"印"),h("span",{},busy?t("tastes.here.busy"):t("tastes.here"))),
      off?h("p",{class:"zs-msg",role:"status"},off.km==null?t("tastes.here.nopos"):t("tastes.here.far").replace("{n}",off.km<10?off.km.toFixed(1).replace(".",App.lang==="it"?",":"."):Math.round(off.km))):null,
      off?h("button",{type:"button",class:"zs-b any",onclick:()=>stampZone(z.id,false)},t("tastes.here.anyway")):null]:[];
    return h("div",{class:"zs"+(r.done?" done":"")+(near?" near":"")+(TS.freshStamp===z.id?" fresh":""),id:"zs-"+z.id,"data-zone":z.id},
      h("div",{class:"zs-h"},h("b",{},zoneShortName(z)),h("span",{},cityName(z.city))),
      h("div",{class:"zs-c"},h("span",{class:"zs-st",style:{"--rot":[-7,5,-3,8,-5,3,-8,6][i%8]+"deg"},role:"img","aria-label":(window.STAMP_NAME||{})[z.id]||z.id,html:(window.STAMPS||{})[z.id]||""}),
        r.done&&!r.gps?h("span",{class:"zs-ast",title:t("tastes.stamps.nogps")},"*"):null),
      h("div",{class:"zs-f"},r.done?h("span",{class:"mono zs-d"},dt):null,r.whos.length?h("span",{class:"seals"},r.whos.map(w=>sealEl(w))):null,
        r.ex?h("span",{class:"stb-ex"},t("tastes.example")):null,r.trial?h("span",{class:"stb-ex"},t("tastes.stamps.try")):null,...act))});
  const anyNoGps=rows.some(r=>r.done&&!r.gps);
  return h("section",{class:"stamps",id:"stamps"},h("p",{class:"ta-lede"},t("tastes.stamps.lede")),top,h("div",{class:"st-book"},tiles),
    anyNoGps?h("p",{class:"preview-note"},"* "+t("tastes.stamps.nogps")):null,
    preview()&&open?h("p",{class:"preview-note"},t("tastes.stamps.trial")):null,
    local?h("p",{class:"preview-note"},t("tastes.stamps.local")):null)}
/* posizione: prima il GPS del telefono (al massimo un minuto vecchia), se manca quella già nota di Oggi */
function locate(){return new Promise(res=>{const fb=()=>res(herePos());
  try{if(!navigator.geolocation)return fb();navigator.geolocation.getCurrentPosition(g=>{const p={lat:g.coords.latitude,lng:g.coords.longitude};if(App.setPos)App.setPos(p);res(p)},fb,{enableHighAccuracy:true,maximumAge:6e4,timeout:8000})}catch(e){fb()}})}
async function hereTap(z){if(TS.locating)return;if(shared()&&!preview()){if(!canWrite()||!SH().uid)return;if(!TS.me){openWho(()=>{App.closeSheet();hereTap(z)});return}}
  TS.locating=z.id;TS.offer={};render();const pos=await locate();TS.locating=null;
  if(zoneIn(z,pos)){await stampZone(z.id,true);return}
  TS.offer={[z.id]:{km:pos?App.km(pos.lat,pos.lng,z.lat,z.lng):null}};render()}
async function stampZone(zone,gps){const S=SH(),at=Date.now();TS.offer={};
  // REVIEW: in anteprima (#oggi=…) il timbro è solo una prova in memoria, così non si scrive nel db un timbro con la data finta (vedi Problemi)
  if(preview()){TS.trial[zone]={at:App.now().getTime(),gps};TS.freshStamp=zone;render();return}
  if(!shared()){TS.local[zone]={at,gps};ls.set("tastesStamps",JSON.stringify(TS.local));TS.freshStamp=zone;render();return}
  if(!canWrite()||!S.uid)return;if(!TS.me){openWho(()=>{App.closeSheet();stampZone(zone,gps)});return}
  const doc={uid:S.uid,who:TS.me,zone,at,gps:!!gps};
  const ok=await App.shWrite(()=>S.db.collection("stamps").doc(`${S.uid}_${zone}`).set(doc));
  if(ok){if(!TS.stamps.some(x=>x.uid===S.uid&&x.zone===zone))TS.stamps=TS.stamps.concat([doc]);TS.freshStamp=zone;render()}}
/* riga nella scheda di zona della Mappa: "Timbro di Shinjuku: preso da V, G" */
App.stampRow=function(z){if(!(window.STAMPS||{})[z.id])return null;const r=stampState().find(x=>x.z.id===z.id);if(!r)return null;const nm=zoneShortName(z);
  return h("button",{type:"button",class:"tasted zs-row",onclick:()=>{TS.page="stamps";App.closeSheet();App.go("tastes");render();
      setTimeout(()=>{const el=$("#zs-"+z.id);if(el)el.scrollIntoView({behavior:App.REDUCED?"auto":"smooth",block:"center"})},80)}},
    h("span",{class:"zs-mini"+(r.done?" done":""),"aria-hidden":"true",html:(window.STAMPS||{})[z.id]}),
    h("span",{class:"tasted-l"},(r.done?t("stamps.row.taken"):t("stamps.row.none")).replace("{z}",nm)),
    r.whos.length?h("span",{class:"seals","aria-label":r.whos.map(w=>person(w).name).join(", ")},r.whos.map(w=>sealEl(w))):(r.done?h("span",{class:"tasted-avg"},t("tastes.stamped")):null))};

/* ───────── la pagina grande ───────── */
function openPage(x){const r=rating(x.rating),p=person(x.who),P=placeOf(x),S=SH(),mine=!x.ex&&!!S.uid&&x.uid===S.uid&&canWrite();TS.delArm=null;
  const del=mine?h("button",{type:"button",class:"tb-del",onclick:async ev=>{const b=ev.currentTarget;
      if(TS.delArm!==x.id){TS.delArm=x.id;b.textContent=t("tastes.delete.sure");b.dataset.armed="1";return}
      // REVIEW: come da piano si cancella solo il doc; la foto resta tra gli asset dell'artifact (vedi Problemi)
      b.disabled=true;const ok=await App.shWrite(()=>S.db.collection("tastes").doc(x.id).delete());
      if(ok){TS.list=TS.list.filter(y=>y.id!==x.id);App.closeSheet();render()}else{b.disabled=false;b.textContent=t("tastes.err.save")}}},t("tastes.delete")):null;
  const bigPh=photoEl(x,"tb-ph",true,true);
  const node=h("div",{class:"tbig"},App.bandHanko({eat:"食",see:"見",night:"夜",shop:"買",trip:"旅"}[x.cat]||"味"),
    h("div",{class:"tb-frame"},bigPh,x.ex?h("span",{class:"tp-rib","aria-hidden":"true"},h("span",{},t("tastes.example"))):null),
    h("div",{class:"sh-body tb-body"},
      h("div",{class:"tb-verdict"},hankoEl(x.rating,"hk hk-l"),h("div",{class:"tb-vt"},h("b",{},t("tastes.r."+r.id)),x.again?h("span",{class:"tb-again"},h("span",{class:"sq",lang:"ja"},"再"),t("tastes.again")):null)),
      h("div",{class:"sh-title"},h("h2",{id:"sheet-title"},nameOf(x)),h("div",{class:"tb-where"},h("span",{class:"tp-ico",style:{"--cc":x.cat?App.catColor(x.cat):"var(--ink)"},"aria-hidden":"true",html:iconFor(x)}),cityName(x.city))),
      x.note?h("p",{class:"tb-note"},x.note):null,
      h("div",{class:"tb-by"},sealEl(x.who),h("span",{},h("b",{},p?p.name:"?"),h("span",{class:"tb-when"},x.at?fmtWhen(x.at):""))),
      P?h("button",{type:"button",class:"inkline",onclick:()=>App.placeSheet(P,{showOnMap:true})},h("span",{class:"k",lang:"ja"},"店"),t("tastes.open")):null,
      del));
  App.openSheet(node);loadFull(x,bigPh)}

/* ───────── chi sei ───────── */
function openWho(then){const S=SH();
  const pick=async id=>{const ok=await App.shWrite(()=>S.db.doc("people/"+S.uid).set({who:id,at:Date.now()}));if(!ok){err.textContent=t("tastes.err.save");return}TS.me=id;if(then)then();else App.closeSheet()};
  const err=h("p",{class:"tn-err",role:"status"});
  App.openSheet(h("div",{class:"sh-body who-pick"},h("div",{class:"sh-title"},h("h2",{id:"sheet-title"},t("tastes.who.title"))),h("p",{class:"lede"},t("tastes.who.text")),
    h("div",{class:"who-grid"},PEOPLE.map(p=>h("button",{type:"button",class:"who-b"+(TS.me===p.id?" on":""),onclick:()=>pick(p.id)},sealEl(p.id,"seal-p seal-l"),h("b",{},p.name)))),err))}

/* ───────── nuovo assaggio ───────── */
function suggestions(){const out=[],add=p=>{if(p&&!out.includes(p)&&p.status!=="closed")out.push(p)},P=App.data.places||[];
  /* chi del gruppo ha timbrato nelle ultime 3 ore: di solito si mangia insieme */
  const recent=TS.list.filter(x=>x.place&&Date.now()-(x.at||0)<3*36e5).sort((a,b)=>b.at-a.at);for(const x of recent)add(placeOf(x));
  try{const T=App.todayDebug(),pos=T.TD.pos;
    if(pos)P.filter(p=>App.km(pos.lat,pos.lng,p.lat,p.lng)<.5).sort((a,b)=>(a.cat!=="eat")-(b.cat!=="eat")||App.km(pos.lat,pos.lng,a.lat,a.lng)-App.km(pos.lat,pos.lng,b.lat,b.lng)).slice(0,3).forEach(add);
    const n=T.nowLine();if(n&&n.kind==="live"&&n.place)add(n.place);
    T.pickNext().list.filter(p=>p.cat==="eat"||p.cat==="night").slice(0,3).forEach(add)}catch(e){}
  return out.slice(0,3)}
function searchPlaces(q){q=norm(q);if(q.length<2)return[];return(App.data.places||[]).filter(p=>[p.name?.it,p.name?.en,p.name?.ja].some(n=>n&&norm(n).includes(q))).slice(0,6)}
function openNew(){if(!canPost())return;if(!TS.me){openWho(openNew);return}
  const S=SH(),sug=suggestions();
  const d={blob:null,thumb:null,url:null,place:null,other:false,otherName:"",otherCity:App.data.trip.days.find(x=>x.date===App.tokyoParts().date)?.city||sug[0]?.city||"tokyo",rating:null,again:false,note:""};
  const err=h("p",{class:"tn-err",role:"status","aria-live":"polite"});
  /* foto */
  const input=h("input",{type:"file",accept:"image/*",capture:"environment",class:"sr",id:"tn-file"});
  const ph=h("label",{class:"tn-photo",for:"tn-file"});
  const drawPhoto=(state)=>{if(state==="busy"){ph.dataset.state="busy";ph.replaceChildren(h("span",{class:"tn-ph-t"},t("tastes.photo.busy")));return}
    if(d.url){ph.dataset.state="ok";ph.replaceChildren(h("img",{src:d.url,alt:""}),h("span",{class:"tn-ph-chg"},t("tastes.photo.change")));return}
    ph.dataset.state="";ph.replaceChildren(h("span",{class:"tn-ph-i","aria-hidden":"true",html:(window.ICONS||{}).camera||""}),h("span",{class:"tn-ph-t"},t("tastes.photo")))};
  drawPhoto();
  input.addEventListener("change",async()=>{const f=input.files&&input.files[0];if(!f)return;drawPhoto("busy");err.textContent="";
    try{const r=await preparePhoto(f);if(d.url)URL.revokeObjectURL(d.url);d.blob=r.blob;d.thumb=r.thumb;d.url=URL.createObjectURL(r.blob)}catch(e){err.textContent=t("tastes.photo.err")}
    drawPhoto();check()});
  /* posto */
  const where=h("div",{class:"tn-where"});
  const q=h("input",{type:"search",class:"tn-in",placeholder:t("tastes.search"),autocomplete:"off","aria-label":t("tastes.search")});
  const res=h("div",{class:"tn-res"});
  const oName=h("input",{type:"text",class:"tn-in",maxlength:"80",placeholder:t("tastes.other.name"),"aria-label":t("tastes.other.name"),autocomplete:"off"});
  const oCity=h("select",{class:"tn-in tn-sel","aria-label":t("tastes.other.city")},CITY_ORDER.map(c=>h("option",{value:c,selected:c===d.otherCity?true:null},cityName(c))));
  oName.addEventListener("input",()=>{d.otherName=oName.value;check()});oCity.addEventListener("change",()=>{d.otherCity=oCity.value});
  const chip=(p,on)=>h("button",{type:"button",class:"chip tn-chip","aria-pressed":String(on),onclick:()=>{d.place=p.id;d.other=false;q.value="";drawWhere();check()}},App.iconEl(p),h("span",{},L(p.name)),h("small",{},cityName(p.city)));
  const drawWhere=()=>{const sel=d.place&&(App.data.places||[]).find(p=>p.id===d.place);const chips=[];if(sel&&!sug.includes(sel))chips.push(sel);chips.push(...sug);
    /* nessun posto scelto in partenza: il campo è vuoto e i suggerimenti stanno sotto, da toccare */
    where.replaceChildren(
      h("div",{class:"tn-search"},q,res),
      chips.length?h("div",{class:"tn-chips"},chips.map(p=>chip(p,!d.other&&d.place===p.id))):null,
      d.other?h("div",{class:"tn-other"},oName,oCity):h("button",{type:"button",class:"tn-link",onclick:()=>{d.other=true;d.place=null;drawWhere();check();oName.focus()}},t("tastes.other")))};
  q.addEventListener("input",()=>{const r=searchPlaces(q.value);res.replaceChildren(...r.map(p=>h("button",{type:"button",class:"tn-row",onclick:()=>{d.place=p.id;d.other=false;q.value="";res.replaceChildren();drawWhere();check()}},
    App.iconEl(p),h("b",{},L(p.name)),h("small",{},cityName(p.city)))))});
  drawWhere();
  /* voto */
  const rate=h("div",{class:"tn-rate",role:"radiogroup","aria-label":t("tastes.rating")},RATINGS.map(r=>h("button",{type:"button",class:"tn-r",role:"radio","aria-checked":"false","data-r":r.id,
    onclick:ev=>{d.rating=r.id;$$(".tn-r",rate).forEach(b=>b.setAttribute("aria-checked",String(b.dataset.r===r.id)));check()}},hankoEl(r.id,"hk hk-xl"),h("span",{},t("tastes.r."+r.id)))));
  const again=h("button",{type:"button",class:"tn-again","aria-pressed":"false",onclick:()=>{d.again=!d.again;again.setAttribute("aria-pressed",String(d.again))}},h("span",{class:"sq",lang:"ja"},"再"),t("tastes.again"));
  const note=h("textarea",{class:"tn-in tn-note",maxlength:"140",rows:"2",placeholder:t("tastes.note.ph"),"aria-label":t("tastes.note")});
  const left=h("span",{class:"tn-left mono"},"140");note.addEventListener("input",()=>{d.note=note.value;left.textContent=String(140-note.value.length)});
  const go=h("button",{type:"button",class:"tn-go",onclick:submit},h("span",{class:"k",lang:"ja"},"印"),h("span",{class:"tn-go-t"},t("tastes.go")));
  function missing(){const m=[];if(!d.blob)m.push(t("tastes.m.photo"));if(!(d.place||(d.other&&d.otherName.trim())))m.push(t("tastes.m.place"));if(!d.rating)m.push(t("tastes.m.rating"));return m}
  function check(){const m=missing();go.dataset.ready=m.length?"0":"1";go.setAttribute("aria-disabled",String(!!m.length))}
  async function submit(){if(TS.busy)return;const m=missing();if(m.length){err.textContent=t("tastes.missing")+": "+m.join(", ");return}
    TS.busy=true;go.dataset.busy="1";$(".tn-go-t",go).textContent=t("tastes.going");err.textContent="";
    const fail=msg=>{TS.busy=false;go.dataset.busy="0";$(".tn-go-t",go).textContent=t("tastes.go");err.textContent=msg};
    let up;try{up=await TS.assets.upload(d.blob,{type:"image/jpeg"})}catch(e){const c=e&&e.code;
      return fail(t(c==="too_large"?"tastes.err.big":c==="quota_or_state"?"tastes.err.quota":c==="not_granted"||c==="capability_disabled"||c==="capability_removed"?"tastes.err.off":"tastes.err.upload"))}
    if(!up||!up.id)return fail(t("tastes.err.upload"));
    TS.urls[up.id]=up.url;const P=d.place&&(App.data.places||[]).find(p=>p.id===d.place);
    // REVIEW: il piano chiede il campo "photo" (id); si tiene anche "asset" con lo stesso id, così i doc restano leggibili dalle versioni precedenti e dai test esistenti
    const doc={asset:up.id,photo:up.id,thumb:d.thumb,place:P?P.id:null,placeName:P?L(P.name):d.otherName.trim().slice(0,80),city:P?P.city:d.otherCity,dish:P?P.dish||null:null,icon:P?P.icon||null:null,cat:P?P.cat:"eat",
      rating:d.rating,again:!!d.again,note:d.note.trim().slice(0,140),uid:S.uid,who:TS.me,at:Date.now()};if(typeof up.url==="string"&&/^https:\/\//.test(up.url))doc.url=up.url;
    let ref;try{ref=S.db.collection("tastes").doc()}catch(e){return fail(t("tastes.err.save"))}
    const ok=await App.shWrite(()=>ref.set(doc));
    // REVIEW: se il salvataggio del doc fallisce, l'asset appena caricato resta senza riga che lo indichi (vedi Problemi)
    if(!ok)return fail(t("tastes.err.save"));
    TS.busy=false;TS.fresh=ref.id;if(!TS.list.some(x=>x.id===ref.id))TS.list=[{id:ref.id,...doc}].concat(TS.list);
    TS.idx={};TS.page="book";App.closeSheet();render();scrollTo({top:0,behavior:App.REDUCED?"auto":"smooth"})}
  check();
  const p=person(TS.me);
  App.openSheet(h("div",{class:"sh-body tn"},
    h("div",{class:"sh-title"},h("h2",{id:"sheet-title"},t("tastes.new")),
      h("p",{class:"tn-as"},t("tastes.who.as"),sealEl(TS.me),h("b",{},p?p.name:""),h("button",{type:"button",class:"tn-link",onclick:()=>openWho(openNew)},t("tastes.who.change")))),
    h("div",{class:"tn-f"},input,ph),
    h("div",{class:"tn-f"},h("p",{class:"eyebrow"},t("tastes.where")),where),
    h("div",{class:"tn-f"},h("p",{class:"eyebrow"},t("tastes.rating")),rate,again),
    h("div",{class:"tn-f"},h("p",{class:"eyebrow tn-nh"},h("span",{},t("tastes.note")),left),note),
    err,go),()=>{if(d.url)setTimeout(()=>{try{URL.revokeObjectURL(d.url)}catch(e){}},2000)})}

/* ───────── scheda del posto: "Assaggiato da" ───────── */
App.tastedRow=function(P){const ts=allTastes().filter(x=>x.place===P.id);if(!ts.length)return null;const whos=[...new Set(ts.map(x=>x.who))].filter(person),avg=avgRating(ts);
  return h("button",{type:"button",class:"tasted",onclick:()=>{TS.idx={place:P.id};TS.page="book";App.closeSheet();App.go("tastes");render()}},
    h("span",{class:"tasted-l"},t("tastes.tasted")),h("span",{class:"seals"},whos.map(w=>sealEl(w))),
    avg?h("span",{class:"tasted-avg"},hankoEl(avg,"hk hk-s"),h("span",{},t("tastes.r."+avg))):null,
    h("span",{class:"tasted-n mono"},String(ts.length)))};

/* ───────── render ───────── */
function render(){const box=$("#tastes");if(!box)return;const all=allTastes();
  const newBtn=TS.page==="book"&&canPost()?h("button",{type:"button",class:"maps-btn new-taste",id:"new-taste",onclick:openNew},h("span",{class:"nt-i","aria-hidden":"true",html:(window.ICONS||{}).camera||""}),h("span",{},t("tastes.new"))):null;
  box.dataset.page=TS.page;box.dataset.post=newBtn?"1":"0";
  /* il bottone sta nella testata: sul telefono resta fisso sopra la barra (CSS), su desktop è nella testata e non è fisso */
  const head=headEl(all);if(newBtn)head.append(newBtn);
  box.replaceChildren(...[head,
    TS.page==="book"?podiumEl(all):null,
    TS.page==="book"?idxEl(all):null,
    TS.page==="book"?bookEl(all):stampsEl(),
    TS.list.length?null:previewEl()].filter(Boolean));
  if(TS.fresh)setTimeout(()=>{TS.fresh=null},900);if(TS.freshStamp)setTimeout(()=>{TS.freshStamp=null},900)}
App.renderTastes=function(){init();render()};
App.tastesDebug=()=>({PEOPLE,RATINGS,familyOf,podium,filterTastes,avgRating,resizeImage,preparePhoto,currentPhase,examples,exampleStamps,suggestions,searchPlaces,TS,canPost,stampZones,stampPodium,zoneIn});
})();
