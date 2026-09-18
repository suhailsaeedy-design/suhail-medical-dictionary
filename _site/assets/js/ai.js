(function(){
  const cfg=window.SUHAIL_CONFIG||{};
  const terms=()=>window.SUHAIL_TERMS||[];
  const findTerm=(q)=>{const s=q.toLowerCase();return terms().find(t=>s.includes(t.name.toLowerCase())||t.synonyms.some(x=>s.includes(x.toLowerCase())))};
  const clean=(s)=>String(s||'').trim();
  async function externalReply(prompt,context){
    if(!cfg.AI_ENDPOINT)return null;
    const res=await fetch(cfg.AI_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,context,app:'Suhail Medical Dictionary'})});
    if(!res.ok)throw new Error(`AI service returned ${res.status}`);const data=await res.json();return data.answer||data.text||data.response||null;
  }
  function localReply(prompt,contextTerm){
    const p=clean(prompt);const lower=p.toLowerCase();const t=contextTerm||findTerm(p);
    if(/hello|hi\b|salam|سلام|سلامونه/i.test(p))return 'Hello! I can help you study medical terminology, compare concepts, make short revision notes, or quiz you on a selected term.';
    if(/quiz|question|test me/i.test(lower)&&t){return `Quick revision quiz — ${t.name}:\n1) Which specialty is most closely associated with this term?\n2) Explain the term in one sentence.\n3) Name one synonym or related concept.\n\nTry answering first, then ask me to check your answers.`}
    if(/compare|difference|vs\.?/i.test(lower)){
      const hits=terms().filter(x=>lower.includes(x.name.toLowerCase())).slice(0,2);
      if(hits.length===2)return `${hits[0].name}: ${hits[0].definition}\n\n${hits[1].name}: ${hits[1].definition}\n\nKey study distinction: they belong to ${hits[0].category} and ${hits[1].category}, respectively. Focus on the underlying organ/system and defining feature.`;
    }
    if(/synonym|also known/i.test(lower)&&t)return `${t.name} is also known as: ${t.synonyms.join(', ') || 'No local synonyms are stored for this term.'}`;
    if(/pronoun|say|pronunciation/i.test(lower)&&t)return `Pronunciation guide for ${t.name}: ${t.pron}. Use the speaker button in the term detail panel to hear your browser read it aloud.`;
    if(/summary|simple|explain|what is|definition|meaning/i.test(lower)&&t)return `${t.name} — ${t.definition}\n\nStudy note: category: ${t.category}; common synonym(s): ${t.synonyms.slice(0,3).join(', ') || 'none stored'}.`;
    if(t)return `For ${t.name}: ${t.definition}\n\nYou can ask me to explain it simply, compare it with another term, list synonyms, or make a quick quiz.`;
    return 'I can answer from the built-in medical term set. Try a question such as “Explain hypertension simply,” “Compare hypertension vs diabetes,” or select a term and open AI Study. For important medical decisions, use authoritative references and a qualified health professional.';
  }
  async function reply(prompt,contextTerm){
    try{const ext=await externalReply(prompt,contextTerm);if(ext)return ext}catch(e){console.warn('External AI unavailable; using local assistant.',e)}
    return localReply(prompt,contextTerm);
  }
  window.SuhailAI={reply,findTerm};
})();
