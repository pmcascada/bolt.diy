(function () {
'use strict';
const { CHAPTERS, BADGES, PASS_MARK } = window.CONTENT;
const S = window.SCORE;
const D = window.SQLDB;
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- ícones (traço, 24×24) ---------- */
const P = {
  home: 'M3 10.5 12 3l9 7.5V21h-6v-7H9v7H3z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  terminal: 'M4 17l6-5-6-5 M12 19h8',
  chart: 'M3 3v18h18 M8 17v-5 M13 17V8 M18 17v-8',
  trophy: 'M8 21h8 M12 17v4 M7 4h10v5a5 5 0 0 1-10 0z M17 5h3v2a3 3 0 0 1-3 3 M7 5H4v2a3 3 0 0 0 3 3',
  user: 'M20 21a8 8 0 0 0-16 0 M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  compass: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z',
  table: 'M3 4h18v16H3z M3 10h18 M3 15h18 M9 4v16',
  edit: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M21 21l-4.3-4.3',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
  archive: 'M3 4h18v4H3z M5 8v12h14V8 M10 12h4',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18 M6 6l12 12',
  bulb: 'M9 18h6 M10 22h4 M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z',
  play: 'M7 4.5v15l12-7.5z',
  copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  download: 'M12 3v12 M7 10l5 5 5-5 M5 21h14',
  refresh: 'M21 12a9 9 0 1 1-3-6.7L21 8 M21 3v5h-5',
  logout: 'M9 21H5V3h4 M16 17l5-5-5-5 M21 12H9',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2 M12 21v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M1 12h2 M21 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4',
  trash: 'M3 6h18 M8 6V4h8v2 M6 6l1 14h10l1-14',
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.3.3 1.3 1.2 2.8 2.5 2.8z',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  award: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M8.2 13.9 7 22l5-3 5 3-1.2-8.1',
  zap: 'M13 2 3 14h9l-1 8 10-12h-9z',
  hash: 'M4 9h16 M4 15h16 M10 3 8 21 M16 3l-2 18',
  cpu: 'M6 6h12v12H6z M10 10h4v4h-4z M9 2v4 M15 2v4 M9 18v4 M15 18v4 M2 9h4 M2 15h4 M18 9h4 M18 15h4',
  chevR: 'M9 18l6-6-6-6', chevL: 'M15 18l-6-6 6-6',
  alert: 'M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01',
  circle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  checkCircle: 'M22 11v1a10 10 0 1 1-5.9-9.1 M22 4 12 14l-3-3',
  lock: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
  reset: 'M3 12a9 9 0 1 0 3-6.7L3 8 M3 3v5h5',
  layers: 'M12 2 2 7l10 5 10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  clipboard: 'M9 2h6v4H9z M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3 M9 13l2 2 4-4',
  printer: 'M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z',
  arrowDown: 'M12 5v14 M5 12l7 7 7-7',
  list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n] || P.circle}"/></svg>`;

/* ---------- estado (localStorage) ----------
   done: exercícios resolvidos · rev: soluções consultadas · pos: passo atual de cada lição
   tests: melhor resultado dos minitestes · log: histórico de tentativas */
const KEY = 'mysql-academy.v1';
let st = { name: '', token: '', theme: '', done: {}, rev: {}, att: {}, pos: {}, tests: {}, days: [], log: [] };
try { Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* sem storage */ }
for (const k of ['rev', 'pos', 'tests', 'att', 'done']) st[k] = st[k] || {};
let syncTimer, online = null;
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* ignorar */ }
  clearTimeout(syncTimer); syncTimer = setTimeout(push, 1500);
}
const sum = () => S.summarize(st);

/* ---------- sincronização com a conta do aluno (Supabase ou servidor local) ---------- */
const BK = window.BACKEND;
const payload = () => ({ done: st.done, rev: st.rev, pos: st.pos, tests: st.tests, days: st.days, log: st.log });
function merge(remote) {
  for (const [id, d] of Object.entries(remote.done || {})) if (!st.done[id] || st.done[id].at > d.at) st.done[id] = d;
  Object.assign(st.rev, remote.rev || {});
  for (const [id, t] of Object.entries(remote.tests || {})) {
    const m = st.tests[id];
    st.tests[id] = !m ? t : { best: Math.max(m.best, t.best), attempts: Math.max(m.attempts, t.attempts), at: Math.max(m.at || 0, t.at || 0) };
  }
  for (const [id, p] of Object.entries(remote.pos || {})) st.pos[id] = Math.max(st.pos[id] || 0, p);
  st.days = [...new Set([...st.days, ...(remote.days || [])])].sort().slice(-400);
  const seen = new Set(st.log.map((e) => e.at + e.id));
  st.log = [...st.log, ...(remote.log || []).filter((e) => !seen.has(e.at + e.id))].sort((a, b) => a.at - b.at).slice(-500);
}
// Junta o progresso guardado na conta com o deste dispositivo e grava o resultado.
let pushing = null;
async function push() {
  if (!BK.user) return;
  if (pushing) return pushing;
  pushing = (async () => {
    try {
      const remote = await BK.load();
      if (remote) merge(remote);
      await BK.save(payload(), sum());
      online = true;
      try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* ignorar */ }
    } catch { online = false; } finally { pushing = null; }
  })();
  return pushing;
}

/* ---------- utilitários de UI ---------- */
function toast(msg, icon = 'check') {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = ic(icon) + esc(msg);
  $('#toasts').append(t); setTimeout(() => t.remove(), 3300);
}
function modal(icon, title, text) {
  const m = $('#modal');
  m.innerHTML = `<div class="box" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="mi">${ic(icon)}</div><h2 id="mt">${esc(title)}</h2><p>${text}</p><button class="btn" id="mok">Continuar</button></div>`;
  m.hidden = false; $('#mok').onclick = () => (m.hidden = true); $('#mok').focus();
  m.onclick = (e) => { if (e.target === m) m.hidden = true; };
}
const KW = new Set('SELECT FROM WHERE AND OR NOT INSERT INTO VALUES UPDATE SET DELETE CREATE DROP ALTER TABLE DATABASE SCHEMA USE SHOW DATABASES TABLES DESCRIBE DESC ASC ORDER BY GROUP HAVING LIMIT DISTINCT AS JOIN INNER LEFT RIGHT OUTER ON IN LIKE BETWEEN IS NULL PRIMARY KEY FOREIGN REFERENCES AUTO_INCREMENT UNIQUE DEFAULT INT VARCHAR DECIMAL DATE DATETIME TEXT BOOLEAN IF EXISTS ADD COLUMN MODIFY RENAME TO TRUNCATE START TRANSACTION COMMIT ROLLBACK GRANT REVOKE USER ROLE IDENTIFIED FLUSH PRIVILEGES COUNT SUM AVG MIN MAX ROUND VERSION CURDATE FOR GRANTS WITH OPTION CHARACTER OUTFILE FIELDS TERMINATED ENCLOSED SOURCE EXPLAIN'.split(' '));
function hl(code) {
  let out = '', last = 0, m; const re = /(--(?=\s|$)[^\n]*|#[^\n]*)|('(?:[^'\\]|\\.)*')|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_][A-Za-z_0-9]*)\b/g;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index)); last = re.lastIndex;
    if (m[1]) out += `<span class="c">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="s">${esc(m[2])}</span>`;
    else if (m[3]) out += `<span class="n">${m[3]}</span>`;
    else out += KW.has(m[4].toUpperCase()) ? `<span class="k">${m[4]}</span>` : m[4];
  }
  return out + esc(code.slice(last));
}
function table(rows) {
  if (!rows.length) return '<div class="res"><div class="empty small">A consulta não devolveu linhas.</div></div>';
  const cols = Object.keys(rows[0]);
  const body = rows.slice(0, 100).map((r) => '<tr>' + cols.map((c) => `<td>${r[c] === null || r[c] === undefined ? '<span class="muted">NULL</span>' : esc(r[c])}</td>`).join('') + '</tr>').join('');
  return `<div class="res"><table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div><div class="res-meta">${rows.length} ${rows.length === 1 ? 'linha' : 'linhas'}</div>`;
}
const bar = (p, cls = '') => `<div class="bar ${cls}" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p}%"></i></div>`;
const alertBox = (kind, icon, html) => `<div class="alert ${kind}">${ic(icon)}<div>${html}</div></div>`;
const initials = (n) => (n || '?').split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
const pad2 = (n) => String(n).padStart(2, '0');
const lvlPct = (s) => Math.round((100 * (s.xp - s.cur)) / (s.next - s.cur));
const pctOf = (a, b) => (b ? Math.round((100 * a) / b) : 0);
// Realça o SQL dos blocos <pre> escritos dentro do texto das lições.
function enhance(root) { root.querySelectorAll('.prose pre > code:not(.hl), .manual pre > code:not(.hl)').forEach((c) => { c.innerHTML = hl(c.textContent); c.classList.add('hl'); }); }
const codeBlock = (e, tools = '') => `<div class="code"><div class="code-h"><span>SQL</span><span class="row" style="gap:6px">${tools}</span></div><pre><code class="hl">${hl(e.sql)}</code></pre>${e.note ? `<div class="cap">${esc(e.note)}</div>` : ''}<div class="out"></div></div>`;

/* ---------- regras de progressão ---------- */
const passed = (ex) => !!(st.done[ex.id] || st.rev[ex.id]);
const lessonDone = (l) => l.ex.every(passed);
const lessonOpen = (c, i) => i === 0 || lessonDone(c.lessons[i - 1]);
function findLesson(id) { for (const c of CHAPTERS) for (const l of c.lessons) if (l.id === id) return { c, l, i: c.lessons.indexOf(l) }; return null; }
// O próximo passo do percurso: a primeira lição por concluir ou o miniteste por aprovar.
function nextAction() {
  const s = sum();
  for (const c of CHAPTERS) {
    const i = c.lessons.findIndex((l) => !lessonDone(l));
    if (i >= 0) return { kind: 'lesson', c, l: c.lessons[i], i };
    if (!s.perChapter[c.id].test.passed) return { kind: 'test', c };
  }
  return null;
}

/* ---------- pontuação / registo ---------- */
function touchDay() { const k = S.dayKey(Date.now()); if (!st.days.includes(k)) st.days.push(k); }
function celebrate(before, after) {
  persist(); renderChrome();
  if (after.lessonsDone.length > before.lessonsDone.length) setTimeout(() => toast(`Lição concluída · +${S.LESSON_BONUS} XP`, 'checkCircle'), 400);
  const nb = after.badges.filter((x) => !before.badges.includes(x));
  if (after.level > before.level) setTimeout(() => modal('zap', `Nível ${after.level} alcançado`, `Passou a <b>${after.title}</b>. Continue a praticar para subir na classificação.`), 700);
  else if (nb.length) { const bd = BADGES.find((x) => x.id === nb[0]); setTimeout(() => modal(bd.icon, 'Nova conquista', `<b>${esc(bd.name)}</b><br>${esc(bd.desc)}`), 700); }
}
function record(ex, ok) {
  const a = (st.att[ex.id] = st.att[ex.id] || { tries: 0, hints: 0 });
  a.tries++;
  st.log.push({ at: Date.now(), id: ex.id, ok });
  st.log = st.log.slice(-500);
  touchDay();
  if (!ok || st.done[ex.id]) { persist(); return; }
  if (st.rev[ex.id]) { persist(); toast('Correto · sem pontuação (resposta consultada)', 'info'); return; }
  const before = sum();
  st.done[ex.id] = { tries: a.tries, hints: a.hints, at: Date.now() };
  toast(`Resposta correta · +${S.exXp(ex.t, a.tries, a.hints)} XP`);
  celebrate(before, sum());
}

/* ---------- estrutura (navegação, topo) ---------- */
const view = $('#view');
const NAV = [
  ['Curso', [['#/', 'home', 'Painel'], ['#/learn', 'book', 'Conteúdos'], ['#/lab', 'terminal', 'Laboratório SQL']]],
  ['Desempenho', [['#/progress', 'chart', 'Progresso'], ['#/rank', 'trophy', 'Classificação']]],
  ['Conta', [['#/me', 'user', 'Perfil']]],
];
const TABS = [['#/', 'home', 'Painel'], ['#/learn', 'book', 'Curso'], ['#/lab', 'terminal', 'SQL'], ['#/progress', 'chart', 'Progresso'], ['#/rank', 'trophy', 'Ranking']];
let crumbs = [];
function isOn(h) {
  const r = location.hash || '#/';
  if (h === '#/') return r === '#/' || r === '#';
  if (h === '#/learn') return /^#\/(learn|c|l|m|t)\b/.test(r);
  return r.startsWith(h);
}
function renderChrome() {
  const nav = BK.user && BK.user.teacher ? [...NAV.slice(0, 2), ['Conta', [['#/me', 'user', 'Perfil'], ['#/prof', 'users', 'Área do professor']]]] : NAV;
  $('#nav').innerHTML = nav.map(([g, items]) => `<div class="grp">${g}</div>` + items.map(([h, i, t]) => `<a href="${h}" class="${isOn(h) ? 'on' : ''}">${ic(i)}<span>${t}</span></a>`).join('')).join('');
  $('#tabbar').innerHTML = TABS.map(([h, i, t]) => `<a href="${h}" class="${isOn(h) ? 'on' : ''}">${ic(i)}<span>${t}</span></a>`).join('');
  const s = sum();
  $('#mini').innerHTML = `<a class="who" href="#/me" style="color:inherit;text-decoration:none"><span class="avatar">${esc(initials((BK.user && BK.user.name) || 'A'))}</span><span><b>${esc((BK.user && BK.user.name) || 'Aluno convidado')}</b><span>Nível ${s.level} · ${s.title}</span></span></a>${bar(lvlPct(s))}<span class="small muted num-t">${s.xp} / ${s.next} XP</span>`;
  $('#crumbs').innerHTML = crumbs.map((c, i) => (i === crumbs.length - 1 ? `<b>${esc(c[0])}</b>` : `<a href="${c[1]}">${esc(c[0])}</a><span class="sep">/</span>`)).join('');
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches;
  $('#topr').innerHTML = `<span class="pill hide-m" title="Dias consecutivos de estudo">${ic('flame')}${s.streak} ${s.streak === 1 ? 'dia' : 'dias'}</span><span class="pill" title="Pontuação total">${ic('zap')}<span class="num-t">${s.xp} XP</span></span><button class="iconbtn" id="themeBtn" aria-label="Alternar tema claro/escuro">${ic(dark ? 'sun' : 'moon')}</button>`;
  $('#themeBtn').onclick = () => { st.theme = dark ? 'light' : 'dark'; applyTheme(); persist(); renderChrome(); };
}

/* ---------- painel ---------- */
function vHome() {
  crumbs = [['Painel', '#/']];
  const s = sum(), nx = nextAction();
  const C = 2 * Math.PI * 42, off = C * (1 - lvlPct(s) / 100);
  const greet = (() => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite'; })();
  let resume;
  if (!nx) resume = `<div class="meta">${ic('award')}<span>Curso concluído</span></div><h2>Parabéns, concluiu todos os capítulos.</h2><p class="muted">Pode rever qualquer manual, repetir os minitestes ou praticar no laboratório SQL.</p><a class="btn" href="#/lab">Abrir laboratório</a>`;
  else if (nx.kind === 'test') resume = `<div class="meta">${ic('clipboard')}<span>Capítulo ${nx.c.idx + 1} · Avaliação final</span></div><h2>Miniteste: ${esc(nx.c.title)}</h2><p class="muted" style="margin:0">Concluiu todas as lições. Aprove o miniteste (mínimo ${PASS_MARK}%) para fechar o capítulo.</p>
    ${bar(s.pct)}<div class="row" style="justify-content:space-between"><span class="small muted">Progresso global do curso</span><span class="small num-t"><b>${s.pct}%</b></span></div>
    <div class="row" style="margin-top:18px"><a class="btn" href="#/t/${nx.c.id}">Fazer miniteste ${ic('chevR')}</a><a class="btn sec-b" href="#/m/${nx.c.id}">${ic('book')}Rever manual</a></div>`;
  else {
    const p = Math.min(st.pos[nx.l.id] || 0, nx.l.steps.length - 1);
    resume = `<div class="meta">${ic(nx.c.icon)}<span>Capítulo ${nx.c.idx + 1} · Lição ${nx.i + 1} · Passo ${p + 1} de ${nx.l.steps.length}</span></div>
    <h2>${esc(nx.l.title)}</h2><p class="muted" style="margin:0">${esc(nx.c.title)}</p>
    ${bar(s.pct)}<div class="row" style="justify-content:space-between"><span class="small muted">Progresso global do curso</span><span class="small num-t"><b>${s.pct}%</b></span></div>
    <div class="row" style="margin-top:18px"><a class="btn" href="#/l/${nx.l.id}">${s.exDone || p ? 'Continuar' : 'Começar'} ${ic('chevR')}</a><a class="btn sec-b" href="#/m/${nx.c.id}">${ic('book')}Manual do capítulo</a></div>`;
  }
  view.innerHTML = `
  <div class="page-h"><div><h1>${greet}${st.name ? ', ' + esc(st.name.split(' ')[0]) : ''}</h1><p>${s.exDone ? `Concluiu ${s.chaptersDone.length} de ${CHAPTERS.length} capítulos e resolveu ${s.exDone} exercícios.` : 'Bem-vindo ao curso de MySQL. A matéria é apresentada passo a passo: leia, pratique e avance.'}</p></div>
  ${BK.user ? '' : `<a class="btn sec-b" href="#/me">${ic('user')}${BK.kind === 'supabase' ? 'Entrar / criar conta' : 'Criar perfil'}</a>`}</div>
  <div class="dash">
    <section class="card resume">${resume}</section>
    <section class="card lvl">
      <div class="ring"><svg viewBox="0 0 96 96"><circle class="bg" cx="48" cy="48" r="42"/><circle class="fg" cx="48" cy="48" r="42" stroke-dasharray="${C}" stroke-dashoffset="${off}"/></svg><div><span>Nível</span><b>${s.level}</b></div></div>
      <div><div class="eyebrow" style="margin:0">${s.title}</div><div class="small muted num-t" style="margin:4px 0 10px">${s.xp - s.cur} / ${s.next - s.cur} XP para o nível ${s.level + 1}</div><a class="btn link sm" href="#/progress" style="padding:0">Ver detalhe ${ic('chevR')}</a></div>
    </section>
  </div>
  <div class="kpis">
    <div class="kpi"><div class="l">${ic('zap')}Pontuação</div><div class="v">${s.xp}</div><div class="s">XP acumulado</div></div>
    <div class="kpi"><div class="l">${ic('clipboard')}Capítulos</div><div class="v">${s.chaptersDone.length}<span class="muted" style="font-size:1rem;font-weight:500"> / ${CHAPTERS.length}</span></div><div class="s">minitestes aprovados</div></div>
    <div class="kpi"><div class="l">${ic('target')}Precisão</div><div class="v">${pctOf(s.firstTry, s.exDone)}%</div><div class="s">certos à 1.ª tentativa</div></div>
    <div class="kpi"><div class="l">${ic('flame')}Sequência</div><div class="v">${s.streak}</div><div class="s">${s.streak === 1 ? 'dia consecutivo' : 'dias consecutivos'}</div></div>
  </div>
  <section class="sec"><h2>Conteúdos do curso</h2>${moduleList(s)}</section>`;
}
function moduleList(s) {
  return `<div class="list">${CHAPTERS.map((c) => {
    const p = s.perChapter[c.id];
    const status = p.complete ? `<span class="chip ok">Concluído · ${p.test.best}%</span>` : p.unlocked ? '<span class="chip acc">Miniteste disponível</span>' : `<span>${p.lessonsOk}/${p.lessons} lições</span>`;
    return `<a class="item" href="#/c/${c.id}"><span class="no">${pad2(c.idx + 1)}</span><span class="ico ${p.complete ? 'done' : ''}">${ic(p.complete ? 'check' : c.icon)}</span>
    <span><b>${esc(c.title)}</b><span class="d">${esc(c.desc)}</span></span>
    <span class="p"><span class="row" style="justify-content:space-between">${status}<span class="num-t">${p.pct}%</span></span>${bar(p.pct, p.complete ? 'ok' : '')}</span>
    <span class="chev">${ic('chevR')}</span></a>`;
  }).join('')}</div>`;
}
function vLearn() {
  crumbs = [['Conteúdos', '#/learn']];
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Programa</div><h1>Conteúdos do curso</h1><p>${CHAPTERS.length} capítulos · ${CHAPTERS.reduce((n, c) => n + c.lessons.length, 0)} lições · ${S.TOTAL_EX} exercícios · ${CHAPTERS.length} minitestes</p></div></div>
  <div class="card" style="margin-bottom:16px"><div class="how">${[['book', 'Aprender', 'Cada lição apresenta um conceito de cada vez.'], ['edit', 'Praticar', 'Logo a seguir, resolve um exercício sobre esse conceito para avançar.'], ['layers', 'Consultar', 'O manual de cada capítulo está sempre disponível.'], ['clipboard', 'Validar', `No fim, um miniteste (mín. ${PASS_MARK}%) conclui o capítulo.`]].map(([i, t, d], k) => `<div><span class="how-i">${ic(i)}</span><b>${k + 1}. ${t}</b><span>${d}</span></div>`).join('')}</div></div>
  ${moduleList(sum())}`;
}

/* ---------- capítulo ---------- */
function vChapter(id) {
  const c = CHAPTERS.find((x) => x.id === id); if (!c) return vHome();
  crumbs = [['Conteúdos', '#/learn'], [`Capítulo ${c.idx + 1}`, '#/c/' + c.id]];
  const p = sum().perChapter[c.id];
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Capítulo ${pad2(c.idx + 1)}</div><h1>${esc(c.title)}</h1><p>${esc(c.desc)}</p></div>
  <div style="min-width:220px"><div class="row small" style="justify-content:space-between;margin-bottom:6px"><span class="muted">${p.lessonsOk} de ${p.lessons} lições${p.complete ? ' · concluído' : ''}</span><b class="num-t">${p.pct}%</b></div>${bar(p.pct, p.complete ? 'ok' : '')}</div></div>
  <div class="list">${c.lessons.map((l, i) => {
    const open = lessonOpen(c, i), n = l.ex.filter(passed).length, done = n === l.ex.length;
    const pos = Math.min(st.pos[l.id] || 0, l.steps.length - 1);
    const inner = `<span class="status ${done ? 'done' : n || pos ? 'part' : ''}">${done ? ic('check') : open ? i + 1 : ic('lock')}</span><span><b>${esc(l.title)}</b><span class="d">${l.steps.filter((s) => s.t === 'learn').length} conceitos · ${l.ex.length} exercícios</span></span>
    <span class="chip ${done ? 'ok' : n || pos ? 'acc' : ''}">${done ? 'Concluída' : !open ? 'Bloqueada' : n || pos ? `Passo ${pos + 1} de ${l.steps.length}` : 'Por iniciar'}</span><span class="chev">${open ? ic('chevR') : ''}</span>`;
    return open ? `<a class="item lesson-i" href="#/l/${l.id}">${inner}</a>` : `<div class="item lesson-i locked" title="Conclua a lição anterior para desbloquear">${inner}</div>`;
  }).join('')}</div>
  <div class="two" style="margin-top:16px">
    <div class="card side-card"><span class="side-i">${ic('book')}</span><div><h3>Manual do capítulo</h3><p class="small muted">Toda a matéria do capítulo num só documento, com resumo de sintaxe. Pode consultá-lo sempre que quiser — também durante as lições.</p><a class="btn sec-b" href="#/m/${c.id}">Abrir manual</a></div></div>
    <div class="card side-card"><span class="side-i ${p.test.passed ? 'ok' : ''}">${ic(p.unlocked ? 'clipboard' : 'lock')}</span><div><h3>Miniteste final</h3>
      <p class="small muted">${c.test.length} perguntas de escolha múltipla. Aprovação com ${PASS_MARK}% ou mais conclui o capítulo.</p>
      ${p.test.attempts ? `<p class="small">Melhor resultado: <b>${p.test.best}%</b> · ${p.test.attempts} ${p.test.attempts === 1 ? 'tentativa' : 'tentativas'} ${p.test.passed ? '<span class="chip ok">Aprovado</span>' : ''}</p>` : ''}
      ${p.unlocked ? `<a class="btn" href="#/t/${c.id}">${p.test.attempts ? 'Repetir miniteste' : 'Iniciar miniteste'}</a>` : `<span class="chip">${ic('lock')}Disponível após concluir as ${c.lessons.length} lições</span>`}</div></div>
  </div>`;
}

/* ---------- lição passo a passo ---------- */
function vLesson(id) {
  const f = findLesson(id); if (!f) return vHome();
  const { c: C, l: L, i: idx } = f;
  crumbs = [['Conteúdos', '#/learn'], [`Capítulo ${C.idx + 1}`, '#/c/' + C.id], [`Lição ${idx + 1}`, '#/l/' + L.id]];
  if (!lessonOpen(C, idx)) {
    view.innerHTML = `<div class="card locked-card"><span class="side-i">${ic('lock')}</span><div><h2>Lição bloqueada</h2><p class="muted">A matéria é apresentada de forma gradual. Conclua primeiro a lição <b>${esc(C.lessons[idx - 1].title)}</b>.</p><div class="row"><a class="btn" href="#/l/${C.lessons[idx - 1].id}">Ir para a lição anterior</a><a class="btn sec-b" href="#/m/${C.id}">${ic('book')}Consultar o manual</a></div></div></div>`;
    return;
  }
  const total = L.steps.length;
  const pos = Math.min(st.pos[L.id] || 0, total - 1);
  const shown = L.steps.slice(0, pos + 1);
  let nConcept = 0, nEx = 0;
  view.innerHTML = `<div class="lesson-wrap"><article class="prose">
    <div class="lesson-head"><div class="eyebrow">Capítulo ${C.idx + 1} · Lição ${idx + 1} de ${C.lessons.length}</div><h1>${esc(L.title)}</h1>
      <div class="row lesson-meta"><div class="grow"><div class="row small" style="justify-content:space-between;margin-bottom:6px"><span class="muted">Passo ${pos + 1} de ${total}</span><span class="muted num-t">${pctOf(pos + (lessonDone(L) ? 1 : 0), total)}%</span></div>${bar(pctOf(pos + (lessonDone(L) ? 1 : 0), total), lessonDone(L) ? 'ok' : '')}</div>
      <button class="btn sec-b sm" id="openManual">${ic('book')}Manual</button></div></div>
    <div id="steps">${shown.map((s, k) => s.t === 'learn' ? `<section class="step learn" data-k="${k}"><div class="step-l">${ic('book')}Conceito ${++nConcept}</div><h2>${esc(s.title)}</h2>${s.html}${s.examples.map((e, j) => codeBlock(e, `<button class="btn" data-copy="${j}" aria-label="Copiar">${ic('copy')}<span class="lbl">Copiar</span></button>${e.run ? `<a class="btn" href="#/lab" data-lab="${j}" aria-label="Abrir no laboratório">${ic('terminal')}<span class="lbl">Laboratório</span></a><button class="btn run" data-run="${j}">${ic('play')}Executar</button>` : ''}`)).join('')}</section>` : `<section class="step practice" data-k="${k}" data-n="${++nEx}"></section>`).join('')}</div>
    <div id="next"></div>
  </article>
  <aside class="toc">${tocHtml(C, L)}</aside></div>`;
  enhance(view);
  view.querySelectorAll('.step.learn').forEach((box) => {
    const s = L.steps[+box.dataset.k];
    box.querySelectorAll('[data-copy]').forEach((b) => (b.onclick = () => { navigator.clipboard?.writeText(s.examples[+b.dataset.copy].sql); toast('Copiado para a área de transferência', 'copy'); }));
    box.querySelectorAll('[data-run]').forEach((b) => (b.onclick = () => { b.closest('.code').querySelector('.out').innerHTML = runSql(D.create(), s.examples[+b.dataset.run].sql); }));
    box.querySelectorAll('[data-lab]').forEach((b) => (b.onclick = () => { labSql = s.examples[+b.dataset.lab].sql; }));
  });
  view.querySelectorAll('.step.practice').forEach((box) => {
    const s = L.steps[+box.dataset.k];
    box.append(taskEl(s, +box.dataset.n - 1, () => renderNext(C, L, idx)));
  });
  $('#openManual').onclick = () => openDrawer(C);
  renderNext(C, L, idx);
}
// Barra inferior da lição: "Continuar", aviso para resolver o exercício, ou fim da lição.
function renderNext(C, L, idx) {
  const box = $('#next'); if (!box) return;
  const total = L.steps.length, pos = Math.min(st.pos[L.id] || 0, total - 1), cur = L.steps[pos];
  const blocked = cur.t !== 'learn' && !passed(cur);
  if (blocked) { box.innerHTML = `<div class="next-bar wait">${ic('edit')}<span>Resolva o exercício acima para continuar.</span></div>`; return; }
  if (pos < total - 1) {
    const nxt = L.steps[pos + 1];
    box.innerHTML = `<div class="next-bar"><span class="muted small">A seguir: <b>${nxt.t === 'learn' ? esc(nxt.title) : 'exercício de aplicação'}</b></span><button class="btn" id="goNext">Continuar ${ic('arrowDown')}</button></div>`;
    $('#goNext').onclick = () => {
      st.pos[L.id] = pos + 1; touchDay(); persist();
      vLesson(L.id); renderChrome();
      const el = view.querySelector(`.step[data-k="${pos + 1}"]`);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.classList.add('fresh'); }
    };
    return;
  }
  const next = C.lessons[idx + 1];
  const p = sum().perChapter[C.id];
  box.innerHTML = `<div class="card done-card"><span class="side-i ok">${ic('checkCircle')}</span><div><h2>Lição concluída</h2>
    <p class="muted">${next ? `Pode avançar para a lição seguinte: <b>${esc(next.title)}</b>.` : p.test.passed ? 'Este capítulo já está concluído. Pode repetir o miniteste para melhorar o resultado.' : `Concluiu todas as lições deste capítulo. Faça agora o miniteste final (mínimo ${PASS_MARK}%) para o dar como concluído.`}</p>
    <div class="row">${next ? `<a class="btn" href="#/l/${next.id}">Lição seguinte ${ic('chevR')}</a>` : `<a class="btn" href="#/t/${C.id}">${ic('clipboard')}${p.test.passed ? 'Repetir miniteste' : 'Fazer o miniteste'}</a>`}<a class="btn sec-b" href="#/m/${C.id}">${ic('book')}Rever no manual</a></div></div></div>`;
  const toc = view.querySelector('.toc'); if (toc) toc.innerHTML = tocHtml(C, L);
}
function tocHtml(C, cur) {
  const p = sum().perChapter[C.id];
  return `<h4>${esc(C.title)}</h4>${C.lessons.map((l, i) => { const d = lessonDone(l), open = lessonOpen(C, i); return open ? `<a href="#/l/${l.id}" class="${l === cur ? 'on' : ''} ${d ? 'done' : ''}">${ic(d ? 'checkCircle' : 'circle')}<span>${i + 1}. ${esc(l.title)}</span></a>` : `<span class="toc-lock">${ic('lock')}<span>${i + 1}. ${esc(l.title)}</span></span>`; }).join('')}
  <div class="toc-sep"></div><a href="#/m/${C.id}">${ic('book')}<span>Manual do capítulo</span></a>
  ${p.unlocked ? `<a href="#/t/${C.id}" class="${p.test.passed ? 'done' : ''}">${ic(p.test.passed ? 'checkCircle' : 'clipboard')}<span>Miniteste${p.test.attempts ? ` · ${p.test.best}%` : ''}</span></a>` : `<span class="toc-lock">${ic('lock')}<span>Miniteste</span></span>`}`;
}
// Mensagens do motor do simulador traduzidas para o equivalente do MySQL.
const SQL_ERRORS = [
  [/violation of check constraint/i, 'Violação da restrição CHECK: o valor não cumpre a condição. A linha não foi guardada. (No MySQL: ERROR 3819)'],
  [/table does not exist: (\w+)/i, (m) => `A tabela ou vista '${m[1]}' não existe. (No MySQL: ERROR 1146)`],
  [/already exists/i, 'Já existe um objeto com esse nome. (No MySQL: ERROR 1050)'],
];
function sqlError(err) {
  const msg = String((err && err.message) || err);
  for (const [re, txt] of SQL_ERRORS) { const m = msg.match(re); if (m) return typeof txt === 'function' ? txt(m) : txt; }
  return msg;
}
function runSql(db, sql) {
  try { return table(D.run(db, sql)); } catch (err) { return alertBox('bad', 'alert', `<b>Erro:</b> ${esc(sqlError(err))}`); }
}

/* ---------- estrutura das tabelas (consulta durante os exercícios) ---------- */
// Insere texto na posição do cursor de uma caixa de texto.
function insertAt(ta, text) {
  const a = ta.selectionStart ?? ta.value.length, b = ta.selectionEnd ?? a;
  const before = ta.value.slice(0, a), sep = before && !/[\s(,.]$/.test(before) ? ' ' : '';
  ta.value = before + sep + text + ta.value.slice(b);
  const p = a + sep.length + text.length; ta.focus(); ta.setSelectionRange(p, p);
  ta.dispatchEvent(new Event('input'));
}
// Painel com a estrutura (DESCRIBE) e os dados de cada tabela; as tabelas da pergunta aparecem primeiro.
// As vistas só aparecem quando a pergunta as usa (ou com showViews, no laboratório).
function schemaPanel(used, onPick, showViews) {
  const names = [...used, ...Object.keys(D.SCHEMA).filter((t) => !used.includes(t) && (showViews || !D.SCHEMA[t].view))];
  const el = document.createElement('div'); el.className = 'sp';
  let cur = names[0], showData = false;
  function paint() {
    const t = D.SCHEMA[cur], cols = D.COLS[cur];
    const rows = D.SEED[cur] || D.run(D.create(), `SELECT * FROM ${cur}`).map((r) => cols.map((c) => r[c]));
    el.innerHTML = `<div class="sp-tabs" role="tablist">${names.map((n) => `<button type="button" role="tab" aria-selected="${n === cur}" class="${n === cur ? 'on' : ''}" data-t="${n}">${ic(D.SCHEMA[n].view ? 'layers' : 'table')}${n}${used.includes(n) ? '<span class="sp-dot" title="Usada nesta pergunta"></span>' : ''}</button>`).join('')}</div>
      <div class="sp-b"><p class="small muted" style="margin:0 0 8px"><b>${cur}</b>${t.view ? ' <span class="chip">vista</span>' : ''} — ${esc(t.desc)}${used.includes(cur) ? ' · <span class="chip acc">usada nesta pergunta</span>' : ''}</p>
      <div class="scroll"><table class="tbl sp-t"><thead><tr><th>Campo</th><th>Tipo</th><th>Chave</th><th>Descrição</th></tr></thead><tbody>
        ${t.cols.map(([c, ty, k, d]) => `<tr><td>${onPick ? `<button type="button" class="sp-col" data-c="${c}" title="Inserir na resposta">${c}</button>` : `<code>${c}</code>`}</td><td class="mono">${ty}</td><td>${k ? `<span class="chip ${k === 'PK' ? 'acc' : ''}">${esc(k)}</span>` : ''}</td><td class="small muted">${esc(d)}</td></tr>`).join('')}</tbody></table></div>
      <div class="row" style="margin-top:10px;justify-content:space-between"><button type="button" class="btn link sm sp-data">${ic(showData ? 'chevL' : 'eye')}${showData ? 'Esconder dados' : `Ver dados (${rows.length} linhas)`}</button>${onPick ? '<span class="small muted">Clique num campo para o inserir na resposta.</span>' : ''}</div>
      ${showData ? `<div class="res" style="max-height:240px"><table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}</div>`;
    el.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { cur = b.dataset.t; paint(); }));
    el.querySelector('.sp-data').onclick = () => { showData = !showData; paint(); };
    if (onPick) el.querySelectorAll('.sp-col').forEach((b) => (b.onclick = () => onPick(b.dataset.c)));
  }
  paint();
  return el;
}

function taskEl(ex, i, onPass) {
  const el = document.createElement('div');
  const tag = { quiz: 'Escolha múltipla', code: 'Escrever comando', query: 'Consulta SELECT' }[ex.t];
  function paint(fbHtml) {
    const done = st.done[ex.id], rev = st.rev[ex.id], a = st.att[ex.id] || { tries: 0, hints: 0 };
    el.className = 'task' + (done || rev ? ' done' : '');
    const chip = done ? `<span class="chip ok">${ic('check')}+${S.exXp(ex.t, done.tries, done.hints)} XP</span>` : rev ? '<span class="chip">Resposta consultada · 0 XP</span>' : `<span class="chip">${S.BASE[ex.t]} XP</span>`;
    el.innerHTML = `<div class="task-h"><span>${ic('edit')}Exercício ${i + 1} · ${tag}</span>${chip}</div>
      <div class="task-b"><div class="q">${esc(ex.q)}</div><div class="body"></div><div class="fb" aria-live="polite">${fbHtml || ''}</div></div>`;
    const body = el.querySelector('.body'), fb = el.querySelector('.fb');
    // Mostrar a resposta certa: desbloqueia a lição, mas o exercício deixa de dar XP.
    const answerHtml = () => ex.t === 'quiz'
      ? `<b>Resposta certa:</b> ${esc(ex.opts[ex.a])}. ${esc(ex.why)}<br><span class="small">Pode continuar a lição; este exercício já não conta XP.</span>`
      : `<b>Resposta certa:</b> <code>${esc(ex.solution)}</code><br><span class="small">Estude-a com atenção. Pode continuar a lição; este exercício já não conta XP.</span>`;
    const reveal = () => {
      if (!confirm(`Ver a resposta certa?\n\nPerde os ${S.BASE[ex.t]} XP deste exercício, mas pode continuar a lição.`)) return;
      st.rev[ex.id] = 1; st.log.push({ at: Date.now(), id: ex.id, ok: false }); touchDay(); persist();
      if (ex.t !== 'quiz') { el._val = ex.solution; if (ex.t === 'query') { try { el._out = table(D.run(D.create(), ex.solution)); } catch { el._out = ''; } } }
      paint(alertBox('info', 'eye', answerHtml()));
      onPass(); renderChrome();
    };
    const revealBtn = () => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn link sm'; b.innerHTML = ic('eye') + `Ver resposta certa (−${S.BASE[ex.t]} XP)`; b.onclick = reveal; return b; };
    if (rev && !done && !fbHtml) fb.innerHTML = alertBox('info', 'eye', answerHtml());
    if (ex.t === 'quiz') {
      body.className = 'body opts';
      const order = el._order || (el._order = ex.opts.map((o, k) => k).sort(() => Math.random() - 0.5));
      order.forEach((k, posi) => {
        const b = document.createElement('button'); b.className = 'opt'; b.disabled = !!(done || rev);
        b.innerHTML = `<span class="lt">${'ABCD'[posi]}</span><span>${esc(ex.opts[k])}</span>`;
        if ((done || rev) && k === ex.a) b.classList.add('good');
        b.onclick = () => {
          if (k === ex.a) { record(ex, true); paint(alertBox('ok', 'checkCircle', `<b>Correto.</b> ${esc(ex.why)}`)); onPass(); }
          else { b.classList.add('wrong'); b.disabled = true; record(ex, false); fb.innerHTML = alertBox('bad', 'x', 'Resposta incorreta. Releia a explicação e tente outra opção.'); }
        };
        body.append(b);
      });
      if (done && !fbHtml) fb.innerHTML = alertBox('ok', 'info', esc(ex.why));
      if (!done && !rev) { const r = document.createElement('div'); r.className = 'reveal-row'; r.append(revealBtn()); body.append(r); }
      return;
    }
    const ta = document.createElement('textarea'); ta.className = 'sql'; ta.spellcheck = false; ta.autocapitalize = 'off'; ta.autocomplete = 'off';
    ta.setAttribute('aria-label', 'Resposta SQL');
    ta.placeholder = ex.t === 'query' ? 'SELECT …' : 'Escreva aqui o comando…'; ta.value = el._val ?? (done ? ex.solution : '');
    ta.oninput = () => (el._val = ta.value);
    const out = document.createElement('div'); out.innerHTML = el._out || '';
    const tools = document.createElement('div'); tools.className = 'tools';
    const mk = (label, icon, cls, fn) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.innerHTML = ic(icon) + label; b.onclick = fn; tools.append(b); return b; };
    const check = () => {
      if (!ta.value.trim()) { fb.innerHTML = alertBox('info', 'info', 'Escreva primeiro a sua resposta.'); return; }
      let ok = false;
      try {
        if (ex.t === 'code') ok = D.checkCode(ta.value, ex);
        else { const r = D.check(ta.value, ex); ok = r.ok; out.innerHTML = el._out = table(r.rows); }
      } catch (err) { out.innerHTML = el._out = ''; fb.innerHTML = alertBox('bad', 'alert', `<b>Erro.</b> ${esc(sqlError(err))}`); return; }
      if (ok) { record(ex, true); paint(alertBox('ok', 'checkCircle', '<b>Correto.</b>' + (ex.t === 'query' ? ' O resultado coincide com o esperado.' : ''))); onPass(); }
      else {
        record(ex, false);
        fb.innerHTML = alertBox('bad', 'x', ex.t === 'query' ? 'O resultado não coincide com o esperado. Verifique colunas, filtros e agrupamentos.' : 'Ainda não está correto. Confira a sintaxe e os nomes utilizados.');
      }
    };
    mk(ex.t === 'query' ? 'Executar e verificar' : 'Verificar', 'check', '', check);
    if (ex.t === 'query') mk('Executar', 'play', 'sec-b', () => { out.innerHTML = el._out = runSql(D.create(), ta.value); });
    let sp = null;
    const toggleSchema = () => {
      el._schema = !el._schema;
      if (sp) { sp.remove(); sp = null; }
      if (el._schema) { sp = schemaPanel(D.tablesIn(ex.solution), (c) => insertAt(ta, c)); body.insertBefore(sp, ta); }
      sb.innerHTML = ic('table') + (el._schema ? 'Esconder estrutura' : 'Estrutura das tabelas');
    };
    const sb = ex.t === 'query' ? mk('Estrutura das tabelas', 'table', 'sec-b', toggleSchema) : null;
    if (!done && !rev) mk(`Dica (−${S.HINT_COST} XP)`, 'bulb', 'link sm', () => { a.hints = Math.min(a.hints + 1, 9); st.att[ex.id] = a; persist(); fb.innerHTML = alertBox('info', 'bulb', esc(ex.hint)); });
    if (!done && !rev) tools.append(revealBtn());
    const k = document.createElement('span'); k.className = 'small muted kb'; k.innerHTML = '<span class="kbd">Ctrl</span> + <span class="kbd">Enter</span>'; tools.append(k);
    ta.onkeydown = (ev) => { if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') { ev.preventDefault(); check(); } };
    body.append(ta, tools, out);
    if (sb && el._schema) { el._schema = false; toggleSchema(); }
  }
  paint();
  return el;
}

/* ---------- manual do capítulo ---------- */
function manualHtml(c) {
  return `<div class="manual">
    <section class="m-sec" id="m-cheat"><h2>Resumo de sintaxe</h2><div class="scroll"><table class="tbl cheat"><thead><tr><th>Sintaxe</th><th>Para que serve</th></tr></thead><tbody>${c.cheat.map(([k, d]) => `<tr><td><code>${esc(k)}</code></td><td>${esc(d)}</td></tr>`).join('')}</tbody></table></div></section>
    ${c.lessons.map((l, i) => `<section class="m-sec" id="m-${i}"><h2><span class="m-no">${C2(c, i)}</span>${esc(l.title)}</h2>
      ${l.steps.filter((s) => s.t === 'learn').map((s) => `<h3>${esc(s.title)}</h3><div class="prose">${s.html}</div>${s.examples.map((e) => codeBlock(e)).join('')}`).join('')}</section>`).join('')}
  </div>`;
}
const C2 = (c, i) => `${c.idx + 1}.${i + 1}`;
function vManual(id) {
  const c = CHAPTERS.find((x) => x.id === id); if (!c) return vHome();
  crumbs = [['Conteúdos', '#/learn'], [`Capítulo ${c.idx + 1}`, '#/c/' + c.id], ['Manual', '#/m/' + c.id]];
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Manual · Capítulo ${pad2(c.idx + 1)}</div><h1>${esc(c.title)}</h1><p>Documento de consulta com toda a matéria do capítulo.</p></div>
    <div class="row noprint"><button class="btn sec-b sm" id="print">${ic('printer')}Imprimir / PDF</button><a class="btn sm" href="#/c/${c.id}">Voltar ao capítulo</a></div></div>
    <div class="lesson-wrap"><div class="card manual-card">${manualHtml(c)}</div>
    <aside class="toc noprint"><h4>Neste manual</h4><a href="#" data-to="m-cheat">${ic('list')}<span>Resumo de sintaxe</span></a>${c.lessons.map((l, i) => `<a href="#" data-to="m-${i}">${ic('book')}<span>${C2(c, i)} ${esc(l.title)}</span></a>`).join('')}</aside></div>`;
  enhance(view);
  $('#print').onclick = () => window.print();
  view.querySelectorAll('[data-to]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); document.getElementById(a.dataset.to).scrollIntoView({ behavior: 'smooth' }); }));
}
function openDrawer(c) {
  const d = $('#drawer');
  d.innerHTML = `<div class="dr-panel" role="dialog" aria-modal="true" aria-label="Manual do capítulo"><div class="dr-h"><div><div class="eyebrow" style="margin:0">Manual</div><b>${esc(c.title)}</b></div><div class="row" style="gap:6px"><a class="btn sec-b sm" href="#/m/${c.id}">Abrir em página</a><button class="iconbtn" id="drClose" aria-label="Fechar">${ic('x')}</button></div></div><div class="dr-b">${manualHtml(c)}</div></div>`;
  d.hidden = false; enhance(d);
  const close = () => { d.hidden = true; d.innerHTML = ''; };
  $('#drClose').onclick = close; $('#drClose').focus();
  d.onclick = (e) => { if (e.target === d || e.target.closest('a[href^="#/"]')) close(); };
}

/* ---------- miniteste ---------- */
let quizRun = null;
function vTest(id) {
  const c = CHAPTERS.find((x) => x.id === id); if (!c) return vHome();
  crumbs = [['Conteúdos', '#/learn'], [`Capítulo ${c.idx + 1}`, '#/c/' + c.id], ['Miniteste', '#/t/' + c.id]];
  const p = sum().perChapter[c.id];
  const head = `<div class="page-h"><div><div class="eyebrow">Avaliação · Capítulo ${pad2(c.idx + 1)}</div><h1>Miniteste: ${esc(c.title)}</h1></div></div>`;
  if (!p.unlocked) {
    const left = c.lessons.filter((l) => !lessonDone(l));
    view.innerHTML = head + `<div class="card locked-card"><span class="side-i">${ic('lock')}</span><div><h2>Miniteste bloqueado</h2><p class="muted">Conclua primeiro todas as lições do capítulo. Em falta: ${left.map((l) => `<b>${esc(l.title)}</b>`).join(', ')}.</p><a class="btn" href="#/c/${c.id}">Ver lições</a></div></div>`;
    return;
  }
  if (!quizRun || quizRun.c !== c) {
    view.innerHTML = head + `<div class="card test-intro"><div class="ti-grid">
      <div><span>Perguntas</span><b>${c.test.length}</b></div><div><span>Tipo</span><b>Escolha múltipla</b></div><div><span>Aprovação</span><b>${PASS_MARK}%</b></div><div><span>Melhor resultado</span><b>${p.test.attempts ? p.test.best + '%' : '—'}</b></div></div>
      <p class="muted">Responda a todas as perguntas; as respostas corretas só são mostradas no fim. Pode repetir o miniteste as vezes que quiser — conta o melhor resultado. ${p.test.passed ? '' : `Ao ser aprovado, o capítulo fica concluído e recebe <b>+${S.CHAPTER_BONUS} XP</b>.`}</p>
      <div class="row"><button class="btn" id="start">${ic('play')}${p.test.attempts ? 'Repetir miniteste' : 'Iniciar miniteste'}</button><a class="btn sec-b" href="#/m/${c.id}">${ic('book')}Rever o manual primeiro</a></div></div>`;
    $('#start').onclick = () => {
      const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
      quizRun = { c, qs: shuffle(c.test).map((q) => ({ q, order: shuffle(q.opts.map((o, k) => k)) })), i: 0, ans: [] };
      vTest(id);
    };
    return;
  }
  const r = quizRun;
  if (r.i < r.qs.length) {
    const { q, order } = r.qs[r.i];
    view.innerHTML = head + `<div class="card test-q"><div class="row" style="justify-content:space-between;margin-bottom:8px"><span class="small muted">Pergunta ${r.i + 1} de ${r.qs.length}</span><button class="btn link sm" id="quit">Abandonar</button></div>${bar(pctOf(r.i, r.qs.length))}
      <h2 style="margin:20px 0 16px">${esc(q.q)}</h2><div class="opts">${order.map((k, j) => `<button class="opt ${r.ans[r.i] === k ? 'sel' : ''}" data-k="${k}"><span class="lt">${'ABCD'[j]}</span><span>${esc(q.opts[k])}</span></button>`).join('')}</div>
      <div class="row" style="justify-content:space-between;margin-top:18px">${r.i ? `<button class="btn sec-b" id="prev">${ic('chevL')}Anterior</button>` : '<span></span>'}<button class="btn" id="nextQ" ${r.ans[r.i] === undefined ? 'disabled' : ''}>${r.i === r.qs.length - 1 ? 'Terminar e corrigir' : 'Seguinte'} ${ic('chevR')}</button></div></div>`;
    view.querySelectorAll('.opt').forEach((b) => (b.onclick = () => { r.ans[r.i] = +b.dataset.k; view.querySelectorAll('.opt').forEach((x) => x.classList.toggle('sel', x === b)); $('#nextQ').disabled = false; }));
    $('#nextQ').onclick = () => { r.i++; if (r.i === r.qs.length) finishTest(r); vTest(id); };
    if ($('#prev')) $('#prev').onclick = () => { r.i--; vTest(id); };
    $('#quit').onclick = () => { if (confirm('Abandonar o miniteste? As respostas não serão guardadas.')) { quizRun = null; location.hash = '#/c/' + c.id; } };
    return;
  }
  const ok = r.qs.filter((x, k) => r.ans[k] === x.q.a).length, score = pctOf(ok, r.qs.length), pass = score >= PASS_MARK;
  view.innerHTML = head + `<div class="card result ${pass ? 'pass' : 'fail'}"><div class="score"><b>${score}%</b><span>${ok} de ${r.qs.length} certas</span></div>
    <div><h2>${pass ? 'Aprovado' : 'Ainda não foi desta'}</h2><p class="muted">${pass ? (r.firstPass ? `O capítulo <b>${esc(c.title)}</b> está concluído. Recebeu +${S.CHAPTER_BONUS} XP.` : 'Miniteste aprovado.') : `Precisa de pelo menos ${PASS_MARK}% para concluir o capítulo. Reveja as respostas abaixo e o manual, e tente novamente.`}</p>
    <div class="row">${pass ? (CHAPTERS[c.idx + 1] ? `<a class="btn" href="#/c/${CHAPTERS[c.idx + 1].id}">Capítulo seguinte ${ic('chevR')}</a>` : '<a class="btn" href="#/progress">Ver progresso</a>') : `<button class="btn" id="again">${ic('reset')}Repetir miniteste</button>`}<a class="btn sec-b" href="#/m/${c.id}">${ic('book')}Rever manual</a></div></div></div>
    <div class="sec"><h2>Correção</h2>${r.qs.map((x, k) => { const right = r.ans[k] === x.q.a; return `<div class="review ${right ? 'ok' : 'bad'}"><div class="rv-h">${ic(right ? 'checkCircle' : 'x')}<b>${k + 1}. ${esc(x.q.q)}</b></div>
      ${right ? '' : `<p class="small">A sua resposta: <span class="chip bad">${esc(x.q.opts[r.ans[k]])}</span></p>`}<p class="small">Resposta correta: <span class="chip ok">${esc(x.q.opts[x.q.a])}</span></p><p class="small muted">${esc(x.q.why)}</p></div>`; }).join('')}</div>`;
  if ($('#again')) $('#again').onclick = () => { quizRun = null; vTest(id); $('#start').click(); };
}
function finishTest(r) {
  const c = r.c, ok = r.qs.filter((x, k) => r.ans[k] === x.q.a).length, score = pctOf(ok, r.qs.length);
  const before = sum(), prev = st.tests[c.id] || { best: 0, attempts: 0 };
  st.tests[c.id] = { best: Math.max(prev.best || 0, score), attempts: (prev.attempts || 0) + 1, at: Date.now() };
  st.log.push({ at: Date.now(), id: c.id + '.teste', ok: score >= PASS_MARK, score }); st.log = st.log.slice(-500);
  touchDay();
  const after = sum();
  r.firstPass = !before.perChapter[c.id].test.passed && after.perChapter[c.id].test.passed;
  if (r.firstPass) setTimeout(() => toast(`Capítulo concluído · +${S.CHAPTER_BONUS} XP`, 'award'), 300);
  celebrate(before, after);
}

/* ---------- laboratório ---------- */
let labDb = null, labSql = 'SELECT * FROM alunos;';
function vLab() {
  crumbs = [['Laboratório SQL', '#/lab']];
  if (!labDb) labDb = D.create();
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Prática livre</div><h1>Laboratório SQL</h1><p>Execute instruções sobre a base de dados <b>escola</b>. Os dados ficam apenas no seu dispositivo e podem ser repostos a qualquer momento.</p></div></div>
  <div class="card"><div class="card-h"><h3>Esquema</h3><span class="row" style="gap:8px"><button class="btn sec-b sm" id="schemaBtn">${ic('table')}Estrutura das tabelas</button><button class="btn sec-b sm" id="reset">${ic('reset')}Repor dados</button></span></div><div id="labSchema"></div>
  <div class="schema">${Object.entries(D.COLS).map(([t, c]) => `<span><b>${t}</b> (${c.join(', ')})</span>`).join('')}</div>
  <textarea class="sql" id="labq" spellcheck="false" style="min-height:150px" aria-label="Instrução SQL"></textarea>
  <div class="tools"><button class="btn" id="go">${ic('play')}Executar</button><span class="small muted kb"><span class="kbd">Ctrl</span> + <span class="kbd">Enter</span></span></div>
  <div id="labout"></div></div>
  <p class="small muted" style="margin-top:12px">${ic('info')} O motor do laboratório simula o MySQL no browser e suporta SELECT, INSERT, UPDATE, DELETE e CREATE TABLE. Algumas funções específicas do MySQL podem não estar disponíveis.</p>`;
  const q = $('#labq'); q.value = labSql;
  $('#schemaBtn').onclick = () => {
    const box = $('#labSchema'), open = !box.firstChild;
    box.innerHTML = ''; if (open) box.append(schemaPanel(D.tablesIn(q.value), (c) => insertAt(q, c), true));
    $('#schemaBtn').innerHTML = ic('table') + (open ? 'Esconder estrutura' : 'Estrutura das tabelas');
  };
  const go = () => { labSql = q.value; $('#labout').innerHTML = runSql(labDb, q.value); touchDay(); persist(); };
  $('#go').onclick = go; q.onkeydown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); go(); } };
  $('#reset').onclick = () => { labDb = D.create(); $('#labout').innerHTML = alertBox('ok', 'check', 'Dados de exemplo repostos.'); };
}

/* ---------- progresso ---------- */
function logLabel(e) {
  if (e.id.endsWith('.teste')) { const c = CHAPTERS.find((x) => x.id === e.id.split('.')[0]); return { code: 'Miniteste', text: c ? c.title : '' }; }
  const x = S.EXS[e.id]; return { code: e.id, text: x ? (x.q.length > 80 ? x.q.slice(0, 80) + '…' : x.q) : '' };
}
function vProgress() {
  crumbs = [['Progresso', '#/progress']];
  const s = sum();
  const byDay = {}; Object.values(st.done).forEach((d) => { const k = S.dayKey(d.at); byDay[k] = (byDay[k] || 0) + 1; });
  const days = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push([S.dayKey(d), d]); }
  const mx = Math.max(1, ...days.map(([k]) => byDay[k] || 0));
  const total14 = days.reduce((n, [k]) => n + (byDay[k] || 0), 0);
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Desempenho</div><h1>O meu progresso</h1><p>Registo detalhado da sua evolução no curso.</p></div>
  <div class="row"><button class="btn sec-b sm" id="csv">${ic('download')}Exportar CSV</button><button class="btn sec-b sm" id="json">${ic('download')}Exportar JSON</button></div></div>
  <div class="kpis" style="margin-top:0">
    <div class="kpi"><div class="l">${ic('zap')}Pontuação</div><div class="v">${s.xp}</div><div class="s">Nível ${s.level} · ${s.title}</div></div>
    <div class="kpi"><div class="l">${ic('checkCircle')}Conclusão</div><div class="v">${s.pct}%</div><div class="s">${s.lessonsDone.length} lições · ${s.chaptersDone.length} capítulos</div></div>
    <div class="kpi"><div class="l">${ic('target')}À 1.ª tentativa</div><div class="v">${s.firstTry}</div><div class="s">de ${s.exDone} exercícios resolvidos</div></div>
    <div class="kpi"><div class="l">${ic('flame')}Sequência</div><div class="v">${s.streak}</div><div class="s">dias consecutivos</div></div>
  </div>
  <div class="card" style="margin-top:16px"><div class="card-h"><h3>Progresso por capítulo</h3></div><div class="scroll"><table class="tbl"><thead><tr><th>Capítulo</th><th style="width:28%">Progresso</th><th>Lições</th><th>Exercícios</th><th>Miniteste</th></tr></thead><tbody>${CHAPTERS.map((c) => { const p = s.perChapter[c.id]; return `<tr><td><a href="#/c/${c.id}" style="color:inherit">${c.idx + 1}. ${esc(c.title)}</a></td><td>${bar(p.pct, p.complete ? 'ok' : '')}</td><td class="small">${p.lessonsOk}/${p.lessons}</td><td class="small">${p.ok}/${p.tot}</td><td>${p.test.attempts ? `<span class="chip ${p.test.passed ? 'ok' : 'bad'}">${p.test.best}% · ${p.test.passed ? 'Aprovado' : 'Não aprovado'}</span>` : p.unlocked ? '<span class="chip acc">Disponível</span>' : '<span class="chip">Bloqueado</span>'}</td></tr>`; }).join('')}</tbody></table></div></div>
  <div class="two" style="margin-top:16px">
    <div class="card"><div class="card-h"><h3>Atividade (14 dias)</h3><span class="small muted">${total14} exercícios</span></div>
      <div class="chart">${days.map(([k]) => `<div style="height:${Math.round((100 * (byDay[k] || 0)) / mx)}%" title="${k}: ${byDay[k] || 0} exercícios"></div>`).join('')}</div>
      <div class="chart-x">${days.map(([, d], i) => `<span>${i % 2 ? '' : d.getDate()}</span>`).join('')}</div></div>
    <div class="card"><div class="card-h"><h3>Conquistas</h3><span class="small muted">${s.badges.length} de ${BADGES.length}</span></div><div class="badges compact">${BADGES.map((b) => { const on = s.badges.includes(b.id); return `<div class="badge ${on ? '' : 'off'}" title="${esc(b.desc)}"><span class="bi">${ic(on ? b.icon : 'lock')}</span><span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></span></div>`; }).join('')}</div></div>
  </div>
  <div class="card" style="margin-top:16px"><div class="card-h"><h3>Histórico de tentativas</h3><span class="small muted">${st.log.length} registos</span></div>
  ${st.log.length ? `<div class="scroll" style="max-height:380px"><table class="tbl"><thead><tr><th>Data</th><th>Atividade</th><th>Descrição</th><th>Resultado</th></tr></thead><tbody>${st.log.slice().reverse().slice(0, 200).map((e) => { const x = logLabel(e); return `<tr><td class="small muted" style="white-space:nowrap">${new Date(e.at).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}</td><td style="font-family:var(--mono);font-size:.8rem">${esc(x.code)}</td><td class="small">${esc(x.text)}</td><td>${e.score !== undefined ? `<span class="chip ${e.ok ? 'ok' : 'bad'}">${e.score}%</span>` : e.ok ? '<span class="chip ok">Correto</span>' : '<span class="chip bad">Incorreto</span>'}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty">Ainda não existem tentativas registadas.</div>'}</div>`;
  const dl = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); };
  $('#csv').onclick = () => dl('progresso-mysql.csv', 'data,atividade,correto,resultado\n' + st.log.map((e) => `${new Date(e.at).toISOString()},${e.id},${e.ok ? 1 : 0},${e.score ?? ''}`).join('\n'), 'text/csv');
  $('#json').onclick = () => dl('progresso-mysql.json', JSON.stringify({ aluno: st.name, resumo: { xp: s.xp, nivel: s.level, exercicios: s.exDone, capitulos: s.perChapter }, ...payload() }, null, 2), 'application/json');
}
async function vRank() {
  crumbs = [['Classificação', '#/rank']];
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Desempenho</div><h1>Classificação</h1><p>Compare a sua evolução com a dos restantes alunos.</p></div></div><div class="card" id="rk" style="padding:0"><div class="empty">A carregar…</div></div>`;
  try {
    const rows = await BK.leaderboard();
    const me = (BK.user ? BK.user.name : '').toLowerCase();
    $('#rk').outerHTML = (BK.user ? '' : `<div style="margin-bottom:16px">${alertBox('info', 'info', 'Crie uma conta na página <a href="#/me">Perfil</a> para aparecer na classificação.')}</div>`) +
      `<div class="card" style="padding:0">${rows.length ? `<div class="scroll"><table class="tbl"><thead><tr><th style="width:60px">#</th><th>Aluno</th><th>Nível</th><th class="r">XP</th><th style="width:22%">Conclusão</th><th class="r">Sequência</th></tr></thead><tbody>${rows.map((r, i) => `<tr class="${r.name.toLowerCase() === me ? 'me' : ''}"><td><span class="pos ${i < 3 ? 'p' + (i + 1) : ''}">${i + 1}</span></td><td><span class="who"><span class="avatar">${esc(initials(r.name))}</span><b>${esc(r.name)}</b></span></td><td>${r.level} <span class="small muted">${esc(S.titleOf(r.level))}</span></td><td class="r"><b>${r.xp}</b></td><td><div class="row" style="flex-wrap:nowrap">${bar(r.pct)}<span class="small muted num-t" style="min-width:36px">${r.pct}%</span></div></td><td class="r">${r.streak} d</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Ainda não há alunos na classificação.</div>'}</div>`;
    view.querySelectorAll('.tbl .bar').forEach((b) => (b.style.flex = '1'));
  } catch (e) { $('#rk').outerHTML = alertBox('bad', 'alert', `Não foi possível obter a classificação. ${esc(BK.errorText(e))} O seu progresso continua guardado neste dispositivo.`); }
}

function vMe() {
  crumbs = [['Perfil', '#/me']];
  const s = sum(), sbMode = BK.kind === 'supabase', u = BK.user;
  const prefs = `<div class="card"><h3>Preferências e dados</h3><p class="small muted">Nível ${s.level} · ${s.xp} XP · ${s.exDone} exercícios resolvidos.</p>
    <div class="row"><button class="btn sec-b" id="theme">${ic('moon')}Alternar tema</button>${u ? '' : `<button class="btn danger" id="reset">${ic('trash')}Apagar progresso local</button>`}</div>
    <p class="small muted" style="margin-top:14px"><a href="#/prof">Área do professor</a></p></div>`;
  let acct;
  if (u) {
    acct = `<div class="who" style="margin-bottom:14px"><span class="avatar" style="width:44px;height:44px">${esc(initials(u.name))}</span><span><b>${esc(u.name)}</b><span>${esc(u.email || 'Sessão iniciada')}${u.teacher ? ' · Professor' : ''}</span></span></div>
    <p class="small muted">O progresso é guardado na sua conta e pode ser retomado em qualquer dispositivo.</p>${online === false ? alertBox('bad', 'alert', 'Sem ligação neste momento. A sincronização será feita mais tarde.') : ''}
    <div class="row" style="margin-top:14px"><button class="btn" id="sync">${ic('refresh')}Sincronizar</button><button class="btn sec-b" id="out">${ic('logout')}Terminar sessão</button>${u.teacher ? `<a class="btn sec-b" href="#/prof">${ic('users')}Área do professor</a>` : ''}</div>`;
  } else if (sbMode) {
    const reg = meTab === 'reg';
    acct = `<div class="seg" role="tablist"><button class="${reg ? '' : 'on'}" data-tab="in">Iniciar sessão</button><button class="${reg ? 'on' : ''}" data-tab="reg">Criar conta</button></div>
    <form id="authf" novalidate>
      ${reg ? '<label class="field">Nome (aparece na classificação)<input class="txt" id="nm" maxlength="24" autocomplete="nickname" required></label>' : ''}
      <label class="field">Email<input class="txt" id="em" type="email" autocomplete="email" required></label>
      <label class="field">Palavra-passe${reg ? ' (mín. 6 caracteres)' : ''}<input class="txt" id="pw" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" required></label>
      <div class="row"><button class="btn" type="submit">${reg ? 'Criar conta' : 'Entrar'}</button>${reg ? '' : '<button class="btn link sm" type="button" id="forgot">Esqueci-me da palavra-passe</button>'}</div>
      <p class="small muted" style="margin:12px 0 0">O progresso já feito neste dispositivo é juntado à sua conta.</p><div id="msg"></div></form>`;
  } else {
    acct = `<h3>Criar perfil ou iniciar sessão</h3><p class="small muted">O nome é visível na classificação. O progresso já realizado neste dispositivo é mantido.</p>
    <form id="authf"><label class="field">Nome<input class="txt" id="nm" maxlength="24" autocomplete="username" value="${esc(st.name)}"></label>
    <label class="field">PIN ou palavra-passe (mín. 4 caracteres)<input class="txt" id="pw" type="password" autocomplete="current-password"></label>
    <div class="row"><button class="btn" type="button" id="reg">Criar perfil</button><button class="btn sec-b" type="submit">Iniciar sessão</button></div><div id="msg"></div></form>`;
  }
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Conta</div><h1>Perfil</h1></div></div><div class="two"><div class="card">${acct}</div>${prefs}</div>`;
  const msg = (kind, icon, html) => { $('#msg').innerHTML = alertBox(kind, icon, html); };
  const entered = async (user) => { meTab = 'in'; st.name = user.name; persist(); await push(); toast('Sessão iniciada'); route(); };
  const busy = async (fn) => { const b = view.querySelectorAll('#authf .btn'); b.forEach((x) => (x.disabled = true)); try { await fn(); } catch (e) { msg('bad', 'alert', esc(BK.errorText(e))); } finally { b.forEach((x) => (x.disabled = false)); } };
  if (u) {
    $('#sync').onclick = async () => { await push(); toast(online ? 'Progresso sincronizado' : 'Sem ligação', online ? 'check' : 'alert'); vMe(); };
    $('#out').onclick = async () => {
      if (!confirm('Terminar sessão? O progresso fica guardado na sua conta e é removido deste dispositivo.')) return;
      await push(); await BK.logout();
      Object.assign(st, { name: '', done: {}, rev: {}, att: {}, pos: {}, tests: {}, days: [], log: [] }); persist(); route();
    };
  } else if (sbMode) {
    view.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { meTab = b.dataset.tab; vMe(); }));
    $('#authf').onsubmit = (e) => {
      e.preventDefault();
      const email = $('#em').value.trim(), password = $('#pw').value;
      if (meTab === 'reg') {
        const name = $('#nm').value.trim().replace(/\s+/g, ' ');
        if (name.length < 2) return msg('bad', 'alert', 'Indique um nome com pelo menos 2 caracteres.');
        if (password.length < 6) return msg('bad', 'alert', 'A palavra-passe deve ter pelo menos 6 caracteres.');
        busy(async () => {
          const r = await BK.register({ name, email, password });
          if (r.needsConfirm) { st.name = name; persist(); msg('ok', 'checkCircle', `Conta criada. Enviámos um email para <b>${esc(email)}</b>: abra-o e clique no link de confirmação. Depois volte aqui e inicie sessão.`); meTab = 'in'; }
          else await entered(r.user);
        });
      } else busy(async () => entered(await BK.login({ email, password })));
    };
    if ($('#forgot')) $('#forgot').onclick = () => {
      const email = $('#em').value.trim();
      if (!email) return msg('info', 'info', 'Escreva primeiro o seu email no campo acima.');
      busy(async () => { await BK.resetPassword(email); msg('ok', 'checkCircle', `Enviámos para <b>${esc(email)}</b> um link para definir uma nova palavra-passe.`); });
    };
  } else {
    const go = (kind) => busy(async () => {
      const name = $('#nm').value.trim(), password = $('#pw').value;
      const user = kind === 'reg' ? (await BK.register({ name, password, state: payload() })).user : await BK.login({ name, password });
      await entered(user);
    });
    $('#authf').onsubmit = (e) => { e.preventDefault(); go('in'); };
    $('#reg').onclick = () => go('reg');
  }
  $('#theme').onclick = () => $('#themeBtn').click();
  if ($('#reset')) $('#reset').onclick = () => { if (confirm('Apagar todo o progresso guardado neste dispositivo?')) { Object.assign(st, { done: {}, rev: {}, att: {}, pos: {}, tests: {}, days: [], log: [] }); persist(); route(); } };
}
let meTab = 'in';

// Depois de abrir o link "recuperar palavra-passe" recebido por email.
function askNewPassword() {
  const m = $('#modal');
  m.innerHTML = `<form class="box" id="npf" role="dialog" aria-modal="true" aria-labelledby="npt"><div class="mi">${ic('lock')}</div><h2 id="npt">Nova palavra-passe</h2><p>Defina a nova palavra-passe da sua conta.</p>
    <input class="txt" id="np" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres" style="width:100%;margin-bottom:12px"><div id="npm"></div><button class="btn" type="submit">Guardar</button></form>`;
  m.hidden = false; $('#np').focus();
  $('#npf').onsubmit = async (e) => {
    e.preventDefault();
    try { await BK.updatePassword($('#np').value); m.hidden = true; toast('Palavra-passe alterada'); history.replaceState(null, '', location.pathname + '#/'); route(); }
    catch (err) { $('#npm').innerHTML = alertBox('bad', 'alert', esc(BK.errorText(err))); }
  };
}

/* ---------- área do professor ---------- */
let profRows = null, profSort = 'xp';
async function vProf() {
  crumbs = [['Área do professor', '#/prof']];
  const head = `<div class="page-h"><div><div class="eyebrow">Acompanhamento</div><h1>Área do professor</h1><p>Evolução de todos os alunos inscritos.</p></div><div class="row" id="profTools"></div></div>`;
  if (BK.kind === 'supabase' && !(BK.user && BK.user.teacher)) {
    view.innerHTML = head + `<div class="card locked-card"><span class="side-i">${ic('lock')}</span><div><h2>Acesso reservado</h2><p class="muted">Esta área só está disponível para contas de professor. ${BK.user ? '' : 'Inicie sessão na página <a href="#/me">Perfil</a>. '}Para atribuir o perfil de professor a uma conta, execute no Supabase (SQL Editor):</p><pre><code>update public.profiles set is_teacher = true\nwhere lower(name) = lower('Nome do Professor');</code></pre></div></div>`;
    enhanceCode(view); return;
  }
  if (BK.kind === 'server' && !sessionStorage.getItem('mya.teacherKey')) {
    view.innerHTML = head + `<div class="card" style="max-width:480px"><h3>Chave de professor</h3><p class="small muted">Indique a chave definida ao arrancar o servidor (<code>TEACHER_KEY=… npm start</code>).</p><form id="kf"><input class="txt" id="tk" type="password" style="width:100%;margin-bottom:12px"><button class="btn" type="submit">Entrar</button></form></div>`;
    $('#kf').onsubmit = (e) => { e.preventDefault(); sessionStorage.setItem('mya.teacherKey', $('#tk').value); profRows = null; vProf(); };
    return;
  }
  view.innerHTML = head + '<div class="card"><div class="empty">A carregar alunos…</div></div>';
  try {
    if (!profRows) profRows = (await BK.students(sessionStorage.getItem('mya.teacherKey'))).map((r) => ({ ...r, s: S.summarize(r.state) }));
  } catch (e) {
    if (BK.kind === 'server') sessionStorage.removeItem('mya.teacherKey');
    view.innerHTML = head + alertBox('bad', 'alert', esc(BK.errorText(e))); return;
  }
  if (!location.hash.startsWith('#/prof')) return;
  const rows = profRows.slice().sort(profSort === 'name' ? (a, b) => a.name.localeCompare(b.name) : profSort === 'recent' ? (a, b) => b.updated - a.updated : (a, b) => b.s.xp - a.s.xp);
  const n = rows.length, avg = (f) => (n ? Math.round(rows.reduce((k, r) => k + f(r), 0) / n) : 0);
  const week = Date.now() - 7 * 864e5;
  view.innerHTML = head + `<div class="kpis" style="margin-top:0">
    <div class="kpi"><div class="l">${ic('users')}Alunos</div><div class="v">${n}</div><div class="s">${rows.filter((r) => r.updated > week).length} ativos nos últimos 7 dias</div></div>
    <div class="kpi"><div class="l">${ic('checkCircle')}Conclusão média</div><div class="v">${avg((r) => r.s.pct)}%</div><div class="s">do curso</div></div>
    <div class="kpi"><div class="l">${ic('clipboard')}Minitestes</div><div class="v">${rows.reduce((k, r) => k + r.s.testsPassed, 0)}</div><div class="s">aprovações no total</div></div>
    <div class="kpi"><div class="l">${ic('zap')}XP médio</div><div class="v">${avg((r) => r.s.xp)}</div><div class="s">por aluno</div></div></div>
  <div class="card" style="margin-top:16px;padding:0">${n ? `<div class="scroll"><table class="tbl prof"><thead><tr><th>Aluno</th><th>Nível</th><th class="r">XP</th><th style="width:18%">Conclusão</th>${CHAPTERS.map((c) => `<th class="c" title="${esc(c.title)}">C${c.idx + 1}</th>`).join('')}<th>Última atividade</th></tr></thead><tbody>
    ${rows.map((r, i) => `<tr class="pr" data-i="${i}"><td><span class="who"><span class="avatar">${esc(initials(r.name))}</span><b>${esc(r.name)}</b></span></td><td>${r.s.level}</td><td class="r"><b>${r.s.xp}</b></td><td><div class="row" style="flex-wrap:nowrap">${bar(r.s.pct)}<span class="small muted num-t" style="min-width:36px">${r.s.pct}%</span></div></td>
      ${CHAPTERS.map((c) => { const p = r.s.perChapter[c.id]; return `<td class="c">${p.test.passed ? `<span class="chip ok" title="Miniteste aprovado">${p.test.best}%</span>` : p.test.attempts ? `<span class="chip bad" title="Melhor resultado no miniteste">${p.test.best}%</span>` : `<span class="small muted" title="Lições concluídas">${p.lessonsOk}/${p.lessons}</span>`}</td>`; }).join('')}
      <td class="small muted" style="white-space:nowrap">${r.updated ? new Date(r.updated).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Ainda não há alunos inscritos.</div>'}</div>
  <p class="small muted" style="margin-top:10px">Colunas C1–C${CHAPTERS.length}: resultado do miniteste de cada capítulo (verde = aprovado) ou lições concluídas. Clique num aluno para ver o detalhe.</p><div id="profDetail"></div>`;
  $('#profTools').innerHTML = `<select class="txt sel" id="psort" aria-label="Ordenar"><option value="xp">Ordenar por XP</option><option value="name">Ordenar por nome</option><option value="recent">Mais recentes</option></select><button class="btn sec-b sm" id="prefresh">${ic('refresh')}Atualizar</button><button class="btn sec-b sm" id="pcsv">${ic('download')}Exportar CSV</button>`;
  $('#psort').value = profSort;
  $('#psort').onchange = () => { profSort = $('#psort').value; vProf(); };
  $('#prefresh').onclick = () => { profRows = null; vProf(); };
  $('#pcsv').onclick = () => {
    const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const head2 = ['aluno', 'nivel', 'xp', 'conclusao_pct', 'exercicios', 'licoes', 'capitulos_concluidos', ...CHAPTERS.map((c) => `miniteste_${c.id}`), 'ultima_atividade'];
    const lines = rows.map((r) => [q(r.name), r.s.level, r.s.xp, r.s.pct, r.s.exDone, r.s.lessonsDone.length, r.s.chaptersDone.length, ...CHAPTERS.map((c) => (r.s.perChapter[c.id].test.attempts ? r.s.perChapter[c.id].test.best : '')), r.updated ? new Date(r.updated).toISOString() : ''].join(','));
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + [head2.join(','), ...lines].join('\n')], { type: 'text/csv' })); a.download = 'alunos-mysql-academy.csv'; a.click();
  };
  view.querySelectorAll('tr.pr').forEach((tr) => (tr.onclick = () => {
    const r = rows[+tr.dataset.i];
    view.querySelectorAll('tr.pr').forEach((x) => x.classList.toggle('me', x === tr));
    $('#profDetail').innerHTML = `<div class="card" style="margin-top:16px"><div class="card-h"><h3>${esc(r.name)}</h3><span class="small muted">Nível ${r.s.level} · ${r.s.xp} XP · ${r.s.exDone} exercícios · ${r.s.firstTry} à 1.ª tentativa</span></div>
      <div class="scroll"><table class="tbl"><thead><tr><th>Capítulo</th><th>Lições</th><th>Exercícios</th><th>Miniteste</th></tr></thead><tbody>${CHAPTERS.map((c) => { const p = r.s.perChapter[c.id]; return `<tr><td>${c.idx + 1}. ${esc(c.title)}</td><td>${p.lessonsOk}/${p.lessons}</td><td>${p.ok}/${p.tot}</td><td>${p.test.attempts ? `<span class="chip ${p.test.passed ? 'ok' : 'bad'}">${p.test.best}% · ${p.test.attempts} ${p.test.attempts === 1 ? 'tentativa' : 'tentativas'}</span>` : '—'}</td></tr>`; }).join('')}</tbody></table></div>
      <h3 style="margin-top:18px">Últimas atividades</h3>${(r.state.log || []).length ? `<div class="scroll" style="max-height:300px"><table class="tbl"><tbody>${r.state.log.slice(-30).reverse().map((e) => { const x = logLabel(e); return `<tr><td class="small muted" style="white-space:nowrap">${new Date(e.at).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}</td><td style="font-family:var(--mono);font-size:.8rem">${esc(x.code)}</td><td class="small">${esc(x.text)}</td><td>${e.score !== undefined ? `<span class="chip ${e.ok ? 'ok' : 'bad'}">${e.score}%</span>` : e.ok ? '<span class="chip ok">Correto</span>' : '<span class="chip bad">Incorreto</span>'}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="muted small">Sem atividade registada.</p>'}</div>`;
    $('#profDetail').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}
const enhanceCode = (root) => root.querySelectorAll('pre > code:not(.hl)').forEach((c) => { c.innerHTML = hl(c.textContent); c.classList.add('hl'); });

function applyTheme() {
  if (st.theme) document.documentElement.dataset.theme = st.theme; else delete document.documentElement.dataset.theme;
}

/* ---------- router ---------- */
function route() {
  $('#modal').hidden = true;
  const dr = $('#drawer'); dr.hidden = true; dr.innerHTML = '';
  const h = location.hash || '#/';
  const [, a, b] = h.split('/');
  if (a !== 't') quizRun = null;
  ({ '': vHome, learn: vLearn, c: () => vChapter(b), l: () => vLesson(b), m: () => vManual(b), t: () => vTest(b), lab: vLab, progress: vProgress, rank: vRank, me: vMe, prof: vProf }[a || ''] || vHome)();
  renderChrome();
  const steps = a === 'l' ? view.querySelectorAll('.step') : [];
  if (steps.length > 1) steps[steps.length - 1].scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0);
}
addEventListener('hashchange', route);
addEventListener('keydown', (e) => { if (e.key === 'Escape') { $('#modal').hidden = true; const d = $('#drawer'); d.hidden = true; d.innerHTML = ''; } });
applyTheme();
route();
// Restaura a sessão (se existir) e sincroniza; só redesenha páginas sem trabalho em curso.
BK.onRecovery = askNewPassword;
BK.init().then(async (u) => {
  if (BK.recovery) askNewPassword();
  if (!u) { renderChrome(); return; }
  st.name = u.name;
  await push();
  const a = (location.hash.split('/')[1] || '');
  if (['', 'learn', 'c', 'progress', 'rank', 'me', 'prof'].includes(a)) route(); else renderChrome();
}).catch(() => renderChrome());
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
