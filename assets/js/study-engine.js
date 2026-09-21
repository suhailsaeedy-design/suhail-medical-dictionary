(() => {
  const STOP = new Set(['the','a','an','and','or','of','to','in','on','for','with','what','is','are','explain','compare','quiz','flashcards','summary','about','please','tell','me','medical','term','terms']);
  const norm=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();
  const uniq=a=>[...new Set(a.filter(Boolean))];
  const title=s=>String(s||'').replace(/\s+/g,' ').trim();
  const safetyRx=/(diagnos(e|is)|prescrib(e|ing)|dosage|\bdose\b|how much (medicine|medication|drug)|what (medicine|medication|drug) should i|treatment plan|should i take|emergency treatment)/i;

  function create(terms){
    const list=(terms||[]).filter(t=>t&&t.id&&t.term);
    const byId=new Map(list.map(t=>[String(t.id),t]));
    const searchable=list.map(t=>({
      term:t,
      hay:norm([t.term,t.category_label,t.category,...(t.synonyms||[])].join(' '))
    }));
    const contentLang=(lang='en')=>['prs','fa'].includes(lang)?'fa':lang;
    const localName=(t,lang='en') => {lang=contentLang(lang);return (lang==='ps'&&t.localized_term?.ps)||(lang==='fa'&&t.localized_term?.fa)||t.term};
    const definition=(t,lang='en') => {lang=contentLang(lang);return t.definition?.[lang]||t.definition?.en||''};
    const explanation=(t,lang='en') => {lang=contentLang(lang);return t.explanation?.[lang]||t.explanation?.en||''};

    function search(query,limit=8){
      const q=norm(query); if(!q) return [];
      const tokens=q.split(' ').filter(x=>x.length>1&&!STOP.has(x));
      const scored=[];
      for(const x of searchable){
        const n=norm(x.term.term); let score=0;
        if(n===q) score+=100;
        if(n.startsWith(q)) score+=45;
        if(x.hay.includes(q)) score+=30;
        for(const tok of tokens){
          if(n===tok) score+=38; else if(n.includes(tok)) score+=18;
          if(x.hay.includes(tok)) score+=6;
        }
        if(score>0) scored.push([score,x.term]);
      }
      return scored.sort((a,b)=>b[0]-a[0]||a[1].term.localeCompare(b[1].term)).slice(0,limit).map(x=>x[1]);
    }

    function mentionedTerms(prompt){
      const q=norm(prompt); if(!q) return [];
      const hits=[];
      for(const t of list){
        const names=[t.term,...(t.synonyms||[])].map(norm).filter(x=>x.length>=3);
        let best=null;
        for(const name of names){
          const pos=` ${q} `.indexOf(` ${name} `);
          if(pos>=0 && (!best || name.length>best.name.length)) best={pos,name};
        }
        if(best) hits.push({t,pos:best.pos,len:best.name.length,canonical:norm(t.term)===best.name});
      }
      return hits.sort((a,b)=>a.pos-b.pos||Number(b.canonical)-Number(a.canonical)||b.len-a.len).map(x=>x.t);
    }

    function inferTerms(prompt,contextIds=[]){
      const selected=contextIds.map(id=>byId.get(String(id))).filter(Boolean);
      const mentioned=mentionedTerms(prompt);
      const found=search(prompt,8);
      const merged=[]; const seen=new Set();
      [...selected,...mentioned,...found].forEach(t=>{if(!seen.has(t.id)){seen.add(t.id);merged.push(t)}});
      return merged.slice(0,8);
    }

    function safeDistractors(target,count=3){
      const same=list.filter(t=>t.id!==target.id&&t.category===target.category);
      const other=list.filter(t=>t.id!==target.id&&t.category!==target.category);
      return [...same,...other].slice(0,count);
    }

    function quizFor(ts,lang){
      const picks=(ts.length?ts:list.slice(0,3)).slice(0,5);
      return picks.map((t,qi)=>{
        const wrong=safeDistractors(t,3);
        const choices=[definition(t,lang),...wrong.map(x=>definition(x,lang))].filter(Boolean).slice(0,4);
        const rotated=choices.length>1?[...choices.slice(qi%choices.length),...choices.slice(0,qi%choices.length)]:choices;
        return {
          termId:t.id,
          question:`Which definition best matches ${localName(t,lang)}?`,
          choices:rotated,
          correctIndex:rotated.indexOf(definition(t,lang)),
          explanation:explanation(t,lang)||definition(t,lang)
        };
      });
    }

    function run({action='auto',prompt='',contextIds=[],lang='en'}={}){
      const p=title(prompt); const lower=norm(p);
      if(safetyRx.test(p)) return {kind:'notice',heading:'Educational boundary',body:'This study tool can explain medical terminology and concepts, but it does not diagnose, prescribe, calculate medication doses, or create treatment plans. Use the Dictionary and Study tools for educational reference.'};
      let chosen=action;
      if(chosen==='auto'){
        if(/\bcompare\b/.test(lower)) chosen='compare';
        else if(/\bquiz\b|test me/.test(lower)) chosen='quiz';
        else if(/flash ?cards?/.test(lower)) chosen='flashcards';
        else if(/\bsummary\b|summarize/.test(lower)) chosen='summary';
        else if(/\bexplain\b|what is|define/.test(lower)) chosen='explain';
        else chosen='explain';
      }
      const ts=inferTerms(p,contextIds);
      if(chosen==='compare' && ts.length<2) return {kind:'need-context',heading:'Choose two terms to compare',body:'Add at least two medical terms to Study Context, or type two term names in your message.',matches:search(p,6).map(t=>t.id)};
      if(['explain','summary','flashcards','quiz'].includes(chosen) && !ts.length) return {kind:'search',heading:'Choose a medical term',body:'No bundled term matched that request. Search the Study Context library and add a term, then try again.',matches:search(p,8).map(t=>t.id)};
      if(chosen==='compare') return {kind:'compare',heading:`Compare ${localName(ts[0],lang)} and ${localName(ts[1],lang)}`,termIds:ts.slice(0,2).map(t=>t.id)};
      if(chosen==='quiz') return {kind:'quiz',heading:'Local study quiz',questions:quizFor(ts,lang)};
      if(chosen==='flashcards') return {kind:'flashcards',heading:'Flashcards',termIds:ts.slice(0,12).map(t=>t.id)};
      if(chosen==='summary') return {kind:'summary',heading:`Study summary · ${ts.length} term${ts.length===1?'':'s'}`,termIds:ts.slice(0,8).map(t=>t.id)};
      const t=ts[0];
      return {kind:'explain',heading:localName(t,lang),termId:t.id};
    }

    return {terms:list,byId,search,mentionedTerms,inferTerms,run,localName,definition,explanation};
  }

  window.SMD21StudyEngine={create};
})();
