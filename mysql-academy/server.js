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

function cleanState(s) {
  const done = {};
  for (const [id, d] of Object.entries((s && s.done) || {})) {
    if (SCORE.EXS[id]) done[id] = { tries: Math.max(1, Math.min(99, +d.tries || 1)), hints: Math.max(0, Math.min(9, +d.hints || 0)), at: +d.at || Date.now() };
  }
  const days = Array.isArray(s && s.days) ? s.days.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(-400) : [];
  const log = Array.isArray(s && s.log) ? s.log.slice(-500).map((e) => ({ at: +e.at || 0, id: String(e.id).slice(0, 20), ok: !!e.ok })) : [];
  return { done, days, log };
}

const publicRow = (u) => {
  const s = SCORE.summarize(u.state);
  return { name: u.name, xp: s.xp, level: s.level, title: s.title, pct: s.pct, exDone: s.exDone, streak: s.streak, badges: s.badges.length, updated: u.updated };
};

async function api(req, res, url) {
  const ip = req.socket.remoteAddress;
  if (req.method === 'GET' && url.pathname === '/api/leaderboard') {
    const rows = Object.values(users).map(publicRow).sort((a, b) => b.xp - a.xp || a.updated - b.updated).slice(0, 100);
    return send(res, 200, rows);
  }
  if (req.method === 'GET' && url.pathname === '/api/admin/students') {
    if (!TEACHER_KEY || req.headers['x-teacher-key'] !== TEACHER_KEY) return send(res, 403, { error: 'Chave de professor inválida.' });
    return send(res, 200, Object.values(users).map((u) => ({ ...publicRow(u), created: u.created, chapters: SCORE.summarize(u.state).perChapter, log: u.state.log.slice(-100) })));
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
      u = users[key(name)] = { name, salt, pinHash: hashPin(pin, salt), created: Date.now(), updated: Date.now(), state: cleanState(b.state) };
    } else {
      const ok = u && crypto.timingSafeEqual(Buffer.from(hashPin(pin, u.salt)), Buffer.from(u.pinHash));
      if (!ok) { fails.get(ip).push(Date.now()); return send(res, 401, { error: 'Nome ou PIN incorretos.' }); }
    }
    u.tokenHash = sha(token); save();
    return send(res, 200, { token, name: u.name, state: u.state });
  }
  const u = authed(req);
  if (!u) return send(res, 401, { error: 'Sessão inválida.' });
  if (req.method === 'GET' && url.pathname === '/api/progress') return send(res, 200, { state: u.state });
  if (req.method === 'PUT' && url.pathname === '/api/progress') {
    const incoming = cleanState((await body(req)).state);
    // junta o progresso: nunca perde exercícios já resolvidos noutro dispositivo
    for (const [id, d] of Object.entries(u.state.done)) if (!incoming.done[id] || incoming.done[id].at > d.at) incoming.done[id] = d;
    incoming.days = [...new Set([...u.state.days, ...incoming.days])].sort().slice(-400);
    const seen = new Set(incoming.log.map((e) => e.at + e.id));
    incoming.log = [...incoming.log, ...u.state.log.filter((e) => !seen.has(e.at + e.id))].sort((a, b) => a.at - b.at).slice(-500);
    u.state = incoming; u.updated = Date.now(); save();
    return send(res, 200, { state: u.state, me: publicRow(u) });
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
