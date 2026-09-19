/* Suhail Medical Dictionary v16.0 — Phase 4 UI behavior */
(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function applyStoredAppearance(){
    const bg=localStorage.getItem('smd-bg-style')||'bubbles';
    const accent=localStorage.getItem('smd-accent')||'blue';
    document.body.dataset.bgStyle=bg;
    document.body.dataset.accent=accent;
    document.body.classList.toggle('effects-off',localStorage.getItem('smd-animations')==='0');
    document.body.classList.toggle('model-glow-off',localStorage.getItem('smd-model-glow')==='0');
    document.body.classList.toggle('reduce-motion',localStorage.getItem('smd-reduce-motion')==='1');
  }

  function setRadioGroup(selector,attr,value){
    $$(selector).forEach(btn=>btn.setAttribute('aria-checked',String(btn.getAttribute(attr)===value)));
  }

  function setupAppearance(){
    const overlay=$('#settingsOverlay'), themeSelect=$('#settingsTheme');
    if(!overlay||!themeSelect)return;
    let pendingTheme=document.body.dataset.theme||themeSelect.value||'clinical';
    let pendingBg=localStorage.getItem('smd-bg-style')||'bubbles';
    let pendingAccent=localStorage.getItem('smd-accent')||'blue';
    const animations=$('#appearanceAnimations'), glow=$('#appearanceGlow'), reduce=$('#appearanceReduceMotion');

    const sync=()=>{
      pendingTheme=document.body.dataset.theme||themeSelect.value||'clinical';
      pendingBg=localStorage.getItem('smd-bg-style')||'bubbles';
      pendingAccent=localStorage.getItem('smd-accent')||'blue';
      setRadioGroup('[data-theme-choice]','data-theme-choice',pendingTheme);
      setRadioGroup('[data-bg-choice]','data-bg-choice',pendingBg);
      setRadioGroup('[data-accent-choice]','data-accent-choice',pendingAccent);
      if(animations)animations.checked=localStorage.getItem('smd-animations')!=='0';
      if(glow)glow.checked=localStorage.getItem('smd-model-glow')!=='0';
      if(reduce)reduce.checked=localStorage.getItem('smd-reduce-motion')==='1';
    };

    $$('[data-theme-choice]').forEach(btn=>btn.addEventListener('click',()=>{pendingTheme=btn.dataset.themeChoice;setRadioGroup('[data-theme-choice]','data-theme-choice',pendingTheme)}));
    $$('[data-bg-choice]').forEach(btn=>btn.addEventListener('click',()=>{pendingBg=btn.dataset.bgChoice;setRadioGroup('[data-bg-choice]','data-bg-choice',pendingBg)}));
    $$('[data-accent-choice]').forEach(btn=>btn.addEventListener('click',()=>{pendingAccent=btn.dataset.accentChoice;setRadioGroup('[data-accent-choice]','data-accent-choice',pendingAccent)}));

    $('#appearanceApply')?.addEventListener('click',()=>{
      themeSelect.value=pendingTheme;
      themeSelect.dispatchEvent(new Event('change',{bubbles:true}));
      localStorage.setItem('smd-bg-style',pendingBg);
      localStorage.setItem('smd-accent',pendingAccent);
      localStorage.setItem('smd-animations',animations?.checked?'1':'0');
      localStorage.setItem('smd-model-glow',glow?.checked?'1':'0');
      localStorage.setItem('smd-reduce-motion',reduce?.checked?'1':'0');
      applyStoredAppearance();
      $('#closeSettingsButton')?.click();
    });

    themeSelect.addEventListener('change',()=>{pendingTheme=themeSelect.value;setRadioGroup('[data-theme-choice]','data-theme-choice',pendingTheme)});
    $('#settingsButton')?.addEventListener('click',()=>setTimeout(sync,0));
    new MutationObserver(()=>{if(!overlay.classList.contains('hidden'))sync()}).observe(overlay,{attributes:true,attributeFilter:['class','aria-hidden']});
    sync();
  }

  function setupAIConversationSearch(){
    const input=$('#chatSearchInput'), list=$('#chatList');
    if(!input||!list)return;
    const filter=()=>{
      const q=input.value.trim().toLowerCase();
      $$('.chat-list-item',list).forEach(item=>{const hide=!!q&&!item.textContent.toLowerCase().includes(q);item.hidden=hide;const row=item.closest('.ai-chat-row');if(row)row.hidden=hide;});
    };
    input.addEventListener('input',filter);
    new MutationObserver(filter).observe(list,{childList:true,subtree:true});
  }


  function setupAIChatMenus(){
    const list=$('#chatList');if(!list)return;
    const closeMenus=()=>$$('.ai-chat-menu',list).forEach(x=>x.remove());
    const decorate=()=>{
      $$('.chat-list-item',list).forEach(item=>{
        if(item.closest('.ai-chat-row'))return;
        const row=document.createElement('div');row.className='ai-chat-row';
        item.parentNode.insertBefore(row,item);row.appendChild(item);
        const more=document.createElement('button');more.type='button';more.className='ai-chat-menu-button';more.setAttribute('aria-label','Chat options');more.textContent='•••';row.appendChild(more);
        more.addEventListener('click',e=>{
          e.preventDefault();e.stopPropagation();const open=row.querySelector('.ai-chat-menu');closeMenus();if(open)return;
          item.click();
          const menu=document.createElement('div');menu.className='ai-chat-menu';menu.innerHTML='<button type="button" data-action="rename">✎ Rename</button><button type="button" class="danger" data-action="delete">▱ Delete</button>';row.appendChild(menu);
          menu.querySelector('[data-action="rename"]')?.addEventListener('click',ev=>{ev.stopPropagation();closeMenus();$('#renameChat')?.click()});
          menu.querySelector('[data-action="delete"]')?.addEventListener('click',ev=>{ev.stopPropagation();closeMenus();$('#deleteChat')?.click()});
        });
      });
    };
    decorate();new MutationObserver(decorate).observe(list,{childList:true});
    document.addEventListener('click',e=>{if(!e.target.closest('.ai-chat-row'))closeMenus()});
  }

  function setupAIHeaderLabel(){
    if(!document.body.classList.contains('ai-page'))return;
    const heading=$('.ai-page-heading strong');
    if(heading)heading.textContent='AI Study';
    const btn=$('#newChat'), actions=$('.ai-topbar .med-top-actions'), original=$('.chat-list-header');
    if(!btn||!actions||!original)return;
    const sync=()=>{
      if(innerWidth<=820){
        if(btn.parentElement!==actions)actions.insertBefore(btn,actions.firstChild);
      }else if(btn.parentElement!==original){
        original.appendChild(btn);
      }
    };
    sync();addEventListener('resize',sync,{passive:true});
  }

  applyStoredAppearance();
  const init=()=>{setupAppearance();setupAIConversationSearch();setupAIChatMenus();setupAIHeaderLabel()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
