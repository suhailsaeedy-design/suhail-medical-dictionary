(() => {
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const workspace=$('#clinicalWorkspace');
  if(!workspace) return;
  const state={meta:null,data:null,calculators:[],module:'conditions',query:'',specialty:'all',selectedId:null,selectedCalc:null};
  const labels={conditions:'Diseases & Conditions',procedures:'Procedures & Tests',drugs:'Drugs & Pharmacology',calculators:'Medical Calculators',interactions:'Interaction Safety',learning:'Learning & Reference'};
  const icons={conditions:'♥',procedures:'✚',drugs:'◉',calculators:'∑',interactions:'⚠',learning:'✦'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const termName=t=>t?.localized_term?.[SMD21?.state?.lang]||t?.term||'';
  const def=t=>t?.definition?.[SMD21?.state?.lang]||t?.definition?.en||'';
  const explain=t=>t?.explanation?.[SMD21?.state?.lang]||t?.explanation?.en||'';
  const moduleTerms=id=>(state.data?.terms||[]).filter(t=>t.reference_module===id);
  const moduleMeta=id=>(state.meta?.modules||[]).find(m=>m.id===id)||{id,title:labels[id]||id,description:''};
  function showToast(msg){const el=$('#toast');if(!el)return;el.textContent=msg;el.classList.remove('hidden');setTimeout(()=>el.classList.add('hidden'),1600)}

  function renderModuleCards(){
    const host=$('#clinicalGrid'); if(!host||!state.meta)return;
    host.innerHTML=(state.meta.modules||[]).map(m=>`<article class="clinical-card" data-clinical-card="${esc(m.id)}"><div class="clinical-card-top"><span class="clinical-icon" aria-hidden="true">${icons[m.id]||'✦'}</span><span class="clinical-status">${esc(m.status_label||'Reference')}</span></div><h3>${esc(m.title||labels[m.id]||m.id)}</h3><p>${esc(m.description||'Educational reference module.')}</p><button class="btn-ui clinical-open" type="button" data-clinical-module="${esc(m.id)}">${esc(m.action_label||'Open reference')}</button></article>`).join('');
  }
  function renderTabs(){
    const host=$('#clinicalTabs');if(!host)return;
    host.innerHTML=(state.meta.modules||[]).map(m=>`<button type="button" class="clinical-tab${m.id===state.module?' active':''}" role="tab" aria-selected="${m.id===state.module?'true':'false'}" data-clinical-tab="${esc(m.id)}">${esc(labels[m.id]||m.title||m.id)}</button>`).join('');
  }
  function renderSpecialties(items){
    const sel=$('#clinicalSpecialty');if(!sel)return;
    if(!['conditions','procedures','drugs'].includes(state.module)){sel.innerHTML='<option value="all">All specialties</option>';sel.disabled=true;return;}
    const cats=[...new Map(items.map(t=>[t.category,t.category_label||t.category])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
    sel.disabled=false;sel.innerHTML='<option value="all">All specialties</option>'+cats.map(([id,name])=>`<option value="${esc(id)}">${esc(name)}</option>`).join('');
    if(!cats.some(([id])=>id===state.specialty)) state.specialty='all';
    sel.value=state.specialty;
  }
  function filteredTerms(){
    let items=moduleTerms(state.module);
    if(state.specialty!=='all')items=items.filter(t=>t.category===state.specialty);
    if(state.query){const q=state.query.toLowerCase();items=items.filter(t=>[t.term,t.category_label,t.category,def(t),explain(t),...(t.synonyms||[])].some(x=>String(x||'').toLowerCase().includes(q)));}
    return items.sort((a,b)=>String(a.term).localeCompare(String(b.term)));
  }
  function renderTermList(){
    const all=moduleTerms(state.module);renderSpecialties(all);const items=filteredTerms();
    $('#clinicalCount').textContent=`${items.length.toLocaleString()} references`;
    const host=$('#clinicalList');
    if(!items.length){host.innerHTML='<div class="clinical-empty">No matching references. Clear the search or specialty filter.</div>';return;}
    host.innerHTML=items.map(t=>`<button type="button" role="listitem" class="clinical-item${t.id===state.selectedId?' active':''}" data-clinical-item="${esc(t.id)}"><b>${esc(termName(t))}</b><span class="item-badge">${esc(t.category_label||t.category)}</span><small>${esc(def(t))}</small></button>`).join('');
  }
  function renderTermDetail(id){
    const t=(state.data?.terms||[]).find(x=>x.id===id);if(!t)return;
    state.selectedId=id;renderTermList();
    const synonyms=(t.synonyms||[]).length?(t.synonyms||[]).map(s=>`<span>${esc(s)}</span>`).join(''):'<span>No listed synonyms</span>';
    $('#clinicalDetail').innerHTML=`<span class="reference-badge">${esc(labels[state.module]||'Reference')}</span><h3>${esc(termName(t))}</h3><div class="ref-category">${esc(t.category_label||t.category)}</div><section class="reference-section"><h4>Definition</h4><p>${esc(def(t))}</p></section><section class="reference-section"><h4>Explanation</h4><p>${esc(explain(t))}</p></section><section class="reference-section"><h4>Synonyms</h4><div class="reference-synonyms">${synonyms}</div></section><section class="reference-section"><h4>Source</h4><p class="reference-source">${esc(t.source||'Bundled educational reference')}</p></section><div class="reference-actions"><button class="btn-ui btn-primary-ui" type="button" data-open-dictionary-term="${esc(t.id)}">Open in Dictionary</button><a class="btn-ui" href="ai.html?term=${encodeURIComponent(t.id)}">Study in AI</a><button class="btn-ui" type="button" data-pronounce-ref="${esc(t.term)}">Pronounce</button></div>`;
  }
  function renderCalculators(){
    $('#clinicalSpecialty').disabled=true;$('#clinicalSpecialty').innerHTML='<option>Numeric tools</option>';
    const q=state.query.toLowerCase();const items=state.calculators.filter(c=>!q||[c.title,c.group,c.formula_label].some(x=>String(x||'').toLowerCase().includes(q)));
    $('#clinicalCount').textContent=`${items.length} calculators`;
    $('#clinicalList').innerHTML=items.map(c=>`<button type="button" role="listitem" class="calc-card${c.id===state.selectedCalc?' active':''}" data-calculator="${esc(c.id)}"><b>${esc(c.title)}</b><small>${esc(c.group)} · ${esc(c.formula_label)}</small></button>`).join('')||'<div class="clinical-empty">No matching calculators.</div>';
    if(!state.selectedCalc&&items[0])renderCalculatorDetail(items[0].id);
  }
  function calculate(c){
    const vals={};let valid=true;
    c.inputs.forEach(i=>{const n=Number(document.querySelector(`[data-calc-input="${CSS.escape(i.id)}"]`)?.value);if(!Number.isFinite(n)){valid=false}else vals[i.id]=n;});
    if(!valid){$('#calcResult').innerHTML='<span>Enter all numeric inputs.</span>';return;}
    let result;
    switch(c.formula){case'c_to_f':result=vals.celsius*9/5+32;break;case'f_to_c':result=(vals.fahrenheit-32)*5/9;break;case'ml_to_l':result=vals.ml/1000;break;case'l_to_ml':result=vals.liters*1000;break;case'mg_to_g':result=vals.mg/1000;break;case'pulse_pressure':result=vals.systolic-vals.diastolic;break;case'map':result=(vals.systolic+2*vals.diastolic)/3;break;default:return;}
    const digits=Number.isInteger(c.precision)?c.precision:2;$('#calcResult').innerHTML=`<span>Numeric result</span><br><b>${Number(result).toFixed(digits)} ${esc(c.output_unit||'')}</b>`;
  }
  function renderCalculatorDetail(id){
    const c=state.calculators.find(x=>x.id===id);if(!c)return;state.selectedCalc=id;renderCalculatorsListOnly();
    const inputs=c.inputs.map(i=>`<div class="calc-field"><label for="calc-${esc(i.id)}">${esc(i.label)}</label><div class="calc-input-row"><input class="calc-input" id="calc-${esc(i.id)}" data-calc-input="${esc(i.id)}" type="number" inputmode="decimal" ${Number.isFinite(i.min)?`min="${i.min}"`:''} step="${i.step||'any'}" aria-label="${esc(i.label)}"><span class="calc-unit">${esc(i.unit||'')}</span></div></div>`).join('');
    $('#clinicalDetail').innerHTML=`<span class="reference-badge">Educational calculator</span><h3>${esc(c.title)}</h3><div class="ref-category">${esc(c.group)}</div><section class="reference-section"><h4>Formula</h4><p>${esc(c.formula_label)}</p></section><div class="calc-form">${inputs}<button class="btn-ui btn-primary-ui" type="button" id="calculateClinical">Calculate</button></div><div class="calc-result" id="calcResult"><span>Enter values, then calculate.</span></div><section class="reference-section"><p class="calc-disclaimer">Educational numeric output only. This tool does not diagnose a condition, interpret a patient's result, recommend treatment, or calculate medication doses.</p></section>`;
    $('#calculateClinical').addEventListener('click',()=>calculate(c));
    $$('#clinicalDetail [data-calc-input]').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')calculate(c)}));
  }
  function renderCalculatorsListOnly(){
    const q=state.query.toLowerCase();const items=state.calculators.filter(c=>!q||[c.title,c.group,c.formula_label].some(x=>String(x||'').toLowerCase().includes(q)));
    $('#clinicalCount').textContent=`${items.length} calculators`;
    $('#clinicalList').innerHTML=items.map(c=>`<button type="button" role="listitem" class="calc-card${c.id===state.selectedCalc?' active':''}" data-calculator="${esc(c.id)}"><b>${esc(c.title)}</b><small>${esc(c.group)} · ${esc(c.formula_label)}</small></button>`).join('')||'<div class="clinical-empty">No matching calculators.</div>';
  }
  function renderSafety(){
    $('#clinicalSpecialty').disabled=true;$('#clinicalSpecialty').innerHTML='<option>Safety contract</option>';$('#clinicalCount').textContent='Safety-gated architecture';$('#clinicalList').innerHTML='<div class="clinical-empty"><b>Medication interaction output is intentionally safety-gated.</b><br>Read the contract at right.</div>';
    const s=state.meta.safety_contract||{};const rules=(s.rules||[]).map(r=>`<div class="safety-rule"><b>${esc(r.title)}</b><p>${esc(r.text)}</p></div>`).join('');
    $('#clinicalDetail').innerHTML=`<span class="reference-badge">Safety boundary</span><h3>${esc(s.title||'Interaction Safety Architecture')}</h3><section class="reference-section"><p>${esc(s.summary||'No medication-pair advice is bundled.')}</p></section><div class="safety-contract">${rules}</div>`;
  }
  function renderLearning(){
    $('#clinicalSpecialty').disabled=true;$('#clinicalSpecialty').innerHTML='<option>Learning routes</option>';$('#clinicalCount').textContent=`${(state.meta.learning_routes||[]).length} routes`;$('#clinicalList').innerHTML='<div class="clinical-empty">Choose a learning route from the panel at right.</div>';
    const routes=(state.meta.learning_routes||[]).map(r=>`<article class="learning-route"><h4>${esc(r.title)}</h4><p>${esc(r.text)}</p><a class="btn-ui" href="${esc(r.href)}">Open</a></article>`).join('');
    $('#clinicalDetail').innerHTML=`<span class="reference-badge">Learning & Reference</span><h3>Continue learning</h3><section class="reference-section"><p>Move between the bundled Dictionary, Anatomy and bundled study tools; online AI remains an optional connected service.</p></section><div class="learning-routes">${routes}</div>`;
  }
  function renderWorkspace(){
    const m=moduleMeta(state.module);$('#clinicalWorkspaceTitle').textContent=m.title||labels[state.module]||state.module;$('#clinicalWorkspaceNote').textContent=m.description||'Bundled educational reference.';renderTabs();
    const isSearchable=['conditions','procedures','drugs','calculators'].includes(state.module);$('#clinicalSearch').disabled=!isSearchable;$('#clinicalSearch').placeholder=isSearchable?'Search this reference module…':'Search is not needed for this module';
    if(['conditions','procedures','drugs'].includes(state.module)){renderTermList();if(state.selectedId&&moduleTerms(state.module).some(x=>x.id===state.selectedId))renderTermDetail(state.selectedId);else $('#clinicalDetail').innerHTML='<div class="clinical-detail-empty"><span>✦</span><h4>Select a reference</h4><p>Choose an item to view its educational summary, synonyms, source and study links.</p></div>';}
    else if(state.module==='calculators')renderCalculators();else if(state.module==='interactions')renderSafety();else renderLearning();
  }
  function openModule(id){
    if(!labels[id])id='conditions';state.module=id;state.query='';state.specialty='all';state.selectedId=null;state.selectedCalc=null;$('#clinicalSearch').value='';workspace.classList.remove('hidden');renderWorkspace();requestAnimationFrame(()=>workspace.scrollIntoView({behavior:'smooth',block:'start'}));
  }
  function closeWorkspace(){workspace.classList.add('hidden');state.selectedId=null;state.selectedCalc=null;}
  function openTerm(id,module){const t=(state.data?.terms||[]).find(x=>x.id===id);if(!t)return false;const m=module||t.reference_module;if(!['conditions','procedures','drugs'].includes(m))return false;openModule(m);renderTermDetail(id);return true;}

  document.addEventListener('click',e=>{
    const mod=e.target.closest('[data-clinical-module]');if(mod){openModule(mod.dataset.clinicalModule);return;}
    const tab=e.target.closest('[data-clinical-tab]');if(tab){openModule(tab.dataset.clinicalTab);return;}
    const item=e.target.closest('[data-clinical-item]');if(item){renderTermDetail(item.dataset.clinicalItem);return;}
    const calc=e.target.closest('[data-calculator]');if(calc){renderCalculatorDetail(calc.dataset.calculator);return;}
    const dict=e.target.closest('[data-open-dictionary-term]');if(dict){window.SMD21Dictionary?.openTerm?.(dict.dataset.openDictionaryTerm);showToast('Opened in Dictionary');return;}
    const say=e.target.closest('[data-pronounce-ref]');if(say){if('speechSynthesis'in window){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(say.dataset.pronounceRef))}return;}
  });
  $('#clinicalClose').addEventListener('click',closeWorkspace);
  $('#clinicalSearch').addEventListener('input',e=>{state.query=e.target.value.trim();if(['conditions','procedures','drugs'].includes(state.module))renderTermList();else if(state.module==='calculators')renderCalculatorsListOnly();});
  $('#clinicalSpecialty').addEventListener('change',e=>{state.specialty=e.target.value;renderTermList()});
  document.addEventListener('change',e=>{if(e.target.matches('[data-lang-select]')&&!workspace.classList.contains('hidden'))setTimeout(renderWorkspace,0)});

  async function init(){
    try{
      const [meta,data,calc]=await Promise.all([
        fetch('data/clinical-reference.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Clinical Reference metadata failed');return r.json()}),
        fetch('data/index.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Dictionary data failed');return r.json()}),
        fetch('data/clinical-calculators.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Calculator data failed');return r.json()})
      ]);
      state.meta=meta;state.data=data;state.calculators=calc.calculators||[];renderModuleCards();
      const params=new URLSearchParams(location.search);const requested=params.get('clinical'),requestedTerm=params.get('clinicalTerm');if(requested&&labels[requested]){openModule(requested);if(requestedTerm)openTerm(requestedTerm,requested);}
    }catch(err){console.error(err);$('#clinicalGrid').innerHTML=`<div class="clinical-card"><h3>Clinical Reference</h3><p>${esc(err.message)}</p></div>`;}
  }
  window.SMD21Clinical={openModule,openTerm};
  init();
})();
