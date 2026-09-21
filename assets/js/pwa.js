import {CONFIG} from './config.js?v=20.19.2';
const $=s=>document.querySelector(s);let refreshing=false,registration=null;
const EXTERNAL=[];
export async function initPWA({categories=[]}={}){
 updateNetworkBadge();window.addEventListener('online',()=>{updateNetworkBadge();checkVersion();registration?.update().catch(()=>{});});window.addEventListener('offline',updateNetworkBadge);
 if(!('serviceWorker'in navigator)){setOfflineStatus('Offline app mode is not supported by this browser.');return;}
 registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
 const applyWaiting=()=>{if(registration?.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});};
 if(registration.waiting){CONFIG.autoApplyUpdates?applyWaiting():showUpdate(applyWaiting);}
 registration.addEventListener('updatefound',()=>{const w=registration.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller){CONFIG.autoApplyUpdates?applyWaiting():showUpdate(applyWaiting);}});});
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;preserveDraft();location.reload();});
 navigator.serviceWorker.addEventListener('message',e=>handleMessage(e.data||{}));
 const check=()=>{registration?.update().catch(()=>{});checkVersion();};check();setInterval(check,30*60*1000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
 $('#downloadOfflineButton')?.addEventListener('click',()=>downloadOffline(categories));
 $('#removeOfflineButton')?.addEventListener('click',()=>navigator.serviceWorker.controller?.postMessage({type:'CLEAR_OFFLINE'}));
 refreshOfflineStatus();
}
function showUpdate(apply){const b=$('#updateAppButton');if(!b)return;b.classList.remove('hidden');b.onclick=apply;}
function preserveDraft(){const box=$('#chatInput');if(box?.value)localStorage.setItem('smd-chat-draft',box.value);}
async function checkVersion(){
 try{const r=await fetch(`./version.json?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)return;const v=await r.json();const old=localStorage.getItem('smd-release-version');if(old&&old!==v.version&&registration)await registration.update();localStorage.setItem('smd-release-version',v.version);const label=$('#appVersion');if(label)label.textContent=v.version; }catch{}
}
function handleMessage(msg){
 if(msg.type==='OFFLINE_CACHE_PROGRESS'){const pct=Math.round((msg.done/Math.max(msg.total,1))*100);setOfflineStatus(`Downloading offline dictionary… ${pct}%${msg.failed?` · ${msg.failed} failed`:''}`);const bar=$('#offlineProgress');if(bar){bar.hidden=false;bar.value=pct;}}
 if(msg.type==='OFFLINE_CACHE_DONE'||msg.type==='OFFLINE_CACHE_PARTIAL'){localStorage.setItem('smd-offline-ready','1');setOfflineStatus(msg.failed?`Offline pack saved with ${msg.failed} missing file(s). Retry while online.`:'Complete dictionary is ready for offline use.');const bar=$('#offlineProgress');if(bar){bar.value=100;setTimeout(()=>bar.hidden=true,1500);}}
 if(msg.type==='OFFLINE_CACHE_CLEARED'){localStorage.removeItem('smd-offline-ready');setOfflineStatus('Offline dictionary data removed from this device.');}
}
function updateNetworkBadge(){const el=$('#networkStatus');if(!el)return;el.textContent=navigator.onLine?'Online':'Offline';el.dataset.state=navigator.onLine?'online':'offline';}
function setOfflineStatus(t){const el=$('#offlineStatus');if(el)el.textContent=t;}
function refreshOfflineStatus(){if(localStorage.getItem('smd-offline-ready')==='1')setOfflineStatus('Offline dictionary pack is installed on this device.');}
async function downloadOffline(categories){
 if(!navigator.onLine){setOfflineStatus('Connect to the internet once to download the offline pack.');return;}
 if(!navigator.serviceWorker.controller){setOfflineStatus('The offline engine is initializing. Reload once, then press Download offline.');return;}
 const files=['./data/index.json',...categories.flatMap(c=>(c.files||[c.file]).filter(Boolean).map(f=>`./data/categories/${f}`)),...EXTERNAL];
 try{if(navigator.storage?.estimate){const est=await navigator.storage.estimate();const free=(est.quota||0)-(est.usage||0);if(free&&free<40*1024*1024&&!confirm('This device has limited free storage. Continue downloading the complete offline dictionary?'))return;}}
 catch{}
 setOfflineStatus(`Preparing ${files.length} offline files…`);navigator.serviceWorker.controller.postMessage({type:'CACHE_URLS',urls:files});
}
