/* Suhail Medical Dictionary v18.0 — Phase 7 interaction polish. */
(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const desktop=()=>innerWidth>820;
  const svg=(paths,view='0 0 24 24')=>`<svg viewBox="${view}" aria-hidden="true">${paths}</svg>`;
  const ICONS={
    home:svg('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h5v-6h3v6h5v-9.5"/>'),
    book:svg('<path d="M4 5.5c3.4-.8 5.9-.2 8 1.6v13c-2.1-1.8-4.6-2.4-8-1.6z"/><path d="M20 5.5c-3.4-.8-5.9-.2-8 1.6v13c2.1-1.8 4.6-2.4 8-1.6z"/>'),
    spark:svg('<path d="m12 2 1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/>'),
    star:svg('<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
    cloud:svg('<path d="M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 8.5 4.6 4.6 0 0 0 7 18Z"/><path d="M12 10v6m-2-2 2 2 2-2"/>'),
    bookmark:svg('<path d="M6 3h12v18l-6-4-6 4z"/>'),
    clock:svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
    info:svg('<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/>'),
    settings:svg('<circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.8-.8-1.9.8-2-2.1-2.1-2 .8-1.9-.8L10.5 2h-3l-.8 2-1.9.8-2-.8-2.1 2.1.8 2-.8 1.9-2 .5v3l2 .8.8 1.9-.8 2 2.1 2.1 2-.8 1.9.8.8 2h3l.8-2 1.9-.8 2 .8 2.1-2.1-.8-2z" transform="translate(2) scale(.83)"/>'),
    rotate:svg('<path d="M20 7v5h-5"/><path d="M19 12a7.5 7.5 0 1 1-2.2-5.3L20 9"/>'),
    image:svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m5 18 4.5-4 3.5 3 2.5-2 3.5 3"/>'),
    layers:svg('<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>'),
    ai:svg('<path d="m12 3 1.3 4L17 8.4l-3.7 1.3L12 14l-1.3-4.3L7 8.4 10.7 7z"/><path d="M18.5 14.5 19 16l1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5L18 16z"/>'),
    file:svg('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
    print:svg('<path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7z"/>'),
    select:svg('<path d="M6 3h12v18l-6-4-6 4z"/>'),
    share:svg('<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/>')
  };

  function installSidebarIcons(){
    const icons=['home','book','spark','star','cloud','bookmark','clock','info','settings'];
    $$('.med-nav-item .nav-ico').forEach((n,i)=>{if(icons[i])n.innerHTML=ICONS[icons[i]];});
  }

  function fixPromo(){
    const p=$('.med-side-promo:not(.ai-side-card)');if(!p)return;
    let orb=$('.promo-orb',p);if(!orb){orb=document.createElement('div');orb.className='promo-orb';p.prepend(orb);}orb.innerHTML='<span aria-hidden="true">♛</span>';
    const title=$('strong',p);if(title)title.innerHTML='Upgrade to<br>Suhail Premium';
    const features=$('small',p);if(features)features.innerHTML='✓ Unlimited AI Study<br>✓ Offline Packs<br>✓ Advanced Filters<br>✓ And More...';
    const button=$('.promo-button',p);if(button){button.innerHTML='Go Premium <span>→</span>';button.href='./ai.html';}
  }

  function bindCardTilt(card){
    if(card.dataset.v18p7Tilt==='1')return;card.dataset.v18p7Tilt='1';
    card.addEventListener('pointermove',e=>{
      if(!desktop()||document.body.classList.contains('reduce-3d')||document.body.classList.contains('reduce-motion'))return;
      const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      card.style.setProperty('--p7-ry',`${(x*5).toFixed(2)}deg`);card.style.setProperty('--p7-rx',`${(-y*4).toFixed(2)}deg`);
    },{passive:true});
    const reset=()=>{card.style.setProperty('--p7-ry','0deg');card.style.setProperty('--p7-rx','0deg')};
    card.addEventListener('pointerleave',reset,{passive:true});card.addEventListener('pointercancel',reset,{passive:true});
  }
  function observeCards(){
    const grid=$('#termGrid');if(!grid)return;
    const apply=()=>$$('.term-card',grid).forEach(bindCardTilt);apply();
    new MutationObserver(apply).observe(grid,{childList:true,subtree:true});
  }

  function assetPaths(img){
    const a=img?.dataset?.v12Asset||'heart';const mode=['dark','ocean'].includes(document.body.dataset.theme)?'dark':'light';
    const refMap={heart:'heart',pancreas:'pancreas',lungs:'lungs',lungs2:'lungs2',heart_neural:'heart-neural',blood:'blood',knee:'knee',intestine:'intestine'};
    return {primary:`./assets/images/v12/${a}-${mode}.webp`,reference:`./assets/images/reference3d/${refMap[a]||'heart'}.webp`};
  }

  function enhanceDetail(){
    if(!desktop())return;const panel=$('#detailPanel');if(!panel||!$('.detail-visual',panel))return;
    const stage=$('.detail-visual-stage',panel),img=$('.detail-visual',panel),stack=$('.detail-v18-toolstack',panel);if(!stage||!img||!stack)return;
    if(stack.dataset.v18p7!=='1'){
      stack.dataset.v18p7='1';const buttons=$$('button',stack);
      if(buttons[0]){buttons[0].innerHTML=ICONS.rotate;buttons[0].title='Animate 3D view';buttons[0].setAttribute('aria-label','Animate 3D view');}
      if(buttons[1]){buttons[1].innerHTML=ICONS.image;buttons[1].title='Primary medical visual';buttons[1].setAttribute('aria-label','Primary medical visual');}
      if(buttons[2]){buttons[2].innerHTML=ICONS.layers;buttons[2].title='Alternate medical visual';buttons[2].setAttribute('aria-label','Alternate medical visual');}
      buttons[0]?.addEventListener('click',()=>{stage.classList.toggle('v18p7-spinning');buttons[0].classList.toggle('active',stage.classList.contains('v18p7-spinning'));});
      buttons[1]?.addEventListener('click',()=>{const p=assetPaths(img);img.src=p.primary;buttons.forEach(b=>b.classList.remove('active'));buttons[1].classList.add('active');});
      buttons[2]?.addEventListener('click',()=>{const p=assetPaths(img);img.src=p.reference;buttons.forEach(b=>b.classList.remove('active'));buttons[2].classList.add('active');});
    }
    if(stage.dataset.v18p7Drag!=='1'){
      stage.dataset.v18p7Drag='1';let down=false,lastX=0,lastY=0,ry=0,rx=0;
      stage.addEventListener('pointerdown',e=>{if(!desktop())return;down=true;lastX=e.clientX;lastY=e.clientY;stage.setPointerCapture?.(e.pointerId);stage.classList.remove('v18p7-spinning')});
      stage.addEventListener('pointermove',e=>{if(!down)return;ry=Math.max(-34,Math.min(34,ry+(e.clientX-lastX)*.18));rx=Math.max(-10,Math.min(10,rx-(e.clientY-lastY)*.08));lastX=e.clientX;lastY=e.clientY;stage.style.setProperty('--p7-detail-y',`${ry}deg`);stage.style.setProperty('--p7-detail-x',`${rx}deg`);img.style.setProperty('--p7-detail-y',`${ry}deg`);img.style.setProperty('--p7-detail-x',`${rx}deg`);});
      const up=()=>{down=false};stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);
    }
    installActionIcons(panel);
  }

  function installActionIcons(panel=document){
    const map=[['#detailAI','ai'],['#detailPDF','file'],['#detailPrint','print'],['#detailSelect','select'],['#detailShare','share']];
    map.forEach(([sel,key])=>{const b=$(sel,panel);if(!b||b.dataset.v18p7Icon)return;b.dataset.v18p7Icon='1';const span=$('span',b);b.innerHTML=ICONS[key]+(span?`<span>${span.textContent}</span>`:'');});
  }
  function observeDetail(){
    const panel=$('#detailPanel');if(!panel)return;const apply=()=>setTimeout(enhanceDetail,0);apply();
    new MutationObserver(apply).observe(panel,{childList:true,subtree:true});
  }

  function installLoginReferenceForm(){
    if(!document.body.classList.contains('auth-page'))return;const panel=$('#googleSignInPanel');if(!panel||$('.auth-reference-fields',panel))return;
    const block=document.createElement('div');block.className='auth-reference-fields';block.innerHTML=`
      <div class="auth-faux-input" aria-hidden="true">${svg('<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>')}<span>Enter your email address</span></div>
      <div class="auth-faux-input" aria-hidden="true">${svg('<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>')}<span>Enter your password</span><span class="auth-faux-eye">${svg('<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>')}</span></div>
      <div class="auth-reference-meta"><span><i class="auth-reference-check">✓</i> Remember me</span><span>Forgot password?</span></div>
      <button id="referenceSignIn" class="auth-reference-submit" type="button">Sign In&nbsp;&nbsp; →</button>`;
    panel.prepend(block);
    const divider=$('.auth-divider',panel);const google=$('#googleSignIn',panel);if(divider){$('span',divider).textContent='OR CONTINUE WITH';if(google)panel.insertBefore(divider,google);} 
    if(google){const text=$('#googleButtonText',google);if(text)text.textContent='Sign in with Google';}
    if(!$('.auth-account-hint',panel)){
      const hint=document.createElement('div');hint.className='auth-account-hint';hint.innerHTML=`Don't have an account? <button type="button" id="authCreateNow">Create one now →</button>`;google?.insertAdjacentElement('afterend',hint);
    }
    $('#referenceSignIn')?.addEventListener('click',()=>google?.click());$('#authCreateNow')?.addEventListener('click',()=>google?.click());
    const title=$('#authTitle');if(title)title.textContent='Welcome Back';const subtitle=$('#authSubtitle');if(subtitle)subtitle.textContent='Sign in to continue your medical learning journey with trusted knowledge.';
  }

  function init(){installSidebarIcons();fixPromo();observeCards();observeDetail();installLoginReferenceForm();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  addEventListener('resize',()=>{if(desktop()){installSidebarIcons();fixPromo();enhanceDetail();}},{passive:true});
})();
