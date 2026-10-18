/* Giappone 2026 — map (MapLibre, local GeoJSON only) */
(function(){
"use strict";
const App=window.App,{h,$,$$,t,L}=App;
let map,markers=[],cityMarkers=[],zoneMarkers=[],sealMarkers=[],meMarker=null;
const state={city:null,zone:null,what:null,genre:null,sort:"pick",near:null,nearMode:false,locating:false,sel:null,list:false};
const LEVELS=[
  {id:"japan",b:[[128.6,30.8],[146.2,45.6]]},
  {id:"tokyo",b:[[139.55,35.55],[139.9,35.79]]},
  {id:"kansai",b:[[135.05,34.5],[136.0,35.15]]},
  {id:"osaka",b:[[135.44,34.62],[135.56,34.73]]},
  {id:"kyoto",b:[[135.66,34.95],[135.81,35.06]]},
  {id:"nara",b:[[135.80,34.665],[135.86,34.70]]},
  {id:"kobe",b:[[135.16,34.67],[135.22,34.71]]}];
const CITY_SEALS=[{id:"tokyo",name:"Tokyo",jp:"東京",photo:"shinjuku",lng:139.72,lat:35.69,cities:["tokyo","kamakura","fuji"]},{id:"kansai",name:"Kansai",jp:"関西",photo:"gion-higashiyama",lng:135.62,lat:34.85,cities:["kyoto","osaka","nara","kobe","uji"]}];
const CITY_OF=Object.fromEntries(CITY_SEALS.map(c=>[c.id,c.cities]));
/* Cosa fare: icona disegnata (icons.js) e categorie dei posti che contiene */
const WHAT=[{id:"eat",icon:"ramen",cats:["eat"]},{id:"see",icon:"shrine",cats:["see","shop","trip"]},{id:"night",icon:"izakaya",cats:["night"]}];
const SHOPS=["shop","records","vintage","books","game"];
/* famiglie fisse dei generi (v42): stanno in app.js (App.FAMILIES), condivise con Assaggi */
const FAMILIES=App.FAMILIES;
const NEAR_KM=1.2;

/* ── funzioni pure del percorso ── */
function genreKey(p,what){const fams=FAMILIES[what];if(!fams)return null;if(what==="see"&&p.cat==="trip")return"trip";
  const k=what==="eat"?p.dish:p.icon;const f=fams.find(([,ks])=>ks.includes(k));return f?f[0]:null}
/* Economico: solo i posti da ¥ (price 1); i "cheap" da ¥¥ restano in Tutti e nei generi */
function isCheap(p){return p.price===1}
// REVIEW: il piano dice tokyo+eat+ramen = 9, i dati ne hanno 4 a Tokyo e 9 in tutto il viaggio (vedi Problemi)
function matches(p,s=state){
  if(s.city&&!CITY_OF[s.city].includes(p.city))return false;
  if(s.zone&&p.zone!==s.zone)return false;
  if(s.what){const w=WHAT.find(x=>x.id===s.what);if(!w.cats.includes(p.cat))return false}
  if(s.genre&&s.genre!=="all"){if(s.genre==="cheap"){if(p.cat!=="eat"||!isCheap(p))return false}else if(genreKey(p,s.what)!==s.genre)return false}
  return true}
function filtered(s=state){return App.data.places.filter(p=>matches(p,s))}
/* generi presenti nella città per "cosa fare": [{key,n}], "all" primo, per eat "cheap" subito dopo */
function genresFor(city,what,zone=null){const ps=filtered({city,zone,what,genre:null});const n={};
  for(const p of ps){const k=genreKey(p,what);if(k)n[k]=(n[k]||0)+1}
  const out=[{key:"all",n:ps.length}];if(what==="eat"){const c=ps.filter(isCheap).length;if(c)out.push({key:"cheap",n:c})}
  return out.concat((FAMILIES[what]||[]).filter(([k])=>n[k]).map(([k])=>({key:k,n:n[k]})))}
const isOpenNow=p=>App.isOpen(p)===true;
/* Consigliati: prenotati, noi, Luca, poi i "da scoprire", poi gli altri suggerimenti (i discover sono tutti sugg nei dati) */
const PICK={booked:0,noi:1,luca:2,sugg:4};
const pickRank=p=>p.booking==="booked"?0:p.source==="sugg"&&p.discover?3:PICK[p.source]??4;
/* Consigliati: per fonte (sopra), poi per distanza dalla casa della fase, non più in ordine alfabetico */
// REVIEW: il piano dice "Consigliati = per distanza dalla casa"; tengo prima l'ordine per fonte (prenotati, noi, Luca, da scoprire) e uso la distanza al posto dell'alfabeto dentro ogni gruppo, vedi Problemi
function sortPlaces(ps,sort=state.sort,near=state.near){const a=ps.slice(),hk=new Map(a.map(p=>[p.id,App.homeKm(p)])),H=(x,y)=>hk.get(x.id)-hk.get(y.id);
  if(sort==="near"&&near)return a.sort((x,y)=>App.km(near.lat,near.lng,x.lat,x.lng)-App.km(near.lat,near.lng,y.lat,y.lng));
  if(sort==="price")return a.sort((x,y)=>(x.price||1)-(y.price||1)||pickRank(x)-pickRank(y)||H(x,y));
  return a.sort((x,y)=>pickRank(x)-pickRank(y)||H(x,y))}
const perf={lastMoveMs:0,n:0};
App.mapDebug=()=>({matches,genresFor,filtered,sortPlaces,isOpenNow,state,get lastMoveMs(){return perf.lastMoveMs},get moves(){return perf.n}});
const step=()=>!state.city?1:!state.what?2:!state.genre?3:4;

/* carta disegnata (piano B): mare a seigaiha, coste a inchiostro, ferrovie in inchiostro e Shinkansen vermiglio */
const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return`rgba(${n>>16&255},${n>>8&255},${n&255},${a})`};
function seaPattern(p,night){const S=48,PR=2,s=S*PR,c=document.createElement("canvas");c.width=s;c.height=s/2;const x=c.getContext("2d");
  /* onde seigaiha: file di cerchi ogni s/4, sfalsate di s/2; ogni cerchio copre il basso di quelli sopra, poi tre anelli */
  x.lineWidth=PR*.9;const R=s/2;
  for(let k=-2;k<=4;k++){const y=k*s/4,off=(k&1)?s/2:0;for(let cx=off-s;cx<=s*2;cx+=s){
    x.beginPath();x.arc(cx,y,R,0,2*Math.PI);x.fillStyle=p.sea;x.fill();
    x.strokeStyle=rgba(p.ink,night?.08:.06);for(const r of[R*.94,R*.7,R*.46,R*.22]){x.beginPath();x.arc(cx,y,r,Math.PI,2*Math.PI);x.stroke()}}}
  return{data:x.getImageData(0,0,s,s/2),pr:PR}}
const EMPTY={type:"FeatureCollection",features:[]};
/* cerchio di 64 lati di raggio km attorno a lat,lng */
function circle(lat,lng,km){const c=[],dy=km/110.54,dx=km/(111.32*Math.cos(lat*Math.PI/180));for(let i=0;i<=64;i++){const a=2*Math.PI*i/64;c.push([+(lng+dx*Math.cos(a)).toFixed(5),+(lat+dy*Math.sin(a)).toFixed(5)])}
  return{type:"FeatureCollection",features:[{type:"Feature",properties:{},geometry:{type:"Polygon",coordinates:[c]}}]}}
function updateHalo(){if(!map||!map.getSource("zone-halo"))return;const z=state.zone&&(App.data.zones||[]).find(x=>x.id===state.zone);
  map.getSource("zone-halo").setData(z?circle(z.lat,z.lng,z.radiusKm||.8):EMPTY)}
// REVIEW: la zona senza radiusKm prende 0,8 km
const isJR=["any",["==",["get","kind"],"nex"],["all",["==",["get","kind"],"metro"],["==",["slice",["to-string",["get","id"]],0,2],"11"]]];
/* bordi che stanno in un solo poligono (coste e confini semplificati in modo diverso): i bordi in comune tra due poligoni
   finirebbero comunque sotto il riempimento, toglierli dimezza circa le linee da disegnare per coste, linea d'acqua e fessure */
function edgesOnce(fc){const n=new Map(),key=(a,b)=>a[0]<b[0]||a[0]===b[0]&&a[1]<b[1]?a+"|"+b:b+"|"+a,rings=[];
  for(const f of fc.features){const g=f.geometry,ps=g.type==="Polygon"?[g.coordinates]:g.coordinates;for(const p of ps)for(const r of p){rings.push(r);for(let i=1;i<r.length;i++){const k=key(r[i-1],r[i]);n.set(k,(n.get(k)||0)+1)}}}
  const lines=[];for(const r of rings){let cur=null;for(let i=1;i<r.length;i++){if(n.get(key(r[i-1],r[i]))===1){if(!cur){cur=[r[i-1]];lines.push(cur)}cur.push(r[i])}else cur=null}}
  return{type:"FeatureCollection",features:[{type:"Feature",properties:{},geometry:{type:"MultiLineString",coordinates:lines}}]}}
/* acque interne (piano B, ritocco): di giorno un passo più scure e più fredde del mare di carta (--sea della palette con un filo d'inchiostro),
   così una fascia di 10 px si legge anche senza bordo; di notte restano il colore del mare */
const waterOf=(p,night)=>night?p.paper2:mixHex(p.sea||p.paper2,p.ink,.05);
function mixHex(a,b,t){const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16),f=s=>Math.round((A>>s&255)*(1-t)+(B>>s&255)*t);return"#"+((1<<24)+(f(16)<<16)+(f(8)<<8)+f(0)).toString(16).slice(1)}
function carta(){const p={...App.palette()},night=App.night>.6;return{night,ink:p.ink,shu:p.shu,land:p.paper,sea:p.paper2,water:waterOf(p,night),paper3:p.paper3||p.paper2}}
/* ferrovie (piano 18/10): da lontano inchiostro, da zoom 12 il colore della linea; un colore non valido torna inchiostro (to-color) */
const railColor=ink=>["interpolate",["linear"],["zoom"],10.5,ink,12,["to-color",["get","color"],ink]];
/* strade e acque (piano 18/10 B): dati GSI cotti in geo/roads.json e geo/water.json, caricati dopo "load" come le stazioni */
const mix=mixHex;
const fadeIn=(z,a)=>["interpolate",["linear"],["zoom"],z-.5,0,z,a];
/* fiumi-linea: sottili; dentro le zone del viaggio (z:1) da zoom 13 diventano canali larghi ~4 px (12 a zoom 16), colore acqua, così il Dōtonbori non si confonde con una via */
const ZW=(a,b)=>["case",["==",["get","z"],1],b,a];
const RIVER_W=["interpolate",["linear"],["zoom"],11.5,1.2,12.5,1.7,13,ZW(1.9,4),14,ZW(2.4,6),16,ZW(5,12)];
const riverColor=c=>["case",["==",["get","z"],1],c.water,mix(c.water,c.ink,.06)];
// REVIEW: road-3 (comunali larghe, k:3) oggi è vuoto: per stare nei 650 KB build_city.py toglie k:3 come da piano (con k:3 sarebbero 823 KB)
// REVIEW: water-edge è una linea sotto il riempimento (come le coste) invece di un filo da 0,8 px sopra: copre le cuciture tra i tasselli GSI
const ROAD=[["road-3",3,13.5,.16,.6,1],["road-2",2,12.5,.26,.9,1.6],["road-1",1,11.5,.36,1.2,2.2]];
function cityLayers(c){const ink=c.ink;return[
  /* bordo come le coste: linea larga 1,6 sotto il riempimento, fuori ne resta 0,8 px e le cuciture tra i tasselli GSI spariscono */
  {id:"water-edge",type:"line",source:"water",minzoom:9.5,filter:["==",["get","t"],"a"],layout:{"line-join":"round"},paint:{"line-color":rgba(ink,.14),"line-width":1.6,"line-opacity":fadeIn(10,1)}},
  {id:"water-fill",type:"fill",source:"water",minzoom:9.5,filter:["==",["get","t"],"a"],paint:{"fill-color":c.water,"fill-opacity":fadeIn(10,1),"fill-antialias":false}},
  {id:"river-edge",type:"line",source:"water",minzoom:11,filter:["==",["get","t"],"r"],layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":rgba(ink,.14),"line-width":.8,"line-gap-width":RIVER_W,"line-opacity":fadeIn(11.5,1)}},
  {id:"river",type:"line",source:"water",minzoom:11,filter:["==",["get","t"],"r"],layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":riverColor(c),"line-width":RIVER_W,"line-opacity":fadeIn(11.5,1)}},
  ...ROAD.map(([id,k,z,a,w0,w1])=>({id,type:"line",source:"roads",minzoom:z-.5,filter:["==",["get","k"],k],layout:{"line-join":"round","line-cap":"round"},paint:{"line-color":ink,"line-opacity":fadeIn(z,a),"line-width":["interpolate",["linear"],["zoom"],z,w0,16,w1]}}))]}
// REVIEW: le larghezze delle strade vanno da w0 alla soglia a w1 a zoom 16 (il piano dà i due valori, non gli zoom)
const railOpacity=far=>["interpolate",["linear"],["zoom"],10.5,far,12,.8];
function paint(){if(!map||!map.isStyleLoaded())return;const c=carta();
  const w=seaPattern(c,c.night);if(map.hasImage("wave"))map.removeImage("wave");map.addImage("wave",w.data,{pixelRatio:w.pr});
  map.setPaintProperty("bg","background-color",c.sea);map.setPaintProperty("bg","background-pattern","wave");
  for(const l of["japan-fill","wards-fill"])map.setPaintProperty(l,"fill-color",c.land);
  for(const l of["japan-seam","wards-seam"])map.setPaintProperty(l,"line-color",c.land);
  for(const l of["japan-coast","wards-coast"])map.setPaintProperty(l,"line-color",rgba(c.ink,.35));
  for(const l of["japan-wl","wards-wl"])map.setPaintProperty(l,"line-color",rgba(c.ink,c.night?.16:.14));
  map.setPaintProperty("wards-line","line-color",rgba(c.ink,.18));
  map.setPaintProperty("rail-metro","line-color",railColor(c.ink));map.setPaintProperty("rail-jr","line-color",railColor(c.ink));map.setPaintProperty("shk","line-color",c.shu);
  if(map.getLayer("stations")){map.setPaintProperty("stations","circle-color",c.land);map.setPaintProperty("stations","circle-stroke-color",c.ink)}
  if(map.getLayer("water-fill")){map.setPaintProperty("water-fill","fill-color",c.water);map.setPaintProperty("water-edge","line-color",rgba(c.ink,.14));map.setPaintProperty("river-edge","line-color",rgba(c.ink,.14));map.setPaintProperty("river","line-color",riverColor(c))}
  if(map.getLayer("road-1"))for(const[id]of ROAD)map.setPaintProperty(id,"line-color",c.ink);
  if(map.getLayer("zone-halo-fill")){map.setPaintProperty("zone-halo-fill","fill-color",c.paper3);map.setPaintProperty("zone-halo-line","line-color",rgba(c.ink,.35))}}

function pinFor(p){const w=h("div",{class:"pm"});const b=h("button",{class:"pin"+(p.booking==="booked"?" booked":"")+(p.status==="closed"?" closed":"")+(p.discover?" discover":"")+(p.chain?" chain":""),type:"button","aria-label":L(p.name),style:{"--c":p.booking==="booked"?"var(--c-booked)":App.catColor(p.cat)},lang:"ja"},App.iconEl(p),h("span",{class:"pk","aria-hidden":"true"},App.glyph(p)));
  if(p.zone)w.dataset.zone=p.zone;
  b.addEventListener("mouseenter",()=>nearZone(p.zone,w,true));b.addEventListener("mouseleave",()=>nearZone(p.zone,w,false));
  /* il tocco vale su tutta la cornice .pm (44 px), non solo sul quadratino del pin */
  w.addEventListener("click",ev=>{ev.stopPropagation();if(!(state.list&&pinToRow(p)))select(p,PHONE()?"pin":false)});
  /* nome da vicino e cartellino del selezionato: solo testo visivo, il nome per i lettori di schermo sta già sul bottone */
  const pl=h("span",{class:"pl","aria-hidden":"true"},L(p.name)),tag=h("span",{class:"tag","aria-hidden":"true"},h("b",{},L(p.name)),h("span",{class:"mono"},"¥".repeat(p.price||1)));
  const td=todayInfo(),bk=td&&td.bookings.find(x=>x.place===p.id);
  if(bk){w.classList.add("today");tag.replaceChildren(h("span",{class:"mono"},bk.time||""),h("b",{},L(p.name)))}
  w.append(b,pl,tag);w.btn=b;w.pl=pl;w.tag=tag;return w}
const FINE=matchMedia("(hover:hover) and (pointer:fine)");
function nearZone(z,self,on){if(!z||!FINE.matches)return;for(const m of markers){if(m.el!==self&&m.el.dataset.zone===z)m.el.classList.toggle("is-near",on)}}
// REVIEW: spostamento del pin su desktop cambiato per la stampa centrata (prima -230 px per il foglio a destra), vedi Problemi
/* desktop: la scheda è una stampa centrata di 560 px, quindi il pin va a metà dello spazio libero a sinistra */
/* telefono: la scheda si apre e la carta porta il pin a metà dello spazio sopra la scheda (offset = metà della sua altezza) */
function centerOverSheet(p){const sh=$("#sheet"),hS=sh.offsetHeight||Math.min(innerHeight*.78,640),z=map.getZoom(),ui=$(".map-ui").getBoundingClientRect().bottom;map.stop();
  /* il pin va al centro dello spazio libero tra il fondo delle briciole e la cima della scheda */
  map.easeTo({center:[p.lng,p.lat],zoom:z>=13.5?z:14.5,offset:[0,-Math.round((hS-ui)/2)],duration:App.REDUCED?0:420,essential:true})}
function select(p,fly){state.sel=p.id;lightPin(p.id);
  if(fly&&PHONE()){App.placeSheet(p,{onClose:()=>{state.sel=null;const on=state.list&&$("#mlist-body .row[data-on=\"1\"]");lightPin(on?on.dataset.id:null)}});requestAnimationFrame(()=>centerOverSheet(p));return}
  if(fly){map.stop();map.easeTo({center:[p.lng,p.lat],zoom:Math.max(map.getZoom(),15),duration:App.REDUCED?0:900,offset:innerWidth>=900?[Math.round((innerWidth-Math.min(560,innerWidth))/4-innerWidth/2),0]:[0,-Math.round(innerHeight*.22)],essential:true})}
  App.placeSheet(p,{onClose:()=>{state.sel=null;const on=state.list&&$("#mlist-body .row[data-on=\"1\"]");lightPin(on?on.dataset.id:null)}})}
App.focusPlace=id=>{const p=App.data.places.find(x=>x.id===id);if(p&&map){if(PHONE())setDetent("peek");select(p,true)}};

function zoneSheet(z){const ps=App.data.places.filter(p=>p.zone===z.id);const by=fn=>ps.filter(fn);
  const row=p=>h("button",{type:"button",onclick:()=>select(p,true)},App.iconEl(p),L(p.name),h("small",{},"¥".repeat(p.price||1)));
  const sec=(k,list)=>list.length?h("div",{},h("p",{class:"eyebrow",style:{marginBottom:"4px"}},t(k)),h("div",{class:"zlist"},list.map(row))):null;
  const dishes=new Set(ps.map(p=>p.dish));const guide=App.data.i18n.guide.filter(g=>dishes.has(g.id)||(g.id==="sushi"&&dishes.has("sushi")));
  const im=(App.data.images?.images||[]).find(i=>i.id===z.id);
  // REVIEW: il piano non dice quale kanji per la zona: 町 (quartiere); vedi Problemi
  /* timbro di categoria della zona (町) sulla foto, o sulla fascia bokashi se la foto manca */
  const hk=()=>h("span",{class:"big",lang:"ja","aria-hidden":"true"},"町");
  const photo=im?h("figure",{class:"zone-photo duo"},h("span",{class:"ink"}),h("img",{src:im.file+"?v="+(window.SITE_V||"1"),alt:"",loading:"lazy",onerror:ev=>ev.target.closest("figure").remove()}),h("figcaption",{},im.author+" (" +im.license+")"),hk()):null;
  const node=h("div",{},photo?null:App.bandHanko("町"),h("div",{class:"sh-body"},photo,
    h("div",{class:"sh-title"},h("p",{class:"eyebrow"},t("zone.title")),h("h2",{id:"sheet-title"},L(z.name)),h("div",{class:"ja",lang:"ja"},z.name.ja)),
    App.stampRow?App.stampRow(z):null,
    h("ul",{class:"facts"},L(z.facts).split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý])/).filter(Boolean).map(s=>{const i=s.indexOf(":");return i>0&&i<34?h("li",{},h("b",{},s.slice(0,i+1)),s.slice(i+1)):h("li",{},s)})),
    sec("zone.cheap",by(p=>p.cat==="eat"&&p.tier!=="chic")),sec("zone.chic",by(p=>p.cat==="eat"&&p.tier==="chic")),sec("zone.see",by(p=>p.cat!=="eat")),
    guide.length?h("details",{class:"guide"},h("summary",{},t("zone.guide")),h("div",{class:"guide-grid"},guide.map(g=>h("div",{},h("b",{lang:"ja"},g.ja+" "),h("strong",{},L(g).t),h("p",{},L(g).d))))):null,
    h("details",{class:"guide"},h("summary",{},t("rules.title")),h("ul",{class:"guide-grid"},App.data.i18n.rules[App.lang].map(r=>h("li",{},r))))));
  App.openSheet(node)}

/* ── Oggi sulla carta (piano 18/10): solo dentro il viaggio; casa della fase e prenotazioni del giorno ── */
function todayInfo(){const D=App.data,m=D.trip.meta||{},day=App.tokyoParts(App.now()).date;if(!m.start||day<m.start||day>m.end)return null;
  const st=(D.trip.stays||[]).filter(s=>s.from<=day&&day<s.to).pop()||(D.trip.stays||[]).filter(s=>s.from<=day).pop();if(!st)return null;
  const home=D.bases.find(b=>b.id===st.id),city=CITY_SEALS.find(c=>c.cities.includes(st.city));
  const zone=home?(D.zones||[]).filter(z=>city&&city.cities.includes(z.city)).sort((a,b)=>App.km(home.lat,home.lng,a.lat,a.lng)-App.km(home.lat,home.lng,b.lat,b.lng))[0]:null;
  return{day,stay:st,home,city,zone,bookings:(D.trip.bookings||[]).filter(b=>b.date===day)}}

/* ── stato nell'indirizzo: #mappa/<città>/<zona>/<cosa>/<genere>, sempre replaceState; copia in sessionStorage ── */
let NOANIM=false;const DUR=ms=>App.REDUCED||NOANIM?0:ms;
function saveState(){const segs=[state.city,state.zone,state.what,state.genre];try{sessionStorage.setItem("mapState",JSON.stringify(segs))}catch(e){}
  if($("#v-map").hidden)return;const hs=state.city?"#mappa/"+segs.map(x=>x||"-").join("/"):"#mappa";
  if(location.hash!==hs){try{history.replaceState(history.state,"",hs)}catch(e){}}}
function readState(){const m=(location.hash||"").match(/^#mappa\/(.+)$/);let segs=null;
  if(m)segs=m[1].split("/").map(x=>x&&x!=="-"?decodeURIComponent(x):null);else{try{segs=JSON.parse(sessionStorage.getItem("mapState")||"null")}catch(e){}}
  if(!Array.isArray(segs))return null;const [city,zone,what,genre]=segs;if(!city||!CITY_OF[city])return null;
  const out={city,zone:null,what:null,genre:null};if(zone&&zonesFor(city).some(x=>x.z.id===zone))out.zone=zone;
  if(what&&WHAT.some(w=>w.id===what)){out.what=what;if(genre&&genresFor(city,what,out.zone).some(g=>g.key===genre))out.genre=genre}return out}
/* all'apertura: ripristina e inquadra senza animazione */
function restoreState(){const r=readState();if(!r)return false;Object.assign(state,r);NOANIM=true;
  try{render();const z=state.zone&&(App.data.zones||[]).find(x=>x.id===state.zone);if(state.genre)openList();else if(z)flyZone(z);else flyLevel(LEVELS.find(l=>l.id===state.city)||LEVELS[0])}finally{NOANIM=false}return true}

/* ── percorso: briciole, passi, elenco ── */
const fold=x=>x.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
/* nome corto della zona: prima parte, salvo quando la prima parte è la città (Kobe) */
const zoneShort=z=>{const n=(L(z.name)||"").split(/ \(|,| and | e | & /)[0],ps=n.split(/\s+\u00b7\s+/);return ps.length>1&&Object.values(CITY_OF).flat().includes(fold(ps[0]))?ps[1]:ps[0]};
const zoneKanji=z=>(z.name.ja||"").split("・")[0];
/* nome del sigillo di carta: il campo short di zones.json; altrimenti la prima parte del nome corto ("Dōtonbori – Namba" → Dōtonbori), salvo quando è la città ("Kōbe – Sannomiya" → Sannomiya) */
const sealName=z=>{if(z.short)return z.short;const ps=zoneShort(z).split(/\s+[\u2013-]\s+/);return ps.length>1&&Object.values(CITY_OF).flat().includes(fold(ps[0]))?ps[1]:ps[0]};
const imgOf=id=>(App.data.images?.images||[]).find(i=>i.id===id);
const photoSrc=im=>im.file+"?v="+(window.SITE_V||"1");
/* zone della città con almeno un posto, nell'ordine delle città e poi per numero di posti */
function zonesFor(city){const cs=CITY_OF[city]||[],P=App.data.places;
  return(App.data.zones||[]).filter(z=>cs.includes(z.city)).map(z=>({z,n:P.filter(p=>p.zone===z.id).length})).filter(x=>x.n)
    .sort((a,b)=>cs.indexOf(a.z.city)-cs.indexOf(b.z.city)||b.n-a.n)}
/* foto in duotone (stampa): fondo inchiostro, foto in retino, carta in moltiplica; se la foto manca resta il fondo */
function duoPhoto(id,cls){const im=imgOf(id);if(!im)return null;
  return[h("span",{class:"ink"}),h("img",{src:photoSrc(im),alt:"",loading:"lazy",decoding:"async",onerror:ev=>{const b=ev.target.parentNode;b.classList.remove("duo","has-photo");b.classList.add("no-photo");ev.target.previousSibling.remove();ev.target.remove()}})]}
const icon22=k=>h("span",{class:"gi","aria-hidden":"true",html:(window.ICONS||{})[k]||""});
const genreIcon=(k,what)=>k==="all"?(WHAT.find(w=>w.id===what)||{}).icon:k==="cheap"?"onigiri":((FAMILIES[what]||[]).find(f=>f[0]===k)||[,[k]])[1][0];
const genreName=(k,what=state.what,short)=>k==="all"?t("map.genre.all"):k==="cheap"?t("map.genre.cheap"):t("genre."+what+"."+k+(short?".s":""));
const cityName=id=>(CITY_SEALS.find(c=>c.id===id)||{}).name||"";

function renderCrumbs(){const box=$("#crumbs"),s=step();
  if(s===1){box.replaceChildren(...[h("span",{class:"cr-hint"},t("map.step.city")),$("#v-map").dataset.zoomed==="1"?h("button",{type:"button",class:"cr-x","aria-label":t("map.level.japan"),onclick:home},"×"):null].filter(Boolean));return}
  const items=[h("button",{type:"button",class:"cr",onclick:()=>setCity(state.city)},cityName(state.city))];
  const zo=state.zone&&(App.data.zones||[]).find(z=>z.id===state.zone);
  if(zo)items.push(h("span",{class:"cr-zone"},h("button",{type:"button",class:"cr",onclick:()=>setZone(zo.id,true)},zoneShort(zo)),
    h("button",{type:"button",class:"cr-zx","aria-label":t("map.zone.clear")+" "+zoneShort(zo),onclick:clearZone},"×")));
  if(state.what)items.push(h("button",{type:"button",class:"cr",onclick:()=>setWhat(state.what)},t("map.what."+state.what)));
  if(state.genre)items.push(h("button",{type:"button",class:"cr","aria-current":"step",onclick:()=>state.list&&innerWidth<900?closeList():openList()},genreName(state.genre)));
  if(s>1&&s<4)items.at(-1).setAttribute("aria-current","step");
  /* telefono: le briciole stanno su una riga, per esteso solo le ultime due; le precedenti diventano "‹", che torna indietro di un livello */
  const short=innerWidth<900&&items.length>2,shown=short?items.slice(-2):items,parts=[];
  if(short)parts.push(h("button",{type:"button",class:"cr-back","aria-label":t("map.back")+": "+items.slice(0,-2).map(e=>e.textContent.replace("×","").trim()).join(", "),onclick:backOne},"‹"));
  shown.forEach((e,i)=>{if(i)parts.push(h("span",{class:"sep","aria-hidden":"true"},"›"));parts.push(e)});
  parts.push(h("button",{type:"button",class:"cr-x","aria-label":t("map.level.japan"),onclick:home},"×"));
  box.replaceChildren(...parts)}
/* indietro di un livello: genere → generi, cosa fare → zona o città, zona → città */
function backOne(){if(state.genre){setWhat(state.what);return}if(state.what){if(state.zone)setZone(state.zone,true);else setCity(state.city);return}if(state.zone){clearZone();return}home()}

function renderSteps(){const box=$("#steps"),s=step();box.dataset.step=s;
  if(s===1){const td=todayInfo();
    const todayRow=td&&td.city?h("button",{type:"button",class:"inkline today-row",onclick:()=>{setCity(td.city.id);if(td.zone)flyZone(td.zone)}},
      h("span",{class:"gi","aria-hidden":"true",html:(window.ICONS||{}).arrow||""}),h("span",{},t("map.today").replace("{city}",cityName(td.city.id)).replace("{zone}",td.zone?zoneShort(td.zone):L(td.stay.name).split(",")[0]))):null;
    box.replaceChildren(...[todayRow,h("div",{class:"city-cards"},CITY_SEALS.map(c=>{const n=App.data.places.filter(p=>c.cities.includes(p.city)).length,ph=duoPhoto(c.photo);
    return h("button",{type:"button",class:"city-card"+(ph?" duo has-photo":" no-photo"),onclick:()=>setCity(c.id)},ph,h("span",{class:"fade"}),
      h("span",{class:"cc-txt"},h("span",{class:"cc-jp",lang:"ja"},c.jp),h("b",{},c.name),h("span",{class:"cc-sub"},c.cities.map(x=>x[0].toUpperCase()+x.slice(1)).join(", ")),h("span",{class:"cc-n"},n+" "+t("filter.count"))))}))].filter(Boolean));return}
  if(s===2){const zs=zonesFor(state.city);
    // REVIEW: tessera "Tutte le zone" in testa alla striscia (chiave map.zone.all del passo 5): toglie la zona come la × della briciola
    const tot=filtered({city:state.city}).length;
    const all=h("button",{type:"button",class:"ztile zall","aria-pressed":String(!state.zone),onclick:()=>{if(state.zone)clearZone()}},h("span",{class:"zph no-photo"},h("span",{class:"zk",lang:"ja","aria-hidden":"true"},"全")),h("span",{class:"zn"},t("map.zone.all")),h("span",{class:"zc"},String(tot)));
    const strip=h("div",{class:"zstrip",role:"group","aria-label":t("map.zone.title")},all,zs.map(({z,n})=>{const ph=duoPhoto(z.id);
      return h("button",{type:"button",class:"ztile","data-z":z.id,"aria-pressed":String(state.zone===z.id),onclick:()=>state.zone===z.id?clearZone():setZone(z.id)},
        h("span",{class:"zph"+(ph?" duo has-photo":" no-photo")},ph||h("span",{class:"zk"+(zoneKanji(z).length>2?" k3":""),lang:"ja","aria-hidden":"true"},zoneKanji(z))),
        h("span",{class:"zn"},zoneShort(z)),h("span",{class:"zc"},String(n)))}));
    box.replaceChildren(strip,h("div",{class:"what-tabs"},WHAT.map(w=>{const n=filtered({city:state.city,zone:state.zone,what:w.id}).length;
    return h("button",{type:"button",class:"inkline what",style:{"--wc":"var(--c-"+w.id+")"},onclick:()=>setWhat(w.id)},icon22(w.icon),h("span",{},t("map.what."+w.id)),h("span",{class:"n"},String(n)))})));
    const on=strip.querySelector('[aria-pressed="true"]');if(on)requestAnimationFrame(()=>{strip.scrollLeft=Math.max(0,on.offsetLeft-strip.clientWidth/2+on.offsetWidth/2)});return}
  box.replaceChildren(h("div",{class:"genres",style:{"--wc":"var(--c-"+state.what+")"},role:"group","aria-label":t("map.what."+state.what)},genresFor(state.city,state.what,state.zone).map(g=>
    h("button",{type:"button",class:"genre","data-k":g.key,"aria-pressed":String(state.genre===g.key),onclick:()=>setGenre(g.key)},icon22(genreIcon(g.key,state.what)),h("span",{class:"gl"},genreName(g.key)),h("span",{class:"gs","aria-hidden":"true"},genreName(g.key,state.what,true)),h("span",{class:"n"},String(g.n))))));
  const on=box.querySelector('[aria-pressed="true"]');if(on)on.scrollIntoView({block:"nearest",inline:"nearest"})}

function render(){renderCrumbs();renderSteps();refresh();updateHalo();if(PHONE())applyDetent();saveState()}
function setCity(id){state.city=id;state.zone=null;state.what=null;state.genre=null;closeList();render();flyLevel(LEVELS.find(l=>l.id===id)||LEVELS[0])}
function setWhat(w){const back=state.genre!=null;state.what=w;state.genre=null;closeList();render();if(back)flyLevel(LEVELS.find(l=>l.id===state.city))}
function setGenre(g){state.genre=g;render();openList()}
/* zona: filtra pin ed elenco, entra nelle briciole; dalla briciola si torna a Mangiare/Vedere/Sera della zona */
/* offset e non padding: in MapLibre 4 il padding di flyTo resta sulla mappa e si somma a quello dei fitBounds successivi */
function flyZone(z){const pd=padUI();map.stop();map.flyTo({center:[z.lng,z.lat],zoom:14,offset:[0,Math.round((pd.top-pd.bottom)/2)],duration:DUR(1400),essential:true,pitch:0,bearing:0})}
function setZone(id,back){const z=(App.data.zones||[]).find(x=>x.id===id);if(!z)return;state.zone=id;if(back||PHONE()){if(back){state.what=null;state.genre=null}closeList()}
  render();if(state.list)openList();else flyZone(z)}
function clearZone(){state.zone=null;render();if(state.list)openList();else flyLevel(LEVELS.find(l=>l.id===state.city)||LEVELS[0])}
function home(){state.city=state.zone=state.what=state.genre=null;closeList();render();flyLevel(LEVELS[0])}

/* timbrini di una riga */
// REVIEW: badge.book / badge.walkin / badge.luca aggiunte perché le etichette della scheda sono troppo lunghe per una riga; "Vicino a me" non filtra più, dà timbrino e ordine
function walkMin(k){return Math.max(1,Math.round(k/.08))}
function rowBadges(p){const b=[],B=(txt,cls="")=>h("span",{class:"badge"+(cls?" "+cls:"")},txt);
  if(p.booking==="booked")b.push(B(t("booking.booked"),"shu"));else if(p.booking==="book"||p.booking==="recommended")b.push(B(t("badge.book")));else if(p.booking==="walkin")b.push(B(t("badge.walkin")));
  if(p.source==="noi")b.push(B(t("source.noi")));else if(p.source==="luca")b.push(B(t("badge.luca")));
  if(p.discover)b.push(B(t("badge.discover"),"disc"));if(p.chain)b.push(B(t("badge.chain"),"chain"));
  if(isOpenNow(p))b.push(B(t("badge.openNow"),"open"));
  if(state.near){const k=App.km(state.near.lat,state.near.lng,p.lat,p.lng);if(k<NEAR_KM)b.push(B(t("badge.near")+", "+t("badge.walk").replace("{n}",walkMin(k)),"near"))}
  return b}
function rowFor(p){const z=(App.data.zones||[]).find(x=>x.id===p.zone);const k=state.what==="eat"||p.cat==="eat"?p.dish:p.icon;
  return h("button",{type:"button",class:"row","data-id":p.id,onclick:()=>select(p)},
    h("span",{class:"r1"},icon22(SHOPS.includes(k)?"shop":k||"view"),h("b",{},L(p.name)),h("span",{class:"zn"},z?(L(z.name)||"").split(/ \(|,| and | e /)[0]:(p.city||"").replace(/^./,c=>c.toUpperCase())),h("span",{class:"yen"},"¥".repeat(p.price||1))),
    h("span",{class:"badges"},rowBadges(p)),
    h("span",{class:"what"},L(p.what)))}

let listLock=0;
/* ── cassetto (piano 18/10): sul telefono #drawer è sempre in Mappa, con tre tappe peek, half, full; su desktop è il pannello destro di prima ── */
const PHONEQ=matchMedia("(max-width:899px)"),PHONE=()=>PHONEQ.matches;
const drawer=()=>$("#drawer"),body=()=>$("#mlist-body");
/* testata: numero dei posti e ordine (su desktop anche la ×) */
function renderHead(){const n=filtered().length;const dc=$("#dr-count");if(dc)dc.textContent=n+" "+t("filter.count");if(state.sort==="near"&&!state.near)state.sort="pick";
  const sorts=["near","pick","price"].filter(k=>k!=="near"||state.near);
  $("#ml-head").replaceChildren(h("div",{class:"ml-t"},h("h2",{id:"mlist-title"},n+" "+t("filter.count")),
      PHONE()?null:h("button",{type:"button",class:"ml-x","aria-label":t("sheet.close"),onclick:closeList},"✕")),
    h("div",{class:"ml-sort",role:"group"},sorts.map(k=>h("button",{type:"button",class:"lvl","aria-pressed":String(state.sort===k),onclick:()=>{state.sort=k;openList()}},t("map.sort."+k)))))}
function renderRows(){const ps=sortPlaces(filtered());body().replaceChildren(ps.length?h("div",{class:"rows"},ps.map(rowFor)):h("p",{class:"empty"},t("list.empty")));return ps}
/* altezze visibili delle tappe; il cassetto è alto quanto "full" e scende con translateY */
function detentPx(d){const dr=drawer(),full=dr.offsetHeight;if(d==="full")return full;if(d==="half")return Math.min(full,Math.round(Math.min(innerHeight*.56,480)));
  /* a peek la testata (ordinamenti) è nascosta: resta la riga sottile "N posti", alta 24 px */
  const g=dr.querySelector(".grab").offsetHeight,hd=24,slot=dr.querySelector(".dr-steps"),cap=Math.round(Math.min(innerHeight*.4,340));
  slot.style.maxHeight=Math.max(60,cap-g-hd)+"px";return Math.min(cap,g+slot.offsetHeight+hd)}
function drawerVis(){return PHONE()?detentPx(drawer().dataset.detent||"peek"):0}
function applyDetent(dy){const dr=drawer();if(!PHONE()){dr.style.removeProperty("--dy");$("#v-map").style.removeProperty("--dr-vis");return}
  const full=dr.offsetHeight,vis=dy==null?detentPx(dr.dataset.detent||"peek"):full-dy;
  dr.style.setProperty("--dy",(full-vis)+"px");$("#v-map").style.setProperty("--dr-vis",vis+"px");body().style.paddingBottom=(full-vis)+"px"}
function setDetent(d){const dr=drawer();if(!PHONE())return;const prev=dr.dataset.detent;dr.dataset.detent=d;$("#v-map").dataset.detent=d;
  const on=d!=="peek";if(on!==state.list){state.list=on;$("#v-map").dataset.list=on?"1":"0";if(on){renderHead();renderRows();body().scrollTop=0;requestAnimationFrame(syncFromList)}else{body().replaceChildren();lightPin(null)}}
  applyDetent();if(d==="full"&&App.pushLayer)App.pushLayer("list",()=>setDetent("half"));else if(prev==="full"&&d!=="full"&&App.dropLayer)App.dropLayer("list")}
function openList(){if(state.sort==="near"&&!state.near)state.sort="pick";
  if(PHONE()){const was=state.list;if(!was)setDetent("half");else{renderHead();const ps=renderRows();body().scrollTop=0;applyDetent();fitTo(ps);requestAnimationFrame(syncFromList);return}fitTo(filtered());return}
  state.list=true;renderHead();const ps=renderRows();const ml=drawer();
  ml.dataset.open="1";$("#v-map").dataset.list="1";$("#t-list").setAttribute("aria-pressed","true");map.resize();
  body().scrollTop=0;fitTo(ps);requestAnimationFrame(syncFromList)}
function closeList(){if(PHONE()){setDetent("peek");return}if(!state.list)return;state.list=false;drawer().dataset.open="0";$("#v-map").dataset.list="0";$("#t-list").setAttribute("aria-pressed","false");map.resize();lightPin(null)}
/* #steps: sul telefono dentro il cassetto, su desktop nella testata */
function placeSteps(){const st=$("#steps"),dr=drawer();if(PHONE()){dr.querySelector(".dr-steps").append(st);dr.dataset.open="1";if(!dr.dataset.detent)dr.dataset.detent="peek";$("#v-map").dataset.detent=dr.dataset.detent;renderHead()}
  else{$(".map-ui").insertBefore(st,$("#near-hint"));if(state.list){dr.dataset.open="1";renderHead();renderRows()}else{dr.dataset.open="0";$("#v-map").dataset.list="0"}}
  applyDetent()}
/* trascinamento della maniglia e della testata: segue il dito, al rilascio la tappa più vicina (o la successiva se veloce) */
function dragDrawer(){const dr=drawer();let st=null,moved=false;
  const down=ev=>{if(!PHONE()||ev.button>0)return;st={y:ev.clientY,t:performance.now(),dy0:parseFloat(dr.style.getPropertyValue("--dy"))||0,id:ev.pointerId,last:[[ev.clientY,performance.now()]],el:ev.currentTarget};moved=false};
  const move=ev=>{if(!st||ev.pointerId!==st.id)return;const d=ev.clientY-st.y;if(!moved&&Math.abs(d)<6)return;
    if(!moved){moved=true;dr.classList.add("dragging");try{st.el.setPointerCapture(st.id)}catch(e){}}
    const full=dr.offsetHeight,minDy=0,maxDy=full-detentPx("peek");applyDetent(Math.max(minDy,Math.min(maxDy,st.dy0+d)));
    st.last.push([ev.clientY,performance.now()]);if(st.last.length>6)st.last.shift()};
  const up=ev=>{if(!st||ev.pointerId!==st.id)return;const s0=st;st=null;dr.classList.remove("dragging");if(!moved)return;
    const a=s0.last[0],b=s0.last[s0.last.length-1],v=(b[0]-a[0])/Math.max(1,b[1]-a[1]);
    const full=dr.offsetHeight,vis=full-(parseFloat(dr.style.getPropertyValue("--dy"))||0),order=["peek","half","full"],hs=order.map(detentPx);
    let i=hs.reduce((bi,hh,k)=>Math.abs(hh-vis)<Math.abs(hs[bi]-vis)?k:bi,0);
    if(Math.abs(v)>.6){const cur=order.indexOf(dr.dataset.detent);i=Math.max(0,Math.min(2,(v<0?Math.max(cur,hs.findIndex(x=>x>=vis)-1)+1:Math.min(cur,hs.findLastIndex(x=>x<=vis)+1)-1)))}
    const was=dr.dataset.detent;setDetent(order[i]);if(order[i]===was)applyDetent()};
  for(const el of [dr.querySelector(".grab"),$("#ml-head"),$("#dr-count")]){el.addEventListener("pointerdown",down);el.addEventListener("pointermove",move);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up)}
  /* un tocco dopo un trascinamento non preme i bottoni della testata */
  dr.addEventListener("click",ev=>{if(moved){moved=false;ev.stopPropagation();ev.preventDefault()}},true);
  /* tocco sulla maniglia: tappa successiva (peek, half, full, poi di nuovo peek) */
  dr.querySelector(".grab").addEventListener("click",()=>{const o=["peek","half","full"],d=dr.dataset.detent||"peek";setDetent(o[(o.indexOf(d)+1)%3]);if(state.list)fitTo(filtered())})}
function lightPin(id){markers.forEach(m=>m.el.btn.dataset.sel=m.p.id===id?"1":"0");declutter()}
function lightRow(id){$$("#mlist-body .row").forEach(r=>r.dataset.on=r.dataset.id===id?"1":"0")}
/* la riga più vicina al centro del foglio accende il suo pin */
function syncFromList(){if(!state.list||Date.now()<listLock)return;const ml=body(),rows=$$("#mlist-body .row");if(!rows.length)return;
  const r0=ml.getBoundingClientRect(),bot=PHONE()?Math.min(r0.bottom,drawer().getBoundingClientRect().top+drawerVis()):r0.bottom,cy=(r0.top+bot)/2;let best=null,bd=1e9;
  for(const r of rows){const b=r.getBoundingClientRect();const d=Math.abs(b.top+b.height/2-cy);if(d<bd){bd=d;best=r}}
  if(ml.scrollTop<4)best=rows[0];
  if(best){lightRow(best.dataset.id);lightPin(best.dataset.id)}}
/* tocco su un pin con l'elenco aperto: l'elenco scorre alla riga */
function pinToRow(p){const r=$(`#mlist-body .row[data-id="${p.id}"]`);if(!r)return false;listLock=Date.now()+900;
  lightRow(p.id);lightPin(p.id);r.scrollIntoView({behavior:App.REDUCED?"auto":"smooth",block:"center"});return true}

/* margini della camera: in alto sotto le briciole, in basso sopra il cassetto visibile (telefono) */
function padUI(){const wide=!PHONE(),ui=$(".map-ui").getBoundingClientRect().bottom;
  const db=wide?0:parseFloat(getComputedStyle(drawer()).bottom)||0,bottom=wide?40:Math.round(db+drawerVis()+16);
  /* a peek 40 px in più in basso (un sigillo o un pin), così niente finisce sotto il bordo del cassetto */
  const peek=!wide&&(drawer().dataset.detent||"peek")==="peek";
  const top=Math.min(Math.round(ui+16),Math.round(innerHeight*.55));return{top,bottom:bottom+(peek?40:0),left:30,right:wide?40:30,ui}}
function fitTo(ps){if(!map||!ps.length)return;const wide=!PHONE(),pd=padUI();
  /* in alto: fondo delle briciole + 8 px + mezzo pin scelto (17 px × 1,15 + 4 di sollevamento, arrotondato a 28: fitBounds conta il punto, non il disegno) */
  let top=Math.min(Math.round(pd.ui+8+52),Math.round(innerHeight*.55)),bottom=pd.bottom,right=wide?440:30,left=wide?40:30;
  const room=innerHeight-top-bottom;if(room<90)top=Math.max(20,top-(90-room)); // REVIEW: su schermi bassi lo spazio tra striscia e foglio è poco: alzo il padding in alto
  if(ps.length===1){map.easeTo({center:[ps[0].lng,ps[0].lat],zoom:15,padding:{top,bottom,left,right},duration:DUR(900)});return}
  let w=180,e=-180,s=90,n=-90;for(const p of ps){w=Math.min(w,p.lng);e=Math.max(e,p.lng);s=Math.min(s,p.lat);n=Math.max(n,p.lat)}
  map.fitBounds([[w,s],[e,n]],{padding:{top,bottom,left,right},maxZoom:15,duration:DUR(1200),essential:true,pitch:0,bearing:0})}

function refresh(){const ok=new Set(filtered().map(p=>p.id));markers.forEach(m=>m.el.dataset.dim=ok.has(m.p.id)?"0":"1");
  $("#map-count").textContent=ok.size+" "+t("filter.count");renderHead();
  cityMarkers.forEach(m=>{const n=App.data.places.filter(p=>m.c.cities.includes(p.city)&&ok.has(p.id)).length;m.el.querySelector(".mono").textContent=n});
  sealMarkers.forEach(m=>{const n=App.data.places.filter(p=>p.zone===m.z.id&&ok.has(p.id)).length;m.el.dataset.n=n;m.el.querySelector(".mono").textContent=n;m.n=n});
  if(map)declutter()}

function showHint(){const hb=$("#near-hint");hb.hidden=!(state.nearMode||state.locating);hb.textContent=t(state.locating?"filter.near.locating":"filter.near.hint")}
/* "Vicino a me": sul telefono un quadrato da 48 px con la bussola (il testo diventa aria-label), su desktop la parola come prima */
function nearTool(){for(const b of $$("#t-near")){const txt=state.locating?t("filter.near.locating"):state.nearMode?t("map.near.tap"):state.near?t("map.near.on"):t("filter.near");
  b.dataset.state=state.locating?"locating":state.near?"locked":state.nearMode?"tap":"idle";b.setAttribute("aria-pressed",String(state.nearMode||state.locating||!!state.near));
  if(PHONE()){b.classList.add("t-ico");b.setAttribute("aria-label",txt);b.innerHTML=(window.ICONS||{}).compass||"";b.firstElementChild&&b.firstElementChild.setAttribute("aria-hidden","true")}
  else{b.classList.remove("t-ico");b.removeAttribute("aria-label");b.textContent=state.near?t("filter.near.clear"):t("filter.near")}}}
function clearNear(){stopWatch();state.gps=false;state.near=null;state.nearMode=false;if(state.sort==="near")state.sort="pick";if(meMarker){meMarker.remove();meMarker=null}showHint();nearTool();refresh();if(state.list)openList()}
/* GPS continuo (piano 18/10): dopo il primo fix si segue la posizione finché la Mappa è aperta; precisione come anello */
let watchId=null,acc=null;
function stopWatch(){if(watchId!=null){try{navigator.geolocation.clearWatch(watchId)}catch(e){}watchId=null}}
function startWatch(){if(watchId!=null||!navigator.geolocation)return;
  try{watchId=navigator.geolocation.watchPosition(g=>{const ll={lat:g.coords.latitude,lng:g.coords.longitude};if(!IN_JAPAN(ll)||!state.gps)return;acc=g.coords.accuracy;if(App.setPos)App.setPos(ll);moveNear(ll)},()=>{},{enableHighAccuracy:true,maximumAge:5000,timeout:15000})}catch(e){}}
/* anello di precisione: diametro = accuracy in metri portata in pixel allo zoom corrente, tra 28 e 160 px; oltre 150 m niente anello */
function ringSize(){if(!meMarker)return;const ring=meMarker.getElement().querySelector(".me-ring");if(!ring)return;
  if(acc==null||acc>150){ring.hidden=true;return}const ll=meMarker.getLngLat(),a=map.project(ll),b=map.project([ll.lng,ll.lat+acc/110540]);
  const d=Math.max(28,Math.min(160,Math.round(Math.abs(a.y-b.y))));ring.hidden=false;ring.style.width=ring.style.height=d+"px"}
function meEl(){return h("div",{class:"me-m","aria-label":t("filter.near.set"),role:"img"},h("div",{class:"me-in"},h("span",{class:"me-ring",hidden:true}),h("span",{class:"me-dot"})))}
/* nuovo fix: il pallino scivola (translate 300 ms, FLIP sul contenuto del marker), ordine e timbrini si ricalcolano, l'elenco non salta né rifà l'inquadratura */
function moveNear(ll){if(!meMarker){setNear(ll,false);return}const old=map.project(meMarker.getLngLat()),nw=map.project([ll.lng,ll.lat]),inn=meMarker.getElement().querySelector(".me-in");
  state.near={lat:ll.lat,lng:ll.lng};meMarker.setLngLat([ll.lng,ll.lat]);ringSize();
  if(inn&&!App.REDUCED){inn.style.transition="none";inn.style.translate=(old.x-nw.x)+"px "+(old.y-nw.y)+"px";
    requestAnimationFrame(()=>requestAnimationFrame(()=>{inn.style.transition="translate .3s ease-out";inn.style.translate="0px 0px"}))}
  refresh();if(state.list){const b=body(),y=b.scrollTop;renderHead();renderRows();b.scrollTop=y;requestAnimationFrame(syncFromList)}}
/* posizione scelta (GPS o tocco sulla mappa): pallino, ordine "Vicino a te", elenco riordinato; a elenco chiuso la mappa ci vola */
function setNear(ll,fly){state.near={lat:ll.lat,lng:ll.lng};state.nearMode=false;state.locating=false;state.sort="near";showHint();
  if(meMarker)meMarker.remove();meMarker=new maplibregl.Marker({element:meEl()}).setLngLat([ll.lng,ll.lat]).addTo(map);ringSize();
  nearTool();refresh();if(state.list)openList();else if(fly)map.flyTo({center:[ll.lng,ll.lat],zoom:Math.max(map.getZoom(),14.5),duration:App.REDUCED?0:1200,essential:true})}
/* "Vicino a me": prima il GPS (8 s, precisione normale); se negato, fallito o fuori dal Giappone resta il tocco sulla mappa */
// REVIEW: una posizione fuori dal Giappone (es. dall'Italia prima del viaggio) non serve all'ordine per distanza: si passa al tocco sulla mappa
const IN_JAPAN=ll=>ll.lng>122&&ll.lng<154&&ll.lat>24&&ll.lat<46;
function askNear(){if(state.near){clearNear();return}if(state.nearMode||state.locating){state.nearMode=false;state.locating=false;showHint();nearTool();return}
  const tap=()=>{if(!state.locating)return;state.locating=false;state.nearMode=true;showHint();nearTool()};
  const G=navigator.geolocation;if(!G){state.locating=true;tap();return}
  state.locating=true;showHint();nearTool();
  try{G.getCurrentPosition(g=>{if(!state.locating)return;const ll={lat:g.coords.latitude,lng:g.coords.longitude};if(!IN_JAPAN(ll)){tap();return}
    acc=g.coords.accuracy;state.gps=true;if(App.setPos)App.setPos(ll);setNear(ll,true);startWatch()},tap,{timeout:8000,enableHighAccuracy:false,maximumAge:3e5})}catch(e){tap()}}

// REVIEW: con la striscia delle zone il margine alto segue l'altezza dell'interfaccia (padUI), se no la città finisce sotto le foto
function flyLevel(l){const pd=padUI(),top=l===LEVELS[0]?Math.min(170,innerHeight*.25):pd.top;map.fitBounds(l.b,{padding:{top,bottom:PHONE()?pd.bottom:110,left:30,right:30},duration:DUR(1600),essential:true,pitch:0,bearing:0})}

// REVIEW: i sigilli di zona stanno solo nella fascia media (6,8-12); da lontano restano i sigilli delle città, se no Tokyo sarebbe una pila di timbri
/* fasce di zoom: lontano (sigilli delle città), medio sotto 12 (sigilli di carta delle zone), città (pin da 26 px, sparpagliati, nomi delle zone), strada da 14 (pin da 34 px e nomi) */
// REVIEW: le carte tornano anche riallontanandosi sotto zoom 7, non solo con la ×; da zoomati al passo 1 la × compare nelle briciole, vedi Problemi
/* passo 1 (carte delle città): spariscono appena si avvicina oltre zoom 7; la × delle briciole riporta al Giappone e le fa tornare */
/* nomi delle stazioni (cartografia, kanji ammessi): da zoom 12,5 le stazioni con almeno 3 linee, da 14 tutte quelle nel riquadro (+10 %);
   marker creati e tolti a moveend, mai più di 80 vivi */
let ST=null;const stLbl=new Map();
function stationLabels(){if(!map||!ST)return;const z=map.getZoom(),want=new Map();
  if(z>=12.5){const b=map.getBounds(),dw=(b.getEast()-b.getWest())*.1,dh=(b.getNorth()-b.getSouth())*.1;
    for(const f of ST){const [x,y]=f.geometry.coordinates,r=f.properties.r||1;if(z<14&&r<3)continue;
      if(x<b.getWest()-dw||x>b.getEast()+dw||y<b.getSouth()-dh||y>b.getNorth()+dh)continue;want.set(f.properties.ja+"|"+x+"|"+y,f)}
    if(want.size>80){const c=map.getCenter(),k=[...want.entries()].sort((a,b)=>(b[1].properties.r-a[1].properties.r)||(Math.hypot(a[1].geometry.coordinates[0]-c.lng,a[1].geometry.coordinates[1]-c.lat)-Math.hypot(b[1].geometry.coordinates[0]-c.lng,b[1].geometry.coordinates[1]-c.lat))).slice(0,80);want.clear();for(const [kk,f] of k)want.set(kk,f)}}
  for(const [k,m] of stLbl)if(!want.has(k)){m.remove();stLbl.delete(k)}
  for(const [k,f] of want)if(!stLbl.has(k)){const el=h("button",{type:"button",class:"st-lbl",lang:"ja",tabindex:"-1","aria-hidden":"true"},f.properties.ja);
    stLbl.set(k,new maplibregl.Marker({element:el,anchor:"top",offset:[0,7]}).setLngLat(f.geometry.coordinates).addTo(map))}}
function zoomedIn(){const on=map.getZoom()>7,v=$("#v-map");if((v.dataset.zoomed==="1")!==on){v.dataset.zoomed=on?"1":"0";if(step()===1){renderCrumbs();if(PHONE())applyDetent()}}}
function zoomClass(){zoomedIn();const z=map.getZoom(),el=$("#map");el.dataset.z11=z>=11?"1":"0";const c=z<6.8?"far":z<12?"mid":z<14?"city":"street";if(el.dataset.z!==c){el.dataset.z=c;declutter()}}
/* collisioni semplici a griglia: gli elementi arrivano in ordine di importanza, chi tocca un rettangolo già tenuto si nasconde */
function grid(G=64){const cells=new Map(),key=(x,y)=>x+"/"+y;
  const each=(r,fn)=>{for(let x=Math.floor(r.left/G);x<=Math.floor(r.right/G);x++)for(let y=Math.floor(r.top/G);y<=Math.floor(r.bottom/G);y++)if(fn(key(x,y)))return true;return false};
  return{hits:r=>each(r,k=>(cells.get(k)||[]).some(o=>!(r.right<=o.left||r.left>=o.right||r.bottom<=o.top||r.top>=o.bottom))),
    add:r=>{each(r,k=>{let a=cells.get(k);if(!a)cells.set(k,a=[]);a.push(r)})}}}
/* misure (piano 18/10, prestazioni): niente getBoundingClientRect a ogni moveend. Le posizioni vengono da map.project,
   le misure di ogni elemento si leggono una volta (offsetWidth/Height) e restano in cache */
const SZ=new WeakMap();
function size(el){let s=SZ.get(el);if(!s){s={w:el.offsetWidth,h:el.offsetHeight};if(s.w)SZ.set(el,s)}return s}
function rectAt(pt,w,h,ax,ay,ox=0,oy=0){const left=pt.x+ox-w*ax,top=pt.y+oy-h*ay;return{left,top,right:left+w,bottom:top+h}}
let baseMarkers=[];
/* culling: i pin fuori dal riquadro allargato del 20 % escono dal disegno (data-off) */
function cull(){const b=map.getBounds(),dw=(b.getEast()-b.getWest())*.2,dh=(b.getNorth()-b.getSouth())*.2,W=b.getWest()-dw,E=b.getEast()+dw,S=b.getSouth()-dh,N=b.getNorth()+dh;
  for(const m of markers){const off=m.p.lng<W||m.p.lng>E||m.p.lat<S||m.p.lat>N?"1":"0";if(m.el.dataset.off!==off)m.el.dataset.off=off}}
function declutter(){if(!map)return;const z=$("#map").dataset.z;cull();
  if(z==="city"){const g=grid();for(const zm of zoneMarkers){const el=zm.getElement();el.style.visibility="visible";const s=size(el),r=rectAt(map.project(zm.getLngLat()),s.w,s.h,.5,1,0,-16);if(g.hits(r))el.style.visibility="hidden";else g.add(r)}}
  spread(z==="city");
  /* sigilli di carta delle zone: mai sovrapposti; in ordine di posti, chi sta a meno di 44 px da un sigillo già tenuto si nasconde */
  if(z==="mid"){const kept=[];for(const m of sealMarkers.slice().sort((a,b)=>(b.n||0)-(a.n||0))){m.el.dataset.hide="0";if(!m.n)continue;
      const pt=map.project([m.z.lng,m.z.lat]);if(kept.some(q=>Math.hypot(q.x-pt.x,q.y-pt.y)<44)){m.el.dataset.hide="1";continue}kept.push(pt)}}
  if(z==="street"){const g=grid(),W=innerWidth,H=innerHeight,vis=[];
    for(const m of markers){if(m.el.dataset.dim==="1"||m.el.dataset.off==="1")continue;const pt=map.project([m.p.lng,m.p.lat]),sel=m.el.btn.dataset.sel==="1",d=sel?39:34,r=rectAt(pt,d,d,.5,.5);
      m.pt=pt;if(r.right<0||r.left>W||r.bottom<0||r.top>H){m.el.pl.dataset.hide="1";continue}g.add(r);vis.push(m)}
    for(const bm of baseMarkers){const s=size(bm.el);if(!s.w)continue;g.add(rectAt(map.project(bm.m.getLngLat()),s.w,s.h,.5,.5))}
    vis.sort((a,b)=>(b.el.btn.dataset.sel==="1")-(a.el.btn.dataset.sel==="1")||pickRank(a.p)-pickRank(b.p));
    /* vicino al bordo destro il nome va a sinistra del pin */
    for(const m of vis){const pl=m.el.pl;pl.dataset.hide="0";const fl=m.pt.x>W-140;pl.classList.toggle("flip",fl);const s=size(pl),r=fl?rectAt(m.pt,s.w,s.h,1,.5,-21):rectAt(m.pt,s.w,s.h,0,.5,21);if(g.hits(r))pl.dataset.hide="1";else g.add(r)}}}

/* zoom città (12-14): pin a meno di 22 px l'uno dall'altro si allontanano di 12 px dal centro del loro gruppo; solo visuale, rifatto a ogni moveend */
function spread(on){const vis=[];for(const m of markers){const show=on&&m.el.dataset.dim!=="1"&&m.el.dataset.off!=="1";
    if(!show){if(m.off){m.m.setOffset([0,0]);m.off=null}continue}const pt=map.project([m.p.lng,m.p.lat]);vis.push({m,x:pt.x,y:pt.y})}
  if(!on)return;const W=innerWidth,H=innerHeight,par=vis.map((_,i)=>i),find=i=>par[i]===i?i:(par[i]=find(par[i]));
  const on2=vis.filter(v=>v.x>-40&&v.x<W+40&&v.y>-40&&v.y<H+40),idx=new Map(vis.map((v,i)=>[v,i]));
  for(let i=0;i<on2.length;i++)for(let j=i+1;j<on2.length;j++){const a=on2[i],b=on2[j];if(Math.abs(a.x-b.x)<22&&Math.hypot(a.x-b.x,a.y-b.y)<22){par[find(idx.get(a))]=find(idx.get(b))}}
  const groups=new Map();vis.forEach((v,i)=>{const r=find(i);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(v)});
  for(const g of groups.values()){if(g.length<2){const m=g[0].m;if(m.off){m.m.setOffset([0,0]);m.off=null}continue}
    const cx=g.reduce((s,v)=>s+v.x,0)/g.length,cy=g.reduce((s,v)=>s+v.y,0)/g.length;
    g.forEach((v,i)=>{let dx=v.x-cx,dy=v.y-cy,d=Math.hypot(dx,dy);if(d<1){const a=2*Math.PI*i/g.length;dx=Math.cos(a);dy=Math.sin(a);d=1}
      v.m.off=[Math.round(12*dx/d),Math.round(12*dy/d)];v.m.m.setOffset(v.m.off)})}}
App.initMap=function(){if(map){map.resize();return}try{initMapInner()}catch(err){console.error(err);const c=$("#map-count");c.textContent=(App.lang==="it"?"Mappa non disponibile: ":"Map unavailable: ")+err.message}};
function diag2(msg){console.log(msg)}
function diag(msg){const c=$("#map-count");if(c&&!c.dataset.ok)c.textContent=msg}
addEventListener("error",e=>diag("err: "+(e.message||e.error)));addEventListener("unhandledrejection",e=>diag("rej: "+(e.reason&&e.reason.message||e.reason)));
function initMapInner(){
  const D=App.data,c0=carta(),p={...App.palette()};
  map=new maplibregl.Map({container:"map",attributionControl:false,bounds:LEVELS[0].b,fitBoundsOptions:{padding:{top:Math.min(170,innerHeight*.25),bottom:90,left:20,right:20}},minZoom:3.8,maxZoom:17.5,maxBounds:[[118,20],[156,50]],dragRotate:false,pitchWithRotate:false,touchPitch:false,
    style:{version:8,sources:{japan:{type:"geojson",data:D.japan,tolerance:.6},wards:{type:"geojson",data:{type:"FeatureCollection",features:[]},tolerance:.6,maxzoom:14},rail:{type:"geojson",data:D.rail},
        "japan-edge":{type:"geojson",data:edgesOnce(D.japan),tolerance:.6},"wards-edge":{type:"geojson",data:{type:"FeatureCollection",features:[]},tolerance:.6,maxzoom:14},"zone-halo":{type:"geojson",data:EMPTY}},
      // REVIEW: niente fiumi (--prussian al 25 %): in geo/*.json non c'è acqua interna, servirebbe un dato nuovo (vedi Problemi)
      /* le coste sono una linea sotto il riempimento: dentro la terra la copre, verso il mare ne resta 1 px; i confini interni spariscono */
      layers:[{id:"bg",type:"background",paint:{"background-color":c0.sea}},
        /* linea d'acqua delle carte incise: un filo parallelo alla costa, 4 px al largo */
        {id:"japan-wl",type:"line",source:"japan-edge",maxzoom:9,layout:{"line-join":"round"},paint:{"line-color":rgba(c0.ink,.14),"line-width":.8,"line-gap-width":8}},
        {id:"wards-wl",type:"line",source:"wards-edge",minzoom:8.5,layout:{"line-join":"round"},paint:{"line-color":rgba(c0.ink,.14),"line-width":.8,"line-gap-width":8}},
        {id:"japan-coast",type:"line",source:"japan-edge",maxzoom:9,layout:{"line-join":"round"},paint:{"line-color":rgba(c0.ink,.35),"line-width":3.5}},
        {id:"wards-coast",type:"line",source:"wards-edge",minzoom:8.5,layout:{"line-join":"round"},paint:{"line-color":rgba(c0.ink,.35),"line-width":3.5}},
        {id:"japan-fill",type:"fill",source:"japan",maxzoom:9,paint:{"fill-color":c0.land,"fill-antialias":false}},
        {id:"wards-fill",type:"fill",source:"wards",minzoom:6,paint:{"fill-color":c0.land,"fill-antialias":false}},
        /* filo color carta sui bordi: chiude le fessure tra prefetture semplificate e lascia 1 px di costa verso il mare */
        {id:"japan-seam",type:"line",source:"japan-edge",maxzoom:9,layout:{"line-join":"round"},paint:{"line-color":c0.land,"line-width":1.5}},
        {id:"wards-seam",type:"line",source:"wards-edge",minzoom:8.5,layout:{"line-join":"round"},paint:{"line-color":c0.land,"line-width":1.5}},
        {id:"wards-line",type:"line",source:"wards",minzoom:9.5,paint:{"line-color":rgba(c0.ink,.18),"line-width":.8,"line-dasharray":[3,3]}},
        /* alone della zona scelta: un cerchio di radiusKm, carta più scura e filo tratteggiato, tra zoom 10 e 14,5 con dissolvenza */
        {id:"zone-halo-fill",type:"fill",source:"zone-halo",minzoom:9.5,maxzoom:15,paint:{"fill-color":c0.paper3,"fill-opacity":["interpolate",["linear"],["zoom"],9.5,0,10,.18,14,.18,14.5,0]}},
        {id:"zone-halo-line",type:"line",source:"zone-halo",minzoom:9.5,maxzoom:15,paint:{"line-color":rgba(c0.ink,.35),"line-width":1.2,"line-dasharray":[4,4],"line-opacity":["interpolate",["linear"],["zoom"],9.5,0,10,1,14,1,14.5,0]}},
        {id:"rail-metro",type:"line",source:"rail",minzoom:8.8,filter:["all",["==",["get","kind"],"metro"],["!",isJR]],layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":railColor(c0.ink),"line-opacity":railOpacity(.5),"line-width":1}},
        {id:"rail-jr",type:"line",source:"rail",minzoom:7,filter:isJR,layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":railColor(c0.ink),"line-opacity":railOpacity(1),"line-width":1.5}},
        {id:"shk",type:"line",source:"rail",filter:["==",["get","kind"],"shinkansen"],layout:{"line-join":"round"},paint:{"line-color":c0.shu,"line-width":2,"line-dasharray":[3,2]}}]}});
  /* il contatore resta su "Disegno la mappa…" fino al caricamento: niente parole di diagnostica (style, src, idle) */
  App.mapObj=map;App.mapT0=performance.now();
  map.on("load",()=>{App.loadMs=Math.round(performance.now()-App.mapT0);try{onLoad();$("#map-count").dataset.ok="1";refresh()}catch(err){console.error(err);$("#map-count").textContent="⚠ load: "+err.message+" "+String(err.stack||"").split("\n")[1]}});
  function onLoad(){
    /* niente rotazione né inclinazione: la carta resta col nord in alto, nessuna bussola */
    map.touchZoomRotate.disableRotation();map.keyboard.disableRotation&&map.keyboard.disableRotation();
    /* quartieri subito, i loro bordi (edgesOnce, il calcolo pesante) quando il telefono è libero */
    const t0=performance.now(),idle=window.requestIdleCallback?f=>requestIdleCallback(f,{timeout:1200}):f=>setTimeout(f,300);
    setTimeout(()=>{map.getSource("wards").setData(D.wards);idle(()=>{map.getSource("wards-edge").setData(edgesOnce(D.wards));diag2("wards "+Math.round(performance.now()-t0)+"ms")})},50);
    fetch("geo/stations.json?v="+(window.SITE_V||"1")).then(r=>r.json()).then(st=>{ST=st.features;map.addSource("stations",{type:"geojson",data:st});
      map.addLayer({id:"stations",type:"circle",source:"stations",minzoom:12,paint:{"circle-radius":["interpolate",["linear"],["zoom"],12,2.5,16,5],"circle-color":c0.land,"circle-stroke-color":c0.ink,"circle-stroke-width":1.2}});paint();stationLabels()});
    /* strade e acque: sotto le ferrovie (e quindi sotto stazioni e pin), sopra la terra e l'alone */
    Promise.all(["roads","water"].map(n=>fetch("geo/"+n+".json?v="+(window.SITE_V||"1")).then(r=>r.json()))).then(([rd,wa])=>{
      map.addSource("roads",{type:"geojson",data:rd,tolerance:.5});map.addSource("water",{type:"geojson",data:wa,tolerance:.5});
      for(const l of cityLayers(carta()))map.addLayer(l,"rail-metro");paint()}).catch(e=>console.warn("city geo",e));
    paint();
    // places
    for(const pl of D.places){const el=pinFor(pl);const m=new maplibregl.Marker({element:el,anchor:"center"}).setLngLat([pl.lng,pl.lat]).addTo(map);markers.push({m,el,p:pl})}
    // bases
    for(const b of D.bases){if(b.type!=="home"&&!["narita-t2","haneda-t3","st-shinjuku","st-shin-osaka","st-kyoto","st-tokyo"].includes(b.id))continue;
      const td=todayInfo(),now=td&&b.type==="home"&&td.home&&td.home.id===b.id;
      const el=h("button",{class:"pin "+(b.type==="home"?"home":"station")+(now?" now":td&&b.type==="home"?" later":""),type:"button","aria-label":L(b.name),lang:"ja",title:L(b.name)},b.type==="home"?"家":b.type==="airport"?"空":"駅",
        now?h("span",{class:"home-l","aria-hidden":"true",lang:App.lang},t("map.home")):null);
      el.addEventListener("click",ev=>{ev.stopPropagation();App.openSheet(h("div",{class:"sh-body"},h("div",{class:"sh-title"},h("p",{class:"eyebrow"},b.type==="home"?t("phases.stay"):""),h("h2",{id:"sheet-title"},L(b.name)),h("div",{class:"ja",lang:"ja"},b.name.ja)),
        b.note?h("p",{class:"lede"},L(b.note)):null,h("a",{class:"maps-btn",target:"_blank",rel:"noopener",href:`https://www.google.com/maps/search/?api=1&query=${b.lat},${b.lng}`,html:App.ICON.pin+"<span>"+t("sheet.maps")+"</span>"})))});
      const bm=new maplibregl.Marker({element:el,anchor:"center"}).setLngLat([b.lng,b.lat]).addTo(map);bm.getElement().classList.add("base-m");baseMarkers.push({m:bm,el})}
    // city seals (far)
    for(const c of CITY_SEALS){const el=h("button",{class:"city-seal",type:"button","aria-label":c.name},h("b",{},c.name),h("span",{class:"jp",lang:"ja","aria-hidden":"true"},c.jp),h("span",{class:"mono"},""));
      el.addEventListener("click",ev=>{ev.stopPropagation();setCity(c.id)});const m=new maplibregl.Marker({element:el}).setLngLat([c.lng,c.lat]).addTo(map);cityMarkers.push({m,el,c})}
    // zone labels
    for(const z of D.zones.slice().sort((a,b)=>D.places.filter(p=>p.zone===b.id).length-D.places.filter(p=>p.zone===a.id).length)){const tdz=todayInfo(),el=h("button",{class:"zone-lbl",type:"button","aria-label":L(z.name),"data-home":tdz&&tdz.zone&&tdz.zone.id===z.id?"1":null},h("b",{},zoneShort(z)),h("span",{lang:"ja","aria-hidden":"true"},zoneKanji(z)));
      el.addEventListener("click",ev=>{ev.stopPropagation();zoneSheet(z)});const m=new maplibregl.Marker({element:el,anchor:"bottom",offset:[0,-16]}).setLngLat([z.lng,z.lat]).addTo(map);zoneMarkers.push(m)}
    // REVIEW: i nomi oltre 8 lettere si rimpiccioliscono fino a 8 px per stare nel tondo da 56 px (Shimokitazawa), vedi Problemi
    /* sigillo di carta della zona (sotto zoom 12): nome latino e numero dei posti; tocco = vola alla zona, come la striscia */
    for(const z of D.zones){const nm=sealName(z),len=Math.max(...nm.split(" ").map(w=>w.length));const el=h("button",{class:"zone-seal",type:"button","aria-label":zoneShort(z)},h("b",{style:len>8?{fontSize:Math.max(10,Math.round(880/len)/10)+"px"}:null},nm),h("span",{class:"mono"},""));
      el.addEventListener("click",ev=>{ev.stopPropagation();flyZone(z)});const m=new maplibregl.Marker({element:el}).setLngLat([z.lng,z.lat]).addTo(map);sealMarkers.push({m,el,z,n:0})}
    zoomClass();refresh();
    /* telefono: il Giappone si inquadra sopra il cassetto (le opzioni iniziali della mappa non lo conoscono) */
    if(!restoreState()){saveState();if(PHONE()){NOANIM=true;try{flyLevel(LEVELS[0])}finally{NOANIM=false}}}
    }
  map.on("zoom",zoomClass);
  map.on("moveend",()=>{const t0=performance.now();declutter();stationLabels();perf.lastMoveMs=performance.now()-t0;perf.n++});
  map.on("zoom",ringSize);
  /* il GPS si ferma lasciando la Mappa e riparte al ritorno se la posizione veniva dal GPS */
  document.addEventListener("view",ev=>{if(ev.detail==="map"){if(state.gps&&state.near)startWatch()}else stopWatch()});
  map.on("click",ev=>{if(!state.nearMode)return;state.gps=false;acc=null;setNear({lat:ev.lngLat.lat,lng:ev.lngLat.lng},true)});
  const css=document.createElement("style");css.textContent=`
    .pm{padding:9px;display:grid;place-items:center}
    .pm[data-dim="1"],.pm[data-off="1"]{display:none}
    .zone-lbl b,.zone-lbl span{white-space:nowrap}
    #map[data-z="far"] .pm, #map[data-z="far"] .zone-lbl, #map[data-z="far"] .zone-seal, #map[data-z="far"] .base-m.station{display:none}
    #map:not([data-z="far"]) .city-seal{display:none}
    #map:not([data-z="mid"]) .zone-seal{display:none}
    #map[data-z="mid"] .zone-lbl, #map[data-z="street"] .zone-lbl{display:none}
    #map[data-z="city"] .zone-lbl{z-index:2}
    /* zoom medio: i pin con una zona stanno nel sigillo; restano i posti senza zona, piccoli */
    #map[data-z="mid"] .pm[data-zone]{display:none}
    #map[data-z="mid"] .pin:not(.home):not(.station){width:18px;height:18px;border-width:1.5px;font-size:0;border-radius:4px}
    #map[data-z="mid"] .pin:not(.home):not(.station) .pi{width:11px;height:11px}
    #map[data-z="mid"] .pin.discover::before{display:none}
    /* zoom città: pin da 26 px, icona da 15 */
    /* REVIEW: il piano dice 34 px; a zoom 11-14 i 25 posti di Shinjuku stanno in 50 px e si coprono, quindi 26 px in città e 34 da 14 in su */
    #map[data-z="city"] .pin:not(.home):not(.station){width:26px;height:26px;border-radius:5px;font-size:.8rem}
    #map[data-z="city"] .pin:not(.home):not(.station) .pi{width:15px;height:15px}
    #map[data-z="city"] .pin.discover::before{width:10px;height:10px;border-top-right-radius:5px}
    #map[data-z="street"] .pm .pl{display:block}
    /* con l'elenco aperto o un posto scelto i pin restano interi anche da lontano, così la sincronia si vede */
    #v-map[data-list="1"] #map[data-z="mid"] .pm[data-zone]:not([data-dim="1"]),#v-map #map .pm:has(.pin[data-sel="1"]){display:grid}
    #v-map[data-list="1"] #map .zone-seal{display:none}
    #v-map[data-list="1"] #map .pm .pin:not(.home):not(.station),#v-map #map .pm .pin[data-sel="1"]{width:34px;height:34px;font-size:1rem}
    #v-map[data-list="1"] #map .pm .pin:not(.home):not(.station) .pi,#v-map #map .pm .pin[data-sel="1"] .pi{width:18px;height:18px}
    #v-map[data-list="1"] #map .pm .pin.discover::before{display:block}
    #v-map #map .pm .pin[data-sel="1"]{z-index:3;box-shadow:0 0 0 2px var(--paper),0 0 0 4px var(--shu),0 6px 10px -4px rgba(0,0,0,.4)}
    #v-map #map .pm:has(.pin[data-sel="1"]){z-index:5}
`;
  document.head.append(css);
  renderCrumbs();renderSteps();nearTool();placeSteps();dragDrawer();
  /* la tela segue ogni cambio di misura del contenitore e della testata (pannello destro aperto o chiuso su desktop) */
  if(window.ResizeObserver){const ro=new ResizeObserver(()=>map.resize());ro.observe($("#map"));ro.observe($(".map-ui"))}
  PHONEQ.addEventListener("change",()=>{placeSteps();renderCrumbs();nearTool()});addEventListener("resize",()=>{if(PHONE())applyDetent()});
  $("#t-list").onclick=()=>state.list?closeList():openList();
  $("#t-near").onclick=askNear;
  let raf=0;body().addEventListener("scroll",()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;syncFromList()})},{passive:true});
  document.addEventListener("palette",paint);
  document.addEventListener("langchange",()=>{render();nearTool();if(state.list)openList();markers.forEach(m=>m.el.btn.setAttribute("aria-label",L(m.p.name)))});
  map.on("error",e=>{const msg=e&&e.error&&e.error.message||"";console.warn("map error",msg);if(!map.loaded()){$("#map-count").textContent="⚠ "+msg.slice(0,120)}});
}
})();
