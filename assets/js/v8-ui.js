(()=>{
'use strict';
const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];
function addAmbientBubbles(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.querySelector('.v8-bubble'))return;
 const count=innerWidth<700?6:11;
 for(let i=0;i<count;i++){
   const b=document.createElement('i');b.className='v8-bubble';
   const size=10+Math.round(Math.random()*34);
   b.style.width=b.style.height=size+'px';
   b.style.left=(3+Math.random()*94)+'vw';b.style.top=(6+Math.random()*88)+'vh';
   b.style.setProperty('--dur',(12+Math.random()*14)+'s');b.style.setProperty('--mx',(-24+Math.random()*48)+'px');
   b.style.animationDelay=(-Math.random()*12)+'s';document.body.appendChild(b);
 }
}
function enhanceHero(){
 const art=qs('.hero-art');if(!art||qs('.hero-float-card',art))return;
 const a=document.createElement('span'),b=document.createElement('span');
 a.className='hero-float-card hfc-1';a.textContent='Learn · Understand · Apply';
 b.className='hero-float-card hfc-2';b.textContent='Knowledge for a healthier tomorrow';
 art.append(a,b);
}
function setupThemeGallery(){
 const select=qs('#settingsTheme');const field=select?.closest('.settings-field');if(!select||!field||qs('.theme-gallery'))return;
 field.classList.add('theme-select-field');
 const gallery=document.createElement('div');gallery.className='theme-gallery';
 const items=[['clinical','Light','Clean & bright'],['dark','Midnight','Deep neon'],['ocean','Blue','Luminous ocean'],['forest','Emerald','Calm green'],['violet','Violet','Modern violet'],['sand','Pearl','Warm neutral']];
 items.forEach(([v,n,d])=>{const btn=document.createElement('button');btn.type='button';btn.className='theme-tile';btn.dataset.themeChoice=v;btn.innerHTML=`<span class="theme-preview"></span><strong>${n}</strong><small>${d}</small>`;btn.onclick=()=>{select.value=v;select.dispatchEvent(new Event('change',{bubbles:true}));sync();};gallery.appendChild(btn);});
 field.after(gallery);
 function sync(){qsa('.theme-tile',gallery).forEach(x=>x.classList.toggle('active',x.dataset.themeChoice===select.value));}
 select.addEventListener('change',sync);sync();
}
function makeBrandPromoCleaner(){
 qsa('.med-side-promo').forEach(p=>{
   const strong=qs('strong',p),small=qs('small',p);if(!strong||p.dataset.v8)return;p.dataset.v8='1';
   if(/Learn Medicine Smarter|Built for medical learners/i.test(strong.textContent))strong.textContent='Study Toolkit';
   if(small)small.textContent='Offline packs · PDF tools · private study chats · multilingual terminology.';
 });
}
function themeTitleFix(){
 const labels={clinical:'☀ Light',dark:'☾ Midnight',ocean:'◉ Blue',forest:'❖ Emerald',violet:'✦ Violet',sand:'◇ Pearl'};
 qsa('#themeSelect option,#settingsTheme option').forEach(o=>{if(labels[o.value])o.textContent=labels[o.value];});
}
function enableCardKeyboard(){qsa('.term-card').forEach(c=>{if(c.tabIndex<0)c.tabIndex=0;});}
function observeTerms(){const grid=qs('#termGrid');if(!grid)return;new MutationObserver(enableCardKeyboard).observe(grid,{childList:true});enableCardKeyboard();}
function setup(){addAmbientBubbles();enhanceHero();setupThemeGallery();makeBrandPromoCleaner();themeTitleFix();observeTerms();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
