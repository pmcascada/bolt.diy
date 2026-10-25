'use strict';
/* Servidor sem dependências: serve a PWA e guarda progresso/ranking dos alunos.
   Uso:  node server.js   (PORT=3000, TEACHER_KEY=segredo para a vista do professor) */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const SCORE = require('./public/score.js');

const PORT = +process.env.PORT || 3000;
const TEACHER_KEY = process.env.TEACHER_KEY || '';
const PUB = path.join(__dirname, 'public');
const DB_FILE = path.join(process.env.DATA_DIR || path.join(__dirname, 'data'), 'students.json');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
let users = {};
try { users = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch { /* primeira execução */ }
function save() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(users));
  fs.renameSync(tmp, DB_FILE);
}

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const hashPin = (pin, salt) => crypto.scryptSync(pin, salt, 32).toString('hex');
const key = (name) => name.trim().toLowerCase();
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };

function body(req) {
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on('data', (c) => { n += c.length; if (n > 1e6) { reject(new Error('too big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks)) : {}); } catch (e) { reject(e); } });
  });
}

const fails = new Map(); // limitação simples de tentativas de login
function throttled(ip) {
  const now = Date.now(); const f = (fails.get(ip) || []).filter((t) => now - t < 60000);
  fails.set(ip, f); return f.length >= 10;
}

function authed(req) {
  const t = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!t) return null;
  const h = sha(t);
  return Object.values(users).find((u) => u.tokenHash === h) || null;
}

const CHAPTER_IDS = new Set(require('./public/content.js').CHAPTERS.map((c) => c.id));
const LESSON_IDS = new Set(require('./public/content.js').CHAPTERS.flatMap((c) => c.lessons.map((l) => l.id)));
const ROOM_IDS = new Set(SCORE.ROOMS.map((r) => r.id));
const int = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(+v) || 0));

const str = (v, n) => String(v === undefined || v === null ? '' : v).slice(0, n);
const cleanTurma = (t) => str(t, 60).trim().replace(/\s+/g, ' ').slice(0, 30);

function cleanState(s) {
  s = s || {};
  const done = {}, rev = {}, tests = {}, pos = {}, review = {}, real = {};
  for (const [id, d] of Object.entries(s.done || {})) {
    if (SCORE.EXS[id]) done[id] = { tries: int(d.tries, 1, 99), hints: int(d.hints, 0, 9), at: +d.at || Date.now() };
  }
  for (const id of Object.keys(s.rev || {})) if (SCORE.EXS[id]) rev[id] = 1;
  for (const [id, t] of Object.entries(s.tests || {})) {
    if (CHAPTER_IDS.has(id)) tests[id] = { best: int(t.best, 0, 100), attempts: int(t.attempts, 0, 999), at: +t.at || 0, ...(t.passAt ? { passAt: +t.passAt || 0 } : {}) };
  }
  for (const [id, p] of Object.entries(s.pos || {})) if (LESSON_IDS.has(id)) pos[id] = int(p, 0, 200);
  const game = { done: {} };
  for (const [id, d] of Object.entries((s.game && s.game.done) || {})) if (ROOM_IDS.has(id)) game.done[id] = { at: +d.at || Date.now(), hints: int(d.hints, 0, 9), rev: !!d.rev };
  const days = Array.isArray(s.days) ? s.days.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(-400) : [];
  const log = Array.isArray(s.log) ? s.log.slice(-500).map((e) => ({ at: +e.at || 0, id: str(e.id, 24), ok: !!e.ok, ...(e.score !== undefined ? { score: int(e.score, 0, 100) } : {}), ...(e.a !== undefined && !e.ok ? { a: str(e.a, 160) } : {}) })) : [];
  for (const [id, r] of Object.entries(s.review || {})) if (SCORE.EXS[id]) review[id] = { box: int(r.box, 1, 5), due: +r.due || 0, ok: int(r.ok, 0, 99), last: +r.last || 0 };
  for (const [id, r] of Object.entries(s.real || {})) if (CHAPTER_IDS.has(id) && Array.isArray(r)) real[id] = [...new Set(r.map((k) => int(k, 0, 30)))].sort((a, b) => a - b);
  const pj = s.project || {};
  const project = pj.at ? { title: str(pj.title, 120), script: str(pj.script, 30000), output: str(pj.output, 30000), notes: str(pj.notes, 2000), at: +pj.at || 0, sent: !!pj.sent } : {};
  return { done, rev, tests, pos, game, days, log, review, real, project };
}

// Junta o progresso de dois dispositivos sem nunca perder trabalho já feito.
function mergeState(a, b) {
  for (const [id, d] of Object.entries(b.done || {})) if (!a.done[id] || a.done[id].at > d.at) a.done[id] = d;
  Object.assign(a.rev, b.rev || {});
  for (const [id, t] of Object.entries(b.tests || {})) {
    const m = a.tests[id];
    a.tests[id] = !m ? t : { best: Math.max(m.best, t.best), attempts: Math.max(m.attempts, t.attempts), at: Math.max(m.at, t.at), ...(m.passAt || t.passAt ? { passAt: Math.min(m.passAt || Infinity, t.passAt || Infinity) } : {}) };
  }
  for (const [id, r] of Object.entries(b.review || {})) if (!a.review[id] || (r.last || 0) > (a.review[id].last || 0)) a.review[id] = r;
  for (const [id, r] of Object.entries(b.real || {})) a.real[id] = [...new Set([...(a.real[id] || []), ...r])].sort((x, y) => x - y);
  if (b.project && (b.project.at || 0) > ((a.project && a.project.at) || 0)) a.project = b.project;
  for (const [id, p] of Object.entries(b.pos || {})) a.pos[id] = Math.max(a.pos[id] || 0, p);
  for (const [id, d] of Object.entries((b.game && b.game.done) || {})) if (!a.game.done[id] || a.game.done[id].at > d.at) a.game.done[id] = d;
  a.days = [...new Set([...a.days, ...(b.days || [])])].sort().slice(-400);
  const seen = new Set(a.log.map((e) => e.at + e.id));
  a.log = [...a.log, ...(b.log || []).filter((e) => !seen.has(e.at + e.id))].sort((x, y) => x.at - y.at).slice(-500);
  return a;
}

const publicRow = (u) => {
  const s = SCORE.summarize(u.state);
  return { name: u.name, turma: u.turma || '', xp: s.xp, weekXp: s.weekXp, level: s.level, title: s.title, pct: s.pct, exDone: s.exDone, streak: s.streak, badges: s.badges.length, updated: u.updated };
};

/* Quiz ao vivo (estilo Kahoot), em memória: o professor cria a sessão (chave de professor) e recebe uma chave
   de anfitrião; os alunos entram só com um nome. Mesmas regras das funções live_* do Supabase. */
const LIVE = new Map();
const liveName = (n) => str(n, 60).trim().replace(/\s+/g, ' ').slice(0, 20);
function livePoll(s, token, host) {
  const now = Date.now(), players = [...s.players.values()];
  const res = { state: s.state, qindex: s.qindex, total: s.questions.length, secs: s.secs, title: s.title, chapter: s.chapter, players: players.length, host };
  const ranked = players.slice().sort((a, b) => b.score - a.score || a.joined - b.joined);
  if (s.state === 'question' || s.state === 'reveal') {
    const q = s.questions[s.qindex], ans = players.filter((p) => p.answers[s.qindex]);
    Object.assign(res, { left: Math.max(0, s.secs - (now - s.started) / 1000), answered: ans.length, question: { q: q.q, sql: q.sql || null, opts: q.opts } });
    if (s.state === 'reveal') Object.assign(res, { a: q.a, why: q.why || null, counts: q.opts.map((_, i) => ans.filter((p) => p.answers[s.qindex].choice === i).length) });
  }
  if (s.state === 'reveal' || s.state === 'end' || host) res.top = ranked.slice(0, host ? 200 : 10).map((p) => ({ name: p.name, score: p.score }));
  if (token) {
    const p = s.players.get(token);
    res.me = p ? { name: p.name, score: p.score, rank: players.filter((o) => o.score > p.score).length + 1, answered: !!p.answers[s.qindex],
      last: s.state === 'reveal' && p.answers[s.qindex] ? { choice: p.answers[s.qindex].choice, points: p.answers[s.qindex].points } : null } : null;
  }
  return res;
}
async function live(req, res, url) {
  const op = url.pathname.slice('/api/live/'.length);
  const b = req.method === 'POST' ? await body(req) : {};
  const code = str(b.code || url.searchParams.get('code'), 6);
  const s = LIVE.get(code);
  const isHost = !!(s && req.headers['x-live-host'] && req.headers['x-live-host'] === s.hostKey);
  if (op === 'create' && req.method === 'POST') {
    if (!TEACHER_KEY || req.headers['x-teacher-key'] !== TEACHER_KEY) return send(res, 403, { error: 'Chave de professor inválida.' });
    const qs = Array.isArray(b.questions) ? b.questions.slice(0, 40).map((q) => ({ q: str(q.q, 2000), sql: q.sql ? str(q.sql, 2000) : null,
      opts: (Array.isArray(q.opts) ? q.opts : []).slice(0, 6).map((o) => str(o, 500)), a: int(q.a, 0, 5), why: q.why ? str(q.why, 2000) : null })).filter((q) => q.opts.length >= 2 && q.a < q.opts.length) : [];
    if (!qs.length) return send(res, 400, { error: 'Sem perguntas.' });
    let c; do c = String(100000 + crypto.randomInt(900000)); while (LIVE.has(c));
    const hostKey = crypto.randomBytes(18).toString('hex');
    LIVE.set(c, { code: c, hostKey, chapter: str(b.chapter, 20), title: str(b.title, 120), questions: qs, secs: int(b.secs || 20, 5, 120), state: 'lobby', qindex: -1, started: 0, players: new Map(), created: Date.now() });
    for (const [k, v] of LIVE) if (Date.now() - v.created > 12 * 3600e3) LIVE.delete(k); // limpa sessões antigas
    return send(res, 200, { code: c, host: hostKey });
  }
  if (!s) return send(res, 404, { error: 'Sessão não encontrada.' });
  if (op === 'poll') return send(res, 200, livePoll(s, str(url.searchParams.get('token'), 64), isHost));
  if (op === 'control' && req.method === 'POST') {
    if (!isHost) return send(res, 403, { error: 'Só o professor que criou a sessão a pode controlar.' });
    let ok = true;
    if ((b.act === 'start' || b.act === 'next') && (s.state === 'lobby' || s.state === 'reveal')) {
      if (s.qindex + 1 >= s.questions.length) s.state = 'end'; else Object.assign(s, { state: 'question', qindex: s.qindex + 1, started: Date.now() });
    } else if (b.act === 'reveal' && s.state === 'question') s.state = 'reveal';
    else if (b.act === 'end') s.state = 'end';
    else ok = false;
    return send(res, 200, { ok });
  }
  if (op === 'join' && req.method === 'POST') {
    const name = liveName(b.name);
    if (!name || s.state === 'end' || s.players.size >= 200 || [...s.players.values()].some((p) => p.name === name)) return send(res, 200, { token: null });
    const token = crypto.randomUUID();
    s.players.set(token, { name, score: 0, joined: Date.now(), answers: {} });
    return send(res, 200, { token });
  }
  if (op === 'answer' && req.method === 'POST') {
    const p = s.players.get(str(b.token, 64)), q = s.questions[s.qindex];
    const el = (Date.now() - s.started) / 1000, ch = int(b.choice, -1, 99);
    if (!p || s.state !== 'question' || el > s.secs + 1.5 || ch < 0 || ch >= q.opts.length) return send(res, 200, { ok: false });
    if (!p.answers[s.qindex]) {
      const points = ch === q.a ? Math.max(500, Math.round(1000 * (1 - Math.min(el, s.secs) / s.secs / 2))) : 0;
      p.answers[s.qindex] = { choice: ch, points }; p.score += points;
    }
    return send(res, 200, { ok: true });
  }
  send(res, 404, { error: 'Não encontrado.' });
}

async function api(req, res, url) {
  const ip = req.socket.remoteAddress;
  if (url.pathname.startsWith('/api/live/')) return live(req, res, url);
  if (req.method === 'GET' && url.pathname === '/api/leaderboard') {
    const rows = Object.values(users).map(publicRow).sort((a, b) => b.xp - a.xp || a.updated - b.updated).slice(0, 100);
    return send(res, 200, rows);
  }
  if (req.method === 'GET' && url.pathname === '/api/game/leaderboard') {
    const rows = Object.values(users).filter((u) => u.game && (u.game.score > 0 || u.game.rooms > 0))
      .map((u) => ({ name: u.name, turma: u.turma || '', score: u.game.score, rooms: u.game.rooms || 0, time: u.game.time, runs: u.game.runs, at: u.game.at }))
      .sort((a, b) => b.rooms - a.rooms || b.score - a.score || a.time - b.time || a.at - b.at).slice(0, 100);
    return send(res, 200, rows);
  }
  if (req.method === 'GET' && url.pathname === '/api/admin/students') {
    if (!TEACHER_KEY || req.headers['x-teacher-key'] !== TEACHER_KEY) return send(res, 403, { error: 'Chave de professor inválida.' });
    return send(res, 200, Object.values(users).map((u) => ({ ...publicRow(u), created: u.created, chapters: SCORE.summarize(u.state).perChapter, log: u.state.log.slice(-100), state: u.state })));
  }
  if (req.method === 'POST' && (url.pathname === '/api/register' || url.pathname === '/api/login')) {
    if (throttled(ip)) return send(res, 429, { error: 'Demasiadas tentativas. Aguarde um minuto.' });
    const b = await body(req);
    const name = String(b.name || '').trim().replace(/\s+/g, ' ');
    const pin = String(b.pin || '');
    if (!/^[\p{L}\p{N} ._-]{2,24}$/u.test(name)) return send(res, 400, { error: 'Nome inválido (2–24 letras/números).' });
    if (pin.length < 4 || pin.length > 64) return send(res, 400, { error: 'O PIN/palavra-passe deve ter pelo menos 4 caracteres.' });
    const token = crypto.randomBytes(24).toString('hex');
    let u = users[key(name)];
    if (url.pathname === '/api/register') {
      if (u) return send(res, 409, { error: 'Esse nome já existe. Escolha outro ou inicie sessão.' });
      const salt = crypto.randomBytes(16).toString('hex');
      u = users[key(name)] = { name, turma: cleanTurma(b.turma), salt, pinHash: hashPin(pin, salt), created: Date.now(), updated: Date.now(), state: cleanState(b.state) };
    } else {
      const ok = u && crypto.timingSafeEqual(Buffer.from(hashPin(pin, u.salt)), Buffer.from(u.pinHash));
      if (!ok) { fails.get(ip).push(Date.now()); return send(res, 401, { error: 'Nome ou PIN incorretos.' }); }
    }
    u.tokenHash = sha(token); save();
    return send(res, 200, { token, name: u.name, turma: u.turma || '', state: u.state });
  }
  const u = authed(req);
  if (!u) return send(res, 401, { error: 'Sessão inválida.' });
  if (req.method === 'GET' && url.pathname === '/api/progress') return send(res, 200, { state: u.state });
  if (req.method === 'PUT' && url.pathname === '/api/turma') {
    u.turma = cleanTurma((await body(req)).turma); save();
    return send(res, 200, { turma: u.turma });
  }
  if (req.method === 'PUT' && url.pathname === '/api/progress') {
    const incoming = mergeState(cleanState((await body(req)).state), u.state);
    u.state = incoming; u.updated = Date.now(); save();
    return send(res, 200, { state: u.state, me: publicRow(u) });
  }
  if (req.method === 'POST' && url.pathname === '/api/game/score') {
    // Protocolo NEXUS: guarda a melhor missão — maior nível atingido (salas concluídas), depois mais pontos e,
    // em empate, menos tempo — e conta as missões jogadas.
    const b = await body(req);
    const score = int(b.score, -1, 30001), time = int(b.time, 0, 86401), rooms = int(b.rooms, -1, 13);
    if (score < 0 || score > 30000 || time < 10 || time > 86400 || rooms < 0 || rooms > 12) return send(res, 400, { error: 'Pontuação inválida.' });
    const g = u.game || { score: 0, time: 0, rooms: 0, runs: 0, at: 0 };
    const better = !g.runs || rooms > (g.rooms || 0) || (rooms === (g.rooms || 0) && (score > g.score || (score === g.score && time < g.time)));
    if (better) Object.assign(g, { score, time, rooms, at: Date.now() });
    g.runs++; u.game = g; save();
    return send(res, 200, { best: g.score });
  }
  send(res, 404, { error: 'Não encontrado.' });
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    let p = path.normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    if (!p) p = 'index.html';
    const file = path.join(PUB, p);
    if (!file.startsWith(PUB + path.sep) && file !== PUB) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end('404'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(data);
    });
  } catch (e) { send(res, 400, { error: 'Pedido inválido.' }); }
}).listen(PORT, () => console.log(`MySQL Academy em http://localhost:${PORT}` + (TEACHER_KEY ? '' : '  (defina TEACHER_KEY para ativar a vista do professor)')));
