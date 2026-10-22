/* Verificador de CREATE TABLE / ALTER TABLE / DROP TABLE (subconjunto do MySQL).
   Interpreta as instruções do aluno, constrói a estrutura resultante (colunas, tipos, chaves,
   restrições, ações ON DELETE/ON UPDATE) e compara-a com a estrutura esperada.
   Assim a resposta pode ter várias linhas e as colunas/restrições podem vir por qualquer ordem. */
(function (root) {
  const INT_FAMILY = ['TINYINT', 'SMALLINT', 'MEDIUMINT', 'INT', 'BIGINT'];
  const ACTIONS = ['RESTRICT', 'CASCADE', 'SET NULL', 'NO ACTION', 'SET DEFAULT'];

  class SqlError extends Error {}
  const fail = (msg) => { throw new SqlError(msg); };

  /* ---------- análise léxica ---------- */
  function tokenize(src) {
    const out = []; let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '-' && src[i + 1] === '-') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (c === '#') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue; }
      if (c === "'" || c === '"') {
        let j = i + 1, v = '';
        while (j < src.length && src[j] !== c) { if (src[j] === '\\') j++; v += src[j]; j++; }
        if (j >= src.length) fail('Falta fechar um texto entre plicas.');
        out.push({ t: 'str', v }); i = j + 1; continue;
      }
      if (c === '`') {
        const e = src.indexOf('`', i + 1); if (e < 0) fail('Falta fechar um nome entre acentos graves (`).');
        out.push({ t: 'id', v: src.slice(i + 1, e).toLowerCase(), q: true }); i = e + 1; continue;
      }
      const num = /^\d+(\.\d+)?/.exec(src.slice(i));
      if (num) { out.push({ t: 'num', v: num[0] }); i += num[0].length; continue; }
      const id = /^[A-Za-z_À-ſ][\wÀ-ſ$]*/.exec(src.slice(i));
      if (id) { out.push({ t: 'id', v: id[0].toLowerCase() }); i += id[0].length; continue; }
      const op = /^(>=|<=|<>|!=|[(),;.=<>+\-*/%])/.exec(src.slice(i));
      if (op) { out.push({ t: 'sym', v: op[0] }); i += op[0].length; continue; }
      fail(`Carácter inesperado: ${c}`);
    }
    return out;
  }

  /* ---------- análise sintática ---------- */
  function Parser(tokens) {
    let p = 0;
    const peek = (k = 0) => tokens[p + k];
    const near = () => { const t = peek(); return t ? ` perto de "${t.t === 'str' ? `'${t.v}'` : t.v}"` : ' no fim da instrução'; };
    const isKw = (t, kw) => t && t.t === 'id' && !t.q && t.v === kw;
    const isSym = (t, s) => t && t.t === 'sym' && t.v === s;
    const accept = (...kws) => { for (let k = 0; k < kws.length; k++) if (!isKw(peek(k), kws[k])) return false; p += kws.length; return true; };
    const acceptSym = (s) => (isSym(peek(), s) ? (p++, true) : false);
    const expect = (...kws) => { if (!accept(...kws)) fail(`Esperava ${kws.join(' ').toUpperCase()}${near()}.`); };
    const expectSym = (s) => { if (!acceptSym(s)) fail(`Esperava "${s}"${near()}.`); };
    const name = (what) => { const t = peek(); if (!t || t.t !== 'id') fail(`Esperava o nome ${what}${near()}.`); p++; return t.v; };
    const nameList = () => {
      expectSym('('); const cols = [];
      do { cols.push(name('de uma coluna')); if (acceptSym('(')) { while (!acceptSym(')')) p++; } accept('asc') || accept('desc'); } while (acceptSym(','));
      expectSym(')'); return cols;
    };
    // Expressão entre parênteses (CHECK, DEFAULT (...)): devolve o texto normalizado.
    const parenExpr = () => {
      expectSym('('); let depth = 1; const parts = [];
      while (depth) {
        const t = peek(); if (!t) fail('Falta fechar um parêntese.');
        p++;
        if (isSym(t, '(')) depth++; else if (isSym(t, ')') && --depth === 0) break;
        parts.push(t.t === 'str' ? `'${t.v}'` : t.v);
      }
      return parts.join(' ').replace(/\s*([(),=<>+\-*/%])\s*/g, '$1').replace(/\s*(>=|<=|<>|!=)\s*/g, '$1').trim();
    };
    const literal = () => {
      const t = peek(); if (!t) fail('Falta o valor do DEFAULT.');
      if (isSym(t, '-') && peek(1) && peek(1).t === 'num') { p += 2; return { kind: 'num', v: -Number(peek(-1).v) }; }
      if (isSym(t, '(')) return { kind: 'expr', v: parenExpr() };
      p++;
      if (t.t === 'num') return { kind: 'num', v: Number(t.v) };
      if (t.t === 'str') return { kind: 'str', v: t.v };
      if (t.t === 'id' && ['current_timestamp', 'now', 'current_date'].includes(t.v)) { if (acceptSym('(')) expectSym(')'); return { kind: 'fn', v: 'CURRENT_TIMESTAMP' }; }
      if (t.t === 'id' && t.v === 'null') return null;
      if (t.t === 'id' && (t.v === 'true' || t.v === 'false')) return { kind: 'num', v: t.v === 'true' ? 1 : 0 };
      fail(`Valor de DEFAULT inválido${near()}.`);
    };
    const action = () => {
      for (const a of ACTIONS) if (accept(...a.toLowerCase().split(' '))) return a === 'NO ACTION' ? 'RESTRICT' : a;
      fail(`Ação inválida${near()}: use RESTRICT, CASCADE, SET NULL ou NO ACTION.`);
    };
    const refClause = () => {
      expect('references'); const ref = name('da tabela referenciada'); const refCols = nameList();
      const fk = { ref, refCols };
      for (;;) {
        if (accept('on', 'delete')) fk.onDelete = action();
        else if (accept('on', 'update')) fk.onUpdate = action();
        else if (accept('match')) p++;
        else break;
      }
      return fk;
    };
    function type() {
      const t = peek(); if (!t || t.t !== 'id') fail(`Esperava o tipo de dados${near()}.`);
      p++; let base = t.v.toUpperCase(); const args = [];
      if (base === 'DOUBLE') accept('precision');
      if (base === 'CHARACTER' && accept('varying')) base = 'VARCHAR';
      if (acceptSym('(')) {
        do { const a = peek(); if (!a || (a.t !== 'num' && a.t !== 'str')) fail(`Argumento do tipo ${base} inválido${near()}.`); p++; args.push(a.t === 'num' ? Number(a.v) : a.v); } while (acceptSym(','));
        expectSym(')');
      }
      accept('unsigned'); accept('signed'); accept('zerofill');
      const map = { INTEGER: 'INT', DEC: 'DECIMAL', NUMERIC: 'DECIMAL', FIXED: 'DECIMAL', REAL: 'DOUBLE', BOOL: 'BOOLEAN', CHARACTER: 'CHAR' };
      base = map[base] || base;
      const known = [...INT_FAMILY, 'BOOLEAN', 'DECIMAL', 'FLOAT', 'DOUBLE', 'CHAR', 'VARCHAR', 'TEXT', 'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT', 'DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 'YEAR', 'ENUM', 'SET', 'BLOB', 'JSON', 'BIT'];
      if (!known.includes(base)) fail(`Tipo de dados desconhecido: ${t.v.toUpperCase()}.`);
      if (base === 'TINYINT' && args[0] === 1) base = 'BOOLEAN';
      if (base === 'VARCHAR' && !args.length) fail('O tipo VARCHAR precisa do tamanho máximo, ex.: VARCHAR(50).');
      if (INT_FAMILY.includes(base) || base === 'BOOLEAN') return { base, args: [] };
      if (base === 'DECIMAL') return { base, args: [args[0] ?? 10, args[1] ?? 0] };
      if (base === 'CHAR') return { base, args: [args[0] ?? 1] };
      if (base === 'ENUM' || base === 'SET') return { base, args: args.map((a) => String(a).toLowerCase()) };
      return { base, args: base === 'VARCHAR' ? args.slice(0, 1) : [] };
    }
    function column() {
      const col = { name: name('da coluna'), type: type(), notnull: false, ai: false, def: undefined };
      const out = { col, pk: false, unique: false, checks: [], fk: null };
      for (;;) {
        const t = peek(); if (!t || isSym(t, ',') || isSym(t, ')') || isSym(t, ';')) break;
        if (accept('not', 'null')) col.notnull = true;
        else if (accept('null')) col.notnull = false;
        else if (accept('primary', 'key') || accept('key')) out.pk = true;
        else if (accept('auto_increment')) col.ai = true;
        else if (accept('unique')) { accept('key'); out.unique = true; }
        else if (accept('default')) col.def = literal();
        else if (accept('on', 'update')) literal();
        else if (accept('comment')) p++;
        else if (accept('collate')) p++;
        else if (accept('character', 'set') || accept('charset')) p++;
        else if (accept('constraint')) { if (!isKw(peek(), 'check')) name('da restrição'); }
        else if (accept('check')) out.checks.push(parenExpr());
        else if (isKw(t, 'references')) out.fk = refClause();
        else fail(`Não percebi "${t.v}" na definição da coluna ${col.name}${t.t === 'id' ? ' — falta uma vírgula a separar as colunas?' : '.'}`);
      }
      return out;
    }
    return { peek, accept, acceptSym, expect, expectSym, name, nameList, parenExpr, column, refClause, literal, isKw, isSym, near, end: () => p >= tokens.length, skipTo: () => { while (p < tokens.length && !isSym(peek(), ';')) p++; } };
  }

  /* ---------- modelo da base de dados ---------- */
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const newTable = (name) => ({ name, cols: {}, order: [], pk: null, uniques: [], fks: [], checks: [] });
  function addColumn(db, tbl, def, where) {
    const c = def.col;
    if (tbl.cols[c.name]) fail(`A coluna ${c.name} aparece repetida na tabela ${tbl.name}.`);
    tbl.cols[c.name] = c;
    if (where && where.first) tbl.order.unshift(c.name);
    else if (where && where.after) { const i = tbl.order.indexOf(where.after); if (i < 0) fail(`A coluna ${where.after} não existe em ${tbl.name}.`); tbl.order.splice(i + 1, 0, c.name); }
    else tbl.order.push(c.name);
    if (def.pk) setPk(tbl, [c.name]);
    if (def.unique) tbl.uniques.push([c.name]);
    def.checks.forEach((e) => addCheck(tbl, e));
    if (def.fk) addFk(db, tbl, { cols: [c.name], ...def.fk });
  }
  function setPk(tbl, cols) {
    if (tbl.pk) fail(`A tabela ${tbl.name} só pode ter uma chave primária. Para uma chave composta use PRIMARY KEY (coluna1, coluna2).`);
    cols.forEach((c) => { if (!tbl.cols[c]) fail(`A chave primária usa a coluna ${c}, que não existe em ${tbl.name}.`); tbl.cols[c].notnull = true; });
    tbl.pk = cols;
  }
  function addCheck(tbl, expr, cname) { tbl.checks.push({ expr, name: cname || `${tbl.name}_chk_${tbl.checks.length + 1}` }); }
  function addFk(db, tbl, fk, cname) {
    const ref = db[fk.ref];
    if (!ref && fk.ref !== tbl.name) fail(`A tabela ${tbl.name} referencia a tabela ${fk.ref}, que ainda não existe. Crie primeiro a tabela ${fk.ref}.`);
    const target = ref || tbl;
    if (fk.cols.length !== fk.refCols.length) fail(`A chave estrangeira de ${tbl.name} tem um número de colunas diferente das colunas referenciadas.`);
    fk.cols.forEach((c, i) => {
      if (!tbl.cols[c]) fail(`A chave estrangeira usa a coluna ${c}, que não existe em ${tbl.name}.`);
      const rc = target.cols[fk.refCols[i]];
      if (!rc) fail(`A coluna ${fk.refCols[i]} não existe na tabela ${fk.ref}.`);
      if (!sameFamily(tbl.cols[c].type, rc.type)) fail(`A coluna ${tbl.name}.${c} (${typeStr(tbl.cols[c].type)}) não é compatível com ${fk.ref}.${fk.refCols[i]} (${typeStr(rc.type)}): a chave estrangeira tem de ter o mesmo tipo.`);
    });
    const isKey = (target.pk && sameSet(target.pk, fk.refCols)) || target.uniques.some((u) => sameSet(u, fk.refCols));
    if (!isKey) fail(`A chave estrangeira tem de referenciar a chave primária (ou uma coluna UNIQUE) de ${fk.ref}.`);
    if (fk.onDelete === 'SET NULL' || fk.onUpdate === 'SET NULL') fk.cols.forEach((c) => { if (tbl.cols[c].notnull) fail(`ON DELETE SET NULL não é possível porque ${tbl.name}.${c} é NOT NULL: a coluna tem de aceitar NULL.`); });
    tbl.fks.push({ cols: fk.cols, ref: fk.ref, refCols: fk.refCols, onDelete: fk.onDelete || 'RESTRICT', onUpdate: fk.onUpdate || 'RESTRICT', explicitDelete: !!fk.onDelete, explicitUpdate: !!fk.onUpdate, name: cname || `${tbl.name}_ibfk_${tbl.fks.length + 1}` });
  }
  const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
  const sameFamily = (a, b) => a.base === b.base || (INT_FAMILY.includes(a.base) && INT_FAMILY.includes(b.base));
  const typeStr = (t) => t.base + (t.args.length ? `(${t.base === 'ENUM' || t.base === 'SET' ? t.args.map((x) => `'${x}'`).join(',') : t.args.join(',')})` : '');
  const referencedBy = (db, tname, col) => Object.values(db).find((t) => t.fks.some((f) => f.ref === tname && (!col || f.refCols.includes(col)) && t.name !== tname));

  function tableConstraint(P, db, tbl) {
    let cname = null;
    if (P.accept('constraint')) { if (!P.isKw(P.peek(), 'primary') && !P.isKw(P.peek(), 'foreign') && !P.isKw(P.peek(), 'unique') && !P.isKw(P.peek(), 'check')) cname = P.name('da restrição'); }
    if (P.accept('primary', 'key')) { setPk(tbl, P.nameList()); return true; }
    if (P.accept('foreign', 'key')) { if (P.peek() && P.peek().t === 'id') P.name(''); const cols = P.nameList(); addFk(db, tbl, { cols, ...P.refClause() }, cname); return true; }
    if (P.accept('unique')) { P.accept('key') || P.accept('index'); if (P.peek() && P.peek().t === 'id') P.name(''); const cols = P.nameList(); cols.forEach((c) => { if (!tbl.cols[c]) fail(`UNIQUE usa a coluna ${c}, que não existe em ${tbl.name}.`); }); tbl.uniques.push(cols); return true; }
    if (P.accept('check')) { addCheck(tbl, P.parenExpr(), cname); return true; }
    if (P.accept('index') || P.accept('key')) { if (P.peek() && P.peek().t === 'id') P.name(''); P.nameList(); return true; }
    return false;
  }

  function createTable(P, db) {
    const ifNot = P.accept('if', 'not', 'exists');
    const name = P.name('da tabela');
    if (db[name]) { if (ifNot) { P.skipTo(); return; } fail(`A tabela ${name} já existe.`); }
    const tbl = newTable(name); db[name] = tbl;
    P.expectSym('(');
    do {
      if (!tableConstraint(P, db, tbl)) addColumn(db, tbl, P.column());
    } while (P.acceptSym(','));
    P.expectSym(')');
    P.skipTo(); // opções da tabela (ENGINE=InnoDB, CHARSET=...)
    if (!tbl.order.length) fail(`A tabela ${name} tem de ter pelo menos uma coluna.`);
    finishTable(tbl);
  }
  function finishTable(tbl) {
    const ai = tbl.order.filter((c) => tbl.cols[c].ai);
    if (ai.length > 1) fail(`A tabela ${tbl.name} só pode ter uma coluna AUTO_INCREMENT.`);
    if (ai.length && !((tbl.pk && tbl.pk[0] === ai[0]) || tbl.uniques.some((u) => u[0] === ai[0]))) fail(`A coluna AUTO_INCREMENT (${ai[0]}) tem de ser a chave primária.`);
  }

  function alterTable(P, db) {
    const name = P.name('da tabela'); const tbl = db[name];
    if (!tbl) fail(`A tabela ${name} não existe.`);
    do {
      if (P.accept('add')) {
        if (tableConstraint(P, db, tbl)) continue;
        P.accept('column');
        const def = P.column(); const where = P.accept('first') ? { first: true } : P.accept('after') ? { after: P.name('da coluna') } : null;
        addColumn(db, tbl, def, where);
      } else if (P.accept('drop')) {
        if (P.accept('primary', 'key')) { if (!tbl.pk) fail(`A tabela ${name} não tem chave primária.`); tbl.pk = null; }
        else if (P.accept('foreign', 'key')) { const n = P.name('da chave estrangeira'); const i = tbl.fks.findIndex((f) => f.name === n); if (i < 0) fail(`Não existe a chave estrangeira ${n} em ${name}.`); tbl.fks.splice(i, 1); }
        else if (P.accept('check') || P.accept('constraint')) { const n = P.name('da restrição'); let i = tbl.checks.findIndex((c) => c.name === n); if (i >= 0) tbl.checks.splice(i, 1); else { i = tbl.fks.findIndex((f) => f.name === n); if (i < 0) fail(`Não existe a restrição ${n} em ${name}.`); tbl.fks.splice(i, 1); } }
        else if (P.accept('index') || P.accept('key')) P.name('do índice');
        else {
          P.accept('column'); const c = P.name('da coluna');
          if (!tbl.cols[c]) fail(`A coluna ${c} não existe na tabela ${name}.`);
          const by = referencedBy(db, name, c); if (by) fail(`Não pode eliminar ${name}.${c}: é usada pela chave estrangeira da tabela ${by.name}.`);
          if (tbl.fks.some((f) => f.cols.includes(c))) fail(`Elimine primeiro a chave estrangeira que usa a coluna ${c}.`);
          delete tbl.cols[c]; tbl.order = tbl.order.filter((x) => x !== c);
          if (tbl.pk) { tbl.pk = tbl.pk.filter((x) => x !== c); if (!tbl.pk.length) tbl.pk = null; }
          tbl.uniques = tbl.uniques.map((u) => u.filter((x) => x !== c)).filter((u) => u.length);
          tbl.checks = tbl.checks.filter((k) => !new RegExp(`\\b${c}\\b`).test(k.expr));
        }
      } else if (P.accept('modify')) {
        P.accept('column'); const def = P.column(); const c = def.col.name;
        if (!tbl.cols[c]) fail(`A coluna ${c} não existe na tabela ${name}. Para mudar o nome use RENAME COLUMN ou CHANGE.`);
        replaceColumn(db, tbl, c, def);
        if (P.accept('first')) { tbl.order = [c, ...tbl.order.filter((x) => x !== c)]; } else if (P.accept('after')) { const a = P.name('da coluna'); tbl.order = tbl.order.filter((x) => x !== c); tbl.order.splice(tbl.order.indexOf(a) + 1, 0, c); }
      } else if (P.accept('change')) {
        P.accept('column'); const old = P.name('da coluna'); if (!tbl.cols[old]) fail(`A coluna ${old} não existe na tabela ${name}.`);
        const def = P.column(); renameColumn(db, tbl, old, def.col.name); replaceColumn(db, tbl, def.col.name, def);
      } else if (P.accept('rename')) {
        if (P.accept('column')) { const a = P.name('da coluna'); P.expect('to'); const b = P.name('da coluna'); if (!tbl.cols[a]) fail(`A coluna ${a} não existe na tabela ${name}.`); renameColumn(db, tbl, a, b); }
        else { P.accept('to') || P.accept('as'); const nn = P.name('da tabela'); if (db[nn]) fail(`Já existe a tabela ${nn}.`); delete db[name]; tbl.name = nn; db[nn] = tbl; Object.values(db).forEach((t) => t.fks.forEach((f) => { if (f.ref === name) f.ref = nn; })); }
      } else if (P.accept('alter')) {
        P.accept('column'); const c = P.name('da coluna'); if (!tbl.cols[c]) fail(`A coluna ${c} não existe na tabela ${name}.`);
        if (P.accept('set', 'default')) tbl.cols[c].def = P.literal();
        else { P.expect('drop', 'default'); tbl.cols[c].def = undefined; }
      } else fail(`Operação de ALTER TABLE não reconhecida${P.near()}.`);
    } while (P.acceptSym(','));
    finishTable(tbl);
  }
  function replaceColumn(db, tbl, c, def) {
    const wasPk = tbl.pk && tbl.pk.includes(c);
    tbl.cols[c] = def.col;
    if (wasPk) def.col.notnull = true;
    if (def.pk && !wasPk) setPk(tbl, [c]);
    if (def.unique && !tbl.uniques.some((u) => u.length === 1 && u[0] === c)) tbl.uniques.push([c]);
    def.checks.forEach((e) => addCheck(tbl, e));
    if (def.fk) addFk(db, tbl, { cols: [c], ...def.fk });
    const by = Object.values(db).filter((t) => t.fks.some((f) => f.ref === tbl.name && f.refCols.includes(c)));
    by.forEach((t) => t.fks.filter((f) => f.ref === tbl.name && f.refCols.includes(c)).forEach((f) => { const lc = t.cols[f.cols[f.refCols.indexOf(c)]]; if (!sameFamily(lc.type, def.col.type)) fail(`Não pode mudar o tipo de ${tbl.name}.${c}: a chave estrangeira de ${t.name} usa o tipo ${typeStr(lc.type)}.`); }));
    tbl.fks.filter((f) => f.cols.includes(c)).forEach((f) => { if (f.onDelete === 'SET NULL' && def.col.notnull) fail(`${tbl.name}.${c} não pode ser NOT NULL porque a chave estrangeira usa ON DELETE SET NULL.`); });
  }
  function renameColumn(db, tbl, a, b) {
    if (a === b) return;
    if (tbl.cols[b]) fail(`Já existe a coluna ${b} na tabela ${tbl.name}.`);
    tbl.cols[b] = { ...tbl.cols[a], name: b }; delete tbl.cols[a];
    tbl.order = tbl.order.map((x) => (x === a ? b : x));
    const ren = (arr) => arr && arr.map((x) => (x === a ? b : x));
    tbl.pk = ren(tbl.pk); tbl.uniques = tbl.uniques.map(ren);
    tbl.fks.forEach((f) => { f.cols = ren(f.cols); });
    tbl.checks.forEach((k) => { k.expr = k.expr.replace(new RegExp(`\\b${a}\\b`, 'g'), b); });
    Object.values(db).forEach((t) => t.fks.forEach((f) => { if (f.ref === tbl.name) f.refCols = ren(f.refCols); }));
  }
  function dropTable(P, db) {
    const ifEx = P.accept('if', 'exists');
    do {
      const n = P.name('da tabela');
      if (!db[n]) { if (ifEx) continue; fail(`A tabela ${n} não existe.`); }
      const by = referencedBy(db, n); if (by) fail(`Não pode eliminar a tabela ${n}: a tabela ${by.name} tem uma chave estrangeira que a referencia. Elimine primeiro ${by.name}.`);
      delete db[n];
    } while (P.acceptSym(','));
  }

  // Aplica uma ou mais instruções a uma cópia da base de dados e devolve-a.
  function apply(sql, base) {
    const db = clone(base || {});
    const P = Parser(tokenize(sql));
    let n = 0;
    while (!P.end()) {
      if (P.acceptSym(';')) continue;
      n++;
      if (P.accept('create', 'table')) createTable(P, db);
      else if (P.accept('create', 'temporary', 'table')) createTable(P, db);
      else if (P.accept('alter', 'table')) alterTable(P, db);
      else if (P.accept('drop', 'table')) dropTable(P, db);
      else if (P.accept('create', 'unique', 'index') || P.accept('create', 'index')) { P.name('do índice'); P.expect('on'); const t = P.name('da tabela'); if (!db[t]) fail(`A tabela ${t} não existe.`); P.nameList(); }
      else fail(`Este exercício só aceita CREATE TABLE, ALTER TABLE e DROP TABLE${P.near()}.`);
      if (!P.end() && !P.acceptSym(';')) fail(`Esperava ";" no fim da instrução${P.near()}.`);
    }
    if (!n) fail('Escreva as instruções SQL.');
    return db;
  }

  /* ---------- comparação com a estrutura esperada ---------- */
  const defStr = (d) => (d === undefined ? '' : d === null ? 'NULL' : d.kind === 'str' ? `'${d.v}'` : String(d.v));
  const sameDef = (a, b) => (a === undefined || a === null ? b === undefined || b === null : b !== undefined && b !== null && (a.kind === 'num' && b.kind === 'num' ? a.v === b.v : String(a.v).toLowerCase() === String(b.v).toLowerCase()));
  const cols = (c) => `(${c.join(', ')})`;
  const mentions = (expr, col) => new RegExp(`\\b${col}\\b`).test(expr);

  function compare(exp, act, loose) {
    const msgs = [];
    const say = (m) => msgs.push(m);
    for (const tn of Object.keys(exp)) {
      const e = exp[tn], a = act[tn];
      if (!a) { say(`Falta criar a tabela <b>${tn}</b>.`); continue; }
      for (const c of e.order) {
        const ec = e.cols[c], ac = a.cols[c];
        if (!ac) { say(`Tabela ${tn}: falta a coluna <b>${c}</b>.`); continue; }
        const typeOk = loose ? sameFamily(ec.type, ac.type) && (ec.type.base !== 'DECIMAL' || ec.type.args[1] === ac.type.args[1]) : typeStr(ec.type) === typeStr(ac.type);
        if (!typeOk) say(`Tabela ${tn}: a coluna <b>${c}</b> é ${typeStr(ac.type)}, mas devia ser ${loose && ec.type.base !== 'DECIMAL' ? ec.type.base : typeStr(ec.type)}.`);
        if (ec.notnull && !ac.notnull) say(`Tabela ${tn}: a coluna <b>${c}</b> devia ser obrigatória (NOT NULL).`);
        if (!loose && !ec.notnull && ac.notnull) say(`Tabela ${tn}: a coluna <b>${c}</b> não devia ser NOT NULL.`);
        if (ec.ai !== ac.ai && (ec.ai || !loose)) say(`Tabela ${tn}: a coluna <b>${c}</b> ${ec.ai ? 'devia' : 'não devia'} ser AUTO_INCREMENT.`);
        if ((ec.def !== undefined || !loose) && !sameDef(ec.def, ac.def)) say(`Tabela ${tn}: a coluna <b>${c}</b> ${ec.def === undefined ? 'não devia ter valor por omissão' : `devia ter DEFAULT ${defStr(ec.def)}`}.`);
      }
      if (!loose) a.order.filter((c) => !e.cols[c]).forEach((c) => say(`Tabela ${tn}: a coluna <b>${c}</b> não foi pedida.`));
      if (!(e.pk ? a.pk && sameSet(e.pk, a.pk) : !a.pk)) say(e.pk ? `Tabela ${tn}: a chave primária devia ser <b>${cols(e.pk)}</b>${a.pk ? `, e não ${cols(a.pk)}` : ''}.` : `Tabela ${tn}: não foi pedida chave primária.`);
      for (const u of e.uniques) if (!a.uniques.some((x) => sameSet(x, u)) && !(a.pk && sameSet(a.pk, u))) say(`Tabela ${tn}: ${cols(u)} devia ser UNIQUE (sem valores repetidos).`);
      if (!loose) for (const u of a.uniques) if (!e.uniques.some((x) => sameSet(x, u))) say(`Tabela ${tn}: ${cols(u)} não devia ser UNIQUE.`);
      for (const f of e.fks) {
        const g = a.fks.find((x) => sameSet(x.cols, f.cols));
        if (!g) { say(`Tabela ${tn}: falta a chave estrangeira <b>${cols(f.cols)} → ${f.ref}${cols(f.refCols)}</b>.`); continue; }
        if (g.ref !== f.ref || !sameSet(g.refCols, f.refCols)) say(`Tabela ${tn}: a chave estrangeira ${cols(f.cols)} devia referenciar ${f.ref}${cols(f.refCols)}.`);
        else if (f.explicitDelete && g.onDelete !== f.onDelete) say(`Tabela ${tn}: a chave estrangeira ${cols(f.cols)} devia usar <b>ON DELETE ${f.onDelete}</b>${g.onDelete !== 'RESTRICT' ? `, e não ${g.onDelete}` : ''}.`);
        if (g.ref === f.ref && f.explicitUpdate && g.onUpdate !== f.onUpdate) say(`Tabela ${tn}: a chave estrangeira ${cols(f.cols)} devia usar <b>ON UPDATE ${f.onUpdate}</b>${g.onUpdate !== 'RESTRICT' ? `, e não ${g.onUpdate}` : ''}.`);
      }
      if (!loose) for (const g of a.fks) if (!e.fks.some((x) => sameSet(x.cols, g.cols))) say(`Tabela ${tn}: a chave estrangeira ${cols(g.cols)} não foi pedida.`);
      for (const k of e.checks) {
        const ok = loose ? a.checks.some((x) => e.order.filter((c) => mentions(k.expr, c)).every((c) => mentions(x.expr, c))) : a.checks.some((x) => x.expr === k.expr);
        if (!ok) say(`Tabela ${tn}: falta a restrição <b>CHECK (${k.expr})</b>.`);
      }
      if (!loose) for (const k of a.checks) if (!e.checks.some((x) => x.expr === k.expr)) say(`Tabela ${tn}: a restrição CHECK (${k.expr}) não foi pedida.`);
    }
    for (const tn of Object.keys(act)) if (!exp[tn]) say(`A tabela <b>${tn}</b> não devia existir no fim.`);
    return msgs;
  }

  // Verifica a resposta de um exercício { setup?, solution, loose? }.
  function check(input, ex) {
    const base = ex.setup ? apply(ex.setup) : {};
    const expected = apply(ex.solution, base);
    const actual = apply(input, base);
    const msgs = compare(expected, actual, !!ex.loose);
    const touched = Object.keys(actual).filter((t) => JSON.stringify(actual[t]) !== JSON.stringify(base[t]));
    return { ok: !msgs.length, msgs, db: actual, touched: touched.length ? touched : Object.keys(actual) };
  }

  // Descrição legível (como DESCRIBE + restrições) para mostrar ao aluno.
  function describe(db, names) {
    return (names || Object.keys(db)).filter((n) => db[n]).map((n) => {
      const t = db[n];
      const key = (c) => (t.pk && t.pk.includes(c) ? 'PRI' : t.uniques.some((u) => u[0] === c) ? 'UNI' : t.fks.some((f) => f.cols.includes(c)) ? 'MUL' : '');
      return {
        name: n,
        rows: t.order.map((c) => { const k = t.cols[c]; return [c, typeStr(k.type), k.notnull ? 'NO' : 'YES', key(c), k.def === undefined ? '' : defStr(k.def), k.ai ? 'auto_increment' : '']; }),
        extra: [
          ...(t.pk && t.pk.length > 1 ? [`PRIMARY KEY ${cols(t.pk)}`] : []),
          ...t.uniques.filter((u) => u.length > 1).map((u) => `UNIQUE ${cols(u)}`),
          ...t.fks.map((f) => `FOREIGN KEY ${cols(f.cols)} REFERENCES ${f.ref}${cols(f.refCols)}${f.onDelete !== 'RESTRICT' ? ` ON DELETE ${f.onDelete}` : ''}${f.onUpdate !== 'RESTRICT' ? ` ON UPDATE ${f.onUpdate}` : ''}`),
          ...t.checks.map((k) => `CHECK (${k.expr})`),
        ],
      };
    });
  }

  const api = { apply, check, compare, describe, tokenize, SqlError };
  if (typeof module !== 'undefined') module.exports = api; else root.DDL = api;
})(typeof window !== 'undefined' ? window : globalThis);
