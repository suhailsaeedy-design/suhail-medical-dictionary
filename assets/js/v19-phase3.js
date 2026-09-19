(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const mobile=()=>matchMedia('(max-width:820px)').matches;
  const cubeSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>';

  function visualFor(name=''){
    const s=name.toLowerCase();
    if(/brain|alzheimer|stroke|neuro/.test(s))return './assets/images/medical-3d/neuron.svg';
    if(/lung|pneum|asthma|respir/.test(s))return './assets/images/reference3d/lungs.webp';
    if(/kidney|renal/.test(s))return './assets/images/medical-3d/kidneys.svg';
    if(/diabet|pancre|glucose/.test(s))return './assets/images/reference3d/pancreas.webp';
    if(/anemia|blood/.test(s))return './assets/images/reference3d/blood.webp';
    if(/joint|fract|bone|osteo/.test(s))return './assets/images/reference3d/knee.webp';
    return './assets/images/reference3d/heart.webp';
  }

  function addNews(){
    if(!$('.workspace-page')||$('.v19p3-news'))return;
    const anchor=$('.study-assistant-strip')||$('.utility-strip')||$('#dictionary');
    if(!anchor)return;
    const section=document.createElement('section');section.className='v19p3-news';section.setAttribute('aria-label','Medical learning feed');
    const cards=[
      ['Cardiovascular learning','Review heart anatomy, terminology and common cardiovascular concepts.','./assets/images/reference3d/heart.webp','cardiology'],
      ['Respiratory system','Connect lung anatomy with respiratory terminology and dictionary definitions.','./assets/images/reference3d/lungs.webp','pulmonology'],
      ['Metabolic medicine','Study pancreas, glucose regulation and endocrine terminology.','./assets/images/reference3d/pancreas.webp','endocrinology']
    ];
    section.innerHTML=`<div class="v19p3-news-head"><div><strong>Medical News & Learning</strong><small>Offline-safe study cards · live AI needs internet</small></div><a href="./anatomy.html">3D Anatomy →</a></div><div class="v19p3-news-list">${cards.map(([t,p,img,cat])=>`<a class="v19p3-news-card" href="./app.html#dictionary" data-v19p3-category="${cat}"><img src="${img}" alt=""><div><b>${t}</b><p>${p}</p></div><i>›</i></a>`).join('')}</div>`;
    anchor.insertAdjacentElement('afterend',section);
    $$('[data-v19p3-category]',section).forEach(a=>a.addEventListener('click',()=>localStorage.setItem('smd-v19p3-category',a.dataset.v19p3Category||'all')));
  }

  function restoreNewsCategory(){
    const cat=localStorage.getItem('smd-v19p3-category');if(!cat)return;localStorage.removeItem('smd-v19p3-category');
    const btn=$(`[data-category-chip="${CSS.escape(cat)}"]`);if(btn)setTimeout(()=>btn.click(),650);
  }

  function enhanceDetail(){
    const panel=$('#detailPanel');if(!panel||!panel.classList.contains('open'))return;
    const title=$('#detailTermName',panel)?.textContent?.trim()||'Medical term';
    if(!$('.v19p3-view3d',panel)){
      const link=document.createElement('a');link.className='v19p3-view3d';link.href=`./anatomy.html?term=${encodeURIComponent(title)}&layer=${/lung|pneum|asthma/i.test(title)?'systems':/fract|bone|osteo|joint/i.test(title)?'skeleton':'organs'}`;link.innerHTML=`${cubeSvg}<span>View in 3D Anatomy</span><b>→</b>`;
      const actions=$('.detail-actions',panel),offline=$('.detail-offline',panel);(actions||offline||panel.lastElementChild)?.insertAdjacentElement(actions?'afterend':'beforebegin',link);
    }
    const img=$('.detail-visual',panel);if(img&&!img.dataset.v19p3){img.dataset.v19p3='1';img.style.objectFit='contain';img.style.padding='4px';}
  }

  function observeDetail(){
    const panel=$('#detailPanel');if(!panel)return;let timer;
    new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(enhanceDetail,30)}).observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    enhanceDetail();
  }

  function aiHero(){
    if(!document.body.classList.contains('ai-page')||$('.v19p3-ai-hero'))return;
    const content=$('.ai-page-content');if(!content)return;
    const hero=document.createElement('section');hero.className='v19p3-ai-hero';
    hero.innerHTML=`<div class="v19p3-ai-title"><img src="./assets/images/v16/robot-dark.webp" alt=""><div><h1>Hello! I’m Suhail AI</h1><p>Your medical learning assistant. Ask questions, get explanations, and create study prompts. AI requires internet.</p></div></div><div class="v19p3-ai-actions"><button type="button" data-prompt="Explain this medical concept simply"><b>✦</b>Explain</button><button type="button" data-prompt="Summarize the key facts"><b>▤</b>Summarize</button><button type="button" data-prompt="Create a short practice quiz"><b>?</b>Create Quiz</button><button type="button" data-prompt="Make a study plan for this topic"><b>▦</b>Study Plan</button></div>`;
    content.prepend(hero);
    $$('[data-prompt]',hero).forEach(b=>b.addEventListener('click',()=>{const input=$('#chatInput');if(input){input.value=b.dataset.prompt;input.focus();input.scrollIntoView({behavior:'smooth',block:'center'});}}));
    const learning=document.createElement('section');learning.className='v19p3-learning';learning.innerHTML=`<div class="v19p3-learning-head"><strong>Today’s Learning</strong><small>Offline cards</small></div><div class="v19p3-learning-card"><img src="./assets/images/reference3d/heart.webp" alt=""><div><b>Hypertension study review</b><p>Definition, related terminology and anatomy links.</p></div><span>›</span></div><div class="v19p3-learning-card"><img src="./assets/images/reference3d/lungs.webp" alt=""><div><b>Respiratory terminology practice</b><p>Connect anatomy with common pulmonary terms.</p></div><span>›</span></div>`;
    content.appendChild(learning);
  }

  function aiBottomNav(){
    if(!document.body.classList.contains('ai-page'))return;const nav=$('.mobile-bottom-nav');if(!nav)return;
    nav.innerHTML='<a href="./app.html">Home</a><a href="./app.html#dictionary">Dictionary</a><a href="./anatomy.html">3D Anatomy</a><a class="active" href="./ai.html">AI Study</a><a href="./about.html">More</a>';
  }

  function anatomyQuery(){
    if(!document.body.classList.contains('v19-anatomy-page'))return;const q=new URLSearchParams(location.search),layer=q.get('layer'),term=q.get('term');
    if(layer){setTimeout(()=>$(`[data-layer="${CSS.escape(layer)}"]`)?.click(),80);}if(term){const title=$('#selectedRegion');if(title)title.textContent=term;const status=$('#anatomyStatus');if(status)status.textContent=`3D study view · ${term}`;}
  }

  function init(){addNews();restoreNewsCategory();observeDetail();aiHero();aiBottomNav();anatomyQuery();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  addEventListener('resize',()=>{if(mobile()){addNews();aiHero();aiBottomNav();}},{passive:true});
})();
