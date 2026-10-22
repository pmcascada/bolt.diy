// Sequência pedagógica: cada comando, cláusula ou função usada numa resposta (ou numa pergunta)
// tem de ter sido explicada antes, num passo de explicação (learn) de uma lição anterior ou da mesma lição.
const { CHAPTERS } = require('../public/content.js');
const PHRASES = ['ORDER BY','GROUP BY','SHOW TABLES','SHOW DATABASES','SHOW GRANTS','SHOW INDEX','SHOW CREATE','CREATE TABLE','CREATE DATABASE','CREATE INDEX','CREATE UNIQUE INDEX','CREATE VIEW','CREATE OR REPLACE','CREATE USER','CREATE ROLE','DROP TABLE','DROP DATABASE','DROP VIEW','DROP INDEX','DROP USER','DROP COLUMN','DROP FOREIGN KEY','DROP CHECK','ALTER TABLE','ALTER USER','ADD COLUMN','ADD CONSTRAINT','RENAME COLUMN','RENAME TABLE','INSERT INTO','DELETE FROM','TRUNCATE','PRIMARY KEY','FOREIGN KEY','REFERENCES','ON DELETE','ON UPDATE','CASCADE','SET NULL','RESTRICT','LEFT JOIN','INNER JOIN','JOIN','UNION ALL','UNION','IS NULL','IS NOT NULL','NOT NULL','AUTO_INCREMENT','UNIQUE','DEFAULT','CHECK','DISTINCT','HAVING','LIMIT','BETWEEN','LIKE','IN (','CASE','IFNULL','COALESCE','COUNT','SUM','AVG','MIN','MAX','ROUND','UPPER','LOWER','LENGTH','CONCAT','LEFT(','SUBSTRING','YEAR','MONTH','DATEDIFF','DATE_FORMAT','CURDATE','VERSION','USE ','EXIT','DESCRIBE','EXPLAIN','GRANT','REVOKE','WITH GRANT OPTION','SET DEFAULT ROLE','IDENTIFIED BY','UPDATE','SET ','WHERE','SELECT','AS ','mysqldump','mysql -u','SOURCE','--all-databases','--databases','--single-transaction','gzip','gunzip','-e','INT','VARCHAR','CHAR(','DECIMAL','DATE ','TEXT','DATETIME','MODIFY','CHANGE','AFTER','IF NOT EXISTS','IF EXISTS','CHARACTER SET','LAST_INSERT_ID','NOT IN','EXISTS','AND','OR ','NOT ','<>','>=','<=',' < ',' > '];
const norm = (s) => ' ' + String(s || '').replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ') + ' ';
function concepts(text) {
  const t = norm(text), out = new Set();
  for (const p of PHRASES) {
    const esc = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const lower = /^[a-z-]/.test(p);
    const re = new RegExp((/^[A-Za-z]/.test(p) ? '(^|[^A-Za-z_])' : '') + esc + (/[A-Za-z]$/.test(p) ? '(?![A-Za-z_])' : ''), lower ? '' : (p === p.toUpperCase() ? 'i' : ''));
    if (re.test(t)) out.add(p.trim());
  }
  // combinações sem sentido isolado
  if (out.has('INNER JOIN') || out.has('LEFT JOIN')) out.delete('JOIN') ;
  return out;
}
const learnText = (s) => [s.title, s.html, ...(s.examples || []).map((e) => e.sql + ' ' + (e.note || ''))].join(' ');
const answerText = (s) => s.t === 'quiz' ? [s.q, s.sql || '', s.opts[s.a]].join(' ') : s.t === 'order' ? s.parts.join(' ') : s.solution;
const known = new Set();
const report = [];
for (const c of CHAPTERS) {
  for (const l of c.lessons) {
    for (const s of l.steps) {
      if (s.t === 'learn') { concepts(learnText(s)).forEach((x) => known.add(x)); continue; }
      const miss = [...concepts(answerText(s))].filter((x) => !known.has(x));
      if (miss.length) report.push(`${s.id} [${s.t}] falta: ${miss.join(', ')}\n    ${String(s.q).slice(0, 110)}`);
    }
  }
  for (const s of [...c.test, ...(c.practice || [])]) {
    const miss = [...concepts(answerText(s))].filter((x) => !known.has(x));
    if (miss.length) report.push(`${s.id} [teste ${s.t}] falta: ${miss.join(', ')}\n    ${String(s.q).slice(0, 110)}`);
  }
}
if (report.length) console.log(report.join('\n'));
console.log(`${report.length} conceitos usados antes de serem explicados`);
if (report.length) process.exit(1);
