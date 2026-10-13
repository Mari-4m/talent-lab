(function(){
 'use strict';
 const BASE='https://talent-lab-analytics.m-khuroshvili627536.chatgpt.site',boot=window.__LEARNER;
 const t=(ka,en)=>currentLanguage==='en'?en:ka;
 const snapshot=()=>JSON.parse(JSON.stringify({state,practice:practiceState}));
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 let status=boot?'loading':'guest',busy=false,dirty=false,timer,base=boot?.data,revision=boot?.revision,importCode=null,importLoaded=false,importError=false;
 const pendingKey=window.accountStoragePrefix+'.pending';
 const originalSave=save,originalPractice=savePractice;
 function pending(){if(!boot)return;try{localStorage.setItem(pendingKey,JSON.stringify({base,data:snapshot()}));}catch{} }
 function mark(){if(!boot)return;dirty=true;status='pending';pending();paint();clearTimeout(timer);timer=setTimeout(flush,800);}
 save=function(){const ok=originalSave();mark();return ok;};savePractice=function(){const ok=originalPractice();mark();return ok;};
 function apply(data){const copy=JSON.parse(JSON.stringify(data));state=copy.state;practiceState=copy.practice;originalSave();originalPractice();}
 function paint(){
  let box=document.getElementById('learner-account');if(!box){box=document.createElement('div');box.id='learner-account';box.style.cssText='display:flex;align-items:center;gap:7px;flex-wrap:wrap;font-size:11px';document.querySelector('.top-right').prepend(box);}
  if(!boot){box.innerHTML='<button class="display-button" id="learner-login" type="button">'+t('შესვლა','Sign in')+'</button>';box.querySelector('button').onclick=login;return;}
  const labels={loading:t('პროგრესი იტვირთება…','Loading progress…'),saved:t('პროგრესი შენახულია ✓','Progress saved ✓'),pending:t('ინახება…','Saving…'),error:t('ჯერ არ სინქრონიზებულა','Not synced yet'),expired:t('ხელახლა შედი ანგარიშში','Sign in again')};
  box.innerHTML='<span title="'+esc(boot.email)+'">'+esc(t('ჩემი ანგარიში','My account'))+'</span><span role="status" aria-live="polite">'+(importError?t('პროგრესის გადატანა ვერ დასრულდა','Progress transfer incomplete'):labels[status])+'</span>'+((importError||['error','expired'].includes(status))?'<button class="display-button" id="learner-retry">'+t('ხელახლა ცდა','Retry')+'</button>':'')+'<a class="display-button" id="learner-signout" href="/signout-with-chatgpt?return_to=%2Flearn%2F" target="_top">'+t('გასვლა','Sign out')+'</a>';
  box.querySelector('#learner-retry')?.addEventListener('click',()=>status==='expired'?location.assign('/signin-with-chatgpt?return_to=%2Flearn%2F'):importError?initialize():flush());
  box.querySelector('#learner-signout').onclick=async e=>{e.preventDefault();const href=e.currentTarget.href;if(busy)return;await flush();if(dirty){toast(t('გასვლამდე დაელოდე პროგრესის შენახვას ან ხელახლა სცადე.','Wait for progress to save or retry before signing out.'));return;}try{localStorage.removeItem(pendingKey);localStorage.removeItem(KEY);localStorage.removeItem(PRACTICE_KEY);}catch{}location.assign(href);};
  const footer=document.querySelector('footer>span');if(footer)footer.textContent=t('შესვლის შემდეგ პროგრესი შენს ანგარიშში ინახება.','When signed in, progress is saved to your account.');
 }
 async function login(){
  const button=document.getElementById('learner-login');button.disabled=true;
  try{
   const r=await fetch(BASE+'/api/learner/handoff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(snapshot())});if(!r.ok)throw Error();
   const {code}=await r.json();location.assign(BASE+'/learn/?lang='+currentLanguage+'#import='+code);
  }catch{button.disabled=false;toast(t('შესვლა ვერ დაიწყო. შენი პროგრესი აქ შენახულია. სცადე ხელახლა.','Could not start sign-in. Your progress remains here. Please retry.'));}
 }
 async function request(path,body){const r=await fetch('/api/learner/'+path,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({...body,accountId:boot.id})});if(r.status===401){status='expired';throw Error('expired');}return r;}
 async function flush(){
  if(!boot||busy||!dirty)return;busy=true;status='pending';paint();
  try{
   for(let attempt=0;attempt<4;attempt++){
    const sent=snapshot(),sentBase=base;
    const r=await request('progress',{revision,data:sent});
    if(r.status===409){const remote=await r.json();apply(TalentAccountMerge(sentBase,snapshot(),remote.data));base=remote.data;revision=remote.revision;pending();continue;}
    if(!r.ok)throw Error('save');const cloud=await r.json();base=cloud.data;revision=cloud.revision;
    if(same(sent,snapshot())){apply(cloud.data);dirty=false;status='saved';try{localStorage.removeItem(pendingKey);}catch{}break;}
    pending();
   }
   if(dirty)throw Error('retry');
   if(importCode&&importLoaded){const code=importCode;const r=await request('import/complete',{code});if(r.ok){importCode=null;sessionStorage.removeItem('talentlab.import');}}
  }catch(e){if(status!=='expired')status='error';pending();}
  finally{busy=false;paint();if(dirty&&status!=='expired')timer=setTimeout(flush,15000);}
 }
 async function initialize(){
  if(!boot){paint();return;}
  dirty=!same(snapshot(),base);status=dirty?'pending':'saved';
  const params=new URLSearchParams(location.hash.slice(1));
  try{if(/^[a-f0-9]{64}$/.test(params.get('import')||'')){sessionStorage.setItem('talentlab.import',params.get('import'));history.replaceState(null,'',location.pathname+location.search+'#home');}importCode=sessionStorage.getItem('talentlab.import');}catch{}
  if(importCode){
   try{const r=await request('import',{code:importCode});if(!r.ok)throw Error();const incoming=(await r.json()).data;importLoaded=true;importError=false;
    // Import guest achievements and notes without overwriting existing account
    // notes; empty guest values never erase a learner's existing progress.
    const blank={state:emptyState(),practice:{selected:[],notes:{},history:[]}};
    const merged=TalentAccountMerge(blank,snapshot(),incoming);apply(merged);dirty=true;pending();
    
   }catch{importError=true;status='error';toast(t('პროგრესის გადატანა ვერ შესრულდა. დაბრუნდი თავდაპირველ გვერდზე და ხელახლა შედი.','Progress transfer failed. Return to the original page and sign in again.'));}
  }
  paint();render();if(dirty)await flush();
 }
 const oldRender=render;render=function(){const result=oldRender();paint();return result;};
 window.addEventListener('online',flush);
 window.addEventListener('beforeunload',e=>{if(boot&&dirty){pending();e.preventDefault();e.returnValue='';}});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();});
 // Reconcile the next write against the latest server revision. Local caches
 // are always namespaced by user, never treated as authentication.
 window.TalentAccount={flush,getStatus:()=>({status,dirty,revision})};
 initialize();
})();
