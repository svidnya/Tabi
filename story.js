/* Giappone 2026 — Racconto: "Sei stazioni del Tōkaidō"
   byōbu (six-panel screen), red thread, emakimono of six prints, ema board */
(function(){
"use strict";
const App=window.App,{h,$,$$,REDUCED}=App;
const t=k=>App.t(k),L=o=>App.L(o);
const dayMs=864e5;

/* ───────── data for the screen ───────── */
const PANELS=[
  {id:"vincenzo",name:"Vincenzo",from:"arcs.rome"},
  {id:"genny",name:"Genny",from:"arcs.rome"},
  {id:"andrea",name:"Andrea",from:"arcs.rome"},
  {id:"vivienne",name:"Vivienne",from:"arcs.rome"},
  {id:"simone",name:"Simone",from:"arcs.milan"},
  {id:"mathieu",name:"Mathieu",from:"arcs.goteborg"}];

/* Landscape drawn across the whole screen (viewBox 1200×560).
   Flat shapes, Prussian-blue bokashi at the top, sea with seigaiha, Fuji, pines.
   The red thread starts at three European cities (left), knots at Doha, ends at Narita (right). */
function landscapeSVG(W,part="all"){const X=f=>(f*W).toFixed(1);const Y=560;const lb=t;
  // anchor points (fractions of W). "all": one landscape across six panels. "a"/"b": two complete pictures (phone): departure, arrival.
  const P=part==="all"?{fco:[.06,430],mxp:[.11,352],got:[.14,250],doh:[.47,392],nrt:[.915,300]}
    :part==="a"?{fco:[.1,432],mxp:[.2,352],got:[.3,246],doh:[.8,392]}:{nrt:[.86,300]};
  const pt=k=>X(P[k][0])+" "+P[k][1];
  /* pino: data-r è il suo rettangolo in unità della scena (chioma da -36 a 32, da -59 a 4, per la scala), per tenere i nomi fuori */
  const pine=(x,y,s)=>`<g class="pine" data-r="${(x*W-36*s).toFixed(1)} ${(y-59*s).toFixed(1)} ${(x*W+32*s).toFixed(1)} ${(y+4*s).toFixed(1)}" transform="translate(${X(x)} ${y}) scale(${s})" fill="var(--prussian)"><rect x="-3" y="-30" width="6" height="34"/><ellipse cx="-14" cy="-26" rx="22" ry="6"/><ellipse cx="12" cy="-40" rx="20" ry="6"/><ellipse cx="-6" cy="-54" rx="16" ry="5"/></g>`;
  const cloud=(x,y,w,dx)=>`<g class="cl" style="--dx:${dx}"><g transform="translate(${X(x)} ${y})" fill="url(#gold)" stroke="var(--gold-2)" stroke-width="1"><rect x="0" y="18" width="${w}" height="30" rx="15"/><rect x="${w*.18}" y="4" width="${w*.5}" height="30" rx="15"/><rect x="${w*.42}" y="30" width="${w*.62}" height="30" rx="15"/><rect x="${w*.1}" y="36" width="${w*.5}" height="30" rx="15"/></g></g>`;
  const fuji=(cx,base,top,hw)=>`<path d="M${X(cx-hw)} ${base} L${X(cx-.02)} ${top} Q${X(cx)} ${top-12} ${X(cx+.02)} ${top} L${X(cx+hw)} ${base} Z" fill="url(#fuji)" stroke="var(--prussian)" stroke-opacity=".55" stroke-width="1.5"/>
  <path d="M${X(cx-.018)} ${top+38} l10 -5 8 8 9 -10 9 8 10 -6 6 9" fill="none" stroke="var(--prussian)" stroke-opacity=".5" stroke-width="2"/>`;
  /* nome della città: data-px/py è il punto, data-side il lato preferito; placeLabels lo sposta dentro l'anta */
  const label=(k,key,dy,anchor="middle",dx=0)=>`<text x="${X(P[k][0])+dx}" y="${P[k][1]+dy}" text-anchor="${anchor}" data-city="${key}" data-px="${X(P[k][0])}" data-py="${P[k][1]}" data-side="${anchor==="start"?"right":anchor==="end"?"left":dy<0?"above":"below"}">${lb("arcs."+key)}</text>`;
  let scene="",thread="",dots="",labels="";
  if(part==="all"){
    scene=fuji(.76,340,150,.18)+`${pine(.09,478,1)}${pine(.135,470,.75)}${pine(.87,490,1.05)}`+cloud(-.03,30,W*.26,-120)+cloud(.66,8,W*.3,120)+cloud(.22,400,W*.26,-90)+cloud(.55,318,W*.34,110);
    thread=`<path class="th th-a" d="M${pt("fco")} C${X(.15)} 430 ${X(.28)} 406 ${pt("doh")}"/><path class="th th-b" d="M${pt("mxp")} C${X(.2)} 360 ${X(.32)} 386 ${pt("doh")}"/><path class="th th-c" d="M${pt("got")} C${X(.22)} 290 ${X(.34)} 378 ${pt("doh")}"/><path class="th th-d" d="M${pt("doh")} C${X(.56)} 378 ${X(.64)} 300 ${X(.72)} 300 S${X(.84)} 330 ${pt("nrt")}"/><path class="th th-k" d="M${X(P.doh[0])-8} ${P.doh[1]-6} c6 -6 14 -4 16 4 s-4 14 -12 10 -10 -10 -2 -14" stroke-width="3"/>`;
    dots=["fco","mxp","got","nrt"].map(k=>`<circle cx="${X(P[k][0])}" cy="${P[k][1]}" r="${k==="nrt"?5.5:4}"/>`).join("");
    labels=label("fco","rome",-12)+label("mxp","milan",-12)+label("got","goteborg",-10,"start",8)+label("doh","doha",24)+label("nrt","narita",-12)}
  else if(part==="a"){ // departure: three cities, open sea, the knot at Doha near the right edge
    scene=`${pine(.1,478,1)}${pine(.16,470,.75)}`+cloud(-.03,30,W*.3,-120)+cloud(.62,10,W*.34,120)+cloud(.3,410,W*.3,-90)+cloud(.66,330,W*.36,110);
    thread=`<path class="th th-a" d="M${pt("fco")} C${X(.3)} 432 ${X(.5)} 408 ${pt("doh")}"/><path class="th th-b" d="M${pt("mxp")} C${X(.36)} 358 ${X(.56)} 388 ${pt("doh")}"/><path class="th th-c" d="M${pt("got")} C${X(.4)} 280 ${X(.6)} 380 ${pt("doh")}"/><path class="th th-d" d="M${pt("doh")} C${X(.88)} 388 ${X(.95)} 384 ${W+12} 380"/><path class="th th-k" d="M${X(P.doh[0])-8} ${P.doh[1]-6} c6 -6 14 -4 16 4 s-4 14 -12 10 -10 -10 -2 -14" stroke-width="3"/>`;
    dots=["fco","mxp","got"].map(k=>`<circle cx="${X(P[k][0])}" cy="${P[k][1]}" r="4"/>`).join("");
    labels=label("fco","rome",-12)+label("mxp","milan",-12)+label("got","goteborg",-12)+label("doh","doha",24)}
  else{ // arrival: the thread comes in from the left, Fuji in the middle, Narita on the right
    scene=fuji(.5,340,140,.3)+`${pine(.9,490,1.05)}${pine(.08,486,.9)}`+cloud(-.04,26,W*.3,-120)+cloud(.6,6,W*.36,120)+cloud(.16,320,W*.5,-90)+cloud(.58,410,W*.4,110);
    thread=`<path class="th th-d" d="M-12 380 C${X(.2)} 372 ${X(.36)} 300 ${X(.5)} 300 S${X(.74)} 330 ${pt("nrt")}"/>`;
    dots=`<circle cx="${X(P.nrt[0])}" cy="${P.nrt[1]}" r="5.5"/>`;
    labels=label("nrt","narita",-12)}
  return `
<svg class="byobu-art" viewBox="0 0 ${W} ${Y}" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--prussian)"/><stop offset=".09" stop-color="var(--prussian)"/><stop offset=".095" stop-color="var(--prussian)" stop-opacity=".55"/><stop offset=".17" stop-color="var(--prussian)" stop-opacity=".55"/><stop offset=".175" stop-color="var(--prussian)" stop-opacity=".22"/><stop offset=".3" stop-color="var(--prussian)" stop-opacity="0"/></linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--prussian)" stop-opacity=".16"/><stop offset="1" stop-color="var(--prussian)" stop-opacity=".6"/></linearGradient>
    <pattern id="sgh" width="36" height="18" patternUnits="userSpaceOnUse"><g fill="none" stroke="var(--paper)" stroke-opacity=".55" stroke-width="1.1"><circle cx="18" cy="18" r="16"/><circle cx="18" cy="18" r="10"/><circle cx="18" cy="18" r="4"/><circle cx="0" cy="9" r="16"/><circle cx="36" cy="9" r="16"/></g></pattern>
    <linearGradient id="fuji" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--paper)"/><stop offset=".36" stop-color="var(--paper)"/><stop offset=".38" stop-color="var(--prussian)" stop-opacity=".75"/><stop offset="1" stop-color="var(--prussian)" stop-opacity=".95"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--gold-2)"/><stop offset=".5" stop-color="var(--gold)"/><stop offset="1" stop-color="var(--gold-2)"/></linearGradient>
  </defs>
  <rect width="${W}" height="${Y}" fill="var(--paper)"/>
  <rect width="${W}" height="${Y}" fill="url(#sky)"/>
  <path d="M0 340 C${X(.1)} 310 ${X(.17)} 310 ${X(.25)} 328 S${X(.43)} 360 ${X(.53)} 328 ${X(.68)} 300 ${X(.8)} 328 ${X(.93)} 356 ${W} 340 V${Y} H0Z" fill="var(--prussian)" opacity=".2"/>
  <path d="M0 384 C${X(.17)} 372 ${X(.25)} 396 ${X(.43)} 384 S${X(.75)} 372 ${W} 388 V${Y} H0Z" fill="url(#sea)"/>
  <path d="M0 384 C${X(.17)} 372 ${X(.25)} 396 ${X(.43)} 384 S${X(.75)} 372 ${W} 388 V${Y} H0Z" fill="url(#sgh)"/>
  <path d="M0 478 C${X(.13)} 448 ${X(.22)} 478 ${X(.35)} 464 S${X(.53)} 428 ${X(.63)} 468 ${X(.83)} 508 ${W} 478 V${Y} H0Z" fill="var(--prussian)" opacity=".85"/>
  <path d="M0 540 C${X(.12)} 500 ${X(.3)} 520 ${X(.46)} 468 S${X(.72)} 420 ${X(.88)} 392 L${X(.91)} 400 C${X(.74)} 440 ${X(.5)} 500 ${X(.3)} 540 Z" fill="var(--paper)" opacity=".35"/>
  ${scene}
  <g class="thread" fill="none" stroke="var(--shu)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${thread}</g>
  <g class="th-dots" fill="var(--shu)">${dots}</g>
  <g class="th-lbl" font-family="Manrope, system-ui, sans-serif" font-size="13" font-weight="700" fill="var(--ink)">${labels}</g>
</svg>`}

/* ───────── countdown seal ───────── */
function renderSeal(){const box=$("#seal");if(!box)return;const land=new Date(App.data.trip.meta.landing).getTime(),end=new Date("2026-11-19T00:25:00+09:00").getTime(),n=App.now().getTime();
  box.replaceChildren();
  if(n>=end){box.append(h("span",{class:"seal-ja",lang:"ja"},"完"),h("span",{class:"seal-cap"},t("hero.over")));return}
  if(n>=land){const d=Math.floor((n-land)/dayMs)+1;box.append(h("span",{class:"seal-ja",lang:"ja"},h("span",{class:"tcy"},String(d)),h("span",{},"日"),h("span",{},"目")),h("span",{class:"seal-cap"},t("hero.landed")));return}
  /* stesso numero di Oggi (App.daysToLanding): giorni di calendario in ora di Tokyo; le ore solo il giorno dell'atterraggio */
  // REVIEW: tolte le ore dalla didascalia nei giorni prima (con i giorni di calendario "20 giorni 21 ore" sarebbe falso), vedi Problemi
  const left=land-n,D=App.daysToLanding(),H=Math.ceil(left/36e5),cap=D>0?`${D} ${t("hero.days")}`:`${H} ${t("hero.hours")}`;
  box.append(h("span",{class:"seal-ja",lang:"ja"},h("span",{},"あ"),h("span",{},"と"),h("span",{class:"tcy"},String(D)),h("span",{},"日")),
    h("span",{class:"seal-cap"},cap));
  box.setAttribute("aria-label",`${t("hero.countdown")}: ${cap}`)}

/* ───────── byōbu ───────── */
function renderByobu(){const wrap=$("#byobu");wrap.replaceChildren();
  // panels first (empty), then measure one to size the landscape for the real panel shape
  PANELS.forEach((p,i)=>{wrap.append(h("div",{class:"panel",style:{"--i":i}},h("div",{class:"panel-art"}),
    h("div",{class:"panel-name"},h("span",{class:"pn"},p.name),h("span",{class:"pf"},t(p.from)))))});
  const p0=wrap.firstElementChild,pw=p0.clientWidth||60,ph=p0.clientHeight||300;
  const pair=innerWidth<900; // phones: a pair of three-panel screens, each a complete picture
  const n=pair?3:6,W=Math.round(560*(n*pw)/ph);
  const arts=pair?[landscapeSVG(W,"a"),landscapeSVG(W,"b")]:[landscapeSVG(W,"all")];
  $$(".panel",wrap).forEach((p,i)=>{p.style.setProperty("--n",n);p.style.setProperty("--j",i%n);p.querySelector(".panel-art").innerHTML=arts[pair?Math.floor(i/3):0]});
  placeLabels(wrap);
  const ths=$$(".panel-art .th",wrap);ths.forEach(p=>{const len=p.getTotalLength();p.style.strokeDasharray=len;p.style.strokeDashoffset=REDUCED?0:len});
  wrap.dataset.drawn=REDUCED?"1":"0";openByobu(wrap);
  if(!REDUCED)setTimeout(()=>{ths.forEach(p=>p.style.strokeDashoffset=0);wrap.dataset.drawn="1"},80);
  const CITY_STRAND={rome:"th-a",milan:"th-b",goteborg:"th-c",narita:"th-d",doha:"th-d"};
  $$(".th-lbl text",wrap).forEach(tx=>{tx.addEventListener("pointerenter",()=>{const cls=CITY_STRAND[tx.dataset.city];if(!cls||REDUCED)return;
    $$("."+cls,wrap).forEach(p=>{p.style.transition="none";p.style.strokeDashoffset=p.getTotalLength();void p.getBoundingClientRect();p.style.transition="stroke-dashoffset .6s cubic-bezier(.23,1,.32,1)";p.style.strokeDashoffset=0})})})}
/* I8: ogni nome di città sta interamente dentro l'anta del suo punto, mai a cavallo di una fessura, mai sotto i pini o sotto il cartiglio
   del nome; sul telefono il corpo è di almeno 11 px con un fondo di carta all'85 %. Ogni anta ha una copia intera della scena spostata:
   le posizioni si calcolano sulla prima copia di ogni gruppo (6 ante su desktop, 3+3 sul telefono) e si applicano a tutte */
function placeLabels(wrap){const panels=$$(".panel",wrap);if(!panels.length)return;const pair=innerWidth<900,n=pair?3:6,GAP=12;
  for(let g=0;g<panels.length/n;g++){const group=panels.slice(g*n,g*n+n),art=group[0].querySelector(".panel-art"),svg=art&&art.querySelector("svg");if(!svg)continue;
    const A=art.clientWidth,H=art.clientHeight;if(!A||!H)continue;const vb=svg.viewBox.baseVal,ux=vb.width/(n*A+(n-1)*GAP),uy=vb.height/H;
    const fs=Math.max(15,(pair?11:0)*uy),s=fs/15,m=(pair?3:6)*ux,pad=3*s;
    /* finestre delle ante e cartigli del nome, in unità della scena */
    const win=group.map((p,j)=>{const L=j*(A+GAP)*ux,nm=p.querySelector(".panel-name");const r=nm?{x0:L+(nm.offsetLeft-5)*ux-m,y0:(nm.offsetTop-5)*uy-m,x1:L+(nm.offsetLeft-5+nm.offsetWidth)*ux+m,y1:(nm.offsetTop-5+nm.offsetHeight)*uy+m}:null;return{L,R:L+A*ux,name:r}});
    const pines=[...svg.querySelectorAll(".pine")].map(e=>{const[a,b,c,d]=e.dataset.r.split(" ").map(Number);return{x0:a,y0:b,x1:c,y1:d}});
    const hit=(a,b)=>a.x0<b.x1&&b.x0<a.x1&&a.y0<b.y1&&b.y0<a.y1;
    /* i punti (e il nodo di Doha) sono ostacoli: il nome sta accanto, non sopra */
    const taken=[...svg.querySelectorAll(".th-lbl text")].map(e=>{const x=+e.dataset.px,y=+e.dataset.py,r=e.dataset.city==="doha"?12:7;return{x0:x-r,y0:y-r,x1:x+r,y1:y+r}}),place={};
    for(const tx of svg.querySelectorAll(".th-lbl text")){const px=+tx.dataset.px,py=+tx.dataset.py;tx.style.fontSize=fs+"px";tx.setAttribute("text-anchor","start");tx.setAttribute("x",px);tx.setAttribute("y",py);
      /* scatola vera del testo (getBBox, con il carattere che c'è): larghezza e salita/discesa rispetto alla linea di base */
      const bb=tx.getBBox(),w=bb.width,asc=py-bb.y,desc=bb.y+bb.height-py;
      let j=group.findIndex((_,i)=>px>=win[i].L&&px<=win[i].R+GAP*ux);if(j<0)j=px<0?0:n-1;j=Math.min(j,n-1);const W0=win[j];
      const cand={above:[px-w/2,py-12*s],below:[px-w/2,py+(12*s+asc)],right:[px+8*s,py+asc/2-2*s],left:[px-8*s-w,py+asc/2-2*s]};
      cand.above2=[px-w/2,py-24*s];cand.above3=[px-w/2,py-38*s];
      const order=[tx.dataset.side,"above","right","left","below","above2","above3"].filter((k,i,a)=>a.indexOf(k)===i);
      const box=([x,y])=>({x0:x-pad,y0:y-asc-pad,x1:x+w+pad,y1:y+desc+pad});
      const ok=c=>{const b=box(c);return b.x0>=W0.L+m&&b.x1<=W0.R-m&&b.y0>=m&&b.y1<=vb.height-m&&!(W0.name&&hit(b,W0.name))&&!pines.some(q=>hit(b,q))&&!taken.some(q=>hit(b,q))};
      let c=order.map(k=>cand[k]).find(ok);
      /* nessun lato libero (anta stretta): sopra il punto, spinto dentro l'anta, alzato finché non tocca più i pini */
      if(!c){const y0=cand.above[1],nr=W0.name&&W0.name.y1>y0-asc&&W0.name.y0<y0+desc?W0.name.x0:W0.R-m,x=Math.max(W0.L+m+pad,Math.min(nr-pad-w,px-w/2));let y=y0;while(y>asc+m&&pines.some(q=>hit(box([x,y]),q)))y-=4*s;c=[x,y]}
      taken.push(box(c));place[tx.dataset.city]={x:c[0],y:c[1],b:box(c)}}
    /* tutte le copie del gruppo: stessa posizione; sul telefono un fondo di carta dietro al nome */
    for(const p of group)for(const tx of p.querySelectorAll(".th-lbl text")){const q=place[tx.dataset.city];if(!q)continue;
      tx.style.fontSize=fs+"px";tx.setAttribute("text-anchor","start");tx.setAttribute("x",q.x.toFixed(1));tx.setAttribute("y",q.y.toFixed(1));
      const old=tx.previousElementSibling;if(old&&old.tagName==="rect")old.remove();
      if(pair){const r=document.createElementNS("http://www.w3.org/2000/svg","rect");r.setAttribute("x",q.b.x0.toFixed(1));r.setAttribute("y",q.b.y0.toFixed(1));r.setAttribute("width",(q.b.x1-q.b.x0).toFixed(1));r.setAttribute("height",(q.b.y1-q.b.y0).toFixed(1));
        r.setAttribute("fill","var(--paper)");r.setAttribute("fill-opacity",".85");tx.before(r)}}}}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{const w=$("#byobu");if(w&&w.children.length)placeLabels(w)}).catch(()=>{});
/* byōbu su telefono: si apre una volta al primo ingresso in vista (CSS fa il resto); al tocco il cartiglio ridondola */
let byobuOpened=false;
function openByobu(wrap){if(!matchMedia("(max-width:899px)").matches){delete wrap.dataset.open;return}
  if(byobuOpened){wrap.dataset.open="done";return}wrap.dataset.open="0";
  const io=new IntersectionObserver(es=>{if(!es.some(e=>e.isIntersecting))return;io.disconnect();byobuOpened=true;wrap.dataset.open="1";
    const last=wrap.lastElementChild?.querySelector(".panel-name");const end=()=>{if(wrap.dataset.open==="1")wrap.dataset.open="done"};
    if(last)last.addEventListener("animationend",end,{once:true});setTimeout(end,2600)},{threshold:.25});io.observe(wrap);
  if(!wrap.dataset.tap){wrap.dataset.tap="1";wrap.addEventListener("click",ev=>{const nm=ev.target.closest(".panel")?.querySelector(".panel-name");if(!nm||REDUCED)return;
    nm.classList.remove("swing");void nm.offsetWidth;nm.classList.add("swing")})}}
let heroBound=false;
function bindHero(){if(heroBound)return;heroBound=true;const hero=$("#hero");let raf=0,lastW=innerWidth;
  const onScroll=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;const r=hero.getBoundingClientRect();const k=Math.max(0,Math.min(1,-r.top/(r.height*.8)));hero.style.setProperty("--k",k.toFixed(3))})};
  addEventListener("scroll",onScroll,{passive:true});onScroll();
  let rt=0;addEventListener("resize",()=>{if(Math.abs(innerWidth-lastW)<40)return;lastW=innerWidth;clearTimeout(rt);rt=setTimeout(()=>{renderByobu();setupScroll()},250)})}

/* ───────── emakimono: six prints ───────── */
const PHOTO={arrival:"img/ph-arrival.jpg",tokyo1:"img/ph-tokyo1.jpg",shinkansen:"img/ph-shinkansen.jpg",kansai:"img/ph-kansai.jpg",tokyo2:"img/ph-tokyo2.jpg",return:"img/ph-return.jpg"};
/* small flat scenes used behind / instead of the photo */
const SCENE={
  arrival:'<path d="M0 150 C80 136 160 160 260 148 S380 136 420 150 V220 H0z" fill="var(--prussian)" opacity=".5"/><circle cx="330" cy="70" r="26" fill="var(--paper)" opacity=".9"/><path d="M40 92 l120 -30 8 4 -110 36z" fill="var(--paper)" opacity=".9"/>',
  tokyo1:'<g fill="var(--prussian)"><rect x="20" y="90" width="40" height="130"/><rect x="70" y="60" width="26" height="160"/><rect x="104" y="110" width="60" height="110"/><rect x="176" y="40" width="18" height="180"/><rect x="202" y="100" width="48" height="120"/><rect x="262" y="70" width="30" height="150"/><rect x="300" y="120" width="70" height="100"/><rect x="380" y="50" width="22" height="170"/></g><g fill="var(--shu)"><rect x="80" y="80" width="6" height="30"/><rect x="214" y="120" width="10" height="24"/><rect x="310" y="140" width="40" height="8"/></g>',
  shinkansen:'<path d="M0 150 L120 60 L240 150z" fill="var(--paper)" stroke="var(--prussian)" stroke-width="2"/><path d="M0 170 H420" stroke="var(--prussian)" stroke-width="4"/><path d="M60 162 h220 a18 18 0 0 0 0 -22 H60z" fill="var(--paper)" stroke="var(--prussian)" stroke-width="2"/><path d="M60 151 h220" stroke="var(--prussian)" stroke-width="2"/>',
  kansai:'<g fill="var(--prussian)"><path d="M210 30 l-80 50 h160z"/><rect x="150" y="80" width="120" height="14"/><path d="M210 70 l-60 40 h120z"/><rect x="160" y="110" width="100" height="14"/><path d="M210 110 l-50 36 h100z"/><rect x="170" y="146" width="80" height="74"/></g><g fill="var(--shu)"><rect x="196" y="170" width="28" height="50"/></g>',
  tokyo2:'<rect width="420" height="220" fill="var(--prussian)"/><circle cx="330" cy="60" r="34" fill="var(--paper)" opacity=".95"/><g fill="var(--paper)" opacity=".16"><rect x="0" y="120" width="60" height="100"/><rect x="70" y="140" width="80" height="80"/><rect x="160" y="110" width="50" height="110"/><rect x="220" y="150" width="90" height="70"/><rect x="320" y="130" width="100" height="90"/></g><g fill="var(--shu)"><rect x="30" y="150" width="10" height="16" rx="4"/><rect x="100" y="166" width="10" height="16" rx="4"/><rect x="180" y="140" width="10" height="16" rx="4"/><rect x="250" y="176" width="10" height="16" rx="4"/><rect x="350" y="160" width="10" height="16" rx="4"/></g><path d="M0 200 H420" stroke="var(--paper)" stroke-opacity=".5" stroke-width="2"/>',
  return:'<rect width="420" height="220" fill="var(--prussian)"/><path d="M0 170 H420" stroke="var(--paper)" stroke-opacity=".5" stroke-width="2"/><g fill="var(--paper)"><circle cx="60" cy="172" r="3"/><circle cx="130" cy="172" r="3"/><circle cx="200" cy="172" r="3"/><circle cx="270" cy="172" r="3"/><circle cx="340" cy="172" r="3"/></g><path d="M300 70 l70 -22 6 6 -60 30z" fill="var(--paper)"/><circle cx="110" cy="60" r="18" fill="var(--paper)" opacity=".9"/>'};

/* impegni della stampa: prenotazioni ed eventi fissi insieme, in ordine di data e ora; nella stampa di un giorno solo basta l'ora
   ("10:00"), nelle altre "3 nov 17:55" */
function fixedFor(ph){const D=App.data,it=[];
  for(const b of D.trip.bookings){if(b.date>=ph.from&&b.date<=ph.to&&(ph.id!=="tokyo1"||b.date<"2026-11-09")&&(ph.id!=="kansai"||b.date>"2026-11-09")&&(ph.id!=="shinkansen"||b.date==="2026-11-09"))it.push({d:b.date,t:b.time,l:L(b.label).replace(/\s·\s/g,", ")})}
  if(ph.id==="arrival")it.push({d:"2026-11-03",t:"17:55",l:"Narita T2, QR806"},{d:"2026-11-04",t:"06:55",l:"Haneda, Mathieu"});
  if(ph.id==="return")it.push({d:"2026-11-18",t:"22:45",l:"Haneda, Mathieu"},{d:"2026-11-19",t:"00:25",l:"Haneda T3, QR813"});
  if(ph.id==="shinkansen")it.push({d:"2026-11-09",t:"10:00",l:App.lang==="it"?"check-out, valigie in deposito":"check-out, luggage into storage"},{d:"2026-11-09",t:"15:00",l:App.lang==="it"?"check-in a Osaka":"Osaka check-in"});
  const one=ph.from===ph.to;it.sort((a,b)=>(a.d+a.t).localeCompare(b.d+b.t));
  return it.map(x=>[one?x.t:App.fmtDT(x.d,x.t),x.l])}
function tastesFor(ph){const D=App.data,PHC={tokyo1:["tokyo"],kansai:["osaka","kyoto","nara","kobe","uji"],tokyo2:["tokyo"]},cs=PHC[ph.id];if(!cs)return[];
  const pick=fn=>D.places.filter(p=>cs.includes(p.city)&&p.status!=="closed"&&p.booking!=="booked"&&p.booking!=="soldout"&&fn(p)).sort((a,b)=>({noi:0,luca:1,sugg:2}[a.source]-{noi:0,luca:1,sugg:2}[b.source]));
  const used=new Set(),out=[];const take=fn=>{const p=pick(fn).find(p=>!used.has(p.id));if(p){used.add(p.id);out.push(p)}};
  take(p=>p.cat==="eat"&&p.tier==="cheap");take(p=>p.cat==="eat"&&p.tier==="chic"&&p.city!=="kobe");take(p=>p.cat==="see");take(p=>p.cat==="night");
  if(ph.id==="kansai"){take(p=>p.city==="nara");take(p=>p.source==="luca"&&p.cat==="eat")}return out}

function renderPrints(){const D=App.data,strip=$("#strip");strip.replaceChildren(h("div",{class:"stations",id:"stations"}));
  const imgs=new Set((D.images?.images||[]).map(i=>i.id));const remote=Object.fromEntries((D.images?.remote||[]).map(i=>[i.id,i.remote_url]));
  strip.append(h("div",{class:"jiku","aria-hidden":"true"}));
  D.trip.phases.forEach((ph,i)=>{const stay=D.trip.stays.find(s=>s.id===ph.stay);const fixed=fixedFor(ph),tastes=tastesFor(ph);const hasPhoto=imgs.has("ph-"+ph.id)||!!remote["ph-"+ph.id];const src=imgs.has("ph-"+ph.id)?PHOTO[ph.id]+"?v="+(window.SITE_V||"1"):remote["ph-"+ph.id];
    const dates=App.fmtRange(ph.from,ph.to);
    const art=h("div",{class:"print-art"+(hasPhoto?" duo":""),"aria-hidden":"true"},
      h("div",{class:"scene",html:'<svg viewBox="0 0 420 220" preserveAspectRatio="xMidYMax slice"><defs><linearGradient id="bk'+i+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--prussian)"/><stop offset=".18" stop-color="var(--prussian)"/><stop offset=".19" stop-color="var(--prussian)" stop-opacity=".5"/><stop offset=".36" stop-color="var(--prussian)" stop-opacity=".5"/><stop offset=".37" stop-color="var(--prussian)" stop-opacity=".18"/><stop offset=".6" stop-color="var(--prussian)" stop-opacity="0"/></linearGradient></defs><rect width="420" height="220" fill="var(--paper-2)"/><rect width="420" height="110" fill="url(#bk'+i+')"/>'+(SCENE[ph.id]||"")+'</svg>'}),
      hasPhoto?h("span",{class:"ink"}):null,
      hasPhoto?h("img",{src,alt:"",loading:"lazy",decoding:"async",referrerpolicy:"no-referrer",onerror:ev=>{const a=ev.target.closest(".print-art");a.classList.remove("duo");ev.target.remove()}}):null,
      h("div",{class:"cartouche",lang:"ja"},App.stack(ph.kanji,"tate")));
    const card=h("article",{class:"print","data-phase":ph.id,style:{"--n":i}},
      art,
      h("div",{class:"print-body"},
        h("p",{class:"print-dates mono"},dates),
        h("h3",{},L(ph.name)),
        h("p",{class:"print-line"},L(ph.line)),
        stay?h("div",{class:"row"},h("span",{class:"lbl"},t("phases.stay")),h("span",{},L(stay.name)," ",h("span",{class:"mono dim",style:{whiteSpace:"nowrap"}},t("phases.checkin")+" "+stay.checkin+","),h("span",{class:"mono dim"}," "),h("span",{class:"mono dim",style:{whiteSpace:"nowrap"}},t("phases.checkout")+" "+stay.checkout))):null,
        fixed.length?h("div",{class:"row"},h("span",{class:"lbl"},t("phases.fixed")),h("div",{class:"fixed"},fixed.map(([a,b])=>h("div",{class:"fixed-row"},h("span",{class:"mono"},a),h("span",{},b))))):null,
        tastes.length?h("div",{class:"row"},h("span",{class:"lbl"},t("phases.taste")),h("div",{class:"taste"},tastes.map(p=>h("button",{class:"chip",type:"button",onclick:()=>App.placeSheet(p,{showOnMap:true})},App.iconEl(p),L(p.name))))):null));
    strip.append(card)});
  strip.append(h("div",{class:"jiku end","aria-hidden":"true"}));
  $$(".print",strip).forEach(p=>p.dataset.in="1");
  setupScroll();fitTastes()}
/* suggerimenti che non stanno nella stampa (riquadro alto 92 px su schermi bassi): gli ultimi lasciano il posto a un chip "+N"
   che apre la scheda della fase con tutti; niente chip tagliati a metà. Rifatto al cambio di misura e quando arrivano i font */
function fitTastes(){$$(".print .taste").forEach(box=>{const chips=[...box.querySelectorAll(".chip:not(.more)")];const old=box.querySelector(".more");if(old)old.remove();chips.forEach(c=>c.style.display="");
  if(box.scrollHeight<=box.clientHeight+1)return;const ph=App.data.trip.phases.find(x=>x.id===box.closest(".print").dataset.phase);
  const more=h("button",{class:"chip more",type:"button",onclick:()=>phaseSheet(ph)});box.append(more);
  for(let k=chips.length-1;k>=1;k--){chips[k].style.display="none";const n=chips.length-k;more.textContent="+"+n;more.setAttribute("aria-label",t("phases.more").replace("{n}",n));if(box.scrollHeight<=box.clientHeight+1)break}})}
let fitT=0;addEventListener("resize",()=>{clearTimeout(fitT);fitT=setTimeout(fitTastes,150)});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if($(".print .taste"))fitTastes()}).catch(()=>{});
// REVIEW: una scheda della fase non c'era; questa è nuova e minima (date, riga, suggerimenti), vedi Problemi
/* scheda della fase: date, riga, tutti i suggerimenti */
function phaseSheet(ph){if(!ph)return;const tastes=tastesFor(ph);
  const dates=App.fmtRange(ph.from,ph.to);
  App.openSheet(h("div",{class:"sh-body"},h("div",{class:"sh-title"},h("p",{class:"eyebrow"},dates),h("h2",{id:"sheet-title"},L(ph.name)),h("div",{class:"ja",lang:"ja"},ph.kanji)),
    h("p",{class:"lede"},L(ph.line)),h("p",{class:"eyebrow"},t("phases.taste")),
    h("div",{class:"taste"},tastes.map(p=>h("button",{class:"chip",type:"button",onclick:()=>App.placeSheet(p,{showOnMap:true})},App.iconEl(p),L(p.name))))))}

/* ───────── the six phases: one progress value p (0..1) from the page's vertical scroll.
   p drives the strip of prints, the active print, the stations and the train on the line. */
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
let cleanup=null;
function setupScroll(){if(cleanup){cleanup();cleanup=null}
  const sec=$("#emaki"),scroller=$("#scroller"),strip=$("#strip"),wrap=$("#strip-wrap"),stations=$("#stations"),train=$("#train");
  const phases=App.data.trip.phases,prints=$$(".print",strip),N=prints.length,pi=i=>(i+.5)/N;
  stations.replaceChildren(...phases.map((ph,i)=>h("button",{class:"st",type:"button","aria-label":L(ph.name),onclick:()=>goTo(i)},
    h("span",{class:"dot"}),h("b",{lang:"ja"},ph.kanji),h("small",{},L(ph.name)))));
  function placeStations(){[...stations.children].forEach((el,i)=>{const p=prints[i];el.style.setProperty("--x",(p.offsetLeft+p.offsetWidth/2).toFixed(1)+"px")})}
  let goTo=()=>{};
  let p=0,cur=0,raf=0,mt=0;
  if(innerWidth<900){ // phones: the strip scrolls natively (swipe + snap); stations travel with the prints, the train stays at the centre
    sec.dataset.mode="swipe";strip.style.transform="";
    const update=()=>{raf=0;const cx=strip.scrollLeft+strip.clientWidth/2;let best=0,bd=1e9;prints.forEach((el,i)=>{const d=Math.abs(el.offsetLeft+el.offsetWidth/2-cx);if(d<bd){bd=d;best=i}});cur=best;
      prints.forEach((el,i)=>{el.dataset.active=i===cur?"1":"0"});[...stations.children].forEach((el,i)=>{el.dataset.on=i<cur?"1":i===cur?"cur":"0"})};
    const onS=()=>{if(!raf)raf=requestAnimationFrame(update)};
    goTo=i=>prints[i].scrollIntoView({behavior:REDUCED?"auto":"smooth",inline:"center",block:"nearest"});
    strip.addEventListener("scroll",onS,{passive:true});const ro=new ResizeObserver(()=>{placeStations();update()});ro.observe(strip);placeStations();update();
    cleanup=()=>{strip.removeEventListener("scroll",onS);ro.disconnect()};return}
  sec.dataset.mode="pin";
  const top=()=>sec.getBoundingClientRect().top+scrollY;
  const span=()=>sec.offsetHeight-scroller.offsetHeight;
  function computeP(){const s=span();if(s<=0)return 0;return Math.max(0,Math.min(1,(scrollY-top())/s))}
  // position along the line, pausing at each station (same mapping for train and strip)
  function along(q){if(q<=pi(0))return 0;if(q>=pi(N-1))return N-1;const i=Math.min(N-2,Math.floor(q*N-.5));return i+smooth(pi(i),pi(i+1),q)}
  // the active print sits at the anchor: the left margin on wide screens, the centre on phones; the train stays above it
  function anchor(){const ww=wrap.clientWidth,w=prints[0].offsetWidth;return innerWidth>=900?Math.max(24,parseFloat(getComputedStyle(strip).paddingLeft)||24):(ww-w)/2}
  function activeLeft(q){const l=prints.map(el=>el.offsetLeft);const a=along(q),i=Math.floor(a),t=a-i;return i>=N-1?l[N-1]:l[i]+(l[i+1]-l[i])*t}
  // the strip never runs past its end: once the last print reaches the right margin it stops there
  function stripX(q){const x=anchor()-activeLeft(q);const minX=Math.min(0,wrap.clientWidth-strip.scrollWidth);return Math.max(minX,x)}
  function apply(){p=computeP();cur=Math.max(0,Math.min(N-1,Math.round(p*N-.5)));
    const sx=stripX(p);strip.style.transform=`translate3d(${sx.toFixed(1)}px,0,0)`;
    train.style.left=(sx+activeLeft(p)+prints[0].offsetWidth/2).toFixed(1)+"px";
    prints.forEach((el,i)=>{el.dataset.active=i===cur?"1":"0"});
    [...stations.children].forEach((el,i)=>{el.dataset.on=i<cur?"1":i===cur?"cur":"0"})}
  // light magnet: when the scroll rests inside the section, bring the page to the nearest station
  function magnet(){if(REDUCED)return;clearTimeout(mt);mt=setTimeout(()=>{if(p<.02||p>.98)return;const target=pi(cur);if(Math.abs(target-p)<.004)return;scrollTo({top:top()+target*span(),behavior:"smooth"})},170)}
  goTo=i=>scrollTo({top:top()+pi(i)*span(),behavior:REDUCED?"auto":"smooth"});
  const onScroll=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;apply();magnet()})};
  addEventListener("scroll",onScroll,{passive:true});
  const ro=new ResizeObserver(()=>{placeStations();apply()});ro.observe(strip);ro.observe(wrap);
  placeStations();apply();
  cleanup=()=>{removeEventListener("scroll",onScroll);ro.disconnect();clearTimeout(mt)}}
document.addEventListener("view",ev=>{if(ev.detail==="story"&&App.data.trip)setupScroll()});

/* ───────── le app da avere ───────── */
function renderApps(){const box=$("#apps"),list=App.data.apps||[];if(!box)return;
  box.replaceChildren(...list.map(a=>h("div",{class:"app-ticket"},
    h("span",{class:"k",lang:"ja","aria-hidden":"true"},a.kanji),
    h("span",{class:"n"},a.name),
    h("span",{class:"w"},L(a.why)),
    h("span",{class:"stores"},...a.links.map(l=>h("a",{class:"store",href:l.href,target:"_blank",rel:"noopener","aria-label":a.name+" — "+L(l.label)},L(l.label)))))))}
/* ───────── guida "Installa l'app" ───────── */
/* dentro claude.ai i tre passi non servono: il sito avrà un indirizzo suo; già installata (standalone): il timbro 済 */
App.inClaude=()=>/claude/i.test(location.hostname||"");
App.installed=()=>{try{return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}catch(e){return false}};
function renderInstall(){const box=$("#install");if(!box)return;const I=window.ICONS||{};
  const head=[h("h3",{},t("install.title")),h("p",{class:"ins-sub"},t("install.sub"))];
  const note=(k,title,text)=>h("div",{class:"ins-note",role:"status"},h("span",{class:"ins-hk",lang:"ja","aria-hidden":"true"},k),h("div",{},h("b",{},title),h("p",{},text)));
  if(App.installed()){box.dataset.state="done";box.replaceChildren(...head,note("済",t("install.done"),t("install.done.d")));return}
  if(App.inClaude()){box.dataset.state="claude";box.replaceChildren(...head,note("待",t("install.soon"),t("install.soon.d")));return}
  box.dataset.state="steps";
  const steps=[["一","compass","s1"],["二","share","s2"],["三","addhome","s3"]];
  box.replaceChildren(...head,
    h("ol",{class:"ins-row"},steps.map(([k,ic,s],i)=>h("li",{class:"ins-print"},
      h("div",{class:"ins-art","aria-hidden":"true"},h("span",{class:"ins-i",html:I[ic]||""}),h("div",{class:"cartouche",lang:"ja"},App.stack(k,"tate"))),
      h("div",{class:"ins-body"},h("span",{class:"mono"},t("install.step")+" "+(i+1)),h("h4",{},t("install."+s+".t")),h("p",{},t("install."+s+".d")))))),
    h("p",{class:"ins-who"},t("install.who")))}
/* ───────── banner "Mettila sul telefono" (piano D) ───────── */
/* nel browser, fuori da claude.ai e fuori dall'app installata; la × lo nasconde per 7 giorni su questo telefono */
const HIDE_KEY="installHide",HIDE_MS=7*dayMs;
const bannerHidden=()=>{try{const v=+localStorage.getItem(HIDE_KEY);return v>0&&Date.now()-v<HIDE_MS}catch(e){return false}};
function renderBanner(){const box=$("#inst-banner");if(!box)return;
  if(App.installed()||App.inClaude()||bannerHidden()){box.hidden=true;box.replaceChildren();return}
  box.hidden=false;box.setAttribute("role","note");
  box.replaceChildren(h("span",{class:"ib-k",lang:"ja","aria-hidden":"true"},"携"),
    h("p",{class:"ib-t"},h("b",{},t("banner.lead"))," "+t("banner.steps")+" ",
      h("a",{class:"ib-link",href:"#install",onclick:ev=>{ev.preventDefault();const el=$("#install");if(el)el.scrollIntoView({behavior:REDUCED?"auto":"smooth",block:"start"})}},t("banner.link"))),
    h("button",{type:"button",class:"ib-x","aria-label":t("banner.hide"),title:t("banner.hide"),onclick:()=>{try{localStorage.setItem(HIDE_KEY,String(Date.now()))}catch(e){}box.hidden=true;box.replaceChildren()}},"×"))}
/* ───────── ema board ───────── */
function renderEma(){const items=["vjw","suica","cash","weather"],PIC={vjw:"入",suica:"札",cash:"円",weather:"天"},box=$("#ema");
  box.replaceChildren(...items.map((k,i)=>h("div",{class:"ema-wrap",style:{"--r":[-2.5,1.5,-1,2.2][i]+"deg"}},h("span",{class:"string","aria-hidden":"true"}),h("div",{class:"ema"},h("span",{class:"hole","aria-hidden":"true"}),h("span",{class:"pic",lang:"ja","aria-hidden":"true"},PIC[k]),h("h3",{},t("before."+k+".t")),h("p",{},t("before."+k+".d"))))))}
/* colophon: the sixteen kanji of the days */
/* omikuji in Oggi: the oracle of the day, tied to that day's kanji; drawn once, remembered per date */
// REVIEW: il piano dice "7 nov esce 新幹線", ma in trip.json il 7 nov e' 夜 e 新幹線 e' il 9 nov; qui vale il kanji del giorno da trip.json
const omiKey=()=>"omi-"+App.tokyoParts().date;
const omiGet=()=>{try{return localStorage.getItem(omiKey())==="1"}catch(e){return false}};
const omiSet=()=>{try{localStorage.setItem(omiKey(),"1")}catch(e){}};
App.omikujiEl=function(day){const o=(App.data.omikuji||[]).find(x=>x.kanji===day.kanji);if(!o)return null;
  const drawn=omiGet(),col=c=>[...c].map(x=>h("span",{},x));
  const slip=h("div",{class:"omi-slip",id:"omi-slip","aria-live":"polite"},
    h("span",{class:"vh"},t("omi.title")+": "+o.rank+", "+o.kanji+". "),
    h("span",{class:"stamp",lang:"ja","aria-hidden":"true"},o.rank),
    h("span",{class:"omi-head","aria-hidden":"true"},h("b",{class:"rank tate-v",lang:"ja"},...col(o.rank)),h("span",{class:"kj tate-v",lang:"ja"},...col(o.kanji))),
    h("p",{class:"txt"},L(o)));
  const box=h("button",{class:"omi-box",type:"button","aria-controls":"omi-slip"},h("span",{class:"wood","aria-hidden":"true"}),h("span",{class:"jp",lang:"ja","aria-hidden":"true"},...col("御神籤")));
  const cta=h("button",{class:"omi-cta",type:"button","aria-controls":"omi-slip"});
  const wrap=h("div",{class:"omikuji","data-open":drawn?"1":"0"},h("div",{class:"omi-well"},slip,box),cta);
  const labels=()=>{const k=wrap.dataset.open==="1"?"omi.done":"omi.cta";box.setAttribute("aria-label",t(k));cta.textContent=t(k);
    const done=wrap.dataset.open==="1";box.disabled=done;cta.disabled=done;if(done){slip.removeAttribute("aria-hidden")}else slip.setAttribute("aria-hidden","true")};
  let busy=false;
  const draw=()=>{if(busy||wrap.dataset.open==="1")return;busy=true;omiSet();
    const go=()=>{wrap.dataset.open="1";wrap.classList.add("drawing");labels();setTimeout(()=>{wrap.classList.remove("drawing");busy=false},REDUCED?300:1000)};
    if(REDUCED){go();return}
    box.classList.remove("shake");void box.offsetWidth;box.classList.add("shake");setTimeout(()=>{box.classList.remove("shake");go()},500)};
  box.addEventListener("click",draw);cta.addEventListener("click",draw);labels();
  return h("div",{class:"omi-today",id:"today-omikuji"},h("div",{class:"sec-h"},h("h2",{},t("omi.today")),h("span",{class:"eyebrow",lang:"ja"},o.kanji)),wrap)};
/* ───────── credits for photos ───────── */
function renderCredits(){const box=$("#photo-credits");if(!box)return;const list=App.data.images?.images||[];if(!list.length){box.hidden=true;return}box.hidden=false;
  box.replaceChildren(h("b",{},t("credits.photos")+" "),...list.map((im,i)=>h("span",{},h("a",{href:im.source,target:"_blank",rel:"noopener"},im.author),` (${im.license})`,i<list.length-1?", ":"")))}

/* ───────── public ───────── */
/* departures board: the three ways in */
function renderBoard(){const box=$("#board");if(!box)return;const F=App.data.trip.flights;const tm=iso=>iso?iso.slice(11,16):"";const dd=iso=>iso?App.fmtDate(iso.slice(0,10),{day:"numeric",month:"short"}):"";
  const f=id=>F.find(x=>x.id===id);const a=f("qr132"),b=f("qr806"),c=f("simone-mxp"),m=f("mathieu-out");
  /* tra i due codici una piccola freccia disegnata; per i lettori di schermo resta la parola */
  const leg=(x,y)=>[x,h("span",{class:"arr","aria-hidden":"true",html:(window.ICONS||{}).arrow||""}),h("span",{class:"vh"}," "+t("last.to")+" "),y];
  const rows=[
    [`${a.from.iata} ${tm(a.dep)}`,leg(a.to.iata,`${b.to.iata} ${tm(b.arr)}`),`${dd(a.dep)}, Vincenzo, Genny, Andrea, Vivienne`],
    [`${c.from.iata}`,leg(c.to.iata,`${b.to.iata} ${tm(b.arr)}`),`${dd(a.dep)}, Simone, ${L(c.from.city)}`],
    [`${m.from.iata} ${tm(m.dep)}`,leg(m.via.iata,`${m.to.iata} ${tm(m.arr)}`),`${dd(m.dep)}, Mathieu (${t("board.lands")} ${dd(m.arr)})`]];
  box.replaceChildren(h("p",{class:"board-h"},t("board.title")),...rows.map(r=>h("div",{class:"brow"},h("span",{class:"mono"},r[0]),h("span",{class:"mono to"},...r[1]),h("span",{class:"who"},r[2]))))}
/* signature: the brush draws it once when it comes into view, then the seal */
function bindSignature(){const sig=$(".signature");if(!sig||REDUCED||!("IntersectionObserver" in window))return;sig.classList.add("sig-wait");
  const io=new IntersectionObserver(es=>{if(!es.some(e=>e.isIntersecting))return;io.disconnect();sig.classList.remove("sig-wait");sig.classList.add("sig-go")},{threshold:.6});io.observe(sig)}
/* noren on the phone: a draught sways them once, a tap parts them, then we go */
function bindNoren(){const doors=$(".doors"),PHONE=matchMedia("(max-width:899px)");if(!doors)return;
  if(!REDUCED&&"IntersectionObserver" in window){const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)&&PHONE.matches){doors.classList.add("sway");io.disconnect()}},{threshold:.6});io.observe(doors)}
  for(const[id,view]of[["#to-map","map"],["#to-today","today"]]){const a=$(id);if(!a)continue;
    a.addEventListener("click",ev=>{ev.preventDefault();if(!PHONE.matches||REDUCED){App.go(view);return}
      if(a.classList.contains("open"))return;doors.classList.remove("sway");a.classList.add("open");setTimeout(()=>{App.go(view);a.classList.remove("open")},230)})}}
App.initStory=function(){renderByobu();bindHero();renderSeal();renderBoard();renderPrints();renderEma();renderApps();renderInstall();renderBanner();renderCredits();bindNoren();bindSignature()};
App.renderSeal=renderSeal;
App.refreshStory=function(){renderByobu();renderSeal();renderBoard();renderPrints();renderEma();renderApps();renderInstall();renderBanner();renderCredits()};
})();
