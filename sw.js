/* Giappone 2026 — service worker della versione installabile (piano C).
   Registrato da app.js come sw.js?v=SITE_V, solo su https e fuori da claude.ai: la versione nel nome della cache ("giappone-v71").
   Strategia: rete prima per le pagine e per data/*.json (le novità arrivano subito, offline resta l'ultima copia);
   cache prima per il resto (js, geo, img, icone, tutti con ?v=). Le cache delle versioni vecchie si cancellano all'attivazione. */
"use strict";
const V=new URL(self.location.href).searchParams.get("v")||"0";
const CACHE="giappone-v"+V;
const q=u=>u+"?v="+V;
const CORE=["./","index.html","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png",q("geo/stations.json"),
  ...["firebase-config.js","share-firebase.js","icons.js","stamps.js","app.js","tastes.js","story.js","map.js","vendor/maplibre-gl.min.js"].map(q),
  ...["trip","places","zones","bases","phrases","i18n","images","apps","omikuji","lasttrain"].map(n=>q("data/"+n+".json")),
  ...["japan","wards","rail","roads","water"].map(n=>q("geo/"+n+".json"))];
self.addEventListener("install",ev=>{ev.waitUntil((async()=>{const c=await caches.open(CACHE);
  await Promise.all(CORE.map(u=>c.add(u).catch(()=>{})));
  /* le foto delle zone e delle fasi: l'elenco è in data/images.json */
  try{const r=await c.match(q("data/images.json"))||await fetch(q("data/images.json"));const j=await r.clone().json();
    await Promise.all((j.images||[]).map(i=>c.add(q(i.file)).catch(()=>{})))}catch(e){}
  await self.skipWaiting()})())});
self.addEventListener("activate",ev=>{ev.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith("giappone-v")&&k!==CACHE)await caches.delete(k);await self.clients.claim()})())});
/* la pagina, appena registrato il worker, manda l'elenco di ciò che ha caricato (pagina compresa): si mette in cache */
self.addEventListener("message",ev=>{const urls=ev.data&&ev.data.warm;if(!Array.isArray(urls))return;
  ev.waitUntil(caches.open(CACHE).then(c=>Promise.all(urls.filter(u=>new URL(u,self.location.href).origin===self.location.origin).map(u=>c.match(u).then(m=>m||c.add(u)).catch(()=>{})))))});
async function netFirst(req){const c=await caches.open(CACHE);
  try{const r=await fetch(req);if(r&&r.ok)c.put(req,r.clone());return r}
  catch(e){const m=await c.match(req,{ignoreSearch:req.mode==="navigate"})||(req.mode==="navigate"?await c.match("./")||await c.match("index.html"):null);if(m)return m;throw e}}
async function cacheFirst(req){const c=await caches.open(CACHE);const m=await c.match(req);if(m)return m;
  const r=await fetch(req);if(r&&r.ok&&r.type==="basic")c.put(req,r.clone());return r}
self.addEventListener("fetch",ev=>{const req=ev.request;if(req.method!=="GET")return;const u=new URL(req.url);
  if(u.origin!==self.location.origin)return; // font, meteo, Firebase (gstatic, Firestore, Storage): rete normale
  if(u.pathname.endsWith("sw.js")||u.pathname.startsWith("/_blob/"))return; // le foto degli assaggi stanno sull'host dell'artifact
  if(req.mode==="navigate"||/\/data\/[^/]+\.json$/.test(u.pathname)){ev.respondWith(netFirst(req));return}
  ev.respondWith(cacheFirst(req))});
