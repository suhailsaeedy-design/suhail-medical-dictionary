'use strict';
(()=>{
  const body=document.body;
  const btn=document.querySelector('#authThemeToggle');
  if(!body.classList.contains('auth-page')||!btn)return;
  const label=btn.querySelector('b');
  const icon=btn.querySelector('span');
  const current=localStorage.getItem('smd-theme')||body.dataset.theme||'dark';
  const set=(theme)=>{
    const normalized=(theme==='clinical'||theme==='light')?'clinical':'dark';
    body.dataset.theme=normalized;
    localStorage.setItem('smd-theme',normalized);
    label.textContent=normalized==='dark'?'Dark':'Light';
    icon.textContent=normalized==='dark'?'☾':'☀';
  };
  set(current);
  btn.addEventListener('click',()=>set(body.dataset.theme==='dark'?'clinical':'dark'));
})();
