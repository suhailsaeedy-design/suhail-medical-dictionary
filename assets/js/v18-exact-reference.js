(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
function applyReferenceLabels(){
  // Keep real features, but use the exact visual hierarchy from the approved mockups.
  const promo=$('.med-side-promo');
  if(promo){
    const strong=$('strong',promo); if(strong) strong.textContent='Suhail Study Suite';
    const small=$('small',promo); if(small) small.innerHTML='✓ Extended study chats<br>✓ Offline Packs<br>✓ Advanced Filters<br>✓ PDF & print tools';
    const link=$('.promo-button',promo); if(link) link.innerHTML='Open Study Suite <span>→</span>';
  }
  const result=$('#resultsCountLabel'); if(result && !/terms found/i.test(result.textContent||'')) result.dataset.v18Label='1';
}
function syncThemeArt(){
  const dark=['dark','ocean'].includes(document.body.dataset.theme);
  const hero=$('[data-v15-hero-art]'); if(hero) hero.src=`./assets/images/v15/hero-art-${dark?'dark':'light'}.webp`;
  const robot=$('.study-bot img'); if(robot) robot.src=`./assets/images/v15/robot-${dark?'dark':'light'}.webp`;
}
function profileAvatar(){
  const btn=$('#accountButton'); if(!btn) return;
  const paint=()=>{
    const dot=$('.avatar-dot',btn); if(!dot || dot.querySelector('img')) return;
    const metaName=$('.account-lines b',btn)?.textContent||'';
    const email=$('#accountMenuEmail')?.textContent||'';
    if(/suhail/i.test(metaName)||/suhail/i.test(email)){
      const img=document.createElement('img');img.src='./assets/images/suhail-saeedy.webp';img.alt='';dot.textContent='';dot.appendChild(img);
    }
  };
  paint(); new MutationObserver(paint).observe(btn,{childList:true,subtree:true,characterData:true});
}
function keepDetailUsable(){
  const detail=$('#detailPanel'); if(!detail) return;
  const obs=new MutationObserver(()=>{
    if(detail.querySelector('.detail-title-block')) detail.classList.add('open');
    // Make the visual itself a selectable/rotatable interaction target.
    const stage=$('.detail-visual-stage',detail); if(stage && !stage.dataset.v18Bound){
      stage.dataset.v18Bound='1'; let down=false,x=0,rot=0;
      stage.style.cursor='grab';
      stage.addEventListener('pointerdown',e=>{down=true;x=e.clientX;stage.setPointerCapture?.(e.pointerId);stage.style.cursor='grabbing';});
      stage.addEventListener('pointermove',e=>{if(!down)return;rot+=(e.clientX-x)*.55;x=e.clientX;const img=$('img',stage);if(img){img.style.animation='none';img.style.transform=`perspective(800px) rotateY(${rot}deg) scale(1.04)`;}});
      const end=()=>{down=false;stage.style.cursor='grab';};stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);
    }
  });
  obs.observe(detail,{childList:true,subtree:true});
}
function immediateBootGuard(){
  // Never leave a blank screen: if the local boot loader survives too long, expose a deterministic action.
  const loader=$('#sessionLoader'); if(!loader)return;
  setTimeout(()=>{
    if(!document.body.classList.contains('auth-pending')||!loader.isConnected)return;
    loader.innerHTML='<div class="session-error-card"><h2>Workspace is taking longer than expected</h2><p>Use Retry, or sign in again. Your dictionary files are already on this site.</p><div class="session-error-actions"><button class="button primary" onclick="location.reload()">Retry</button><a class="button ghost" href="./index.html">Back to sign in</a></div></div>';
  },7000);
}
function init(){applyReferenceLabels();syncThemeArt();profileAvatar();keepDetailUsable();immediateBootGuard();new MutationObserver(syncThemeArt).observe(document.body,{attributes:true,attributeFilter:['data-theme']});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
