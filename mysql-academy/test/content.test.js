// Valida o conteúdo: soluções corretas, regex dos comandos, perguntas e exemplos executáveis.
const { CHAPTERS, PASS_MARK } = require('../public/content.js');
const D = require('../public/db.js');
const DDL = require('../public/ddl.js');
let n = 0, bad = 0;
const fail = (...a) => { console.log(...a); bad++; };
for (const c of CHAPTERS) {
  if (!c.cheat || !c.cheat.length) fail('sem resumo de sintaxe', c.id);
  if (!c.test || c.test.length < 5) fail('miniteste curto', c.id);
  for (const q of c.test) if (!(q.a >= 0 && q.a < q.opts.length)) fail('miniteste: resposta inválida', q.id);
  for (const l of c.lessons) {
    if (l.steps.at(-1).t === 'learn') fail('lição termina sem exercício', l.id);
    for (const s of l.steps) {
      if (s.t === 'learn') {
        for (const x of s.examples) if (x.run) { try { D.run(D.create(), x.sql); } catch (e) { fail('exemplo falha', l.id, s.title, e.message); } }
        continue;
      }
      n++;
      try {
        if (s.t === 'code' && !D.checkCode(s.solution, s)) fail('regex não aceita a solução', s.id);
        if (s.t === 'query') { const r = D.check(s.solution, s); if (!r.ok || !r.rows.length) fail('consulta sem resultado', s.id); }
        if (s.t === 'quiz' && !(s.a >= 0 && s.a < s.opts.length)) fail('quiz inválido', s.id);
        if (s.t === 'ddl') {
          const r = DDL.check(s.solution, s); if (!r.ok) fail('solução DDL não aceite', s.id, r.msgs);
          if (DDL.check('CREATE TABLE resposta_errada (a INT);', s).ok) fail('DDL aceita uma resposta errada', s.id);
        }
      } catch (e) { fail('erro', s.id, e.message); }
    }
  }
}
console.log(`${n} exercícios, ${CHAPTERS.reduce((k, c) => k + c.test.length, 0)} perguntas de miniteste (aprovação ${PASS_MARK}%), ${bad} problemas`);
if (bad) process.exit(1);
