(function () {
 'use strict';
 const store=window.TalentAccountStore,boot=window.__LEARNER;
 const {copy,blank,read,valid}=window.TalentAccountBoot;
 const t=(ka,en)=>currentLanguage==='en'?en:ka;
 const snapshot=()=>copy({state,practice:practiceState});
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const originalSave=save,originalPractice=savePractice;
 const pendingKey=window.accountStoragePrefix+'.pending',cloudKey=window.accountStoragePrefix+'.cloud';
 const importKey='talentlab.google.import';
 let status=boot?(boot.loadError?'error':'loading'):'guest',busy=false,dirty=false,timer,base=boot?.data,revision=boot?.revision;
 let needsLoad=!!boot?.loadError,blocked=false,signingOut=false,importFor=null;
 let guestNotice=null,guestNoticeDismissed=false;
 try{guestNoticeDismissed=sessionStorage.getItem('talentlab.guest.notice.dismissed')==='1';}catch{}
 const expired=e=>['account_changed','session_not_found','refresh_token_not_found','refresh_token_already_used','bad_jwt','user_not_found'].includes(e?.code)||e?.status===401||e?.status===403;
 function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
 function pending(){if(!boot)return;write(pendingKey,{base:copy(base),data:snapshot()});}
 function mark(){if(!boot||blocked)return;dirty=true;status='pending';pending();paint();clearTimeout(timer);timer=setTimeout(flush,800);}
 save=function(){if(blocked)return false;const ok=originalSave();mark();return ok;};
 savePractice=function(){if(blocked)return false;const ok=originalPractice();mark();return ok;};
 function apply(data){const value=copy(data);state=value.state;practiceState=value.practice;originalSave();originalPractice();}
 function paintGuestNotice(){
  if(boot||guestNoticeDismissed)return;
  if(!guestNotice){guestNotice=document.createElement('section');guestNotice.id='guest-progress-notice';guestNotice.className='info';guestNotice.style.cssText='margin-bottom:22px;';}
  guestNotice.setAttribute('aria-label',t('სტუმრის პროგრესის შენახვა','Saving guest progress'));
  guestNotice.innerHTML='<strong>'+t('სტუმრად სწავლობ 👋','You’re learning as a guest 👋')+'</strong><p style="margin:6px 0 12px">'+t('ავტორიზაციის გარეშე პროგრესი მხოლოდ ამ ბრაუზერში ინახება. Google-ით შედი, რომ ის შენს ანგარიშში შეინახო და სხვა მოწყობილობიდანაც გააგრძელო.','Without signing in, progress is saved only in this browser. Sign in with Google to save it to your account and continue on another device.')+'</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn small" id="guest-notice-login" type="button">'+t('Google-ით შესვლა','Sign in with Google')+'</button><button class="btn secondary small" id="guest-notice-dismiss" type="button">'+t('სტუმრად გაგრძელება','Continue as a guest')+'</button></div>';
  main.prepend(guestNotice);
  guestNotice.querySelector('#guest-notice-login').onclick=login;
  guestNotice.querySelector('#guest-notice-dismiss').onclick=()=>{guestNoticeDismissed=true;try{sessionStorage.setItem('talentlab.guest.notice.dismissed','1');}catch{}guestNotice.remove();guestNotice=null;};
 }
 function paint(){
  let box=document.getElementById('learner-account');if(!box){box=document.createElement('div');box.id='learner-account';box.style.cssText='display:flex;align-items:center;gap:7px;flex-wrap:wrap;font-size:11px';document.querySelector('.top-right').prepend(box);}
  const footer=document.querySelector('footer>span');
  if(!boot){
   box.innerHTML='<button class="display-button" id="learner-login" type="button">'+t('Google-ით შესვლა','Sign in with Google')+'</button>';
   box.querySelector('button').onclick=login;
   if(footer)footer.textContent=t('სტუმრად სწავლისას პროგრესი ამ ბრაუზერში ინახება.','Guest progress is saved in this browser.');
   paintGuestNotice();
   return;
  }
  const labels={loading:t('პროგრესი იტვირთება…','Loading progress…'),saved:t('პროგრესი შენახულია ✓','Progress saved ✓'),pending:t('ინახება…','Saving…'),error:t('ჯერ არ სინქრონიზებულა','Not synced yet'),expired:t('ხელახლა შედი ანგარიშში','Sign in again')};
  box.innerHTML='<span title="'+esc(boot.email)+'" data-user-content>'+t('ჩემი ანგარიში','My account')+'</span><span role="status" aria-live="polite">'+labels[status]+'</span>'+(['error','expired'].includes(status)?'<button class="display-button" id="learner-retry" type="button">'+t('ხელახლა ცდა','Retry')+'</button>':'')+'<button class="display-button" id="learner-backup" type="button" title="'+t('პროგრესის სარეზერვო ასლის ჩამოტვირთვა','Download a progress backup')+'">↓</button><button class="display-button" id="learner-signout" type="button">'+t('გასვლა','Sign out')+'</button>';
  box.querySelector('#learner-retry')?.addEventListener('click',()=>status==='expired'?login():flush());
  box.querySelector('#learner-backup').onclick=()=>{downloadText(JSON.stringify({format:'talentlab-progress-v1',data:snapshot()},null,2),'Talent_Lab_Backup.json');};
  box.querySelector('#learner-signout').onclick=logout;
  if(footer)footer.textContent=t('შესვლის შემდეგ პროგრესი შენს ანგარიშში ინახება.','When signed in, progress is saved to your account.');
 }
 async function login(){
  if(blocked){location.reload();return;}
  const button=document.getElementById('learner-login');if(button)button.disabled=true;
  try{
   if(!boot){
    // Preserve the original guest copy. A selected Google identity must confirm
    // importing it before any of these values are written to that account.
    sessionStorage.setItem(importKey,JSON.stringify({data:snapshot(),at:Date.now(),route:location.hash}));
   }
   await store.signIn();
  }catch{if(button)button.disabled=false;toast(t('შესვლა ვერ დაიწყო. შენი პროგრესი აქ შენახულია. სცადე ხელახლა.','Could not start sign-in. Your progress remains here. Please retry.'));}
 }
 async function flush(){
  if(!boot||busy||blocked||(!dirty&&!needsLoad))return;busy=true;status='pending';paint();clearTimeout(timer);
  try{
   if(needsLoad){
    const remote=await store.load(boot.id)||{data:blank(),revision:0,updatedAt:null};
    if(!valid(remote.data))throw Error('Invalid progress');
    apply(TalentAccountMerge(base,snapshot(),remote.data));base=copy(remote.data);revision=remote.revision;needsLoad=false;
    dirty=!same(snapshot(),base);write(cloudKey,remote);if(dirty)pending();else status='saved';
   }
   for(let attempt=0;dirty&&attempt<4;attempt++){
    const sent=snapshot(),sentBase=copy(base);
    const cloud=await store.save(boot.id,revision,sent);
    if(!valid(cloud?.data)||!Number.isSafeInteger(cloud.revision)||cloud.revision<0)throw Error('Invalid progress');
    if(blocked)return;
    if(cloud.saved===false){apply(TalentAccountMerge(sentBase,snapshot(),cloud.data));base=copy(cloud.data);revision=cloud.revision;pending();continue;}
    if(cloud.saved!==true)throw Error('Save failed');
    base=copy(cloud.data);revision=cloud.revision;write(cloudKey,cloud);
    if(same(sent,snapshot())){apply(cloud.data);dirty=false;status='saved';try{localStorage.removeItem(pendingKey);}catch{}break;}
    pending();
   }
   if(dirty)throw Error('Please retry');
   if(importFor===boot.id){try{sessionStorage.removeItem(importKey);}catch{}importFor=null;}
  }catch(e){status=expired(e)?'expired':'error';pending();}
  finally{busy=false;paint();if((dirty||needsLoad)&&status!=='expired'&&!blocked)timer=setTimeout(flush,15000);}
 }
 async function logout(){
  if(busy||blocked)return;
  await flush();
  if(dirty){toast(t('გასვლამდე დაელოდე პროგრესის შენახვას ან ჩამოტვირთე სარეზერვო ასლი.','Wait for progress to save, or download a backup before signing out.'));return;}
  try{signingOut=true;await store.signOut();try{localStorage.removeItem(KEY);localStorage.removeItem(PRACTICE_KEY);localStorage.removeItem(cloudKey);localStorage.removeItem(pendingKey);}catch{}location.reload();}
  catch{signingOut=false;toast(t('გასვლა ვერ შესრულდა. სცადე ხელახლა.','Could not sign out. Please retry.'));}
 }
 function hasProgress(data){const s=data.state,p=data.practice;return !!(Object.keys(s.passed||{}).length||Object.keys(s.read||{}).length||Object.keys(s.notes||{}).length||s.bookmarks?.length||s.custom?.length||s.placement||Object.keys(s.mission?.notes||{}).length||s.mission?.checks?.length||p.selected?.length||Object.keys(p.notes||{}).length||p.history?.length);}
 function offerImport(){
  if(!boot)return;
  let incoming;try{incoming=JSON.parse(sessionStorage.getItem(importKey));}catch{}
  if(!incoming)return;
  if(!valid(incoming.data)||Date.now()-incoming.at>86400000||!Number.isFinite(incoming.at)){sessionStorage.removeItem(importKey);return;}
  if(incoming.accountId){
   if(incoming.accountId!==boot.id)return;
   // Resume a confirmed import even if the page closed before its cache write.
   apply(TalentAccountMerge(blank(),snapshot(),incoming.data));
   if(!same(snapshot(),base)){importFor=boot.id;mark();}
   else sessionStorage.removeItem(importKey);
   return;
  }
  if(!hasProgress(incoming.data)){sessionStorage.removeItem(importKey);return;}
  const dialog=document.createElement('dialog');dialog.className='panel';dialog.style.cssText='max-width:520px;width:calc(100% - 40px);color:var(--ink);background:var(--white);border:1px solid var(--line);';
  dialog.innerHTML='<h2>'+t('გადავიტანოთ შენი პროგრესი?','Import your progress?')+'</h2><p>'+t('ამ ბრაუზერში სტუმრად დაგროვებული პროგრესი შეგიძლია დაამატო ამ ანგარიშს:','You can add the guest progress from this browser to this account:')+'</p><p data-user-content><strong>'+esc(boot.email)+'</strong></p><p>'+t('ანგარიშში არსებული ჩანაწერები შენარჩუნდება.','Your existing account notes will be kept.')+'</p><div class="inline-actions"><button class="btn" id="account-import-yes">'+t('პროგრესის დამატება','Import progress')+'</button><button class="btn secondary" id="account-import-no">'+t('ახლა არა','Not now')+'</button></div>';
  document.body.appendChild(dialog);
  const close=()=>{dialog.close?.();dialog.remove();};
  dialog.querySelector('#account-import-yes').onclick=()=>{
   if(blocked)return;
   incoming.accountId=boot.id;try{sessionStorage.setItem(importKey,JSON.stringify(incoming));}catch{}
   apply(TalentAccountMerge(blank(),snapshot(),incoming.data));importFor=boot.id;mark();close();render();flush();
  };
  const skip=()=>{sessionStorage.removeItem(importKey);close();};
  dialog.querySelector('#account-import-no').onclick=skip;
  dialog.addEventListener('cancel',skip);
  if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');
 }
 const oldRender=render;render=function(){const result=oldRender();paint();return result;};
 const subscription=store.client.auth.onAuthStateChange((event,session)=>{
  if(signingOut||event==='INITIAL_SESSION')return;
  const expected=boot?.id||null,next=session?.user?.id||null;
  if(expected===next)return;
  // The callback is synchronous and contains no Supabase calls. Stop writes
  // immediately, then reload into the new account's own storage namespace.
  blocked=true;clearTimeout(timer);if(boot&&dirty)pending();
  main.inert=true;
  setTimeout(()=>location.reload(),0);
 });
 window.addEventListener('online',flush);
 window.addEventListener('beforeunload',e=>{if(boot&&dirty){pending();e.preventDefault();e.returnValue='';}});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();});
 window.TalentAccount={flush,login,logout,getStatus:()=>({status,dirty,revision,needsLoad,blocked}),dispose:()=>subscription.data.subscription.unsubscribe()};
 if(boot){dirty=!same(snapshot(),base);status=needsLoad?'error':dirty?'pending':'saved';if(dirty)pending();}
 paint();render();offerImport();
 if(window.TalentOAuthError)toast(t('Google-ით შესვლა ვერ დასრულდა. სცადე ხელახლა.','Google sign-in could not finish. Please retry.'));
 if(dirty&&!needsLoad)flush();
})();
