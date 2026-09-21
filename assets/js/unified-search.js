(() => {
  'use strict';
  const input=document.querySelector('#topSearch');
  const main=document.querySelector('main');
  if(main&&!main.id)main.id='mainContent';
  if(main&&!document.querySelector('.skip-link')){
    const a=document.createElement('a');a.className='skip-link';a.href='#mainContent';a.textContent='Skip to main content';document.body.prepend(a);
  }
  const menuBtn=document.querySelector('#mobileMenu'),sidebar=document.querySelector('#sidebar');
  if(menuBtn&&sidebar){if(!sidebar.id)sidebar.id='sidebar';menuBtn.setAttribute('aria-controls',sidebar.id);menuBtn.setAttribute('aria-expanded',String(sidebar.classList.contains('open')));const mo=new MutationObserver(()=>menuBtn.setAttribute('aria-expanded',String(sidebar.classList.contains('open'))));mo.observe(sidebar,{attributes:true,attributeFilter:['class']});}
  if(!input)return;
  const wrap=input.closest('.top-search')||input.parentElement;
  const box=document.createElement('div');box.className='global-search-results';box.id='globalSearchResults';box.setAttribute('role','listbox');box.setAttribute('aria-label','Unified medical search results');wrap.append(box);
  const live=document.createElement('div');live.className='sr-only';live.id='globalSearchLive';live.setAttribute('aria-live','polite');document.body.append(live);
  input.setAttribute('role','combobox');input.setAttribute('aria-keyshortcuts','Control+K Meta+K /');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',box.id);input.setAttribute('aria-expanded','false');input.setAttribute('autocomplete','off');
  let data=null,loading=null,items=[],active=-1,lastQ='';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const lang=()=>window.SMD21?.state?.lang||'en';
  const termName=t=>{const l=lang(),cl=['prs','fa'].includes(l)?'fa':l;return (cl==='ps'&&t.localized_term?.ps)||(cl==='fa'&&t.localized_term?.fa)||t.term||''};
  const norm=s=>String(s||'').toLowerCase().normalize('NFKD');
  function score(q,vals){q=norm(q);let best=0;for(const raw of vals){const v=norm(raw);if(!v)continue;if(v===q)best=Math.max(best,100);else if(v.startsWith(q))best=Math.max(best,72);else if(v.includes(q))best=Math.max(best,46);}return best;}
  async function load(){if(data)return data;if(loading)return loading;loading=Promise.all([
    fetch('data/index.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
    fetch('data/anatomy/catalog.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
    fetch('data/crosslinks.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)
  ]).then(([index,catalog,cross])=>data={index,catalog,cross});return loading;}
  function groupsFor(q){const out={Dictionary:[],Clinical:[],Anatomy:[]};if(!data)return out;
    for(const t of data.index?.terms||[]){const s=score(q,[t.term,t.mesh_id,t.category_label,...(t.synonyms||[]),termName(t)]);if(!s)continue;const common={score:s,name:termName(t),sub:t.category_label||t.category||'Medical term',href:`app.html?term=${encodeURIComponent(t.id)}#dictionary`};out.Dictionary.push({...common,type:'Dictionary',icon:'▣'});if(t.reference_module)out.Clinical.push({...common,score:s+2,type:'Clinical',icon:'✚',sub:`${t.reference_module} · ${common.sub}`,href:`app.html?clinical=${encodeURIComponent(t.reference_module)}&clinicalTerm=${encodeURIComponent(t.id)}#dictionary`});}
    const sys=[['bones','skeleton'],['muscles','muscles'],['joints','joints'],['ligaments','ligaments'],['organs','organs'],['nerves','nerves'],['vessels','vessels'],['teeth','teeth'],['eye','eye'],['sinuses','sinuses']];
    for(const [key,mode] of sys)for(const s of data.catalog?.[key]||[]){const sc=score(q,[s.name,s.latin,s.location,s.group,s.kind]);if(sc)out.Anatomy.push({score:sc,name:s.name,sub:`${s.latin||mode} · ${s.location||''}`,type:'Anatomy',icon:'◈',href:`anatomy.html?mode=${encodeURIComponent(mode)}&structure=${encodeURIComponent(s.id)}`});}
    for(const k of Object.keys(out))out[k]=out[k].sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).slice(0,k==='Dictionary'?5:4);return out;
  }
  function close(){box.classList.remove('open');input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');items=[];active=-1;}
  function setActive(i){if(!items.length)return;active=(i+items.length)%items.length;items.forEach((el,n)=>el.classList.toggle('active',n===active));const el=items[active];input.setAttribute('aria-activedescendant',el.id);el.scrollIntoView({block:'nearest'});}
  function render(q){lastQ=q;const groups=groupsFor(q);const total=Object.values(groups).reduce((n,a)=>n+a.length,0);if(!q){close();return;}let html=`<div class="global-search-status">${total?`${total} quick results · Enter opens the highlighted result`:'No direct match. Press Enter to search the Dictionary.'}</div>`;
    for(const [name,rows] of Object.entries(groups)){if(!rows.length)continue;html+=`<div class="global-search-group"><div class="global-search-group-title">${esc(name)}</div>`+rows.map((r,i)=>`<a class="global-search-item" role="option" href="${esc(r.href)}"><span class="global-search-icon" aria-hidden="true">${r.icon}</span><span class="global-search-copy"><b>${esc(r.name)}</b><small>${esc(r.sub)}</small></span><span class="global-search-type">${esc(r.type)}</span></a>`).join('')+'</div>';}
    if(!total)html+=`<a class="global-search-item" role="option" href="app.html?search=${encodeURIComponent(q)}#dictionary"><span class="global-search-icon">⌕</span><span class="global-search-copy"><b>Search Dictionary</b><small>${esc(q)}</small></span><span class="global-search-type">Search</span></a>`;
    box.innerHTML=html;box.classList.add('open');input.setAttribute('aria-expanded','true');items=[...box.querySelectorAll('.global-search-item')];items.forEach((el,i)=>el.id=`global-search-option-${i}`);active=items.length?0:-1;if(active>=0)setActive(0);live.textContent=total?`${total} unified search results available`:'No direct unified search match';}
  async function update(){const q=input.value.trim();if(q.length<2){close();return;}await load();if(input.value.trim()===q)render(q);}
  let timer;input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(update,80)});
  input.addEventListener('focus',()=>{if(input.value.trim().length>=2)update()});
  input.addEventListener('keydown',e=>{if(!box.classList.contains('open'))return;if(e.key==='ArrowDown'){e.preventDefault();setActive(active+1)}else if(e.key==='ArrowUp'){e.preventDefault();setActive(active-1)}else if(e.key==='Enter'){if(items[active]){e.preventDefault();e.stopImmediatePropagation();location.href=items[active].href}else if(input.value.trim()){e.preventDefault();location.href=`app.html?search=${encodeURIComponent(input.value.trim())}#dictionary`}}else if(e.key==='Escape'){e.preventDefault();close();}} ,true);
  box.addEventListener('mousemove',e=>{const el=e.target.closest('.global-search-item');if(!el)return;const i=items.indexOf(el);if(i>=0)setActive(i)});
  document.addEventListener('pointerdown',e=>{if(!wrap.contains(e.target))close()});
  document.addEventListener('keydown',e=>{const editable=e.target.matches?.('input,textarea,select,[contenteditable="true"]');if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();input.focus();input.select()}else if(e.key==='/'&&!editable&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();input.focus();input.select();}});
  window.addEventListener('smd21:languagechange',()=>{if(box.classList.contains('open')&&lastQ)render(lastQ)});
})();
