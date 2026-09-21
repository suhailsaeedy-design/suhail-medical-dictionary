(() => {
  const safeName=s=>String(s||'term').trim().replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,80)||'term';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const ascii=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E\n]/g,'?');
  const pdfEsc=s=>ascii(s).replace(/([\\()])/g,'\\$1');
  function wrap(text,width=86){
    const out=[];for(const raw of String(text||'').split(/\r?\n/)){const words=raw.split(/\s+/).filter(Boolean);let line='';for(const w of words){if(!line){line=w;continue;}if((line+' '+w).length<=width)line+=' '+w;else{out.push(line);line=w;}}out.push(line||' ');}return out;
  }
  function pdfLines(model){
    const L=[];const add=(title,value)=>{if(!value)return;L.push(title.toUpperCase());L.push(...wrap(value));L.push(' ')};
    L.push('SUHAIL MEDICAL DICTIONARY');L.push('Educational Term Reference');L.push(' ');
    add('Term',model.canonicalName||model.name);add('MeSH ID',model.meshId);add('Category',model.category);add('Definition',model.definition);add('Explanation',model.explanation);add('Synonyms',(model.synonyms||[]).join(', '));add('Source',model.source);
    L.push('EDUCATIONAL NOTICE');L.push(...wrap('This export is for learning and reference only. It does not replace professional diagnosis, treatment, or emergency care.'));
    return L;
  }
  function buildPdf(model){
    const all=pdfLines(model),pages=[];for(let i=0;i<all.length;i+=46)pages.push(all.slice(i,i+46));
    const objects=[];objects[1]='<< /Type /Catalog /Pages 2 0 R >>';objects[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    const kids=[];let next=4;
    for(const lines of pages){const pageId=next++,contentId=next++;kids.push(`${pageId} 0 R`);let y=790;const commands=['BT','/F1 11 Tf','50 790 Td'];for(let i=0;i<lines.length;i++){const line=lines[i];if(i){commands.push(`0 -16 Td`);y-=16;}commands.push(`(${pdfEsc(line)}) Tj`);}commands.push('ET');const stream=commands.join('\n');objects[contentId]=`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;objects[pageId]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;}
    objects[2]=`<< /Type /Pages /Count ${kids.length} /Kids [ ${kids.join(' ')} ] >>`;
    let pdf='%PDF-1.4\n%SMD21\n',offsets=[0];for(let i=1;i<objects.length;i++){offsets[i]=pdf.length;pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}
    const xref=pdf.length;pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let i=1;i<objects.length;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;pdf+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new Blob([pdf],{type:'application/pdf'});
  }
  function downloadBlob(blob,name){const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
  function exportPdf(model){downloadBlob(buildPdf(model),`${safeName(model.canonicalName||model.name)}-Suhail-Medical-Dictionary.pdf`);}
  function printModel(model){
    const frame=document.createElement('iframe');frame.title='Printable medical term';frame.style.position='fixed';frame.style.width='1px';frame.style.height='1px';frame.style.opacity='0';frame.style.pointerEvents='none';frame.style.right='0';frame.style.bottom='0';document.body.append(frame);
    const d=frame.contentDocument;d.open();d.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(model.name)} · Suhail Medical Dictionary</title><style>body{font-family:Arial,sans-serif;color:#102536;margin:44px;line-height:1.55}header{border-bottom:2px solid #1aaaf1;padding-bottom:16px;margin-bottom:22px}h1{margin:0 0 4px;font-size:30px}h2{font-size:14px;text-transform:uppercase;letter-spacing:.08em;margin:22px 0 6px;color:#167bab}.meta{color:#52697b}.chips span{display:inline-block;border:1px solid #b8c7d1;border-radius:999px;padding:4px 8px;margin:3px;font-size:12px}.notice{margin-top:28px;padding:14px;border:1px solid #c8d8e4;border-radius:10px;background:#f7fbfd;font-size:12px}@media print{body{margin:18mm}}</style></head><body><header><div>Suhail Medical Dictionary</div><h1>${esc(model.name)}</h1><div class="meta">${esc(model.category)}${model.meshId?` · MeSH ${esc(model.meshId)}`:''}</div></header><h2>Definition</h2><p>${esc(model.definition)}</p><h2>Explanation</h2><p>${esc(model.explanation)}</p><h2>Synonyms</h2><div class="chips">${(model.synonyms||[]).map(x=>`<span>${esc(x)}</span>`).join('')||'<span>None listed</span>'}</div><h2>Source</h2><p>${esc(model.source)}</p><div class="notice"><b>Educational notice:</b> This material is for learning and reference only and does not replace professional diagnosis, treatment, or emergency care.</div></body></html>`);d.close();
    const run=()=>{try{frame.contentWindow.focus();frame.contentWindow.print();}finally{setTimeout(()=>frame.remove(),1600)}};setTimeout(run,180);
  }
  async function copySummary(model){const text=[model.name,model.meshId&&`MeSH ID: ${model.meshId}`,model.category&&`Category: ${model.category}`,model.definition&&`Definition: ${model.definition}`,model.explanation&&`Explanation: ${model.explanation}`,model.synonyms?.length&&`Synonyms: ${model.synonyms.join(', ')}`,model.source&&`Source: ${model.source}`].filter(Boolean).join('\n');if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return;}const ta=document.createElement('textarea');ta.value=text;document.body.append(ta);ta.select();document.execCommand('copy');ta.remove();}
  function pronounce(text,lang='en'){if(!('speechSynthesis'in window))throw new Error('Speech synthesis is not available in this browser.');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(text||''));u.lang=lang==='ps'?'ps-AF':lang==='fa'?'fa-AF':'en-US';u.rate=.9;speechSynthesis.speak(u);}
  function exportCsv(terms){const rows=[['Term','MeSH ID','Category','Definition','Synonyms']];for(const t of terms)rows.push([t.term||'',t.mesh_id||'',t.category_label||t.category||'',t.definition?.en||'',(t.synonyms||[]).join('; ')]);const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');downloadBlob(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),'Suhail-Medical-Dictionary-selected-terms.csv');}
  window.SMD21TermTools={exportPdf,printModel,copySummary,pronounce,exportCsv,createPdfBlob:buildPdf};
})();
