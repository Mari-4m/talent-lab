(function(){
  const boot=window.__LEARNER;if(!boot)return;
  const prefix='talentlab.account.'+encodeURIComponent(boot.id);
  window.accountStoragePrefix=prefix;
  let local;try{local=JSON.parse(localStorage.getItem(prefix+'.pending'));}catch{}
  const data=local?TalentAccountMerge(local.base,local.data,boot.data):boot.data;
  window.accountInitialData=JSON.parse(JSON.stringify(data));
  // Account-specific keys prevent a second user inheriting this browser's data.
  try{localStorage.setItem(prefix+'.state',JSON.stringify(data.state));localStorage.setItem(prefix+'.practice',JSON.stringify(data.practice));}catch{}
})();
