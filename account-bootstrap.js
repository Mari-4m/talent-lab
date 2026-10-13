/* Resolve the account before loading the learning application. Guest data is
   never used as an authenticated learner's initial state. */
(function () {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const blank = () => ({state:{passed:{},read:{},notes:{},bookmarks:[],custom:[],last:null,placement:null,mission:{notes:{},checks:[]}},practice:{selected:[],notes:{},history:[]}});
  const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  const valid = data => data && typeof data.state === 'object' && data.state && !Array.isArray(data.state) && data.practice && typeof data.practice === 'object' && !Array.isArray(data.practice);
  window.TalentAccountBoot = {blank, copy, read, valid};
  window.TalentAccountReady = (async () => {
    const store = createAccountStore(supabase.createClient, window.TALENT_SUPABASE);
    window.TalentAccountStore = store;
    const {data:sessionData, error:sessionError} = await store.client.auth.getSession();
    if (sessionError) throw sessionError;
    const session = sessionData.session;
    const params = new URLSearchParams(location.search);
    const callbackError = params.has('error') || new URLSearchParams(location.hash.slice(1)).has('error');
    window.TalentOAuthError = callbackError;
    if (!session) return;
    let user = session.user, loadError = null, remote = null;
    try { user = await store.currentUser(); remote = await store.load(user.id); }
    catch (error) { loadError = error; }
    if (!user?.id) throw Error('Sign in required');
    const prefix = 'talentlab.google.' + encodeURIComponent(user.id);
    const cache = read(prefix + '.cloud');
    const prior = remote || (cache && valid(cache.data) ? cache : {data:blank(), revision:0, updatedAt:null});
    if (!valid(prior.data) || !Number.isSafeInteger(prior.revision) || prior.revision < 0) throw Error('Invalid saved progress');
    const pending = read(prefix + '.pending');
    const restored = pending && valid(pending.data) && valid(pending.base)
      ? TalentAccountMerge(pending.base, pending.data, prior.data) : prior.data;
    window.accountStoragePrefix = prefix;
    window.accountInitialData = copy(restored);
    window.__LEARNER = {id:user.id, email:user.email || '', data:copy(prior.data), revision:prior.revision, loadError};
    try {
      localStorage.setItem(prefix + '.state', JSON.stringify(restored.state));
      localStorage.setItem(prefix + '.practice', JSON.stringify(restored.practice));
      if (remote) localStorage.setItem(prefix + '.cloud', JSON.stringify(remote));
    } catch {}
  })();
})();
