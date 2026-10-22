(function () {
'use strict';
const { CHAPTERS, BADGES, PASS_MARK, TEST_DRAW } = window.CONTENT;
const S = window.SCORE;
const D = window.SQLDB;
const DDL = window.DDL;
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
  gamepad: 'M6 11h4 M8 9v4 M15 12h.01 M18 10h.01 M17.3 5H6.7a4 4 0 0 0-4 3.6L2 15a3 3 0 0 0 5.2 2.3L9 15h6l1.8 2.3A3 3 0 0 0 22 15l-.7-6.4a4 4 0 0 0-4-3.6z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
  repeat: 'M17 1l4 4-4 4 M3 11V9a4 4 0 0 1 4-4h14 M7 23l-4-4 4-4 M21 13v2a4 4 0 0 1-4 4H3',
  folder: 'M3 6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  move: 'M12 2v20 M5 9l7-7 7 7 M5 15l7 7 7-7',
  upload: 'M12 21V9 M7 14l5-5 5 5 M5 3h14',
  database: 'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3z M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n] || P.circle}"/></svg>`;

/* ---------- estado (localStorage) ----------
   done: exercícios resolvidos · rev: soluções consultadas · pos: passo atual de cada lição
   tests: melhor resultado dos minitestes · log: histórico de tentativas (com a resposta errada, para o professor)
   review: revisão espaçada {id: {box, due, ok, last}} · real: tarefas feitas no MySQL real · project: projeto final */
const KEY = 'mysql-academy.v1';
const EMPTY = () => ({ done: {}, rev: {}, att: {}, pos: {}, tests: {}, game: { done: {} }, days: [], log: [], review: {}, real: {}, project: {} });
let st = { name: '', token: '', theme: '', ...EMPTY() };
try { Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* sem storage */ }
for (const k of ['rev', 'pos', 'tests', 'att', 'done', 'review', 'real', 'project']) st[k] = st[k] || {};
st.game = st.game || { done: {} }; st.game.done = st.game.done || {};
let syncTimer, online = null;
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* ignorar */ }
  clearTimeout(syncTimer); syncTimer = setTimeout(push, 1500);
}
const sum = () => S.summarize(st);

/* ---------- sincronização com a conta do aluno (Supabase ou servidor local) ---------- */
const BK = window.BACKEND;
const payload = () => ({ done: st.done, rev: st.rev, pos: st.pos, tests: st.tests, game: { done: st.game.done }, days: st.days, log: st.log, review: st.review, real: st.real, project: st.project });
function merge(remote) {
  for (const [id, d] of Object.entries(remote.done || {})) if (!st.done[id] || st.done[id].at > d.at) st.done[id] = d;
  Object.assign(st.rev, remote.rev || {});
  for (const [id, t] of Object.entries(remote.tests || {})) {
    const m = st.tests[id];
    st.tests[id] = !m ? t : { best: Math.max(m.best, t.best), attempts: Math.max(m.attempts, t.attempts), at: Math.max(m.at || 0, t.at || 0), ...(m.passAt || t.passAt ? { passAt: Math.min(m.passAt || Infinity, t.passAt || Infinity) } : {}) };
  }
  for (const [id, r] of Object.entries(remote.review || {})) { const m = st.review[id]; if (!m || (r.last || 0) > (m.last || 0)) st.review[id] = r; }
  for (const [id, r] of Object.entries(remote.real || {})) st.real[id] = [...new Set([...(st.real[id] || []), ...(r || [])])].sort((a, b) => a - b);
  if (remote.project && (remote.project.at || 0) > ((st.project && st.project.at) || 0)) st.project = remote.project;
  for (const [id, p] of Object.entries(remote.pos || {})) st.pos[id] = Math.max(st.pos[id] || 0, p);
  for (const [id, d] of Object.entries((remote.game && remote.game.done) || {})) if (!st.game.done[id] || st.game.done[id].at > d.at) st.game.done[id] = d;
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
// Uma lição abre quando a anterior está concluída (ou quando já foi começada antes de surgirem lições novas).
const lessonStarted = (l) => (st.pos[l.id] || 0) > 0 || l.ex.some(passed);
const lessonOpen = (c, i) => i === 0 || lessonDone(c.lessons[i - 1]) || lessonStarted(c.lessons[i]);
function findLesson(id) { for (const c of CHAPTERS) for (const l of c.lessons) if (l.id === id) return { c, l, i: c.lessons.indexOf(l) }; return null; }
// Capítulos ocultos aos alunos pelo gestor do site (os professores veem todos, assinalados).
const HIDDEN_KEY = 'mysql-academy.hidden';
let hiddenCh = new Set();
try { hiddenCh = new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]')); } catch { /* sem storage */ }
const staff = () => !!(BK.user && BK.user.teacher);
const chHidden = (c) => hiddenCh.has(c.id) && !staff();
const visibleCh = () => CHAPTERS.filter((c) => !chHidden(c));
function setHidden(ids) {
  const before = [...hiddenCh].sort().join();
  hiddenCh = new Set(ids);
  try { localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hiddenCh])); } catch { /* ignorar */ }
  return before !== [...hiddenCh].sort().join();
}
async function loadSettings() { try { return setHidden((await BK.settings()).hidden); } catch { return false; } }
// Página de um capítulo oculto (aberta por um link antigo ou escrita à mão).
function hiddenPage(c) {
  if (!chHidden(c)) return false;
  crumbs = [['Conteúdos', '#/learn']];
  view.innerHTML = `<div class="card locked-card"><span class="side-i">${ic('lock')}</span><div><h2>Capítulo ainda não disponível</h2><p class="muted">O professor vai abrir este capítulo quando a turma estiver pronta. Entretanto, pode continuar os capítulos disponíveis ou rever a matéria na página Revisão.</p><div class="row"><a class="btn" href="#/learn">Ver capítulos disponíveis</a><a class="btn sec-b" href="#/rev">${ic('repeat')}Revisão</a></div></div></div>`;
  return true;
}
// O próximo passo do percurso: a primeira lição por concluir ou o miniteste por aprovar.
function nextAction() {
  const s = sum();
  for (const c of visibleCh()) {
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
// Regista uma tentativa. As respostas erradas ficam no histórico (resumidas) para o professor ver os erros mais comuns.
const answerOf = (v) => (v === undefined || v === null ? undefined : String(v).replace(/\s+/g, ' ').trim().slice(0, 160));
function logTry(id, ok, answer) {
  st.log.push({ at: Date.now(), id, ok, ...(ok || answer === undefined ? {} : { a: answerOf(answer) }) });
  st.log = st.log.slice(-500);
}
// Revisão espaçada: entra na fila quem precisou de várias tentativas, de dicas ou viu a solução.
function scheduleReview(ex) {
  if (st.review[ex.id] || !S.EXS[ex.id]) return;
  if (S.needsReview(st.done[ex.id], st.rev[ex.id])) st.review[ex.id] = { box: 1, due: S.nextDue(1), ok: 0, last: 0 };
}
function record(ex, ok, answer) {
  const a = (st.att[ex.id] = st.att[ex.id] || { tries: 0, hints: 0 });
  a.tries++;
  logTry(ex.id, ok, answer);
  touchDay();
  if (!ok || st.done[ex.id]) { persist(); return; }
  if (st.rev[ex.id]) { persist(); toast('Correto · sem pontuação (resposta consultada)', 'info'); return; }
  const before = sum();
  st.done[ex.id] = { tries: a.tries, hints: a.hints, at: Date.now() };
  scheduleReview(ex);
  toast(`Resposta correta · +${S.exXp(ex, a.tries, a.hints)} XP`);
  celebrate(before, sum());
}
// Resultado de um exercício feito na página Revisão (ou no aquecimento de uma lição).
function reviewResult(ex, ok, answer) {
  logTry(ex.id + '.r', ok, answer);
  touchDay();
  const r = st.review[ex.id];
  if (!r) { persist(); return; }
  const before = sum();
  if (ok) { r.ok = (r.ok || 0) + 1; r.box = Math.min(r.box + 1, S.BOXES.length + 1); r.last = Date.now(); r.due = r.box > S.BOXES.length ? 0 : S.nextDue(r.box); }
  else { r.box = 1; r.due = S.nextDue(1); }
  if (ok) toast(r.ok <= S.REVIEW_MAX ? `Revisão certa · +${S.REVIEW_XP} XP` : 'Revisão certa', 'repeat');
  celebrate(before, sum());
}
const dueReviews = () => Object.entries(st.review).filter(([id, r]) => S.EXS[id] && r.due && r.due <= Date.now()).map(([id]) => S.EXS[id]);

/* ---------- estrutura (navegação, topo) ---------- */
const view = $('#view');
const NAV = [
  ['Curso', [['#/', 'home', 'Painel'], ['#/learn', 'book', 'Conteúdos'], ['#/rev', 'repeat', 'Revisão'], ['#/lab', 'terminal', 'Laboratório SQL'], ['#/jogo', 'gamepad', 'Protocolo NEXUS'], ['#/projeto', 'folder', 'Projeto final']]],
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
  const nDue = dueReviews().length;
  $('#nav').innerHTML = nav.map(([g, items]) => `<div class="grp">${g}</div>` + items.map(([h, i, t]) => `<a href="${h}" class="${isOn(h) ? 'on' : ''}">${ic(i)}<span>${t}</span>${h === '#/rev' && nDue ? `<span class="nav-n" title="Exercícios para rever hoje">${nDue}</span>` : ''}</a>`).join('')).join('');
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
  ${dueReviews().length ? `<div style="margin-top:16px">${alertBox('info', 'repeat', `<b>Revisão do dia:</b> tem ${dueReviews().length} ${dueReviews().length === 1 ? 'exercício' : 'exercícios'} para rever, de lições anteriores. Rever na altura certa é a forma mais eficaz de não esquecer. <a href="#/rev">Rever agora</a>`)}</div>` : ''}
  <div class="kpis">
    <div class="kpi"><div class="l">${ic('zap')}Pontuação</div><div class="v">${s.xp}</div><div class="s">XP acumulado</div></div>
    <div class="kpi"><div class="l">${ic('clipboard')}Capítulos</div><div class="v">${s.chaptersDone.length}<span class="muted" style="font-size:1rem;font-weight:500"> / ${CHAPTERS.length}</span></div><div class="s">minitestes aprovados</div></div>
    <div class="kpi"><div class="l">${ic('target')}Precisão</div><div class="v">${pctOf(s.firstTry, s.exDone)}%</div><div class="s">certos à 1.ª tentativa</div></div>
    <div class="kpi"><div class="l">${ic('flame')}Sequência</div><div class="v">${s.streak}</div><div class="s">${s.streak === 1 ? 'dia consecutivo' : 'dias consecutivos'}</div></div>
  </div>
  <section class="sec"><h2>Conteúdos do curso</h2>${moduleList(s)}</section>`;
}
function moduleList(s) {
  return `<div class="list">${visibleCh().map((c) => {
    const p = s.perChapter[c.id];
    const status = p.complete ? `<span class="chip ok">Concluído · ${p.test.best}%</span>` : p.unlocked ? '<span class="chip acc">Miniteste disponível</span>' : `<span>${p.lessonsOk}/${p.lessons} lições</span>`;
    return `<a class="item" href="#/c/${c.id}"><span class="no">${pad2(c.idx + 1)}</span><span class="ico ${p.complete ? 'done' : ''}">${ic(p.complete ? 'check' : c.icon)}</span>
    <span><b>${esc(c.title)}</b>${hiddenCh.has(c.id) ? ` <span class="chip" title="Os alunos não veem este capítulo">${ic('eye')}Oculto aos alunos</span>` : ''}<span class="d">${esc(c.desc)}</span></span>
    <span class="p"><span class="row" style="justify-content:space-between">${status}<span class="num-t">${p.pct}%</span></span>${bar(p.pct, p.complete ? 'ok' : '')}</span>
    <span class="chev">${ic('chevR')}</span></a>`;
  }).join('')}</div>`;
}
function vLearn() {
  crumbs = [['Conteúdos', '#/learn']];
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Programa</div><h1>Conteúdos do curso</h1><p>${visibleCh().length} capítulos · ${visibleCh().reduce((n, c) => n + c.lessons.length, 0)} lições · ${visibleCh().reduce((n, c) => n + c.lessons.reduce((k, l) => k + l.ex.length, 0), 0)} exercícios · ${visibleCh().length} minitestes${visibleCh().length < CHAPTERS.length ? ` <span class="chip">${CHAPTERS.length - visibleCh().length} ${CHAPTERS.length - visibleCh().length === 1 ? 'capítulo será aberto' : 'capítulos serão abertos'} pelo professor</span>` : ''}</p></div></div>
  <div class="card" style="margin-bottom:16px"><div class="how">${[['book', 'Aprender', 'Cada lição apresenta um conceito de cada vez.'], ['edit', 'Praticar', 'Logo a seguir, resolve um exercício sobre esse conceito para avançar.'], ['layers', 'Consultar', 'O manual de cada capítulo está sempre disponível.'], ['repeat', 'Rever', 'O que custou mais volta na página Revisão, em 1, 3, 7 e 14 dias.'], ['clipboard', 'Validar', `No fim, um miniteste (mín. ${PASS_MARK}%) conclui o capítulo.`]].map(([i, t, d], k) => `<div><span class="how-i">${ic(i)}</span><b>${k + 1}. ${t}</b><span>${d}</span></div>`).join('')}</div></div>
  ${moduleList(sum())}`;
}

/* ---------- capítulo ---------- */
function vChapter(id) {
  const c = CHAPTERS.find((x) => x.id === id); if (!c) return vHome();
  if (hiddenPage(c)) return;
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
      <p class="small muted">${Math.min(TEST_DRAW.quiz, c.test.length)} perguntas de escolha múltipla sorteadas de um banco de ${c.test.length}${c.practice && c.practice.length ? ` e ${Math.min(TEST_DRAW.practice, c.practice.length)} exercícios práticos` : ''}. Aprovação com ${PASS_MARK}% ou mais conclui o capítulo.</p>
      ${p.test.attempts ? `<p class="small">Melhor resultado: <b>${p.test.best}%</b> · ${p.test.attempts} ${p.test.attempts === 1 ? 'tentativa' : 'tentativas'} ${p.test.passed ? '<span class="chip ok">Aprovado</span>' : ''}</p>` : ''}
      ${p.unlocked ? `<a class="btn" href="#/t/${c.id}">${p.test.attempts ? 'Repetir miniteste' : 'Iniciar miniteste'}</a>` : `<span class="chip">${ic('lock')}Disponível após concluir as ${c.lessons.length} lições</span>`}</div></div>
  </div>
  ${c.real ? `<div class="card real-card" style="margin-top:16px"><div class="card-h"><h3>${ic('cpu')}Prática no MySQL real</h3><span class="small muted">${p.real}/${p.realTot} feitas</span></div>
    <p class="small muted" style="margin-top:0">O simulador serve para aprender; o objetivo é usar um servidor MySQL a sério. Faça estas tarefas no seu computador (MySQL Community Server + Workbench) e marque-as à medida que as concluir.</p>
    <ul class="real">${c.real.map((t, k) => `<li><label><input type="checkbox" data-r="${k}" ${(st.real[c.id] || []).includes(k) ? 'checked' : ''}><span>${t}</span></label></li>`).join('')}</ul>
    <div class="row"><button class="btn sec-b sm" data-dl="escola">${ic('download')}escola.sql</button><button class="btn sec-b sm" data-dl="loja">${ic('download')}loja.sql</button><span class="small muted">Scripts para criar as bases de dados de exemplo no seu MySQL.</span></div></div>` : ''}`;
  view.querySelectorAll('[data-r]').forEach((b) => (b.onchange = () => {
    const before = sum(), k = +b.dataset.r, cur = new Set(st.real[c.id] || []);
    if (b.checked) cur.add(k); else cur.delete(k);
    st.real[c.id] = [...cur].sort((x, y) => x - y); touchDay();
    celebrate(before, sum()); vChapter(id);
  }));
  view.querySelectorAll('[data-dl]').forEach((b) => (b.onclick = () => downloadDb(b.dataset.dl)));
}

/* ---------- lição passo a passo ---------- */
function vLesson(id) {
  const f = findLesson(id); if (!f) return vHome();
  const { c: C, l: L, i: idx } = f;
  if (hiddenPage(C)) return;
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
    ${L.intro ? `<div class="lesson-intro">${ic('compass')}<div><b>Enquadramento</b><p>${esc(L.intro)}</p></div></div>` : ''}
    <div id="warm"></div>
    <div id="steps">${shown.map((s, k) => s.t === 'learn' ? `<section class="step learn" data-k="${k}"><div class="step-l">${ic('book')}Conceito ${++nConcept}</div><h2>${esc(s.title)}</h2>${s.html}${s.examples.map((e, j) => codeBlock(e, `<button class="btn" data-copy="${j}" aria-label="Copiar">${ic('copy')}<span class="lbl">Copiar</span></button>${e.run ? `<a class="btn" href="#/lab" data-lab="${j}" aria-label="Abrir no laboratório">${ic('terminal')}<span class="lbl">Laboratório</span></a><button class="btn run" data-run="${j}">${ic('play')}Executar</button>` : ''}`)).join('')}</section>` : `<section class="step practice" data-k="${k}" data-n="${++nEx}"></section>`).join('')}</div>
    <div id="next"></div>
  </article>
  <aside class="toc">${tocHtml(C, L)}</aside></div>`;
  enhance(view);
  view.querySelectorAll('.step.learn').forEach((box) => {
    const s = L.steps[+box.dataset.k];
    box.querySelectorAll('[data-copy]').forEach((b) => (b.onclick = () => { navigator.clipboard?.writeText(s.examples[+b.dataset.copy].sql); toast('Copiado para a área de transferência', 'copy'); }));
    box.querySelectorAll('[data-run]').forEach((b) => (b.onclick = () => { const e = s.examples[+b.dataset.run]; b.closest('.code').querySelector('.out').innerHTML = runSql(D.create(e.db), e.sql); }));
    box.querySelectorAll('[data-lab]').forEach((b) => (b.onclick = () => { const e = s.examples[+b.dataset.lab]; labSql = e.sql; labWhich = e.db || 'escola'; labDb = null; }));
    if (s.viz) box.append(vizEl(s.viz));
  });
  view.querySelectorAll('.step.practice').forEach((box) => {
    const s = L.steps[+box.dataset.k];
    box.append(taskEl(s, +box.dataset.n - 1, () => renderNext(C, L, idx)));
  });
  $('#openManual').onclick = () => openDrawer(C);
  renderNext(C, L, idx);
  renderWarm(C, L, pos);
}

/* ---------- aquecimento: um exercício de uma lição anterior no início de cada lição (prática intercalada) ---------- */
const warmPick = {};
function warmCandidate(C, L) {
  if (warmPick[L.id] !== undefined) return warmPick[L.id] && S.EXS[warmPick[L.id]];
  const due = dueReviews().filter((e) => !L.ex.includes(e));
  let pick = due[0];
  if (!pick) {
    // Exercícios já resolvidos de lições anteriores (de preferência de outros capítulos), sem escolha múltipla simples.
    const pool = [];
    for (const c of CHAPTERS) { if (c.idx > C.idx) break; for (const l of c.lessons) { if (l === L) break; for (const e of l.ex) if (st.done[e.id] && e.t !== 'quiz') pool.push(e); } }
    pick = pool.length >= 3 ? pool[Math.floor(Math.random() * pool.length)] : null;
  }
  warmPick[L.id] = pick ? pick.id : null;
  return pick;
}
function renderWarm(C, L, pos) {
  const box = $('#warm'); if (!box || lessonDone(L)) return;
  const ex = warmCandidate(C, L);
  if (!ex || (pos > 0 && !(st.review[ex.id] && st.review[ex.id].due <= Date.now()))) return;
  const isDue = !!(st.review[ex.id] && st.review[ex.id].due && st.review[ex.id].due <= Date.now());
  const from = findLesson(ex.id.split('.').slice(0, 2).join('.'));
  box.innerHTML = `<div class="warm card"><div class="row" style="justify-content:space-between;gap:10px"><div><div class="eyebrow" style="margin:0">${ic('repeat')}Aquecimento · opcional</div>
    <p class="small muted" style="margin:4px 0 0">${isDue ? 'Um exercício que está na hora de rever' : 'Um exercício de uma lição anterior'}${from ? ` (${esc(from.l.title)})` : ''}. Recordar o que já aprendeu ajuda a fixar a matéria${isDue ? ` e dá +${S.REVIEW_XP} XP` : ''}.</p></div>
    <span class="row" style="gap:6px"><button class="btn sm" id="warmGo">Fazer</button><button class="btn link sm" id="warmSkip">Saltar</button></span></div><div id="warmEx"></div></div>`;
  $('#warmSkip').onclick = () => { warmPick[L.id] = null; box.innerHTML = ''; };
  $('#warmGo').onclick = () => {
    $('#warmGo').remove();
    $('#warmEx').append(taskEl(ex, 0, () => {}, { review: true, label: 'Aquecimento', onResult: (ok, ans) => { if (isDue) reviewResult(ex, ok, ans); else { logTry(ex.id + '.r', ok, ans); persist(); } } }));
  };
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
// Executa uma ou mais instruções e mostra o resultado da última (ou quantas linhas foram afetadas).
function runSql(db, sql) {
  try {
    const r = D.runMany(db, sql);
    if (r.affected !== null && !r.rows.length) return alertBox('ok', 'check', `Instrução executada: ${r.affected} ${r.affected === 1 ? 'linha afetada' : 'linhas afetadas'}.`);
    if (r.count > 1 && !r.rows.length) return alertBox('ok', 'check', `${r.count} instruções executadas.`);
    return table(r.rows);
  } catch (err) { return alertBox('bad', 'alert', `<b>Erro:</b> ${esc(sqlError(err))}`); }
}

/* ---------- visualização da execução de um SELECT (FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT) ---------- */
function vizEl(v) {
  const el = document.createElement('div'); el.className = 'viz';
  const W = v.where ? ` WHERE ${v.where}` : '';
  const steps = [['FROM', `Lê todas as linhas da tabela ${v.from}.`, `SELECT * FROM ${v.from}`]];
  if (v.where) steps.push(['WHERE', `Fica só com as linhas em que ${v.where}. As outras são descartadas antes de agrupar.`, `SELECT * FROM ${v.from}${W}`]);
  if (v.group) steps.push(['GROUP BY', `Junta as linhas com o mesmo valor de ${v.group}: cada cor é um grupo, que vai dar uma só linha no resultado.`, `SELECT * FROM ${v.from}${W} ORDER BY ${v.group}`, 'group']);
  if (v.having) steps.push(['HAVING', `Mantém só os grupos em que ${v.having}. Os outros grupos desaparecem.`, `SELECT * FROM ${v.from}${W} ORDER BY ${v.group}`, 'having']);
  const G = v.group ? ` GROUP BY ${v.group}` : '', H = v.having ? ` HAVING ${v.having}` : '';
  steps.push(['SELECT', `Calcula as colunas pedidas: uma linha por grupo${v.select.includes('AS') ? ', com os nomes dados por AS' : ''}.`, `SELECT ${v.select} FROM ${v.from}${W}${G}${H}`]);
  if (v.order) steps.push(['ORDER BY', `Ordena o resultado por ${v.order}. Pode usar os nomes criados no SELECT, porque o SELECT já foi calculado.`, `SELECT ${v.select} FROM ${v.from}${W}${G}${H} ORDER BY ${v.order}`]);
  if (v.limit) steps.push(['LIMIT', `Só no fim se cortam as linhas: ficam as primeiras ${v.limit}.`, `SELECT ${v.select} FROM ${v.from}${W}${G}${H}${v.order ? ` ORDER BY ${v.order}` : ''} LIMIT ${v.limit}`]);
  const full = [`SELECT ${v.select}`, `FROM ${v.from}`, v.where && `WHERE ${v.where}`, v.group && `GROUP BY ${v.group}`, v.having && `HAVING ${v.having}`, v.order && `ORDER BY ${v.order}`, v.limit && `LIMIT ${v.limit}`].filter(Boolean);
  let k = 0;
  const db = D.create(v.db);
  // Para HAVING: grupos que passam o filtro.
  let keep = null;
  if (v.having) { try { keep = new Set(D.run(db, `SELECT ${v.group} AS g FROM ${v.from}${W}${G}${H}`).map((r) => String(r.g))); } catch { keep = null; } }
  function paint() {
    const [name, text, sql, mode] = steps[k];
    let rows = []; try { rows = D.run(db, sql); } catch { rows = []; }
    const groups = mode ? [...new Set(rows.map((r) => String(r[v.group])))] : [];
    const cols = rows.length ? Object.keys(rows[0]) : [];
    const body = rows.map((r) => {
      const gi = mode ? groups.indexOf(String(r[v.group])) : -1;
      const out = mode === 'having' && keep && !keep.has(String(r[v.group]));
      return `<tr class="${gi >= 0 ? 'g' + (gi % 6) : ''} ${out ? 'out' : ''}">${cols.map((c) => `<td>${r[c] === null ? '<span class="muted">NULL</span>' : esc(typeof r[c] === 'number' ? Math.round(r[c] * 100) / 100 : r[c])}</td>`).join('')}</tr>`;
    }).join('');
    el.innerHTML = `<div class="viz-sql">${full.map((l) => { const on = l.startsWith(name); return `<div class="${on ? 'on' : ''}">${hl(l)}</div>`; }).join('')}</div>
      <div class="viz-steps">${steps.map((x, j) => `<button type="button" class="${j === k ? 'on' : j < k ? 'past' : ''}" data-k="${j}"><span>${j + 1}</span>${x[0]}</button>`).join('')}</div>
      <div class="viz-t"><b>Passo ${k + 1} de ${steps.length} — ${name}.</b> ${esc(text)}</div>
      <div class="res" style="max-height:300px"><table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>
      <div class="row" style="justify-content:space-between;margin-top:10px"><span class="small muted">${rows.length} ${rows.length === 1 ? 'linha' : 'linhas'}${mode === 'having' && keep ? ` · ${rows.filter((r) => keep.has(String(r[v.group]))).length} ficam` : ''}</span>
      <span class="row" style="gap:6px"><button type="button" class="btn sec-b sm" data-go="-1" ${k ? '' : 'disabled'}>${ic('chevL')}Anterior</button><button type="button" class="btn sm" data-go="1" ${k < steps.length - 1 ? '' : 'disabled'}>Seguinte${ic('chevR')}</button></span></div>`;
    el.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => { k = +b.dataset.k; paint(); }));
    el.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { k = Math.max(0, Math.min(steps.length - 1, k + +b.dataset.go)); paint(); }));
  }
  paint();
  return el;
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
function schemaPanel(used, onPick, showViews, db) {
  const SC = D.schemaOf(db);
  const names = [...used, ...Object.keys(SC).filter((t) => !used.includes(t) && (showViews || !SC[t].view))];
  const el = document.createElement('div'); el.className = 'sp';
  let cur = names[0], showData = false;
  function paint() {
    const t = SC[cur], cols = t.cols.map((c) => c[0]);
    const rows = D.rowsOf(db, cur).map((r) => cols.map((c) => r[c]));
    el.innerHTML = `<div class="sp-tabs" role="tablist">${names.map((n) => `<button type="button" role="tab" aria-selected="${n === cur}" class="${n === cur ? 'on' : ''}" data-t="${n}">${ic(SC[n].view ? 'layers' : 'table')}${n}${used.includes(n) ? '<span class="sp-dot" title="Usada nesta pergunta"></span>' : ''}</button>`).join('')}</div>
      <div class="sp-b"><p class="small muted" style="margin:0 0 8px"><b>${cur}</b>${t.view ? ' <span class="chip">vista</span>' : ''} — ${esc(t.desc)}${used.includes(cur) ? ' · <span class="chip acc">usada nesta pergunta</span>' : ''}</p>
      <div class="scroll"><table class="tbl sp-t"><thead><tr><th>Campo</th><th>Tipo</th><th>Chave</th><th>Descrição</th></tr></thead><tbody>
        ${t.cols.map(([c, ty, k, d]) => `<tr><td>${onPick ? `<button type="button" class="sp-col" data-c="${c}" title="Inserir na resposta">${c}</button>` : `<code>${c}</code>`}</td><td class="mono">${ty}</td><td>${k ? `<span class="chip ${k === 'PK' ? 'acc' : ''}">${esc(k)}</span>` : ''}</td><td class="small muted">${esc(d)}</td></tr>`).join('')}</tbody></table></div>
      <div class="row" style="margin-top:10px;justify-content:space-between"><button type="button" class="btn link sm sp-data">${ic(showData ? 'chevL' : 'eye')}${showData ? 'Esconder dados' : `Ver dados (${rows.length} linhas)`}</button>${onPick ? '<span class="small muted">Clique num campo para o inserir na resposta.</span>' : ''}</div>
      ${showData ? `<div class="res" style="max-height:240px"><table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${v === null || v === undefined ? '<span class="muted">NULL</span>' : esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}</div>`;
    el.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { cur = b.dataset.t; paint(); }));
    el.querySelector('.sp-data').onclick = () => { showData = !showData; paint(); };
    if (onPick) el.querySelectorAll('.sp-col').forEach((b) => (b.onclick = () => onPick(b.dataset.c)));
  }
  paint();
  return el;
}

// Estrutura das tabelas (como DESCRIBE) obtida num exercício de criação/alteração de tabelas.
function structureHtml(db, names, title) {
  const ts = DDL.describe(db, names);
  if (!ts.length) return '';
  return `<div class="ddl-out"><div class="small muted" style="margin:10px 0 6px"><b>${esc(title)}</b></div>${ts.map((t) => `<div class="ddl-t"><div class="ddl-n">${ic('table')}${esc(t.name)}</div>
    <div class="res" style="margin-top:6px"><table><thead><tr><th>Campo</th><th>Tipo</th><th>Nulo</th><th>Chave</th><th>Default</th><th>Extra</th></tr></thead><tbody>${t.rows.map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    ${t.extra.length ? `<div class="ddl-x">${t.extra.map((x) => `<code>${esc(x)}</code>`).join('')}</div>` : ''}</div>`).join('')}</div>`;
}

// Etiqueta do tipo de exercício (mostrada no cabeçalho).
const tagOf = (ex) => ex.start ? 'Corrigir o erro' : ex.t === 'quiz' && ex.sql ? 'Qual é o resultado?' : ({ quiz: 'Escolha múltipla', order: 'Ordenar', code: 'Escrever comando', query: 'Consulta SELECT', dml: 'Alterar dados', ddl: ex.loose ? 'Desafio: criar tabelas' : 'Criar/alterar tabelas' }[ex.t]);
const msgList = (msgs) => `<ul class="ddl-msgs">${msgs.slice(0, 5).map((m) => `<li>${m}</li>`).join('')}</ul>${msgs.length > 5 ? `<span class="small">… e mais ${msgs.length - 5} diferença(s).</span>` : ''}`;
const dbChip = (ex) => (ex.db === 'loja' ? `<span class="chip db-chip" title="Este exercício usa a base de dados loja">${ic('database')}BD loja</span>` : '');
// Estado de uma tabela depois de uma instrução INSERT/UPDATE/DELETE.
const dmlTables = (tabs, title) => tabs.map((t) => `<div class="small muted" style="margin:10px 0 6px"><b>${esc(title)}:</b> ${ic('table')}${esc(t.name)}</div>${table(t.rows)}`).join('');

/* Exercício interativo. opt.review: modo revisão (não altera a pontuação normal; opt.onResult recebe o 1.º resultado). */
function taskEl(ex, i, onPass, opt = {}) {
  const el = document.createElement('div');
  const R = !!opt.review;
  function paint(fbHtml) {
    const done = R ? el._ok : st.done[ex.id], rev = R ? el._rev : st.rev[ex.id], a = st.att[ex.id] || { tries: 0, hints: 0 };
    const closed = !!(done || rev);
    el.className = 'task' + (closed ? ' done' : '') + (R ? ' review' : '');
    const chip = R ? (done ? `<span class="chip ok">${ic('check')}Revisto</span>` : rev ? '<span class="chip">Resposta vista</span>' : `<span class="chip">${ic('repeat')}Revisão</span>`)
      : done ? `<span class="chip ok">${ic('check')}+${S.exXp(ex, done.tries, done.hints)} XP</span>` : rev ? '<span class="chip">Resposta consultada · 0 XP</span>' : `<span class="chip">${S.baseOf(ex)} XP</span>`;
    el.innerHTML = `<div class="task-h"><span>${ic(R ? 'repeat' : 'edit')}${opt.label || `Exercício ${i + 1}`} · ${tagOf(ex)}</span><span class="row" style="gap:6px">${dbChip(ex)}${chip}</span></div>
      <div class="task-b"><div class="q">${esc(ex.q)}</div>${ex.t === 'quiz' && ex.sql ? `<div class="code q-code"><pre><code class="hl">${hl(ex.sql)}</code></pre></div>` : ''}<div class="body"></div><div class="fb" aria-live="polite">${fbHtml || ''}</div></div>`;
    const body = el.querySelector('.body'), fb = el.querySelector('.fb');
    // Resultado de uma verificação: no modo normal conta para a pontuação; na revisão só o 1.º resultado conta.
    const result = (ok, answer) => {
      if (!R) return record(ex, ok, answer);
      if (!el._answered) { el._answered = true; opt.onResult && opt.onResult(ok, answer); }
      if (ok) el._ok = true;
    };
    // Mostrar a resposta certa: desbloqueia a lição, mas o exercício deixa de dar XP.
    const answerHtml = () => ex.t === 'quiz'
      ? `<b>Resposta certa:</b> ${esc(ex.opts[ex.a])}. ${esc(ex.why)}${R ? '' : '<br><span class="small">Pode continuar a lição; este exercício já não conta XP.</span>'}`
      : ex.t === 'order' ? `<b>Ordem certa:</b><ol class="ord-sol">${ex.parts.map((x) => `<li><code>${esc(x)}</code></li>`).join('')}</ol>${esc(ex.why || '')}`
      : `<b>Resposta certa:</b><pre class="sol"><code class="hl">${hl(ex.solution)}</code></pre><span class="small">${R ? 'Volta a aparecer na revisão dentro de 1 dia.' : 'Estude-a com atenção. Pode continuar a lição; este exercício já não conta XP.'}</span>`;
    const reveal = () => {
      if (!R && !confirm(`Ver a resposta certa?\n\nPerde os ${S.baseOf(ex)} XP deste exercício, mas pode continuar a lição. O exercício volta a aparecer na página Revisão.`)) return;
      if (R) { el._rev = true; result(false); }
      else { st.rev[ex.id] = 1; logTry(ex.id, false, 'resposta vista'); scheduleReview(ex); touchDay(); persist(); }
      if (!['quiz', 'order'].includes(ex.t)) {
        el._val = ex.solution;
        try {
          if (ex.t === 'query') el._out = table(D.run(D.create(ex.db), ex.solution));
          if (ex.t === 'dml') el._out = dmlTables(D.checkDml(ex.solution, ex).tables, 'Depois da instrução certa');
          if (ex.t === 'ddl') { const r = DDL.check(ex.solution, ex); el._out = structureHtml(r.db, r.touched, 'Estrutura esperada'); }
        } catch { el._out = ''; }
      }
      paint(alertBox('info', 'eye', answerHtml()));
      onPass(); renderChrome();
    };
    const revealBtn = () => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn link sm'; b.innerHTML = ic('eye') + (R ? 'Ver resposta' : `Ver resposta certa (−${S.baseOf(ex)} XP)`); b.onclick = reveal; return b; };
    if (rev && !done && !fbHtml) fb.innerHTML = alertBox('info', 'eye', answerHtml());

    /* --- escolha múltipla (e "qual é o resultado?") --- */
    if (ex.t === 'quiz') {
      body.className = 'body opts';
      const order = el._order || (el._order = ex.opts.map((o, k) => k).sort(() => Math.random() - 0.5));
      order.forEach((k, posi) => {
        const b = document.createElement('button'); b.className = 'opt'; b.disabled = closed;
        b.innerHTML = `<span class="lt">${'ABCD'[posi]}</span><span>${esc(ex.opts[k])}</span>`;
        if (closed && k === ex.a) b.classList.add('good');
        b.onclick = () => {
          if (k === ex.a) { result(true); paint(alertBox('ok', 'checkCircle', `<b>Correto.</b> ${esc(ex.why)}`)); onPass(); }
          else { b.classList.add('wrong'); b.disabled = true; result(false, ex.opts[k]); fb.innerHTML = alertBox('bad', 'x', 'Resposta incorreta. Releia a explicação e tente outra opção.'); }
        };
        body.append(b);
      });
      if (done && !fbHtml) fb.innerHTML = alertBox('ok', 'info', esc(ex.why));
      if (!closed) { const r = document.createElement('div'); r.className = 'reveal-row'; r.append(revealBtn()); body.append(r); }
      return;
    }

    /* --- ordenar as partes --- */
    if (ex.t === 'order') {
      if (!el._pool) { el._pool = ex.parts.map((x, k) => k).sort(() => Math.random() - 0.5); if (el._pool.every((k, j) => k === j)) el._pool.reverse(); el._ans = []; }
      if (closed) { el._ans = ex.parts.map((x, k) => k); el._pool = []; }
      const box = document.createElement('div'); box.className = 'ord';
      box.innerHTML = `<div class="ord-l small muted">A sua ordem (clique numa parte para a devolver):</div>
        <ol class="ord-ans">${el._ans.map((k, j) => `<li><button type="button" class="ord-p in" data-j="${j}" ${closed ? 'disabled' : ''}><code>${esc(ex.parts[k])}</code></button></li>`).join('') || '<li class="ord-empty muted small">Clique nas partes abaixo pela ordem certa.</li>'}</ol>
        ${el._pool.length ? `<div class="ord-l small muted">Partes disponíveis:</div><div class="ord-pool">${el._pool.map((k, j) => `<button type="button" class="ord-p" data-p="${j}"><code>${esc(ex.parts[k])}</code></button>`).join('')}</div>` : ''}`;
      body.append(box);
      box.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => { el._ans.push(el._pool.splice(+b.dataset.p, 1)[0]); paint(); }));
      box.querySelectorAll('[data-j]').forEach((b) => (b.onclick = () => { el._pool.push(el._ans.splice(+b.dataset.j, 1)[0]); paint(); }));
      if (!closed) {
        const tools = document.createElement('div'); tools.className = 'tools';
        const go = document.createElement('button'); go.className = 'btn'; go.innerHTML = ic('check') + 'Verificar'; go.disabled = el._pool.length > 0;
        go.onclick = () => {
          const right = el._ans.findIndex((k, j) => k !== j);
          if (right < 0) { result(true); paint(alertBox('ok', 'checkCircle', `<b>Correto.</b> ${esc(ex.why || '')}`)); onPass(); return; }
          result(false, el._ans.map((k) => ex.parts[k]).join(' | '));
          paint(alertBox('bad', 'x', right ? `Ainda não está certo: as primeiras ${right} ${right === 1 ? 'parte está' : 'partes estão'} no sítio certo. Clique nas seguintes para as devolver e tente de novo.` : 'Ainda não está certo: a primeira parte não é essa. Pense no que tem de acontecer primeiro.'));
        };
        const rs = document.createElement('button'); rs.className = 'btn sec-b'; rs.innerHTML = ic('reset') + 'Recomeçar'; rs.onclick = () => { el._pool.push(...el._ans); el._ans = []; paint(); };
        tools.append(go, rs, revealBtn()); body.append(tools);
      } else if (done && !fbHtml) fb.innerHTML = alertBox('ok', 'info', esc(ex.why || ''));
      return;
    }

    /* --- escrever SQL: code, query, dml, ddl --- */
    const ta = document.createElement('textarea'); ta.className = 'sql'; ta.spellcheck = false; ta.autocapitalize = 'off'; ta.autocomplete = 'off';
    ta.setAttribute('aria-label', 'Resposta SQL');
    ta.placeholder = { query: 'SELECT …', ddl: 'CREATE TABLE … (pode escrever em várias linhas)', dml: 'INSERT / UPDATE / DELETE …' }[ex.t] || 'Escreva aqui o comando…';
    ta.value = el._val ?? (done && !R ? ex.solution : ex.start || '');
    if (ex.t === 'ddl') ta.style.minHeight = ex.loose ? '320px' : '170px';
    if (ex.start) ta.style.minHeight = '110px';
    ta.oninput = () => (el._val = ta.value);
    const out = document.createElement('div'); out.innerHTML = el._out || '';
    const tools = document.createElement('div'); tools.className = 'tools';
    const mk = (label, icon, cls, fn) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.innerHTML = ic(icon) + label; b.onclick = fn; tools.append(b); return b; };
    const check = () => {
      if (!ta.value.trim()) { fb.innerHTML = alertBox('info', 'info', 'Escreva primeiro a sua resposta.'); return; }
      if (ex.start && ta.value.trim() === ex.start.trim()) { fb.innerHTML = alertBox('info', 'info', 'A instrução ainda está igual à original. Encontre o erro e corrija-a antes de verificar.'); return; }
      let ok = false, msgs = [];
      try {
        if (ex.t === 'code') ok = D.checkCode(ta.value, ex);
        else if (ex.t === 'ddl') {
          const r = DDL.check(ta.value, ex); ok = r.ok; msgs = r.msgs;
          out.innerHTML = el._out = structureHtml(r.db, r.touched, 'Estrutura obtida com a sua resposta');
        } else if (ex.t === 'dml') {
          const r = D.checkDml(ta.value, ex); ok = r.ok; msgs = r.msgs;
          out.innerHTML = el._out = dmlTables(r.tables, 'Depois da sua instrução');
        } else { const r = D.check(ta.value, ex); ok = r.ok; msgs = r.msgs; out.innerHTML = el._out = table(r.rows); }
      } catch (err) { out.innerHTML = el._out = ''; result(false, ta.value); fb.innerHTML = alertBox('bad', 'alert', `<b>Erro.</b> ${esc(err instanceof DDL.SqlError ? err.message : sqlError(err))}`); return; }
      if (ok) { result(true); paint(alertBox('ok', 'checkCircle', '<b>Correto.</b>' + ({ query: ' O resultado coincide com o esperado.', ddl: ' A estrutura criada corresponde ao pedido.', dml: ' As tabelas ficaram exatamente como pedido.' }[ex.t] || ''))); onPass(); return; }
      result(false, ta.value);
      fb.innerHTML = alertBox('bad', 'x', msgs.length ? `<b>Ainda não está certo.</b>${msgList(msgs)}` : 'Ainda não está correto. Confira a sintaxe e os nomes utilizados.');
    };
    mk(ex.t === 'query' ? 'Executar e verificar' : 'Verificar', 'check', '', check);
    if (ex.t === 'query') mk('Executar', 'play', 'sec-b', () => { out.innerHTML = el._out = runSql(D.create(ex.db), ta.value); });
    let sp = null;
    const toggleSchema = () => {
      el._schema = !el._schema;
      if (sp) { sp.remove(); sp = null; }
      if (el._schema) { sp = schemaPanel(D.tablesIn(ex.solution, ex.db), (c) => insertAt(ta, c), false, ex.db); body.insertBefore(sp, ta); }
      sb.innerHTML = ic('table') + (el._schema ? 'Esconder estrutura' : 'Estrutura das tabelas');
    };
    const sb = ['query', 'dml'].includes(ex.t) ? mk('Estrutura das tabelas', 'table', 'sec-b', toggleSchema) : null;
    if (ex.t === 'query' && !closed) mk('Resultado esperado', 'eye', 'sec-b', () => {
      el._exp = !el._exp;
      const old = body.querySelector('.expected'); if (old) old.remove();
      if (el._exp) { const d = document.createElement('div'); d.className = 'expected'; try { d.innerHTML = `<div class="small muted" style="margin:10px 0 6px"><b>Resultado esperado</b> (compare com o seu; os nomes das colunas podem ser diferentes)${ex.ordered ? ' · a ordem das linhas conta' : ''}</div>` + table(D.run(D.create(ex.db), ex.solution)); } catch { d.innerHTML = ''; } out.before(d); }
    });
    if (!closed) mk(`Dica${R ? '' : ` (−${S.HINT_COST} XP)`}`, 'bulb', 'link sm', () => { if (!R) { a.hints = Math.min(a.hints + 1, 9); st.att[ex.id] = a; persist(); } fb.innerHTML = alertBox('info', 'bulb', esc(ex.hint)); });
    if (!closed) tools.append(revealBtn());
    const k = document.createElement('span'); k.className = 'small muted kb'; k.innerHTML = '<span class="kbd">Ctrl</span> + <span class="kbd">Enter</span>'; tools.append(k);
    ta.onkeydown = (ev) => { if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') { ev.preventDefault(); check(); } };
    if (ex.t === 'ddl' && ex.setup) { const pre = document.createElement('div'); pre.className = 'ddl-setup'; pre.innerHTML = `<div class="small muted">${ic('table')}Tabelas que já existem:</div><pre><code class="hl">${hl(ex.setup)}</code></pre>`; body.append(pre); }
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
    ${c.lessons.map((l, i) => `<section class="m-sec" id="m-${i}"><h2><span class="m-no">${C2(c, i)}</span>${esc(l.title)}</h2>${l.intro ? `<p class="m-intro">${esc(l.intro)}</p>` : ''}
      ${l.steps.filter((s) => s.t === 'learn').map((s) => `<h3>${esc(s.title)}</h3><div class="prose">${s.html}</div>${s.examples.map((e) => codeBlock(e)).join('')}`).join('')}</section>`).join('')}
  </div>`;
}
const C2 = (c, i) => `${c.idx + 1}.${i + 1}`;
function vManual(id) {
  const c = CHAPTERS.find((x) => x.id === id); if (!c) return vHome();
  if (hiddenPage(c)) return;
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

/* ---------- miniteste: perguntas sorteadas de um banco + exercícios práticos ---------- */
let quizRun = null;
// Corrige uma resposta do miniteste (escolha múltipla ou exercício prático).
function gradeItem(x, ans) {
  const q = x.q;
  if (q.t === 'quiz') return ans === q.a;
  if (!ans || !String(ans).trim()) return false;
  try {
    if (q.t === 'code') return D.checkCode(ans, q);
    if (q.t === 'query') return D.check(ans, q).ok;
    if (q.t === 'dml') return D.checkDml(ans, q).ok;
    if (q.t === 'ddl') return DDL.check(ans, q).ok;
  } catch { return false; }
  return false;
}
function vTest(id) {
  const c = CHAPTERS.find((x) => x.id === id); if (!c) return vHome();
  if (hiddenPage(c)) return;
  crumbs = [['Conteúdos', '#/learn'], [`Capítulo ${c.idx + 1}`, '#/c/' + c.id], ['Miniteste', '#/t/' + c.id]];
  const p = sum().perChapter[c.id];
  const nQuiz = Math.min(TEST_DRAW.quiz, c.test.length), nPrac = Math.min(TEST_DRAW.practice, (c.practice || []).length);
  const head = `<div class="page-h"><div><div class="eyebrow">Avaliação · Capítulo ${pad2(c.idx + 1)}</div><h1>Miniteste: ${esc(c.title)}</h1></div></div>`;
  if (!p.unlocked) {
    const left = c.lessons.filter((l) => !lessonDone(l));
    view.innerHTML = head + `<div class="card locked-card"><span class="side-i">${ic('lock')}</span><div><h2>Miniteste bloqueado</h2><p class="muted">Conclua primeiro todas as lições do capítulo. Em falta: ${left.map((l) => `<b>${esc(l.title)}</b>`).join(', ')}.</p><a class="btn" href="#/c/${c.id}">Ver lições</a></div></div>`;
    return;
  }
  if (!quizRun || quizRun.c !== c) {
    view.innerHTML = head + `<div class="card test-intro"><div class="ti-grid">
      <div><span>Perguntas</span><b>${nQuiz + nPrac}</b></div><div><span>Tipo</span><b>${nQuiz} escolha múltipla${nPrac ? ` + ${nPrac} práticas` : ''}</b></div><div><span>Aprovação</span><b>${PASS_MARK}%</b></div><div><span>Melhor resultado</span><b>${p.test.attempts ? p.test.best + '%' : '—'}</b></div></div>
      <p class="muted">As perguntas são sorteadas de um banco de ${c.test.length} perguntas e ${(c.practice || []).length} exercícios práticos, por isso cada tentativa é diferente. Nos exercícios práticos escreve o SQL; ${nPrac ? 'nas consultas pode executar para ver o resultado, mas a correção só é feita no fim. ' : ''}As respostas certas só são mostradas quando for aprovado — até lá, verá apenas quais as perguntas que errou. Conta o melhor resultado. ${p.test.passed ? '' : `Ao ser aprovado, o capítulo fica concluído e recebe <b>+${S.CHAPTER_BONUS} XP</b>.`}</p>
      <div class="row"><button class="btn" id="start">${ic('play')}${p.test.attempts ? 'Repetir miniteste' : 'Iniciar miniteste'}</button><a class="btn sec-b" href="#/m/${c.id}">${ic('book')}Rever o manual primeiro</a></div></div>`;
    $('#start').onclick = () => {
      const qs = shuffle(c.test).slice(0, nQuiz).map((q) => ({ q, order: shuffle(q.opts.map((o, k) => k)) }));
      const pr = shuffle(c.practice || []).slice(0, nPrac).map((q) => ({ q, practice: true }));
      quizRun = { c, qs: [...qs, ...pr], i: 0, ans: [] };
      vTest(id);
    };
    return;
  }
  const r = quizRun;
  if (r.i < r.qs.length) {
    const x = r.qs[r.i], q = x.q;
    const top = `<div class="row" style="justify-content:space-between;margin-bottom:8px"><span class="small muted">Pergunta ${r.i + 1} de ${r.qs.length}${x.practice ? ' · exercício prático' : ''}</span><button class="btn link sm" id="quit">Abandonar</button></div>${bar(pctOf(r.i, r.qs.length))}`;
    const nav = `<div class="row" style="justify-content:space-between;margin-top:18px">${r.i ? `<button class="btn sec-b" id="prev">${ic('chevL')}Anterior</button>` : '<span></span>'}<button class="btn" id="nextQ" ${r.ans[r.i] === undefined || r.ans[r.i] === '' ? 'disabled' : ''}>${r.i === r.qs.length - 1 ? 'Terminar e corrigir' : 'Seguinte'} ${ic('chevR')}</button></div>`;
    if (!x.practice) {
      view.innerHTML = head + `<div class="card test-q">${top}<h2 style="margin:20px 0 16px">${esc(q.q)}</h2>${q.sql ? `<div class="code q-code"><pre><code class="hl">${hl(q.sql)}</code></pre></div>` : ''}<div class="opts">${x.order.map((k, j) => `<button class="opt ${r.ans[r.i] === k ? 'sel' : ''}" data-k="${k}"><span class="lt">${'ABCD'[j]}</span><span>${esc(q.opts[k])}</span></button>`).join('')}</div>${nav}</div>`;
      view.querySelectorAll('.opt').forEach((b) => (b.onclick = () => { r.ans[r.i] = +b.dataset.k; view.querySelectorAll('.opt').forEach((y) => y.classList.toggle('sel', y === b)); $('#nextQ').disabled = false; }));
    } else {
      view.innerHTML = head + `<div class="card test-q">${top}<div class="row" style="margin:18px 0 6px;gap:8px"><span class="chip acc">${tagOf(q)}</span>${dbChip(q)}</div><h2 style="margin:6px 0 14px">${esc(q.q)}</h2>
        ${q.setup ? `<div class="ddl-setup"><div class="small muted">${ic('table')}Tabelas que já existem:</div><pre><code class="hl">${hl(q.setup)}</code></pre></div>` : ''}
        <textarea class="sql" id="tans" spellcheck="false" style="min-height:${q.t === 'ddl' ? 200 : 120}px" aria-label="Resposta SQL"></textarea>
        <div class="tools">${['query', 'dml'].includes(q.t) ? `<button class="btn sec-b" id="tsch">${ic('table')}Estrutura das tabelas</button>` : ''}${q.t === 'query' ? `<button class="btn sec-b" id="trun">${ic('play')}Executar</button>` : ''}<span class="small muted">A resposta só é corrigida no fim do miniteste.</span></div><div id="tout"></div>${nav}</div>`;
      const ta = $('#tans'); ta.value = r.ans[r.i] || '';
      ta.oninput = () => { r.ans[r.i] = ta.value; $('#nextQ').disabled = !ta.value.trim(); };
      if ($('#trun')) $('#trun').onclick = () => { $('#tout').innerHTML = runSql(D.create(q.db), ta.value); };
      if ($('#tsch')) $('#tsch').onclick = () => { const o = $('#tout'); o.innerHTML = ''; o.append(schemaPanel(D.tablesIn(q.solution, q.db), (cl) => insertAt(ta, cl), false, q.db)); };
    }
    $('#nextQ').onclick = () => { r.i++; if (r.i === r.qs.length) finishTest(r); vTest(id); window.scrollTo(0, 0); };
    if ($('#prev')) $('#prev').onclick = () => { r.i--; vTest(id); };
    $('#quit').onclick = () => { if (confirm('Abandonar o miniteste? As respostas não serão guardadas.')) { quizRun = null; location.hash = '#/c/' + c.id; } };
    return;
  }
  const res = r.res, ok = res.filter(Boolean).length, score = pctOf(ok, r.qs.length), pass = score >= PASS_MARK;
  const ansText = (x, k) => (x.practice ? `<pre class="sol"><code class="hl">${hl(r.ans[k] || '')}</code></pre>` : `<span class="chip ${res[k] ? 'ok' : 'bad'}">${esc(x.q.opts[r.ans[k]])}</span>`);
  const right = (x) => (x.practice ? `<pre class="sol"><code class="hl">${hl(x.q.solution)}</code></pre>` : `<span class="chip ok">${esc(x.q.opts[x.q.a])}</span>`);
  view.innerHTML = head + `<div class="card result ${pass ? 'pass' : 'fail'}"><div class="score"><b>${score}%</b><span>${ok} de ${r.qs.length} certas</span></div>
    <div><h2>${pass ? 'Aprovado' : 'Ainda não foi desta'}</h2><p class="muted">${pass ? (r.firstPass ? `O capítulo <b>${esc(c.title)}</b> está concluído. Recebeu +${S.CHAPTER_BONUS} XP.` : 'Miniteste aprovado.') : `Precisa de pelo menos ${PASS_MARK}% para concluir o capítulo. Veja abaixo as perguntas que errou, reveja essa matéria no manual e tente de novo — as perguntas serão outras.`}</p>
    <div class="row">${pass ? (visibleCh().find((x) => x.idx > c.idx) ? `<a class="btn" href="#/c/${visibleCh().find((x) => x.idx > c.idx).id}">Capítulo seguinte ${ic('chevR')}</a>` : '<a class="btn" href="#/progress">Ver progresso</a>') : `<button class="btn" id="again">${ic('reset')}Repetir miniteste</button>`}<a class="btn sec-b" href="#/m/${c.id}">${ic('book')}Rever manual</a></div></div></div>
    <div class="sec"><h2>${pass ? 'Correção' : 'Resultado por pergunta'}</h2>${pass ? '' : `<p class="small muted">As respostas certas só são mostradas depois de ser aprovado, para que o miniteste continue a medir o que sabe.</p>`}
    ${r.qs.map((x, k) => `<div class="review ${res[k] ? 'ok' : 'bad'}"><div class="rv-h">${ic(res[k] ? 'checkCircle' : 'x')}<b>${k + 1}. ${esc(x.q.q)}</b></div>
      ${x.q.sql ? `<pre class="sol"><code class="hl">${hl(x.q.sql)}</code></pre>` : ''}
      <p class="small">A sua resposta: ${ansText(x, k)}</p>${pass ? `<p class="small">Resposta correta: ${right(x)}</p>${x.q.why ? `<p class="small muted">${esc(x.q.why)}</p>` : ''}` : ''}</div>`).join('')}</div>`;
  if ($('#again')) $('#again').onclick = () => { quizRun = null; vTest(id); $('#start').click(); };
}
function finishTest(r) {
  const c = r.c;
  r.res = r.qs.map((x, k) => gradeItem(x, r.ans[k]));
  const ok = r.res.filter(Boolean).length, score = pctOf(ok, r.qs.length);
  const before = sum(), prev = st.tests[c.id] || { best: 0, attempts: 0 };
  st.tests[c.id] = { best: Math.max(prev.best || 0, score), attempts: (prev.attempts || 0) + 1, at: Date.now(), ...(prev.passAt ? { passAt: prev.passAt } : score >= PASS_MARK ? { passAt: Date.now() } : {}) };
  // Cada pergunta errada fica no histórico (com a resposta), para o professor ver as dificuldades.
  r.qs.forEach((x, k) => { if (!r.res[k]) logTry(x.q.id, false, x.practice ? r.ans[k] : x.q.opts[r.ans[k]]); });
  st.log.push({ at: Date.now(), id: c.id + '.teste', ok: score >= PASS_MARK, score }); st.log = st.log.slice(-500);
  touchDay();
  const after = sum();
  r.firstPass = !before.perChapter[c.id].test.passed && after.perChapter[c.id].test.passed;
  if (r.firstPass) setTimeout(() => toast(`Capítulo concluído · +${S.CHAPTER_BONUS} XP`, 'award'), 300);
  celebrate(before, after);
}

/* ---------- laboratório ---------- */
let labDb = null, labWhich = 'escola', labSql = 'SELECT * FROM alunos;';
// Descarrega o script MySQL de uma BD de exemplo, para a usar num servidor MySQL real.
function downloadDb(which) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([D.toMySQL(which)], { type: 'text/plain' })); a.download = which + '.sql'; a.click(); }
function vLab() {
  crumbs = [['Laboratório SQL', '#/lab']];
  if (!labDb) labDb = D.create(labWhich);
  const sc = D.schemaOf(labWhich);
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Prática livre</div><h1>Laboratório SQL</h1><p>Execute instruções sobre as bases de dados de exemplo. Os dados ficam apenas no seu dispositivo e podem ser repostos a qualquer momento.</p></div></div>
  <div class="card"><div class="card-h"><div class="seg" role="tablist" aria-label="Base de dados">${Object.values(D.DBS).map((d) => `<button class="${d.title === labWhich ? 'on' : ''}" data-db="${d.title}" title="${esc(d.desc)}">${ic('database')}${d.title}</button>`).join('')}</div>
    <span class="row" style="gap:8px"><button class="btn sec-b sm" id="schemaBtn">${ic('table')}Estrutura das tabelas</button><button class="btn sec-b sm" id="reset">${ic('reset')}Repor dados</button><button class="btn sec-b sm" id="dl" title="Script para criar esta BD num servidor MySQL real">${ic('download')}${labWhich}.sql</button></span></div>
  <p class="small muted" style="margin:0 0 10px">${esc(D.DBS[labWhich].desc)}</p><div id="labSchema"></div>
  <div class="schema">${Object.entries(sc).map(([t, x]) => `<span><b>${t}</b> (${x.cols.map((c) => c[0]).join(', ')})</span>`).join('')}</div>
  <textarea class="sql" id="labq" spellcheck="false" style="min-height:150px" aria-label="Instrução SQL"></textarea>
  <div class="tools"><button class="btn" id="go">${ic('play')}Executar</button><span class="small muted kb"><span class="kbd">Ctrl</span> + <span class="kbd">Enter</span></span><span class="small muted">Pode executar várias instruções separadas por <code>;</code></span></div>
  <div id="labout"></div></div>
  <p class="small muted" style="margin-top:12px">${ic('info')} O motor do laboratório simula o MySQL no browser: SELECT (com JOIN, GROUP BY, subconsultas, UNION, CASE e funções de texto e datas), INSERT, UPDATE, DELETE, CREATE TABLE e CREATE VIEW. Algumas funções específicas do MySQL podem não estar disponíveis — para isso, descarregue o script e use um servidor MySQL real.</p>`;
  const q = $('#labq'); q.value = labSql;
  view.querySelectorAll('[data-db]').forEach((b) => (b.onclick = () => {
    if (b.dataset.db === labWhich) return;
    labWhich = b.dataset.db; labDb = null;
    labSql = labWhich === 'loja' ? 'SELECT * FROM encomendas ORDER BY data DESC LIMIT 10;' : 'SELECT * FROM alunos;';
    vLab();
  }));
  $('#schemaBtn').onclick = () => {
    const box = $('#labSchema'), open = !box.firstChild;
    box.innerHTML = ''; if (open) box.append(schemaPanel(D.tablesIn(q.value, labWhich), (c) => insertAt(q, c), true, labWhich));
    $('#schemaBtn').innerHTML = ic('table') + (open ? 'Esconder estrutura' : 'Estrutura das tabelas');
  };
  const go = () => { labSql = q.value; $('#labout').innerHTML = runSql(labDb, q.value); touchDay(); persist(); };
  $('#go').onclick = go; q.onkeydown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); go(); } };
  $('#reset').onclick = () => { labDb = D.create(labWhich); $('#labout').innerHTML = alertBox('ok', 'check', 'Dados de exemplo repostos.'); };
  $('#dl').onclick = () => downloadDb(labWhich);
}

/* ---------- revisão espaçada ---------- */
let revRun = null;
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const exPlace = (ex) => { const f = findLesson(ex.id.split('.').slice(0, 2).join('.')); return f ? `Capítulo ${f.c.idx + 1} · ${f.l.title}` : ''; };
function vRev() {
  crumbs = [['Revisão', '#/rev']];
  const items = Object.entries(st.review).filter(([id]) => S.EXS[id]);
  const due = dueReviews(), later = items.filter(([, r]) => r.due && r.due > Date.now()), mastered = items.filter(([, r]) => !r.due);
  const head = `<div class="page-h"><div><div class="eyebrow">Revisão espaçada</div><h1>Revisão</h1><p>Os exercícios em que teve dificuldade (várias tentativas, dicas ou resposta vista) voltam a aparecer ao fim de 1, 3, 7 e 14 dias. Cada revisão certa vale +${S.REVIEW_XP} XP e afasta a próxima; um erro volta a pô-lo no início.</p></div></div>`;
  if (revRun && revRun.i < revRun.list.length) {
    const ex = revRun.list[revRun.i];
    view.innerHTML = head + `<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><span class="small muted">${revRun.free ? 'Treino livre' : 'Revisão'} ${revRun.i + 1} de ${revRun.list.length} · ${esc(exPlace(ex))}</span><button class="btn link sm" id="revQuit">Terminar</button></div>${bar(pctOf(revRun.i, revRun.list.length))}<div id="revEx" style="margin-top:14px"></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" id="revNext" disabled>${revRun.i === revRun.list.length - 1 ? 'Terminar' : 'Seguinte'} ${ic('chevR')}</button></div></div>`;
    const next = $('#revNext');
    $('#revEx').append(taskEl(ex, 0, () => (next.disabled = false), { review: true, label: revRun.free ? 'Treino' : 'Revisão', onResult: (ok, ans) => { revRun.res.push(ok); next.disabled = false; if (revRun.free) { logTry(ex.id + '.r', ok, ans); persist(); } else reviewResult(ex, ok, ans); } }));
    next.onclick = () => { revRun.i++; vRev(); window.scrollTo(0, 0); };
    $('#revQuit').onclick = () => { revRun = null; vRev(); };
    return;
  }
  let summary = '';
  if (revRun) { const ok = revRun.res.filter(Boolean).length; summary = alertBox('ok', 'checkCircle', `<b>Sessão concluída.</b> ${ok} de ${revRun.list.length} certas à primeira.`); revRun = null; }
  const solved = Object.keys(st.done).filter((id) => S.EXS[id] && S.EXS[id].t !== 'quiz');
  const row = ([id, r]) => { const e = S.EXS[id]; return `<tr><td class="small">${esc(exPlace(e))}</td><td class="small">${esc(e.q.length > 90 ? e.q.slice(0, 90) + '…' : e.q)}</td><td><span class="chip">${r.due ? `Caixa ${r.box}` : 'Dominado'}</span></td><td class="small muted" style="white-space:nowrap">${r.due ? new Date(r.due).toLocaleDateString('pt-PT') : '—'}</td></tr>`; };
  view.innerHTML = head + summary + `<div class="kpis" style="margin-top:${summary ? 16 : 0}px">
    <div class="kpi"><div class="l">${ic('repeat')}Para hoje</div><div class="v">${due.length}</div><div class="s">exercícios a rever</div></div>
    <div class="kpi"><div class="l">${ic('clipboard')}Agendadas</div><div class="v">${later.length}</div><div class="s">para os próximos dias</div></div>
    <div class="kpi"><div class="l">${ic('award')}Dominados</div><div class="v">${mastered.length}</div><div class="s">passaram as 4 revisões</div></div>
    <div class="kpi"><div class="l">${ic('zap')}XP de revisão</div><div class="v">${items.reduce((n, [, r]) => n + S.reviewXp(r), 0)}</div><div class="s">${sum().reviews} revisões certas</div></div></div>
  <div class="two" style="margin-top:16px">
    <div class="card side-card"><span class="side-i">${ic('repeat')}</span><div><h3>Revisão de hoje</h3><p class="small muted">${due.length ? `Tem ${due.length} ${due.length === 1 ? 'exercício' : 'exercícios'} à sua espera, de várias lições misturadas — é assim que a matéria fica na memória.` : 'Não há revisões para hoje. Volte amanhã ou faça um treino livre.'}</p>${due.length ? `<button class="btn" id="revGo">${ic('play')}Começar revisão</button>` : ''}</div></div>
    <div class="card side-card"><span class="side-i">${ic('target')}</span><div><h3>Treino livre</h3><p class="small muted">Cinco exercícios aleatórios já resolvidos, de lições diferentes. Não altera a pontuação.</p>${solved.length >= 3 ? `<button class="btn sec-b" id="revFree">${ic('play')}Treinar</button>` : '<span class="chip">Resolva primeiro alguns exercícios</span>'}</div></div></div>
  <div class="card" style="margin-top:16px"><div class="card-h"><h3>Exercícios em revisão</h3><span class="small muted">${items.length}</span></div>
    ${items.length ? `<div class="scroll" style="max-height:360px"><table class="tbl"><thead><tr><th>Lição</th><th>Exercício</th><th>Estado</th><th>Próxima</th></tr></thead><tbody>${items.sort((a, b) => (a[1].due || 9e15) - (b[1].due || 9e15)).map(row).join('')}</tbody></table></div>` : '<div class="empty">Ainda não há exercícios em revisão. Os exercícios em que precisar de várias tentativas, de dicas ou de ver a resposta aparecem aqui.</div>'}</div>`;
  if ($('#revGo')) $('#revGo').onclick = () => { revRun = { list: shuffle(due).slice(0, 10), i: 0, res: [] }; vRev(); };
  if ($('#revFree')) $('#revFree').onclick = () => { revRun = { list: shuffle(solved).slice(0, 5).map((id) => S.EXS[id]), i: 0, res: [], free: true }; vRev(); };
}

/* ---------- projeto final (ponte para o MySQL real) ---------- */
const PROJECT_REQ = [
  ['Pelo menos 4 tabelas', (t) => (t.match(/\bcreate\s+table\b/gi) || []).length >= 4],
  ['Chaves primárias em todas as tabelas', (t) => (t.match(/\bprimary\s+key\b/gi) || []).length >= (t.match(/\bcreate\s+table\b/gi) || []).length && /\bprimary\s+key\b/i.test(t)],
  ['Pelo menos 3 chaves estrangeiras', (t) => (t.match(/\bforeign\s+key\b|\breferences\b/gi) || []).length >= 3],
  ['Uma relação N:M (chave primária composta)', (t) => /primary\s+key\s*\(\s*\w+\s*,\s*\w+/i.test(t)],
  ['Uma restrição CHECK', (t) => /\bcheck\s*\(/i.test(t)],
  ['Dados de exemplo (INSERT)', (t) => (t.match(/\binsert\s+into\b/gi) || []).length >= 4],
  ['Consultas com JOIN', (t) => /\bjoin\b/i.test(t)],
  ['Consultas com GROUP BY', (t) => /\bgroup\s+by\b/i.test(t)],
  ['Uma subconsulta', (t) => /\(\s*select\b/i.test(t)],
  ['Uma vista (CREATE VIEW)', (t) => /\bcreate\s+(or\s+replace\s+)?view\b/i.test(t)],
  ['Um índice (CREATE INDEX)', (t) => /\bcreate\s+(unique\s+)?index\b/i.test(t)],
  ['Um utilizador com privilégios limitados (CREATE USER + GRANT)', (t) => /\bcreate\s+user\b/i.test(t) && /\bgrant\b/i.test(t)],
  ['O comando de backup (mysqldump)', (t) => /\bmysqldump\b/i.test(t)],
];
function vProject() {
  crumbs = [['Projeto final', '#/projeto']];
  const pj = st.project || {};
  const reqs = PROJECT_REQ.map(([t, f]) => [t, f(pj.script || '')]);
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Ponte para o MySQL real</div><h1>Projeto final</h1><p>Aplique tudo o que aprendeu num servidor MySQL a sério e entregue o resultado ao professor.</p></div>
    ${pj.sent ? `<span class="chip ok">${ic('check')}Entregue em ${new Date(pj.at).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}</span>` : ''}</div>
  <div class="two">
    <div class="card"><h3>O desafio</h3><div class="prose small">
      <p>Escolha um tema do seu interesse (clube desportivo, clínica, biblioteca, loja, escola de música…) e, <b>num servidor MySQL instalado no seu computador</b>:</p>
      <ol><li>Escreva os requisitos em 5–10 frases e identifique as entidades e relações.</li>
      <li>Crie a base de dados e as tabelas, normalizadas, com chaves primárias e estrangeiras, uma relação N:M, restrições (NOT NULL, UNIQUE, CHECK) e as regras ON DELETE adequadas.</li>
      <li>Insira dados de exemplo (pelo menos 5 linhas nas tabelas principais).</li>
      <li>Escreva 8 consultas que respondam a perguntas reais do tema, incluindo JOIN, GROUP BY/HAVING e uma subconsulta.</li>
      <li>Crie uma vista, um índice justificado e um utilizador com privilégios mínimos.</li>
      <li>Faça o backup com <code>mysqldump</code> e teste o restauro numa base de dados nova.</li></ol>
      <p>Cole abaixo o script completo e o resultado das consultas (copiado do terminal ou do Workbench). O professor vê a sua entrega na Área do professor.</p></div></div>
    <div class="card"><div class="card-h"><h3>Verificação automática</h3><span class="small muted">${reqs.filter((r) => r[1]).length}/${reqs.length}</span></div>
      <ul class="req">${reqs.map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${ic(ok ? 'checkCircle' : 'circle')}<span>${esc(t)}</span></li>`).join('')}</ul>
      <p class="small muted">A verificação só procura as instruções no script; quem avalia o projeto é o professor.</p></div>
  </div>
  <form class="card" id="pjf" style="margin-top:16px">
    <label class="field">Tema do projeto<input class="txt" id="pjTitle" maxlength="120" value="${esc(pj.title || '')}" placeholder="Ex.: Gestão de um clube de ténis"></label>
    <label class="field">Script SQL completo (CREATE, INSERT, consultas, vista, índice, utilizador, comando de backup)<textarea class="sql" id="pjScript" maxlength="30000" style="min-height:260px">${esc(pj.script || '')}</textarea></label>
    <label class="field">Resultado das consultas no MySQL (copie do terminal ou do Workbench)<textarea class="sql" id="pjOut" maxlength="30000" style="min-height:160px">${esc(pj.output || '')}</textarea></label>
    <label class="field">Notas para o professor (dificuldades, decisões tomadas)<textarea class="txt" id="pjNotes" maxlength="2000" rows="3">${esc(pj.notes || '')}</textarea></label>
    <div class="row"><button class="btn sec-b" type="button" id="pjSave">${ic('check')}Guardar rascunho</button><button class="btn" type="submit">${ic('upload')}${pj.sent ? 'Atualizar entrega' : 'Entregar ao professor'}</button>
    ${BK.user ? '' : '<span class="small muted">Para o professor ver a entrega, inicie sessão na página <a href="#/me">Perfil</a>.</span>'}</div>
  </form>`;
  const grab = () => ({ ...st.project, title: $('#pjTitle').value.trim().slice(0, 120), script: $('#pjScript').value.slice(0, 30000), output: $('#pjOut').value.slice(0, 30000), notes: $('#pjNotes').value.slice(0, 2000), at: Date.now() });
  $('#pjSave').onclick = () => { st.project = grab(); persist(); toast('Rascunho guardado'); vProject(); };
  $('#pjf').onsubmit = (e) => {
    e.preventDefault();
    const p = grab();
    if (!p.title || p.script.trim().length < 200) { toast('Indique o tema e cole o script completo antes de entregar.', 'alert'); return; }
    const before = sum();
    st.project = { ...p, sent: true }; touchDay(); logTry('projeto', true);
    celebrate(before, sum()); toast(BK.user ? 'Projeto entregue ao professor' : 'Projeto guardado. Inicie sessão para o professor o poder ver.', 'checkCircle'); vProject();
  };
}

/* ---------- progresso ---------- */
function logLabel(e) {
  if (e.id.startsWith('nexus.')) { const r = window.GAME.LEVELS.find((l) => 'nexus.' + l.id === e.id); return { code: 'Protocolo NEXUS', text: r ? `Sala concluída: ${r.name}` : '' }; }
  if (e.id.endsWith('.teste')) { const c = CHAPTERS.find((x) => x.id === e.id.split('.')[0]); return { code: 'Miniteste', text: c ? c.title : '' }; }
  if (e.id === 'projeto') return { code: 'Projeto final', text: 'Projeto entregue ao professor' };
  const short = (q) => (q.length > 80 ? q.slice(0, 80) + '…' : q);
  const m = e.id.match(/^(\w+)\.([tp])(\d+)$/);
  if (m) { const c = CHAPTERS.find((x) => x.id === m[1]); const q = c && (m[2] === 't' ? c.test : c.practice || [])[m[3] - 1]; return { code: 'Miniteste', text: q ? short(q.q) : '' }; }
  const rv = e.id.endsWith('.r'), x = S.EXS[rv ? e.id.slice(0, -2) : e.id];
  return { code: rv ? 'Revisão' : e.id, text: x ? short(x.q) : '' };
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
  <div class="card" style="margin-top:16px"><div class="card-h"><h3>Progresso por capítulo</h3></div><div class="scroll"><table class="tbl"><thead><tr><th>Capítulo</th><th style="width:28%">Progresso</th><th>Lições</th><th>Exercícios</th><th>Miniteste</th></tr></thead><tbody>${visibleCh().map((c) => { const p = s.perChapter[c.id]; return `<tr><td><a href="#/c/${c.id}" style="color:inherit">${c.idx + 1}. ${esc(c.title)}</a></td><td>${bar(p.pct, p.complete ? 'ok' : '')}</td><td class="small">${p.lessonsOk}/${p.lessons}</td><td class="small">${p.ok}/${p.tot}</td><td>${p.test.attempts ? `<span class="chip ${p.test.passed ? 'ok' : 'bad'}">${p.test.best}% · ${p.test.passed ? 'Aprovado' : 'Não aprovado'}</span>` : p.unlocked ? '<span class="chip acc">Disponível</span>' : '<span class="chip">Bloqueado</span>'}</td></tr>`; }).join('')}</tbody></table></div></div>
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
let rankMode = 'all', rankTurma = '';
async function vRank() {
  crumbs = [['Classificação', '#/rank']];
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Desempenho</div><h1>Classificação</h1><p>Compare a sua evolução com a dos restantes alunos.</p></div><div class="row" id="rkTools"></div></div><div class="card" id="rk" style="padding:0"><div class="empty">A carregar…</div></div>`;
  try {
    const all = await BK.leaderboard();
    if (!location.hash.startsWith('#/rank')) return;
    const me = (BK.user ? BK.user.name : '').toLowerCase();
    const turmas = [...new Set(all.map((r) => r.turma).filter(Boolean))].sort();
    if (rankTurma && !turmas.includes(rankTurma)) rankTurma = '';
    const week = rankMode === 'week';
    const rows = all.filter((r) => !rankTurma || r.turma === rankTurma).filter((r) => !week || r.weekXp > 0).sort((a, b) => (week ? b.weekXp - a.weekXp : 0) || b.xp - a.xp);
    $('#rkTools').innerHTML = `<div class="seg" role="tablist"><button class="${week ? '' : 'on'}" data-m="all">Geral</button><button class="${week ? 'on' : ''}" data-m="week">Esta semana</button></div>
      ${turmas.length ? `<select class="txt sel" id="rkT" aria-label="Turma"><option value="">Todas as turmas</option>${turmas.map((t) => `<option ${t === rankTurma ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>` : ''}`;
    $('#rk').outerHTML = (BK.user ? '' : `<div style="margin-bottom:16px">${alertBox('info', 'info', 'Crie uma conta na página <a href="#/me">Perfil</a> para aparecer na classificação.')}</div>`) +
      (week ? `<p class="small muted" style="margin:-4px 0 12px">XP ganho nos últimos 7 dias: todos começam do zero cada semana.</p>` : '') +
      `<div class="card" style="padding:0">${rows.length ? `<div class="scroll"><table class="tbl"><thead><tr><th style="width:60px">#</th><th>Aluno</th>${turmas.length ? '<th>Turma</th>' : ''}<th>Nível</th><th class="r">${week ? 'XP da semana' : 'XP'}</th><th style="width:22%">Conclusão</th><th class="r">Sequência</th></tr></thead><tbody>${rows.map((r, i) => `<tr class="${r.name.toLowerCase() === me ? 'me' : ''}"><td><span class="pos ${i < 3 ? 'p' + (i + 1) : ''}">${i + 1}</span></td><td><span class="who"><span class="avatar">${esc(initials(r.name))}</span><b>${esc(r.name)}</b></span></td>${turmas.length ? `<td class="small muted">${esc(r.turma || '—')}</td>` : ''}<td>${r.level} <span class="small muted">${esc(S.titleOf(r.level))}</span></td><td class="r"><b>${week ? r.weekXp : r.xp}</b></td><td><div class="row" style="flex-wrap:nowrap">${bar(r.pct)}<span class="small muted num-t" style="min-width:36px">${r.pct}%</span></div></td><td class="r">${r.streak} d</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty">${week ? 'Ainda ninguém ganhou XP esta semana.' : 'Ainda não há alunos na classificação.'}</div>`}</div>`;
    view.querySelectorAll('.tbl .bar').forEach((b) => (b.style.flex = '1'));
    view.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { rankMode = b.dataset.m; vRank(); }));
    if ($('#rkT')) $('#rkT').onchange = () => { rankTurma = $('#rkT').value; vRank(); };
  } catch (e) { $('#rk').outerHTML = alertBox('bad', 'alert', `Não foi possível obter a classificação. ${esc(BK.errorText(e))} O seu progresso continua guardado neste dispositivo.`); }
}

function vMe() {
  crumbs = [['Perfil', '#/me']];
  const s = sum(), sbMode = BK.kind === 'supabase', u = BK.user;
  const prefs = `<div class="card"><h3>Preferências e dados</h3><p class="small muted">Nível ${s.level} · ${s.xp} XP · ${s.exDone} exercícios resolvidos.</p>
    <div class="row"><button class="btn sec-b" id="theme">${ic('moon')}Alternar tema</button>${u ? '' : `<button class="btn danger" id="reset">${ic('trash')}Apagar progresso local</button>`}</div>
    ${BK.kind === 'server' ? '<p class="small muted" style="margin-top:14px"><a href="#/prof">Área do professor</a> (com a chave de professor do servidor)</p>' : ''}</div>`;
  let acct;
  if (u) {
    acct = `<div class="who" style="margin-bottom:14px"><span class="avatar" style="width:44px;height:44px">${esc(initials(u.name))}</span><span><b>${esc(u.name)}</b><span>${esc(u.email || 'Sessão iniciada')}${u.admin ? ' · Gestor do site' : u.teacher ? ' · Professor' : ''}</span></span></div>
    <p class="small muted">O progresso é guardado na sua conta e pode ser retomado em qualquer dispositivo.</p>${online === false ? alertBox('bad', 'alert', 'Sem ligação neste momento. A sincronização será feita mais tarde.') : ''}
    ${u.teacher ? '' : `<form id="tf" class="row" style="align-items:flex-end;margin-top:10px"><label class="field" style="margin:0;flex:1">Turma (indicada pelo professor, ex.: 12.º B)<input class="txt" id="turma" maxlength="30" value="${esc(u.turma || '')}"></label><button class="btn sec-b" type="submit">Guardar turma</button></form>`}
    <div class="row" style="margin-top:14px"><button class="btn" id="sync">${ic('refresh')}Sincronizar</button><button class="btn sec-b" id="out">${ic('logout')}Terminar sessão</button>${u.teacher ? `<a class="btn sec-b" href="#/prof">${ic('users')}Área do professor</a>` : ''}</div>`;
  } else if (sbMode) {
    const reg = meTab === 'reg';
    acct = `<div class="seg" role="tablist"><button class="${reg ? '' : 'on'}" data-tab="in">Iniciar sessão</button><button class="${reg ? 'on' : ''}" data-tab="reg">Criar conta</button></div>
    <form id="authf" novalidate>
      ${reg ? '<label class="field">Nome (aparece na classificação)<input class="txt" id="nm" maxlength="24" autocomplete="nickname" required></label><label class="field">Turma (opcional, ex.: 12.º B)<input class="txt" id="tu" maxlength="30"></label>' : ''}
      <label class="field">Email<input class="txt" id="em" type="email" autocomplete="email" required></label>
      <label class="field">Palavra-passe${reg ? ' (mín. 6 caracteres)' : ''}<input class="txt" id="pw" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" required></label>
      <div class="row"><button class="btn" type="submit">${reg ? 'Criar conta' : 'Entrar'}</button>${reg ? '' : '<button class="btn link sm" type="button" id="forgot">Esqueci-me da palavra-passe</button>'}</div>
      <p class="small muted" style="margin:12px 0 0">O progresso já feito neste dispositivo é juntado à sua conta.</p><div id="msg"></div></form>`;
  } else {
    acct = `<h3>Criar perfil ou iniciar sessão</h3><p class="small muted">O nome é visível na classificação. O progresso já realizado neste dispositivo é mantido.</p>
    <form id="authf"><label class="field">Nome<input class="txt" id="nm" maxlength="24" autocomplete="username" value="${esc(st.name)}"></label>
    <label class="field">PIN ou palavra-passe (mín. 4 caracteres)<input class="txt" id="pw" type="password" autocomplete="current-password"></label>
    <label class="field">Turma (opcional, só ao criar perfil)<input class="txt" id="tu" maxlength="30"></label>
    <div class="row"><button class="btn" type="button" id="reg">Criar perfil</button><button class="btn sec-b" type="submit">Iniciar sessão</button></div><div id="msg"></div></form>`;
  }
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Conta</div><h1>Perfil</h1></div></div><div class="two"><div class="card">${acct}</div>${prefs}</div>`;
  const msg = (kind, icon, html) => { $('#msg').innerHTML = alertBox(kind, icon, html); };
  const entered = async (user) => { meTab = 'in'; st.name = user.name; persist(); await push(); toast('Sessão iniciada'); route(); };
  const busyT = async (fn) => { try { await fn(); } catch (e) { toast(BK.errorText(e), 'alert'); } };
  const busy = async (fn) => { const b = view.querySelectorAll('#authf .btn'); b.forEach((x) => (x.disabled = true)); try { await fn(); } catch (e) { msg('bad', 'alert', esc(BK.errorText(e))); } finally { b.forEach((x) => (x.disabled = false)); } };
  if (u) {
    if ($('#tf')) $('#tf').onsubmit = (e) => { e.preventDefault(); busyT(async () => { await BK.setTurma($('#turma').value); toast('Turma guardada'); vMe(); }); };
    $('#sync').onclick = async () => { await push(); toast(online ? 'Progresso sincronizado' : 'Sem ligação', online ? 'check' : 'alert'); vMe(); };
    $('#out').onclick = async () => {
      if (!confirm('Terminar sessão? O progresso fica guardado na sua conta e é removido deste dispositivo.')) return;
      await push(); await BK.logout();
      Object.assign(st, { name: '', ...EMPTY() }); persist(); route();
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
          const r = await BK.register({ name, email, password, turma: $('#tu').value });
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
      const user = kind === 'reg' ? (await BK.register({ name, password, state: payload(), turma: $('#tu').value })).user : await BK.login({ name, password });
      await entered(user);
    });
    $('#authf').onsubmit = (e) => { e.preventDefault(); go('in'); };
    $('#reg').onclick = () => go('reg');
  }
  $('#theme').onclick = () => $('#themeBtn').click();
  if ($('#reset')) $('#reset').onclick = () => { if (confirm('Apagar todo o progresso guardado neste dispositivo?')) { Object.assign(st, EMPTY()); persist(); route(); } };
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
let profRows = null, profSort = 'xp', profTurma = '', profAll = false;
// Dificuldades: por exercício, quantos acertaram à primeira, quantos viram a resposta e quais os erros mais comuns.
function difficulty(rows) {
  const stat = {};
  const get = (id) => stat[id] || (stat[id] = { who: new Set(), done: 0, first: 0, rev: 0, wrong: 0, ans: new Map() });
  for (const r of rows) {
    const s = r.state || {}, done = s.done || {};
    for (const [id, d] of Object.entries(done)) if (S.EXS[id]) { const x = get(id); x.who.add(r.name); x.done++; if ((d.tries || 1) <= 1) x.first++; }
    for (const id of Object.keys(s.rev || {})) if (S.EXS[id] && !done[id]) { const x = get(id); x.who.add(r.name); x.rev++; }
    for (const e of s.log || []) {
      if (e.ok || /\.r$|\.teste$|^nexus\.|^projeto$/.test(e.id)) continue;
      const x = get(e.id); x.who.add(r.name); x.wrong++;
      if (e.a && e.a !== 'resposta vista') {
        const k = e.a.toLowerCase().replace(/\s+/g, ' ').replace(/\s*;\s*$/, '');
        const o = x.ans.get(k) || { n: 0, t: e.a, who: new Set() }; o.n++; o.who.add(r.name); x.ans.set(k, o);
      }
    }
  }
  return stat;
}
function difficultyHtml(rows) {
  const stat = difficulty(rows);
  const label = (id) => { const e = logLabel({ id }); return e.text; };
  const place = (id) => { const m = id.match(/^(\w+)\./); const c = m && CHAPTERS.find((x) => x.id === m[1]); return c ? `C${c.idx + 1}` : ''; };
  const ex = Object.entries(stat).filter(([id, x]) => S.EXS[id] && x.who.size).map(([id, x]) => ({ id, x, firstPct: x.done + x.rev ? pctOf(x.first, x.done + x.rev) : 0 }))
    .sort((a, b) => a.firstPct - b.firstPct || b.x.wrong - a.x.wrong);
  const tq = Object.entries(stat).filter(([id, x]) => /\.[tp]\d+$/.test(id) && x.wrong).sort((a, b) => b[1].wrong - a[1].wrong).slice(0, 10);
  const answers = (x) => { const top = [...x.ans.values()].sort((a, b) => b.who.size - a.who.size || b.n - a.n).slice(0, 5); return top.length ? `<div class="ans-list">${top.map((o) => `<div><span class="chip">${o.who.size} ${o.who.size === 1 ? 'aluno' : 'alunos'}</span><code>${esc(o.t)}</code></div>`).join('')}</div>` : '<p class="small muted">Sem respostas erradas registadas.</p>'; };
  const list = profAll ? ex : ex.slice(0, 12);
  return `<div class="card" style="margin-top:16px"><div class="card-h"><h3>${ic('target')}Exercícios com mais dificuldade</h3><span class="small muted">${ex.length} exercícios com atividade</span></div>
    ${ex.length ? `<p class="small muted" style="margin-top:0">Ordenados pela percentagem de alunos que acertaram à primeira. Clique numa linha para ver as respostas erradas mais comuns — úteis para preparar a aula seguinte.</p>
    <div class="scroll"><table class="tbl diff"><thead><tr><th>Cap.</th><th>Exercício</th><th class="r">Alunos</th><th class="r">À 1.ª</th><th class="r">Viram a resposta</th><th class="r">Erros</th></tr></thead><tbody>
    ${list.map(({ id, x, firstPct }) => `<tr class="dr" data-id="${id}"><td class="small muted">${place(id)}</td><td class="small">${esc(label(id))} <span class="muted mono">${id}</span></td><td class="r">${x.who.size}</td><td class="r"><span class="chip ${firstPct >= 70 ? 'ok' : firstPct < 40 ? 'bad' : ''}">${firstPct}%</span></td><td class="r">${x.rev}</td><td class="r">${x.wrong}</td></tr><tr class="dx" data-for="${id}" hidden><td></td><td colspan="5">${answers(x)}</td></tr>`).join('')}</tbody></table></div>
    ${ex.length > 12 ? `<button class="btn link sm" id="diffAll">${profAll ? 'Mostrar só os 12 mais difíceis' : `Mostrar todos (${ex.length})`}</button>` : ''}` : '<div class="empty">Ainda não há tentativas registadas.</div>'}</div>
  ${tq.length ? `<div class="card" style="margin-top:16px"><div class="card-h"><h3>${ic('clipboard')}Perguntas dos minitestes mais erradas</h3></div><div class="scroll"><table class="tbl diff"><thead><tr><th>Cap.</th><th>Pergunta</th><th class="r">Alunos</th><th class="r">Erros</th></tr></thead><tbody>
    ${tq.map(([id, x]) => `<tr class="dr" data-id="${id}"><td class="small muted">${place(id)}</td><td class="small">${esc(label(id))}</td><td class="r">${x.who.size}</td><td class="r">${x.wrong}</td></tr><tr class="dx" data-for="${id}" hidden><td></td><td colspan="3">${answers(x)}</td></tr>`).join('')}</tbody></table></div></div>` : ''}`;
}
async function vProf() {
  crumbs = [['Área do professor', '#/prof']];
  const head = `<div class="page-h"><div><div class="eyebrow">Acompanhamento</div><h1>Área do professor</h1><p>Evolução de todos os alunos inscritos.</p></div><div class="row" id="profTools"></div></div>`;
  if (BK.kind === 'supabase' && !(BK.user && BK.user.teacher)) {
    view.innerHTML = head + `<div class="card locked-card"><span class="side-i">${ic('lock')}</span><div><h2>Acesso reservado</h2><p class="muted">Esta área só está disponível para contas de professor. ${BK.user ? 'Se é professor, peça ao gestor do site que atribua esse perfil à sua conta.' : 'Se é professor, inicie sessão na página <a href="#/me">Perfil</a>.'}</p><a class="btn sec-b" href="#/">Voltar ao painel</a></div></div>`;
    return;
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
  const turmas = [...new Set(profRows.map((r) => r.turma).filter(Boolean))].sort();
  if (profTurma && !turmas.includes(profTurma)) profTurma = '';
  const rows = profRows.filter((r) => !profTurma || r.turma === profTurma).sort(profSort === 'name' ? (a, b) => a.name.localeCompare(b.name) : profSort === 'recent' ? (a, b) => b.updated - a.updated : (a, b) => b.s.xp - a.s.xp);
  const n = rows.length, avg = (f) => (n ? Math.round(rows.reduce((k, r) => k + f(r), 0) / n) : 0);
  const week = Date.now() - 7 * 864e5;
  view.innerHTML = head + `<div class="kpis" style="margin-top:0">
    <div class="kpi"><div class="l">${ic('users')}Alunos</div><div class="v">${n}</div><div class="s">${rows.filter((r) => r.updated > week).length} ativos nos últimos 7 dias</div></div>
    <div class="kpi"><div class="l">${ic('checkCircle')}Conclusão média</div><div class="v">${avg((r) => r.s.pct)}%</div><div class="s">do curso</div></div>
    <div class="kpi"><div class="l">${ic('clipboard')}Minitestes</div><div class="v">${rows.reduce((k, r) => k + r.s.testsPassed, 0)}</div><div class="s">aprovações no total</div></div>
    <div class="kpi"><div class="l">${ic('zap')}XP médio</div><div class="v">${avg((r) => r.s.xp)}</div><div class="s">por aluno · ${rows.filter((r) => r.s.projectSent).length} projetos entregues</div></div></div>
  <div class="card" style="margin-top:16px;padding:0">${n ? `<div class="scroll"><table class="tbl prof"><thead><tr><th>Aluno</th>${turmas.length ? '<th>Turma</th>' : ''}<th>Nível</th><th class="r">XP</th><th style="width:18%">Conclusão</th>${CHAPTERS.map((c) => `<th class="c" title="${esc(c.title)}">C${c.idx + 1}</th>`).join('')}<th>Última atividade</th></tr></thead><tbody>
    ${rows.map((r, i) => `<tr class="pr" data-i="${i}"><td><span class="who"><span class="avatar">${esc(initials(r.name))}</span><b>${esc(r.name)}</b>${r.s.projectSent ? ` <span class="chip ok" title="Projeto final entregue">${ic('folder')}</span>` : ''}</span></td>${turmas.length ? `<td class="small muted">${esc(r.turma || '—')}</td>` : ''}<td>${r.s.level}</td><td class="r"><b>${r.s.xp}</b></td><td><div class="row" style="flex-wrap:nowrap">${bar(r.s.pct)}<span class="small muted num-t" style="min-width:36px">${r.s.pct}%</span></div></td>
      ${CHAPTERS.map((c) => { const p = r.s.perChapter[c.id]; return `<td class="c">${p.test.passed ? `<span class="chip ok" title="Miniteste aprovado">${p.test.best}%</span>` : p.test.attempts ? `<span class="chip bad" title="Melhor resultado no miniteste">${p.test.best}%</span>` : `<span class="small muted" title="Lições concluídas">${p.lessonsOk}/${p.lessons}</span>`}</td>`; }).join('')}
      <td class="small muted" style="white-space:nowrap">${r.updated ? new Date(r.updated).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Ainda não há alunos inscritos.</div>'}</div>
  ${BK.user && BK.user.admin ? '<div id="chVis"></div><div id="sitePass"></div><div id="adminBox"></div>' : ''}
  <p class="small muted" style="margin-top:10px">Colunas C1–C${CHAPTERS.length}: resultado do miniteste de cada capítulo (verde = aprovado) ou lições concluídas. Clique num aluno para ver o detalhe.</p><div id="profDetail"></div>
  ${difficultyHtml(rows)}`;
  if (BK.user && BK.user.admin) { renderChapterVis(); renderSitePass(); renderAdmin(); }
  view.querySelectorAll('tr.dr').forEach((tr) => (tr.onclick = () => { const d = view.querySelector(`tr.dx[data-for="${tr.dataset.id}"]`); d.hidden = !d.hidden; tr.classList.toggle('me', !d.hidden); }));
  if ($('#diffAll')) $('#diffAll').onclick = () => { profAll = !profAll; vProf(); };
  $('#profTools').innerHTML = `${turmas.length ? `<select class="txt sel" id="pturma" aria-label="Turma"><option value="">Todas as turmas</option>${turmas.map((t) => `<option ${t === profTurma ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>` : ''}<select class="txt sel" id="psort" aria-label="Ordenar"><option value="xp">Ordenar por XP</option><option value="name">Ordenar por nome</option><option value="recent">Mais recentes</option></select><button class="btn sec-b sm" id="prefresh">${ic('refresh')}Atualizar</button><button class="btn sec-b sm" id="pcsv">${ic('download')}Exportar CSV</button>`;
  $('#psort').value = profSort;
  $('#psort').onchange = () => { profSort = $('#psort').value; vProf(); };
  if ($('#pturma')) $('#pturma').onchange = () => { profTurma = $('#pturma').value; vProf(); };
  $('#prefresh').onclick = () => { profRows = null; adminUsers = null; vProf(); };
  $('#pcsv').onclick = () => {
    const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const head2 = ['aluno', 'turma', 'nivel', 'xp', 'conclusao_pct', 'exercicios', 'licoes', 'capitulos_concluidos', ...CHAPTERS.map((c) => `miniteste_${c.id}`), 'ultima_atividade'];
    const lines = rows.map((r) => [q(r.name), q(r.turma || ''), r.s.level, r.s.xp, r.s.pct, r.s.exDone, r.s.lessonsDone.length, r.s.chaptersDone.length, ...CHAPTERS.map((c) => (r.s.perChapter[c.id].test.attempts ? r.s.perChapter[c.id].test.best : '')), r.updated ? new Date(r.updated).toISOString() : ''].join(','));
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + [head2.join(','), ...lines].join('\n')], { type: 'text/csv' })); a.download = 'alunos-mysql-academy.csv'; a.click();
  };
  view.querySelectorAll('tr.pr').forEach((tr) => (tr.onclick = () => {
    const r = rows[+tr.dataset.i];
    view.querySelectorAll('tr.pr').forEach((x) => x.classList.toggle('me', x === tr));
    $('#profDetail').innerHTML = `<div class="card" style="margin-top:16px"><div class="card-h"><h3>${esc(r.name)}</h3><span class="small muted">Nível ${r.s.level} · ${r.s.xp} XP · ${r.s.exDone} exercícios · ${r.s.firstTry} à 1.ª tentativa</span></div>
      <div class="scroll"><table class="tbl"><thead><tr><th>Capítulo</th><th>Lições</th><th>Exercícios</th><th>Miniteste</th></tr></thead><tbody>${CHAPTERS.map((c) => { const p = r.s.perChapter[c.id]; return `<tr><td>${c.idx + 1}. ${esc(c.title)}</td><td>${p.lessonsOk}/${p.lessons}</td><td>${p.ok}/${p.tot}</td><td>${p.test.attempts ? `<span class="chip ${p.test.passed ? 'ok' : 'bad'}">${p.test.best}% · ${p.test.attempts} ${p.test.attempts === 1 ? 'tentativa' : 'tentativas'}</span>` : '—'}</td></tr>`; }).join('')}</tbody></table></div>
      <p class="small muted">Revisões certas: ${r.s.reviews} · Prática no MySQL real: ${CHAPTERS.map((c) => `C${c.idx + 1} ${r.s.perChapter[c.id].real}/${r.s.perChapter[c.id].realTot}`).join(' · ')}</p>
      ${r.state.project && r.state.project.sent ? `<h3 style="margin-top:18px">${ic('folder')}Projeto final: ${esc(r.state.project.title || '')}</h3><p class="small muted">Entregue em ${new Date(r.state.project.at).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })} · requisitos encontrados no script: ${PROJECT_REQ.filter(([, f]) => f(r.state.project.script || '')).length}/${PROJECT_REQ.length}</p>
        <details class="pj"><summary>Script SQL</summary><pre class="sol"><code class="hl">${hl(r.state.project.script || '')}</code></pre></details>
        <details class="pj"><summary>Resultado das consultas</summary><pre class="sol">${esc(r.state.project.output || '')}</pre></details>${r.state.project.notes ? `<p class="small"><b>Notas do aluno:</b> ${esc(r.state.project.notes)}</p>` : ''}` : ''}
      <h3 style="margin-top:18px">Últimas atividades</h3>${(r.state.log || []).length ? `<div class="scroll" style="max-height:300px"><table class="tbl"><tbody>${r.state.log.slice(-30).reverse().map((e) => { const x = logLabel(e); return `<tr><td class="small muted" style="white-space:nowrap">${new Date(e.at).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}</td><td style="font-family:var(--mono);font-size:.8rem">${esc(x.code)}</td><td class="small">${esc(x.text)}</td><td>${e.score !== undefined ? `<span class="chip ${e.ok ? 'ok' : 'bad'}">${e.score}%</span>` : e.ok ? '<span class="chip ok">Correto</span>' : `<span class="chip bad">Incorreto</span>${e.a ? `<div class="small muted mono" style="margin-top:4px;max-width:340px;overflow-wrap:anywhere">${esc(e.a)}</div>` : ''}`}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="muted small">Sem atividade registada.</p>'}</div>`;
    $('#profDetail').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}
/* ---------- gestor do site: capítulos visíveis para os alunos ---------- */
function renderChapterVis() {
  const box = $('#chVis'); if (!box) return;
  const draft = new Set(hiddenCh);
  const paint = () => {
    const changed = [...draft].sort().join() !== [...hiddenCh].sort().join();
    box.innerHTML = `<div class="card" style="margin-top:16px"><div class="card-h"><h3>${ic('eye')}Capítulos visíveis para os alunos</h3><span class="small muted">${CHAPTERS.length - draft.size} de ${CHAPTERS.length} visíveis</span></div>
      <p class="small muted" style="margin-top:0">Oculte os capítulos que a turma ainda não deve abordar, para controlar o ritmo. Os alunos deixam de ver os capítulos ocultos (no painel, nos conteúdos, nos manuais e nos minitestes); o progresso que já tenham feito mantém-se. Os professores continuam a ver todos os capítulos.</p>
      <div class="ch-vis">${CHAPTERS.map((c) => `<label class="${draft.has(c.id) ? 'off' : ''}"><input type="checkbox" data-ch="${c.id}" ${draft.has(c.id) ? '' : 'checked'}><span class="no">${pad2(c.idx + 1)}</span><span><b>${esc(c.title)}</b><span class="small muted">${draft.has(c.id) ? 'Oculto aos alunos' : 'Visível'}</span></span></label>`).join('')}</div>
      <div class="row" style="margin-top:12px"><button class="btn" id="chSave" ${changed ? '' : 'disabled'}>${ic('check')}Guardar</button><button class="btn sec-b sm" id="chAll">Mostrar todos</button>
      ${changed ? '<span class="small muted">Alterações por guardar.</span>' : ''}</div></div>`;
    box.querySelectorAll('[data-ch]').forEach((b) => (b.onchange = () => { if (b.checked) draft.delete(b.dataset.ch); else draft.add(b.dataset.ch); paint(); }));
    $('#chAll').onclick = () => { draft.clear(); paint(); };
    $('#chSave').onclick = async () => {
      $('#chSave').disabled = true;
      try { await BK.setHiddenChapters([...draft]); setHidden([...draft]); toast(draft.size ? `${draft.size} ${draft.size === 1 ? 'capítulo oculto' : 'capítulos ocultos'} aos alunos` : 'Todos os capítulos estão visíveis'); paint(); }
      catch (e) { toast(BK.errorText(e), 'alert'); paint(); }
    };
  };
  paint();
}

/* ---------- gestor do site: palavra-passe de acesso ao site ---------- */
function renderSitePass() {
  const box = $('#sitePass'); if (!box || !BK.setSitePassword) return;
  box.innerHTML = `<div class="card" style="margin-top:16px"><div class="card-h"><h3>${ic('lock')}Palavra-passe de acesso ao site</h3></div>
    <p class="small muted" style="margin-top:0">O site só abre a quem introduzir esta palavra-passe; só depois os alunos podem criar conta ou iniciar sessão. Ao mudá-la, todas as pessoas (incluindo quem já tinha entrado) terão de introduzir a nova palavra-passe — comunique-a aos alunos antes de a mudar. As maiúsculas contam.</p>
    <form id="spf" class="row" style="align-items:flex-end;gap:10px">
      <label class="field" style="margin:0;flex:1;min-width:180px">Nova palavra-passe<input class="txt" id="sp1" type="password" autocomplete="new-password" minlength="4" required></label>
      <label class="field" style="margin:0;flex:1;min-width:180px">Repetir<input class="txt" id="sp2" type="password" autocomplete="new-password" minlength="4" required></label>
      <button class="btn" type="submit">${ic('check')}Mudar palavra-passe</button></form></div>`;
  $('#spf').onsubmit = async (e) => {
    e.preventDefault();
    const a = $('#sp1').value, b = $('#sp2').value;
    if (a.trim().length < 4) return toast('A palavra-passe deve ter pelo menos 4 caracteres.', 'alert');
    if (a !== b) return toast('As duas palavras-passe não coincidem.', 'alert');
    if (!confirm('Mudar a palavra-passe de acesso ao site?\n\nTodos os alunos terão de introduzir a nova palavra-passe.')) return;
    try { await BK.setSitePassword(a); $('#spf').reset(); toast('Palavra-passe de acesso alterada'); }
    catch (err) { toast(BK.errorText(err), 'alert'); }
  };
}

/* ---------- gestor do site: atribuir o perfil de professor ---------- */
let adminUsers = null, adminQ = '';
async function renderAdmin() {
  const box = $('#adminBox'); if (!box) return;
  const paint = () => {
    const q = adminQ.trim().toLowerCase();
    const list = (adminUsers || []).filter((u) => !q || [u.name, u.email, u.turma].some((x) => String(x || '').toLowerCase().includes(q)));
    box.innerHTML = `<div class="card" style="margin-top:16px"><div class="card-h"><h3>${ic('shield')}Gestão de professores</h3><span class="small muted">${(adminUsers || []).filter((u) => u.is_teacher).length} professores · ${(adminUsers || []).length} contas</span></div>
      <p class="small muted" style="margin-top:0">Como gestor do site, pode dar ou retirar o perfil de professor a qualquer conta. Os professores veem esta área com os alunos e as dificuldades, mas não podem gerir professores. A conta tem de ser criada primeiro pela própria pessoa, na página Perfil.</p>
      <input class="txt" id="admQ" placeholder="Procurar por nome, email ou turma" value="${esc(adminQ)}" style="width:100%;margin-bottom:10px">
      ${adminUsers === null ? '<div class="empty">A carregar contas…</div>' : list.length ? `<div class="scroll" style="max-height:420px"><table class="tbl"><thead><tr><th>Nome</th><th>Email</th><th>Turma</th><th>Perfil</th><th></th></tr></thead><tbody>
      ${list.map((u) => `<tr><td><b>${esc(u.name)}</b></td><td class="small">${esc(u.email || '')}</td><td class="small muted">${esc(u.turma || '—')}</td>
        <td>${u.is_admin ? '<span class="chip acc">Gestor</span>' : u.is_teacher ? '<span class="chip ok">Professor</span>' : '<span class="chip">Aluno</span>'}</td>
        <td class="r">${u.is_admin ? '' : `<button class="btn ${u.is_teacher ? 'sec-b' : ''} sm" data-adm="${u.id}" data-t="${u.is_teacher ? 0 : 1}">${u.is_teacher ? 'Retirar professor' : 'Tornar professor'}</button>`}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Nenhuma conta encontrada.</div>'}</div>`;
    const qi = $('#admQ'); qi.oninput = () => { adminQ = qi.value; const pos = qi.selectionStart; paint(); const n = $('#admQ'); n.focus(); n.setSelectionRange(pos, pos); };
    box.querySelectorAll('[data-adm]').forEach((b) => (b.onclick = async () => {
      const u = adminUsers.find((x) => x.id === b.dataset.adm), make = b.dataset.t === '1';
      if (!confirm(make ? `Dar o perfil de professor a ${u.name} (${u.email})?\n\nPassa a ver os dados de todos os alunos.` : `Retirar o perfil de professor a ${u.name}?`)) return;
      b.disabled = true;
      try { await BK.setTeacher(u.id, make); u.is_teacher = make; profRows = null; toast(make ? `${u.name} é agora professor` : `${u.name} deixou de ser professor`); vProf(); }
      catch (e) { b.disabled = false; toast(BK.errorText(e), 'alert'); }
    }));
  };
  paint();
  if (adminUsers === null) {
    try { adminUsers = await BK.adminUsers(); } catch (e) { adminUsers = []; toast(BK.errorText(e), 'alert'); }
    if ($('#adminBox')) paint();
  }
}
const enhanceCode = (root) => root.querySelectorAll('pre > code:not(.hl)').forEach((c) => { c.innerHTML = hl(c.textContent); c.classList.add('hl'); });

/* ---------- Protocolo NEXUS (jogo 3D) ---------- */
let gameCtl = null;
const gameSupported = () => {
  const desktop = matchMedia('(pointer: fine)').matches && innerWidth >= 900;
  let webgl = false; try { const c = document.createElement('canvas'); webgl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { /* sem WebGL */ }
  return { desktop, webgl };
};
function vGame() {
  crumbs = [['Protocolo NEXUS', '#/jogo']];
  const G = window.GAME, done = (st.game && st.game.done) || {};
  const next = G.LEVELS.findIndex((l) => !done[l.id]);
  const all = next < 0, sup = gameSupported();
  view.innerHTML = `<div class="nx-hero"><div class="nx-hero-in">
      <div class="eyebrow" style="color:#7dd3fc">Jogo · aplicar SQL</div><h1>${esc(G.STORY.title)}</h1>
      ${G.STORY.intro.map((p) => `<p>${esc(p)}</p>`).join('')}
      <div class="row" style="margin-top:18px">${sup.desktop && sup.webgl ? `<button class="btn" id="nxPlay">${ic('play')}${all ? 'Jogar de novo' : next > 0 ? `Continuar na sala ${next + 1}` : 'Iniciar missão'}</button>${next > 0 || all ? '<button class="btn sec-b" id="nxRestart">Recomeçar do início</button>' : ''}` : ''}</div>
      ${!sup.webgl ? alertBox('bad', 'alert', 'Este browser não suporta gráficos 3D (WebGL). Experimente uma versão recente do Chrome, Edge ou Firefox.') : !sup.desktop ? alertBox('info', 'info', 'O Protocolo NEXUS foi pensado para computador, com teclado e rato. Abra a MySQL Academy num computador para jogar.') : ''}
    </div></div>
    <div class="two" style="margin-top:16px">
      <div class="card"><div class="card-h"><h3>Salas da missão — parte 1</h3><span class="small muted">${Object.keys(done).filter((k) => G.LEVELS.some((l) => l.id === k)).length}/${G.LEVELS.length}</span></div>
        <div class="list" style="box-shadow:none">${G.LEVELS.map((l, i) => { const d = done[l.id]; return `<div class="item lesson-i"><span class="status ${d ? 'done' : i === next ? 'part' : ''}">${d ? ic('check') : i + 1}</span><span><b>${esc(l.name)}</b><span class="d">Treina: ${esc(l.skill)}</span></span><span class="chip ${d ? 'ok' : ''}">${d ? `+${S.roomXp(l, d)} XP` : `${l.xp} XP`}</span><span></span></div>`; }).join('')}
          <div class="item lesson-i locked"><span class="status">${ic('lock')}</span><span><b>Energia, hangar, segurança e núcleo da NEXUS</b><span class="d">Em preparação (parte 2)</span></span><span class="chip">Brevemente</span><span></span></div></div></div>
      <div class="card"><h3>Como se joga</h3>
        <ul class="nx-how"><li><span class="kbd">W</span><span class="kbd">A</span><span class="kbd">S</span><span class="kbd">D</span> mover · <b>rato</b> olhar · <span class="kbd">Shift</span> correr</li>
        <li><span class="kbd">E</span> usar terminais e painéis das portas</li>
        <li><span class="kbd">Q</span> pulso EMP: imobiliza os drones durante 8 segundos (recolha as cápsulas azuis)</li>
        <li><span class="kbd">Esc</span> pausa, qualidade gráfica e sensibilidade do rato</li></ul>
        <p class="small muted">Em cada sala, use o terminal para consultar ou alterar a base de dados e descobrir como abrir a porta. Cada sala vale XP (−5 por dica; sem XP se vir a solução). Se um drone o detetar, volta à entrada da sala.</p></div>
    </div>`;
  const go = (start) => openGame(start);
  if ($('#nxPlay')) $('#nxPlay').onclick = () => go(all ? 0 : Math.max(0, next));
  if ($('#nxRestart')) $('#nxRestart').onclick = () => go(0);
}
async function openGame(startRoom) {
  const root = document.createElement('div'); root.id = 'gameRoot'; root.innerHTML = '<div class="gx-loading">A carregar a estação Órion…</div>';
  document.body.append(root); document.body.classList.add('in-game');
  try {
    const { startGame } = await import('./game/game.js');
    const G = window.GAME; st.game = st.game || { done: {} };
    const settings = st.game.settings || {};
    root.innerHTML = '';
    gameCtl = startGame(root, {
      levels: G.LEVELS, story: G.STORY, startRoom,
      doneRooms: Object.keys(st.game.done), quality: settings.quality, sensitivity: settings.sensitivity,
      ui: { esc, table, sqlError },
      onRoomDone(id, info) {
        st.game.done = st.game.done || {};
        if (st.game.done[id]) return; // repetir uma sala não volta a dar XP
        const before = sum();
        st.game.done[id] = { at: Date.now(), hints: info.hints, rev: info.rev };
        st.log.push({ at: Date.now(), id: 'nexus.' + id, ok: true }); st.log = st.log.slice(-500);
        touchDay();
        const room = G.LEVELS.find((l) => l.id === id);
        toast(`Protocolo NEXUS · ${room.name} · +${S.roomXp(room, st.game.done[id])} XP`, 'zap');
        celebrate(before, sum());
      },
      onSettings(s) { st.game.settings = s; persist(); },
      onExit: closeGame,
    });
    if (/[?&]nxdebug\b/.test(location.search)) window.__nexus = gameCtl;
  } catch (e) {
    root.innerHTML = `<div class="gx-loading">Não foi possível iniciar o jogo: ${esc(e.message || e)}<br><button class="btn" id="gxBack" style="margin-top:14px">Voltar</button></div>`;
    root.querySelector('#gxBack').onclick = closeGame;
  }
}
function closeGame() {
  if (gameCtl) { gameCtl.dispose(); gameCtl = null; }
  const r = document.getElementById('gameRoot'); if (r) r.remove();
  document.body.classList.remove('in-game');
  if ((location.hash || '').startsWith('#/jogo')) route();
}

function applyTheme() {
  if (st.theme) document.documentElement.dataset.theme = st.theme; else delete document.documentElement.dataset.theme;
}

/* ---------- router ---------- */
function route() {
  if (gameCtl) closeGame();
  $('#modal').hidden = true;
  const dr = $('#drawer'); dr.hidden = true; dr.innerHTML = '';
  const h = location.hash || '#/';
  const [, a, b] = h.split('/');
  if (a !== 't') quizRun = null;
  if (a !== 'rev') revRun = null;
  ({ '': vHome, learn: vLearn, c: () => vChapter(b), l: () => vLesson(b), m: () => vManual(b), t: () => vTest(b), rev: vRev, lab: vLab, progress: vProgress, rank: vRank, me: vMe, prof: vProf, jogo: vGame, projeto: vProject }[a || ''] || vHome)();
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
// Palavra-passe de acesso ao site (só com o Supabase): sem token válido, vai para a página de acesso.
if (BK.checkAccess) {
  if (!BK.accessToken()) location.replace('acesso.html');
  else BK.checkAccess().then((ok) => { if (!ok) { BK.clearAccess(); location.replace('acesso.html'); } });
}
const settingsReady = loadSettings();
BK.init().then(async (u) => {
  if (BK.recovery) askNewPassword();
  const changed = await settingsReady;
  if (!u) { if (changed) route(); else renderChrome(); return; }
  st.name = u.name;
  await push();
  const a = (location.hash.split('/')[1] || '');
  if (changed || ['', 'learn', 'c', 'progress', 'rank', 'me', 'prof', 'projeto'].includes(a)) route(); else renderChrome();
}).catch(() => renderChrome());
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
