(function () {
'use strict';
const { CHAPTERS, BADGES } = window.CONTENT;
const S = window.SCORE;
const D = window.SQLDB;
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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
  catch (e) { if (e.status === 401) { st.token = ''; } online = false; }
}

/* ---------- utilitários de UI ---------- */
function toast(msg, cls = '') {
  const t = document.createElement('div'); t.className = 'toast ' + cls; t.textContent = msg;
  $('#toasts').append(t); setTimeout(() => t.remove(), 3300);
}
function confetti(n = 36) {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  for (let i = 0; i < n; i++) {
    const c = document.createElement('span'); c.className = 'conf'; c.textContent = ['🎉', '✨', '⭐', '🟣', '🔵'][i % 5];
    c.style.left = Math.random() * 100 + 'vw'; c.style.animationDelay = Math.random() * 0.6 + 's';
    document.body.append(c); setTimeout(() => c.remove(), 3200);
  }
}
function modal(html) {
  const m = $('#modal'); m.innerHTML = `<div class="box" role="dialog" aria-modal="true">${html}<p><button class="btn" id="mok">Continuar</button></p></div>`;
  m.hidden = false; $('#mok').onclick = () => (m.hidden = true); $('#mok').focus();
  m.onclick = (e) => { if (e.target === m) m.hidden = true; };
}
const KW = new Set('SELECT FROM WHERE AND OR NOT INSERT INTO VALUES UPDATE SET DELETE CREATE DROP ALTER TABLE DATABASE SCHEMA USE SHOW DATABASES TABLES DESCRIBE DESC ASC ORDER BY GROUP HAVING LIMIT DISTINCT AS JOIN INNER LEFT RIGHT OUTER ON IN LIKE BETWEEN IS NULL PRIMARY KEY FOREIGN REFERENCES AUTO_INCREMENT UNIQUE DEFAULT INT VARCHAR DECIMAL DATE DATETIME TEXT BOOLEAN IF EXISTS ADD COLUMN MODIFY RENAME TO TRUNCATE START TRANSACTION COMMIT ROLLBACK GRANT REVOKE USER ROLE IDENTIFIED FLUSH PRIVILEGES COUNT SUM AVG MIN MAX ROUND VERSION CURDATE FOR GRANTS WITH OPTION ON CHARACTER INTO OUTFILE FIELDS TERMINATED ENCLOSED BY SOURCE EXPLAIN FROM'.split(' '));
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
  if (!rows.length) return '<div class="res"><p class="muted" style="padding:10px">Sem linhas no resultado.</p></div>';
  const cols = Object.keys(rows[0]);
  const body = rows.slice(0, 100).map((r) => '<tr>' + cols.map((c) => `<td>${r[c] === null || r[c] === undefined ? '<i class="muted">NULL</i>' : esc(r[c])}</td>`).join('') + '</tr>').join('');
  return `<div class="res"><table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div><p class="small muted">${rows.length} linha(s)</p>`;
}
const pctBar = (p) => `<div class="bar" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p}%"></i></div>`;

/* ---------- pontuação / registo de tentativas ---------- */
function touchDay() { const k = S.dayKey(Date.now()); if (!st.days.includes(k)) st.days.push(k); }
function record(ex, ok) {
  const a = (st.att[ex.id] = st.att[ex.id] || { tries: 0, hints: 0 });
  a.tries++;
  st.log.push({ at: Date.now(), id: ex.id, ok });
  st.log = st.log.slice(-500);
  touchDay();
  if (!ok) { persist(); return null; }
  const before = sum();
  st.done[ex.id] = { tries: a.tries, hints: a.hints, at: Date.now() };
  const after = sum();
  persist();
  const gained = after.xp - before.xp;
  renderNav(location.hash || '#/');
  toast(`+${S.exXp(ex.t, a.tries, a.hints)} XP`, 'xp');
  celebrate(before, after, ex);
  return gained;
}
function celebrate(b, a, ex) {
  const lessonId = ex.id.split('.').slice(0, 2).join('.');
  const msgs = [];
  if (a.lessonsDone.length > b.lessonsDone.length) { msgs.push(`📘 Lição concluída! +${S.LESSON_BONUS} XP`); confetti(24); }
  const newCh = a.chaptersDone.filter((c) => !b.chaptersDone.includes(c));
  if (newCh.length) { msgs.push(`🎓 Capítulo concluído! +${S.CHAPTER_BONUS} XP`); confetti(60); }
  msgs.forEach((m, i) => setTimeout(() => toast(m, 'xp'), 500 + i * 400));
  const nb = a.badges.filter((x) => !b.badges.includes(x));
  nb.forEach((id) => { const bd = BADGES.find((x) => x.id === id); setTimeout(() => modal(`<div class="big">${bd.icon}</div><h2>Nova conquista!</h2><p><b>${bd.name}</b><br><span class="muted">${bd.desc}</span></p>`), 900); });
  if (a.level > b.level) setTimeout(() => { confetti(70); modal(`<div class="big">⬆️</div><h2>Nível ${a.level}!</h2><p>Agora é <b>${a.title}</b>. Continue assim!</p>`); }, nb.length ? 1800 : 900);
  void lessonId;
}

/* ---------- vistas ---------- */
const view = $('#view');
const NAV = [['#/', '🏠', 'Início'], ['#/learn', '📚', 'Capítulos'], ['#/lab', '🧪', 'Laboratório'], ['#/progress', '📈', 'Progresso'], ['#/rank', '🏆', 'Ranking'], ['#/me', '👤', 'Perfil']];
function renderNav(route) {
  const html = NAV.map(([h, i, t]) => `<a href="${h}" class="${route === h || (h !== '#/' && route.startsWith(h)) ? 'on' : ''}"><span class="ic">${i}</span><span>${t}</span></a>`).join('');
  $('#nav').innerHTML = html;
  $('#tabbar').innerHTML = NAV.filter((n) => n[0] !== '#/learn').map(([h, i, t]) => `<a href="${h}" class="${route === h || (h !== '#/' && route.startsWith(h)) ? 'on' : ''}"><span class="ic">${i}</span><span>${t}</span></a>`).join('');
  const s = sum();
  $('#mini').innerHTML = `<b>${esc(st.name || 'Aluno anónimo')}</b><br><span class="muted">Nível ${s.level} · ${s.title}</span>${pctBar(Math.round(100 * (s.xp - s.cur) / (s.next - s.cur)))}<span class="small muted">${s.xp} XP · 🔥 ${s.streak} dia(s)</span>`;
}

function nextLesson() {
  for (const c of CHAPTERS) for (const l of c.lessons) if (l.ex.some((e) => !st.done[e.id])) return { c, l };
  return null;
}

function vHome() {
  const s = sum(), nx = nextLesson();
  const lvlPct = Math.round(100 * (s.xp - s.cur) / (s.next - s.cur));
  view.innerHTML = `
  <section class="card hero">
    <h1>${st.name ? `Olá, ${esc(st.name)}! 👋` : 'Bem-vindo à MySQL Academy 👋'}</h1>
    <p>${s.exDone ? `Já resolveu ${s.exDone} de ${S.TOTAL_EX} exercícios.` : 'Aprenda MySQL passo a passo: leia, experimente, pratique e suba de nível.'}</p>
    <div class="row">${nx ? `<a class="btn white" href="#/l/${nx.l.id}">${s.exDone ? '▶ Continuar' : '🚀 Começar'}: ${esc(nx.l.title)}</a>` : '<span class="btn white">🏆 Concluiu tudo!</span>'}
    ${st.token ? '' : '<a class="btn ghost" style="color:#fff;border-color:#fff8" href="#/me">Entrar no ranking</a>'}</div>
  </section>
  <div class="stats">
    <div class="stat"><b>⚡ ${s.xp}</b><span>XP total</span></div>
    <div class="stat"><b>🎖️ ${s.level}</b><span>Nível · ${s.title}</span></div>
    <div class="stat"><b>🔥 ${s.streak}</b><span>dias seguidos</span></div>
    <div class="stat"><b>✅ ${s.pct}%</b><span>concluído</span></div>
  </div>
  <div class="card"><div class="row" style="justify-content:space-between"><b>Próximo nível: ${s.level + 1}</b><span class="small muted">${s.xp} / ${s.next} XP</span></div>${pctBar(lvlPct)}</div>
  <h2>Capítulos</h2>
  <div class="grid">${CHAPTERS.map(chapCard).join('')}</div>`;
}
function chapCard(c) {
  const p = sum().perChapter[c.id];
  return `<a class="card chap" style="--c:${c.color}" href="#/c/${c.id}"><div class="em">${c.icon}</div><h3>${c.idx + 1}. ${esc(c.title)}</h3><p class="muted small">${esc(c.desc)}</p>${pctBar(p.pct)}<p class="small muted" style="margin:6px 0 0">${p.ok}/${p.tot} exercícios ${p.complete ? '· <span class="chip ok">Concluído</span>' : ''}</p></a>`;
}
function vLearn() { view.innerHTML = `<h1>📚 Capítulos</h1><div class="grid">${CHAPTERS.map(chapCard).join('')}</div>`; }

function vChapter(id) {
  const c = CHAPTERS.find((x) => x.id === id); if (!c) return vHome();
  view.innerHTML = `<p><a href="#/learn">← Capítulos</a></p><h1>${c.icon} ${c.idx + 1}. ${esc(c.title)}</h1><p class="muted">${esc(c.desc)}</p>
  <ul class="lessons">${c.lessons.map((l, i) => {
    const n = l.ex.filter((e) => st.done[e.id]).length, done = n === l.ex.length;
    return `<li><a href="#/l/${l.id}"><span class="num ${done ? 'done' : ''}">${done ? '✓' : i + 1}</span><span style="flex:1"><b>${esc(l.title)}</b><br><span class="small muted">${n}/${l.ex.length} exercícios</span></span><span>›</span></a></li>`;
  }).join('')}</ul>`;
}

function vLesson(id) {
  let L, C;
  for (const c of CHAPTERS) for (const l of c.lessons) if (l.id === id) { L = l; C = c; }
  if (!L) return vHome();
  const idx = C.lessons.indexOf(L), prev = C.lessons[idx - 1], next = C.lessons[idx + 1];
  const nextCh = CHAPTERS[C.idx + 1];
  view.innerHTML = `<p><a href="#/c/${C.id}">← ${esc(C.title)}</a></p>
  <article class="lesson"><h1>${C.icon} ${esc(L.title)}</h1>${L.body}
    <h2>💡 Exemplos</h2>${(L.examples || []).map((e, i) => `<div class="ex" data-i="${i}"><p class="note">${esc(e.note)}</p><pre><code>${hl(e.sql)}</code></pre><div class="tools"><button class="btn ghost sm" data-copy>📋 Copiar</button>${e.run ? '<button class="btn sm" data-run>▶ Executar</button>' : ''}${e.run ? '<a class="btn ghost sm" href="#/lab" data-lab>🧪 Abrir no laboratório</a>' : ''}</div><div class="out"></div></div>`).join('')}
    <h2>🎮 Agora é consigo</h2><div id="tasks"></div>
  </article>
  <div class="row" style="justify-content:space-between;margin-top:20px">
    ${prev ? `<a class="btn ghost" href="#/l/${prev.id}">‹ Anterior</a>` : '<span></span>'}
    ${next ? `<a class="btn" href="#/l/${next.id}">Seguinte ›</a>` : nextCh ? `<a class="btn" href="#/c/${nextCh.id}">Próximo capítulo ›</a>` : `<a class="btn" href="#/progress">Ver o meu progresso ›</a>`}
  </div>`;
  view.querySelectorAll('.ex').forEach((box) => {
    const e = L.examples[+box.dataset.i];
    box.querySelector('[data-copy]').onclick = () => { navigator.clipboard?.writeText(e.sql); toast('Copiado!'); };
    const run = box.querySelector('[data-run]');
    if (run) run.onclick = () => { box.querySelector('.out').innerHTML = runSql(D.create(), e.sql); };
    const lab = box.querySelector('[data-lab]');
    if (lab) lab.onclick = () => { labSql = e.sql; };
  });
  const tasks = $('#tasks'); L.ex.forEach((e, i) => tasks.append(taskEl(e, i)));
  window.scrollTo(0, 0);
}
function runSql(db, sql) {
  try { return table(D.run(db, sql)); } catch (err) { return `<div class="err">⚠️ ${esc(err.message || err)}</div>`; }
}

function taskEl(ex, i) {
  const el = document.createElement('div');
  const tag = { quiz: 'Escolha múltipla', code: 'Escreva o comando', query: 'Consulta SELECT' }[ex.t];
  function paint() {
    const done = st.done[ex.id], a = st.att[ex.id] || { tries: 0, hints: 0 };
    el.className = 'task' + (done ? ' done' : '');
    el.innerHTML = `<div class="tag">Exercício ${i + 1} · ${tag} ${done ? `· <span class="chip ok">✓ +${S.exXp(ex.t, done.tries, done.hints)} XP</span>` : ''}</div><div class="q">${esc(ex.q)}</div><div class="body"></div><div class="fb" aria-live="polite"></div>`;
    const body = el.querySelector('.body'), fb = el.querySelector('.fb');
    if (ex.t === 'quiz') {
      const order = ex.opts.map((o, k) => k).sort(() => Math.random() - 0.5);
      body.className = 'body opts';
      order.forEach((k) => {
        const b = document.createElement('button'); b.className = 'opt'; b.textContent = ex.opts[k]; b.disabled = !!done;
        if (done && k === ex.a) b.classList.add('good');
        b.onclick = () => {
          const ok = k === ex.a;
          if (ok) { b.classList.add('good'); record(ex, true); paint(); const f = el.querySelector('.fb'); f.className = 'fb ok'; f.textContent = '✅ Correto! ' + ex.why; }
          else { b.classList.add('wrong'); b.disabled = true; record(ex, false); fb.className = 'fb bad'; fb.textContent = '❌ Ainda não. Tente outra opção.'; }
        };
        body.append(b);
      });
      if (done) { fb.className = 'fb ok'; fb.textContent = ex.why; }
      return;
    }
    const ta = document.createElement('textarea'); ta.className = 'sql'; ta.spellcheck = false; ta.autocapitalize = 'off'; ta.autocomplete = 'off';
    ta.placeholder = ex.t === 'query' ? 'SELECT ...' : 'Escreva aqui o comando…'; ta.value = el._val || (done ? ex.solution : '');
    ta.oninput = () => (el._val = ta.value);
    const out = document.createElement('div');
    const tools = document.createElement('div'); tools.className = 'row'; tools.style.marginTop = '10px';
    const mk = (label, cls, fn) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = label; b.onclick = fn; tools.append(b); return b; };
    const check = () => {
      if (!ta.value.trim()) { fb.className = 'fb bad'; fb.textContent = 'Escreva primeiro a sua resposta.'; return; }
      let ok = false;
      try {
        if (ex.t === 'code') ok = D.checkCode(ta.value, ex);
        else { const r = D.check(ta.value, ex); ok = r.ok; out.innerHTML = table(r.rows); }
      } catch (err) { out.innerHTML = `<div class="err">⚠️ ${esc(err.message || err)}</div>`; fb.className = 'fb bad'; fb.textContent = '❌ A instrução tem um erro. Reveja a sintaxe.'; return; }
      const wasDone = !!st.done[ex.id];
      if (ok) {
        if (!wasDone) record(ex, true);
        const keep = ta.value, o = out.innerHTML; el._val = keep; paint();
        el.querySelector('.body textarea').value = keep; el.querySelector('.body').append(Object.assign(document.createElement('div'), { innerHTML: o }));
        const f = el.querySelector('.fb'); f.className = 'fb ok'; f.textContent = '✅ Correto!';
      } else {
        if (!wasDone) record(ex, false);
        fb.className = 'fb bad';
        fb.textContent = ex.t === 'query' ? '❌ O resultado não coincide com o esperado. Verifique colunas, filtros e ordenação.' : '❌ Ainda não está certo. Confira a sintaxe e os nomes.';
        paintAid();
      }
    };
    function paintAid() {
      const a2 = st.att[ex.id] || { tries: 0 };
      if (a2.tries >= 2 && !el.querySelector('[data-sol]') && !st.done[ex.id]) {
        const s = Object.assign(document.createElement('button'), { className: 'btn ghost sm', textContent: '👀 Ver solução (sem XP)' }); s.dataset.sol = 1;
        s.onclick = () => { ta.value = ex.solution; el._val = ex.solution; fb.className = 'fb'; fb.innerHTML = 'Solução mostrada — estude-a e tente de novo sem copiar para ganhar XP.'; };
        tools.append(s);
      }
    }
    mk(ex.t === 'query' ? '▶ Executar e verificar' : '✔ Verificar', '', check);
    if (ex.t === 'query') mk('▶ Só executar', 'ghost', () => { out.innerHTML = runSql(D.create(), ta.value); });
    if (!done) mk('💡 Dica (-3 XP)', 'ghost', () => { a.hints = Math.min(a.hints + 1, 9); st.att[ex.id] = a; persist(); fb.className = 'fb'; fb.textContent = '💡 ' + ex.hint; });
    ta.onkeydown = (ev) => { if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') { ev.preventDefault(); check(); } };
    body.append(ta, tools, out);
    if (a.tries >= 2 && !done) paintAid();
  }
  paint();
  return el;
}

let labDb = null, labSql = 'SELECT * FROM alunos;';
function vLab() {
  if (!labDb) labDb = D.create();
  view.innerHTML = `<h1>🧪 Laboratório SQL</h1><p class="muted">Experimente livremente na base de dados <b>escola</b>. Pode usar SELECT, INSERT, UPDATE, DELETE e até CREATE TABLE. O motor é uma simulação do MySQL feita no seu browser — nada sai do seu dispositivo.</p>
  <div class="schema">${Object.entries(D.COLS).map(([t, c]) => `<span><b>${t}</b>(${c.join(', ')})</span>`).join('')}</div>
  <textarea class="sql" id="labq" spellcheck="false" style="min-height:130px"></textarea>
  <div class="row" style="margin:10px 0"><button class="btn" id="go">▶ Executar (Ctrl+Enter)</button><button class="btn ghost" id="reset">↺ Repor dados</button></div><div id="labout"></div>`;
  const q = $('#labq'); q.value = labSql;
  const go = () => { labSql = q.value; $('#labout').innerHTML = runSql(labDb, q.value); touchDay(); persist(); };
  $('#go').onclick = go; q.onkeydown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); go(); } };
  $('#reset').onclick = () => { labDb = D.create(); $('#labout').innerHTML = '<p class="fb ok">Dados repostos.</p>'; };
}

function vProgress() {
  const s = sum();
  const byDay = {}; Object.values(st.done).forEach((d) => { const k = S.dayKey(d.at); byDay[k] = (byDay[k] || 0) + 1; });
  const days = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push([S.dayKey(d), d.getDate()]); }
  const mx = Math.max(1, ...days.map(([k]) => byDay[k] || 0));
  const exInfo = (id) => S.EXS[id];
  view.innerHTML = `<h1>📈 O meu progresso</h1>
  <div class="stats"><div class="stat"><b>⚡ ${s.xp}</b><span>XP</span></div><div class="stat"><b>${s.exDone}/${S.TOTAL_EX}</b><span>exercícios</span></div><div class="stat"><b>🎯 ${s.firstTry}</b><span>à 1.ª tentativa</span></div><div class="stat"><b>🔥 ${s.streak}</b><span>dias seguidos</span></div></div>
  <div class="card"><h3>Por capítulo</h3>${CHAPTERS.map((c) => { const p = s.perChapter[c.id]; return `<p style="margin:12px 0 4px"><b>${c.icon} ${esc(c.title)}</b> <span class="muted small">${p.ok}/${p.tot}${p.complete ? ' ✓' : ''}</span></p>${pctBar(p.pct)}`; }).join('')}</div>
  <div class="card"><h3>Exercícios resolvidos nos últimos 14 dias</h3><div class="chart" style="margin-bottom:22px">${days.map(([k, d]) => `<div style="height:${Math.round(100 * (byDay[k] || 0) / mx)}%" title="${k}: ${byDay[k] || 0}"><span>${d}</span></div>`).join('')}</div></div>
  <div class="card"><h3>Conquistas</h3><div class="badges">${BADGES.map((b) => `<div class="badge ${s.badges.includes(b.id) ? '' : 'off'}"><span class="i">${b.icon}</span><b>${b.name}</b><small>${b.desc}</small></div>`).join('')}</div></div>
  <div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Histórico de tentativas</h3><span><button class="btn ghost sm" id="csv">⬇ CSV</button> <button class="btn ghost sm" id="json">⬇ JSON</button></span></div>
  <div class="hist">${st.log.slice().reverse().slice(0, 150).map((e) => { const x = exInfo(e.id); return `<div><span>${e.ok ? '✅' : '❌'}</span><span class="muted small" style="min-width:120px">${new Date(e.at).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}</span><span>${esc(e.id)} — ${x ? esc(x.q.slice(0, 70)) : ''}</span></div>`; }).join('') || '<p class="muted">Ainda sem tentativas.</p>'}</div></div>`;
  const dl = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); };
  $('#csv').onclick = () => dl('progresso-mysql.csv', 'data,exercicio,correto\n' + st.log.map((e) => `${new Date(e.at).toISOString()},${e.id},${e.ok ? 1 : 0}`).join('\n'), 'text/csv');
  $('#json').onclick = () => dl('progresso-mysql.json', JSON.stringify({ aluno: st.name, resumo: { xp: s.xp, nivel: s.level, exercicios: s.exDone, capitulos: s.perChapter }, ...payload() }, null, 2), 'application/json');
}

async function vRank() {
  view.innerHTML = `<h1>🏆 Ranking</h1><div class="card" id="rk"><p class="muted">A carregar…</p></div>`;
  try {
    const rows = await api('/api/leaderboard', 'GET');
    const me = (st.name || '').toLowerCase();
    $('#rk').innerHTML = (st.token ? '' : '<p class="warn">Crie um perfil em <a href="#/me">Perfil</a> para aparecer no ranking e comparar a sua evolução com a dos colegas.</p>') +
      (rows.length ? `<div style="overflow-x:auto"><table class="rank"><tr><th>#</th><th>Aluno</th><th>Nível</th><th>XP</th><th>Concl.</th><th>🔥</th></tr>${rows.map((r, i) => `<tr class="${r.name.toLowerCase() === me ? 'me' : ''}"><td class="medal">${['🥇', '🥈', '🥉'][i] || i + 1}</td><td>${esc(r.name)}</td><td>${r.level} <span class="small muted">${r.title}</span></td><td>${r.xp}</td><td>${r.pct}%</td><td>${r.streak}</td></tr>`).join('')}</table></div>` : '<p class="muted">Ainda ninguém no ranking. Seja o primeiro!</p>');
  } catch { $('#rk').innerHTML = '<p class="warn">Não foi possível contactar o servidor. O ranking precisa de ligação ao servidor da aplicação (<code>node server.js</code>). O seu progresso continua guardado neste dispositivo.</p>'; }
}

function vMe() {
  const s = sum();
  view.innerHTML = `<h1>👤 Perfil</h1>
  <div class="card">${st.token ? `<h3>Sessão iniciada como <b>${esc(st.name)}</b></h3><p class="muted">O seu progresso é guardado no servidor e pode continuar noutro dispositivo. ${online === false ? '⚠️ Sem ligação neste momento — será sincronizado mais tarde.' : ''}</p><div class="row"><button class="btn" id="sync">🔄 Sincronizar agora</button><button class="btn ghost" id="out">Terminar sessão</button></div>`
    : `<h3>Entrar no ranking</h3><p class="muted">Escolha um nome (visível aos colegas) e um PIN/palavra-passe. O progresso já feito neste dispositivo é mantido.</p>
    <label>Nome<input class="txt" id="nm" maxlength="24" autocomplete="username" value="${esc(st.name)}"></label>
    <label>PIN (mín. 4 caracteres)<input class="txt" id="pin" type="password" autocomplete="current-password"></label>
    <div class="row"><button class="btn" id="reg">Criar perfil</button><button class="btn ghost" id="login">Já tenho conta</button></div><div class="fb bad" id="msg"></div>`}</div>
  <div class="card"><h3>Aparência e dados</h3><div class="row"><button class="btn ghost" id="theme">🌓 Mudar tema</button><button class="btn ghost" id="reset">🗑 Apagar progresso local</button></div><p class="small muted">Nível ${s.level} · ${s.xp} XP · ${s.exDone} exercícios resolvidos.</p></div>`;
  const auth = async (kind) => {
    const name = $('#nm').value.trim(), pin = $('#pin').value;
    try {
      const j = await api('/api/' + kind, 'POST', { name, pin, state: payload() });
      st.token = j.token; st.name = j.name; merge(j.state); persist(); await push(); toast('Sessão iniciada ✔'); renderNav('#/me'); vMe();
    } catch (e) { $('#msg').textContent = e.status ? e.message : 'Servidor indisponível. Execute "node server.js" para ativar o ranking.'; }
  };
  if (st.token) {
    $('#sync').onclick = async () => { await push(); toast(online ? 'Sincronizado ✔' : 'Sem ligação'); vMe(); };
    $('#out').onclick = () => { st.token = ''; persist(); vMe(); };
  } else { $('#reg').onclick = () => auth('register'); $('#login').onclick = () => auth('login'); }
  $('#theme').onclick = () => { const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches; st.theme = dark ? 'light' : 'dark'; applyTheme(); persist(); };
  $('#reset').onclick = () => { if (confirm('Apagar todo o progresso guardado NESTE dispositivo?')) { st.done = {}; st.att = {}; st.days = []; st.log = []; persist(); route(); } };
}
function applyTheme() {
  if (st.theme) document.documentElement.dataset.theme = st.theme; else delete document.documentElement.dataset.theme;
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = getComputedStyle(document.body).backgroundColor ? (st.theme === 'light' ? '#f4f6fc' : '#0f1226') : '#0f1226';
}

/* ---------- router ---------- */
function route() {
  const h = location.hash || '#/';
  renderNav(h);
  const [, a, b] = h.split('/');
  ({ '': vHome, learn: vLearn, c: () => vChapter(b), l: () => vLesson(b), lab: vLab, progress: vProgress, rank: vRank, me: vMe }[a || ''] || vHome)();
  if (a !== 'l') window.scrollTo(0, 0);
}
addEventListener('hashchange', route);
addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#modal').hidden = true; });
applyTheme();
route();
if (st.token) push();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
