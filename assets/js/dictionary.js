(() => {
  if(!SMD21Auth.guard()) return;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const validModes=new Set(['dictionary','selected','bookmarks','history']);
  const state={data:null,crosslinks:null,terms:[],visible:[],category:'all',query:'',view:Number(localStorage.getItem('smd21_cols')||3),limit:30,mode:'dictionary',activeTermId:null,advanced:{synonyms:false,clinical:false,related:false,sort:'default'}};
  const LEGACY_SELECTED='smd21_selected',LEGACY_BOOKMARKS='smd21_bookmarks',LEGACY_HISTORY='smd21_history';
  const selectedKey=SMD21Auth.scopedKey('selected'),bookmarksKey=SMD21Auth.scopedKey('bookmarks'),historyKey=SMD21Auth.scopedKey('history');
  const selected=new Set(JSON.parse(localStorage.getItem(selectedKey)||'[]'));
  const bookmarks=new Set(JSON.parse(localStorage.getItem(bookmarksKey)||'[]'));
  let history=JSON.parse(localStorage.getItem(historyKey)||'[]');
  const imageMap={
    anatomy:'assets/images/login-anatomy.webp',
    cardiology:'assets/images/heart.webp',
    endocrinology:'assets/images/pancreas.webp',
    hematology:'assets/images/hero-light.webp',
    neurology:'assets/images/neuron.svg',
    orthopedics:'assets/images/knee.webp',
    pharmacology:'assets/images/hero-light.webp',
    pulmonology:'assets/images/lungs.webp',
    surgery:'assets/images/hero-dark.webp',
    dermatology:'assets/images/hero-light.webp',
    diagnostics:'assets/images/hero-dark.webp',
    otolaryngology:'assets/images/login-anatomy.webp',
    gastroenterology:'assets/images/pancreas.webp',
    immunology:'assets/images/hero-light.webp',
    'infectious-disease':'assets/images/hero-dark.webp',
    'nephrology-urology':'assets/images/login-anatomy.webp',
    ophthalmology:'assets/images/hero-light.webp',
    'anatomy-physiology':'assets/images/login-anatomy.webp'
  };
  const fallback='assets/images/heart.webp';
  function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function termImage(t){return imageMap[t.category]||fallback}
  function saveSelected(){localStorage.setItem(selectedKey,JSON.stringify([...selected]));SMD21Auth.touchProfile();}
  function saveBookmarks(){localStorage.setItem(bookmarksKey,JSON.stringify([...bookmarks]));SMD21Auth.touchProfile();}
  function saveHistory(){localStorage.setItem(historyKey,JSON.stringify(history.slice(0,80)));SMD21Auth.touchProfile();}
  function showToast(msg){const el=$('#toast');el.textContent=ui(msg);el.classList.remove('hidden');clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.classList.add('hidden'),1900)}
  const ui=(text)=>window.SMD21I18N?.translateExact?.(text)||text;
  const uiCount=(n,key)=>window.SMD21I18N?.formatCount?.(n,key)||`${n} ${key}`;
  const contentLang=()=>['prs','fa'].includes(SMD21.state.lang)?'fa':SMD21.state.lang;
  function localizedName(t){const lang=contentLang();return (lang==='ps'&&t.localized_term?.ps)||(lang==='fa'&&t.localized_term?.fa)||t.term}
  function localizedDefinition(t){const lang=contentLang();return t.definition?.[lang]||t.definition?.en||''}
  function localizedExplanation(t){const lang=contentLang();return t.explanation?.[lang]||t.explanation?.en||'Educational reference entry.'}
  function sortTerms(arr){const mode=state.advanced.sort;if(mode==='az')return arr.sort((a,b)=>a.term.localeCompare(b.term));if(mode==='za')return arr.sort((a,b)=>b.term.localeCompare(a.term));if(mode==='category')return arr.sort((a,b)=>(a.category_label||a.category).localeCompare(b.category_label||b.category)||a.term.localeCompare(b.term));return arr;}
  function applyFilters(){
    let arr=[...state.terms];
    if(state.mode==='selected')arr=arr.filter(t=>selected.has(t.id));
    if(state.mode==='bookmarks')arr=arr.filter(t=>bookmarks.has(t.id));
    if(state.mode==='history'){const rank=new Map(history.map((id,i)=>[id,i]));arr=arr.filter(t=>rank.has(t.id)).sort((a,b)=>rank.get(a.id)-rank.get(b.id));}
    if(state.category!=='all')arr=arr.filter(t=>t.category===state.category);
    if(state.query){const q=state.query.toLowerCase();arr=arr.filter(t=>[t.term,t.mesh_id,t.category_label,...(t.synonyms||[])].some(x=>String(x||'').toLowerCase().includes(q)));}
    if(state.advanced.synonyms)arr=arr.filter(t=>(t.synonyms||[]).length>0);
    if(state.advanced.clinical)arr=arr.filter(t=>Boolean(t.reference_module));
    if(state.advanced.related)arr=arr.filter(t=>(t.related_term_ids||[]).length>0);
    if(state.mode!=='history')arr=sortTerms(arr);
    state.visible=arr;renderTerms();
  }
  function resultLabel(){const extra=(state.advanced.synonyms||state.advanced.clinical||state.advanced.related||state.advanced.sort!=='default')?` · ${ui('advanced filters active')}`:'';if(state.mode==='dictionary')return `${uiCount(state.visible.length,'terms')}${extra}`;if(state.mode==='selected')return `${uiCount(state.visible.length,'selected')}${extra}`;if(state.mode==='bookmarks')return `${uiCount(state.visible.length,'bookmarks')}${extra}`;return `${uiCount(state.visible.length,'recent')}${extra}`}
  function renderTerms(){
    const grid=$('#termGrid');grid.dataset.cols=String(state.view);$$('.view-btn').forEach(b=>b.classList.toggle('active',Number(b.dataset.cols)===state.view));$('#resultTitle').textContent=resultLabel();$('#selectedActions').classList.toggle('hidden',state.mode!=='selected');const exportButton=$('#exportSelectedCsv');if(exportButton){exportButton.disabled=selected.size===0;exportButton.title=selected.size===0?'Select one or more terms before exporting.':`Export ${selected.size} selected term(s) as CSV`;}
    const items=state.visible.slice(0,state.limit);if(!items.length){const msg=ui(state.mode==='selected'?'No selected terms yet. Use “Select” on a Dictionary card to build a study set.':'No matching terms. Clear filters or try a different search.');grid.innerHTML=`<div class="empty-state">${msg}</div>`;$('#loadMore').classList.add('hidden');return;}
    grid.innerHTML=items.map(t=>`<article class="term-card" data-term-id="${esc(t.id)}" tabindex="0"><div class="term-image"><img src="${termImage(t)}" alt="" loading="lazy"></div><div class="term-body"><div class="meta">${esc(t.category_label||t.category)}</div><h3>${esc(localizedName(t))}</h3><p>${esc(localizedDefinition(t))}</p><div class="term-actions"><button class="mini-btn select-btn" data-select="${esc(t.id)}">${ui(selected.has(t.id)?'✓ Selected':'+ Select')}</button><button class="mini-btn bookmark-btn" data-bookmark="${esc(t.id)}">${ui(bookmarks.has(t.id)?'★ Saved':'☆ Save')}</button><button class="mini-btn open-btn" data-open="${esc(t.id)}">${ui('Open →')}</button></div></div></article>`).join('');$('#loadMore').classList.toggle('hidden',items.length>=state.visible.length);
  }
  function modelFor(t){return {id:t.id,name:localizedName(t),canonicalName:t.term,meshId:t.mesh_id||t.id,category:t.category_label||t.category,definition:localizedDefinition(t),explanation:localizedExplanation(t),synonyms:t.synonyms||[],source:t.source||'Bundled educational reference'};}
  function renderRelated(t){const host=$('#detailRelated'),ids=t.related_term_ids||[];const rows=ids.map(id=>state.terms.find(x=>x.id===id)).filter(Boolean).slice(0,8);host.innerHTML=rows.length?rows.map(x=>`<button class="mini-btn related-link" data-related="${esc(x.id)}">${esc(localizedName(x))}</button>`).join(''):`<span>${ui('No curated related terms')}</span>`;}
  function anatomyRefs(t){return state.crosslinks?.term_to_anatomy?.[t.id]||[];}
  function renderAnatomyLinks(t){const section=$('#detailAnatomySection'),host=$('#detailAnatomyLinks'),refs=anatomyRefs(t);section.classList.toggle('hidden',!refs.length);host.innerHTML=refs.slice(0,8).map(r=>`<a class="mini-btn" href="anatomy.html?mode=${encodeURIComponent(r.system)}&structure=${encodeURIComponent(r.structure_id)}">◈ ${esc(r.name)}</a>`).join('');}
  function updateDetailActions(t){$('#detailBookmark').textContent=ui(bookmarks.has(t.id)?'★ Remove bookmark':'☆ Add bookmark');$('#detailBookmark').dataset.id=t.id;$('#detailSelected').textContent=ui(selected.has(t.id)?'✓ Remove selected':'✓ Select term');$('#detailSelected').dataset.id=t.id;['detailPronounce','detailAI','detailPdf','detailPrint','detailCopy','detailOffline'].forEach(id=>$('#'+id).dataset.id=t.id);const clinical=$('#detailClinical');clinical.classList.toggle('hidden',!t.reference_module);clinical.dataset.module=t.reference_module||'';clinical.dataset.id=t.id;}
  function openDetail(id,{pushUrl=true}={}){
    const t=state.terms.find(x=>x.id===id);if(!t)return;state.activeTermId=id;history=[id,...history.filter(x=>x!==id)];saveHistory();$('#detailImg').src=termImage(t);$('#detailImg').alt=`${localizedName(t)} medical illustration`;$('#detailCategory').textContent=t.category_label||t.category;$('#detailTitle').textContent=localizedName(t);$('#detailDef').textContent=localizedDefinition(t);$('#detailExplain').textContent=localizedExplanation(t);$('#detailMesh').textContent=t.mesh_id||t.id||ui('Not listed');$('#detailSource').textContent=t.source||ui('Bundled educational reference');$('#detailSynonyms').innerHTML=(t.synonyms||[]).map(s=>`<span>${esc(s)}</span>`).join('')||`<span>${ui('No listed synonyms')}</span>`;renderRelated(t);renderAnatomyLinks(t);updateDetailActions(t);$('#detailDrawer').classList.add('open');$('#drawerBackdrop').classList.add('show');if(pushUrl){const u=new URL(location.href);u.searchParams.set('term',t.id);historyReplace(u);}
  }
  function historyReplace(u){try{window.history.replaceState(null,'',u)}catch{}}
  function closeDetail(){state.activeTermId=null;$('#detailDrawer').classList.remove('open');$('#drawerBackdrop').classList.remove('show');const u=new URL(location.href);u.searchParams.delete('term');historyReplace(u)}
  function setMode(mode){mode=validModes.has(mode)?mode:'dictionary';state.mode=mode;state.category='all';state.query='';state.limit=30;$('#dictionarySearch').value='';$$('.nav-btn[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));$('#sectionLabel').textContent=ui(mode==='dictionary'?'Medical Terms':mode==='selected'?'Selected terms':mode==='bookmarks'?'Bookmarks':'History');applyFilters();}
  function categoryImage(id){return imageMap[id]||'assets/images/hero-light.webp'}
  function categoryCard(id,label,count,image,active=false){
    return `<button class="category-card${active?' active':''}" type="button" data-cat="${esc(id)}" aria-pressed="${active?'true':'false'}">
      <span class="category-card-media"><img src="${esc(image)}" alt="" loading="lazy"></span>
      <span class="category-card-copy"><strong>${esc(label)}</strong><small>${Number(count||0).toLocaleString()} terms</small></span>
    </button>`;
  }
  function renderCategories(){
    const cats=(state.data.categories||[]).slice().sort((a,b)=>b.count-a.count);
    const total=state.terms.length;
    $('#categoryRow').innerHTML=
      categoryCard('all',ui('All Terms'),total,'assets/images/hero-light.webp',state.category==='all')+
      cats.map(c=>categoryCard(c.id,c.label,c.count,categoryImage(c.id),state.category===c.id)).join('');
    $('#categorySelect').innerHTML=`<option value="all">${ui('All Categories')}</option>`+cats.map(c=>`<option value="${esc(c.id)}">${esc(c.label)}</option>`).join('');
    $('#categorySelect').value=state.category;
  }
  function syncAdvancedInputs(){ $('#filterHasSynonyms').checked=state.advanced.synonyms;$('#filterClinicalOnly').checked=state.advanced.clinical;$('#filterRelatedOnly').checked=state.advanced.related;$('#advancedSort').value=state.advanced.sort;}
  function showAdvanced(show=true){$('#advancedFiltersModal').classList.toggle('hidden',!show);if(show)syncAdvancedInputs();}
  function applyAdvancedFromUi(){state.advanced={synonyms:$('#filterHasSynonyms').checked,clinical:$('#filterClinicalOnly').checked,related:$('#filterRelatedOnly').checked,sort:$('#advancedSort').value};state.limit=30;showAdvanced(false);applyFilters();}
  function resetAdvanced(){state.advanced={synonyms:false,clinical:false,related:false,sort:'default'};syncAdvancedInputs();applyFilters();showToast('Advanced filters reset');}
  function toggleSelected(id){selected.has(id)?selected.delete(id):selected.add(id);saveSelected();if(state.mode==='selected')applyFilters();else renderTerms();showToast(selected.has(id)?'Term added to Selected':'Term removed from Selected')}
  function selectFiltered(){for(const t of state.visible)selected.add(t.id);saveSelected();renderTerms();showToast(`${state.visible.length} filtered terms selected`)}
  function selectedTerms(){return state.terms.filter(t=>selected.has(t.id));}
  function activeTerm(){return state.terms.find(x=>x.id===state.activeTermId)||null;}
  function applyHashMode({scroll=true}={}){const raw=(location.hash||'#home').replace('#','')||'home';if(raw==='home'){setMode('dictionary');if(scroll)requestAnimationFrame(()=>$('#home')?.scrollIntoView({behavior:'smooth',block:'start'}));return;}if(validModes.has(raw)){setMode(raw);if(scroll)requestAnimationFrame(()=>$('#termGrid')?.scrollIntoView({behavior:'smooth',block:'start'}));return;}setMode('dictionary');}
  async function init(){
    const [res,crossRes]=await Promise.all([fetch('data/index.json',{cache:'no-store'}),fetch('data/crosslinks.json',{cache:'no-store'}).catch(()=>null)]);if(!res.ok)throw new Error('Dictionary data failed to load');state.data=await res.json();state.crosslinks=crossRes&&crossRes.ok?await crossRes.json():null;state.terms=state.data.terms||[];$('#termCount').textContent=state.terms.length.toLocaleString();$('#categoryCount').textContent=(state.data.categories||[]).length;renderCategories();applyHashMode({scroll:false});if((location.hash||'').replace('#','')==='home')requestAnimationFrame(()=>$('#home')?.scrollIntoView({block:'start'}));const pending=sessionStorage.getItem('smd21_pending_search');if(pending){sessionStorage.removeItem('smd21_pending_search');setMode('dictionary');state.query=pending;$('#dictionarySearch').value=pending;$('#topSearch').value=pending;applyFilters();}const params=new URLSearchParams(location.search);const requested=params.get('term');if(requested&&state.terms.some(t=>t.id===requested))openDetail(requested,{pushUrl:false});const requestedSearch=params.get('search');if(requestedSearch&&!requested){setMode('dictionary');state.query=requestedSearch;$('#dictionarySearch').value=requestedSearch;$('#topSearch').value=requestedSearch;applyFilters();}
  }
  document.addEventListener('click',e=>{
    const sel=e.target.closest('[data-select]');if(sel){e.stopPropagation();toggleSelected(sel.dataset.select);return;}
    const b=e.target.closest('[data-bookmark]');if(b){e.stopPropagation();const id=b.dataset.bookmark;bookmarks.has(id)?bookmarks.delete(id):bookmarks.add(id);saveBookmarks();renderTerms();return;}
    const o=e.target.closest('[data-open]');if(o){e.stopPropagation();openDetail(o.dataset.open);return;}
    const rel=e.target.closest('[data-related]');if(rel){e.stopPropagation();openDetail(rel.dataset.related);return;}
    const card=e.target.closest('.term-card');if(card){openDetail(card.dataset.termId);return;}
    const cat=e.target.closest('[data-cat]');if(cat){state.category=cat.dataset.cat;$('#categorySelect').value=state.category;$$('.category-card').forEach(x=>{const on=x===cat;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});state.limit=30;applyFilters();return;}
    const nav=e.target.closest('.nav-btn[data-mode]');if(nav){location.hash=nav.dataset.mode;setMode(nav.dataset.mode);if(innerWidth<861)toggleMenu(false);return;}
    const view=e.target.closest('.view-btn');if(view){state.view=Number(view.dataset.cols);localStorage.setItem('smd21_cols',state.view);renderTerms();}
  });
  $('#dictionarySearch').addEventListener('input',e=>{state.query=e.target.value.trim();state.limit=30;applyFilters();});
  $('#topSearch').addEventListener('input',e=>{state.query=e.target.value.trim();$('#dictionarySearch').value=state.query;state.limit=30;applyFilters();});
  $('#runSearch').addEventListener('click',()=>{state.query=$('#dictionarySearch').value.trim();state.limit=30;applyFilters();$('#termGrid').scrollIntoView({behavior:'smooth',block:'start'});});
  $('#categorySelect').addEventListener('change',e=>{state.category=e.target.value;$$('.category-card').forEach(x=>{const on=x.dataset.cat===state.category;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});state.limit=30;applyFilters();});
  $('#loadMore').addEventListener('click',()=>{state.limit+=30;renderTerms();});
  $('#advancedFiltersBtn').addEventListener('click',()=>showAdvanced(true));$('#closeAdvancedFilters').addEventListener('click',()=>showAdvanced(false));$('#applyAdvancedFilters').addEventListener('click',applyAdvancedFromUi);$('#resetAdvancedFilters').addEventListener('click',resetAdvanced);
  $('#selectFiltered').addEventListener('click',selectFiltered);$('#exportSelectedCsv').addEventListener('click',()=>{const xs=selectedTerms();if(!xs.length){showToast('Select at least one term first');return;}SMD21TermTools.exportCsv(xs);showToast(`${xs.length} selected terms exported`)});
  $('#closeDetail').addEventListener('click',closeDetail);$('#drawerBackdrop').addEventListener('click',closeDetail);
  $('#detailBookmark').addEventListener('click',e=>{const id=e.currentTarget.dataset.id;if(!id)return;bookmarks.has(id)?bookmarks.delete(id):bookmarks.add(id);saveBookmarks();const t=activeTerm();if(t)updateDetailActions(t);renderTerms();});
  $('#detailSelected').addEventListener('click',e=>{const id=e.currentTarget.dataset.id;if(!id)return;toggleSelected(id);const t=activeTerm();if(t)updateDetailActions(t);});
  $('#detailPronounce').addEventListener('click',()=>{const t=activeTerm();if(!t)return;try{SMD21TermTools.pronounce(localizedName(t),SMD21.state.lang);showToast('Pronunciation started')}catch(err){showToast(err.message)}});
  $('#detailAI').addEventListener('click',()=>{const t=activeTerm();if(t)location.href=`ai.html?term=${encodeURIComponent(t.id)}`});
  $('#detailClinical').addEventListener('click',e=>{const id=e.currentTarget.dataset.id,module=e.currentTarget.dataset.module;if(!id||!module)return;if(window.SMD21Clinical?.openTerm)SMD21Clinical.openTerm(id,module);else location.href=`app.html?clinical=${encodeURIComponent(module)}&clinicalTerm=${encodeURIComponent(id)}#dictionary`;});
  $('#detailPdf').addEventListener('click',()=>{const t=activeTerm();if(t){SMD21TermTools.exportPdf(modelFor(t));showToast('PDF downloaded')}});
  $('#detailPrint').addEventListener('click',()=>{const t=activeTerm();if(t)SMD21TermTools.printModel(modelFor(t));});
  $('#detailCopy').addEventListener('click',async()=>{const t=activeTerm();if(!t)return;try{await SMD21TermTools.copySummary(modelFor(t));showToast('Summary copied')}catch{showToast('Copy failed in this browser')}});
  $('#detailOffline').addEventListener('click',()=>{location.href='offline.html#dictionary'});
  $('#clearSelectedTerms').addEventListener('click',()=>{selected.clear();saveSelected();applyFilters();showToast('Selected terms cleared')});
  $('#studySelected').addEventListener('click',()=>{const ids=[...selected].slice(0,8);if(!ids.length){showToast('Select at least one term first');return;}location.href=`ai.html?terms=${encodeURIComponent(ids.join(','))}`});
  $('#clinicalToggle').addEventListener('click',()=>{const body=$('#clinicalBody');const hidden=body.classList.toggle('hidden');$('#clinicalChevron').textContent=hidden?'⌄':'⌃';$('#clinicalToggle').setAttribute('aria-expanded',String(!hidden));});
  function toggleMenu(force){const open=force??!$('#sidebar').classList.contains('open');$('#sidebar').classList.toggle('open',open);$('#drawerBackdrop').classList.toggle('show',open);}
  $('#mobileMenu').addEventListener('click',()=>toggleMenu());$('#drawerBackdrop').addEventListener('click',()=>{toggleMenu(false);closeDetail();});$('#signOutBtn').addEventListener('click',async()=>{await SMD21Auth.signOut();location.href='index.html';});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#topSearch').focus()}if(e.key==='Escape'){if(!$('#advancedFiltersModal').classList.contains('hidden'))showAdvanced(false);else{closeDetail();toggleMenu(false)}}if((e.key==='Enter'||e.key===' ')&&e.target.matches('.term-card')){e.preventDefault();openDetail(e.target.dataset.termId)}});
  window.SMD21Dictionary={openTerm:(id)=>{const t=state.terms.find(x=>x.id===id);if(!t)return false;setMode('dictionary');state.category='all';state.query='';$('#dictionarySearch').value='';$('#topSearch').value='';openDetail(id);return true;},getTerm:(id)=>state.terms.find(x=>x.id===id)||null,getSelected:()=>[...selected]};
  window.addEventListener('smd21:languagechange',()=>{renderCategories();applyFilters();if(state.activeTermId)openDetail(state.activeTermId,{pushUrl:false});});
  window.addEventListener('hashchange',()=>applyHashMode({scroll:true}));
  const a=SMD21Auth.getAccount();$('#accountEmail').textContent=a?.email||'Local account';
  init().catch(err=>{$('#termGrid').innerHTML=`<div class="empty-state">Dictionary failed to load: ${esc(err.message)}</div>`});
})();
