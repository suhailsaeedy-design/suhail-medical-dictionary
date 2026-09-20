const BUILD_VERSION='20260920-v20190';
const VERSION=`smd-${/^__BUILD_/.test(BUILD_VERSION)?'20.19.0-source':BUILD_VERSION}`;
const STATIC_CACHE=`${VERSION}-static`;
const DATA_CACHE=`${VERSION}-data`;
const RUNTIME_CACHE=`${VERSION}-runtime`;
const CORE=[
  './assets/vendor/bootstrap/bootstrap.min.css','./assets/vendor/bootstrap/bootstrap.bundle.min.js','./assets/vendor/bootstrap-icons/bootstrap-icons.min.css','./assets/vendor/jszip.min.js','./assets/css/styles.css',
  './assets/css/v20-release.css','./assets/css/v20-login.css','./assets/css/v20-shell.css','./assets/css/v20-dictionary.css','./assets/css/v20-reference.css','./assets/css/v20-anatomy.css',
  './assets/css/v20-ai.css','./assets/css/v20-admin.css','./assets/css/v20-about.css','./assets/css/v20-offline.css','./assets/css/v20-legal.css',
  './assets/css/v20-dictionary-foundation.css','./assets/css/v20-17-repair.css','./assets/css/v20-18-polish.css','./assets/css/v20-18-2-final-layout.css','./assets/css/v20-19-aqua-glass.css','./assets/css/v20-admin-login.css','./assets/js/config.js','./assets/js/auth.js',
  './assets/js/ai.js','./assets/js/ai-page.js','./assets/js/admin.js','./assets/js/about.js','./assets/js/export.js',
  './assets/js/pwa.js','./assets/js/v20-login.js','./assets/js/v20-shell.js','./assets/js/v20-dictionary.js','./assets/js/v20-reference.js',
  './assets/js/v20-anatomy.js','./assets/js/v20-offline.js','./assets/js/v20-17-repair.js','./assets/js/v20-18-polish.js','./assets/js/v20-18-2-final-layout.js','./assets/js/v20-access-guard.js','./assets/js/v20-legal-consent.js','./assets/js/admin-login.js','./','./index.html','./app.html','./admin-login.html',
  './anatomy.html','./ai.html','./admin.html','./about.html','./privacy.html',
  './terms.html','./offline.html','./manifest.webmanifest','./version.json','./ai-config.json',
  './data/index.json','./data/feature-coverage.json','./data/packs.json','./data/offline/manifest.json','./data/anatomy/manifest.json','./data/anatomy/adult-bones.json','./data/anatomy/structures.json','./data/clinical-reference.json',
  './data/reference/diseases.json','./data/reference/pharmacology.json','./data/reference/procedures.json','./data/reference/calculators.json','./data/reference/interactions.json',
  './data/reference/learning.json','./data/i18n/medical-ui.json','./data/i18n/medical-terms-ps-prs.json','./assets/models/anatomy/adult206/adult-skeleton-male.obj','./assets/models/anatomy/adult206/adult-skeleton-female.obj','./assets/icons/icon-192.png',
  './assets/icons/apple-touch-icon-180.png','./assets/icons/icon-512.png','./assets/images/suhail-saeedy.webp','./assets/models/anatomy/low/skeleton.obj',
  './assets/models/anatomy/low/muscles.obj','./assets/models/anatomy/low/organs.obj','./assets/models/anatomy/low/systems.obj','./assets/models/anatomy/low/ligaments.obj','./assets/models/anatomy/low/joints.obj','./assets/models/anatomy/low/nerves.obj','./assets/models/anatomy/low/vessels.obj','./assets/images/logo-book.svg','./assets/images/medical-3d/anatomy.svg',
  './assets/images/medical-3d/capsule.svg','./assets/images/medical-3d/dna.svg','./assets/images/medical-3d/heart.svg','./assets/images/medical-3d/hero-books.svg','./assets/images/medical-3d/kidneys.svg',
  './assets/images/medical-3d/lungs.svg','./assets/images/medical-3d/membrane.svg','./assets/images/medical-3d/microbe.svg','./assets/images/medical-3d/molecule-a.svg','./assets/images/medical-3d/molecule-b.svg',
  './assets/images/medical-3d/neuron.svg','./assets/images/medical-3d/protein.svg','./assets/images/reference3d/blood.webp','./assets/images/reference3d/heart-neural.webp','./assets/images/reference3d/heart.webp',
  './assets/images/reference3d/hero-dark.webp','./assets/images/reference3d/hero-light.webp','./assets/images/reference3d/intestine.webp','./assets/images/reference3d/knee.webp','./assets/images/reference3d/login-anatomy.webp',
  './assets/images/reference3d/lungs.webp','./assets/images/reference3d/lungs2.webp','./assets/images/reference3d/pancreas.webp','./assets/images/v12/blood-dark.webp','./assets/images/v12/blood-light.webp',
  './assets/images/v12/heart-dark.webp','./assets/images/v12/heart-light.webp','./assets/images/v12/heart_neural-dark.webp','./assets/images/v12/heart_neural-light.webp','./assets/images/v12/hero-dark.webp',
  './assets/images/v12/hero-light.webp','./assets/images/v12/intestine-dark.webp','./assets/images/v12/intestine-light.webp','./assets/images/v12/knee-dark.webp','./assets/images/v12/knee-light.webp',
  './assets/images/v12/lungs-dark.webp','./assets/images/v12/lungs-light.webp','./assets/images/v12/lungs2-dark.webp','./assets/images/v12/lungs2-light.webp','./assets/images/v12/pancreas-dark.webp',
  './assets/images/v12/pancreas-light.webp','./assets/images/v16/hero-art-dark.webp','./assets/images/v16/hero-art-light.webp','./assets/images/v16/hero-mobile-dark.webp','./assets/images/v16/hero-mobile-light.webp',
  './assets/images/v16/login-heart-light.webp','./assets/images/v16/robot-dark.webp','./assets/images/v16/robot-light.webp',
];
const CACHEABLE_CDNS=[];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(STATIC_CACHE);
  for(const u of CORE){try{const r=await fetch(u,{cache:'reload'});if(r.ok)await cache.put(u,r);}catch{}}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('smd-')&&![STATIC_CACHE,DATA_CACHE,RUNTIME_CACHE].includes(key))await caches.delete(key);
  await self.clients.claim();
  const clients=await self.clients.matchAll({type:'window'});clients.forEach(c=>c.postMessage({type:'APP_UPDATED',version:VERSION}));
})()));
self.addEventListener('message',event=>{
  const msg=event.data||{};
  if(msg.type==='SKIP_WAITING')self.skipWaiting();
  if(msg.type==='CACHE_URLS')event.waitUntil(cacheUrls(msg.urls||[],event.source));
  if(msg.type==='CLEAR_OFFLINE')event.waitUntil((async()=>{await caches.delete(DATA_CACHE);event.source?.postMessage({type:'OFFLINE_CACHE_CLEARED'});})());
});
async function cacheUrls(urls,source){
  const cache=await caches.open(DATA_CACHE);let done=0,failed=0;
  for(const url of urls){
    try{const req=new Request(url,{cache:'reload'});const res=await fetch(req);if(res.ok||res.type==='opaque')await cache.put(req,res.clone());else failed++;}
    catch{failed++;}
    done++;source?.postMessage({type:'OFFLINE_CACHE_PROGRESS',done,total:urls.length,failed});
  }
  source?.postMessage({type:failed?'OFFLINE_CACHE_PARTIAL':'OFFLINE_CACHE_DONE',done,total:urls.length,failed});
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin===location.origin){
    if(event.request.mode==='navigate'){event.respondWith(networkFirst(event.request,STATIC_CACHE,'./index.html'));return;}
    if(url.pathname.includes('/data/')){event.respondWith(staleWhileRevalidate(event.request,DATA_CACHE));return;}
    if(url.pathname.endsWith('/version.json')||url.pathname.endsWith('/ai-config.json')){event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match(event.request)));return;}
    event.respondWith(networkFirst(event.request,STATIC_CACHE));return;
  }
  if(CACHEABLE_CDNS.includes(url.hostname)){event.respondWith(cacheFirst(event.request,RUNTIME_CACHE));}
});
async function networkFirst(req,cacheName,fallback){
  try{const fresh=await fetch(req,{cache:'no-cache'});if(fresh.ok)(await caches.open(cacheName)).put(req,fresh.clone());return fresh;}
  catch{return (await caches.match(req))||(fallback?await caches.match(fallback):null)||new Response('Offline',{status:503});}
}
async function staleWhileRevalidate(req,cacheName){
  const cache=await caches.open(cacheName);const cached=await cache.match(req);
  const p=fetch(req,{cache:'no-cache'}).then(r=>{if(r.ok)cache.put(req,r.clone());return r;}).catch(()=>null);
  return cached||(await p)||new Response(JSON.stringify({error:'Offline data pack not downloaded'}),{status:503,headers:{'content-type':'application/json'}});
}
async function cacheFirst(req,cacheName){
  const cache=await caches.open(cacheName);const cached=await cache.match(req);if(cached)return cached;
  try{const r=await fetch(req);if(r.ok||r.type==='opaque')cache.put(req,r.clone());return r;}catch{return new Response('',{status:503});}
}
