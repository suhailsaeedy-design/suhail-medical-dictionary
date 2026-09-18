const BUILD='__BUILD_VERSION__';
const CACHE=`suhail-medical-v10-${BUILD}`;
const CORE=[
 './','./index.html','./app.html','./manifest.webmanifest','./privacy.html','./terms.html','./404.html','./version.json','./data/index.json',
 './assets/css/base.css','./assets/css/login.css','./assets/css/app.css',
 './assets/js/config.js','./assets/js/data.js','./assets/js/storage.js','./assets/js/auth.js','./assets/js/ai.js','./assets/js/export.js','./assets/js/app.js',
 './assets/img/heart.jpg','./assets/img/pancreas.jpg','./assets/img/lungs.jpg','./assets/img/neuron.jpg','./assets/img/rbc.jpg','./assets/img/joint.jpg','./assets/img/appendix.jpg','./assets/img/robot.jpg','./assets/img/hero-heart.jpg','./assets/img/hero-books.jpg',
 './assets/img/icon-192.png','./assets/img/icon-512.png','./assets/img/suhail-saeedy.webp'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('suhail-medical-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;const url=new URL(e.request.url);if(url.origin!==location.origin)return;
 e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return res}).catch(()=>caches.match('./index.html'))));
});
async function cacheCompleteDictionary(source){
 const cache=await caches.open(CACHE);await cache.addAll(CORE);
 try{
  const indexReq=new Request('./data/index.json');const response=await fetch(indexReq,{cache:'no-cache'});if(!response.ok)throw new Error('Dictionary index unavailable');const clone=response.clone();await cache.put(indexReq,clone);const index=await response.json();
  const files=(index.categories||[]).flatMap(c=>(c.files||(c.file?[c.file]:[])).map(f=>`./data/categories/${f}`));let done=0;
  for(const path of files){try{const r=await fetch(path);if(r.ok)await cache.put(path,r.clone())}catch{}done++;if(done%4===0||done===files.length)source?.postMessage?.({type:'OFFLINE_PROGRESS',done,total:files.length})}
  source?.postMessage?.({type:'OFFLINE_READY',total:files.length,terms:index.term_count||0});
 }catch(error){source?.postMessage?.({type:'OFFLINE_ERROR',message:error.message||'Offline pack failed.'})}
}
self.addEventListener('message',e=>{if(e.data?.type==='CACHE_OFFLINE')e.waitUntil(cacheCompleteDictionary(e.source))});
