// Testes das salas do Protocolo NEXUS: as soluções abrem as portas e os erros comuns não.
const A = require('../public/vendor/alasql.min.js');
require('../public/game/levels.js');
const { LEVELS } = globalThis.GAME;
let bad = 0, n = 0;
function makeDb(lv) {
  const name = 't' + lv.id + Math.random().toString(36).slice(2, 7); A('CREATE DATABASE ' + name); const db = new A.Database(name);
  for (const [t, s] of Object.entries(lv.tables)) {
    db.exec(`CREATE TABLE ${t} (${s.cols.map((c, k) => `${c} ${typeof s.rows[0][k] === 'number' ? 'INT' : 'VARCHAR(80)'}`).join(', ')})`);
    for (const r of s.rows) { const o = {}; s.cols.forEach((c, k) => (o[c] = r[k])); db.tables[t].data.push(o); }
  }
  return db;
}
const run = (db, sql) => db.exec(sql.trim().replace(/;$/, ''));
const check = (name, cond) => { n++; if (!cond) { bad++; console.log('✗', name); } };
for (const lv of LEVELS) {
  const db = makeDb(lv); const res = run(db, lv.solution);
  if (lv.door.code) {
    check(`${lv.id}: a solução revela o código ${lv.door.code}`, JSON.stringify(res).includes(`"${lv.door.code}"`));
    const codes = Object.values(lv.tables).flatMap((t) => t.rows.flat()).filter((v) => v === lv.door.code);
    check(`${lv.id}: o código existe uma só vez nos dados`, codes.length === 1);
  } else {
    check(`${lv.id}: a solução abre a porta`, lv.door.state((s) => db.exec(s)).open === true);
  }
}
// erros que devem ser apanhados
const g2 = makeDb(LEVELS[1]); check('g2: só um técnico C/noite', run(g2, "SELECT * FROM tecnicos WHERE setor = 'C' AND turno = 'noite'").length === 1);
const g3 = makeDb(LEVELS[2]); check('g3: sem WHERE o mais recente NÃO é o código', run(g3, 'SELECT codigo FROM acessos ORDER BY data_hora DESC LIMIT 1')[0].codigo !== LEVELS[2].door.code);
const g4a = makeDb(LEVELS[3]); run(g4a, 'UPDATE drones SET ativo = 0'); check('g4: UPDATE sem WHERE dispara o alarme', !!LEVELS[3].door.state((s) => g4a.exec(s)).alarm);
const g4b = makeDb(LEVELS[3]); run(g4b, "DELETE FROM drones WHERE numero_serie LIKE 'LAB-%'"); check('g4: apagar o drone dispara o alarme', !!LEVELS[3].door.state((s) => g4b.exec(s)).alarm);
const g4c = makeDb(LEVELS[3]); run(g4c, 'UPDATE drones SET ativo = 0 WHERE id_drone = 5'); check('g4: UPDATE pelo id_drone também abre', LEVELS[3].door.state((s) => g4c.exec(s)).open === true);
const g4d = makeDb(LEVELS[3]); check('g4: porta fechada no início', LEVELS[3].door.state((s) => g4d.exec(s)).open === false);
console.log(`${n} verificações das salas do jogo, ${bad} falhadas`);
if (bad) process.exit(1);
