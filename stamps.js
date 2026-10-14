/* Giappone 2026 — 29 timbri di quartiere (piano 2026-10-14-timbri-quartiere-installa).
   Ogni timbro è un eki-stamp: cerchio 120, bordo doppio (3 + 1), un solo inchiostro, disegno monolinea (tratto 3, punte tonde)
   con un dettaglio della zona al centro, il nome latino sull'arco alto e il kanji della zona sull'arco basso.
   window.STAMPS = {zoneId: "<svg…>"}; l'inchiostro è data-ink (shu, prussian, pine, violet, ochre) e il colore lo dà il CSS (currentColor).
   Il disegno sta dentro il cerchio di raggio 38 attorno a (60,60): fuori ci sono le scritte. */
(function(){
"use strict";
/* onde da sinistra a destra: n gobbe larghe w, alte a */
const wave=(x,y,n,w=8,a=3)=>{let d=`M${x} ${y}`;for(let i=0;i<n;i++)d+=` q${w/4} ${-a} ${w/2} 0 t${w/2} 0`;return`<path d="${d}"/>`};
/* tetto giapponese con le punte all'insù: metà larghezza w, gronda a quota y */
const roof=(y,w,lift=3)=>`<path d="M${60-w} ${y-lift} Q${60-w*.55} ${y+.5} ${60-w*.2} ${y} H${60+w*.2} Q${60+w*.55} ${y+.5} ${60+w} ${y-lift}"/>`;
/* pagoda a cinque piani (Yasaka): tetti dal basso verso l'alto, corpo tra un tetto e l'altro */
function pagoda(){const R=[[78,23],[67,19.5],[56,16],[45,12.5],[35,9]];let s="";
  R.forEach(([y,w],i)=>{s+=roof(y,w,3.2);const b=w*.5;if(i===0)s+=`<path d="M${60-b} ${y} V86 M${60+b} ${y} V86"/>`;
    if(i<R.length-1){const[y2]=R[i+1];s+=`<path d="M${60-b*.86} ${y-1} V${y2+1} M${60+b*.86} ${y-1} V${y2+1}"/>`}});
  return s+'<path d="M60 32 V22 M57 25 H63 M57.5 28.5 H62.5"/><path d="M44 86 H76"/>'}
/* torii frontale: x0..x1 i pilastri, y la trave alta, yb la base */
function torii(x0,x1,y,yb,k=1){const o=4*k,d=1.5*k;return`<path d="M${x0-o} ${y} Q60 ${y-4*k} ${x1+o} ${y}"/><path d="M${x0-o*.6} ${y+5*k} H${x1+o*.6}"/><path d="M${x0} ${y+1} L${x0-d} ${yb} M${x1} ${y+1} L${x1+d} ${yb}"/>`}
const LANTERN=(cx,cy,rw,rh)=>`<path d="M${cx} ${cy-rh-6} V${cy-rh-2}"/><path d="M${cx-rw*.55} ${cy-rh-2} H${cx+rw*.55}"/><path d="M${cx-rw*.55} ${cy-rh} C${cx-rw*1.15} ${cy-rh*.5} ${cx-rw*1.15} ${cy+rh*.5} ${cx-rw*.55} ${cy+rh} H${cx+rw*.55} C${cx+rw*1.15} ${cy+rh*.5} ${cx+rw*1.15} ${cy-rh*.5} ${cx+rw*.55} ${cy-rh} Z"/><path d="M${cx-rw*.55} ${cy+rh+2} H${cx+rw*.55}"/><path d="M${cx-rw*.9} ${cy-rh*.33} H${cx+rw*.9} M${cx-rw*.9} ${cy+rh*.33} H${cx+rw*.9}"/>`;

/* [id, nome latino, kanji, inchiostro, disegno] nell'ordine della rotta: Tokyo I, Kyoto, Uji, Nara, Osaka, Kobe, Tokyo II */
const Z=[
 /* Tochō: due torri che si separano dal 33° piano, annessi bassi ai lati */
 ["shinjuku","Shinjuku","新宿","prussian",
  '<path d="M47 86 V46 H50 V33 H57 V46 H63 V33 H70 V46 H73 V86"/><path d="M53.5 38 V80 M66.5 38 V80 M47 60 H73"/><path d="M41 86 C35 68 35 50 41 38 C47 50 47 68 41 86 Z"/><path d="M37.5 54 Q41 51 44.5 54 M37 68 Q41 65 45 68"/><path d="M77 86 V51 H85 V86 M81 56 V81"/><path d="M33 86 H87"/>'],
 /* lo Scramble dall'alto: angoli dei marciapiedi, strisce sulle quattro strisce pedonali, la X in mezzo */
 ["shibuya","Shibuya","渋谷","shu",
  '<path d="M27 47 H47 V27 M73 27 V47 H93 M93 73 H73 V93 M47 93 V73 H27"/><path d="M53 33 V41 M60 33 V41 M67 33 V41 M53 79 V87 M60 79 V87 M67 79 V87 M33 53 H41 M33 60 H41 M33 67 H41 M79 53 H87 M79 60 H87 M79 67 H87"/><path d="M52 52 L56 56 M64 64 L68 68 M68 52 L64 56 M56 64 L52 68"/>'],
 /* il grande torii di Meiji Jingū tra gli alberi */
 ["harajuku-omotesando","Harajuku","原宿","pine",
  '<path d="M31 40 Q60 35 89 40 L87.5 45 Q60 41 32.5 45 Z"/><path d="M35 54 H85"/><path d="M42 45 L40 86 M78 45 L80 86 M60 45 V54"/><path d="M33 86 H87"/>'],
 /* l'orologio Wako sull'angolo curvo di Ginza 4-chōme */
 ["ginza-nihonbashi","Ginza","銀座","ochre",
  '<path d="M60 25 V30 M54 36 V30 H66 V36"/><path d="M48 36 H72"/><path d="M51 36 V54 M69 36 V54"/><circle cx="60" cy="45" r="6"/><path d="M60 45 V41.5 M60 45 H63"/><path d="M34 86 V60 Q60 51 86 60 V86"/><path d="M34 86 H86"/><path d="M44 63 V86 M54 60.5 V86 M66 60.5 V86 M76 63 V86"/>'],
 /* la grande lanterna rossa del Kaminarimon */
 ["asakusa-ueno","Asakusa","浅草","shu",
  '<path d="M60 23 V29"/><rect x="47" y="29" width="26" height="6" rx="1"/><path d="M47 35 C31 43 31 73 47 81 H73 C89 73 89 43 73 35 Z"/><rect x="47" y="81" width="26" height="6" rx="1"/><path d="M38 47 Q60 51 82 47 M35.5 58 Q60 62 84.5 58 M38 69 Q60 73 82 69"/><path d="M55 87 L53 93 M60 87 V93.5 M65 87 L67 93"/>'],
 /* insegna verticale a neon appesa al palazzo, con le scintille */
 ["akihabara","Akihabara","秋葉原","violet",
  '<path d="M38 30 V90"/><path d="M38 38 H48 M38 77 H48"/><rect x="48" y="27" width="24" height="60" rx="3"/><circle cx="60" cy="38" r="5"/><path d="M63 49 L55.5 59.5 H64.5 L57 70"/><path d="M54 79 H66 M60 75 V83"/><path d="M78 37 L85 33 M79 50 H88 M78 63 L85 67"/>'],
 /* la ruota panoramica sul mare */
 ["odaiba","Odaiba","お台場","prussian",
  '<circle cx="60" cy="50" r="22"/><circle cx="60" cy="50" r="3"/><path d="M60 28 V72 M38 50 H82 M44.5 34.5 L75.5 65.5 M75.5 34.5 L44.5 65.5"/><path d="M58 53 L48 82 M62 53 L72 82"/><path d="M36 82 H84"/>'+wave(40,89,5,8,2.6)],
 /* gruccia con la camicia vintage */
 ["shimokitazawa","Shimokitazawa","下北沢","ochre",
  '<path d="M55.5 30 a4.5 4.5 0 1 1 4.5 4.5 V38"/><path d="M60 38 L40 47 L31 58 L38.5 65 L45 60 V86 H75 V60 L81.5 65 L89 58 L80 47 Z"/><path d="M52.5 41.5 L60 51 L67.5 41.5"/><path d="M60 51 V86"/><path d="M65 62 H72 V69 H65"/>'],
 /* Tokyo Tower: gambe curve, due piattaforme, antenna */
 ["roppongi-azabu","Roppongi","六本木","shu",
  '<path d="M60 23 V31"/><path d="M57 31 H63 M57 31 Q56 60 43 87 M63 31 Q64 60 77 87"/><path d="M52 47 H68 V52 H52 Z"/><path d="M55.5 38 H64.5"/><path d="M50 66 H70 M48.5 70 H71.5"/><path d="M50 87 Q60 73 70 87"/><path d="M53.5 57 L66.5 66 M66.5 57 L53.5 66"/><path d="M36 87 H84"/>'],
 /* scalinata di pietra di Kagurazaka con la lanterna in cima */
 ["kagurazaka","Kagurazaka","神楽坂","violet",
  '<path d="M35 86 H46 V78 H56 V70 H66 V62 H76 V54 H87"/><path d="M46 86 V81 M56 78 V73 M66 70 V65 M76 62 V57"/><path d="M80 54 V46"/><path d="M73 34 H87"/><rect x="75" y="34" width="10" height="12"/><path d="M80 37.5 V42.5"/>'],
 /* Kyoto Tower sopra la stazione */
 ["kyoto-station","Kyōto-eki","京都駅","prussian",
  '<path d="M60 23 V34 M57.5 28 H62.5"/><rect x="50" y="34" width="20" height="8" rx="2.5"/><path d="M55 42 L56.5 69 M65 42 L63.5 69"/><path d="M33 86 V69 H87 V86"/><path d="M33 76 H87"/><path d="M42 76 V86 M51 76 V86 M60 76 V86 M69 76 V86 M78 76 V86"/>'],
 /* la pagoda Yasaka (Hōkan-ji) */
 ["gion-higashiyama","Gion","祇園","ochre",pagoda()],
 /* lanterne di carta di Pontochō sul fiume Kamo */
 ["pontocho-kawaramachi","Pontochō","先斗町","violet",
  '<path d="M37 32 H83"/>'+LANTERN(48,51,9,12)+LANTERN(73,46,6,8)+wave(34,76,6.5,8,3)+wave(40,85,5,8,3)],
 /* il bosco di bambù */
 ["arashiyama","Arashiyama","嵐山","pine",
  '<path d="M41 92 V80 M41 77 V64 M41 61 V48 M41 45 V32"/><path d="M38 78.5 H44 M38 62.5 H44 M38 46.5 H44"/><path d="M53 95 V82 M53 79 V65 M53 62 V47 M53 44 V25"/><path d="M50 80.5 H56 M50 63.5 H56 M50 45.5 H56"/><path d="M66 95 V84 M66 81 V68 M66 65 V51 M66 48 V25"/><path d="M63 82.5 H69 M63 66.5 H69 M63 49.5 H69"/><path d="M79 90 V78 M79 75 V62 M79 59 V46 M79 43 V31"/><path d="M76 76.5 H82 M76 60.5 H82 M76 44.5 H82"/><path d="M66 49.5 L74 43.5 M66 49.5 L75.5 49 M41 46.5 L34.5 41 M41 46.5 L33.5 47 M79 60.5 L86 55.5 M53 63.5 L46 58"/>'],
 /* il tunnel dei mille torii */
 ["fushimi","Fushimi","伏見","shu",
  torii(39,81,38,88,1)+torii(47,73,49,80,.7)+torii(53,67,56,75,.45)+'<path d="M56.5 61 H63.5 M57 61 V71 M63 61 V71"/>'],
 /* il Padiglione d'oro sullo stagno, con la fenice */
 ["kita-kyoto","Kita-Kyōto","北京都","ochre",
  '<path d="M57.5 28 L60 23 L62.5 28"/><path d="M42 39 Q50 38 54 30 H66 Q70 38 78 39"/><path d="M48 39 V48 M72 39 V48 M56 39 V48 M64 39 V48"/>'+roof(50,24,3)+'<path d="M43 50 V62 M77 50 V62 M51.5 50 V62 M60 50 V62 M68.5 50 V62"/>'+roof(64,26,3)+'<path d="M41 64 V75 M79 64 V75 M41 75 H79 M50 66 V75 M70 66 V75"/>'+wave(36,82,6,8,2.6)+wave(44,89,4,8,2.6)],
 /* il tempio sul taglio dei noodle di Ichijōji: una ciotola di ramen fumante */
 ["ichijoji","Ichijōji","一乗寺","shu",
  '<path d="M31 58 H89 C89 74 77 84 60 84 C43 84 31 74 31 58 Z"/><path d="M51 84 V88 H69 V84"/><path d="M35 66 H85"/><path d="M38.5 71 h4 v-3 M47 71 h4 v-3 M55.5 71 h4 v-3 M64 71 h4 v-3 M72.5 71 h4 v-3"/><path d="M62 54 L82 31 M69 56 L87 38"/><path d="M66 58 C63 52 71 50 67 44 M72 58 C69 53 77 51 74 46"/><path d="M42 51 C38 45 46 42 42 35 M51 51 C47 45 55 42 51 35"/>'],
 /* tazza di matcha con la schiuma e il vapore */
 ["uji","Uji","宇治","pine",
  '<path d="M33 56 H87 C87 71 77 81 60 81 C43 81 33 71 33 56 Z"/><path d="M50 81 V86 H70 V81"/>'+wave(38,62,5,8.8,2.2)+'<path d="M51 48 C47 42 55 38 51 31 M60 48 C56 42 64 38 60 30 M69 48 C65 42 73 38 69 31"/>'],
 /* un cervo del parco */
 ["nara-park","Nara-kōen","奈良公園","ochre",
  '<path d="M40 62 C40 55 46 54 53 55 H69 L73 44 L77 39 L87 43 L85 46.5 L78 47.5 L76.5 58 C76 64 72 67 66 67 H50 C44 67 40 66 40 62 Z"/><path d="M46 66 L45 85 M53 67 L54 85 M66 67 L65 85 M72 65 L73.5 85"/><path d="M40 58 L35.5 55"/><path d="M73.5 43 L67 39.5"/><path d="M76 40 L73 30 M74.3 34.5 L79 29 M73 30 L69.5 26"/><circle cx="80" cy="42.5" r=".6"/><path d="M50 59.5 h.1 M57 58.5 h.1 M63 60.5 h.1"/><path d="M36 86 H84"/>'],
 /* lanterna di pietra di Naramachi */
 ["naramachi","Naramachi","ならまち","pine",
  '<path d="M60 24 Q64 28 60 31 Q56 28 60 24 Z"/><path d="M42 41 L47 37 Q56 35 60 31 Q64 35 73 37 L78 41 Z"/><rect x="48" y="41" width="24" height="14"/><path d="M55 44 H65 V52 H55 Z"/><path d="M46 55 H74 L70 59 H50 Z"/><path d="M56 59 V76 M64 59 V76 M56 67.5 H64"/><path d="M48 76 H72 L76 82 H44 Z"/><path d="M36 86 H84"/>'],
 /* figura che corre a braccia alzate sul traguardo (non il marchio Glico) */
 ["dotonbori-namba","Dōtonbori","道頓堀","prussian",
  '<circle cx="61" cy="33" r="5"/><path d="M60.5 40 L58 59"/><path d="M60 44 L49 31 M60.5 44 L72 30"/><path d="M58 59 L70 63 L72 76"/><path d="M58 59 L53 72 L44 79"/><path d="M34 46 H43 M31 55 H41 M34 64 H42"/><path d="M36 86 H84"/>'],
 /* la galleria coperta di Shinsaibashi-suji in prospettiva */
 ["shinsaibashi","Shinsaibashi","心斎橋","violet",
  '<path d="M34 86 V54 Q34 32 60 32 Q86 32 86 54 V86"/><path d="M44 77 V57 Q44 43 60 43 Q76 43 76 57 V77"/><path d="M50 71 V59 Q50 51 60 51 Q70 51 70 59 V71"/><path d="M34 86 L50 71 M86 86 L70 71 M60 32 V51 M37 42 L51 55 M83 42 L69 55"/><path d="M50 71 H70"/>'],
 /* la Tsūtenkaku sopra l'arco di Shinsekai, con l'orologio */
 ["shinsekai","Shinsekai","新世界","shu",
  '<path d="M60 23 V30"/><path d="M48 30 H72 V38 H48 Z"/><path d="M51 38 L53 66 M69 38 L67 66"/><circle cx="60" cy="47" r="5"/><path d="M52 57 H68"/><path d="M40 86 L48 66 H72 L80 86"/><path d="M51 86 Q60 70 69 86"/><path d="M34 86 H86"/>'],
 /* Umeda Sky: due torri unite in cima dal giardino sospeso, con le scale mobili nei tubi */
 ["umeda","Umeda","梅田","prussian",
  '<path d="M40 86 V45 M54 86 V45 M66 86 V45 M80 86 V45"/><path d="M39 31 H81 V45 H39 Z"/><circle cx="60" cy="38" r="5"/><path d="M54 76 L66 60 M54 69 L66 53"/><path d="M47 52 V80 M73 52 V80"/><path d="M33 86 H87"/>'],
 /* il castello di Osaka: base di pietra, tre tetti, i pesci sul colmo */
 ["tanimachi-osaka-castle","Tanimachi","谷町","pine",
  '<path d="M37 86 L42 73 H78 L83 86 Z"/><path d="M40 80 H80"/><path d="M46 73 V66 M74 73 V66"/><path d="M38 67 L44 62 H76 L82 67"/><path d="M48 62 V55 M72 62 V55"/><path d="M41 56 L47 51 H73 L79 56"/><path d="M53 51 L60 45 L67 51"/><path d="M51 46 V40 M69 46 V40"/><path d="M45 41 L53 34 H67 L75 41"/><path d="M54 34 L52.5 28.5 M66 34 L67.5 28.5"/><path d="M57 58 H63 M57 68 H63"/>'],
 /* una barchetta di takoyaki con la salsa e lo stecchino */
 ["tenma","Tenma","天満","ochre",
  '<path d="M31 67 H89 L80 81 H40 Z"/><circle cx="44" cy="59" r="8"/><circle cx="60" cy="57" r="8"/><circle cx="76" cy="59" r="8"/><path d="M38 56 L43 53 L48 57 L54 53 L59 56 L64 52 L69 56 L74 53 L80 56"/><path d="M73 49 L83 33"/><path d="M50 45 C47 40 53 38 50 33 M59 45 C56 40 62 38 59 32"/>'],
 /* Kobe Port Tower, il tamburo rosso a clessidra */
 ["kobe-sannomiya","Sannomiya","三宮","shu",
  '<path d="M60 23 V30"/><path d="M48 30 H72 V36 H48 Z"/><path d="M50 36 Q58 61 46 86 M70 36 Q62 61 74 86"/><path d="M50.5 40 L68 57 M69.5 40 L52 57 M52 63 L71 83 M68 63 L49 83"/><path d="M55 60 H65"/><path d="M38 86 H82"/>'],
 /* una nave nel porto di Harborland */
 ["kobe-harborland","Harborland","神戸","prussian",
  '<path d="M31 66 H89 L80 79 H41 Z"/><path d="M45 66 V58 H76 V66"/><path d="M52 58 V51 H69 V58"/><path d="M61 51 V40 H69 V51 M61 45 H69"/><path d="M48 58 V44 M48 46 L42 50"/><circle cx="50" cy="72" r="1.2"/><circle cx="60" cy="72" r="1.2"/><circle cx="70" cy="72" r="1.2"/>'+wave(36,86,6,8,2.6)],
 /* l'arco luminoso della Sun Mall verso Nakano Broadway */
 ["nakano-koenji","Nakano","中野","violet",
  '<path d="M36 86 V60 A24 24 0 0 1 84 60 V86"/><path d="M44 86 V61 A16 16 0 0 1 76 61 V86"/><path d="M40 60 A20 20 0 0 1 80 60" stroke-dasharray="0 6.2"/><path d="M33 86 H87"/><path d="M44 72 H76"/><path d="M52 72 V86 M60 72 V86 M68 72 V86"/>']];

const INK={shu:"var(--shu)",prussian:"var(--prussian)",pine:"#2E6B4F",violet:"#6B4FA0",ochre:"#B8862B"};
/* arco alto: linea di base a raggio 42 da sinistra a destra passando sopra; arco basso: raggio 47 passando sotto (i kanji guardano il centro) */
function build([id,latin,kanji,ink,art]){
  return`<svg class="eki-z" data-ink="${ink}" data-zone="${id}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">`+
    `<defs><path id="eza-${id}" d="M18 60 A42 42 0 0 1 102 60"/><path id="ezb-${id}" d="M13 60 A47 47 0 0 0 107 60"/></defs>`+
    `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="60" cy="60" r="56.5" stroke-width="3"/><circle cx="60" cy="60" r="51.5" stroke-width="1"/><g class="ez-art" stroke-width="3">${art}</g></g>`+
    `<g fill="currentColor" stroke="none"><circle cx="13.5" cy="60" r="1.8"/><circle cx="106.5" cy="60" r="1.8"/>`+
    `<text font-size="11" style="font-family:var(--f-display,Georgia,serif);font-weight:600"><textPath href="#eza-${id}" startOffset="50%" text-anchor="middle">${latin}</textPath></text>`+
    `<text font-size="${kanji.length>3?9.5:10.5}" lang="ja" style="font-family:var(--f-jp,serif);font-weight:800"><textPath href="#ezb-${id}" startOffset="50%" text-anchor="middle">${kanji}</textPath></text></g></svg>`}
window.STAMPS=Object.fromEntries(Z.map(z=>[z[0],build(z)]));
window.STAMP_ORDER=Z.map(z=>z[0]);
window.STAMP_INK=Object.fromEntries(Z.map(z=>[z[0],INK[z[3]]]));
window.STAMP_NAME=Object.fromEntries(Z.map(z=>[z[0],z[1]]));
})();
