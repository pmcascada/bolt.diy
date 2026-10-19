(function () {
'use strict';
const { CHAPTERS, BADGES } = window.CONTENT;
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
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n] || P.circle}"/></svg>`;

/* ---------- estado (localStorage) ---------- */
const KEY = 'mysql-academy.v1';
let st = { name: '', token: '', theme: '', done: {}, att: {}, days: [], log: [] };
try { Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* sem storage */ }
let syncTimer, online = null;
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* ignorar */ }
  clearTimeout(syncTimer); syncTimer = setTimeout(push, 1500);
}
const sum = () => S.summarize(st);

/* ---------- sincronização com o servidor (opcional) ---------- */
async function api(path, method, data) {
  const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json', ...(st.token ? { Authorization: 'Bearer ' + st.token } : {}) }, body: data ? JSON.stringify(data) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'Erro de rede'), { status: r.status });
  return j;
}
const payload = () => ({ done: st.done, days: st.days, log: st.log });
function merge(remote) {
  for (const [id, d] of Object.entries(remote.done || {})) if (!st.done[id] || st.done[id].at > d.at) st.done[id] = d;
  st.days = [...new Set([...st.days, ...(remote.days || [])])].sort().slice(-400);
  const seen = new Set(st.log.map((e) => e.at + e.id));
  st.log = [...st.log, ...(remote.log || []).filter((e) => !seen.has(e.at + e.id))].sort((a, b) => a.at - b.at).slice(-500);
}
async function push() {
  if (!st.token) return;
  try { const j = await api('/api/progress', 'PUT', { state: payload() }); merge(j.state); online = true; localStorage.setItem(KEY, JSON.stringify(st)); }
  catch (e) { if (e.status === 401) st.token = ''; online = false; }
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
  let out = '', last = 0, m; const re = /(--[^\n]*|#[^\n]*)|('(?:[^'\\]|\\.)*')|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_][A-Za-z_0-9]*)\b/g;
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

/* ---------- pontuação / registo de tentativas ---------- */
function touchDay() { const k = S.dayKey(Date.now()); if (!st.days.includes(k)) st.days.push(k); }
function record(ex, ok) {
  const a = (st.att[ex.id] = st.att[ex.id] || { tries: 0, hints: 0 });
  a.tries++;
  st.log.push({ at: Date.now(), id: ex.id, ok });
  st.log = st.log.slice(-500);
  touchDay();
  if (!ok) { persist(); return; }
  const before = sum();
  st.done[ex.id] = { tries: a.tries, hints: a.hints, at: Date.now() };
  const after = sum();
  persist();
  renderChrome();
  toast(`Resposta correta · +${S.exXp(ex.t, a.tries, a.hints)} XP`);
  if (after.lessonsDone.length > before.lessonsDone.length) setTimeout(() => toast(`Lição concluída · +${S.LESSON_BONUS} XP`, 'checkCircle'), 500);
  if (after.chaptersDone.length > before.chaptersDone.length) setTimeout(() => toast(`Capítulo concluído · +${S.CHAPTER_BONUS} XP`, 'award'), 900);
  const nb = after.badges.filter((x) => !before.badges.includes(x));
  if (after.level > before.level) setTimeout(() => modal('zap', `Nível ${after.level} alcançado`, `Passou a <b>${after.title}</b>. Continue a praticar para subir na classificação.`), 700);
  else if (nb.length) { const bd = BADGES.find((x) => x.id === nb[0]); setTimeout(() => modal(bd.icon, 'Nova conquista', `<b>${esc(bd.name)}</b><br>${esc(bd.desc)}`), 700); }
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
  if (h === '#/learn') return /^#\/(learn|c|l)\b/.test(r);
  return r.startsWith(h);
}
function renderChrome() {
  $('#nav').innerHTML = NAV.map(([g, items]) => `<div class="grp">${g}</div>` + items.map(([h, i, t]) => `<a href="${h}" class="${isOn(h) ? 'on' : ''}">${ic(i)}<span>${t}</span></a>`).join('')).join('');
  $('#tabbar').innerHTML = TABS.map(([h, i, t]) => `<a href="${h}" class="${isOn(h) ? 'on' : ''}">${ic(i)}<span>${t}</span></a>`).join('');
  const s = sum();
  $('#mini').innerHTML = `<a class="who" href="#/me" style="color:inherit;text-decoration:none"><span class="avatar">${esc(initials(st.name || 'A'))}</span><span><b>${esc(st.name || 'Aluno convidado')}</b><span>Nível ${s.level} · ${s.title}</span></span></a>${bar(lvlPct(s))}<span class="small muted num-t">${s.xp} / ${s.next} XP</span>`;
  $('#crumbs').innerHTML = crumbs.map((c, i) => (i === crumbs.length - 1 ? `<b>${esc(c[0])}</b>` : `<a href="${c[1]}">${esc(c[0])}</a><span class="sep">/</span>`)).join('');
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches;
  $('#topr').innerHTML = `<span class="pill hide-m" title="Dias consecutivos de estudo">${ic('flame')}${s.streak} ${s.streak === 1 ? 'dia' : 'dias'}</span><span class="pill" title="Pontuação total">${ic('zap')}<span class="num-t">${s.xp} XP</span></span><button class="iconbtn" id="themeBtn" aria-label="Alternar tema claro/escuro">${ic(dark ? 'sun' : 'moon')}</button>`;
  $('#themeBtn').onclick = () => { st.theme = dark ? 'light' : 'dark'; applyTheme(); persist(); renderChrome(); };
}

function nextLesson() {
  for (const c of CHAPTERS) for (const l of c.lessons) if (l.ex.some((e) => !st.done[e.id])) return { c, l };
  return null;
}

/* ---------- vistas ---------- */
function vHome() {
  crumbs = [['Painel', '#/']];
  const s = sum(), nx = nextLesson();
  const C = 2 * Math.PI * 42, off = C * (1 - lvlPct(s) / 100);
  const greet = (() => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite'; })();
  view.innerHTML = `
  <div class="page-h"><div><h1>${greet}${st.name ? ', ' + esc(st.name.split(' ')[0]) : ''}</h1><p>${s.exDone ? `Concluiu ${s.exDone} de ${S.TOTAL_EX} exercícios do curso.` : 'Bem-vindo ao curso de MySQL. Comece pela primeira lição.'}</p></div>
  ${st.token ? '' : `<a class="btn sec-b" href="#/me">${ic('user')}Criar perfil</a>`}</div>
  <div class="dash">
    <section class="card resume">
      ${nx ? `<div class="meta">${ic(nx.c.icon)}<span>Capítulo ${nx.c.idx + 1} · Lição ${nx.c.lessons.indexOf(nx.l) + 1}</span></div>
      <h2>${esc(nx.l.title)}</h2><p class="muted" style="margin:0">${esc(nx.c.title)}</p>
      ${bar(s.pct)}<div class="row" style="justify-content:space-between"><span class="small muted">Progresso global do curso</span><span class="small num-t"><b>${s.pct}%</b></span></div>
      <div class="row" style="margin-top:18px"><a class="btn" href="#/l/${nx.l.id}">${s.exDone ? 'Continuar' : 'Começar'} ${ic('chevR')}</a><a class="btn sec-b" href="#/learn">Ver conteúdos</a></div>`
      : `<div class="meta">${ic('award')}<span>Curso concluído</span></div><h2>Parabéns, concluiu todas as lições.</h2><p class="muted">Pode rever qualquer capítulo ou praticar no laboratório SQL.</p><a class="btn" href="#/lab">Abrir laboratório</a>`}
    </section>
    <section class="card lvl">
      <div class="ring"><svg viewBox="0 0 96 96"><circle class="bg" cx="48" cy="48" r="42"/><circle class="fg" cx="48" cy="48" r="42" stroke-dasharray="${C}" stroke-dashoffset="${off}"/></svg><div><span>Nível</span><b>${s.level}</b></div></div>
      <div><div class="eyebrow" style="margin:0">${s.title}</div><div class="small muted num-t" style="margin:4px 0 10px">${s.xp - s.cur} / ${s.next - s.cur} XP para o nível ${s.level + 1}</div><a class="btn link sm" href="#/progress" style="padding:0">Ver detalhe ${ic('chevR')}</a></div>
    </section>
  </div>
  <div class="kpis">
    <div class="kpi"><div class="l">${ic('zap')}Pontuação</div><div class="v">${s.xp}</div><div class="s">XP acumulado</div></div>
    <div class="kpi"><div class="l">${ic('checkCircle')}Exercícios</div><div class="v">${s.exDone}<span class="muted" style="font-size:1rem;font-weight:500"> / ${S.TOTAL_EX}</span></div><div class="s">resolvidos</div></div>
    <div class="kpi"><div class="l">${ic('target')}Precisão</div><div class="v">${s.exDone ? Math.round((100 * s.firstTry) / s.exDone) : 0}%</div><div class="s">certos à 1.ª tentativa</div></div>
    <div class="kpi"><div class="l">${ic('flame')}Sequência</div><div class="v">${s.streak}</div><div class="s">${s.streak === 1 ? 'dia consecutivo' : 'dias consecutivos'}</div></div>
  </div>
  <section class="sec"><h2>Conteúdos do curso</h2>${moduleList(s)}</section>`;
}
function moduleList(s) {
  return `<div class="list">${CHAPTERS.map((c) => {
    const p = s.perChapter[c.id];
    return `<a class="item" href="#/c/${c.id}"><span class="no">${pad2(c.idx + 1)}</span><span class="ico ${p.complete ? 'done' : ''}">${ic(p.complete ? 'check' : c.icon)}</span>
    <span><b>${esc(c.title)}</b><span class="d">${esc(c.desc)}</span></span>
    <span class="p"><span class="row" style="justify-content:space-between"><span>${c.lessons.length} lições</span><span class="num-t">${p.pct}%</span></span>${bar(p.pct, p.complete ? 'ok' : '')}</span>
    <span class="chev">${ic('chevR')}</span></a>`;
  }).join('')}</div>`;
}
function vLearn() {
  crumbs = [['Conteúdos', '#/learn']];
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Programa</div><h1>Conteúdos do curso</h1><p>${CHAPTERS.length} capítulos · ${CHAPTERS.reduce((n, c) => n + c.lessons.length, 0)} lições · ${S.TOTAL_EX} exercícios</p></div></div>${moduleList(sum())}`;
}

function vChapter(id) {
  const c = CHAPTERS.find((x) => x.id === id); if (!c) return vHome();
  crumbs = [['Conteúdos', '#/learn'], [`Capítulo ${c.idx + 1}`, '#/c/' + c.id]];
  const p = sum().perChapter[c.id];
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Capítulo ${pad2(c.idx + 1)}</div><h1>${esc(c.title)}</h1><p>${esc(c.desc)}</p></div>
  <div style="min-width:220px"><div class="row small" style="justify-content:space-between;margin-bottom:6px"><span class="muted">${p.ok} de ${p.tot} exercícios</span><b class="num-t">${p.pct}%</b></div>${bar(p.pct, p.complete ? 'ok' : '')}</div></div>
  <div class="list">${c.lessons.map((l, i) => {
    const n = l.ex.filter((e) => st.done[e.id]).length, done = n === l.ex.length;
    return `<a class="item lesson-i" href="#/l/${l.id}"><span class="status ${done ? 'done' : n ? 'part' : ''}">${done ? ic('check') : i + 1}</span><span><b>${esc(l.title)}</b><span class="d">${(l.examples || []).length} exemplos · ${l.ex.length} exercícios</span></span>
    <span class="chip ${done ? 'ok' : n ? 'acc' : ''}">${done ? 'Concluída' : n ? `${n}/${l.ex.length}` : 'Por iniciar'}</span><span class="chev">${ic('chevR')}</span></a>`;
  }).join('')}</div>`;
}

function vLesson(id) {
  let L, C;
  for (const c of CHAPTERS) for (const l of c.lessons) if (l.id === id) { L = l; C = c; }
  if (!L) return vHome();
  const idx = C.lessons.indexOf(L), prev = C.lessons[idx - 1], next = C.lessons[idx + 1], nextCh = CHAPTERS[C.idx + 1];
  crumbs = [['Conteúdos', '#/learn'], [`Capítulo ${C.idx + 1}`, '#/c/' + C.id], [`Lição ${idx + 1}`, '#/l/' + L.id]];
  const nDone = L.ex.filter((e) => st.done[e.id]).length;
  view.innerHTML = `<div class="lesson-wrap"><article class="prose">
    <div class="eyebrow">Capítulo ${C.idx + 1} · ${esc(C.title)}</div><h1>${esc(L.title)}</h1>
    ${L.body}
    <div class="sect-t"><h2>Exemplos</h2><span class="chip">${(L.examples || []).length}</span></div>
    ${(L.examples || []).map((e, i) => `<div class="code" data-i="${i}"><div class="code-h"><span>SQL</span><span class="row" style="gap:6px"><button class="btn" data-copy aria-label="Copiar">${ic('copy')}<span class="lbl">Copiar</span></button>${e.run ? `<a class="btn" href="#/lab" data-lab aria-label="Abrir no laboratório">${ic('terminal')}<span class="lbl">Laboratório</span></a><button class="btn run" data-run>${ic('play')}Executar</button>` : ''}</span></div><pre><code>${hl(e.sql)}</code></pre><div class="cap">${esc(e.note)}</div><div class="out"></div></div>`).join('')}
    <div class="sect-t"><h2>Exercícios</h2><span class="chip ${nDone === L.ex.length ? 'ok' : ''}" id="exc">${nDone}/${L.ex.length} concluídos</span></div>
    <div id="tasks"></div>
    <div class="pager">${prev ? `<a class="btn sec-b" href="#/l/${prev.id}">${ic('chevL')}Anterior</a>` : '<span></span>'}
    ${next ? `<a class="btn" href="#/l/${next.id}">Lição seguinte${ic('chevR')}</a>` : nextCh ? `<a class="btn" href="#/c/${nextCh.id}">Capítulo seguinte${ic('chevR')}</a>` : `<a class="btn" href="#/progress">Ver progresso${ic('chevR')}</a>`}</div>
  </article>
  <aside class="toc"><h4>${esc(C.title)}</h4>${C.lessons.map((l, i) => { const d = l.ex.every((e) => st.done[e.id]); return `<a href="#/l/${l.id}" class="${l === L ? 'on' : ''} ${d ? 'done' : ''}">${ic(d ? 'checkCircle' : 'circle')}<span>${i + 1}. ${esc(l.title)}</span></a>`; }).join('')}</aside></div>`;
  view.querySelectorAll('.code').forEach((box) => {
    const e = L.examples[+box.dataset.i];
    box.querySelector('[data-copy]').onclick = () => { navigator.clipboard?.writeText(e.sql); toast('Copiado para a área de transferência', 'copy'); };
    const run = box.querySelector('[data-run]');
    if (run) run.onclick = () => { box.querySelector('.out').innerHTML = runSql(D.create(), e.sql); };
    const lab = box.querySelector('[data-lab]');
    if (lab) lab.onclick = () => { labSql = e.sql; };
  });
  const tasks = $('#tasks');
  const refreshCount = () => { const n = L.ex.filter((e) => st.done[e.id]).length; const x = $('#exc'); if (x) { x.textContent = `${n}/${L.ex.length} concluídos`; x.className = 'chip' + (n === L.ex.length ? ' ok' : ''); } };
  L.ex.forEach((e, i) => tasks.append(taskEl(e, i, refreshCount)));
  window.scrollTo(0, 0);
}
function runSql(db, sql) {
  try { return table(D.run(db, sql)); } catch (err) { return alertBox('bad', 'alert', `<b>Erro:</b> ${esc(err.message || err)}`); }
}

function taskEl(ex, i, onDone) {
  const el = document.createElement('div');
  const tag = { quiz: 'Escolha múltipla', code: 'Escrever comando', query: 'Consulta SELECT' }[ex.t];
  function paint(fbHtml) {
    const done = st.done[ex.id], a = st.att[ex.id] || { tries: 0, hints: 0 };
    el.className = 'task' + (done ? ' done' : '');
    el.innerHTML = `<div class="task-h"><span>Exercício ${i + 1} · ${tag}</span>${done ? `<span class="chip ok">${ic('check')}+${S.exXp(ex.t, done.tries, done.hints)} XP</span>` : `<span class="chip">${S.BASE[ex.t]} XP</span>`}</div>
      <div class="task-b"><div class="q">${esc(ex.q)}</div><div class="body"></div><div class="fb" aria-live="polite">${fbHtml || ''}</div></div>`;
    const body = el.querySelector('.body'), fb = el.querySelector('.fb');
    if (ex.t === 'quiz') {
      body.className = 'body opts';
      const order = el._order || (el._order = ex.opts.map((o, k) => k).sort(() => Math.random() - 0.5));
      order.forEach((k, pos) => {
        const b = document.createElement('button'); b.className = 'opt'; b.disabled = !!done;
        b.innerHTML = `<span class="lt">${'ABCD'[pos]}</span><span>${esc(ex.opts[k])}</span>`;
        if (done && k === ex.a) b.classList.add('good');
        b.onclick = () => {
          if (k === ex.a) { record(ex, true); paint(alertBox('ok', 'checkCircle', `<b>Correto.</b> ${esc(ex.why)}`)); onDone(); }
          else { b.classList.add('wrong'); b.disabled = true; record(ex, false); fb.innerHTML = alertBox('bad', 'x', 'Resposta incorreta. Tente outra opção.'); }
        };
        body.append(b);
      });
      if (done && !fbHtml) fb.innerHTML = alertBox('ok', 'info', esc(ex.why));
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
      } catch (err) { out.innerHTML = el._out = ''; fb.innerHTML = alertBox('bad', 'alert', `<b>Erro de sintaxe.</b> ${esc(err.message || err)}`); return; }
      const wasDone = !!st.done[ex.id];
      if (ok) { if (!wasDone) { record(ex, true); onDone(); } paint(alertBox('ok', 'checkCircle', '<b>Correto.</b>' + (ex.t === 'query' ? ' O resultado coincide com o esperado.' : ''))); }
      else {
        if (!wasDone) record(ex, false);
        fb.innerHTML = alertBox('bad', 'x', ex.t === 'query' ? 'O resultado não coincide com o esperado. Verifique colunas, filtros e agrupamentos.' : 'Ainda não está correto. Confira a sintaxe e os nomes utilizados.');
        aid();
      }
    };
    function aid() {
      const a2 = st.att[ex.id] || { tries: 0 };
      if (a2.tries >= 2 && !tools.querySelector('[data-sol]') && !st.done[ex.id]) {
        mk('Ver solução', 'eye', 'link sm', () => { ta.value = el._val = ex.solution; fb.innerHTML = alertBox('info', 'info', 'Solução apresentada. Estude-a e volte a escrevê-la sem copiar para obter a pontuação.'); }).dataset.sol = 1;
      }
    }
    mk(ex.t === 'query' ? 'Executar e verificar' : 'Verificar', 'check', '', check);
    if (ex.t === 'query') mk('Executar', 'play', 'sec-b', () => { out.innerHTML = el._out = runSql(D.create(), ta.value); });
    if (!done) mk(`Dica (−${S.HINT_COST} XP)`, 'bulb', 'link sm', () => { a.hints = Math.min(a.hints + 1, 9); st.att[ex.id] = a; persist(); fb.innerHTML = alertBox('info', 'bulb', esc(ex.hint)); });
    const k = document.createElement('span'); k.className = 'small muted'; k.style.marginLeft = 'auto'; k.innerHTML = '<span class="kbd">Ctrl</span> + <span class="kbd">Enter</span>'; tools.append(k);
    ta.onkeydown = (ev) => { if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') { ev.preventDefault(); check(); } };
    body.append(ta, tools, out);
    if (a.tries >= 2 && !done) aid();
  }
  paint();
  return el;
}

let labDb = null, labSql = 'SELECT * FROM alunos;';
function vLab() {
  crumbs = [['Laboratório SQL', '#/lab']];
  if (!labDb) labDb = D.create();
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Prática livre</div><h1>Laboratório SQL</h1><p>Execute instruções sobre a base de dados <b>escola</b>. Os dados ficam apenas no seu dispositivo e podem ser repostos a qualquer momento.</p></div></div>
  <div class="card"><div class="card-h"><h3>Esquema</h3><button class="btn sec-b sm" id="reset">${ic('reset')}Repor dados</button></div>
  <div class="schema">${Object.entries(D.COLS).map(([t, c]) => `<span><b>${t}</b> (${c.join(', ')})</span>`).join('')}</div>
  <textarea class="sql" id="labq" spellcheck="false" style="min-height:150px" aria-label="Instrução SQL"></textarea>
  <div class="tools"><button class="btn" id="go">${ic('play')}Executar</button><span class="small muted" style="margin-left:auto"><span class="kbd">Ctrl</span> + <span class="kbd">Enter</span></span></div>
  <div id="labout"></div></div>
  <p class="small muted" style="margin-top:12px">${ic('info')} O motor do laboratório simula o MySQL no browser e suporta SELECT, INSERT, UPDATE, DELETE e CREATE TABLE. Algumas funções específicas do MySQL podem não estar disponíveis.</p>`;
  const q = $('#labq'); q.value = labSql;
  const go = () => { labSql = q.value; $('#labout').innerHTML = runSql(labDb, q.value); touchDay(); persist(); };
  $('#go').onclick = go; q.onkeydown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); go(); } };
  $('#reset').onclick = () => { labDb = D.create(); $('#labout').innerHTML = alertBox('ok', 'check', 'Dados de exemplo repostos.'); };
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
    <div class="kpi"><div class="l">${ic('checkCircle')}Conclusão</div><div class="v">${s.pct}%</div><div class="s">${s.exDone} de ${S.TOTAL_EX} exercícios</div></div>
    <div class="kpi"><div class="l">${ic('target')}À 1.ª tentativa</div><div class="v">${s.firstTry}</div><div class="s">exercícios</div></div>
    <div class="kpi"><div class="l">${ic('flame')}Sequência</div><div class="v">${s.streak}</div><div class="s">dias consecutivos</div></div>
  </div>
  <div class="two" style="margin-top:16px">
    <div class="card"><div class="card-h"><h3>Progresso por capítulo</h3></div><table class="tbl"><tbody>${CHAPTERS.map((c) => { const p = s.perChapter[c.id]; return `<tr><td style="width:55%"><a href="#/c/${c.id}" style="color:inherit">${c.idx + 1}. ${esc(c.title)}</a></td><td style="width:35%">${bar(p.pct, p.complete ? 'ok' : '')}</td><td class="r small">${p.ok}/${p.tot}</td></tr>`; }).join('')}</tbody></table></div>
    <div class="card"><div class="card-h"><h3>Atividade (14 dias)</h3><span class="small muted">${total14} exercícios</span></div>
      <div class="chart">${days.map(([k]) => `<div style="height:${Math.round((100 * (byDay[k] || 0)) / mx)}%" title="${k}: ${byDay[k] || 0} exercícios"></div>`).join('')}</div>
      <div class="chart-x">${days.map(([, d], i) => `<span>${i % 2 ? '' : d.getDate()}</span>`).join('')}</div></div>
  </div>
  <div class="card"><div class="card-h"><h3>Conquistas</h3><span class="small muted">${s.badges.length} de ${BADGES.length}</span></div><div class="badges">${BADGES.map((b) => { const on = s.badges.includes(b.id); return `<div class="badge ${on ? '' : 'off'}"><span class="bi">${ic(on ? b.icon : 'lock')}</span><span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></span></div>`; }).join('')}</div></div>
  <div class="card"><div class="card-h"><h3>Histórico de tentativas</h3><span class="small muted">${st.log.length} registos</span></div>
  ${st.log.length ? `<div class="scroll" style="max-height:380px"><table class="tbl"><thead><tr><th>Data</th><th>Exercício</th><th>Enunciado</th><th>Resultado</th></tr></thead><tbody>${st.log.slice().reverse().slice(0, 200).map((e) => { const x = S.EXS[e.id]; return `<tr><td class="small muted" style="white-space:nowrap">${new Date(e.at).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}</td><td style="font-family:var(--mono);font-size:.8rem">${esc(e.id)}</td><td class="small">${x ? esc(x.q.length > 80 ? x.q.slice(0, 80) + '…' : x.q) : ''}</td><td>${e.ok ? '<span class="chip ok">Correto</span>' : '<span class="chip bad">Incorreto</span>'}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty">Ainda não existem tentativas registadas.</div>'}</div>`;
  const dl = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); };
  $('#csv').onclick = () => dl('progresso-mysql.csv', 'data,exercicio,correto\n' + st.log.map((e) => `${new Date(e.at).toISOString()},${e.id},${e.ok ? 1 : 0}`).join('\n'), 'text/csv');
  $('#json').onclick = () => dl('progresso-mysql.json', JSON.stringify({ aluno: st.name, resumo: { xp: s.xp, nivel: s.level, exercicios: s.exDone, capitulos: s.perChapter }, ...payload() }, null, 2), 'application/json');
}

async function vRank() {
  crumbs = [['Classificação', '#/rank']];
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Desempenho</div><h1>Classificação</h1><p>Compare a sua evolução com a dos restantes alunos.</p></div></div><div class="card" id="rk" style="padding:0"><div class="empty">A carregar…</div></div>`;
  try {
    const rows = await api('/api/leaderboard', 'GET');
    const me = (st.name || '').toLowerCase();
    $('#rk').outerHTML = (st.token ? '' : `<div style="margin-bottom:16px">${alertBox('info', 'info', 'Crie um perfil na página <a href="#/me">Perfil</a> para aparecer na classificação.')}</div>`) +
      `<div class="card" style="padding:0">${rows.length ? `<div class="scroll"><table class="tbl"><thead><tr><th style="width:60px">#</th><th>Aluno</th><th>Nível</th><th class="r">XP</th><th style="width:22%">Conclusão</th><th class="r">Sequência</th></tr></thead><tbody>${rows.map((r, i) => `<tr class="${r.name.toLowerCase() === me ? 'me' : ''}"><td><span class="pos ${i < 3 ? 'p' + (i + 1) : ''}">${i + 1}</span></td><td><span class="who"><span class="avatar">${esc(initials(r.name))}</span><b>${esc(r.name)}</b></span></td><td>${r.level} <span class="small muted">${esc(r.title)}</span></td><td class="r"><b>${r.xp}</b></td><td><div class="row" style="flex-wrap:nowrap">${bar(r.pct)}<span class="small muted num-t" style="min-width:36px">${r.pct}%</span></div></td><td class="r">${r.streak} d</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Ainda não há alunos na classificação.</div>'}</div>`;
    view.querySelectorAll('.tbl .bar').forEach((b) => (b.style.flex = '1'));
  } catch { $('#rk').outerHTML = alertBox('bad', 'alert', 'Não foi possível contactar o servidor. A classificação requer o servidor da aplicação (<code>npm start</code>). O seu progresso continua guardado neste dispositivo.'); }
}

function vMe() {
  crumbs = [['Perfil', '#/me']];
  const s = sum();
  view.innerHTML = `<div class="page-h"><div><div class="eyebrow">Conta</div><h1>Perfil</h1></div></div>
  <div class="two">
  <div class="card">${st.token ? `<div class="who" style="margin-bottom:14px"><span class="avatar" style="width:44px;height:44px">${esc(initials(st.name))}</span><span><b>${esc(st.name)}</b><span>Sessão iniciada · Nível ${s.level}</span></span></div>
    <p class="small muted">O progresso é sincronizado com o servidor e pode ser retomado noutro dispositivo.</p>${online === false ? alertBox('bad', 'alert', 'Sem ligação ao servidor. A sincronização será feita mais tarde.') : ''}
    <div class="row" style="margin-top:14px"><button class="btn" id="sync">${ic('refresh')}Sincronizar</button><button class="btn sec-b" id="out">${ic('logout')}Terminar sessão</button></div>`
    : `<h3>Criar perfil ou iniciar sessão</h3><p class="small muted">O nome é visível na classificação. O progresso já realizado neste dispositivo é mantido.</p>
    <label class="field">Nome<input class="txt" id="nm" maxlength="24" autocomplete="username" value="${esc(st.name)}"></label>
    <label class="field">PIN ou palavra-passe (mín. 4 caracteres)<input class="txt" id="pin" type="password" autocomplete="current-password"></label>
    <div class="row"><button class="btn" id="reg">Criar perfil</button><button class="btn sec-b" id="login">Iniciar sessão</button></div><div id="msg"></div>`}</div>
  <div class="card"><h3>Preferências e dados</h3><p class="small muted">Nível ${s.level} · ${s.xp} XP · ${s.exDone} exercícios resolvidos.</p>
    <div class="row"><button class="btn sec-b" id="theme">${ic('moon')}Alternar tema</button><button class="btn danger" id="reset">${ic('trash')}Apagar progresso local</button></div></div>
  </div>`;
  const auth = async (kind) => {
    const name = $('#nm').value.trim(), pin = $('#pin').value;
    try {
      const j = await api('/api/' + kind, 'POST', { name, pin, state: payload() });
      st.token = j.token; st.name = j.name; merge(j.state); persist(); await push(); toast('Sessão iniciada'); route();
    } catch (e) { $('#msg').innerHTML = alertBox('bad', 'alert', esc(e.status ? e.message : 'Servidor indisponível. Execute "npm start" para ativar a classificação.')); }
  };
  if (st.token) {
    $('#sync').onclick = async () => { await push(); toast(online ? 'Progresso sincronizado' : 'Sem ligação ao servidor', online ? 'check' : 'alert'); vMe(); };
    $('#out').onclick = () => { st.token = ''; persist(); route(); };
  } else { $('#reg').onclick = () => auth('register'); $('#login').onclick = () => auth('login'); }
  $('#theme').onclick = () => $('#themeBtn').click();
  $('#reset').onclick = () => { if (confirm('Apagar todo o progresso guardado neste dispositivo?')) { st.done = {}; st.att = {}; st.days = []; st.log = []; persist(); route(); } };
}
function applyTheme() {
  if (st.theme) document.documentElement.dataset.theme = st.theme; else delete document.documentElement.dataset.theme;
}

/* ---------- router ---------- */
function route() {
  $('#modal').hidden = true;
  const h = location.hash || '#/';
  const [, a, b] = h.split('/');
  ({ '': vHome, learn: vLearn, c: () => vChapter(b), l: () => vLesson(b), lab: vLab, progress: vProgress, rank: vRank, me: vMe }[a || ''] || vHome)();
  renderChrome();
  if (a !== 'l') window.scrollTo(0, 0);
}
addEventListener('hashchange', route);
addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#modal').hidden = true; });
applyTheme();
route();
if (st.token) push();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
