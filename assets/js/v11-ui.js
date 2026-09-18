(()=>{
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
function customThemeMenu(){
 const select=q('#themeSelect'); if(!select||q('.v11-theme-wrap'))return;
 const wrap=document.createElement('div');wrap.className='v11-theme-wrap';
 const btn=document.createElement('button');btn.type='button';btn.className='v11-theme-btn';
 const menu=document.createElement('div');menu.className='v11-theme-menu hidden';
 const names={clinical:['☀','Light'],dark:['☾','Dark'],ocean:['◉','Blue'],forest:['❖','Emerald'],violet:['✦','Violet'],sand:['◇','Pearl']};
 function label(){const [i,n]=names[select.value]||['☀','Light'];btn.innerHTML=`<span>${i}</span><b>${n}</b><span>⌄</span>`;}
 Object.entries(names).forEach(([v,[i,n]])=>{const b=document.createElement('button');b.type='button';b.dataset.theme=v;b.innerHTML=`<span>${i}</span><b>${n}</b><span class="v11-theme-dot"></span>`;b.onclick=()=>{select.value=v;select.dispatchEvent(new Event('change',{bubbles:true}));document.body.dataset.theme=v;try{localStorage.setItem('smd-theme',v)}catch{}label();menu.classList.add('hidden');};menu.appendChild(b)});
 wrap.append(btn,menu);select.after(wrap);select.classList.add('v11-native-hidden');label();
 btn.onclick=e=>{e.stopPropagation();menu.classList.toggle('hidden')};document.addEventListener('click',()=>menu.classList.add('hidden'));
}
function headerBadge(){const hero=q('.hero-copy');if(hero&&!q('.v11-trust-row',hero)){const row=document.createElement('div');row.className='v11-trust-row';row.innerHTML='<span>✓ Trusted medical terminology</span><span>◎ Multilingual</span><span>⇩ Offline-ready</span>';hero.appendChild(row)}}
function addVisualRings(){qa('.term-visual,.detail-visual-wrap').forEach(el=>{if(el.querySelector('.v11-orbit'))return;const r=document.createElement('i');r.className='v11-orbit';el.appendChild(r)})}
function observer(){const g=q('#termGrid'),d=q('#detailPanel');const ob=new MutationObserver(()=>addVisualRings());if(g)ob.observe(g,{childList:true,subtree:true});if(d)ob.observe(d,{childList:true,subtree:true});addVisualRings()}
function setup(){customThemeMenu();headerBadge();observer()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
