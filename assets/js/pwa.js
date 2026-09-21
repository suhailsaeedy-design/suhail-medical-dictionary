(() => {
  let deferredPrompt=null;
  const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
  async function requestInstall(){
    if(isStandalone()){alert('Suhail Medical Dictionary is already running as an installed app.');return false}
    if(deferredPrompt){deferredPrompt.prompt();const result=await deferredPrompt.userChoice;deferredPrompt=null;return result.outcome==='accepted'}
    if(isIOS()){alert('iPhone/iPad: open this site in Safari → tap Share → Add to Home Screen.');return false}
    alert('Use your browser menu and choose Install app / Add to Home Screen if an install option is available.');return false
  }
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;document.dispatchEvent(new CustomEvent('smd21:install-ready'))});
  addEventListener('appinstalled',()=>{deferredPrompt=null;document.dispatchEvent(new CustomEvent('smd21:installed'))});
  if('serviceWorker'in navigator){addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))}
  document.addEventListener('click',e=>{const b=e.target.closest('#installBtn,#installLogin,[data-install-app]');if(!b)return;e.preventDefault();requestInstall()});
  window.SMD21PWA={requestInstall,isStandalone,isIOS,get installPromptReady(){return !!deferredPrompt}};
})();
