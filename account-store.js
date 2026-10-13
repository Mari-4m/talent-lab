/* Supabase adapter: server-verified identity and per-account revision guard. */
function createAccountStore(createClient, config) {
  const url = new URL(config.url);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co')) throw Error('Invalid Supabase project URL');
  const key = config.publishableKey;
  if (typeof key !== 'string' || !key.startsWith('sb_publishable_')) throw Error('Use the project publishable key, never a secret key');
  const callback = new URL(config.redirectTo);
  if (callback.protocol !== 'https:' || callback.hash || callback.search) throw Error('Use the exact HTTPS learning page as the callback');
  const client = createClient(url.origin, key, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    global: { fetch: (input, init) => fetch(input, {...init, signal:init?.signal || AbortSignal.timeout(20000)}) }
  });
  async function currentUser() {
    const {data, error} = await client.auth.getUser();
    if (error) throw error;
    if (!data.user) throw Object.assign(Error('Sign in required'), {code:'session_not_found'});
    return data.user;
  }
  async function requireUser(expected) {
    const user = await currentUser();
    if (user.id !== expected) throw Object.assign(Error('Account changed; sign in again'), {code:'account_changed'});
    return user;
  }
  return {
    client,
    currentUser,
    async signIn() {
      const {error} = await client.auth.signInWithOAuth({provider: 'google', options: {redirectTo: callback.href}});
      if (error) throw error;
    },
    async load(expected) {
      await requireUser(expected);
      const {data, error} = await client.from('talent_lab_progress')
        .select('document,revision,updated_at').eq('user_id', expected).maybeSingle();
      if (error) throw error;
      return data ? {data:data.document, revision:data.revision, updatedAt:data.updated_at} : null;
    },
    async save(expected, revision, document) {
      await requireUser(expected);
      const {data,error} = await client.rpc('talent_lab_save_progress', {
        p_account: expected, p_revision: revision, p_document: document
      });
      if (error) throw error;
      return data; // saved=false returns the remote revision for three-way merge.
    },
    async signOut() {
      const {error} = await client.auth.signOut({scope:'local'});
      if(error) throw error;
    }
  };
}
