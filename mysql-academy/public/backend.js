/* Camada de dados remota: contas de aluno, sincronização do progresso e classificação.
   - Supabase, quando configurado em config.js (publicação como site estático);
   - caso contrário, o servidor Node do projeto (npm start).
   Sem nenhum dos dois a app continua a funcionar, com o progresso guardado só no browser. */
(function (root) {
  const cfg = root.APP_CONFIG || {};
  const here = () => location.origin + location.pathname;
  const summaryOf = (s) => ({ xp: s.xp, week_xp: s.weekXp, level: s.level, pct: s.pct, ex_done: s.exDone, chapters_done: s.chaptersDone.length, streak: s.streak, badges: s.badges.length });
  const cleanTurma = (t) => String(t || '').trim().replace(/\s+/g, ' ').slice(0, 30);

  /* ---------- Supabase ---------- */
  const SB_ERRORS = [
    [/invalid login credentials/i, 'Email ou palavra-passe incorretos.'],
    [/already (been )?registered/i, 'Já existe uma conta com este email. Inicie sessão.'],
    [/email not confirmed/i, 'Ainda não confirmou o email. Abra a mensagem que recebeu e clique no link de confirmação.'],
    [/password should|weak password|at least 6/i, 'A palavra-passe deve ter pelo menos 6 caracteres.'],
    [/rate limit|too many|security purposes/i, 'Demasiados pedidos seguidos. Aguarde alguns minutos e tente novamente.'],
    [/unable to validate email|invalid.*email|email.*invalid/i, 'Endereço de email inválido.'],
    [/database error saving new user|duplicate key/i, 'Esse nome já está a ser usado. Escolha outro.'],
    [/failed to fetch|networkerror|load failed/i, 'Sem ligação à Internet ou ao Supabase. Tente mais tarde.'],
  ];
  function supabaseBackend() {
    const sb = root.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    const B = { kind: 'supabase', user: null, recovery: /type=recovery/.test(location.hash) };
    // Regista já o ouvinte para não perder o evento do link de recuperação da palavra-passe.
    sb.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') { B.recovery = true; if (B.onRecovery) B.onRecovery(); }
      if (event === 'SIGNED_OUT') B.user = null;
    });
    async function loadUser(session) {
      if (!session) { B.user = null; return null; }
      const { data, error } = await sb.from('profiles').select('name, is_teacher, is_admin, turma').eq('id', session.user.id).single();
      if (error) throw error;
      B.user = { id: session.user.id, email: session.user.email, name: data.name, teacher: !!data.is_teacher, admin: !!data.is_admin, turma: data.turma || '' };
      return B.user;
    }
    B.init = async () => {
      const { data } = await sb.auth.getSession();
      try { return await loadUser(data.session); } catch { return null; }
    };
    B.register = async ({ name, email, password, turma }) => {
      const { data: free, error: e1 } = await sb.rpc('name_available', { n: name });
      if (e1) throw e1;
      if (!free) throw new Error('Esse nome já está a ser usado. Escolha outro.');
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name, turma: cleanTurma(turma) }, emailRedirectTo: here() } });
      if (error) throw error;
      if (!data.session) return { needsConfirm: true };
      return { user: await loadUser(data.session) };
    };
    B.login = async ({ email, password }) => {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return loadUser(data.session);
    };
    B.logout = async () => { await sb.auth.signOut({ scope: 'local' }); B.user = null; };
    B.resetPassword = async (email) => { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: here() }); if (error) throw error; };
    B.updatePassword = async (password) => { const { error } = await sb.auth.updateUser({ password }); if (error) throw error; B.recovery = false; };
    B.load = async () => {
      if (!B.user) return null;
      const { data, error } = await sb.from('progress').select('state').eq('user_id', B.user.id).maybeSingle();
      if (error) throw error;
      return data ? data.state : null;
    };
    B.save = async (state, summary) => {
      if (!B.user) return;
      const { error } = await sb.from('progress').upsert({ user_id: B.user.id, state, ...summaryOf(summary) });
      if (error) throw error;
    };
    B.setTurma = async (turma) => {
      if (!B.user) return;
      const t = cleanTurma(turma);
      const { error } = await sb.from('profiles').update({ turma: t || null }).eq('id', B.user.id);
      if (error) throw error;
      B.user.turma = t;
    };
    // Definições do site (capítulos ocultos aos alunos): todos leem, só o gestor altera.
    B.settings = async () => {
      const { data, error } = await sb.from('settings').select('hidden_chapters').eq('id', 1).maybeSingle();
      if (error) throw error;
      return { hidden: (data && data.hidden_chapters) || [] };
    };
    B.setHiddenChapters = async (ids) => {
      const { data, error } = await sb.rpc('set_hidden_chapters', { ids });
      if (error) throw error;
      if (!data) throw new Error('Só o gestor do site pode alterar os capítulos visíveis.');
    };
    // Gestor do site: lista de contas e atribuição do perfil de professor.
    B.adminUsers = async () => {
      const { data, error } = await sb.rpc('admin_users');
      if (error) throw error;
      return data;
    };
    B.setTeacher = async (id, teacher) => {
      const { data, error } = await sb.rpc('set_teacher', { target: id, make_teacher: teacher });
      if (error) throw error;
      if (!data) throw new Error('Não foi possível alterar o perfil desta conta.');
    };
    B.leaderboard = async () => {
      const { data, error } = await sb.rpc('leaderboard2', { lim: 300 });
      if (error) throw error;
      return data.map((r) => ({ name: r.name, xp: r.xp, weekXp: r.week_xp || 0, turma: r.turma || '', level: r.level, pct: r.pct, streak: r.streak }));
    };
    B.students = async () => {
      const { data, error } = await sb.from('progress').select('state, updated_at, profiles(name, is_teacher, turma)');
      if (error) throw error;
      return data.filter((r) => r.profiles && !r.profiles.is_teacher).map((r) => ({ name: r.profiles.name, turma: r.profiles.turma || '', state: r.state || {}, updated: Date.parse(r.updated_at) }));
    };
    B.errorText = (e) => { const m = String((e && e.message) || e); const hit = SB_ERRORS.find(([re]) => re.test(m)); return hit ? hit[1] : m; };
    return B;
  }

  /* ---------- servidor Node do projeto (npm start) ---------- */
  function serverBackend() {
    const KEY = 'mysql-academy.auth';
    let auth = {};
    try { auth = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* sem storage */ }
    const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(auth)); } catch { /* ignorar */ } };
    async function api(path, method, data, headers = {}) {
      const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json', ...(auth.token ? { Authorization: 'Bearer ' + auth.token } : {}), ...headers }, body: data ? JSON.stringify(data) : undefined });
      const j = await r.json().catch(() => ({}));
      // Site publicado sem servidor (ex.: Vercel, Cloudflare Pages) e sem Supabase configurado.
      if (!r.ok && !j.error && [404, 405, 501].includes(r.status)) throw Object.assign(new Error('As contas e a classificação ainda não estão ativas neste site.'), { status: r.status });
      if (!r.ok) throw Object.assign(new Error(j.error || 'Erro de rede'), { status: r.status });
      return j;
    }
    const B = { kind: 'server', user: null };
    const enter = (j) => { auth = { token: j.token, name: j.name, turma: j.turma || '' }; keep(); B.user = { name: j.name, teacher: false, turma: auth.turma }; return B.user; };
    B.init = async () => (auth.token ? (B.user = { name: auth.name, teacher: false, turma: auth.turma || '' }) : null);
    B.register = async ({ name, password, state, turma }) => ({ user: enter(await api('/api/register', 'POST', { name, pin: password, state, turma: cleanTurma(turma) })) });
    B.settings = async () => ({ hidden: [] }); // no servidor local todos os capítulos estão visíveis
    B.setTurma = async (turma) => { const j = await api('/api/turma', 'PUT', { turma: cleanTurma(turma) }); auth.turma = j.turma; keep(); if (B.user) B.user.turma = j.turma; };
    B.login = async ({ name, password }) => enter(await api('/api/login', 'POST', { name, pin: password }));
    B.logout = async () => { auth = {}; keep(); B.user = null; };
    B.load = async () => {
      if (!B.user) return null;
      try { return (await api('/api/progress', 'GET')).state; } catch (e) { if (e.status === 401) await B.logout(); throw e; }
    };
    B.save = async (state) => { if (B.user) await api('/api/progress', 'PUT', { state }); };
    B.leaderboard = async () => (await api('/api/leaderboard', 'GET')).map((r) => ({ name: r.name, xp: r.xp, weekXp: r.weekXp || 0, turma: r.turma || '', level: r.level, pct: r.pct, streak: r.streak }));
    B.students = async (key) => (await api('/api/admin/students', 'GET', null, { 'x-teacher-key': key })).map((r) => ({ name: r.name, turma: r.turma || '', state: r.state || {}, updated: r.updated }));
    B.errorText = (e) => (e && e.status ? e.message : 'Servidor indisponível. Execute "npm start" para ativar as contas e a classificação.');
    return B;
  }

  root.BACKEND = cfg.supabaseUrl && cfg.supabaseAnonKey && root.supabase ? supabaseBackend() : serverBackend();
})(window);
