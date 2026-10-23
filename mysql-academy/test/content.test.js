// Valida o conteúdo: soluções corretas, regex dos comandos, perguntas, exemplos executáveis
// e os exercícios "corrija o erro" (o texto inicial tem de ser rejeitado).
const { CHAPTERS, PASS_MARK, TEST_DRAW } = require('../public/content.js');
const D = require('../public/db.js');
const DDL = require('../public/ddl.js');
let n = 0, bad = 0;
const fail = (...a) => { console.log(...a); bad++; };
const ids = new Set();

function checkEx(s) {
  if (!s.id || ids.has(s.id)) fail('id em falta ou repetido', s.id); ids.add(s.id);
  const accepts = (input) => {
    if (s.t === 'code') return D.checkCode(input, s);
    if (s.t === 'query') return D.check(input, s).ok;
    if (s.t === 'dml') return D.checkDml(input, s).ok;
    if (s.t === 'ddl') return DDL.check(input, s).ok;
    return true;
  };
  if (s.t === 'quiz' && !(s.a >= 0 && s.a < s.opts.length)) fail('quiz inválido', s.id);
  if (s.t === 'quiz' && s.sql && /^\s*select\b/i.test(s.sql) && !s.sql.includes(';\n')) { try { D.runMany(D.create(), s.sql); } catch (e) { /* algumas são só para a BD loja ou o MySQL real */ } }
  if (s.t === 'order' && !(Array.isArray(s.parts) && s.parts.length >= 3 && new Set(s.parts).size === s.parts.length)) fail('ordenar: partes inválidas', s.id);
  if (s.t === 'query') { const r = D.check(s.solution, s); if (!r.ok || !r.rows.length) fail('consulta sem resultado', s.id); }
  if (['code', 'dml', 'ddl'].includes(s.t) && !accepts(s.solution)) fail('solução não aceite', s.id, s.t === 'ddl' ? DDL.check(s.solution, s).msgs : '');
  if (s.t === 'ddl' && DDL.check('CREATE TABLE resposta_errada (a INT);', s).ok) fail('DDL aceita uma resposta errada', s.id);
  if (s.t === 'dml') {
    if (D.checkDml(`DELETE FROM ${(s.tables || D.writtenIn(s.solution))[0]} WHERE 1 = 0`, s).ok) fail('DML aceita uma instrução sem efeito', s.id);
    if (!D.checkDml(s.solution, s).tables.length) fail('DML sem tabela a mostrar', s.id);
  }
  if (s.start) { let ok; try { ok = accepts(s.start); } catch { ok = false; } if (ok) fail('"corrija o erro": o texto inicial já é aceite', s.id); }
}

for (const c of CHAPTERS) {
  if (!c.cheat || !c.cheat.length) fail('sem resumo de sintaxe', c.id);
  if (!c.test || c.test.length < TEST_DRAW.quiz + 4) fail('banco do miniteste curto', c.id);
  if (!c.practice || c.practice.length < TEST_DRAW.practice) fail('poucos exercícios práticos no miniteste', c.id);
  if (!c.real || c.real.length < 3) fail('sem prática no MySQL real', c.id);
  for (const q of c.test) if (!(q.a >= 0 && q.a < q.opts.length)) fail('miniteste: resposta inválida', q.id);
  for (const q of c.practice || []) { n++; try { checkEx(q); } catch (e) { fail('erro', q.id, e.message); } }
  for (const l of c.lessons) {
    if (l.steps.at(-1).t === 'learn') fail('lição termina sem exercício', l.id);
    for (const s of l.steps) {
      if (s.t === 'learn') {
        // Exemplos executáveis; numa caixa de sessão correm por ordem na mesma BD. Os marcados com fails têm de dar erro.
        let sdb = null;
        for (const x of s.examples) if (x.run) {
          const db = s.session ? sdb || (sdb = D.create(x.db)) : D.create(x.db);
          let err = null; try { D.runMany(db, x.sql); } catch (e) { err = e; }
          if (err && !x.fails) fail('exemplo falha', l.id, s.title, err.message);
          if (!err && x.fails) fail('exemplo devia dar erro', l.id, s.title, x.sql);
        }
        continue;
      }
      n++;
      try { checkEx(s); } catch (e) { fail('erro', s.id, e.message); }
    }
  }
}
console.log(`${n} exercícios, ${CHAPTERS.reduce((k, c) => k + c.test.length, 0)} perguntas de miniteste (aprovação ${PASS_MARK}%), ${bad} problemas`);
if (bad) process.exit(1);
