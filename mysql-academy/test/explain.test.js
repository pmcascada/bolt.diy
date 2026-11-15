// «Explicar o erro»: para os enganos mais comuns, a explicação certa e a posição certa.
global.window = globalThis;
global.alasql = require('../public/vendor/alasql.min.js');
const D = require('../public/db.js');
const DDL = require('../public/ddl.js');
const X = require('../public/explain.js');
const sch = { alunos: ['id_aluno', 'nome', 'idade', 'cidade', 'id_curso'], cursos: ['id_curso', 'nome', 'horas'], notas: ['id_aluno', 'disciplina', 'nota'] };
let n = 0, bad = 0;
const run = (sql) => { try { D.runMany(D.create('escola'), sql); return null; } catch (e) { return e; } };
function t(name, sql, re, near) {
  n++;
  const err = run(sql), a = X.analyze(sql, err, sch);
  const txt = a.hints.map((h) => h.html.replace(/<[^>]+>/g, '')).join(' | ');
  const h = a.hints.find((x) => re.test(x.html.replace(/<[^>]+>/g, '')));
  const at = h && h.pos !== null ? sql.slice(h.pos, h.pos + near.length) : null;
  if (!h || (near && at !== near)) { bad++; console.log('✗', name, '→', txt, '| posição:', JSON.stringify(at)); }
}
t('vírgula antes de FROM', 'SELECT nome, FROM alunos', /Vírgula a mais antes de FROM/, ',');
t('FROM mal escrito', 'SELECT * FORM alunos', /FORM parece FROM/, 'FORM');
t('SELECT mal escrito', 'SELCT * FROM alunos', /SELCT parece SELECT/, 'SELCT');
t('texto sem plicas', 'SELECT * FROM alunos WHERE cidade = Lisboa', /entre plicas/, 'Lisboa');
t('plica por fechar', "SELECT * FROM alunos WHERE cidade = 'Lisboa", /nunca é fechado/, "'");
t('tabela inexistente', 'SELECT * FROM aluno', /queria dizer alunos/, 'aluno');
t('coluna inexistente', 'SELECT nme FROM alunos', /queria dizer nome/, 'nme');
t('COUNT no WHERE', 'SELECT cidade, COUNT(*) FROM alunos WHERE COUNT(*) > 2 GROUP BY cidade', /HAVING/, 'COUNT');
t('ordem das cláusulas', 'SELECT *\nFROM alunos\nORDER BY nome\nWHERE idade > 20', /WHERE tem de vir antes de ORDER/, 'WHERE');
t('parêntese por fechar', 'SELECT * FROM alunos WHERE (idade > 20', /nunca é fechado/, '(');
t('valores a menos', "INSERT INTO cursos (nome, horas) VALUES ('X')", /1 valor, mas a lista de colunas tem 2/, "('X')");
t('SET com AND', "UPDATE alunos SET idade = 20 AND cidade = 'Faro' WHERE id_aluno = 1", /separam-se com vírgulas/, 'AND');
t('DELETE *', 'DELETE * FROM alunos WHERE id_aluno = 1', /não se escreve \*/, '*');
t('= NULL', 'SELECT * FROM alunos WHERE cidade = NULL', /IS NULL/, '= NULL');
t('falta ;', 'SELECT * FROM alunos\nSELECT * FROM cursos', /falta um ;/, 'SELECT * FROM cursos'.slice(0, 6));
t('vírgula no fim', "INSERT INTO cursos (nome, horas) VALUES ('X', 10),", /vírgula a mais no fim/, ',');
t('data sem plicas', 'SELECT * FROM alunos WHERE data > 2025-01-01', /datas escrevem-se entre plicas/, '2025-01-01');
// CREATE TABLE (verificador de DDL)
const ddl = (name, sql, re, near) => {
  n++; let err = null;
  try { DDL.check(sql, { solution: 'CREATE TABLE t (id INT PRIMARY KEY);' }); } catch (e) { err = e; }
  const a = X.analyze(sql, err, {}), h = a.hints.find((x) => re.test(x.html.replace(/<[^>]+>/g, '')));
  const at = h && h.pos !== null ? sql.slice(h.pos, h.pos + near.length) : null;
  if (!h || at !== near) { bad++; console.log('✗', name, '→', a.hints.map((x) => x.html.replace(/<[^>]+>/g, '')).join(' | '), '| posição:', JSON.stringify(at)); }
};
ddl('vírgula antes de )', 'CREATE TABLE fornecedores (\n  id INT PRIMARY KEY,\n  nome VARCHAR(80),\n);', /Vírgula a mais antes de \)/, ',');
ddl('vírgula antes de ON UPDATE', 'CREATE TABLE e (\n  id INT PRIMARY KEY,\n  id_c INT NOT NULL,\n  FOREIGN KEY (id_c) REFERENCES c(id_c),\n  ON UPDATE CASCADE ON DELETE RESTRICT\n);', /ON UPDATE e ON DELETE fazem parte/, ',');
ddl('FOREIGN KEY sem parênteses', 'CREATE TABLE e (\n  id INT PRIMARY KEY,\n  id_c INT NOT NULL,\n  FOREIGN KEY id_c REFERENCES c(id_c)\n);', /entre parênteses/, 'id_c');
ddl('vírgula em falta entre colunas', 'CREATE TABLE t (\n  id INT PRIMARY KEY\n  nome VARCHAR(80)\n);', /Falta uma vírgula antes de nome/, 'nome');
ddl('VARCHAR sem tamanho', 'CREATE TABLE t (\n  id INT PRIMARY KEY,\n  nome VARCHAR\n);', /VARCHAR precisa do tamanho/, 'VARCHAR');
ddl('PRIMARY mal escrito', 'CREATE TABLE t (\n  id INT PRIMRY KEY\n);', /parece PRIMARY/, 'PRIMRY');
// mensagem principal em português e sem falsos avisos em instruções corretas
n++; if (!/^Erro de sintaxe na linha 4, perto de «WHERE»/.test(X.translate(run('SELECT *\nFROM alunos\nORDER BY nome\nWHERE idade > 20').message, 'SELECT *\nFROM alunos\nORDER BY nome\nWHERE idade > 20', run('SELECT *\nFROM alunos\nORDER BY nome\nWHERE idade > 20')))) { bad++; console.log('✗ tradução da mensagem'); }
for (const ok of ["SELECT nome, cidade FROM alunos WHERE cidade = 'Lisboa' ORDER BY nome", "UPDATE alunos SET cidade = NULL WHERE id_aluno = 2", "SELECT a.nome, c.nome AS curso FROM alunos a JOIN cursos c ON a.id_curso = c.id_curso WHERE c.horas > 800",
  "SELECT cidade, COUNT(*) AS total FROM alunos GROUP BY cidade HAVING COUNT(*) > 1 ORDER BY total DESC", "SELECT * FROM alunos WHERE id_curso IN (SELECT id_curso FROM cursos WHERE horas > 900)",
  "INSERT INTO cursos (nome, horas) VALUES ('Artes', 600), ('Teatro', 450)", "SELECT nome FROM alunos WHERE idade > 22 UNION SELECT nome FROM cursos"]) {
  n++; const w = X.warnings(ok, sch); if (w.length) { bad++; console.log('✗ falso aviso em instrução correta:', ok, '→', w.map((h) => h.html.replace(/<[^>]+>/g, ''))); }
}
// nenhuma instrução correta do curso (exemplos e soluções) pode receber avisos
const { CHAPTERS } = require('../public/content.js');
const schemas = {};
const schemaOf = (w) => schemas[w] || (schemas[w] = Object.fromEntries(Object.entries(D.create(w || 'escola').tables).map(([t, tb]) => [t, (tb.columns || []).map((c) => String(c.columnid).toLowerCase())])));
for (const c of CHAPTERS) {
  const items = [...c.lessons.flatMap((l) => l.steps.flatMap((st) => [...(st.examples || []), ...(st.solution && ['query', 'dml'].includes(st.t) ? [{ sql: st.solution, db: st.db }] : [])])),
    ...(c.practice || []).filter((q) => ['query', 'dml'].includes(q.t)).map((q) => ({ sql: q.solution, db: q.db }))];
  for (const it of items) { if (!it.sql) continue; n++; const w = X.warnings(it.sql, schemaOf(it.db)); if (w.length) { bad++; console.log('✗ falso aviso no curso:', it.sql.slice(0, 80)); } }
}
console.log(`${n} verificações de «Explicar o erro», ${bad} falhadas`);
if (bad) process.exit(1);
