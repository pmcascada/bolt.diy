/* «Explicar o erro»: ajuda o aluno a encontrar o erro numa instrução SQL, em português.
   Junta duas fontes: a posição indicada pelo motor (simulador AlaSQL ou verificador de CREATE TABLE) e
   uma análise do próprio texto, que procura os enganos mais comuns (vírgulas, parênteses, plicas, palavras
   mal escritas, nomes inexistentes, ordem das cláusulas…). Não altera nada: só explica. */
(function (root) {
  const KW = new Set(('select from where and or not in is null like between insert into values update set delete create table drop alter add '
    + 'column primary key foreign references on cascade restrict default unique check constraint auto_increment order by group having limit offset '
    + 'asc desc distinct join inner left right outer as union all exists case when then else end view index use database show databases tables '
    + 'describe desc truncate start transaction commit rollback begin modify change rename to if engine charset character collate grant revoke '
    + 'identified user privileges with option for no action true false int integer varchar char text date datetime time year decimal float double '
    + 'boolean bool tinyint smallint bigint enum timestamp count sum avg min max concat upper lower length round now curdate year month day '
    + 'replace ifnull coalesce left right substring trim savepoint release autocommit full cross natural using mod div xor').split(' '));
  // Palavras-chave que os alunos mais escrevem mal (para sugerir a correção).
  const MAIN = ['select', 'from', 'where', 'insert', 'into', 'values', 'update', 'delete', 'create', 'table', 'primary', 'foreign', 'references',
    'order', 'group', 'having', 'limit', 'distinct', 'between', 'like', 'default', 'varchar', 'integer', 'decimal', 'unique', 'constraint',
    'alter', 'truncate', 'transaction', 'commit', 'rollback', 'cascade', 'restrict', 'auto_increment', 'database', 'inner', 'join', 'check'];
  const DDL_KW = ['primary', 'foreign', 'references', 'varchar', 'integer', 'decimal', 'default', 'unique', 'constraint', 'cascade', 'restrict', 'auto_increment', 'table', 'check', 'datetime', 'boolean'];
  const TYPES = new Set('int integer tinyint smallint bigint decimal numeric float double varchar char text date datetime time timestamp year boolean bool enum'.split(' '));
  const START = new Set('select insert update delete create drop alter truncate use show describe desc start begin commit rollback set grant revoke replace with savepoint release'.split(' '));
  const CLAUSES = ['select', 'from', 'where', 'group', 'having', 'order', 'limit'];
  const AGG = new Set(['count', 'sum', 'avg', 'min', 'max']);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const code = (s) => `<code>${esc(s)}</code>`;

  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); // letras trocadas
    }
    return d[a.length][b.length];
  }
  const closest = (w, list) => {
    let best = null, bd = 9;
    for (const x of list) { const d = lev(w, x); if (d < bd) { bd = d; best = x; } }
    return best && bd <= (w.length >= 6 ? 2 : 1) ? best : null;
  };

  /* ---------- símbolos, com a posição de cada um ---------- */
  function tokenize(src) {
    const out = [], issues = []; let i = 0;
    while (i < src.length) {
      const c = src[i], st = i;
      if (/\s/.test(c)) { i++; continue; }
      if ((c === '-' && src[i + 1] === '-') || c === '#') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue; }
      if (c === "'" || c === '"') {
        let j = i + 1;
        while (j < src.length && !(src[j] === c && src[j + 1] !== c)) { if (src[j] === '\\' || (src[j] === c && src[j + 1] === c)) j++; j++; }
        if (j >= src.length) { issues.push({ pos: st, len: 1, html: `Há um texto que começa com ${code(c)} e nunca é fechado. Todo o texto (e as datas) tem de estar entre duas plicas: ${code("'Lisboa'")}, ${code("'2025-01-31'")}.` }); out.push({ t: 'str', v: src.slice(i + 1), pos: st, end: src.length }); break; }
        out.push({ t: 'str', v: src.slice(i + 1, j), pos: st, end: j + 1 }); i = j + 1; continue;
      }
      if (c === '`') { const e = src.indexOf('`', i + 1); const j = e < 0 ? src.length : e + 1; out.push({ t: 'id', v: src.slice(i + 1, j - 1).toLowerCase(), q: true, pos: st, end: j }); i = j; continue; }
      const num = /^\d+(\.\d+)?/.exec(src.slice(i));
      if (num) { out.push({ t: 'num', v: num[0], pos: st, end: st + num[0].length }); i += num[0].length; continue; }
      const id = /^[A-Za-z_À-ſ][\wÀ-ſ$]*/.exec(src.slice(i));
      if (id) { out.push({ t: 'id', v: id[0].toLowerCase(), raw: id[0], pos: st, end: st + id[0].length }); i += id[0].length; continue; }
      const op = /^(>=|<=|<>|!=|@@|[(),;.=<>+\-*/%@])/.exec(src.slice(i));
      out.push({ t: 'sym', v: op ? op[0] : c, pos: st, end: st + (op ? op[0].length : 1) }); i += op ? op[0].length : 1;
    }
    return { tokens: out, issues };
  }

  // Divide o script em instruções (por «;»), com a posição de cada uma.
  function statements(tokens) {
    const out = []; let cur = [];
    for (const t of tokens) { if (t.t === 'sym' && t.v === ';') { if (cur.length) out.push(cur); cur = []; } else cur.push(t); }
    if (cur.length) out.push(cur);
    return out;
  }

  /* ---------- a posição indicada pelo motor ---------- */
  const GOT = { STAR: '*', COMMA: ',', LPAR: '(', RPAR: ')', SEMICOLON: ';', EQ: '=', DOT: '.', PLUS: '+', MINUS: '-', GT: '>', LT: '<' };
  function engineInfo(msg, src, stmtStart) {
    const out = {};
    const m = /^Parse error on line (\d+):\n(.*)\n(-*)\^\n[\s\S]*?got '([^']+)'/.exec(msg);
    if (m) {
      out.parse = true;
      out.got = m[4] === 'EOF' ? null : GOT[m[4]] || null;
      let shown = m[2], caret = m[3].length;
      if (shown.startsWith('...')) { shown = shown.slice(3); caret -= 3; }
      const past = shown.slice(0, caret).trim();
      // O motor mostra o texto sem mudanças de linha: procura-o no texto do aluno.
      const flat = [], map = [];
      for (let k = stmtStart; k < src.length; k++) if (src[k] !== '\n' && src[k] !== '\r') { flat.push(src[k]); map.push(k); }
      const f = flat.join('');
      const at = past ? f.toLowerCase().indexOf(past.toLowerCase()) : 0;
      if (at >= 0) { let k = at + past.length; while (k < f.length && /\s/.test(f[k])) k++; out.pos = k < map.length ? map[k] : src.length; }
    }
    const col = /Column does not exist: ([\w.]+)/i.exec(msg); if (col) out.column = col[1].split('.').pop().toLowerCase();
    const tab = /Table does not exist: (\w+)/i.exec(msg); if (tab) out.table = tab[1].toLowerCase();
    if (/is not defined/.test(msg)) out.agg = true;
    const nv = /number of values \((\d+)\) does not match the number of columns \((\d+)\)/i.exec(msg); if (nv) out.values = [+nv[1], +nv[2]];
    return out;
  }

  /* ---------- análise do texto: enganos comuns ---------- */
  function lint(stmt, schema) {
    const H = [];
    // silent: enganos que o simulador aceita sem erro (mas que no MySQL dão erro ou um resultado errado)
    const add = (t, html, len, silent) => H.push({ pos: t ? t.pos : null, len: len || (t ? t.end - t.pos : 1), html, silent: !!silent });
    const tables = new Set(Object.keys(schema || {}));
    const cols = new Set(Object.values(schema || {}).flat());
    const first = stmt[0];
    const kind = first && first.t === 'id' ? first.v : '';
    // aliases (FROM alunos a / AS x), para não os tomar por colunas desconhecidas
    const alias = new Set();
    stmt.forEach((t, k) => {
      const prev = stmt[k - 1];
      if (t.t === 'id' && prev && prev.t === 'id' && prev.v === 'as') alias.add(t.v);
      if (t.t === 'id' && prev && prev.t === 'id' && tables.has(prev.v) && !KW.has(t.v)) alias.add(t.v);
    });
    // instrução que não começa por uma palavra-chave conhecida
    if (first && first.t === 'id' && !START.has(kind)) {
      const s = closest(kind, [...START]);
      add(first, s ? `${code(first.raw || first.v)} parece ${code(s.toUpperCase())} mal escrito.` : `Uma instrução tem de começar por uma palavra-chave, por exemplo ${code('SELECT')}, ${code('INSERT')}, ${code('UPDATE')}, ${code('DELETE')} ou ${code('CREATE')}.`);
    }
    // parênteses
    const open = [];
    for (const t of stmt) {
      if (t.t !== 'sym') continue;
      if (t.v === '(') open.push(t);
      else if (t.v === ')') { if (!open.length) add(t, `Este ${code(')')} fecha um parêntese que nunca foi aberto.`); else open.pop(); }
    }
    for (const t of open) add(t, `Este ${code('(')} nunca é fechado: falta um ${code(')')} mais à frente.`);
    let depth = 0, inCreate = kind === 'create' && stmt[1] && stmt[1].v === 'table', clauseSeen = [];
    for (let k = 0; k < stmt.length; k++) {
      const t = stmt[k], n = stmt[k + 1], n2 = stmt[k + 2], p = stmt[k - 1];
      if (t.t === 'sym' && t.v === '(') depth++;
      if (t.t === 'sym' && t.v === ')') depth--;
      const isKw = (x, w) => x && x.t === 'id' && !x.q && x.v === w;
      // vírgulas a mais
      if (t.t === 'sym' && t.v === ',') {
        if (!n) add(t, `Há uma vírgula a mais no fim da instrução. Retire-a.`);
        else if (n.t === 'sym' && n.v === ')') add(t, `Vírgula a mais antes de ${code(')')}: a vírgula só separa elementos e o último não leva vírgula.`);
        else if (n.t === 'sym' && n.v === ',') add(t, `Duas vírgulas seguidas: falta um elemento entre elas, ou sobra uma vírgula.`);
        else if (isKw(n, 'on') && n2 && (isKw(n2, 'update') || isKw(n2, 'delete'))) add(t, `Retire esta vírgula: ${code('ON UPDATE')} e ${code('ON DELETE')} fazem parte da ${code('FOREIGN KEY')} e escrevem-se a seguir ao ${code('REFERENCES …')}, sem vírgula.`);
        else if (n.t === 'id' && ['from', 'where', 'group', 'order', 'having', 'limit', 'values', 'set'].includes(n.v)) add(t, `Vírgula a mais antes de ${code(n.v.toUpperCase())}: depois do último elemento da lista não há vírgula.`);
      }
      // FOREIGN KEY sem parênteses
      if (isKw(t, 'foreign') && isKw(n, 'key') && n2 && !(n2.t === 'sym' && n2.v === '(')) add(n2, `A coluna da chave estrangeira vai entre parênteses: ${code('FOREIGN KEY (coluna) REFERENCES tabela(coluna)')}.`);
      if (isKw(t, 'references') && n && n.t === 'id' && !(n2 && n2.t === 'sym' && n2.v === '(')) add(n, `Depois do nome da tabela referenciada, indique a coluna entre parênteses: ${code(`REFERENCES ${n.v}(coluna)`)}.`);
      // CREATE TABLE: vírgula em falta entre colunas / VARCHAR sem tamanho
      if (inCreate && depth === 1 && t.t === 'id' && n && n.t === 'id' && TYPES.has(n.v) && p && !(p.t === 'sym' && (p.v === ',' || p.v === '(')) && !KW.has(t.v)) add(t, `Falta uma vírgula antes de ${code(t.raw || t.v)}: cada coluna separa-se da anterior com uma vírgula.`);
      if ((kind === 'create' || kind === 'alter') && t.t === 'id' && (t.v === 'varchar' || t.v === 'char') && !(n && n.t === 'sym' && n.v === '(') && t.v === 'varchar') add(t, `${code('VARCHAR')} precisa do tamanho máximo entre parênteses, por exemplo ${code('VARCHAR(80)')}.`);
      // = NULL
      if (t.t === 'sym' && ['=', '<>', '!='].includes(t.v) && isKw(n, 'null')) {
        const assign = t.v === '=' && ((kind === 'update' && !clauseSeen.includes('where')) || kind === 'set'); // SET coluna = NULL é válido
        if (!assign) add(t, `Para comparar com NULL não se usa ${code(t.v)}: escreva ${code(t.v === '=' ? 'IS NULL' : 'IS NOT NULL')}. Com ${code(t.v)} o resultado nunca é verdadeiro.`, (n.end - t.pos), true);
      }
      // datas sem plicas: 2025-01-31
      if (t.t === 'num' && /^\d{4}$/.test(t.v) && n && n.v === '-' && n2 && n2.t === 'num' && stmt[k + 3] && stmt[k + 3].v === '-') add(t, `As datas escrevem-se entre plicas: ${code(`'${t.v}-${n2.v}-${(stmt[k + 4] || {}).v || 'DD'}'`)}. Sem plicas, o MySQL faz a conta ${t.v} − ${n2.v} − …`, (stmt[k + 4] || n2).end - t.pos, true);
      // cláusulas
      if (depth === 0 && t.t === 'id' && !t.q && CLAUSES.includes(t.v) && (t.v !== 'group' && t.v !== 'order' || isKw(n, 'by'))) {
        const order = CLAUSES.indexOf(t.v), later = clauseSeen.find((c) => CLAUSES.indexOf(c) > order);
        if (later && kind === 'select' && t.v !== 'select') add(t, `Ordem das cláusulas: ${code(t.v.toUpperCase())} tem de vir antes de ${code(later.toUpperCase())}. A ordem é SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT.`);
        clauseSeen.push(t.v);
        // instrução seguinte sem ; antes
        if (t.v === 'select' && k > 0 && p && !(p.t === 'id' && ['union', 'all', 'as', 'distinct'].includes(p.v)) && !['insert', 'create', 'replace'].includes(kind)) add(t, `Parece começar aqui uma nova instrução: falta um ${code(';')} no fim da instrução anterior.`);
      }
      if (depth === 0 && k > 0 && t.t === 'id' && ['insert', 'update', 'delete', 'create', 'drop', 'alter'].includes(t.v) && p && !(p.t === 'sym' && p.v === '(') && !isKw(p, 'on') && !isKw(p, 'for') && !['grant', 'revoke', 'alter'].includes(kind) && !(p.t === 'sym' && p.v === ',') && !(t.v === 'update' && isKw(p, 'key')) && !(['update', 'delete'].includes(t.v) && isKw(p, 'on'))) add(t, `Parece começar aqui uma nova instrução: falta um ${code(';')} no fim da instrução anterior.`);
      // funções de agregação no WHERE
      if (AGG.has(t.v) && n && n.v === '(' && clauseSeen[clauseSeen.length - 1] === 'where' && depth === 0) add(t, `${code(t.v.toUpperCase() + '(…)')} não pode estar no ${code('WHERE')}: as condições sobre grupos escrevem-se no ${code('HAVING')}, depois do ${code('GROUP BY')}.`);
      // DELETE *
      if (kind === 'delete' && k === 1 && t.v === '*') add(t, `No DELETE não se escreve ${code('*')}: ${code('DELETE FROM tabela WHERE …')} apaga linhas inteiras.`);
      // UPDATE … SET a = 1 AND b = 2
      if (kind === 'update' && isKw(t, 'and') && clauseSeen.length === 0 && stmt.slice(0, k).some((x) => isKw(x, 'set'))) add(t, `No ${code('SET')}, as várias colunas separam-se com vírgulas, não com ${code('AND')}: ${code("SET idade = 20, cidade = 'Faro'")}.`, 0, true);
      // palavras mal escritas e nomes desconhecidos
      if (t.t === 'id' && !t.q && !KW.has(t.v) && !tables.has(t.v) && !cols.has(t.v) && !alias.has(t.v) && !(n && n.v === '(') && !(p && p.v === '.')) {
        const ddl = kind === 'create' || kind === 'alter';
        const colGuess = cols.size ? closest(t.v, [...cols, ...tables]) : null;
        const kwGuess = t.v.length >= 4 && !colGuess ? closest(t.v, ddl ? DDL_KW : MAIN) : null;
        const after = p && p.t === 'id' ? p.v : '';
        if (kwGuess && k > 0) add(t, `${code(t.raw || t.v)} parece ${code(kwGuess.toUpperCase())} mal escrito.`);
        else if (tables.size && ['from', 'join', 'into', 'update', 'table'].includes(after) && !(kind === 'create' && after === 'table')) {
          const g = closest(t.v, [...tables]);
          add(t, `A tabela ${code(t.raw || t.v)} não existe${g ? ` — queria dizer ${code(g)}?` : `. Tabelas disponíveis: ${[...tables].map(code).join(', ')}.`}`);
        } else if (cols.size && START.has(kind) && !['create', 'alter', 'set', 'use', 'show'].includes(kind)) { // SET variável = valor, mysqldump… não são consultas
          const opPrev = p && p.t === 'sym' && ['=', '<>', '!=', '>', '<', '>=', '<='].includes(p.v);
          const g = closest(t.v, [...cols]);
          if (opPrev && !g) add(t, `${code(t.raw || t.v)} não é uma coluna. Se é um texto, escreva-o entre plicas: ${code(`'${t.raw || t.v}'`)}.`, 0, true);
          else if (g) add(t, `A coluna ${code(t.raw || t.v)} não existe — queria dizer ${code(g)}?`);
        }
      }
    }
    // INSERT: número de valores diferente do número de colunas
    if (kind === 'insert') {
      const iv = stmt.findIndex((x) => x.t === 'id' && x.v === 'values');
      const lp = stmt.findIndex((x) => x.v === '(');
      if (iv > 0 && lp > 0 && lp < iv) {
        const count = (from) => { let d = 0, n = 1, k = from; for (; k < stmt.length; k++) { const x = stmt[k]; if (x.v === '(') d++; else if (x.v === ')') { d--; if (!d) break; } else if (x.v === ',' && d === 1) n++; } return [n, k]; };
        const [nc] = count(lp);
        for (let k = iv + 1; k < stmt.length; k++) if (stmt[k].v === '(') { const [nv, e] = count(k); if (nv !== nc) add(stmt[k], `Este grupo de valores tem ${nv} ${nv === 1 ? 'valor' : 'valores'}, mas a lista de colunas tem ${nc}: tem de haver um valor por coluna, pela mesma ordem.`, (stmt[e] || stmt[k]).end - stmt[k].pos); k = e; }
      }
    }
    return H;
  }

  /* ---------- análise completa ---------- */
  // sql: o texto do aluno; err: o erro (com .message, .pos do verificador de CREATE TABLE, .done do simulador);
  // schema: { tabela: [colunas] } da BD usada (para sugerir nomes).
  function analyze(sql, err, schema) {
    const src = String(sql || '');
    const msg = String((err && err.message) || err || '');
    const { tokens, issues } = tokenize(src);
    const stmts = statements(tokens);
    const idx = err && Number.isInteger(err.done) ? Math.min(err.done, stmts.length - 1) : -1;
    const target = idx >= 0 ? [stmts[idx]] : stmts;
    const hints = [...issues];
    for (const s of target) if (s) hints.push(...lint(s, schema));
    const start = idx >= 0 && stmts[idx] ? stmts[idx][0].pos : 0;
    const eng = engineInfo(msg, src, start);
    let pos = err && Number.isInteger(err.pos) ? err.pos : eng.pos;
    // nomes inexistentes indicados pelo motor
    const findTok = (name) => (idx >= 0 ? stmts[idx] : tokens).find((t) => t.t === 'id' && t.v === name);
    if (eng.column && !hints.some((h) => /coluna/.test(h.html))) {
      const t = findTok(eng.column), g = closest(eng.column, Object.values(schema || {}).flat());
      hints.push({ pos: t ? t.pos : null, len: t ? t.end - t.pos : 1, html: `A coluna ${code(eng.column)} não existe nas tabelas usadas${g ? ` — queria dizer ${code(g)}?` : '. Veja os nomes no botão «Estrutura das tabelas».'}` });
    }
    if (eng.table && !hints.some((h) => /tabela/.test(h.html) && h.html.includes(eng.table))) {
      const t = findTok(eng.table), g = closest(eng.table, Object.keys(schema || {}));
      hints.push({ pos: t ? t.pos : null, len: t ? t.end - t.pos : 1, html: `A tabela ${code(eng.table)} não existe${g ? ` — queria dizer ${code(g)}?` : '.'}` });
    }
    if (eng.agg && !hints.some((h) => /HAVING/.test(h.html))) hints.push({ pos: null, html: `Há uma função de agregação (${code('COUNT')}, ${code('SUM')}, ${code('AVG')}…) num sítio onde não pode estar, normalmente no ${code('WHERE')}. As condições sobre grupos escrevem-se no ${code('HAVING')}.` });
    if (eng.values && !hints.some((h) => /valores/.test(h.html))) hints.push({ pos: null, html: `Indicou ${eng.values[0]} ${eng.values[0] === 1 ? 'valor' : 'valores'} para ${eng.values[1]} colunas: tem de haver um valor por coluna, pela mesma ordem.` });
    // ordena: primeiro as pistas perto do sítio onde o motor parou
    if (pos === undefined || pos === null) pos = (hints.find((h) => h.pos !== null) || {}).pos;
    hints.sort((a, b) => (a.pos === null) - (b.pos === null) || (pos === undefined ? 0 : Math.abs(a.pos - pos) - Math.abs(b.pos - pos)));
    const seen = new Set();
    const uniq = hints.filter((h) => { const k = h.html; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 5);
    if (eng.parse && !uniq.length) {
      uniq.push({ pos: null, html: eng.got ? `O MySQL não esperava encontrar ${code(eng.got)} neste ponto. Veja a palavra ou o símbolo imediatamente <b>antes</b> do sítio assinalado: muitas vezes falta (ou sobra) uma vírgula, um parêntese ou uma palavra-chave.` : `A instrução terminou antes do esperado: falta alguma coisa no fim (um parêntese, um valor, o nome de uma coluna ou de uma tabela…).` });
    }
    return { pos, hints: uniq, line: pos === undefined ? null : src.slice(0, pos).split('\n').length };
  }

  // Mensagem principal do erro em português (o motor responde em inglês).
  function translate(msg, src, err) {
    msg = String(msg || '');
    const m = /^Parse error on line \d+:[\s\S]*?got '([^']+)'/.exec(msg);
    if (m) {
      const a = analyze(src, err, {});
      const where = a.line ? ` na linha ${a.line}` : '';
      const tok = m[1] === 'EOF' ? null : GOT[m[1]];
      if (m[1] === 'EOF') return `Erro de sintaxe: a instrução terminou antes do esperado${where}. Falta alguma coisa no fim (um parêntese, um valor, um nome…).`;
      const near = a.pos !== undefined && a.pos !== null ? (String(src).slice(a.pos).match(/^\S+/) || [''])[0].slice(0, 20) : tok;
      return `Erro de sintaxe${where}${near ? `, perto de «${near}»` : ''}. O MySQL não percebe a instrução a partir desse ponto: veja o que está imediatamente antes.`;
    }
    let x;
    if ((x = /Column does not exist: ([\w.]+)/i.exec(msg))) return `A coluna «${x[1].split('.').pop()}» não existe nas tabelas usadas. (No MySQL: ERROR 1054)`;
    if (/is not defined/.test(msg)) return 'Não é possível usar funções de agregação (COUNT, SUM, AVG…) neste sítio — por exemplo no WHERE. Use o HAVING. (No MySQL: ERROR 1111)';
    if ((x = /number of values \((\d+)\) does not match the number of columns \((\d+)\)/i.exec(msg))) return `O número de valores (${x[1]}) não corresponde ao número de colunas (${x[2]}). (No MySQL: ERROR 1136)`;
    return null;
  }

  // Código do aluno com a linha do erro assinalada e um sublinhado no sítio.
  function codeView(sql, pos, len) {
    const lines = String(sql).split('\n');
    const lineNo = pos === undefined || pos === null ? -1 : String(sql).slice(0, pos).split('\n').length - 1;
    const colNo = lineNo < 0 ? 0 : pos - String(sql).split('\n').slice(0, lineNo).join('\n').length - (lineNo ? 1 : 0);
    const from = Math.max(0, lineNo < 0 ? 0 : lineNo - 3), to = Math.min(lines.length, lineNo < 0 ? 8 : lineNo + 3);
    return lines.slice(from, to).map((l, k) => {
      const n = from + k, on = n === lineNo;
      const txt = on ? esc(l.slice(0, colNo)) + `<mark>${esc(l.slice(colNo, colNo + Math.max(1, len || 1)) || ' ')}</mark>` + esc(l.slice(colNo + Math.max(1, len || 1))) : esc(l);
      return `<div class="xl${on ? ' on' : ''}"><span class="xn">${n + 1}</span><span class="xt">${txt || ' '}</span></div>`;
    }).join('');
  }

  // Enganos que não dão erro no simulador: avisos para mostrar mesmo quando a instrução corre.
  function warnings(sql, schema) {
    try {
      const { tokens } = tokenize(String(sql || ''));
      return statements(tokens).flatMap((s) => lint(s, schema)).filter((h) => h.silent);
    } catch { return []; }
  }

  const api = { analyze, translate, codeView, tokenize, warnings };
  if (typeof module !== 'undefined') module.exports = api; else root.EXPLAIN = api;
})(typeof window !== 'undefined' ? window : globalThis);
