(() => {
  if(!window.SMD21Auth || !SMD21Auth.guard()) return;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
  const account=SMD21Auth.getAccount()||{email:'local'};
  const accountKey=encodeURIComponent(String(account.email||'local').toLowerCase());
  const STORE=`smd21_ai_chats_${accountKey}`;
  const MODE_KEY=`smd21_ai_mode_${accountKey}`;
  const state={data:null,engine:null,config:null,chats:[],activeId:null,provider:'cloud',pendingRename:null,pendingDelete:null};
  const i18n={
    en:{conversations:'Conversations',conversationsNote:'Saved locally for this account on this browser.',newChat:'New chat',studyTools:'Study tools',studyToolsNote:'Generate study material with the online AI using selected public Dictionary context.',studyContext:'Study context',emptyTitle:'Study with your medical dictionary',emptyBody:'Choose terms for Study Context or type a medical term. Explain, Compare, Quiz, Flashcards and Summary use the online AI with selected public Dictionary context.',local:'Online AI · fair-use',newStudy:'New study chat'},
    ps:{conversations:'خبرې',conversationsNote:'د همدې حساب لپاره په دې براوزر کې محلي خوندي کېږي.',newChat:'نوې خبرې',studyTools:'د مطالعې وسایل',studyToolsNote:'د ټاکل شوو عامو قاموس معلوماتو سره د انلاین AI له لارې د مطالعې مواد جوړوي.',studyContext:'د مطالعې موضوعات',emptyTitle:'له طبي قاموس سره مطالعه',emptyBody:'طبي اصطلاحات د مطالعې موضوعاتو ته اضافه کړئ؛ Explain، Compare، Quiz، Flashcards او Summary د انلاین AI له لارې کار کوي.',local:'انلاین AI · عادلانه استعمال',newStudy:'نوې د مطالعې خبرې'},
    fa:{conversations:'گفتگوها',conversationsNote:'برای همین حساب در این مرورگر به‌صورت محلی ذخیره می‌شود.',newChat:'گفتگوی جدید',studyTools:'ابزارهای مطالعه',studyToolsNote:'با AI آنلاین و زمینه عمومی انتخاب‌شده فرهنگ پزشکی محتوای مطالعه می‌سازد.',studyContext:'موضوعات مطالعه',emptyTitle:'با فرهنگ پزشکی مطالعه کنید',emptyBody:'اصطلاحات را به موضوعات مطالعه اضافه کنید؛ ابزارهای Explain، Compare، Quiz، Flashcards و Summary با AI آنلاین کار می‌کنند.',local:'AI آنلاین · استفاده منصفانه',newStudy:'گفتگوی جدید مطالعه'}
  };
  i18n.prs={...i18n.fa};
  i18n.ar={conversations:'المحادثات',conversationsNote:'محفوظ محليًا لهذا الحساب على هذا المتصفح.',newChat:'محادثة جديدة',studyTools:'أدوات الدراسة',studyToolsNote:'إنشاء مواد دراسية باستخدام الذكاء الاصطناعي عبر الإنترنت وسياق القاموس العام المحدد.',studyContext:'سياق الدراسة',emptyTitle:'ادرس باستخدام قاموسك الطبي',emptyBody:'اختر مصطلحات لسياق الدراسة؛ تعمل أدوات الشرح والمقارنة والاختبار والبطاقات والملخص عبر الذكاء الاصطناعي على الإنترنت.',local:'ذكاء اصطناعي عبر الإنترنت · استخدام عادل',newStudy:'محادثة دراسة جديدة'};
  i18n.tr={conversations:'Konuşmalar',conversationsNote:'Bu hesap için bu tarayıcıda yerel olarak kaydedilir.',newChat:'Yeni sohbet',studyTools:'Çalışma araçları',studyToolsNote:'Seçili genel Sözlük bağlamıyla çevrimiçi AI kullanarak çalışma materyali üretir.',studyContext:'Çalışma bağlamı',emptyTitle:'Tıbbi sözlüğünüzle çalışın',emptyBody:'Çalışma bağlamına terimler ekleyin. Açıklama, Karşılaştırma, Test, Bilgi Kartları ve Özet çevrimiçi AI kullanır.',local:'Çevrimiçi AI · adil kullanım',newStudy:'Yeni çalışma sohbeti'};
  i18n.zh={conversations:'会话',conversationsNote:'此账户的内容保存在本浏览器本地。',newChat:'新建会话',studyTools:'学习工具',studyToolsNote:'使用在线 AI 和所选公共词典上下文生成学习材料。',studyContext:'学习上下文',emptyTitle:'使用医学词典学习',emptyBody:'将术语加入学习上下文。解释、比较、测验、闪卡和摘要均使用在线 AI。',local:'在线 AI · 公平使用',newStudy:'新建学习会话'};
  i18n.fa={...i18n.fa};
  const readStore=()=>{try{const d=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(d)?d:[]}catch{return []}};
  const saveStore=()=>{try{localStorage.setItem(STORE,JSON.stringify(state.chats.slice(0,60)));SMD21Auth.touchProfile()}catch(err){console.warn('AI Study local storage unavailable:',err)}};
  const uid=()=>crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const now=()=>new Date().toISOString();
  const lang=()=>SMD21.state.lang||'en';
  const t=(k)=>i18n[lang()]?.[k]||window.SMD21I18N?.translateExact?.(i18n.en[k]||k)||i18n.en[k]||k;
  const active=()=>state.chats.find(c=>c.id===state.activeId)||null;
  function showToast(msg){const n=$('#toast');n.textContent=msg;n.classList.remove('hidden');setTimeout(()=>n.classList.add('hidden'),1600)}

  function newChat(select=true){
    const c={id:uid(),title:t('newStudy'),createdAt:now(),updatedAt:now(),contextIds:[],messages:[]};
    state.chats.unshift(c);if(select)state.activeId=c.id;saveStore();renderAll();return c;
  }
  function ensureChat(){if(!active()){if(!state.chats.length)newChat(false);state.activeId=state.chats[0].id;}return active()}
  function touch(c){c.updatedAt=now();state.chats=state.chats.filter(x=>x.id!==c.id);state.chats.unshift(c);saveStore()}
  function autoTitle(c,prompt){if(c.messages.length>1||c.title!==i18n.en.newStudy&&c.title!==i18n.ps.newStudy&&c.title!==i18n.fa.newStudy)return;const cleaned=String(prompt||'').replace(/\s+/g,' ').trim();if(cleaned)c.title=cleaned.slice(0,52)+(cleaned.length>52?'…':'');}

  function renderNav(){
    const list=$('#chatList');list.replaceChildren();
    state.chats.forEach(c=>{
      const row=el('div','chat-item'+(c.id===state.activeId?' active':''));row.dataset.chatId=c.id;
      const main=el('button','chat-main');main.type='button';main.setAttribute('aria-label',`Open chat ${c.title}`);
      main.append(el('b','',c.title||t('newStudy')),el('small','',`${c.messages.length} message${c.messages.length===1?'':'s'} · ${new Date(c.updatedAt).toLocaleDateString()}`));
      const menu=el('div','chat-menu');
      const rename=el('button','chat-icon','✎');rename.type='button';rename.title='Rename chat';rename.setAttribute('aria-label','Rename chat');rename.dataset.renameChat=c.id;
      const del=el('button','chat-icon','×');del.type='button';del.title='Delete chat';del.setAttribute('aria-label','Delete chat');del.dataset.deleteChat=c.id;
      menu.append(rename,del);row.append(main,menu);list.append(row);
    });
  }

  function renderWelcome(container){
    const box=el('div','welcome-study');box.append(el('div','study-orb'));
    box.append(el('h2','',t('emptyTitle')),el('p','',t('emptyBody')));
    const q=el('div','quick-grid');[['explain','Explain'],['compare','Compare'],['quiz','Quiz'],['flashcards','Flashcards'],['summary','Summary']].forEach(([a,label])=>{const b=el('button','quick-action',label);b.dataset.studyAction=a;q.append(b)});box.append(q);container.append(box);
  }
  function addTextMessage(container,m){
    const row=el('div',`msg-row ${m.role==='user'?'user':'assistant'}`);const b=el('div','msg-bubble');b.append(el('div','msg-meta',m.role==='user'?'You':'AI Study'),el('div','',m.text||''));row.append(b);container.append(row);
  }
  function termFor(id){return state.engine?.byId.get(String(id))||null}
  function section(parent,label,text){const s=el('div','result-section');s.append(el('b','',label),el('p','',text||'—'));parent.append(s)}
  function renderMatches(parent,ids){if(!ids?.length)return;const row=el('div','match-row');ids.map(termFor).filter(Boolean).forEach(x=>{const b=el('button','match-btn',state.engine.localName(x,lang()));b.dataset.addContext=x.id;row.append(b)});parent.append(row)}
  function renderResult(container,m){
    const r=m.payload||{};const wrap=el('article','study-result');wrap.append(el('div','msg-meta','Local Study Engine'),el('h3','',r.heading||'Study result'));
    if(r.kind==='notice'||r.kind==='need-context'||r.kind==='search'){wrap.append(el('p','',r.body||''));renderMatches(wrap,r.matches);container.append(wrap);return;}
    if(r.kind==='explain'){
      const x=termFor(r.termId);if(x){section(wrap,'Definition',state.engine.definition(x,lang()));section(wrap,'Explanation',state.engine.explanation(x,lang()));section(wrap,'Category',x.category_label||x.category);const syn=el('div','result-section');syn.append(el('b','','Synonyms'));const sr=el('div','synonym-row');(x.synonyms||[]).forEach(s=>sr.append(el('span','',s)));if(!sr.children.length)sr.append(el('span','','No listed synonyms'));syn.append(sr);wrap.append(syn);section(wrap,'Source',x.source||'Bundled educational reference');}
    }else if(r.kind==='compare'){
      const xs=(r.termIds||[]).map(termFor).filter(Boolean);if(xs.length>=2){const table=el('table','compare-table');const head=el('tr');head.append(el('th','','Feature'),el('th','',state.engine.localName(xs[0],lang())),el('th','',state.engine.localName(xs[1],lang())));table.append(head);[['Category',x=>x.category_label||x.category],['Definition',x=>state.engine.definition(x,lang())],['Explanation',x=>state.engine.explanation(x,lang())],['Synonyms',x=>(x.synonyms||[]).join(', ')||'—']].forEach(([label,get])=>{const tr=el('tr');tr.append(el('th','',label),el('td','',get(xs[0])),el('td','',get(xs[1])));table.append(tr)});wrap.append(table);}
    }else if(r.kind==='summary'){
      const list=el('div','summary-list');(r.termIds||[]).map(termFor).filter(Boolean).forEach(x=>{const item=el('div','summary-item');item.append(el('b','',state.engine.localName(x,lang())),el('span','',`${x.category_label||x.category} · ${state.engine.definition(x,lang())}`));list.append(item)});wrap.append(list);
    }else if(r.kind==='flashcards'){
      const cards=el('div','flashcards');(r.termIds||[]).map(termFor).filter(Boolean).forEach(x=>{const card=el('div','flashcard');card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',`Flip flashcard for ${x.term}`);const inn=el('div','flash-inner');const front=el('div','flash-face front',state.engine.localName(x,lang()));const back=el('div','flash-face back',state.engine.definition(x,lang()));inn.append(front,back);card.append(inn);cards.append(card)});wrap.append(cards);
    }else if(r.kind==='quiz'){
      const quiz=el('div','quiz-block');(r.questions||[]).forEach((q,qi)=>{const box=el('div','quiz-question');box.dataset.correct=String(q.correctIndex);box.dataset.explanation=q.explanation||'';box.append(el('h4','',`${qi+1}. ${q.question}`));const choices=el('div','quiz-choices');(q.choices||[]).forEach((choice,ci)=>{const b=el('button','quiz-choice',choice);b.dataset.quizChoice=String(ci);choices.append(b)});box.append(choices);quiz.append(box)});wrap.append(quiz);
    }
    container.append(wrap);
  }
  function renderMessages(){
    const c=ensureChat();const box=$('#messages');box.replaceChildren();
    if(!c.messages.length)renderWelcome(box);else c.messages.forEach(m=>m.kind==='study'?renderResult(box,m):addTextMessage(box,m));
    $('#chatTitle').textContent=c.title||t('newStudy');$('#chatSubtitle').textContent='Online AI · shared free quota';
    requestAnimationFrame(()=>{box.scrollTop=box.scrollHeight});
  }
  function renderContext(){
    const c=ensureChat();const chips=$('#contextChips');chips.replaceChildren();
    (c.contextIds||[]).map(termFor).filter(Boolean).forEach(x=>{const chip=el('span','context-chip');chip.append(document.createTextNode(state.engine.localName(x,lang())));const b=el('button','', '×');b.type='button';b.dataset.removeContext=x.id;b.setAttribute('aria-label',`Remove ${x.term} from study context`);chip.append(b);chips.append(chip)});
    renderTermResults($('#termSearch').value||$('#topSearch').value||'');
  }
  function renderTermResults(q=''){
    if(!state.engine)return;const c=ensureChat();const box=$('#termResults');box.replaceChildren();let xs=q.trim()?state.engine.search(q,10):state.engine.terms.slice(0,10);if(!xs.length){box.append(el('div','empty-state','No matching bundled terms.'));return;}xs.forEach(x=>{const selected=c.contextIds.includes(x.id);const b=el('button','term-result'+(selected?' selected':''));b.type='button';b.dataset.toggleContext=x.id;b.append(el('b','',state.engine.localName(x,lang())),el('small','',`${x.category_label||x.category}${selected?' · Selected':''}`));box.append(b)});
  }
  function renderLabels(){
    $('[data-ai-i18n]').forEach(n=>{const k=n.dataset.aiI18n;n.textContent=t(k)});$('#modeBadgeText').textContent='Online AI · fair-use';
  }
  function renderAll(){renderLabels();renderNav();renderMessages();renderContext();}
  window.addEventListener('smd21:languagechange',()=>renderAll());

  function toggleContext(id,force){
    const c=ensureChat();const has=c.contextIds.includes(id);const on=force===undefined?!has:force;if(on&&!has)c.contextIds.push(id);if(!on&&has)c.contextIds=c.contextIds.filter(x=>x!==id);c.contextIds=c.contextIds.slice(0,8);touch(c);renderContext();
  }
  function addMessage(c,msg){c.messages.push({id:uid(),createdAt:now(),...msg});if(c.messages.length>200)c.messages=c.messages.slice(-200);touch(c)}
  function actionLabel(action,c){const names=(c.contextIds||[]).map(termFor).filter(Boolean).map(x=>state.engine.localName(x,lang()));return `${action[0].toUpperCase()+action.slice(1)}${names.length?': '+names.join(', '):''}`}

  function formatReset(value){
    if(!value)return '';
    const date=new Date(value);
    return Number.isNaN(date.getTime())?'':date.toLocaleString();
  }
  function updateQuotaState(payload={}){
    const box=$('#aiQuotaState');
    if(!box)return;
    const quota=payload.quota||payload;
    const bits=[];
    if(Number.isFinite(Number(quota.remaining_user_tokens)))bits.push(`${Number(quota.remaining_user_tokens).toLocaleString()} user tokens left today`);
    if(Number.isFinite(Number(quota.remaining_user_requests)))bits.push(`${Number(quota.remaining_user_requests)} requests left today`);
    if(Number.isFinite(Number(quota.remaining_global_tokens)))bits.push(`${Number(quota.remaining_global_tokens).toLocaleString()} shared tokens left`);
    if(Number.isFinite(Number(quota.remaining_global_requests)))bits.push(`${Number(quota.remaining_global_requests)} shared requests left`);
    if(Number.isFinite(Number(quota.planned_daily_users)))bits.push(`fair-share plan: ${Number(quota.planned_daily_users)} users`);
    const reset=formatReset(quota.reset_at);
    if(reset)bits.push(`resets ${reset}`);
    box.textContent=bits.length?bits.join(' · '):'Shared free AI quota is ready when your verified account is connected.';
  }
  async function cloudStatus(){
    if(!window.SMD21CloudAuth)return {configured:false,connected:false};
    try{return await SMD21CloudAuth.status()}catch{return {configured:false,connected:false}}
  }
  async function refreshProviderUi(){
    const cfg=state.config?.cloud||{};
    const status=await cloudStatus();
    const connected=!!status.connected;
    const cloudReady=!!(cfg.enabled&&cfg.endpoint);
    $('#connectAiBtn')?.classList.toggle('hidden',connected||!cloudReady);
    $('#providerState')?.classList.toggle('off',!connected);
    const label=$('#providerState')?.querySelector('span');
    if(label)label.textContent=!cloudReady
      ?'Online AI backend is not configured.'
      :connected
        ?'Verified account connected · online AI is ready when free provider capacity is available.'
        :'Connect your verified account to use the online AI.';
    state.provider='cloud';
  }
  async function runCloud(c,prompt){
    const cfg=state.config?.cloud||{};
    if(!cfg.enabled||!cfg.endpoint)return {ok:false,text:'Online AI is not configured by the owner yet.'};
    if(!navigator.onLine)return {ok:false,text:'Online AI needs an internet connection. Please reconnect and try again.'};
    const status=await cloudStatus();
    if(!status.connected){
      return {ok:false,text:'Connect your verified account to use the online AI.'};
    }
    const session=await SMD21CloudAuth.getValidSession();
    const context=(c.contextIds||[]).map(termFor).filter(Boolean).map(x=>({id:x.id,term:x.term,category:x.category_label||x.category,definition:state.engine.definition(x,'en'),explanation:state.engine.explanation(x,'en')}));
    try{
      const res=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({message:prompt,language:lang(),context})});
      const data=await res.json().catch(()=>({}));
      updateQuotaState(data);
      if(!res.ok){
        const reset=formatReset(data.reset_at);
        const suffix=reset?` You can try again after ${reset}.`:'';
        return {ok:false,text:`${data.message||'Real AI is temporarily unavailable.'}${suffix}`};
      }
      const text=String(data.reply||'').trim();
      if(!text)throw new Error('Empty response');
      return {ok:true,text};
    }catch(err){
      return {ok:false,text:`Online AI request failed (${err.message}). Please try again later.`};
    }
  }

  async function submit(action='auto'){
    const c=ensureChat();const input=$('#promptInput');let prompt=input.value.trim();if(action!=='auto'&&!prompt)prompt=actionLabel(action,c);if(!prompt)return;
    addMessage(c,{role:'user',kind:'text',text:prompt});autoTitle(c,prompt);input.value='';autoResize();renderNav();renderMessages();
    $('#sendBtn').disabled=true;
    const out=await runCloud(c,prompt);
    addMessage(c,{role:'assistant',kind:'text',text:out.text});
    $('#sendBtn').disabled=false;
    renderNav();renderMessages();return;
  }

  function autoResize(){const x=$('#promptInput');x.style.height='auto';x.style.height=Math.min(x.scrollHeight,130)+'px'}
  function toggleAppMenu(force){const open=force??!$('#sidebar').classList.contains('open');$('#sidebar').classList.toggle('open',open);if(open)$('#studySidebar').classList.remove('mobile-open');syncBackdrop()}
  function toggleChats(force){const open=force??!$('#studySidebar').classList.contains('mobile-open');$('#studySidebar').classList.toggle('mobile-open',open);if(open)$('#sidebar').classList.remove('open');syncBackdrop()}
  function syncBackdrop(){const show=$('#sidebar').classList.contains('open')||$('#studySidebar').classList.contains('mobile-open');$('#drawerBackdrop').classList.toggle('show',show)}
  function closeDrawers(){$('#sidebar').classList.remove('open');$('#studySidebar').classList.remove('mobile-open');syncBackdrop()}

  document.addEventListener('click',e=>{
    const action=e.target.closest('[data-study-action]');if(action){submit(action.dataset.studyAction);return;}
    const chat=e.target.closest('.chat-main');if(chat){state.activeId=chat.closest('.chat-item').dataset.chatId;renderAll();closeDrawers();return;}
    const ren=e.target.closest('[data-rename-chat]');if(ren){state.pendingRename=ren.dataset.renameChat;const c=state.chats.find(x=>x.id===state.pendingRename);$('#renameInput').value=c?.title||'';$('#renameModal').classList.remove('hidden');setTimeout(()=>$('#renameInput').focus(),20);return;}
    const del=e.target.closest('[data-delete-chat]');if(del){state.pendingDelete=del.dataset.deleteChat;$('#deleteModal').classList.remove('hidden');return;}
    const toggle=e.target.closest('[data-toggle-context]');if(toggle){toggleContext(toggle.dataset.toggleContext);return;}
    const add=e.target.closest('[data-add-context]');if(add){toggleContext(add.dataset.addContext,true);return;}
    const rem=e.target.closest('[data-remove-context]');if(rem){toggleContext(rem.dataset.removeContext,false);return;}
    const flash=e.target.closest('.flashcard');if(flash){flash.classList.toggle('flipped');return;}
    const choice=e.target.closest('[data-quiz-choice]');if(choice){const q=choice.closest('.quiz-question');if(q.dataset.answered==='1')return;q.dataset.answered='1';const correct=Number(q.dataset.correct);const picked=Number(choice.dataset.quizChoice);[...q.querySelectorAll('[data-quiz-choice]')].forEach((b,i)=>{b.disabled=true;if(i===correct)b.classList.add('correct');else if(i===picked)b.classList.add('wrong')});const f=el('div','quiz-feedback',picked===correct?'Correct.':`Not quite. ${q.dataset.explanation||''}`);q.append(f);return;}
  });
  $('#newChat').addEventListener('click',()=>{newChat(true);closeDrawers()});
  $('#sendBtn').addEventListener('click',()=>submit('auto'));
  $('#promptInput').addEventListener('input',autoResize);
  $('#promptInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit('auto')}});
  function syncSearch(v){$('#termSearch').value=v;$('#topSearch').value=v;renderTermResults(v)}
  $('#termSearch').addEventListener('input',e=>syncSearch(e.target.value));$('#topSearch').addEventListener('input',e=>syncSearch(e.target.value));
  $('#termSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){const x=state.engine.search(e.target.value,1)[0];if(x)toggleContext(x.id,true)}});$('#topSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){const x=state.engine.search(e.target.value,1)[0];if(x)toggleContext(x.id,true)}});
  $('#connectAiBtn').addEventListener('click',async()=>{
    try{
      await SMD21CloudAuth.startGoogleSignIn('ai.html');
    }catch(err){
      showToast(err.message||'Could not start verified sign-in');
    }
  });
  $('#mobileMenu').addEventListener('click',()=>toggleAppMenu());$('#mobileChats').addEventListener('click',()=>toggleChats());$('#drawerBackdrop').addEventListener('click',closeDrawers);
  
  $('#cancelRename').addEventListener('click',()=>$('#renameModal').classList.add('hidden'));$('#saveRename').addEventListener('click',()=>{const c=state.chats.find(x=>x.id===state.pendingRename);const v=$('#renameInput').value.trim();if(c&&v){c.title=v.slice(0,80);touch(c);renderAll()}$('#renameModal').classList.add('hidden')});
  $('#cancelDelete').addEventListener('click',()=>$('#deleteModal').classList.add('hidden'));$('#confirmDelete').addEventListener('click',()=>{const id=state.pendingDelete;state.chats=state.chats.filter(x=>x.id!==id);if(state.activeId===id)state.activeId=state.chats[0]?.id||null;if(!state.chats.length)newChat(false);if(!state.activeId)state.activeId=state.chats[0].id;saveStore();$('#deleteModal').classList.add('hidden');renderAll()});
  $('#signOutBtn').addEventListener('click',async()=>{await SMD21Auth.signOut();location.href='index.html'});
  document.addEventListener('change',e=>{if(e.target.matches('[data-lang-select]'))setTimeout(renderAll,0)});
  document.addEventListener('keydown',e=>{const card=e.target.closest?.('.flashcard');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();card.click();return;}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#topSearch').focus()}if(e.key==='Escape'){closeDrawers();$$('.modal-shell').forEach(x=>x.classList.add('hidden'))}});

  async function init(){
    try{
      const [data,config]=await Promise.all([
        fetch('data/index.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Dictionary data failed');return r.json()}),
        fetch('data/ai-config.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('AI config failed');return r.json()})
      ]);
      state.data=data;state.config=config;state.engine=SMD21StudyEngine.create(data.terms||[]);state.chats=readStore();if(!state.chats.length)newChat(false);state.activeId=state.chats[0].id;
      const params=new URLSearchParams(location.search);const requestedContextIds=[params.get('term'),...(params.get('terms')||'').split(',')].map(x=>String(x||'').trim()).filter(Boolean);const unique=[...new Set(requestedContextIds)].filter(id=>state.engine.byId.has(id)).slice(0,8);if(unique.length){const c=ensureChat();c.contextIds=[...unique,...c.contextIds.filter(id=>!unique.includes(id))].slice(0,8);touch(c)}
      state.provider='cloud';
      $('#accountEmail').textContent=account.email||'Local account';
      renderAll();
      await refreshProviderUi();
      updateQuotaState({});
    }catch(err){$('#messages').replaceChildren(el('div','empty-state',`AI Study failed to load: ${err.message}`));console.error(err)}
  }
  init();
})();
