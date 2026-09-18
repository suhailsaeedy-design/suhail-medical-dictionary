(function(){
  const esc=s=>window.SuhailAuth?.escapeHtml?.(s)??String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  function termBlock(t){return `<article class="print-term"><h2>${esc(t.name)}</h2><p><b>Category:</b> ${esc(t.category)} &nbsp; <b>MeSH:</b> ${esc(t.mesh||'—')} &nbsp; <b>ICD:</b> ${esc(t.icd||'—')}</p><p>${esc(t.definition)}</p><p><b>Synonyms:</b> ${esc((t.synonyms||[]).join(', ')||'—')}</p></article>`}
  function printTerms(list,title='Suhail Medical Dictionary'){
    const area=document.getElementById('printArea');if(!area)return;
    area.innerHTML=`<h1>${esc(title)}</h1><p>Educational study export · ${new Date().toLocaleString()}</p>${list.map(termBlock).join('')}`;
    window.print();
  }
  function exportTermPDF(t){printTerms([t],`${t.name} — Study Sheet`)}
  function exportSelectedPDF(list){printTerms(list,'Selected Medical Terms')}
  window.SuhailExport={printTerms,exportTermPDF,exportSelectedPDF};
})();
