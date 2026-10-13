// Learner records are private to the stable, dispatch-verified Site user ID.
const emptyLearner=()=>({state:{passed:{},read:{},notes:{},bookmarks:[],custom:[],last:null,placement:null,mission:{notes:{},checks:[]}},practice:{selected:[],notes:{},history:[]}});
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
function learnerDocument(input){
 if(!plain(input)||!plain(input.state)||!plain(input.practice))throw {status:400,message:'Invalid progress'};
 const out=emptyLearner(),s=input.state,p=input.practice;
 const strings=(x,n=500)=>Array.isArray(x)?[...new Set(x.filter(v=>typeof v==='string'&&v.length<=200))].slice(0,n):[];
 const notes=x=>Object.fromEntries(Object.entries(plain(x)?x:{}).filter(([k,v])=>!['__proto__','constructor','prototype'].includes(k)&&k.length<=200&&typeof v==='string'&&v.length<=20000).slice(0,300));
 for(const id of LESSON_IDS){if(s.passed?.[id]>=100)out.state.passed[id]=100;if(s.read?.[id])out.state.read[id]=true;}
 out.state.notes=notes(s.notes);out.state.bookmarks=strings(s.bookmarks);out.state.last=LESSON_IDS.includes(s.last)?s.last:null;
 out.state.custom=(Array.isArray(s.custom)?s.custom:[]).filter(r=>plain(r)&&typeof r.id==='string'&&typeof r.title==='string'&&typeof r.url==='string'&&/^https?:\/\//i.test(r.url)).slice(0,100).map(r=>({id:r.id.slice(0,100),title:r.title.slice(0,500),url:r.url.slice(0,3000),category:typeof r.category==='string'?r.category.slice(0,100):'',access:typeof r.access==='string'?r.access.slice(0,100):'',provider:String(r.provider||'').slice(0,500),description:String(r.description||'').slice(0,5000),type:String(r.type||'').slice(0,100),language:String(r.language||'').slice(0,100)}));
 if(Number.isInteger(s.placement?.score)&&s.placement.score>=0&&s.placement.score<=6)out.state.placement={score:s.placement.score};
 out.state.mission={notes:notes(s.mission?.notes),checks:strings(s.mission?.checks,100)};
 out.practice.selected=strings(p.selected,100);out.practice.notes=notes(p.notes);
 out.practice.history=(Array.isArray(p.history)?p.history:[]).filter(r=>plain(r)&&Number.isInteger(r.score)&&Number.isInteger(r.total)&&r.total>=1&&r.total<=100&&r.score>=0&&r.score<=r.total&&typeof r.date==='string'&&Number.isFinite(Date.parse(r.date))).slice(-30).map(r=>({title:String(r.title||'').slice(0,500),score:r.score,total:r.total,date:r.date.slice(0,40)}));
 if(JSON.stringify(out).length>200000)throw {status:413,message:'Progress is too large'};return out;
}
async function learnerRecord(env,id){
 const row=await env.DB.prepare('SELECT document,revision,updated_at FROM learner_accounts WHERE user_id=?').bind(id).first();
 return row?{data:JSON.parse(row.document),revision:row.revision,updatedAt:row.updated_at}:{data:emptyLearner(),revision:0,updatedAt:null};
}
async function hashCode(code){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
function learnerHtml(html){return new Response(html,{headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"}});}
function learnerLogin(en){return learnerHtml(`<!doctype html><html lang="${en?'en':'ka'}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Talent Lab | ${en?'Sign in':'შესვლა'}</title><link rel="stylesheet" href="/learn/style.css"><body><main style="max-width:650px;margin:10vh auto;padding:24px"><section class="panel"><h1>Talent Lab</h1><p>${en?'Sign in with ChatGPT to save your learning progress and continue on another device.':'შედი ChatGPT ანგარიშით, შეინახე სწავლის პროგრესი და გააგრძელე სხვა მოწყობილობიდანაც.'}</p><a class="btn" target="_top" href="/signin-with-chatgpt?return_to=${encodeURIComponent('/learn/?lang='+(en?'en':'ka'))}">${en?'Sign in with ChatGPT':'ChatGPT ანგარიშით შესვლა'}</a><p class="note">${en?'Your progress and learning notes will be private to your account.':'შენი პროგრესი და სასწავლო ჩანაწერები მხოლოდ შენს ანგარიშში იქნება ხელმისაწვდომი.'}</p><a href="https://mari-4m.github.io/talent-lab/">${en?'Continue as a guest':'გაგრძელება სტუმრად'}</a></section></main><script>const p=new URLSearchParams(location.hash.slice(1));if(/^[a-f0-9]{64}$/.test(p.get('import')||'')){sessionStorage.setItem('talentlab.import',p.get('import'));history.replaceState(null,'',location.pathname+location.search);}try{document.documentElement.dataset.theme=localStorage.getItem('talentlab.theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');}catch{}</script></body></html>`);}
async function learnerRoutes(request,env,ctx){
 const url=new URL(request.url),path=url.pathname,origin=request.headers.get('Origin'),id=request.headers.get('oai-authenticated-user-id');
 if(path==='/api/learner/handoff'){
  const cross=cors(request,env);if(!cross||!origin)return json({error:'Origin not allowed'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cross});
  if(request.method!=='POST')return json({error:'Method not allowed'},405,cross);
  try{if(!await limit(env,'handoff:'+await abuseKey(request,env),10,3600000))return json({error:'Try again later'},429,cross);
   const data=learnerDocument(await body(request,250000)),code=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join('');
   await env.DB.prepare('INSERT INTO learner_handoffs(code_hash,document,expires_at) VALUES(?,?,?)').bind(await hashCode(code),JSON.stringify(data),Date.now()+30*60000).run();
   ctx.waitUntil(env.DB.prepare('DELETE FROM learner_handoffs WHERE expires_at<?').bind(Date.now()).run());return json({code},200,cross);
  }catch(e){return json({error:e.message||'Please try again'},e.status||503,cross);}
 }
 if(path.startsWith('/api/learner/')){
  if(!id)return json({error:'Sign in required'},401);
  if(request.method==='POST'&&origin!==url.origin)return json({error:'Same-origin request required'},403);
  if(path==='/api/learner/progress'&&request.method==='GET')return json(await learnerRecord(env,id));
  if(path==='/api/learner/progress'&&request.method==='POST'){
   if(!await limit(env,'learner:'+id,120))return json({error:'Try again later'},429);
   const b=await body(request,250000);if(b.accountId!==id)return json({error:'Account changed; sign in again'},401);if(!Number.isInteger(b.revision)||b.revision<0)return json({error:'Invalid revision'},400);
   const doc=learnerDocument(b.data),now=Date.now();
   await env.DB.prepare('INSERT OR IGNORE INTO learner_accounts(user_id,document,revision,updated_at) VALUES(?,?,0,?)').bind(id,JSON.stringify(emptyLearner()),now).run();
   const saved=await env.DB.prepare('UPDATE learner_accounts SET document=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=? RETURNING revision').bind(JSON.stringify(doc),now,id,b.revision).first();
   if(!saved)return json(await learnerRecord(env,id),409);return json({revision:saved.revision,updatedAt:now,data:doc});
  }
  if(path==='/api/learner/import'&&request.method==='POST'){
   const b=await body(request,1024);if(b.accountId!==id)return json({error:'Account changed'},401);if(!/^[a-f0-9]{64}$/.test(b.code||''))return json({error:'Invalid transfer'},400);
   // Read until successfully saved; acknowledgement deletes it. Network failures
   // must not consume a learner's only migration copy.
   const row=await env.DB.prepare('UPDATE learner_handoffs SET claimed_by=? WHERE code_hash=? AND expires_at>? AND (claimed_by IS NULL OR claimed_by=?) RETURNING document').bind(id,await hashCode(b.code),Date.now(),id).first();
   return row?json({data:JSON.parse(row.document)}):json({error:'Transfer expired; return to the original page and sign in again.'},410);
  }
  if(path==='/api/learner/import/complete'&&request.method==='POST'){
   const b=await body(request,1024);if(b.accountId!==id)return json({error:'Account changed'},401);if(/^[a-f0-9]{64}$/.test(b.code||''))await env.DB.prepare('DELETE FROM learner_handoffs WHERE code_hash=? AND claimed_by=?').bind(await hashCode(b.code),id).run();return json({ok:true});
  }
  return json({error:'Not found'},404);
 }
 if(path==='/learn')return Response.redirect(url.origin+'/learn/'+url.search,302);
 if(path.startsWith('/learn/')){
  const name=path.slice(7)||'index.html';if(!Object.hasOwn(LEARNER_ASSETS,name))return json({error:'Not found'},404);
  if(name==='index.html'){
   const en=url.searchParams.get('lang')==='en';if(!id)return learnerLogin(en);
   const boot={id,email:request.headers.get('oai-authenticated-user-email')||'',...await learnerRecord(env,id)};
   const serialized=JSON.stringify(boot).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
   return learnerHtml(LEARNER_ASSETS[name].replace('<head>','<head><script>window.__LEARNER='+serialized+';try{const lang=new URLSearchParams(location.search).get("lang");if(lang==="en"||lang==="ka")localStorage.setItem("talentlab.language",lang);}catch{}</script>'));
  }
  return new Response(LEARNER_ASSETS[name],{headers:{'Content-Type':name.endsWith('.js')?'text/javascript;charset=utf-8':'text/css;charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});
 }
 return null;
}
