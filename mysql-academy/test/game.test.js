// Testes das salas do Protocolo NEXUS: para muitas sementes, as soluções cumprem as tarefas e os erros comuns não.
const A = require('../public/vendor/alasql.min.js');
require('../public/game/levels.js');
const { LEVELS, generate, roomScore } = globalThis.GAME;
let bad = 0, n = 0;
let dbn = 0;
function makeDb(lv) {
  const name = 't' + lv.id + dbn++; A('CREATE DATABASE ' + name); const db = new A.Database(name);
  for (const [t, s] of Object.entries(lv.tables)) {
    db.exec(`CREATE TABLE ${t} (${s.cols.map((c, k) => `${c} ${typeof s.rows[0][k] === 'number' ? 'INT' : 'VARCHAR(200)'}`).join(', ')})`);
    for (const r of s.rows) { const o = {}; s.cols.forEach((c, k) => (o[c] = r[k])); db.tables[t].data.push(o); }
  }
  return db;
}
const run = (db, sql) => db.exec(sql.trim().replace(/;$/, ''));
const fails = new Set();
const check = (name, cond) => { n++; if (!cond) { bad++; if (!fails.has(name)) { fails.add(name); console.log('✗', name); } } };
const cells = (lv) => Object.values(lv.tables).flatMap((t) => t.rows.flat()).map(String);
const SEEDS = 300;
const seen = {}, sols = {};
for (let seed = 1; seed <= SEEDS; seed++) {
  const levels = generate(seed * 7919);
  check('há 6 salas', levels.length === LEVELS.length);
  for (const lv of levels) {
    const db = makeDb(lv);
    check(`${lv.id}: duas tarefas, a primeira abre o campo de forças e a última a porta`, lv.tasks.length === 2 && lv.tasks[0].unlock === 'barrier' && lv.tasks[1].unlock === 'door');
    for (const t of lv.tasks) {
      // a solução só usa tabelas acessíveis no terminal da zona da tarefa
      for (const [name, s] of Object.entries(lv.tables)) if (s.zone > t.zone) check(`${t.key}: a solução não usa tabelas de outra zona`, !new RegExp(`\\b${name}\\b`).test(t.solution));
      if (t.state) check(`${t.key}: tarefa por fazer no início`, t.state((s) => db.exec(s)).open === false);
      const res = run(db, t.solution);
      if (t.code) {
        check(`${t.key}: a solução revela o código`, JSON.stringify(res).includes(t.code));
        if (t.computed) check(`${t.key}: o código calculado não aparece nos dados`, !cells(lv).includes(t.code));
        else check(`${t.key}: o código aparece uma só vez nos dados`, cells(lv).filter((v) => v.includes(t.code)).length === 1);
        check(`${t.key}: código de 4 algarismos`, /^\d{4}$/.test(t.code));
      } else check(`${t.key}: a solução cumpre a tarefa`, t.state((s) => db.exec(s)).open === true);
      (seen[t.key] = seen[t.key] || new Set()).add(t.code || t.solution);
      (sols[t.key] = sols[t.key] || new Set()).add(t.solution);
    }
  }
  // erros comuns que não devem resolver as tarefas
  const [g1, g2, g3, g4, g5, g6] = levels;
  void g1;
  const d2 = makeDb(g2);
  const setor = g2.tasks[0].solution.match(/setor = '(\w)'/)[1];
  check('g2a: só setor não chega', run(d2, `SELECT codigo_acesso FROM tecnicos WHERE setor = '${setor}'`).length > 1);
  const nivel = +g2.tasks[1].solution.match(/nivel = (\d)/)[1];
  check('g2b: só o nível não chega', run(d2, `SELECT codigo FROM cartoes WHERE nivel = ${nivel}`).length > 1);
  const d3 = makeDb(g3);
  const dir = /ASC/.test(g3.tasks[0].solution) ? 'ASC' : 'DESC';
  check('g3a: ordenar sem WHERE dá outro código', run(d3, `SELECT codigo FROM acessos ORDER BY data_hora ${dir} LIMIT 1`)[0].codigo !== g3.tasks[0].code);
  if (/utilizador =/.test(g3.tasks[0].solution)) check('g3a: sem filtrar o utilizador dá outro código', run(d3, "SELECT codigo FROM acessos WHERE porta = 'Arquivo' ORDER BY data_hora DESC LIMIT 1")[0].codigo !== g3.tasks[0].code);
  const autor = g3.tasks[1].solution.match(/autor = '([\w.]+)'/)[1];
  check('g3b: a mensagem mais recente de todas não é do autor pedido', run(d3, 'SELECT autor FROM registos ORDER BY data_hora DESC LIMIT 1')[0].autor !== autor);
  check('g3b: há códigos antigos do autor pedido', run(d3, `SELECT * FROM registos WHERE autor = '${autor}' AND mensagem LIKE '%código%'`).length >= 3);
  check('g3b: o objetivo indica o autor', g3.tasks[1].objective.includes(autor));
  const pre = g4.tasks[0].solution.match(/LIKE '(.+)%'/)[1];
  const d4 = makeDb(g4);
  check('g4a: LIKE com % dos dois lados apanha mais do que uma amostra', run(d4, `SELECT * FROM amostras WHERE nome LIKE '%${pre}%'`).length > 1);
  const st4 = g4.tasks[1].state;
  const a4 = makeDb(g4); run(a4, 'UPDATE drones SET ativo = 0'); check('g4b: UPDATE sem WHERE dispara o alarme', !!st4((s) => a4.exec(s)).alarm);
  const lp = g4.tasks[1].solution.match(/LIKE '(\w+)-%'/)[1];
  const b4 = makeDb(g4); run(b4, `DELETE FROM drones WHERE numero_serie LIKE '${lp}-%'`); check('g4b: apagar os drones dispara o alarme', !!st4((s) => b4.exec(s)).alarm);
  const c4 = makeDb(g4); const one = run(c4, `SELECT id_drone FROM drones WHERE numero_serie LIKE '${lp}-%'`)[0].id_drone;
  run(c4, `UPDATE drones SET ativo = 0 WHERE id_drone = ${one}`); check('g4b: desativar só um drone não chega', st4((s) => c4.exec(s)).open === false && !st4((s) => c4.exec(s)).alarm);
  check('g4: drones físicos = drones do laboratório na tabela', g4.drones.length === run(c4, `SELECT * FROM drones WHERE numero_serie LIKE '${lp}-%'`).length);
  const e4 = makeDb(g4); run(e4, `UPDATE drones SET ativo = 0 WHERE numero_serie LIKE '%${lp}%'`); check('g4b: LIKE com % dos dois lados apanha a armadilha e dispara o alarme', !!st4((s) => e4.exec(s)).alarm);
  const st5 = g5.tasks[0].state;
  const b5 = makeDb(g5); run(b5, "UPDATE circuitos SET ligado = 1 WHERE descricao LIKE 'Iluminação — painel%'"); check('g5a: escolher os painéis pela descrição também resolve', st5((s) => b5.exec(s)).open === true);
  const a5 = makeDb(g5); run(a5, 'UPDATE circuitos SET ligado = 1'); check('g5a: ligar tudo dispara o alarme', !!st5((s) => a5.exec(s)).alarm);
  const peakDir = /DESC/.test(g5.tasks[1].solution) ? 'DESC' : 'ASC';
  const d5 = makeDb(g5);
  const tw = (g5.tasks[1].solution.match(/ WHERE turno = '\w+'/) || [''])[0];
  const peak = run(d5, `SELECT gerador FROM leituras${tw} ORDER BY kw ${peakDir} LIMIT 1`)[0].gerador;
  if (tw) check('g5b: com turno, o total sem WHERE dá outro resultado', JSON.stringify(run(d5, g5.tasks[1].solution.replace(tw, ''))) !== JSON.stringify(run(d5, g5.tasks[1].solution)));
  check('g5b: a leitura isolada extrema não é do gerador certo', !JSON.stringify(run(d5, g5.tasks[1].solution)).includes(`"${peak}"`));
  const d6 = makeDb(g6);
  check('g6a: comparar id_nave com id_piloto não dá a resposta', run(d6, 'SELECT * FROM naves WHERE id_nave = id_piloto').length === 0);
  if (/n\.nome =/.test(g6.tasks[0].solution)) check('g6a: pela nave indicada, o estado pronta não chega (há duas)', run(d6, "SELECT * FROM naves WHERE estado = 'pronta'").length === 2);
  const plat = g6.tasks[1].objective.match(/'(Plataforma de lançamento \d)'/)[1];
  check('g6b: há outra plataforma de lançamento', run(d6, "SELECT * FROM setores WHERE nome LIKE 'Plataforma%'").length === 2);
  const st6 = g6.tasks[1].state;
  const b6 = makeDb(g6); run(b6, "UPDATE lasers SET ligado = 0 WHERE id_setor IN (SELECT id_setor FROM setores WHERE nome LIKE 'Plataforma%')"); check('g6b: desligar as duas plataformas dispara o alarme', !!st6((s) => b6.exec(s)).alarm);
  const c6 = makeDb(g6); run(c6, `UPDATE lasers SET ligado = 0 WHERE id_setor = (SELECT id_setor FROM setores WHERE nome = '${plat}')`); check('g6b: subconsulta com o nome da plataforma também resolve', st6((s) => c6.exec(s)).open === true);
  const a6 = makeDb(g6); run(a6, 'UPDATE lasers SET ligado = 0'); check('g6b: desligar todos os lasers dispara o alarme', !!st6((s) => a6.exec(s)).alarm);
}
// os dados variam de jogo para jogo
for (const [key, s] of Object.entries(seen)) if (![...s][0].includes(' ')) check(`${key}: o código varia entre jogos (${s.size} variantes)`, s.size >= 200);
// a resposta SQL também muda: cada tarefa tem várias soluções diferentes entre jogos
// (a sala 1 ensina o SELECT sem filtro, por isso só varia o que se lê no resultado e as colunas pedidas)
for (const [key, s] of Object.entries(sols)) if (key !== 'g1a') check(`${key}: a solução SQL varia entre jogos (${s.size} variantes)`, s.size >= 3);
// a mesma semente gera o mesmo jogo
check('a mesma semente gera os mesmos dados', JSON.stringify(generate(42).map((l) => l.tables)) === JSON.stringify(generate(42).map((l) => l.tables)));
// pontuação
check('pontuação: sala perfeita', roomScore({ tasks: 2, left: 100 }).total === 1000 + 500 + 300);
check('pontuação: penalizações', roomScore({ tasks: 2, left: 0, hints: 1, caught: 2 }).total === 1000 - 100 - 300);
check('pontuação: bloqueio sem bónus de tempo', roomScore({ tasks: 2, left: 50, lockdown: true }).time === 0);
check('pontuação: nunca negativa', roomScore({ tasks: 0, caught: 9 }).total === 0);
// tempos-limite (duplicados a pedido do professor): 5 a 10 minutos, a crescer de sala para sala
check('tempos-limite 300…600 s', LEVELS.map((l) => l.par).join() === '300,360,420,480,540,600');
console.log(`${n} verificações das salas do jogo (${SEEDS} jogos gerados), ${bad} falhadas`);
if (bad) process.exit(1);
