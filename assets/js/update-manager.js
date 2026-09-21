(() => {
  'use strict';
  const CURRENT_VERSION='21.20.0';
  const $=s=>document.querySelector(s);
  let last=null;
  async function latestRelease(){
    const r=await fetch(`./version.json?update_check=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache'}});
    if(!r.ok)throw Error(`Update check HTTP ${r.status}`);
    const v=await r.json(); if(!v?.version)throw Error('Release metadata is missing a version.');return v;
  }
  async function registration(){if(!('serviceWorker'in navigator))return null;return navigator.serviceWorker.getRegistration();}
  async function check(){
    const latest=await latestRelease(); const reg=await registration();
    const updateAvailable=latest.version!==CURRENT_VERSION || !!reg?.waiting;
    last={current:CURRENT_VERSION,latest:latest.version,release:latest.release||'',updateAvailable,waiting:!!reg?.waiting};return last;
  }
  async function apply(){
    if(!('serviceWorker'in navigator)){location.reload();return;}
    const reg=(await registration())||await navigator.serviceWorker.register('./sw.js');
    let reloading=false;const reload=()=>{if(reloading)return;reloading=true;location.reload()};
    navigator.serviceWorker.addEventListener('controllerchange',reload,{once:true});
    await reg.update();
    if(reg.waiting){reg.waiting.postMessage({type:'SKIP_WAITING'});return;}
    if(reg.installing){reg.installing.addEventListener('statechange',()=>{if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});if(reg.installing?.state==='activated')reload()});return;}
    reload();
  }
  function render(info){
    const current=$('#currentReleaseVersion'),latest=$('#latestReleaseVersion'),badge=$('#releaseUpdateBadge'),detail=$('#releaseUpdateDetail'),applyBtn=$('#applyReleaseUpdate');
    if(!current||!latest||!badge||!detail||!applyBtn)return;
    current.textContent=`v${CURRENT_VERSION}`;latest.textContent=`v${info.latest}`;
    badge.textContent=info.updateAvailable?'Update available':'Up to date';badge.className=`cloud-badge ${info.updateAvailable?'warn':'ok'}`;
    detail.textContent=info.updateAvailable?`${info.release||'A newer release'} is available. Refresh through the update action to activate the newest Service Worker and core shell.`:'This browser is using the current deployed release metadata.';
    applyBtn.disabled=!info.updateAvailable;
  }
  async function initUI(){
    const checkBtn=$('#checkReleaseUpdate'),applyBtn=$('#applyReleaseUpdate'),status=$('#releaseUpdateStatus');if(!checkBtn||!applyBtn||!status)return;
    const set=(m,ok=false)=>{status.textContent=m;status.classList.toggle('ok',ok)};
    async function doCheck(){checkBtn.disabled=true;set('Checking deployed release metadata…');try{const i=await check();render(i);set(i.updateAvailable?`New release detected: v${i.latest}.`:`v${CURRENT_VERSION} is current.`,!i.updateAvailable)}catch(e){set(`Update check failed: ${e.message}`)}finally{checkBtn.disabled=false}}
    checkBtn.addEventListener('click',doCheck);applyBtn.addEventListener('click',async()=>{applyBtn.disabled=true;set('Updating Service Worker and core shell…');try{await apply()}catch(e){set(`Update activation failed: ${e.message}`);applyBtn.disabled=false}});
    await doCheck();
  }
  document.addEventListener('DOMContentLoaded',initUI);
  window.SMD21Updates={CURRENT_VERSION,latestRelease,check,apply};
})();
