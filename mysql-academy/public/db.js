/* Base de dados de exemplo ("escola") executada no browser com AlaSQL.
   O motor é uma aproximação do MySQL, suficiente para praticar SELECT. */
(function (root) {
  const A = root.alasql || (typeof require !== 'undefined' ? require('../public/vendor/alasql.min.js') : null);

  const SEED = {
    cursos: [[1, 'Informática', 1200], [2, 'Gestão', 900], [3, 'Design', 800]],
    alunos: [
      [1, 'Ana Silva', 20, 'Lisboa', 1], [2, 'Bruno Costa', 22, 'Porto', 1],
      [3, 'Carla Mendes', 19, 'Lisboa', 2], [4, 'Diogo Ferreira', 24, 'Braga', 3],
      [5, 'Eva Santos', 21, 'Porto', 2], [6, 'Filipe Rocha', 23, 'Lisboa', 1],
      [7, 'Graça Lopes', 20, 'Coimbra', 3], [8, 'Hugo Pires', 25, 'Braga', 1],
      [9, 'Inês Duarte', 22, 'Porto', 3], [10, 'João Ramos', 19, 'Lisboa', 2],
    ],
    notas: [
      [1, 'Bases de Dados', 17], [1, 'Programação', 18], [2, 'Bases de Dados', 14], [2, 'Programação', 12],
      [3, 'Bases de Dados', 15], [3, 'Matemática', 11], [4, 'Matemática', 9], [4, 'Bases de Dados', 13],
      [5, 'Matemática', 16], [5, 'Bases de Dados', 18], [6, 'Programação', 10], [6, 'Bases de Dados', 12],
      [7, 'Matemática', 14], [8, 'Programação', 15], [8, 'Bases de Dados', 16], [9, 'Matemática', 8],
      [9, 'Bases de Dados', 11],
    ],
  };
  const COLS = {
    cursos: ['id', 'nome', 'horas'],
    alunos: ['id', 'nome', 'idade', 'cidade', 'curso_id'],
    notas: ['aluno_id', 'disciplina', 'nota'],
  };
  const DDL = {
    cursos: 'CREATE TABLE cursos (id INT, nome VARCHAR(50), horas INT)',
    alunos: 'CREATE TABLE alunos (id INT, nome VARCHAR(80), idade INT, cidade VARCHAR(50), curso_id INT)',
    notas: 'CREATE TABLE notas (aluno_id INT, disciplina VARCHAR(50), nota INT)',
  };

  function create() {
    const name = 'escola' + Math.random().toString(36).slice(2, 8);
    A('CREATE DATABASE ' + name);
    const db = new A.Database(name);
    for (const t of Object.keys(SEED)) {
      db.exec(DDL[t]);
      for (const row of SEED[t]) {
        const o = {};
        COLS[t].forEach((c, i) => (o[c] = row[i]));
        db.tables[t].data.push(o);
      }
    }
    return db;
  }

  // Remove comentários e normaliza o SQL do aluno para o motor.
  function clean(sql) {
    return sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/`/g, '').trim().replace(/;+\s*$/, '');
  }

  function run(db, sql) {
    const s = clean(sql);
    if (!s) throw new Error('Escreva uma instrução SQL.');
    if (s.includes(';')) throw new Error('Execute uma instrução de cada vez.');
    const res = db.exec(s);
    return Array.isArray(res) ? res : [];
  }

  const rowVals = (r) => Object.values(r).map((v) => (v === null || v === undefined ? null : typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : String(v)));

  // Compara o resultado do aluno com o da solução (valores, não nomes de colunas).
  function sameResult(a, b, ordered) {
    const x = a.map((r) => JSON.stringify(rowVals(r)));
    const y = b.map((r) => JSON.stringify(rowVals(r)));
    if (x.length !== y.length) return false;
    if (!ordered) { x.sort(); y.sort(); }
    return x.every((v, i) => v === y[i]);
  }

  function check(sql, ex) {
    const db = create();
    const user = run(db, sql);
    const sol = run(db, ex.solution);
    return { rows: user, ok: sameResult(user, sol, !!ex.ordered) };
  }

  function norm(s) {
    return s.toLowerCase().replace(/`/g, '').replace(/\s+/g, ' ').trim().replace(/;$/, '').trim()
      .replace(/\s*([(),=+<>])\s*/g, '$1');
  }

  function checkCode(input, ex) {
    const n = norm(input);
    return ex.ok.some((r) => new RegExp(r).test(n));
  }

  const api = { create, run, check, checkCode, norm, SEED, COLS };
  if (typeof module !== 'undefined') module.exports = api; else root.SQLDB = api;
})(typeof window !== 'undefined' ? window : globalThis);
