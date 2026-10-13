/* Shared three-way merge: preserve independent device edits, prefer the current
   device only for the same field, and retain completed lessons on conflicts. */
(function(root){
  const clone=x=>JSON.parse(JSON.stringify(x));
  const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  function merge(base,local,remote,path=''){
    if(equal(local,base))return remote===undefined?undefined:clone(remote);
    if(equal(remote,base)||equal(local,remote))return local===undefined?undefined:clone(local);
    if(Array.isArray(local)&&Array.isArray(remote)){
      const prior=Array.isArray(base)?base:[],removed=new Set(prior.filter(x=>!local.some(y=>equal(x,y))).map(JSON.stringify));
      const all=[...remote.filter(x=>!removed.has(JSON.stringify(x))),...local.filter(x=>!prior.some(y=>equal(x,y)))];
      const unique=[...new Map(all.map(x=>[JSON.stringify(x),x])).values()];
      return path==='practice.history'?unique.sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-30):unique;
    }
    if(object(local)&&object(remote)){
      const out={};for(const k of new Set([...Object.keys(base||{}),...Object.keys(local),...Object.keys(remote)])){
        if(['__proto__','constructor','prototype'].includes(k))continue;
        const v=path==='state.passed'?Math.max(local[k]||0,remote[k]||0):merge(base?.[k],local[k],remote[k],path?path+'.'+k:k);
        if(v!==undefined)out[k]=v;
      }return out;
    }
    return local===undefined?undefined:clone(local);
  }
  root.TalentAccountMerge=merge;
})(globalThis);
