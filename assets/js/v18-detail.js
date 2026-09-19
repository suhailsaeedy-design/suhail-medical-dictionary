(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const mobile=()=>innerWidth<=820;
  const dark=()=>['dark','ocean'].includes(document.body.dataset.theme);
  let sheetCard=null, holdTimer=null, holdTriggered=false;

  function ensureDetailChrome(){
    if(!mobile()||!document.body.classList.contains('detail-open'))return;
    const panel=$('#detailPanel'),visual=$('.detail-visual-wrap',panel||document);if(!panel||!visual)return;
    const heartImg=$('.detail-visual',visual);if(heartImg && /detail-heart/.test(heartImg.getAttribute('src')||'')){heartImg.src=dark()?'./assets/images/v16/hero-mobile-dark.webp':'./assets/images/v16/hero-mobile-light.webp';heartImg.dataset.v18HeroDetail='1';}
    if(!$('.v18-detail-search',visual)){
      const b=document.createElement('button');b.type='button';b.className='v18-detail-search';b.setAttribute('aria-label','Search dictionary');visual.appendChild(b);
      b.addEventListener('click',()=>{document.querySelector('#detailCloseButton')?.click();document.body.classList.add('v17-mobile-search-mode');setTimeout(()=>$('#heroSearchMirror')?.focus(),50);});
    }
    if(!$('.v18-detail-360',visual)){
      const b=document.createElement('button');b.type='button';b.className='v18-detail-360';b.textContent='360°';b.setAttribute('aria-label','360 degree view');visual.appendChild(b);
      b.addEventListener('click',()=>toggle3D(true));
    }
    if(dark() && !$('.v18-view-3d',panel)){
      const b=document.createElement('button');b.type='button';b.className='v18-view-3d';b.textContent='View in 3D';
      const actions=$('.detail-actions',panel);if(actions)actions.insertAdjacentElement('afterend',b);else panel.appendChild(b);
      b.addEventListener('click',()=>toggle3D(true));
    }
    bind3D();
  }

  function bind3D(){
    const stage=$('#detailPanel .detail-visual-stage');if(!stage||stage.dataset.v18Drag==='1')return;stage.dataset.v18Drag='1';
    let startX=0,angle=0,down=false;
    const apply=(a)=>{angle=Math.max(-34,Math.min(34,a));const img=$('.detail-visual',stage);if(img)img.style.transform=`perspective(760px) rotateY(${angle}deg) rotateZ(${angle*.035}deg) scale(1.025)`;stage.dataset.angle=String(angle)};
    stage.addEventListener('pointerdown',e=>{if(!mobile())return;down=true;startX=e.clientX;stage.setPointerCapture?.(e.pointerId);stage.classList.add('v18-dragging','v18-3d-engaged')});
    stage.addEventListener('pointermove',e=>{if(!down)return;apply(angle+(e.clientX-startX)*.18);startX=e.clientX});
    const up=()=>{down=false;stage.classList.remove('v18-dragging')};stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);
  }

  function toggle3D(scroll){
    const stage=$('#detailPanel .detail-visual-stage');if(!stage)return;stage.classList.add('v18-3d-engaged');
    const img=$('.detail-visual',stage);if(img){img.animate([{transform:'perspective(760px) rotateY(0deg) scale(1.02)'},{transform:'perspective(760px) rotateY(18deg) scale(1.035)'},{transform:'perspective(760px) rotateY(-14deg) scale(1.035)'},{transform:'perspective(760px) rotateY(0deg) scale(1.02)'}],{duration:1100,easing:'ease-in-out'});}
    if(scroll)$('.detail-visual-wrap')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function ensureSheet(){
    let root=$('.v18-action-sheet');if(root)return root;
    root=document.createElement('div');root.className='v18-action-sheet';root.setAttribute('aria-hidden','true');
    root.innerHTML=`<div class="v18-action-sheet-panel" role="dialog" aria-modal="true" aria-label="Term actions"><div class="v18-action-sheet-handle"></div><div class="v18-action-head"><img alt="" aria-hidden="true"><div><strong>Medical term</strong><small>Category</small></div><button type="button" class="v18-action-close" aria-label="Close">×</button></div><button type="button" class="v18-action-row" data-action="ai"><span class="v18-action-icon">✦</span><span><strong>AI Study</strong><small>Get AI explanations, quizzes and more</small></span></button><button type="button" class="v18-action-row" data-action="pdf"><span class="v18-action-icon">▤</span><span><strong>Export PDF</strong><small>Download as PDF document</small></span></button><button type="button" class="v18-action-row" data-action="print"><span class="v18-action-icon">▣</span><span><strong>Print</strong><small>Print or save to device</small></span></button><button type="button" class="v18-action-row" data-action="select"><span class="v18-action-icon">▮</span><span><strong>Add to Selected</strong><small>Save to your collection</small></span></button></div>`;
    document.body.appendChild(root);
    root.addEventListener('click',e=>{if(e.target===root)closeSheet();});$('.v18-action-close',root)?.addEventListener('click',closeSheet);
    $$('[data-action]',root).forEach(b=>b.addEventListener('click',()=>runAction(b.dataset.action)));
    return root;
  }

  function openSheet(card){
    if(!mobile()||!card)return;sheetCard=card;const root=ensureSheet();const name=$('.term-name',card)?.textContent?.trim()||'Medical term';const cat=$('.tag',card)?.textContent?.trim()||'Medical term';const img=$('.term-visual img',card)?.src||'';
    $('.v18-action-head strong',root).textContent=name;$('.v18-action-head small',root).textContent=cat;const im=$('.v18-action-head img',root);if(im)im.src=img;
    root.classList.add('open');root.setAttribute('aria-hidden','false');
  }
  function closeSheet(){const r=$('.v18-action-sheet');r?.classList.remove('open');r?.setAttribute('aria-hidden','true');}

  function openDetailForCard(card,cb){
    if(!card)return;const main=$('.term-main',card);main?.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
    let tries=0;const tick=()=>{if(document.body.classList.contains('detail-open')){ensureDetailChrome();cb?.();return;}if(++tries<30)setTimeout(tick,40)};setTimeout(tick,40);
  }

  function showSelectedToast(term){
    /* Reuse the project's accessible success dialog; create it through the existing detail flow if needed. */
    let t=$('.v17-selected-toast');
    if(!t){
      t=document.createElement('div');t.className='v17-selected-toast';t.setAttribute('aria-hidden','true');t.innerHTML='<div class="v17-selected-toast-card" role="status" aria-live="polite"><div class="v17-selected-toast-check">✓</div><h3>Added to Selected</h3><p></p><button type="button">View Selected →</button></div>';document.body.appendChild(t);
      t.addEventListener('click',e=>{if(e.target===t){t.classList.remove('open');t.setAttribute('aria-hidden','true')}});$('button',t)?.addEventListener('click',()=>{t.classList.remove('open');$('#mobileSelectedButton')?.click()});
    }
    const p=$('p',t);if(p)p.textContent=`“${term}” has been added to your collection.`;t.classList.add('open');t.setAttribute('aria-hidden','false');
  }

  function runAction(action){
    const card=sheetCard;const term=$('.term-name',card||document)?.textContent?.trim()||'This term';closeSheet();if(!card)return;
    if(action==='select'){
      const cb=$('.term-check input',card);if(cb && !cb.checked){cb.checked=true;cb.dispatchEvent(new Event('change',{bubbles:true}));}
      if(!dark())setTimeout(()=>showSelectedToast(term),120);return;
    }
    openDetailForCard(card,()=>{const map={ai:'#detailAI',pdf:'#detailPDF',print:'#detailPrint'};$(map[action]||'')?.click();});
  }

  function bindLongPress(){
    document.addEventListener('pointerdown',e=>{if(!mobile())return;const card=e.target.closest('.term-card');if(!card||e.target.closest('button,input,label'))return;holdTriggered=false;clearTimeout(holdTimer);holdTimer=setTimeout(()=>{holdTriggered=true;openSheet(card);navigator.vibrate?.(18)},520);},{passive:true});
    ['pointerup','pointercancel','pointermove'].forEach(type=>document.addEventListener(type,e=>{if(type==='pointermove'&&holdTimer&&Math.abs(e.movementX||0)+Math.abs(e.movementY||0)<6)return;clearTimeout(holdTimer);holdTimer=null;},{passive:true}));
    document.addEventListener('contextmenu',e=>{if(!mobile())return;const card=e.target.closest('.term-card');if(!card)return;e.preventDefault();openSheet(card)});
  }

  function observeDetail(){
    new MutationObserver(()=>{if(document.body.classList.contains('detail-open'))setTimeout(ensureDetailChrome,0)}).observe(document.body,{attributes:true,attributeFilter:['class','data-theme']});
    const panel=$('#detailPanel');if(panel)new MutationObserver(()=>{if(document.body.classList.contains('detail-open'))ensureDetailChrome()}).observe(panel,{childList:true,subtree:true});
  }

  function init(){ensureSheet();bindLongPress();observeDetail();if(document.body.classList.contains('detail-open'))ensureDetailChrome();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
