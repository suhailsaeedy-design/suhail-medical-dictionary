const VERSION='smd-v21-phase22';
const CORE_CACHE=VERSION+'-core';
const PACK_PREFIX=VERSION+'-pack-';
const CORE=['./','./index.html','./offline.html','./privacy.html','./terms.html','./settings.html','./about.html','./auth-callback.html','./manifest.webmanifest','./version.json','./assets/vendor/bootstrap/bootstrap.min.css','./assets/css/app.css','./assets/css/unified-search.css','./assets/css/offline-packs.css','./assets/css/personal-workspace.css','./assets/css/shell-navigation.css','./assets/css/design-system.css','./assets/js/core.js','./assets/js/i18n.js','./assets/js/unified-search.js','./assets/js/auth.js','./assets/js/login.js','./assets/js/offline-packs.js','./assets/js/pwa.js','./assets/js/workspace-pages.js','./assets/js/backup-manager.js','./assets/js/update-manager.js','./assets/js/cloud-auth.js','./assets/js/cloud-sync.js','./assets/js/cloud-readiness.js','./assets/js/shell-navigation.js','./assets/images/logo-book.svg','./assets/images/hero-dark.webp','./assets/images/hero-light.webp','./assets/images/login-anatomy.webp','./assets/images/heart.webp','./assets/images/lungs.webp','./assets/images/pancreas.webp','./assets/images/knee.webp','./assets/images/neuron.svg','./assets/images/suhail-saeedi-creator.webp','./assets/icons/apple-touch-icon-180.png','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./data/offline-packs.json','./data/auth-config.json'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CORE_CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(key=>key.startsWith('smd-')&&key!==CORE_CACHE&&!key.startsWith(PACK_PREFIX)).map(key=>caches.delete(key))
  )).then(()=>self.clients.claim()));
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
async function matchOfflineNavigation(request){
  const direct=await caches.match(request,{ignoreSearch:true});
  if(direct)return direct;
  const url=new URL(request.url);
  const file=url.pathname.split('/').filter(Boolean).pop()||'index.html';
  const scoped=new URL('./'+file,self.location.href).href;
  return (await caches.match(scoped,{ignoreSearch:true}))||(await caches.match('./offline.html'))||null;
}
async function networkFirstNavigation(request){
  try{
    return await fetch(request,{cache:'no-store'});
  }catch{
    return (await matchOfflineNavigation(request))||Response.error();
  }
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(networkFirstNavigation(event.request));
    return;
  }
  if(url.pathname.endsWith('/version.json')||url.pathname.endsWith('version.json')){
    event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match('./version.json')));
    return;
  }
  event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(cached=>cached||fetch(event.request)));
});
