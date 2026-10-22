// Pontuação (bónus, revisão, XP semanal), motor SQL (explicações, DML, funções) e normalização dos comandos.
const assert = require('assert');
const S = require('../public/score.js');
const D = require('../public/db.js');
const { CHAPTERS } = require('../public/content.js');
let n = 0;
const t = (name, fn) => { try { fn(); n++; } catch (e) { console.log('FALHOU:', name, '\n ', e.message); process.exitCode = 1; } };

const L = CHAPTERS[0].lessons[0], now = Date.now(), old = now - 30 * 864e5;
const doneAll = (at) => Object.fromEntries(L.ex.map((e) => [e.id, { tries: 1, hints: 0, at }]));
t('bónus de lição só sem respostas vistas', () => {
  const a = S.summarize({ done: doneAll(now) });
  const st2 = { done: doneAll(now), rev: {} }; const first = L.ex[0].id; delete st2.done[first]; st2.rev[first] = 1;
  const b = S.summarize(st2);
  assert.ok(a.lessonsDone.includes(L.id) && b.lessonsDone.includes(L.id));
  assert.strictEqual(a.xp - b.xp, S.exXp(L.ex[0], 1, 0) + S.LESSON_BONUS);
});
t('XP da semana conta só os últimos 7 dias', () => {
  assert.strictEqual(S.summarize({ done: doneAll(old) }).weekXp, 0);
  assert.ok(S.summarize({ done: doneAll(now) }).weekXp > 0);
});
t('revisão: XP limitado por exercício e conquista', () => {
  const review = {}; Object.keys(S.EXS).slice(0, 10).forEach((id) => (review[id] = { box: 3, due: now, ok: 9, last: now }));
  const s = S.summarize({ review });
  assert.strictEqual(s.xp, 10 * S.REVIEW_XP * S.REVIEW_MAX);
  assert.ok(s.badges.includes('review'));
});
t('XP máximo possível cabe no limite do Supabase (20000)', () => {
  const done = Object.fromEntries(Object.keys(S.EXS).map((id) => [id, { tries: 1, hints: 0, at: now }]));
  const tests = Object.fromEntries(CHAPTERS.map((c) => [c.id, { best: 100, attempts: 1, at: now }]));
  const review = Object.fromEntries(Object.keys(S.EXS).map((id) => [id, { box: 5, due: 0, ok: 9, last: now }]));
  const game = { done: Object.fromEntries(S.ROOMS.map((r) => [r.id, { at: now, hints: 0 }])) };
  const s = S.summarize({ done, tests, review, game });
  assert.ok(s.xp < 20000, 'xp=' + s.xp); assert.strictEqual(s.pct, 100); assert.strictEqual(s.cleanChapters.length, CHAPTERS.length);
});
t('necessidade de revisão', () => {
  assert.ok(S.needsReview({ tries: 2 }, false)); assert.ok(S.needsReview({ tries: 1, hints: 1 }, false));
  assert.ok(S.needsReview(null, true)); assert.ok(!S.needsReview({ tries: 1, hints: 0 }, false));
});
t('explicações do SELECT', () => {
  const m = (sql, sol, o = {}) => D.check(sql, { solution: sol, ...o }).msgs.join(' ');
  assert.match(m('SELECT nome FROM alunos', "SELECT nome FROM alunos WHERE cidade = 'Porto'"), /WHERE/);
  assert.match(m('SELECT cidade FROM alunos', 'SELECT DISTINCT cidade FROM alunos'), /DISTINCT/);
  assert.match(m('SELECT nome FROM alunos ORDER BY nome', 'SELECT nome FROM alunos ORDER BY nome DESC', { ordered: true }), /ORDER BY/);
  assert.match(m('SELECT idade, nome FROM alunos', 'SELECT nome, idade FROM alunos'), /ordem/);
  assert.match(m('SELECT nome FROM alunos, cursos', 'SELECT nome FROM cursos'), /linhas a mais|linhas, mas/);
  assert.match(m('SELECT nome, idade FROM alunos', 'SELECT nome FROM alunos'), /colunas/);
});
t('DML verificado pelo efeito', () => {
  const ex = { solution: 'UPDATE alunos SET idade = 22 WHERE id_aluno = 5' };
  assert.ok(D.checkDml('update alunos set idade=22 where nome = \'Eva Santos\'', ex).ok);
  assert.match(D.checkDml('UPDATE alunos SET idade = 22', ex).msgs[0], /WHERE/);
  assert.ok(!D.checkDml("DELETE FROM notas WHERE id_aluno = 5; UPDATE alunos SET idade = 22 WHERE id_aluno = 5", ex).ok);
  const loja = { db: 'loja', solution: "UPDATE produtos SET preco = ROUND(preco * 1.05, 2) WHERE categoria = 'Livros'" };
  assert.ok(D.checkDml("UPDATE produtos SET preco = preco * 1.05 WHERE categoria = 'Livros'", loja).ok, 'DECIMAL(8,2) arredonda');
});
t('funções do MySQL e palavras reservadas', () => {
  const db = D.create();
  assert.deepStrictEqual(D.run(db, "SELECT LEFT('Lisboa', 3) AS a, SUBSTRING('Bases', 2, 3) AS b, DATEDIFF('2025-03-10', '2025-03-01') AS c, DATE_FORMAT('2025-03-14', '%d/%m/%Y') AS d")[0], { a: 'Lis', b: 'ase', c: 9, d: '14/03/2025' });
  assert.strictEqual(D.run(db, 'SELECT COUNT(*) AS total FROM alunos ORDER BY total')[0].total, 10);
  assert.strictEqual(D.run(db, "SELECT UPPER(NULL) AS u, nome FROM alunos LIMIT 1")[0].u, null);
  assert.ok(D.runMany(db, 'CREATE INDEX idx_x ON alunos (cidade); CREATE UNIQUE INDEX idx_y ON cursos (nome)').count === 2);
});
t('comandos: aspas e utilizador@anfitrião', () => {
  const ex = { ok: ["^create user (if not exists )?'joao'@'localhost' identified by 'abc123'$"] };
  for (const v of ["CREATE USER 'joao'@'localhost' IDENTIFIED BY 'abc123';", 'create user joao@localhost identified by "abc123"', "CREATE USER `joao`@`localhost` IDENTIFIED BY 'abc123'"]) assert.ok(D.checkCode(v, ex), v);
  assert.ok(D.checkCode('CREATE ROLE editor', { ok: ["^create role (if not exists )?'editor'$"] }));
  assert.ok(D.checkCode('GRANT leitor TO rui@localhost', { ok: ["^grant 'leitor' to 'rui'@'localhost'$"] }));
});
t('script MySQL das BD de exemplo', () => {
  const s = D.toMySQL('loja');
  assert.ok(s.indexOf('CREATE TABLE clientes') < s.indexOf('CREATE TABLE encomendas'));
  assert.match(s, /PRIMARY KEY \(id_encomenda, id_produto\)/);
  assert.strictEqual((s.match(/^CREATE TABLE/gm) || []).length, 4);
});
console.log(`${n} verificações do motor e da pontuação`);
