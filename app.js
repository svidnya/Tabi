/* Giappone 2026 — app core */
(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const h=(tag,attrs={},...kids)=>{const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs||{})){if(v==null||v===false)continue;if(k==="class")e.className=v;else if(k==="html")e.innerHTML=v;else if(k.startsWith("on"))e.addEventListener(k.slice(2),v);else if(k==="style"&&typeof v==="object"){for(const[sk,sv]of Object.entries(v)){if(sk.startsWith("--"))e.style.setProperty(sk,sv);else e.style[sk]=sv}}else e.setAttribute(k,v===true?"":v)}for(const c of kids.flat()){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(String(c)))}return e};
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const REDUCED=matchMedia("(prefers-reduced-motion: reduce)").matches;

const App=window.App={data:{},lang:"it",h,$,$$,REDUCED};

/* ───────── time ───────── */
const TZ="Asia/Tokyo";
/* anteprima: #oggi=2026-11-06T19:30 (ora di Tokyo) finge quella data per tutta la visita */
const FAKE=(()=>{try{let v=null;const m=location.hash.match(/oggi=(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/);if(m)v=`${m[1]}T${m[2]||"12"}:${m[3]||"00"}`;else v=sessionStorage.getItem("fakeNow");if(!v)return null;const t0=Date.parse(v+":00+09:00");if(isNaN(t0))return null;return{t0,real:Date.now(),v}}catch(e){return null}})();
function setFake(v){try{v?sessionStorage.setItem("fakeNow",v):sessionStorage.removeItem("fakeNow")}catch(e){}location.hash="oggi";location.reload()}
function now(){return FAKE?new Date(FAKE.t0+(Date.now()-FAKE.real)):new Date()}
function tokyoParts(d=now()){const f=new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",weekday:"short",hourCycle:"h23"});
  const o={};for(const p of f.formatToParts(d))o[p.type]=p.value;return{date:`${o.year}-${o.month}-${o.day}`,hh:+o.hour,mm:+o.minute,ss:+o.second,dow:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(o.weekday)}}
function fmtTime(d,tz){return new Intl.DateTimeFormat(App.lang==="it"?"it-IT":"en-GB",{timeZone:tz,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(d)}
function fmtDate(iso,opts={day:"numeric",month:"long"}){const d=new Date(iso+"T12:00:00+09:00");return new Intl.DateTimeFormat(App.lang==="it"?"it-IT":"en-GB",{timeZone:TZ,...opts}).format(d)}
App.tokyoParts=tokyoParts;
/* un solo formato per data e ora in tutto il sito: "3 nov 17:55" */
/* giorni mancanti all'atterraggio: differenza tra la data di oggi e quella dell'atterraggio, entrambe in ora di Tokyo
   (il 14 ottobre sono 20, il 3 novembre 0); la usano il timbro del Racconto e il biglietto di Oggi */
App.daysToLanding=function(d=now()){const land=(App.data.trip?.meta?.landing||"2026-11-03").slice(0,10),day=tokyoParts(d).date;return Math.round((Date.parse(land+"T00:00:00Z")-Date.parse(day+"T00:00:00Z"))/864e5)};
function fmtDT(iso,time){return fmtDate(iso,{day:"numeric",month:"short"})+(time?" "+time:"")}App.fmtDT=fmtDT;
/* intervallo di date nello stesso formato: "3 nov", "3–9 nov" (stesso mese), "30 ott – 2 nov" */
App.fmtRange=(a,b)=>{const S={day:"numeric",month:"short"};if(!b||a===b)return fmtDate(a,S);return a.slice(0,7)===b.slice(0,7)?fmtDate(a,{day:"numeric"})+"–"+fmtDate(b,S):fmtDate(a,S)+" – "+fmtDate(b,S)};
const stack=(txt,cls="tate",extra={})=>h("div",{class:cls,lang:"ja",...extra},[...txt].map(c=>h("span",{},c)));App.stack=stack;App.fmtTime=fmtTime;App.fmtDate=fmtDate;App.now=now;

/* sun position (after SunCalc, V. Agafonkin, BSD-2) */
const rad=Math.PI/180,dayMs=864e5,J1970=2440588,J2000=2451545,e=rad*23.4397,J0=.0009;
const toDays=d=>d.valueOf()/dayMs-.5+J1970-J2000, fromJ=j=>new Date((j+.5-J1970)*dayMs);
function sunTimes(date,lat,lng){const lw=rad*-lng,phi=rad*lat,d=toDays(date),n=Math.round(d-J0-lw/(2*Math.PI)),ds=J0+lw/(2*Math.PI)+n,M=rad*(357.5291+.98560028*ds);
  const C=rad*(1.9148*Math.sin(M)+.02*Math.sin(2*M)+.0003*Math.sin(3*M)),L=M+C+rad*102.9372+Math.PI,dec=Math.asin(Math.sin(e)*Math.sin(L));
  const Jnoon=J2000+ds+.0053*Math.sin(M)-.0069*Math.sin(2*L),w=Math.acos((Math.sin(-.833*rad)-Math.sin(phi)*Math.sin(dec))/(Math.cos(phi)*Math.cos(dec)));
  const Jset=J2000+(J0+(w+lw)/(2*Math.PI)+n)+.0053*Math.sin(M)-.0069*Math.sin(2*L);return{rise:fromJ(Jnoon-(Jset-Jnoon)),set:fromJ(Jset)}}
App.sunTimes=sunTimes;
// REVIEW: il 16 nov "viceversa" letto come city:"osaka" + cityAfter tokyo alle 15:00 (il check-in a Nakano è alle 16:00), vedi Problemi
/* città effettiva: nei giorni di trasferimento (trip.json, cityAfter) prima dell'ora data vale day.city, dopo cityAfter.city */
const hm=s=>{const m=/^(\d{1,2}):(\d{2})/.exec(s||"");return m?(+m[1])*60+(+m[2]):null};
function moved(day,mins){const a=day&&day.cityAfter,m=a&&hm(a.time);return m!=null&&mins>=m}
function dayCity(day,mins){return day?(moved(day,mins)?day.cityAfter.city:day.city):"tokyo"}
App.dayCity=dayCity;
function cityNow(d=now()){const tp=tokyoParts(d);const day=(App.data.trip?.days||[]).find(x=>x.date===tp.date);return dayCity(day,tp.hh*60+tp.mm)}
const CITY_LL={tokyo:[35.69,139.70],osaka:[34.68,135.52],kyoto:[35.01,135.77],nara:[34.68,135.83],kobe:[34.69,135.19]};
function sunToday(d=now()){const c=cityNow(d),[la,ln]=CITY_LL[c]||CITY_LL.tokyo;const p=tokyoParts(d);const noon=new Date(p.date+"T12:00:00+09:00");return sunTimes(noon,la,ln)}
App.sunToday=sunToday;

/* palette: day or night, no in-between, switched by real sun times in Japan */
const PAL={
  day:{land:"#F3EEE4",paper:"#F3EEE4",paper2:"#EAE3D5",paper3:"#E0D7C5",ink:"#151515",ink2:"#3A3732",stone:"#6A655C",sea:"#D8DED9",shu:"#D63A1E",eat:"#D9800F",see:"#2E8B6B",night:"#7A5FC2",shop:"#1C83A8",trip:"#8C6A3A",sun:"#E9A23B"},
  night:{land:"#22304F",paper:"#141E35",paper2:"#1B2745",paper3:"#22304F",ink:"#E9E2D2",ink2:"#C9C2B2",stone:"#9B978A",sea:"#0E1527",shu:"#E4482A",eat:"#E0A040",see:"#6BBF9A",night:"#C7A3F0",shop:"#6FB4D6",trip:"#D9B27A",sun:"#F2B544"}};
function nightness(d=now()){const s=sunToday(d),t=d.getTime(),m=6e4;const r=s.rise.getTime(),st=s.set.getTime();
  if(t<r-30*m||t>st+45*m)return 1;if(t>r+30*m&&t<st-45*m)return 0;if(t<=r+30*m)return 1-(t-(r-30*m))/(60*m);return(t-(st-45*m))/(90*m)}
App.nightness=nightness;
function palette(n){return{...(n<.5?PAL.day:PAL.night)}}
App.forceMode=null; // null = segue il sole di Tokyo, 0 = giorno, 1 = notte (interruttore sul pallino dell'orologio)
function applyPalette(){const n=App.forceMode==null?(nightness()<.5?0:1):App.forceMode,p=palette(n),r=document.documentElement.style;
  const map={land:"--land",paper:"--paper",paper2:"--paper-2",paper3:"--paper-3",ink:"--ink",ink2:"--ink-2",stone:"--stone",sea:"--sea",shu:"--shu",eat:"--c-eat",see:"--c-see",night:"--c-night",shop:"--c-shop",trip:"--c-trip",sun:"--sun"};
  for(const k in map)r.setProperty(map[k],p[k]);
  r.setProperty("--line",n>.6?"rgba(233,226,210,.16)":"rgba(21,21,21,.14)");r.setProperty("--c-booked",p.shu);
  document.documentElement.dataset.night=n>.6?"1":"0";document.documentElement.dataset.mode=n<.5?"day":"night";
  App.pal=p;App.night=n;const meta=$("meta[name=theme-color]");if(meta)meta.content=p.paper;document.dispatchEvent(new CustomEvent("palette",{detail:{n,p}}))}
App.palette=()=>App.pal;

/* ───────── i18n ───────── */
function t(k){return (App.data.i18n?.[App.lang]?.[k])??(App.data.i18n?.it?.[k])??k}
const L=o=>o==null?"":typeof o==="string"?o:(o[App.lang]??o.it??o.en??"");
App.t=t;App.L=L;
function applyI18n(){document.documentElement.lang=App.lang;$$("[data-i]").forEach(el=>{el.textContent=t(el.dataset.i)});
  $$("[data-ia]").forEach(el=>el.setAttribute("aria-label",t(el.dataset.ia)));$$("[data-it]").forEach(el=>el.setAttribute("title",t(el.dataset.it)));
  $("#lang").textContent=t("lang.switch");$("#lang").setAttribute("aria-label",t("lang.label"));$("#yen").setAttribute("aria-label",t("nav.yen"));$("#brand").setAttribute("aria-label",t("nav.story"));
  $("#sheet-x").setAttribute("aria-label",t("sheet.close"))}

/* ───────── speech ───────── */
App.speak=function(text){try{const s=window.speechSynthesis;if(!s)return false;s.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="ja-JP";u.rate=.85;const v=s.getVoices().find(v=>/^ja/i.test(v.lang));if(v)u.voice=v;s.speak(u);return true}catch(e){return false}};
const ICON={speak:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>',
  full:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>'};
App.ICON=ICON;
App.phraseEl=function(ph){if(!ph)return null;const tr=App.lang==="it"?ph.it:ph.en;
  return h("div",{class:"phrase"},h("div",{},h("div",{class:"ja",lang:"ja"},ph.ja),h("div",{class:"ro"},ph.romaji),h("div",{class:"tr"},tr)),
    h("div",{class:"ph-btns"},h("button",{class:"icon-btn",type:"button","aria-label":t("today.listen"),html:ICON.speak,onclick:()=>App.speak(ph.ja)}),
      h("button",{class:"icon-btn",type:"button","aria-label":t("yen.full"),html:ICON.full,onclick:()=>App.fullPhrase(ph)})),
    ph.note?h("div",{class:"note"},L(ph.note)):null)};
App.fullPhrase=function(ph){const box=h("div",{class:"fullphrase",role:"dialog","aria-label":ph.romaji},h("div",{},h("div",{class:"ja",lang:"ja"},ph.ja),h("div",{class:"ro"},ph.romaji+" — "+(App.lang==="it"?ph.it:ph.en))),
  h("button",{class:"sheet-x",type:"button","aria-label":t("sheet.close"),onclick:()=>box.remove()},"✕"));box.addEventListener("click",ev=>{if(ev.target===box)box.remove()});document.body.append(box);App.speak(ph.ja)};

/* ───────── sheet ───────── */
const sheet=$("#sheet"),scrim=$("#scrim");let sheetClose=null;
App.openSheet=function(node,onClose){const b=$("#sheet-body");b.replaceChildren(node);sheet.dataset.open="1";document.documentElement.dataset.sheet="1";scrim.dataset.open="1";sheet.scrollTop=0;sheetClose=onClose||null;App.pushLayer("sheet",()=>App.closeSheet());setTimeout(()=>$("#sheet-x").focus({preventScroll:true}),50)};
App.closeSheet=function(){App.dropLayer("sheet");sheet.dataset.open="0";document.documentElement.dataset.sheet="0";scrim.dataset.open="0";if(sheetClose){const f=sheetClose;sheetClose=null;f()}};
/* telefono: la scheda si chiude trascinandola in giù dalla maniglia o dalle prime 72 px (oltre 120 px o veloce), se no rientra */
(function dragSheet(){const PH=matchMedia("(max-width:899px)");let st=null,moved=false;
  const tm=ev=>{if(st&&moved)ev.preventDefault()};
  sheet.addEventListener("pointerdown",ev=>{if(!PH.matches||sheet.dataset.open!=="1"||ev.button>0)return;const r=sheet.getBoundingClientRect();
    if(ev.clientY-r.top>72||sheet.scrollTop>0)return;st={y:ev.clientY,id:ev.pointerId,last:[[ev.clientY,performance.now()]]};moved=false;
    addEventListener("touchmove",tm,{passive:false})});
  sheet.addEventListener("pointermove",ev=>{if(!st||ev.pointerId!==st.id)return;const d=ev.clientY-st.y;if(!moved&&d<6)return;
    if(!moved){moved=true;sheet.classList.add("dragging");try{sheet.setPointerCapture(st.id)}catch(e){}}
    sheet.style.transform="translateY("+Math.max(0,d)+"px)";st.last.push([ev.clientY,performance.now()]);if(st.last.length>6)st.last.shift()});
  const up=ev=>{if(!st||ev.pointerId!==st.id)return;const s0=st;st=null;removeEventListener("touchmove",tm);sheet.classList.remove("dragging");if(!moved)return;
    const d=ev.clientY-s0.y,a=s0.last[0],b=s0.last[s0.last.length-1],v=(b[0]-a[0])/Math.max(1,b[1]-a[1]);
    if(d>120||v>.5){sheet.style.transform="";App.closeSheet()}
    else{sheet.style.transition=REDUCED?"none":"transform .22s cubic-bezier(.2,.8,.2,1)";sheet.style.transform="";setTimeout(()=>{sheet.style.transition=""},240)}};
  sheet.addEventListener("pointerup",up);sheet.addEventListener("pointercancel",up);
  sheet.addEventListener("click",ev=>{if(moved){moved=false;ev.stopPropagation();ev.preventDefault()}},true)})();
$("#sheet-x").onclick=App.closeSheet;scrim.onclick=App.closeSheet;addEventListener("keydown",ev=>{if(ev.key==="Escape"){const fp=$(".fullphrase");if(fp)fp.remove();else App.closeSheet()}});

/* fascia bokashi con il timbro di categoria in alto a destra (Tasca, pagina grande degli assaggi, zona senza foto) */
App.bandHanko=k=>h("div",{class:"sh-band"},h("span",{class:"big",lang:"ja","aria-hidden":"true"},k));

/* ───────── places helpers ───────── */
const CATK={eat:"食",see:"見",night:"夜",shop:"買",trip:"旅"};
const DISHK={ramen:"麺",sushi:"鮨",tonkatsu:"豚",gyukatsu:"牛",wagyu:"牛",yakiniku:"焼",yakitori:"鳥",tempura:"天",soba:"蕎",onigiri:"結",gyoza:"餃",okonomiyaki:"焼",takoyaki:"蛸",kushikatsu:"串",omurice:"卵",sando:"挟",hamburg:"肉",sweets:"甘",cafe:"珈",bar:"酒",sake:"酒",whisky:"酒",izakaya:"酒",market:"市"};
/* famiglie fisse dei generi (v42), condivise da Mappa e Assaggi: [chiave, chiavi dish/icon che contiene]; icona = prima chiave */
App.FAMILIES={
  eat:[["noodle",["ramen","soba"]],["fish",["sushi","tempura"]],["meat",["wagyu","yakiniku","yakitori","tonkatsu","gyukatsu","hamburg","kushikatsu","gyoza"]],["street",["okonomiyaki","takoyaki","onigiri","omurice","sando"]],["sweet",["sweets","cafe"]],["market",["market"]],["izakaya",["izakaya","sake","bar","whisky"]]],
  see:[["temple",["temple","shrine"]],["garden",["garden","park"]],["view",["view"]],["museum",["museum","castle"]],["street",["street","market"]],["onsen",["onsen"]],["sport",["gym"]],["shops",["shop","records","vintage","books","game"]],["trip",["train","ferry","bus"]]],
  night:[["izakaya",["izakaya"]],["bar",["bar","sake","whisky"]],["club",["club"]],["karaoke",["karaoke"]]]};
App.catColor=c=>`var(--c-${c})`;
App.isBooked=p=>p.booking==="booked";
const ICONK={see:"view",night:"bar",shop:"shop",trip:"train"};
App.icon=p=>{const I=window.ICONS||{};return I[p.dish]||I[p.icon]||I[ICONK[p.cat]]||""};
App.iconEl=(p,cls="pi")=>h("span",{class:cls,"aria-hidden":"true",html:App.icon(p)});
App.glyph=p=>App.isBooked(p)?"予":(p.cat==="eat"&&DISHK[p.dish])||CATK[p.cat]||"・";
function stayFor(p,d=now()){const day=tokyoParts(d).date;const st=App.data.trip.stays;if(p.city==="tokyo"||p.city==="kamakura"||p.city==="fuji")return day>="2026-11-16"?st[2]:st[0];return st[1]}
function km(a,b,c,d){const R=6371,x=(c-a)*rad,y=(d-b)*rad,s=Math.sin(x/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(s))}
App.km=km;
function baseOf(stay){return App.data.bases.find(b=>b.id===stay.id)}
/* distanza in km dalla casa della fase per la zona del posto (Tokyo: Shinjuku o Nakano secondo la data, Kansai: Osaka) */
App.homeKm=function(p,d=now()){const b=baseOf(stayFor(p,d));return b?km(b.lat,b.lng,p.lat,p.lng):0};
App.distanceText=function(p){const st=stayFor(p),b=baseOf(st);if(!b)return"";const k=km(b.lat,b.lng,p.lat,p.lng);
  const nm=L(st.name).split(",")[0];if(k<2.2)return`~${Math.max(3,Math.round(k*1.3/4.8*60))} ${t("min")} ${t("sheet.walk")}, ${t("sheet.from")} ${nm}`;
  return`${k<10?k.toFixed(1):Math.round(k)} ${t("km")}, ${t("sheet.train")}, ${t("sheet.from")} ${nm}`};
App.isOpen=function(p,d=now()){if(p.status==="closed")return false;const hs=p.hoursSpec;if(hs==null)return null;if(hs.length===0)return true;
  const tp=tokyoParts(d),mins=tp.hh*60+tp.mm,toM=s=>{const[a,b]=s.split(":").map(Number);return a*60+b};
  for(const r of hs){if(r.d.includes(tp.dow)&&mins>=toM(r.o)&&mins<toM(r.c))return true;const prev=(tp.dow+6)%7;if(r.d.includes(prev)&&toM(r.c)>1440&&mins<toM(r.c)-1440)return true}return false};
/* "Chi l'ha suggerito": solo tre valori leggibili (noi, Luca, suggerimento) più "Da scoprire" e "Catena";
   la nota interna sulla fonte (p.sourceNote: ricerca, foglio Excel, chat) non si mostra mai */
function sourceText(p){return[t(p.source==="luca"?"badge.luca":"source."+(p.source||"sugg")),p.discover?t("badge.discover"):null,p.chain?t("badge.chain"):null].filter(Boolean).join(", ")}
App.placeSheet=function(p,opts={}){
  const ph=App.data.phrases.byType[p.phraseType]?.[0];
  const badges=h("div",{class:"badges"},
    h("span",{class:"badge src-"+p.source},t("source."+p.source)),
    p.discover?h("span",{class:"badge disc"},t("badge.discover")):null,p.chain?h("span",{class:"badge chain"},t("badge.chain")):null,
    h("span",{class:"badge"+(p.booking==="booked"?" shu":"")},t("booking."+p.booking)),
    p.tier?h("span",{class:"badge"},t("filter."+p.tier)):null,
    h("span",{class:"badge mono"},"¥".repeat(p.price||1)));
  const open=App.isOpen(p);
  const warn=p.status==="closed"?t("sheet.status.closed"):p.status==="uncertain"?t("sheet.status.uncertain"):null;
  const kv=[];const add=(k,v)=>{if(v)kv.push(h("div",{},h("span",{class:"eyebrow"},t(k)),h("span",{},v)))};
  add("sheet.why",L(p.why));if(p.order)add("sheet.order",L(p.order));
  add("sheet.hours",L(p.hours)+(open===true?" ●":""));add("sheet.best",L(p.bestTime));add("sheet.price",L(p.priceText));
  if(p.bookingNote)add("sheet.booking",L(p.bookingNote));if(p.tips)add("sheet.tips",L(p.tips));
  add("sheet.distance",App.distanceText(p));add("sheet.source",sourceText(p));
  const node=h("div",{},
    bandEl(p,App.iconEl(p,"ico"),h("span",{class:"cat"},t("cat."+p.cat)),h("span",{class:"big",lang:"ja","aria-hidden":"true"},App.isBooked(p)?"予":CATK[p.cat]||App.glyph(p))),
    h("div",{class:"sh-body"},
      h("div",{class:"sh-title"},h("h2",{id:"sheet-title"},L(p.name)),h("div",{class:"ja",lang:"ja"},p.name.ja!==L(p.name)?p.name.ja:"")),
      badges,warn?h("div",{class:"badge warn"},warn):null,
      App.tastedRow?App.tastedRow(p):null,
      h("p",{class:"lede"},L(p.what)),
      h("a",{class:"maps-btn",href:p.maps,target:"_blank",rel:"noopener",html:ICON.pin+"<span>"+t("sheet.maps")+"</span>"}),
      opts.showOnMap?h("button",{class:"inkline",type:"button",onclick:()=>{App.closeSheet();go("map");(loadMap()||Promise.resolve()).then(()=>setTimeout(()=>App.focusPlace&&App.focusPlace(p.id),300))}},h("span",{class:"k",lang:"ja"},"図"),t("sheet.showmap")):null,
      h("div",{class:"kv"},kv),App.planRow?App.planRow(p):null,
      ph?h("div",{},h("p",{class:"eyebrow",style:{marginBottom:"8px"}},t("sheet.phrase")),App.phraseEl(ph)):null,
      h("p",{class:"eyebrow",style:{fontSize:".65rem"}},p.hoursChecked?t("sheet.verified"):t("sheet.unverified"))));
  App.openSheet(node,opts.onClose)};
// REVIEW: didascalia "Foto della zona: <nome>" invece del punto mediano (vietato dal piano), vedi Problemi
/* fascia della scheda: foto propria del posto o, se manca, foto della zona (locale, duotone); senza foto resta il bokashi */
function bandEl(p,...kids){const ims=App.data.images?.images||[],own=ims.find(i=>i.id===p.id),zim=own?null:ims.find(i=>i.id===p.zone),im=own||zim;
  if(!im)return h("div",{class:"sh-band"},...kids);const z=zim&&(App.data.zones||[]).find(x=>x.id===p.zone);
  const band=h("div",{class:"sh-band duo has-photo"},h("span",{class:"ink"}),h("img",{src:im.file+"?v="+(window.SITE_V||"1"),alt:"",loading:"lazy",onerror:ev=>{band.className="sh-band";ev.target.previousSibling.remove();ev.target.nextSibling.remove();ev.target.remove();cr.remove()}}),h("span",{class:"fade"}),...kids);
  const cr=h("span",{class:"credit"},(z?t("sheet.zonephoto")+": "+L(z.name)+", ":"")+im.author+" ("+im.license+")");band.append(cr);return band}

/* ───────── router ───────── */
const VIEWS={"":"story",racconto:"story",oggi:"today",mappa:"map",assaggi:"tastes"};
let current=null;
function viewFromHash(){let key=(location.hash||"").replace("#","");if(key.startsWith("oggi="))key="oggi";if(key.startsWith("mappa/"))key="mappa";return VIEWS[key]||"story"}
function route(){show(viewFromHash())}
const KEYOF={story:"racconto",today:"oggi",map:"mappa",tastes:"assaggi"};
/* pila di navigazione: ogni vista e ogni foglio aperto (scheda, Tasca, pagina grande, elenco della mappa sul telefono)
   ha una voce nella cronologia; "indietro" chiude prima il foglio in cima, poi torna alla vista precedente.
   Il numero di voci spinte coincide con layers.length; le chiusure da interfaccia fanno history.back() e
   il popstate che ne segue si salta (popSkip). Una spinta chiesta mentre un back è in volo aspetta quel popstate. */
const layers=[];let popSkip=0,popWait=[],popT=0;
function hist(fn){if(popSkip>0)popWait.push(fn);else{try{fn()}catch(e){}}}
function flushPop(){popSkip=0;clearTimeout(popT);const w=popWait.splice(0);w.forEach(f=>{try{f()}catch(e){}})}
App.pushLayer=function(id,close){if(layers.some(l=>l.id===id))return;layers.push({id,close});hist(()=>history.pushState({v:current,layer:id},"",location.hash||"#"+KEYOF[current||"story"]))};
App.dropLayer=function(id){const i=layers.findIndex(l=>l.id===id);if(i<0)return;layers.splice(i,1);popSkip++;clearTimeout(popT);popT=setTimeout(flushPop,1000);try{history.back()}catch(e){flushPop()}};
addEventListener("popstate",()=>{if(popSkip>0){popSkip--;if(!popSkip)flushPop();return}
  if(layers.length){const l=layers.pop();try{l.close()}catch(e){}return}
  route()});
function go(v){if(v===current){show(v);return}
  /* fogli aperti: si chiudono senza tornare indietro e la voce in cima diventa la nuova vista */
  const had=layers.length>0;if(had){const ls=layers.splice(0).reverse();ls.forEach(l=>{try{l.close()}catch(e){}})}
  const url="#"+KEYOF[v];hist(()=>had?history.replaceState({v},"",url):history.pushState({v},"",url));show(v)}
App.go=go;
function show(v){if(v===current)return;current=v;
  for(const s of ["story","today","map","tastes"])$("#v-"+s).hidden=s!==v;
  $$(".nav a").forEach(a=>{if(a.dataset.view===v)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
  App.closeSheet();if(v!=="story")scrollTo(0,0);
  if(v==="map")loadMap();if(v==="today")renderToday();if(v==="tastes")renderTastes();
  document.body.style.overflow=v==="map"?"hidden":"";document.dispatchEvent(new CustomEvent("view",{detail:v}))}
addEventListener("hashchange",route);
/* R1: la fascia di carta della barra in alto compare appena la pagina scorre più di 8 px (html[data-scrolled]) */
let scRaf=0;function onScrolled(){if(scRaf)return;scRaf=requestAnimationFrame(()=>{scRaf=0;const v=scrollY>8?"1":"0";if(document.documentElement.dataset.scrolled!==v)document.documentElement.dataset.scrolled=v})}
addEventListener("scroll",onScrolled,{passive:true});document.addEventListener("view",onScrolled);onScrolled();
$("#brand").onclick=()=>{go("story");scrollTo({top:0,behavior:REDUCED?"auto":"smooth"})};
$$(".nav a[data-view]").forEach(a=>a.addEventListener("click",ev=>{ev.preventDefault();go(a.dataset.view)}));
/* le due tende del colophon (#to-map, #to-today) le gestisce story.js (bindNoren): su telefono si aprono e dopo 230 ms si va alla vista */
/* MapLibre e map.js: un solo caricamento condiviso (precarico e apertura), tre nuovi tentativi (1 s, 3 s, 8 s);
   se falliscono tutti, nella vista mappa un cartello per riprovare a mano */
/* MapLibre 4.7.1 servito dal sito stesso (vendor/, con la sua licenza): niente CDN, va in cache con il service worker */
const ML_URL="vendor/maplibre-gl.min.js?v="+(window.SITE_V||"1"),MAP_WAITS=[1000,3000,8000];
let mapLoading=null;
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=()=>{s.remove();rej(new Error("script "+src))};document.head.append(s)})}
async function loadMapLib(){for(let i=0;;i++){try{if(!window.maplibregl)await loadScript(ML_URL);if(!App.initMap)await loadScript("map.js?v="+(window.SITE_V||"1"));return}
  catch(err){if(i>=MAP_WAITS.length)throw err;await new Promise(r=>setTimeout(r,MAP_WAITS[i]))}}}
function mapLib(){if(!mapLoading)mapLoading=loadMapLib().catch(err=>{mapLoading=null;throw err});return mapLoading}
function mapErr(on){const b=$("#map-err");if(b)b.hidden=!on}
function loadMap(){mapErr(false);return mapLib().then(()=>{if(current==="map")App.initMap()}).catch(err=>{console.info("mappa non disponibile",err&&err.message||"");if(current==="map")mapErr(true)})}
$("#map-retry").addEventListener("click",()=>loadMap());

/* ───────── clock ───────── */
function tick(){const d=now();$("#clock-t").textContent=fmtTime(d,TZ)+" "+(App.lang==="it"?"Tokyo":"Tokyo");
  $("#clock-l").textContent=t("time.tokyo");$("#clock").title=t("mode."+document.documentElement.dataset.mode)+(App.forceMode==null?"":" ("+t("mode.forced")+")");$("#clock").dataset.forced=App.forceMode==null?"0":"1"}
/* orologio: due stati. Il primo tocco forza il modo opposto a quello attivo, il secondo torna a seguire il sole */
$("#clock").addEventListener("click",()=>{App.forceMode=App.forceMode==null?(nightness()<.5?1:0):null;applyPalette();tick();if(current==="today")renderToday()});

/* ───────── TODAY ─────────
   Biglietto (+meteo a ore), Adesso, Da non mancare, La giornata, Potremmo, Il libro di oggi, Oracolo.
   Ogni blocco riceve il contesto del momento (ctx), costruito da un now() iniettabile. */
const TD={pos:null,off:0,offKey:"",posAsked:false,openTi:null,pastOpen:false,editPlan:null,headOpen:null};
/* la posizione concessa in Mappa ("Vicino a me") vale anche per Oggi */
App.setPos=ll=>{TD.pos={lat:ll.lat,lng:ll.lng}};
const WALK_KM=.08; // km al minuto a piedi, come nella mappa
const walkMin=k=>Math.max(1,Math.round(k/WALK_KM));
function dayIndex(date){return App.data.trip.days.findIndex(d=>d.date===date)}
function evMin(ev){const m=/^(\d{1,2}):(\d{2})/.exec(ev.time||"");return m?(+m[1])*60+(+m[2]):null}
function evPlace(ev,day){const T=App.data.trip,P=App.data.places;const b=ev.booking&&T.bookings.find(x=>x.id===ev.booking);if(b){const p=P.find(x=>x.id===b.place);if(p)return p}
  const txt=((ev.it||"")+" "+(ev.en||"")).toLowerCase();
  return P.find(p=>(!day||p.city===day.city)&&[p.name?.it,p.name?.en].some(n=>n&&n.length>=5&&txt.includes(n.toLowerCase())))||null}
function evLabel(ev,p){return p?L(p.name):L(ev).split(/\s·\s/)[0]}
function stayAt(date,day,mins){const st=App.data.trip.stays;if(date<st[0].from)return st[0];
  if(day&&day.cityAfter&&day.date===date&&!moved(day,mins)){const prev=st.find(s=>s.to===date);if(prev)return prev}
  return st.find(s=>s.from<=date&&date<s.to)||null}
function dayCtx(d=now()){const D=App.data,tp=tokyoParts(d),days=D.trip.days,idx=dayIndex(tp.date),before=tp.date<days[0].date,after=tp.date>days[days.length-1].date;
  const day=idx>=0?days[idx]:before?days[0]:days[days.length-1];const next=idx>=0?days[idx+1]:before?days[1]:null;
  const mins=tp.hh*60+tp.mm,city=before?day.city:dayCity(day,after?1440:mins);
  const stay=after?null:before?stayAt(days[0].date):stayAt(tp.date,day,mins);const base=stay&&baseOf(stay);
  return{d,tp,days,idx,before,after,day,next,stay,base,city,inTrip:idx>=0,mins}}
/* zona corrente: posizione → zona del posto più vicino; altrimenti zona della base della fase;
   se il giorno è in un'altra città (gita a Kyoto o Nara con base a Osaka) vale tutta la città del giorno */
// REVIEW: il piano dice "zona della base della fase"; nei giorni di gita (Kyoto, Nara) la base resta Osaka, qui uso la città del giorno
function nearestZone(lat,lng,city){let best=null,bk=1e9;for(const z of App.data.zones||[]){if(city&&z.city!==city)continue;const k=km(lat,lng,z.lat,z.lng);if(k<bk){bk=k;best=z}}return best}
function ctxZone(c,pos){if(pos){let best=null,bk=1e9;for(const p of App.data.places){const k=km(pos.lat,pos.lng,p.lat,p.lng);if(k<bk){bk=k;best=p}}
    const z=best&&(App.data.zones||[]).find(x=>x.id===best.zone);return{zone:z||null,city:best?best.city:c.city,lat:pos.lat,lng:pos.lng,here:true}}
  const b=c.base,city=c.city;
  if(b&&c.stay.city===city){const z=nearestZone(b.lat,b.lng,city);return{zone:z,city,lat:b.lat,lng:b.lng,home:true}}
  const [la,ln]=CITY_LL[city]||CITY_LL.tokyo;return{zone:null,city,lat:la,lng:ln}}
function bandOf(hh){return hh>=6&&hh<11?"morning":hh>=11&&hh<14?"lunch":hh>=14&&hh<17?"afternoon":hh>=17&&hh<21?"dinner":"night"}
function inBand(p,b){if(b==="morning")return p.cat==="see"||p.dish==="cafe"||p.dish==="sweets";
  if(b==="lunch")return p.cat==="eat"&&(p.tier==="cheap"||(p.price||1)<=2);if(b==="afternoon")return p.cat==="see"||p.cat==="shop";
  if(b==="dinner")return p.cat==="eat";return p.cat==="night"}
const INDOOR_ICON=["museum","market","game","shop","vintage","records","books","club","bar","izakaya","onsen"];
const indoor=p=>p.cat==="eat"||p.cat==="shop"||INDOOR_ICON.includes(p.icon)||p.dish==="market";
/* peso delle fonti nelle proposte: i "da scoprire" contano meno di noi e di Luca, più degli altri suggerimenti */
const SRC={noi:0,luca:1,sugg:2};const srcW=p=>p.source==="sugg"&&p.discover?1.5:SRC[p.source]??3;
function fixedToday(c){if(!c.inTrip)return new Set();return new Set(c.day.events.map(ev=>evPlace(ev,c.day)).filter(Boolean).map(p=>p.id))}
/* le proposte: fascia oraria, aperte adesso (orari ignoti ammessi), mai un posto già fisso oggi */
/* impegno prenotato nella fascia: evento con prenotazione o posto da mangiare prenotato, non ancora finito (2 h dopo l'inizio) */
const NEXT_BAND={morning:"lunch",lunch:"afternoon",afternoon:"dinner",dinner:"night",night:null};
function bookedIn(c,b){if(!c.inTrip)return null;for(const ev of c.day.events){const m=evMin(ev);if(m==null)continue;const p=evPlace(ev,c.day);
    if(!(ev.booking||(p&&p.booking==="booked"&&p.cat==="eat")))continue;if(bandOf(Math.floor(m/60))!==b||c.mins>m+120)continue;return{ev,p,name:evLabel(ev,p)}}return null}
/* prima del viaggio: la prima sera (3 nov, 19:30, vicino a casa), non l'ora di adesso */
const firstEvening=()=>new Date(App.data.trip.days[0].date+"T19:30:00+09:00");
function pickNext(date=now(),pos=TD.pos,opt={}){const c0=dayCtx(date),preview=c0.before;if(preview){date=firstEvening();pos=null}
  const c=preview?{...c0,d:date,mins:19*60+30}:c0,z=ctxZone(c,pos),fx=fixedToday(c),rain=preview?false:opt.rain??!!WX.rain;
  let b=preview?"dinner":bandOf(c.tp.hh),after=null;const bk=preview?null:bookedIn(c,b);if(bk&&NEXT_BAND[b]){b=NEXT_BAND[b];after=bk.name}
  // REVIEW: esclusi anche i posti prenotati per un altro giorno (es. Sushi Biyori il 7 nov): proporli come "potremmo" non ha senso
  const pids=planIds(c0),ok=p=>p.status!=="closed"&&!fx.has(p.id)&&!pids.has(p.id)&&p.booking!=="booked"&&inBand(p,b)&&App.isOpen(p,date)!==false;
  const dist=p=>km(z.lat,z.lng,p.lat,p.lng);
  const cmp=(x,y)=>(rain?(indoor(y)-indoor(x)):0)||(pos?0:srcW(x)-srcW(y))||((App.isOpen(y,date)===true)-(App.isOpen(x,date)===true))||(dist(x)-dist(y));
  const city=App.data.places.filter(p=>p.city===z.city&&ok(p));
  let list;if(pos){list=city.filter(p=>dist(p)<3).sort(cmp)}
  else if(z.zone){const inz=city.filter(p=>p.zone===z.zone.id).sort(cmp);list=inz.length>=6?inz:inz.concat(city.filter(p=>p.zone!==z.zone.id).sort((x,y)=>dist(x)-dist(y)).slice(0,9-inz.length))}
  else list=city.sort(cmp);
  return{band:b,zone:z,list,rain,after,preview,at:date}}
function walkText(p,z){if(!z.here&&!z.home)return null;const k=km(z.lat,z.lng,p.lat,p.lng);if(k>2.2)return null;return t(z.here?"now.walk":"now.walkHome").replace("{n}",walkMin(k))}
const DISH_WORD=["ramen","sushi","tonkatsu","gyukatsu","wagyu","yakiniku","yakitori","tempura","soba","onigiri","gyoza","okonomiyaki","takoyaki","kushikatsu","omurice","sando","izakaya","sake","whisky"];
function inText(m){if(m<60)return`${t("now.in")} ${m} ${t("min")}`;const hh=Math.floor(m/60),mm=m%60;return`${t("now.in")} ${hh} h${mm?" "+String(mm).padStart(2,"0"):""}`}
/* la riga di "Adesso": evento in corso, prossimo evento fisso, oppure la prima proposta */
function nowLine(date=now(),pos=TD.pos){const c=dayCtx(date);if(c.after)return null;
  if(c.before){const ev=c.day.events.find(e=>evMin(e)!=null);if(!ev)return null;const p=evPlace(ev,c.day);
    return{kind:"before",text:t("now.first")+": "+evLabel(ev,p),sub:fmtDT(c.day.date,ev.time),place:p}}
  const evs=c.day.events.map(ev=>({ev,m:evMin(ev),p:evPlace(ev,c.day)})).filter(x=>x.m!=null);
  const live=evs.filter(x=>x.m<=c.mins&&c.mins-x.m<120).pop(),fut=evs.find(x=>x.m>c.mins);
  const where=x=>{if(!x.p)return L(c.stay?.name||"").split(",")[0]||"";const z=ctxZone(c,pos);return walkText(x.p,z)||((App.data.zones||[]).find(q=>q.id===x.p.zone)?L((App.data.zones||[]).find(q=>q.id===x.p.zone).name).split(/ \(|,/)[0]:"")};
  const tn=trainNow(c,pos);if(tn&&!live&&!(fut&&fut.m-c.mins<=60))return tn;
  if(fut&&(!live||fut.m-c.mins<=60))return{kind:"event",text:`${evLabel(fut.ev,fut.p)} ${inText(fut.m-c.mins)}`,sub:fut.ev.time+(where(fut)?", "+where(fut):""),place:fut.p};
  if(live)return{kind:"live",text:evLabel(live.ev,live.p),sub:t("now.since")+" "+live.ev.time+(where(live)?", "+where(live):""),place:live.p};
  const nx=pickNext(date,pos),p=nx.list[0];if(!p)return{kind:"none",text:t("now.nothing"),sub:"",place:null};
  const z=nx.zone,wk=walkText(p,z),dish=p.cat==="eat"&&DISH_WORD.includes(p.dish)?p.dish:null;
  return{kind:"idea",text:`${t("now.could")}: ${L(p.name)}${dish?", "+dish:""}${wk?", "+walkMin(km(z.lat,z.lng,p.lat,p.lng))+" "+t("min"):""}`,sub:zoneName(p)+(wk?", "+(z.here?t("now.fromHere"):t("now.fromHome")):""),place:p}}
/* ultimo treno in "Adesso": dalle 23 fino all'orario del treno (anche dopo mezzanotte), poi "passato" fino alle 4; mai a meno di 800 m da casa */
function trainNow(c,pos){let cp=c,m=c.mins;if(c.tp.hh<4){cp=dayCtx(new Date(c.d.getTime()-(m+1)*6e4));m+=1440}else if(m<1380)return null;
  if(!cp.inTrip)return null;const tr=trainOpts(cp);if(!tr)return null;const b=baseOf(tr.st);if(pos&&b&&km(pos.lat,pos.lng,b.lat,b.lng)<=.8)return null;
  const o=pickTrain(tr.opts,pos),tm=trainMin(o);
  if(m<=tm)return{kind:"train",text:(tr.to?tn("train.to",tr.to):t("train.home"))+" "+inText(tm-m),sub:t("last.about")+" "+o.time+", "+o.line+(o.from?" "+t("last.from")+" "+o.from:""),place:null,opt:o};
  return m<1440+240?{kind:"train",gone:true,text:t("train.gone"),sub:t("train.goneSub"),place:null}:null}
const zoneName=p=>{const z=(App.data.zones||[]).find(q=>q.id===p.zone);return z?L(z.name).split(/ \(|,/)[0]:cityLabel(p.city)};
const cityLabel=c=>({tokyo:"Tokyo",osaka:"Osaka",kyoto:"Kyoto",nara:"Nara",kobe:"Kobe",uji:"Uji"})[c]||c||"";
App.todayDebug=()=>({pickNext,nowLine,trainNow,heads,diaryDate,bandOf,dayCtx,ctxZone,fixedToday,SH,WX,TD,buildDay,planList,approxTime,pickTrain});

/* ── biglietto ── */
function renderTicket(c){const D=App.data,d=c.d,day=c.day,s=sunToday(d);
  let headline;if(c.before){const dd=App.daysToLanding(d);headline=h("h1",{},`${t("today.before")} ${dd} ${t("hero.days")}`)}
  else if(c.after)headline=h("h1",{},t("today.after"));else headline=h("h1",{},`${t("today.day")} ${c.idx+1} ${t("today.of")} ${c.days.length}`);
  const when=fmtDate(day.date,{weekday:"long",day:"numeric",month:"long"});
  return h("div",{class:"ticket"},
    h("div",{class:"tk-k"},stack(day.kanji),h("p",{class:"kana"},h("span",{lang:"ja"},day.kana),h("span",{},day.romaji))),
    h("div",{class:"tk-main"},headline,h("p",{class:"city"},c.before?t("today.preview")+", "+when:cityLabel(c.city)+", "+when),
      day.meaning?h("p",{class:"tk-mean"},L(day.meaning)):null,
      h("div",{class:"clocks"},h("div",{},h("b",{},fmtTime(d,TZ)),h("span",{},t("today.tokyo"))),h("div",{},h("b",{},fmtTime(d,"Europe/Rome")),h("span",{},t("today.italy"))),h("div",{},h("b",{},fmtTime(s.set,TZ)),h("span",{},t("today.sunset"))),
        weatherEl(c)),wxHoursEl(c)))}
/* ── adesso ── */
function renderNow(c){const n=nowLine(c.d,TD.pos);if(!n)return null;
  const open=()=>{if(n.kind==="train"){TD.openTi="train";TD.pastOpen=true;refreshDay();const d=$("#ti-train-more"),li=$("#ti-train");if(d)d.open=true;if(li)li.scrollIntoView({behavior:REDUCED?"auto":"smooth",block:"center"});return}
    if(n.place)App.placeSheet(n.place,{showOnMap:true});else{const f=$("#day");if(f)f.scrollIntoView({behavior:REDUCED?"auto":"smooth",block:"start"})}};
  return h("button",{type:"button",class:"now now-"+n.kind,id:"now",onclick:open},
    h("span",{class:"eyebrow"},t(n.kind==="live"?"now.live":n.kind==="train"?"now.train":"now.title")),
    h("span",{class:"now-t"},n.place?App.iconEl(n.place,"now-i"):null,h("span",{},n.text)),
    n.sub?h("span",{class:"now-s"},n.sub):null)}
/* ── da non mancare: prenotazioni, trasferimenti non presi, check-out, timbro qui ── */
const Bt=(cls,fn,...k)=>h("button",{type:"button",class:cls,onclick:fn},...k),tn=(k,n)=>t(k).replace("{n}",n);
const addDays=(date,n)=>new Date(Date.parse(date+"T00:00:00Z")+n*864e5).toISOString().slice(0,10);
const dayDiff=(a,b)=>Math.round((Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/864e5);
const whenWord=n=>n===0?t("heads.today"):n===1?t("heads.tomorrow"):tn("heads.inDays",n);
function heads(c,pos=TD.pos){const T=App.data.trip,P=App.data.places,date=c.tp.date,out=[];if(c.after)return out;
  for(const pd of T.pending||[]){if(pd.status==="booked"||!pd.reminders)continue;
    for(const r of pd.reminders){const rd=typeof r==="string"?r.slice(0,10):r&&r.at?tokyoParts(new Date(r.at)).date:null;if(!rd)continue;const n=dayDiff(date,rd);if(n<0||n>3)continue;
      const p=P.find(x=>x.id===pd.place),nm=p?L(p.name):L(pd.label).split(" \u00b7 ")[0];
      out.push({k:"book",text:whenWord(n)+": "+t("heads.book").replace("{x}",nm),sub:(L(pd.note)||"").split(/(?<=\.)\s/)[0],key:"b-"+pd.id+rd});break}}
  for(const tr of T.transfers||[]){if(tr.booked!==false)continue;const n=dayDiff(date,tr.date);if(n<0||n>1)continue;const dd=T.days.find(x=>x.date===tr.date);
    // REVIEW: vale per ogni trasferimento booked:false, anche Haneda (treno senza biglietto da prendere) e N'EX
    const what=tr.line==="shinkansen"&&dd&&dd.cityAfter?"Shinkansen "+t("last.to")+" "+cityLabel(dd.cityAfter.city):L(tr.label);
    out.push({k:"move",text:t("heads.transfer").replace("{w}",n?t("heads.tomorrow"):t("heads.today")).replace("{x}",what),key:"t-"+tr.id})}
  const tom=addDays(date,1);if(c.mins>=1080)for(const s of T.stays)if(s.to===tom)out.push({k:"out",text:t("heads.checkout").replace("{t}",s.checkout||"10:00"),key:"o-"+s.id});
  const TSd=App.tastesDebug&&App.tastesDebug();if(pos&&TSd&&c.inTrip){const S=window.STAMPS||{},TS=TSd.TS;
    for(const z of TSd.stampZones()){if(!S[z.id]||!TSd.zoneIn(z,pos))continue;const mine=TS.local[z.id]||TS.trial[z.id]||TS.stamps.some(x=>x.zone===z.id&&((SH.uid&&x.uid===SH.uid)||(TS.me&&x.who===TS.me)));
      if(!mine){out.push({k:"stamp",text:t("heads.stamp").replace("{z}",L(z.name).split(/ \(|,| e | and /)[0]).replace(/^Sei a (?=[AEIOU])/,"Sei ad "),zone:z.id,key:"s-"+z.id});break}}}
  return out.slice(0,3)}
function renderHeads(c){const hs=heads(c).slice(0,2);if(!hs.length)return null;
  return h("section",{class:"heads",id:"heads"},h("span",{class:"eyebrow"},t("heads.title")),hs.map(x=>{const open=TD.headOpen===x.key;
    const txt=x.sub?h("button",{type:"button",class:"hd-t","aria-expanded":String(open),onclick:()=>{TD.headOpen=open?null:x.key;const el=$("#heads");if(el)el.replaceWith(renderHeads(dayCtx()))}},x.text):h("span",{class:"hd-t"},x.text);
    return h("div",{class:"hd"},h("span",{class:"hd-k","aria-hidden":"true"}),h("div",{class:"hd-m"},txt,open&&x.sub?h("p",{class:"ti-s"},x.sub):null),
      x.zone&&App.openStamp?Bt("inkline",()=>App.openStamp(x.zone),t("heads.stampGo")):null)}))}
/* ── il libro di oggi: 21-4 nei giorni di viaggio ── */
function diaryDate(d=now()){const tp=tokyoParts(d);if(tp.hh>=4&&tp.hh<21)return null;const date=tp.hh<4?tokyoParts(new Date(d.getTime()-5*36e5)).date:tp.date;return dayIndex(date)>=0?date:null}
function renderDiary(){const date=diaryDate();if(!date||!App.tastesOn)return null;const ts=App.tastesOn(date),st=App.stampsOn(date),n=ts.length,m=st.length;
  if(SH.state!=="none"&&!ts.ok&&(TD.diaryTry=(TD.diaryTry||0)+1)<8)setTimeout(()=>{const el=$("#diary");if(el&&current==="today"){const nn=renderDiary();if(nn)el.replaceWith(nn)}},700);
  const cnt=[n===1?t("diary.taste1"):tn("diary.tasteN",n),m===1?t("diary.stamp1"):tn("diary.stampN",m)].join(", ");
  const zs=[...new Set(st.map(x=>x.name))];
  return h("section",{class:"diary",id:"diary"},h("div",{class:"sec-h"},h("h2",{},t("diary.title")),n||m?h("span",{class:"eyebrow"},cnt):null),
    n?h("div",{class:"dy-row"},ts.slice(0,6).map((x,i)=>h("button",{type:"button",class:"dy-t",style:{"--r":i%2?"1deg":"-1.5deg"},"aria-label":x.x.placeName||t("diary.title"),onclick:x.open},x.thumb(),x.seal()))):null,
    m?Bt("dy-st",()=>App.openStamp&&App.openStamp(st[0].zone),zs.join(", ")):null,
    !n&&!m?h("p",{class:"dy-empty"},h("span",{},t("diary.empty")),ts.add?Bt("inkline",ts.add,t("tastes.new")):null):null)}
/* ── la giornata: linea del tempo (buildDay pura) ── */
const fmtM=m=>String(Math.floor(m/60)%24).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
const tMin=d=>{const p=tokyoParts(d);return p.hh*60+p.mm};
const MOVE_RE=/Shinkansen|Narita Express|N'EX|Haneda/i,TR_RE={nex:/Narita Express|N'EX/i,shinkansen:/Shinkansen/i};
/* nei giorni di gita (città del giorno diversa da quella di casa) le righe di trips, "per Osaka" invece di "per casa" */
function trainOpts(c){const LT=App.data.lasttrain;if(!LT||!c.inTrip||c.idx>=c.days.length-1)return null;const st=stayAt(c.tp.date,c.day,1440);if(!st)return null;
  const g=c.day.city!==st.city&&LT.trips?.[c.day.city+"-"+st.city],o=g||LT.bases?.[st.id];return o&&o.length?{st,opts:o,to:g?cityLabel(st.city):null}:null}
function pickTrain(opts,pos=TD.pos){if(!opts||!opts.length)return null;if(!pos)return opts[0];let b=null,bk=1e9;for(const o of opts){if(!o.ll)continue;const k=km(pos.lat,pos.lng,o.ll[0],o.ll[1]);if(k<bk){bk=k;b=o}}return b||opts[0]}
const trainMin=o=>{const m=hm(o.time);return m<240?m+1440:m};
const trainSub=o=>o.line+(o.from?" "+t("last.from")+" "+o.from:"")+" "+t("last.to")+" "+o.to;
const BAND_M={morning:600,lunch:750,afternoon:900,dinner:1170,night:1320},LUNCH_D=/^(noodle|ramen|tsukemen|soba|udon|onigiri|sando|cafe|sweets)$/;
/* ora indicativa (passo 13): da mangiare economico o veloce a pranzo 12:30, il resto a cena 19:30;
   pranzo già passato (dalle 14 di oggi) o giorno 1 visto prima del viaggio: cena */
function approxTime(p,c=dayCtx()){if(p.cat==="eat")return fmtM((p.tier==="cheap"||p.price<=2||LUNCH_D.test(p.dish||""))&&!c.before&&!(c.inTrip&&c.mins>=840)?750:1170);const ord=["morning","lunch","afternoon","dinner","night"];
  // REVIEW: per cat:"trip" nessuna fascia è adatta: 15:00 indicative
  const b=ord.find(x=>inBand(p,x))||"afternoon";return fmtM(BAND_M[b])}
function buildDay(c,plans=[],pos=TD.pos){if(c.after)return[];const day=c.day,date=day.date,today=c.inTrip,P=App.data.places,out=[];
  const txt=ev=>(ev.it||"")+" "+(ev.en||"");let prev=-1;
  const trs=(App.data.trip.transfers||[]).filter(x=>x.date===date),used=new Set();
  const evs=day.events.map((ev,i)=>{const m=evMin(ev),p=evPlace(ev,day),mv=MOVE_RE.test(txt(ev));if(m!=null)prev=m;
    return{kind:mv?"move":"fixed",min:m,sk:m!=null?m:prev+.01*(i+1),time:ev.time||"",label:L(ev),sub:"",place:p,booked:mv?null:!!ev.booking,key:"e"+i,ev}});
  for(const tr of trs){const re=TR_RE[tr.line]||/Haneda/i,hit=evs.filter(x=>x.kind==="move"&&re.test(txt(x.ev))).pop();
    if(hit){hit.label=L(tr.label);hit.sub=L(tr.note);hit.booked=tr.booked;used.add(tr.id)}}
  for(const x of evs){if(x.kind==="move"&&x.booked==null)x.booked=true;delete x.ev;out.push(x)}
  for(const tr of trs)if(!used.has(tr.id))out.push({kind:"move",min:null,sk:-1,time:"",label:L(tr.label),sub:L(tr.note),booked:tr.booked,key:"tr-"+tr.id});
  const all=day.events.map(txt).join(" ");
  for(const s of App.data.trip.stays){if(s.from===date&&!/check-?in/i.test(all)){const m=hm(s.checkin);out.push({kind:"home",min:m,sk:m??-1,time:s.checkin||"",label:t("day.checkin")+", "+L(s.name).split(",")[0],key:"in-"+s.id})}
    if(s.to===date&&!/check-?out/i.test(all)){const m=hm(s.checkout);out.push({kind:"home",min:m,sk:m??-1,time:s.checkout||"",label:t("day.checkout")+", "+L(s.name).split(",")[0],key:"out-"+s.id})}}
  for(const pl of plans){const p=P.find(x=>x.id===pl.place);if(!p)continue;const approx=!pl.time,tm=pl.time||approxTime(p,c),m=hm(tm);
    out.push({kind:"plan",min:m,sk:m,time:tm,approx,label:L(p.name),place:p,ids:pl.recs||[],own:pl,key:"p-"+p.id})}
  const set=today?sunToday(c.d).set:sunTimes(new Date(date+"T12:00:00+09:00"),...(CITY_LL[day.city]||CITY_LL.tokyo)).set,sm=tMin(set);
  out.push({kind:"sun",min:sm,sk:sm,time:fmtM(sm),label:t("today.sunset"),key:"sun"});
  const tr=today?trainOpts(c):null;if(tr){const o=pickTrain(tr.opts,pos),m=trainMin(o);
    out.push({kind:"train",min:m,sk:m,time:o.time,label:tr.to?tn("last.titleTo",tr.to):t("last.title"),sub:trainSub(o),opt:o,more:tr.opts.filter(x=>x!==o),key:"train"})}
  const DUR={fixed:120,plan:120};
  for(const x of out)x.past=today&&x.min!=null&&x.min+(DUR[x.kind]||0)<c.mins;
  if(today)out.push({kind:"now",min:c.mins,sk:c.mins+.5,time:fmtM(c.mins),key:"now"});
  out.sort((a,b)=>a.sk-b.sk);
  for(let i=out.length-1,nx=false;i>=0;i--){const x=out[i];if(x.kind==="now"){nx=false;continue}if(x.min!=null)nx=x.past;else x.past=today&&nx}
  /* spazi liberi ≥ 3 h, dalle 9 (o da adesso) alle 23; il tramonto non conta */
  const busy=out.filter(x=>x.min!=null&&/fixed|move|home|plan|train/.test(x.kind)),fut=out.filter(x=>!x.past&&x.kind!=="now").length;
  // REVIEW: un impegno (fixed/plan) occupa 2 h dopo l'inizio anche per gli spazi liberi, altrimenti dopo una cena alle 20 la linea direbbe "libero"; il primo giorno la linea parte dal primo evento con ora (l'atterraggio, passo 13)
  const e0=date===c.days[0].date?evs.find(x=>x.min!=null):null,S=Math.max(e0?e0.min:540,today?c.mins:0),E=1380,gaps=[];let b=S;
  for(const x of busy.slice().sort((a,b)=>a.min-b.min)){if(x.min>=E)break;if(x.min-b>=180)gaps.push({kind:"gap",min:b,sk:b+.6,label:t("day.freeUntil").replace("{t}",fmtM(x.min)),key:"gap"+b});b=Math.max(b,x.min+(DUR[x.kind]||0))}
  const free=!out.some(x=>/fixed|move|home|plan/.test(x.kind));
  if(E-b>=180)gaps.push({kind:"gap",min:b,sk:b+.6,label:free?t("day.free"):t("day.freeRest"),key:"gap"+b});
  if(fut<4||free)out.push(...gaps);
  out.sort((a,b)=>a.sk-b.sk);
  return out.map(({sk,...x})=>({place:null,sub:"",booked:false,past:false,ids:[],...x}))}
/* posti decisi: doc plan on:true o ≥ 2 "Ci sto"; senza condivisione plan-local */
const planLocalOn=()=>SH.state!=="on"||SH.ro||SH.can===false;
function planStore(){try{return JSON.parse(localStorage.getItem("plan-local")||"{}")||{}}catch(e){return{}}}
function planList(date){if(planLocalOn()){const o=planStore()[date]||{};return Object.entries(o).filter(([,v])=>v&&v.on).map(([place,v])=>({place,time:v.time||"",recs:[],local:true}))}
  if(date!==SH.date)return[];const m=new Map();
  for(const d of SH.plan)if(d&&d.date===date&&d.on)m.set(d.place,{place:d.place,time:d.time||"",doc:d,recs:d.uid?[{uid:d.uid,who:d.who}]:[]});
  const byPlace={};for(const r of SH.rsvp)if(r&&r.on&&r.uid&&r.place!=="meet")(byPlace[r.place]=byPlace[r.place]||[]).push(r);
  for(const[pl,rs]of Object.entries(byPlace)){const e=m.get(pl);if(e){for(const r of rs)if(!e.recs.some(x=>x.uid===r.uid))e.recs.push(r)}else if(rs.length>=2)m.set(pl,{place:pl,time:"",recs:rs.slice(),joins:true})}
  return[...m.values()]}
const lineDate=c=>c.before?c.days[0].date:c.tp.date;
const planIds=c=>new Set(c.after?[]:planList(lineDate(c)).map(x=>x.place));
function planSave(date,place,time,on){if(planLocalOn()){const s=planStore();s[date]=s[date]||{};if(on)s[date][place]={time:time||"",on:true};else delete s[date][place];
    try{localStorage.setItem("plan-local",JSON.stringify(s))}catch(e){}TD.editPlan=null;refreshDay();return Promise.resolve(true)}
  if(!canJoin())return Promise.resolve(false);const me=App.whoMe?App.whoMe():null;
  if(!me&&App.openWho){App.openWho(()=>{App.closeSheet();planSave(date,place,time,on)});return Promise.resolve(false)}
  const rec={date,place,time:time||"",on,uid:SH.uid,who:me,at:Date.now()};TD.editPlan=null;
  return shWrite(()=>SH.db.collection("plan").doc(`${date}_${place}`).set(rec)).then(ok=>{refreshDay();return ok})}
function planDrop(date,pl){if(planLocalOn()||pl.doc)return planSave(date,pl.place,pl.time,false);
  if(whoFor(pl.place).includes(SH.uid))return toggleJoin(pl.place)}
const planCanDrop=pl=>planLocalOn()||(canJoin()&&(!!pl.doc||whoFor(pl.place).includes(SH.uid)));
function refreshDay(){if(current!=="today")return;const el=$("#day");if(el){const c=dayCtx();const n=renderDay(c);if(n)el.replaceWith(n);else el.remove()}const nx=$("#next");if(nx)nx.replaceWith(renderNext(dayCtx()))}
function planTimeEdit(date,pl,x){const ti=h("input",{type:"time",value:pl.time||"","aria-label":t("plan.time")});
  return h("span",{class:"pl-edit"},ti,Bt("inkline",()=>planSave(date,pl.place,ti.value,true),t("plan.done")),
    planCanDrop(pl)?Bt("inkline",()=>planDrop(date,pl),t("plan.remove")):null)}
function renderDay(c){if(c.after)return null;const date=lineDate(c),items=buildDay(c,planList(date));
  const next=items.find(x=>!x.past&&!/now|gap|sun/.test(x.kind)),editable=planLocalOn()||canWrite();
  const past=items.filter(x=>x.past),np=past.length,collapse=np>0&&!TD.pastOpen;
  const li=x=>{const open=x===next||TD.openTi===x.key,cls="ti ti-"+x.kind+(x.past?" past":"")+(x.booked&&x.kind==="fixed"?" booked":"")+(x.approx?" approx":"")+(open?" open":"");
    if(x.kind==="now")return h("li",{class:"ti now-mark","aria-label":t("now.title")+" "+x.time},h("span",{class:"t"},x.time),h("span",{class:"mk"}),h("span",{class:"bar"}));
    if(x.kind==="gap")return h("li",{class:cls},h("span",{class:"t"}),h("span",{class:"mk"}),h("div",{class:"tx"},h("span",{class:"gl"},x.label),
      h("button",{type:"button",class:"inkline",onclick:()=>{const n=$("#next");if(n)n.scrollIntoView({behavior:REDUCED?"auto":"smooth",block:"start"})}},t("day.ideas"))));
    const tm=x.kind==="plan"&&editable&&!x.past?h("button",{type:"button",class:"t tb","aria-label":t("plan.time")+" "+x.label,onclick:()=>{TD.editPlan=TD.editPlan===x.place.id?null:x.place.id;refreshDay()}},(x.approx?"~":"")+x.time):h("span",{class:"t"},x.time?(x.kind==="train"?t("last.about")+" ":"")+(x.approx?"~":"")+x.time:"—");
    const mk=h("span",{class:"mk"});
    let name;if(x.place)name=h("button",{class:"ev-place",type:"button",onclick:()=>App.placeSheet(x.place,{showOnMap:true})},h("span",{},x.label),x.kind==="fixed"?App.iconEl(x.place):null);
    else name=h("button",{type:"button",class:"ti-n","aria-expanded":String(open),onclick:()=>{TD.openTi=TD.openTi===x.key?null:x.key;refreshDay()}},x.label);
    if(x.kind==="sun")name=h("span",{class:"ti-n"},x.label);
    const cnt=x.kind==="train"&&!x.past&&c.inTrip&&x.min-c.mins<120&&x.min>c.mins?h("span",{class:"ti-in"},inText(x.min-c.mins)):null;
    const sub=open&&(x.sub||x.kind==="move"&&x.booked===false)?h("p",{class:"ti-s"},x.sub||null,x.kind==="move"&&x.booked===false?h("span",{class:"badge shu-l"},t("day.toBook")):null):null;
    const more=x.kind==="train"&&open?h("details",{class:"ti-more",id:"ti-train-more"},h("summary",{},x.more.length?(x.more.length===1?t("day.moreLine1"):tn("day.moreLines",x.more.length)):t("last.about")+"…"),
      x.more.map(o=>h("p",{class:"lt"},h("b",{},t("last.about")+" "+o.time),h("span",{},trainSub(o)))),h("p",{class:"lt-note"},t("last.check"))):null;
    const ed=x.kind==="plan"&&TD.editPlan===x.place.id&&editable?planTimeEdit(date,x.own,x):null;
    return h("li",{class:cls,id:x.kind==="train"?"ti-train":null},x.past&&/fixed|plan/.test(x.kind)?h("span",{class:"done",lang:"ja","aria-hidden":"true"},"済"):null,tm,mk,
      h("div",{class:"tx"},h("span",{class:"ti-l"},name,x.kind==="plan"?initialsEl(x.ids):null,cnt),sub,more,ed))};
  const rows=[];let folded=false;
  for(const x of items){if(collapse&&x.past){if(!folded){folded=true;rows.push(h("li",{class:"ti ti-fold"},h("span",{class:"t"}),h("span",{class:"mk"}),
    Bt("inkline",()=>{TD.pastOpen=true;refreshDay()},np===1?t("day.done1"):tn("day.doneN",np))))}continue}rows.push(li(x))}
  const nx=c.next,tm=nx?(nx.events.length?nx.events.map(ev=>(ev.time?ev.time+" ":"")+evLabel(ev,evPlace(ev,nx))).join(", "):t("fixed.free")):null;
  return h("section",{class:"day",id:"day"},h("div",{class:"sec-h"},h("h2",{},c.before?t("today.preview"):t("day.title")),h("span",{class:"eyebrow"},fmtDate(c.day.date,{day:"numeric",month:"short"})),dayMapLink(c,items)),
    h("ol",{class:"tl"},rows),
    tm?h("p",{class:"tomorrow"},h("b",{},t(c.before?"fixed.dayAfter":"fixed.tomorrow")+": "),h("span",{},tm)):null)}
function dayMapLink(c,items){if(!c.inTrip||!items.some(x=>x.place))return null;
  return Bt("inkline day-map",()=>{location.hash="#mappa/oggi"},h("span",{class:"gi","aria-hidden":"true",html:(window.ICONS||{}).arrow||""}),t("day.map"))}
App.todayPlan=function(){const c=dayCtx();if(!c.inTrip)return[];
  return buildDay(c,planList(c.tp.date)).filter(x=>!/now|gap|sun/.test(x.kind)).map(x=>({place:x.place?x.place.id:null,time:x.time,kind:x.kind,approx:!!x.approx,min:x.min,ago:x.min==null?null:c.mins-x.min}))};
/* scheda del posto: "Mettilo in oggi" o "In programma oggi, 19:30" + "Togli" */
App.planRow=function(p){const c=dayCtx();if(!c.inTrip||p.cat==="trip")return null;const date=lineDate(c),box=h("div",{class:"plan-row"});
  const later=()=>setTimeout(draw,200);
  function draw(){const pl=planList(date).find(x=>x.place===p.id),can=planLocalOn()||canJoin();
    if(pl){const tm=pl.time||"~"+approxTime(p,c);box.replaceChildren(h("span",{class:"pr-l"},t("plan.inToday")+", "+tm),
      planCanDrop(pl)?h("button",{type:"button",class:"inkline",onclick:()=>Promise.resolve(planDrop(date,pl)).then(later)},t("plan.remove")):null);return}
    if(!can){box.replaceChildren();return}
    box.replaceChildren(h("button",{type:"button",class:"inkline",onclick:()=>{const ti=h("input",{type:"time","aria-label":t("plan.time")});
      box.replaceChildren(ti,h("button",{type:"button",class:"inkline",onclick:()=>planSave(date,p.id,ti.value,true).then(later)},t("plan.put")));ti.focus()}},t("plan.add")))}
  draw();return box};
/* ── dopo: tre proposte, "altre tre", "sorprendimi", "chi viene" ── */
function badgesFor(p,z,pos,d,preview){const b=[],B=(txt,cls="")=>h("span",{class:"badge"+(cls?" "+cls:"")},txt);
  if(p.source==="noi")b.push(B(t("source.noi")));else if(p.source==="luca")b.push(B(t("badge.luca")));
  if(p.discover)b.push(B(t("badge.discover"),"disc"));if(p.chain)b.push(B(t("badge.chain"),"chain"));
  if(!preview&&App.isOpen(p,d)===true)b.push(B(t("badge.openNow"),"open"));
  const k=km(z.lat,z.lng,p.lat,p.lng);if((z.here||z.home)&&k<=2.2)b.push(B((z.here?t("badge.near")+", ":"")+t("badge.walk").replace("{n}",walkMin(k)),z.here?"near":""));
  return b}
function rowFor(p,z,pos,d,preview){const zn=(App.data.zones||[]).find(x=>x.id===p.zone);const k=p.cat==="eat"?p.dish:p.icon;const I=window.ICONS||{};
  return h("div",{class:"nrow"},
    h("button",{type:"button",class:"row","data-id":p.id,onclick:()=>App.placeSheet(p,{showOnMap:true})},
      h("span",{class:"r1"},h("span",{class:"gi","aria-hidden":"true",html:I[k]||App.icon(p)||I.view||""}),h("b",{},L(p.name)),h("span",{class:"zn"},zn?(L(zn.name)||"").split(/ \(|,| and | e /)[0]:cityLabel(p.city)),h("span",{class:"yen"},"¥".repeat(p.price||1))),
      h("span",{class:"badges"},badgesFor(p,z,pos,d,preview)),
      h("span",{class:"what"},L(p.what))),
    rsvpEl(p.id,"next"))}
function renderNext(c){const nx=pickNext(c.d,TD.pos),key=nx.band+(nx.zone.zone?.id||nx.zone.city)+nx.list.length;if(key!==TD.offKey){TD.offKey=key;TD.off=0}
  const n=nx.list.length,three=n<=3?nx.list:[0,1,2].map(i=>nx.list[(TD.off+i)%n]);
  const where=nx.zone.zone?L(nx.zone.zone.name).split(/ \(|,/)[0]:cityLabel(nx.zone.city);
  const more=n>3?h("button",{type:"button",class:"inkline",onclick:()=>{TD.off=(TD.off+3)%n;const el=$("#next");if(el)el.replaceWith(renderNext(dayCtx()))}},h("span",{class:"k",lang:"ja"},"次"),t("next.more")):null;
  const surprise=h("button",{type:"button",class:"inkline",onclick:()=>{const p=surprisePick(c);if(p)App.placeSheet(p,{showOnMap:true})}},h("span",{class:"k",lang:"ja"},"運"),t("today.surprise"));
  return h("div",{class:"next",id:"next"},
    h("div",{class:"sec-h"},h("h2",{},nx.preview?t("next.titleFirst"):nx.after?t("next.after").replace("{x}",nx.after).replace("{b}",t("next.what."+nx.band)):t("next.title")),h("span",{class:"eyebrow"},t("next.band."+nx.band)+", "+where+(nx.rain?", "+t("weather.rain").toLowerCase():""))),
    n?h("div",{class:"rows"},three.map(p=>rowFor(p,nx.zone,nx.preview?null:TD.pos,nx.at,nx.preview))):h("p",{class:"empty"},t("next.empty")),
    h("div",{class:"next-act"},more,surprise))}
/* sorprendimi: entro 15 minuti a piedi dalla posizione, altrimenti nella zona corrente; qualsiasi categoria aperta */
function surprisePick(c){const z=ctxZone(c,TD.pos),fx=fixedToday(c),pids=planIds(c);
  const pool=App.data.places.filter(p=>p.status!=="closed"&&!fx.has(p.id)&&!pids.has(p.id)&&p.booking!=="booked"&&p.cat!=="trip"&&App.isOpen(p,c.d)!==false&&
    (TD.pos?km(z.lat,z.lng,p.lat,p.lng)<=15*WALK_KM:z.zone?p.zone===z.zone.id:p.city===z.city));
  return pool.length?pool[Math.floor(Math.random()*pool.length)]:null}
/* ── condivisione: ritrovo e "ci sto" (db + user, entrambi facoltativi) ── */
const SH={state:"off",db:null,user:null,uid:null,can:null,ro:false,date:null,rsvp:[],rsvpOk:false,plan:[],planOk:false,unsub:[],names:{},editing:false,err:""};
async function shareInit(){if(SH.state!=="off")return;SH.state="loading";
  const C=window.claude;if(!C||typeof C.use!=="function"){SH.state="none";document.dispatchEvent(new Event("shareready"));return}
  try{const [db,user]=await Promise.all([C.use("db").catch(()=>null),C.use("user").catch(()=>null)]);
    SH.db=db;SH.user=user;if(!db){SH.state="none";renderShared();return}
    if(user){try{SH.uid=await user.id()}catch(e){SH.uid=null}try{SH.can=await user.can("data.write")}catch(e){SH.can=null}}
    SH.state="on";shareWatch();renderShared()}catch(e){SH.state="none"}
  finally{document.dispatchEvent(new Event("shareready"))}}
/* una sola sottoscrizione per il ritrovo di oggi e una per le adesioni di oggi; si rifanno solo quando cambia la data */
/* prima del viaggio le adesioni valgono per il giorno 1 (la prima sera), dopo il viaggio non ce ne sono */
function rsvpDate(){try{const c=dayCtx();return c.before?c.days[0].date:c.tp.date}catch(e){return tokyoParts(now()).date}}
function shareWatch(){if(SH.state!=="on")return;const date=rsvpDate();if(SH.date===date)return;
  SH.unsub.forEach(f=>{try{f()}catch(e){}});SH.unsub=[];SH.date=date;SH.rsvp=[];SH.rsvpOk=false;SH.plan=[];SH.planOk=false;
  try{SH.unsub.push(SH.db.collection("rsvp").where("date","==",date).onSnapshot(s=>{SH.rsvpOk=true;SH.rsvp=s.docs.map(x=>x.data());renderShared()},()=>{SH.rsvpOk=false;renderShared()}))}catch(e){}
  try{SH.unsub.push(SH.db.collection("plan").where("date","==",date).onSnapshot(s=>{SH.planOk=true;SH.plan=s.docs.map(x=>x.data());renderShared()},()=>{SH.planOk=false;renderShared()}))}catch(e){}}
const canWrite=()=>SH.state==="on"&&SH.can!==false&&!SH.ro;
const canJoin=()=>canWrite()&&!!SH.uid;
/* Assaggi (tastes.js) riusa la stessa condivisione */
App.SH=SH;App.canWrite=canWrite;App.shareInit=shareInit;
const joinedFor=place=>SH.rsvp.filter(r=>r&&r.place===place&&r.on&&r.uid);
const whoFor=place=>joinedFor(place).map(r=>r.uid);
App.shWrite=(fn)=>shWrite(fn);
async function shWrite(fn,again=true){try{await fn();SH.err="";return true}catch(e){const code=e&&e.code;
  if(again&&(code==="unavailable"||code==="resource_exhausted")){await new Promise(r=>setTimeout(r,400+Math.random()*600));return shWrite(fn,false)}
  if(code==="invalid_argument"||code==="not_granted"||code==="capability_disabled"||code==="capability_removed"||code==="revoked")SH.ro=true;else SH.err=t("meet.error");
  renderShared();return false}}
/* chi non ha ancora scelto il nome (people/<uid> vuoto) passa prima dal "Chi sei?" di Assaggi, poi l'adesione si completa */
function toggleJoin(place){if(!canJoin())return;
  const me=App.whoMe?App.whoMe():null;if(!me&&App.openWho){App.openWho(()=>{App.closeSheet();toggleJoin(place)});return}
  const date=SH.date,on=!whoFor(place).includes(SH.uid),rec={date,place,uid:SH.uid,on,at:Date.now()};if(me)rec.who=me;
  return shWrite(()=>SH.db.collection("rsvp").doc(`${date}_${place}_${SH.uid}`).set(rec))}
/* iniziali: nomi risolti al momento, mai salvati */
// REVIEW: piano D, si ridisegna sempre dopo profiles(): con due render ravvicinati il primo aggiornava SH.names e il secondo riquadro (quello visibile) restava a "?" (vedi Problemi)
/* il nome viene dal "Chi sei?" (campo who dell'adesione, o il proprio scelto), altrimenti dal profilo; senza nome nessuna iniziale, mai "?" */
function initialsEl(recs){const box=h("span",{class:"ini"});const me=App.whoMe?App.whoMe():null,pn=id=>App.personName?App.personName(id):"";
  const nameOf=r=>pn(r.who)||(r.uid===SH.uid&&me?pn(me):"")||SH.names[r.uid]||"";
  const draw=()=>box.replaceChildren(...recs.map(r=>{const nm=nameOf(r);return nm?h("span",{class:"in",title:nm},nm[0].toUpperCase()):null}).filter(Boolean));draw();
  const need=recs.filter(r=>!pn(r.who)&&!(r.uid===SH.uid&&me)).map(r=>r.uid);
  if(need.length&&SH.user&&typeof SH.user.profiles==="function"){SH.user.profiles(need).then(ps=>{for(const id of need)SH.names[id]=ps?.[id]?.name||"";draw()}).catch(()=>{})}
  return box}
function rsvpEl(place,kind){const box=h("div",{class:"who-row","data-rsvp":place,"data-kind":kind});fillRsvp(box);return box}
function fillRsvp(box){const place=box.dataset.rsvp,kind=box.dataset.kind,c=dayCtx();
  if(SH.state!=="on"||!SH.rsvpOk||c.after){box.hidden=true;box.replaceChildren();return}
  const recs=joinedFor(place),ids=recs.map(r=>r.uid),mine=!!SH.uid&&ids.includes(SH.uid);
  if(!ids.length&&!canJoin()){box.hidden=true;box.replaceChildren();return}
  box.hidden=false;
  box.replaceChildren(...[h("span",{class:"who-l"},t(kind==="meet"?"meet.who":"next.who")),initialsEl(recs),
    canJoin()?h("button",{type:"button",class:"join","aria-pressed":String(mine),onclick:()=>toggleJoin(place)},t(kind==="meet"?"meet.arrive":"next.join")):null].filter(Boolean))}
/* aggiornamento leggero dopo uno snapshot: solo ritrovo e righe "chi viene", mai un render completo, mai una scrittura */
function renderShared(){if(current!=="today")return;$$("#today .who-row").forEach(fillRsvp);
  /* i "Ci sto" e i posti decisi entrano nella linea: si ridisegna solo la giornata, mai mentre si scrive un'ora */
  if(!TD.editPlan){const el=$("#day");if(el){const n=renderDay(dayCtx());if(n)el.replaceWith(n)}}}

/* ── meteo (open-meteo, cache 1 h, silenzioso se la rete manca) ── */
const WX={key:null,data:null,rain:false,busy:false,logged:false};
function wxKind(code){if(code==null)return null;if(code<=1)return"sun";if(code<=48)return"cloud";if((code>=71&&code<=77)||code===85||code===86)return"snow";return"rain"}
// REVIEW: prima del viaggio il meteo non si mostra (sarebbe il meteo di oggi a Tokyo accanto alla data del 3 novembre)
function weatherEl(c){const b=c.base;if(!b||c.before)return null;const key=b.id+"-"+c.tp.date+"-"+c.tp.hh;loadWeather(b,key);
  const w=WX.key===key?WX.data:null;if(!w)return h("div",{class:"wx",id:"wx",hidden:true});
  /* cielo sereno dopo il tramonto (o prima dell'alba): la luna al posto del sole */
  const k=wxKind(w.code),I=window.ICONS||{},st=sunToday(c.d),dark=c.d<st.rise||c.d>st.set,icon=k==="sun"?(dark&&I.moon?I.moon:I.sun):k==="rain"||k==="snow"?I.rain:I.cloud;
  const word=t("weather."+k)+(w.pop!=null&&w.pop>=30?" "+w.pop+"%":"");
  const um=wxCells(c,w).some(x=>x.ahead<=12&&x.pop!=null&&x.pop>=50);
  return h("div",{class:"wx",id:"wx"},h("b",{},h("span",{class:"wx-i","aria-hidden":"true",html:icon||""}),Math.round(w.max)+"°/"+Math.round(w.min)+"°"),h("span",{},word),um?h("span",{class:"badge shu-l"},t("weather.umbrella")):null)}
/* sei caselle a passo di 3 h dalle prossime ore piene multiple di 3 (alle 10:20: 12, 15, 18, 21, 24, 03) */
function wxCells(c,w){const hs=w&&w.hours;if(!hs||!hs.length)return[];const out=[],st=sunToday(c.d),sr=tMin(st.rise),ss=tMin(st.set);let hh=(Math.floor(c.tp.hh/3)+1)*3;
  for(let i=0;i<6;i++,hh+=3){const x=hs[hh];if(!x||x.code==null||x.temp==null)break;const m=hh%24*60,dark=m<sr||m>ss;out.push({hh,label:hh===24?"24":String(hh%24).padStart(2,"0"),ahead:hh-c.tp.hh-c.tp.mm/60,code:x.code,temp:x.temp,pop:x.pop,dark})}return out}
function wxHoursEl(c){const b=c.base;if(!b||c.before)return null;const key=b.id+"-"+c.tp.date+"-"+c.tp.hh,w=WX.key===key?WX.data:null,cells=wxCells(c,w);
  if(cells.length<6)return h("div",{class:"wx-hours",id:"wx-hours",hidden:true});const I=window.ICONS||{};
  return h("div",{class:"wx-hours",id:"wx-hours"},cells.map(x=>{const k=wxKind(x.code),ic=k==="sun"?(x.dark&&I.moon?I.moon:I.sun):k==="rain"||k==="snow"?I.rain:I.cloud;
    return h("div",{class:"wh","aria-label":x.label+", "+Math.round(x.temp)+"°, "+t("weather."+k)+(x.pop!=null?" "+x.pop+"%":"")},h("span",{class:"wh-h"},x.label),h("span",{class:"wh-i","aria-hidden":"true",html:ic||""}),h("b",{},Math.round(x.temp)+"°"))}))}
function loadWeather(b,key){if(WX.key===key&&WX.data)return;if(WX.busy===key)return;
  const sk="wx-"+b.id;let cached=null;try{cached=JSON.parse(localStorage.getItem(sk)||"null")}catch(e){}
  if(cached&&cached.key===key&&Date.now()-cached.at<36e5){setWeather(key,cached.data,false);return}
  WX.busy=key;const url=`https://api.open-meteo.com/v1/forecast?latitude=${b.lat.toFixed(3)}&longitude=${b.lng.toFixed(3)}&hourly=weather_code,temperature_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=2`;
  const ac=typeof AbortController!=="undefined"?new AbortController():null;const to=setTimeout(()=>{try{ac&&ac.abort()}catch(e){}},8000);
  fetch(url,ac?{signal:ac.signal}:{}).then(r=>r.ok?r.json():Promise.reject(new Error("http "+r.status))).then(j=>{const dd=j&&j.daily;if(!dd)throw new Error("no daily");
      const hr=j.hourly,hours=hr&&Array.isArray(hr.time)?hr.time.map((x,i)=>({code:hr.weather_code?.[i],temp:hr.temperature_2m?.[i],pop:hr.precipitation_probability?.[i]??null})):[];
      const data={code:dd.weather_code?.[0],max:dd.temperature_2m_max?.[0],min:dd.temperature_2m_min?.[0],pop:dd.precipitation_probability_max?.[0]??null,hours:hours.length>=24?hours:null};
      if(data.code==null||data.max==null)throw new Error("empty");try{localStorage.setItem(sk,JSON.stringify({key,at:Date.now(),data}))}catch(e){}setWeather(key,data,true)})
    .catch(err=>{if(!WX.logged){WX.logged=true;console.info("meteo non disponibile",err&&err.message||"")}})
    .finally(()=>{clearTimeout(to);if(WX.busy===key)WX.busy=false})}
/* pioggia per le proposte al coperto: una delle prossime 6 ore con probabilità ≥ 50, o il massimo del giorno se mancano le ore */
function setWeather(key,data,live){const wasRain=WX.rain,hh=tokyoParts(now()).hh;WX.key=key;WX.data=data;
  WX.rain=data.hours?data.hours.slice(hh+1,hh+7).some(x=>x.pop!=null&&x.pop>=50):data.pop!=null&&data.pop>=50;
  if(!live||current!=="today")return;const c=dayCtx(),el=$("#wx"),w=weatherEl(c);if(el&&w)el.replaceWith(w);const eh=$("#wx-hours"),wh=wxHoursEl(c);if(eh&&wh)eh.replaceWith(wh);if(WX.rain!==wasRain){const n=$("#next");if(n)n.replaceWith(renderNext(c))}}

/* ── posizione: solo se il permesso è già concesso (nessuna richiesta da qui) ── */
function askPos(){if(TD.posAsked)return;TD.posAsked=true;try{const P=navigator.permissions;if(!P||!navigator.geolocation)return;
  P.query({name:"geolocation"}).then(s=>{if(s.state!=="granted")return;navigator.geolocation.getCurrentPosition(g=>{TD.pos={lat:g.coords.latitude,lng:g.coords.longitude};if(current==="today")renderToday()},()=>{},{maximumAge:3e5,timeout:8000})}).catch(()=>{})}catch(e){}}

function renderToday(){const box=$("#today"),c=dayCtx(now());shareWatch();
  box.replaceChildren(...[
    renderTicket(c),
    renderNow(c),
    renderHeads(c),
    renderDay(c),
    renderNext(c),
    renderDiary(),
    App.omikujiEl?App.omikujiEl(c.day):null,
    renderPreview()].filter(Boolean));
  shareInit();askPos()}
function renderPreview(){const v=FAKE?FAKE.v:"";const d=h("input",{type:"date",value:v.slice(0,10)}),tm=h("input",{type:"time",value:v.slice(11,16)||"12:00"});
  return h("details",{class:"preview-box",open:!!FAKE},h("summary",{},t("preview.title")),h("div",{class:"preview-row"},d,tm,
    h("button",{type:"button",class:"inkline",onclick:()=>{if(d.value)setFake(d.value+"T"+(tm.value||"12:00"))}},t("preview.go")),
    FAKE?h("button",{type:"button",class:"inkline",onclick:()=>setFake(null)},t("preview.off")):null),
    h("p",{class:"preview-note"},t("preview.note")))}

/* ───────── TASTES: il libro degli assaggi sta in tastes.js ───────── */
function renderTastes(){if(App.renderTastes)App.renderTastes();else $("#tastes").replaceChildren(h("h1",{},t("tastes.title")))}

/* ───────── YEN pocket ───────── */
function reelEl(){return h("span",{class:"reel"},h("span",{},..."0123456789".split("").map(d=>h("span",{},d))))}
function rollSet(el,str){const ch=[...str],sig=ch.map(c=>/\d/.test(c)?"d":c).join("");
  if(el.dataset.sig!==sig){el.replaceChildren(...ch.map(c=>/\d/.test(c)?reelEl():h("span",{class:"rch"},c)));el.dataset.sig=sig;void el.offsetWidth}
  const kids=[...el.children],n=kids.length;
  kids.forEach((k,i)=>{if(!k.classList.contains("reel"))return;const s=k.firstChild;s.style.transitionDelay=(n-1-i)*30+"ms";s.style.transform=`translateY(${-(+ch[i])*10}%)`});
  el.nextSibling.textContent=str}
function openYen(){const RATES={eur:App.data.i18n.rate.jpyPerEur,gbp:App.data.i18n.rate.jpyPerGbp||0};let cur="eur",val="1000",dir="jpy";const loc=()=>App.lang==="it"?"it-IT":"en-GB";
  const R=()=>RATES[cur],SYM=()=>cur==="eur"?"€":"£";
  const line=()=>{const r=h("span",{class:"roll","aria-hidden":"true"});return[r,h("span",{class:"sr"})]};
  const [inR,inS]=line(),[outR,outS]=line();
  const disp=h("div",{class:"conv-display","aria-live":"polite"},h("span",{class:"big"},inR,inS),h("span",{class:"eur"},h("span",{class:"eq"},"="),h("span",{},outR,outS)),
    h("small",{class:"rate-note"}));
  function draw(){const n=parseFloat(val||"0");const out=dir==="jpy"?n/R():n*R();
    disp.querySelector(".rate-note").textContent=`${t("yen.rate")}: ${SYM()}1 = ¥${R()}. ${t("yen.rateNote")}`;
    rollSet(inR,(dir==="jpy"?"¥":SYM())+Number(val||0).toLocaleString(loc()));
    rollSet(outR,dir==="jpy"?SYM()+out.toLocaleString(loc(),{minimumFractionDigits:2,maximumFractionDigits:2}):"¥"+Math.round(out).toLocaleString(loc()))}
  const key=k=>{if(k==="⌫")val=val.slice(0,-1);else if(k==="C")val="";else if(val.length<9)val=(val==="0"?"":val)+k;draw()};
  const pad=h("div",{class:"keypad"},["1","2","3","4","5","6","7","8","9","C","0","⌫"].map(k=>h("button",{type:"button",onclick:()=>key(k)},k)));
  draw();
  const node=h("div",{class:"sh-body pocket"},h("div",{class:"sh-title"},h("h2",{id:"sheet-title"},t("yen.title")),h("div",{class:"ja",lang:"ja"},"円 ・ 会話")),
    h("div",{class:"conv"},disp,h("div",{class:"conv-row"},h("button",{class:"swap",type:"button"},t(dir==="jpy"?"yen.toEur":"yen.toJpy")),
      h("div",{class:"cur-pick",role:"group","aria-label":t("yen.currency")},h("button",{class:"lvl",type:"button","aria-pressed":"true","data-cur":"eur"},"€ EUR"),h("button",{class:"lvl",type:"button","aria-pressed":"false","data-cur":"gbp"},"£ GBP"))),pad),
    h("div",{},h("p",{class:"eyebrow",style:{marginBottom:"8px"}},t("yen.phrases")),h("div",{style:{display:"grid",gap:"8px"}},App.data.phrases.survival.map(App.phraseEl))),
    h("div",{},h("p",{class:"eyebrow",style:{marginBottom:"8px"}},t("yen.emergency")),h("div",{class:"emerg"},App.data.phrases.emergency.filter(x=>x.number).map(x=>h("div",{},h("b",{},x.number),h("div",{},L(x))))),
      h("div",{style:{marginTop:"8px"}},App.phraseEl(App.data.phrases.emergency.find(x=>x.ja)))));
  /* un solo gestore sul bottone: con due (h() + onclick) lo scambio si annullava */
  const sw=node.querySelector(".swap");const swTxt=()=>sw.textContent=t(dir==="jpy"?(cur==="eur"?"yen.toEur":"yen.toGbp"):(cur==="eur"?"yen.toJpy":"yen.gbpToJpy"));
  sw.onclick=()=>{dir=dir==="jpy"?"eur":"jpy";swTxt();draw()};
  node.querySelectorAll(".cur-pick .lvl").forEach(b=>b.onclick=()=>{cur=b.dataset.cur;node.querySelectorAll(".cur-pick .lvl").forEach(x=>x.setAttribute("aria-pressed",x===b?"true":"false"));swTxt();draw()});
  App.openSheet(h("div",{},App.bandHanko("円"),node))}
$("#yen").onclick=openYen;

/* ───────── boot ───────── */
// REVIEW: con bottom+6 (come da piano) il distacco pillola→paravento misurato è 23,6px a 390×844 (criterio 8–16): la barra ha 10px di padding sotto e #hero parte a y=8. Il distacco non dipende più dall'inset.
function measureTop(){}
addEventListener("resize",measureTop);addEventListener("orientationchange",()=>setTimeout(measureTop,120));
/* service worker della versione installabile: solo su https (o 127.0.0.1/localhost per i test) e mai dentro claude.ai;
   appena attivo gli si manda l'elenco di quello che la pagina ha caricato, così si riapre anche offline */
// REVIEW: il piano dice "solo https"; si accetta anche http su 127.0.0.1/localhost (contesto sicuro per il browser) perché tests/pwa.py lo verifica in locale (vedi Problemi)
function registerSW(){try{const h=location.hostname||"";if(!("serviceWorker" in navigator)||/claude/i.test(h))return;
  if(location.protocol!=="https:"&&!/^(127\.0\.0\.1|localhost)$/.test(h))return;
  navigator.serviceWorker.register("sw.js?v="+(window.SITE_V||"1")).then(()=>navigator.serviceWorker.ready).then(reg=>{
    const urls=[location.href.split("#")[0],...performance.getEntriesByType("resource").map(e=>e.name).filter(u=>u.startsWith(location.origin))];
    if(reg.active)reg.active.postMessage({warm:urls})}).catch(()=>{})}catch(e){}}
async function boot(){
  measureTop();
  const saved=store.get("lang");App.lang=saved||((navigator.language||"it").toLowerCase().startsWith("it")?"it":"en");
  const files={trip:"data/trip.json",places:"data/places.json",zones:"data/zones.json",bases:"data/bases.json",phrases:"data/phrases.json",i18n:"data/i18n.json",images:"data/images.json",apps:"data/apps.json",omikuji:"data/omikuji.json",lasttrain:"data/lasttrain.json",japan:"geo/japan.json",wards:"geo/wards.json",rail:"geo/rail.json"};
  const entries=await Promise.all(Object.entries(files).map(([k,u])=>fetch(u+"?v="+(window.SITE_V||"1")).then(r=>{if(!r.ok)throw new Error(u+" "+r.status);return r.json()}).then(j=>[k,j])));
  for(const[k,v]of entries)App.data[k]=v;
  measureTop();
  applyPalette();applyI18n();tick();App.initStory();
  /* chi entra direttamente in Oggi, Mappa o Assaggi trova il Racconto sotto: "indietro" non esce subito dal sito */
  /* durante il viaggio (Tokyo, dal 3 al 19 novembre) chi apre l'app senza indirizzo arriva su Oggi; il Racconto resta sotto, a un "indietro" */
  try{const M=App.data.trip.meta,td=tokyoParts().date,end=new Date(Date.parse(M.end+"T00:00:00Z")+864e5).toISOString().slice(0,10);
    if(!location.hash&&td>=M.start&&td<=end)history.replaceState(history.state,"","#oggi")}catch(e){}
  try{const v0=viewFromHash();if(history.state==null){if(v0!=="story"){const h0=location.hash;history.replaceState({v:"story"},"","#racconto");history.pushState({v:v0},"",h0)}else history.replaceState({v:"story"},"")}}catch(e){}
  route();
  // REVIEW: la condivisione (db, user, assets) ora parte all'avvio e non solo aprendo Oggi: serve alla riga "Assaggiato da" della scheda del posto (vedi Problemi)
  if(App.tastesInit)App.tastesInit();
  registerSW();
  setInterval(()=>{tick();App.renderSeal()},1000);
  setTimeout(()=>{if(!mapLoading&&!(window.maplibregl&&App.initMap))mapLib().then(()=>{if(current==="map")App.initMap()}).catch(()=>{if(current==="map")mapErr(true)})},2500);setInterval(()=>{applyPalette();if(current==="today")renderToday()},60000);
  $("#lang").onclick=()=>{App.lang=App.lang==="it"?"en":"it";store.set("lang",App.lang);applyI18n();tick();App.refreshStory();
    if(current==="today")renderToday();if(current==="tastes")renderTastes();App.closeSheet();document.dispatchEvent(new Event("langchange"))};
}
boot().catch(err=>{console.error(err);document.body.append(h("p",{style:{padding:"100px 20px"}},"Errore di caricamento: "+err.message))});
})();
