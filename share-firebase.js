/* Giappone 2026 — condivisione della versione installabile (piano D).
   Fuori da claude.ai il sito non ha window.claude: qui se ne definisce uno con la stessa forma (db, user, assets; vedi tests/claude_mock.js),
   sopra Firebase (Firestore e accesso anonimo; niente Storage, che chiede il piano a pagamento: le foto stanno in Firestore, photos/<id>). L'SDK si carica da gstatic con import() solo alla prima use(), quindi dentro claude.ai
   (window.claude già presente o hostname con "claude") non si carica nulla. use() non rifiuta mai: senza rete o senza Firebase risolve null
   e il sito degrada come oggi. Percorsi identici a quelli del sito (rsvp/<id>, tastes/<id>, stamps/<id>, people/<uid>, meet/<data>, photos/<id>). */
(function(){
"use strict";
const CFG=window.FIREBASE_CONFIG;
if(window.claude||!CFG||/claude/i.test(location.hostname||""))return;
const SDK="https://www.gstatic.com/firebasejs/10.14.1/";
const LOAD_MS=15000,WRITE_MS=8000;

/* ── errori nella forma del contratto: {code,message} ── */
const err=(code,message)=>Object.assign(new Error(message||code),{code,message:message||code});
const DB_CODES={"permission-denied":"invalid_argument","invalid-argument":"invalid_argument","not-found":"invalid_argument","failed-precondition":"invalid_argument","already-exists":"invalid_argument","out-of-range":"invalid_argument",
  "resource-exhausted":"resource_exhausted","unauthenticated":"not_granted","unavailable":"unavailable","deadline-exceeded":"unavailable","aborted":"unavailable","cancelled":"unavailable","internal":"unavailable","unknown":"unavailable"};
const OURS=new Set(["invalid_argument","resource_exhausted","quota_exceeded","unavailable","revoked","not_granted"]);
const dbErr=e=>e&&OURS.has(e.code)?e:err(DB_CODES[String(e&&e.code||"").replace(/^firestore\//,"")]||"unavailable",e&&e.message);
const report=x=>{try{(window.reportError||console.error)(x)}catch(e){}};
/* errori degli asset (foto in Firestore) nella forma di assets di claude.ai */
const AS_CODES={"permission-denied":"not_granted","unauthenticated":"not_granted","resource-exhausted":"quota_or_state","invalid-argument":"invalid_request","unavailable":"store_unavailable","deadline-exceeded":"store_unavailable"};
const asErr=e=>err(AS_CODES[String(e&&e.code||"").replace(/^firestore\//,"")]||"upstream_error",e&&e.message);

/* ── caricamento unico: SDK, app, accesso anonimo persistente ── */
let boot=null;
function load(){if(boot)return boot;
  boot=Promise.race([(async()=>{
    const [A,F,U]=await Promise.all(["firebase-app","firebase-firestore","firebase-auth"].map(n=>import(SDK+n+".js")));
    const app=A.initializeApp(CFG),fs=F.getFirestore(app),auth=U.getAuth(app);
    /* il primo onAuthStateChanged dice se c'è già un accesso salvato su questo telefono; se no, accesso anonimo */
    let user=await new Promise(res=>{let done=false,off=null;const fin=u=>{if(done)return;done=true;res(u||null);if(off)off();else setTimeout(()=>off&&off(),0)};off=U.onAuthStateChanged(auth,fin,()=>fin(null))});
    if(!user)user=(await U.signInAnonymously(auth)).user;
    if(!user||!user.uid)throw new Error("accesso anonimo senza uid");
    return{F,fs,uid:user.uid}})(),
    new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),LOAD_MS))])
  .catch(e=>{console.info("condivisione Firebase non disponibile",e&&e.message||"");return null});
  return boot}

/* ── percorsi: stessa grammatica del contratto; data/users/<uid>/… va in users/<uid>/data/… ── */
const segs=p=>String(p).split("/").filter(Boolean);
const SEG=/^[A-Za-z0-9_\-.~:@+]+$/;
function check(path,even){const s=segs(path);
  if(!s.length||s.length>16||String(path).length>1000)throw new TypeError("path breaks the grammar: "+path);
  for(const x of s)if(!SEG.test(x)||x==="."||x===".."||x.length>200)throw new TypeError("bad segment in path: "+path);
  if((s.length%2===0)!==even)throw new TypeError((even?"document":"collection")+" path needs an "+(even?"even":"odd")+" number of segments: "+path);
  return s.join("/")}
// REVIEW: il piano dice data/users/<uid>/… → users/<uid>/…, ma così cambierebbe la parità (data/users/<uid> è una collezione, users/<uid> un documento): si usa users/<uid>/data/… (il sito oggi non usa data/users)
const fsPath=p=>{const s=segs(p);return s[0]==="data"&&s[1]==="users"&&s.length>=3?["users",s[2],"data",...s.slice(3)].join("/"):s.join("/")};

const META=m=>Object.freeze({fromCache:!!(m&&m.fromCache),hasPendingWrites:!!(m&&m.hasPendingWrites)});
const clone=o=>o==null?o:JSON.parse(JSON.stringify(o));
const deepFreeze=o=>{if(o&&typeof o==="object"){Object.freeze(o);for(const v of Object.values(o))deepFreeze(v)}return o};
function snapDoc(s){const ex=!!(s&&(typeof s.exists==="function"?s.exists():s.exists));const d=ex?deepFreeze(clone(s.data())):undefined;
  return Object.freeze({id:s.id,exists:ex,data:()=>d,metadata:META(s.metadata)})}
function snapQuery(q){const docs=q.docs.map(snapDoc),byId=new Map(docs.map(d=>[d.id,d]));
  const ch=()=>{try{return(typeof q.docChanges==="function"?q.docChanges():[]).map(c=>Object.freeze({type:c.type,doc:byId.get(c.doc.id)||snapDoc(c.doc),oldIndex:c.oldIndex,newIndex:c.newIndex}))}catch(e){return[]}};
  return Object.freeze({docs,size:docs.length,empty:!docs.length,docChanges:ch,metadata:META(q.metadata)})}
const body=data=>{if(!data||typeof data!=="object"||Array.isArray(data))throw err("invalid_argument","body must be a plain object");return clone(data)};
/* una scrittura che non arriva al server (telefono offline) resta in coda in Firestore: dopo WRITE_MS il sito va avanti come se fosse fatta */
// REVIEW: con la cache in memoria una scrittura in coda si perde se la pagina si chiude prima di tornare online
const settle=p=>Promise.race([p,new Promise(r=>setTimeout(r,WRITE_MS))]);

function makeDb(B){const{F,fs}=B;
  /* una sottoscrizione: al più un errore terminale, poi muta; l'Unsubscribe è idempotente */
  function listen(real,wrap,next,error){let dead=false,off=null;const fail=e=>{if(dead)return;dead=true;const x=dbErr(e);error?error(x):report(x)};
    try{off=F.onSnapshot(real(),s=>{if(!dead)next(wrap(s))},fail)}catch(e){setTimeout(()=>fail(e),0)}
    return()=>{dead=true;const f=off;off=null;try{f&&f()}catch(e){}}}
  const wrapWrite=fn=>async(...a)=>{try{return await fn(...a)}catch(e){throw dbErr(e)}};
  function docRef(path){path=check(path,true);const real=()=>F.doc(fs,fsPath(path));
    return Object.freeze({id:segs(path).pop(),path,
      get:wrapWrite(async()=>snapDoc(await F.getDoc(real()))),
      set:wrapWrite(async data=>{const d=body(data);await settle(F.setDoc(real(),d))}),
      /* update: il documento deve esistere; gli oggetti annidati si fondono (setDoc con merge), gli array si sostituiscono */
      update:wrapWrite(async data=>{const d=body(data);const s=await F.getDoc(real());if(!snapDoc(s).exists)throw err("invalid_argument","update of a missing document");await settle(F.setDoc(real(),d,{merge:true}))}),
      delete:wrapWrite(async()=>{await settle(F.deleteDoc(real()))}),
      // REVIEW: lease cooperativo semplice (leggi e scrivi, senza transazione); il sito non lo usa
      acquire:wrapWrite(async(o={})=>{const ttl=Math.min(6e5,Math.max(1e3,+o.ttlMs||3e4)),now=Date.now();const s=snapDoc(await F.getDoc(real())),l=s.exists?(s.data()||{})._lease:null;
        if(l&&l.exp>now&&l.holder!==o.holder)return{acquired:false,expiresAt:new Date(l.exp).toISOString()};
        const exp=now+ttl;await settle(F.setDoc(real(),Object.assign(clone(o.data||{}),{_lease:{holder:String(o.holder||""),exp}}),{merge:true}));
        return{acquired:true,expiresAt:new Date(exp).toISOString(),holder:String(o.holder||"")}}),
      onSnapshot(next,error){return listen(real,snapDoc,next,error)},
      collection:sub=>collRef(path+"/"+sub)})}
  function query(path,cons){const real=()=>cons.length?F.query(F.collection(fs,fsPath(path)),...cons.map(c=>c())):F.collection(fs,fsPath(path));
    return{where:(f,op,v)=>query(path,cons.concat([()=>F.where(f,op,v)])),
      orderBy:(f,dir)=>query(path,cons.concat([()=>F.orderBy(f,dir==="desc"?"desc":"asc")])),
      limit:n=>{n=Math.floor(+n);if(!(n>=1&&n<=1000))throw err("invalid_argument","limit 1-1000");return query(path,cons.concat([()=>F.limit(n)]))},
      get:wrapWrite(async()=>snapQuery(await F.getDocs(real()))),
      onSnapshot(next,error){return listen(real,snapQuery,next,error)}}}
  function collRef(path){path=check(path,false);
    return Object.freeze(Object.assign(query(path,[]),{path,
      doc:id=>docRef(path+"/"+(id==null||id===""?F.doc(F.collection(fs,fsPath(path))).id:id)),
      add:async data=>{const r=docRef(path+"/"+F.doc(F.collection(fs,fsPath(path))).id);await r.set(data);return r}}))}
  return Object.freeze({doc:docRef,collection:collRef})}

/* ── user: id = uid dell'accesso anonimo; i nomi vengono da people/<uid> (campo who, scritto dal "Chi sei?") ── */
const PALETTE=["#D63A1E","#C9A24A","#1F3A5F","#2E8B6B","#7A5FC2","#1C83A8","#8A5A44","#5E6B3A"];
const colorOf=id=>{let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))>>>0;return PALETTE[h%PALETTE.length]};
const avatarOf=(id,name)=>"data:image/svg+xml,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="${colorOf(id)}"/><text x="20" y="26" font-family="sans-serif" font-size="18" text-anchor="middle" fill="#fff">${(name[0]||"?").toUpperCase().replace(/[<&>]/g,"")}</text></svg>`);
const nameFrom=d=>{if(!d)return"";if(typeof d.name==="string"&&d.name)return d.name;const w=typeof d.who==="string"?d.who:"";return w?w[0].toUpperCase()+w.slice(1):""};
function makeUser(B){const{F,fs,uid}=B;let names=new Map(),ready=null;
  /* una sola sottoscrizione a people (sei documenti): i nomi restano freschi, anche il proprio appena scelto */
  const start=()=>ready||(ready=new Promise(res=>{let first=true;const done=()=>{if(first){first=false;res()}};
    try{F.onSnapshot(F.collection(fs,"people"),q=>{names=new Map(q.docs.map(d=>[d.id,nameFrom(d.data())]));done()},()=>{done();ready=null})}catch(e){done();ready=null}}));
  const nameOf=async id=>{await Promise.race([start(),new Promise(r=>setTimeout(r,4000))]);return names.get(id)||""};
  const okId=id=>typeof id==="string"&&SEG.test(id)&&id.length<=200;
  const prof=async id=>{const name=okId(id)?await nameOf(id):"";return Object.freeze({id,name,avatarUrl:avatarOf(id,name),color:colorOf(id),email:null,isMe:id===uid,guest:false})};
  return Object.freeze({
    isOwner:async()=>false,canEdit:async()=>false,can:async n=>n==="data.write",
    id:async()=>uid,name:async()=>okId(uid)?nameOf(uid):"",avatarUrl:async()=>null,email:async()=>null,search:async()=>[],
    me:async()=>{const p=await prof(uid);return Object.freeze({id:uid,name:p.name,avatarUrl:p.avatarUrl,color:p.color,email:null,isOwner:false,canEdit:false})},
    profiles:async ids=>{const list=[...new Set([].concat(ids==null?[]:ids).map(String))];const out={};await Promise.all(list.map(async id=>{out[id]=await prof(id)}));return out}})}

/* ── assets: un doc Firestore per foto, photos/<id> = {uid, data:<data URL>, contentType, sizeBytes, at}; url = il data URL ──
   Firestore tiene al più 1 MiB per doc: il data URL resta sotto 1.000.000 caratteri (la regola lo controlla); tastes.js manda foto di al più 220 KB. */
const TYPES={"image/jpeg":"jpg","image/png":"png","image/gif":"gif","image/webp":"webp"};
const MAX_DATA=1000000;
const hex=()=>{const a=new Uint8Array(16);crypto.getRandomValues(a);return Array.from(a,b=>b.toString(16).padStart(2,"0")).join("")};
const toDataUrl=(blob,type)=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).replace(/^data:[^;,]*/,"data:"+type));r.onerror=()=>rej(r.error||new Error("read"));r.readAsDataURL(blob)});
function makeAssets(B){const{F,fs,uid}=B;const mine=new Map();
  const at=id=>F.doc(fs,"photos/"+id);
  return Object.freeze({
    upload:async(blob,opt={})=>{if(!(blob instanceof Blob)||!blob.size)throw err("invalid_request","not a blob");const type=(opt&&opt.type)||blob.type;
      if(!TYPES[type])throw err("unsupported_type",type||"empty");
      let data;try{data=await toDataUrl(blob,type)}catch(e){throw err("invalid_request","unreadable blob")}
      if(data.length>=MAX_DATA)throw err("too_large","over 1 MB as data URL");
      const id=hex(),when=new Date().toISOString();
      try{await settle(F.setDoc(at(id),{uid,data,contentType:type,sizeBytes:blob.size,at:Date.now()}))}catch(e){throw asErr(e)}
      mine.set(id,{type,size:blob.size,at:when});return{id,url:data,sizeBytes:blob.size,contentType:type}},
    // REVIEW: list() minimo: solo i caricamenti di questa visita, senza url (il sito non lo usa)
    list:async()=>({assets:[...mine].map(([id,a])=>({id,url:null,contentType:a.type,sizeBytes:a.size,createdAt:a.at})),usage:{files:mine.size,bytes:[...mine.values()].reduce((s,a)=>s+a.size,0),maxFiles:1000,maxBytes:1e9}}),
    /* cancella photos/<id> solo se il campo uid è il proprio */
    delete:async ref=>{const m=String(ref||"").match(/([0-9a-f]{32})/);if(!m)throw err("invalid_request","not an asset id");const id=m[1];
      let s;try{s=await F.getDoc(at(id))}catch(e){throw asErr(e)}
      const d=s&&(typeof s.exists==="function"?s.exists():s.exists)?s.data():null;if(!d)return{deleted:false};
      if(d.uid!==uid)throw err("not_uploader","not your photo");
      try{await settle(F.deleteDoc(at(id)))}catch(e){throw asErr(e)}mine.delete(id);return{deleted:true}}})}

/* ── window.claude: stessa forma di quello di claude.ai ── */
const NS={};
const shim={firebase:true,use:name=>load().then(B=>{if(!B)return null;try{
    if(name==="db")return NS.db||(NS.db=makeDb(B));
    if(name==="user")return NS.user||(NS.user=makeUser(B));
    if(name==="assets")return NS.assets!==undefined?NS.assets:(NS.assets=makeAssets(B));
    return null}catch(e){console.info("condivisione Firebase:",name,e&&e.message||"");return null}})};
try{Object.defineProperty(window,"claude",{value:shim,writable:true,configurable:true,enumerable:true})}catch(e){window.claude=shim}
})();
