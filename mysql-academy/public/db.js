/* Bases de dados de exemplo executadas no browser com AlaSQL (uma aproximação do MySQL).
     escola – pequena, para aprender: alunos, cursos e notas;
     loja   – maior e mais realista (gerada de forma determinística): clientes, produtos, encomendas e linhas.
   Também verifica as respostas: consultas (pelo resultado), comandos INSERT/UPDATE/DELETE (pelo efeito nas
   tabelas) e comandos escritos (pelo texto normalizado). As mensagens explicam o que está diferente. */
(function (root) {
  const A = root.alasql || (typeof require !== 'undefined' ? require('../public/vendor/alasql.min.js') : null);

  /* ---------- funções do MySQL que o motor não tem ---------- */
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const toDate = (v) => {
    if (v === null || v === undefined) return null;
    if (v instanceof Date) return v;
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    return m ? new Date(Date.UTC(+m[1], m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0))) : null;
  };
  const p2 = (n) => String(n).padStart(2, '0');
  A.fn.MYSQL_DATEDIFF = (a, b) => { const x = toDate(a), y = toDate(b); return x && y ? Math.round((Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()) - Date.UTC(y.getUTCFullYear(), y.getUTCMonth(), y.getUTCDate())) / 864e5) : null; };
  A.fn.DATE_FORMAT = (v, f) => {
    const d = toDate(v); if (!d || f === null || f === undefined) return null;
    const map = { d: p2(d.getUTCDate()), e: d.getUTCDate(), m: p2(d.getUTCMonth() + 1), c: d.getUTCMonth() + 1, Y: d.getUTCFullYear(), y: p2(d.getUTCFullYear() % 100),
      M: MONTHS[d.getUTCMonth()], b: MONTHS[d.getUTCMonth()].slice(0, 3), W: DAYS[d.getUTCDay()], a: DAYS[d.getUTCDay()].slice(0, 3),
      H: p2(d.getUTCHours()), i: p2(d.getUTCMinutes()), s: p2(d.getUTCSeconds()), '%': '%' };
    return String(f).replace(/%(.)/g, (m, k) => (k in map ? map[k] : k));
  };
  A.fn.MYSQL_LEFT = (s, n) => (s === null || s === undefined ? null : String(s).slice(0, Math.max(0, n)));
  A.fn.MYSQL_RIGHT = (s, n) => (s === null || s === undefined ? null : n > 0 ? String(s).slice(-n) : '');
  A.fn.MYSQL_SUBSTRING = (s, pos, len) => {
    if (s === null || s === undefined || pos === null || pos === undefined) return null;
    const t = String(s), start = pos > 0 ? pos - 1 : pos < 0 ? Math.max(0, t.length + pos) : t.length;
    return len === undefined ? t.slice(start) : len > 0 ? t.slice(start, start + len) : '';
  };
  A.fn.CURDATE = () => { const d = new Date(); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
  A.fn.DAY = (v) => { const d = toDate(v); return d ? d.getUTCDate() : null; };

  /* ---------- BD escola ---------- */
  const ESCOLA = {
    title: 'escola', desc: 'Pequena BD de uma escola: alunos, cursos e notas.',
    seed: {
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
    },
    // Estrutura apresentada ao aluno (como no DESCRIBE do MySQL): [coluna, tipo, chave, descrição]
    schema: {
      alunos: { desc: 'Alunos inscritos na escola', cols: [
        ['id_aluno', 'INT', 'PK', 'Identificador do aluno'], ['nome', 'VARCHAR(80)', '', 'Nome completo'],
        ['idade', 'INT', '', 'Idade em anos'], ['cidade', 'VARCHAR(50)', '', 'Cidade onde vive'],
        ['id_curso', 'INT', 'FK → cursos.id_curso', 'Curso em que está inscrito'] ] },
      cursos: { desc: 'Cursos disponíveis', cols: [
        ['id_curso', 'INT', 'PK', 'Identificador do curso'], ['nome', 'VARCHAR(50)', '', 'Nome do curso'], ['horas', 'INT', '', 'Duração em horas'] ] },
      notas: { desc: 'Notas obtidas pelos alunos em cada disciplina', cols: [
        ['id_aluno', 'INT', 'FK → alunos.id_aluno', 'Aluno a quem pertence a nota'], ['disciplina', 'VARCHAR(50)', '', 'Nome da disciplina'], ['nota', 'INT', '', 'Classificação de 0 a 20'] ] },
      v_alunos_cursos: { view: true, desc: 'Vista (VIEW): cada aluno com o nome do seu curso', cols: [
        ['aluno', 'VARCHAR(80)', '', 'alunos.nome'], ['idade', 'INT', '', 'alunos.idade'], ['cidade', 'VARCHAR(50)', '', 'alunos.cidade'], ['curso', 'VARCHAR(50)', '', 'cursos.nome'] ] },
    },
    views: {
      v_alunos_cursos: 'CREATE VIEW v_alunos_cursos AS SELECT a.nome AS aluno, a.idade, a.cidade, c.nome AS curso FROM alunos a JOIN cursos c ON a.id_curso = c.id_curso',
    },
    auto: { cursos: 'id_curso', alunos: 'id_aluno' },
  };

  /* ---------- BD loja (gerada sempre igual, com um gerador pseudoaleatório com semente) ---------- */
  function rng(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function buildLoja() {
    const r = rng(2025), pick = (a) => a[Math.floor(r() * a.length)];
    const first = ['Ana', 'Bruno', 'Carla', 'Daniel', 'Elisa', 'Fábio', 'Gabriela', 'Henrique', 'Isabel', 'Jorge', 'Laura', 'Miguel', 'Nádia', 'Óscar', 'Paula', 'Rui', 'Sara', 'Tiago', 'Vera', 'Xavier'];
    const last = ['Almeida', 'Barros', 'Carvalho', 'Dias', 'Esteves', 'Fonseca', 'Gomes', 'Henriques', 'Lima', 'Marques', 'Neves', 'Oliveira', 'Pereira', 'Queirós', 'Ribeiro', 'Sousa', 'Teixeira', 'Vieira'];
    const cities = ['Lisboa', 'Porto', 'Braga', 'Coimbra', 'Faro', 'Aveiro', 'Évora', 'Viseu'];
    const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const clientes = [], used = new Set();
    for (let i = 1; i <= 30; i++) {
      let nome; do { nome = pick(first) + ' ' + pick(last); } while (used.has(nome)); used.add(nome);
      const [f, l] = nome.split(' ');
      const email = i % 9 === 4 ? null : `${strip(f)}.${strip(l)}@${pick(['mail.pt', 'correio.pt', 'exemplo.com'])}`;
      const m = 1 + Math.floor(r() * 12), d = 1 + Math.floor(r() * 28);
      clientes.push([i, nome, email, pick(cities), `${i <= 18 ? 2023 : 2024}-${p2(m)}-${p2(d)}`]);
    }
    const produtos = [
      [1, 'Portátil 14"', 'Informática', 749.9, 12], [2, 'Rato sem fios', 'Informática', 19.9, 85], [3, 'Teclado mecânico', 'Informática', 89.5, 30],
      [4, 'Monitor 27"', 'Informática', 229, 0], [5, 'Disco SSD 1 TB', 'Informática', 79.99, 40], [6, 'Auscultadores', 'Informática', 59.9, 25],
      [7, 'SQL para Todos', 'Livros', 24.9, 60], [8, 'O Programador Pragmático', 'Livros', 39.9, 18], [9, 'Bases de Dados Relacionais', 'Livros', 32.5, 22],
      [10, 'Romance de Verão', 'Livros', 16.9, 45], [11, 'Candeeiro LED', 'Casa', 34.9, 33], [12, 'Cafeteira', 'Casa', 49, 14],
      [13, 'Conjunto de panelas', 'Casa', 119, 6], [14, 'Almofada', 'Casa', 12.5, 70], [15, 'Bola de futebol', 'Desporto', 22, 50],
      [16, 'Garrafa térmica', 'Desporto', 18.5, 0], [17, 'Bicicleta urbana', 'Desporto', 399, 4], [18, 'Tapete de ioga', 'Desporto', 27.9, 15],
    ];
    const estados = ['entregue', 'entregue', 'entregue', 'entregue', 'enviada', 'pendente', 'cancelada'];
    const encomendas = [], linhas = [];
    for (let i = 1; i <= 80; i++) {
      const y = i <= 36 ? 2024 : 2025, m = 1 + Math.floor(r() * 12), d = 1 + Math.floor(r() * 28);
      const cli = 1 + Math.floor(r() * 25); // os clientes 26–30 nunca encomendaram
      const est = y === 2024 ? (r() < 0.9 ? 'entregue' : 'cancelada') : pick(estados);
      encomendas.push([i, cli, `${y}-${p2(m)}-${p2(d)}`, est]);
      const n = 1 + Math.floor(r() * 4), prods = new Set();
      while (prods.size < n) prods.add(1 + Math.floor(r() * 17)); // o produto 18 nunca foi vendido
      for (const pid of prods) {
        const p = produtos[pid - 1], q = p[3] > 200 ? 1 : 1 + Math.floor(r() * 3);
        const preco = r() < 0.2 ? Math.round(p[3] * 90) / 100 : p[3]; // algumas vendas com 10% de desconto
        linhas.push([i, pid, q, preco]);
      }
    }
    return { clientes, produtos, encomendas, linhas_encomenda: linhas };
  }
  const LOJA = {
    title: 'loja', desc: 'Loja online: 30 clientes, 18 produtos, 80 encomendas (2024–2025) e as respetivas linhas.',
    seed: buildLoja(),
    schema: {
      clientes: { desc: 'Clientes registados na loja', cols: [
        ['id_cliente', 'INT', 'PK', 'Identificador do cliente'], ['nome', 'VARCHAR(100)', '', 'Nome do cliente'], ['email', 'VARCHAR(100)', '', 'Email (alguns clientes não indicaram: NULL)'],
        ['cidade', 'VARCHAR(50)', '', 'Cidade'], ['data_registo', 'DATE', '', 'Data em que criou conta'] ] },
      produtos: { desc: 'Produtos à venda', cols: [
        ['id_produto', 'INT', 'PK', 'Identificador do produto'], ['nome', 'VARCHAR(100)', '', 'Nome do produto'], ['categoria', 'VARCHAR(30)', '', 'Informática, Livros, Casa ou Desporto'],
        ['preco', 'DECIMAL(8,2)', '', 'Preço atual de venda'], ['stock', 'INT', '', 'Unidades em armazém'] ] },
      encomendas: { desc: 'Encomendas feitas pelos clientes', cols: [
        ['id_encomenda', 'INT', 'PK', 'Identificador da encomenda'], ['id_cliente', 'INT', 'FK → clientes.id_cliente', 'Cliente que fez a encomenda'],
        ['data', 'DATE', '', 'Data da encomenda'], ['estado', 'VARCHAR(20)', '', 'pendente, enviada, entregue ou cancelada'] ] },
      linhas_encomenda: { desc: 'Produtos de cada encomenda (tabela de ligação N:M)', cols: [
        ['id_encomenda', 'INT', 'PK, FK → encomendas', 'Encomenda'], ['id_produto', 'INT', 'PK, FK → produtos', 'Produto'],
        ['quantidade', 'INT', '', 'Unidades compradas'], ['preco_unitario', 'DECIMAL(8,2)', '', 'Preço de cada unidade nessa venda'] ] },
    },
    views: {},
    auto: { clientes: 'id_cliente', produtos: 'id_produto', encomendas: 'id_encomenda' },
  };

  const DBS = { escola: ESCOLA, loja: LOJA };
  const SQLTYPE = (t) => t.replace(/^DECIMAL.*/, 'DECIMAL').replace(/^VARCHAR.*/, 'VARCHAR(255)');
  for (const d of Object.values(DBS)) {
    d.cols = {}; d.ddl = {};
    for (const [t, s] of Object.entries(d.schema)) {
      d.cols[t] = s.cols.map((c) => c[0]);
      if (s.view) continue;
      const auto = d.auto[t];
      d.ddl[t] = `CREATE TABLE ${t} (${s.cols.map(([c, ty]) => `${c} ${SQLTYPE(ty)}${c === auto ? ' AUTO_INCREMENT' : ''}`).join(', ')})`;
    }
  }

  let seq = 0;
  function create(which) {
    const d = DBS[which] || ESCOLA;
    const name = 'db' + (++seq) + Math.random().toString(36).slice(2, 7);
    A('CREATE DATABASE ' + name);
    const db = new A.Database(name);
    db.kind = d.title;
    for (const t of Object.keys(d.seed)) {
      db.exec(d.ddl[t]);
      const tb = db.tables[t], cols = d.cols[t];
      for (const row of d.seed[t]) { const o = {}; cols.forEach((c, i) => (o[c] = row[i])); tb.data.push(o); }
      const auto = d.auto[t];
      if (auto && tb.identities && tb.identities[auto]) tb.identities[auto].value = Math.max(0, ...d.seed[t].map((x) => x[0])) + 1;
    }
    for (const v of Object.values(d.views)) db.exec(v);
    return db;
  }
  const dispose = (db) => { try { A('DROP DATABASE ' + db.databaseid); } catch { /* ignorar */ } };

  // Remove comentários e adapta o SQL do aluno ao motor: funções do MySQL com outro nome no motor e
  // nomes de colunas (aliases) que o motor trata como palavras reservadas, como «total» ou «count».
  const RESERVED = /\b(total|value|count|sum|avg|top|percent|columns|matrix|index)\b(?!\s*\()/gi;
  const FUNCS = [[/\bDATEDIFF\s*\(/gi, 'MYSQL_DATEDIFF('], [/\bLEFT\s*\(/gi, 'MYSQL_LEFT('], [/\bRIGHT\s*\(/gi, 'MYSQL_RIGHT('], [/\b(?:SUBSTRING|SUBSTR|MID)\s*\(/gi, 'MYSQL_SUBSTRING(']];
  function clean(sql) {
    const s = String(sql).replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim().replace(/;+\s*$/, '');
    // Só altera o que está fora do texto entre plicas e fora de `identificadores`.
    return s.split(/('(?:[^'\\]|\\.|'')*'|`[^`]*`)/).map((part, i) => {
      if (i % 2) return part;
      let x = part;
      for (const [re, to] of FUNCS) x = x.replace(re, to);
      return x.replace(RESERVED, (w, k, off, str) => (/\b(?:create|drop|alter|unique)\s+$/i.test(str.slice(0, off)) || /^\s+on\b/i.test(str.slice(off + w.length)) ? w : '`' + w + '`'));
    }).join('');
  }
  // Os nomes internos não devem aparecer nos cabeçalhos; colunas a NULL podem faltar nalgumas linhas do motor.
  function tidy(rows) {
    if (!rows.length) return rows;
    let base = rows[0];
    for (const r of rows) if (Object.keys(r).length > Object.keys(base).length) base = r;
    const cols = Object.keys(base);
    for (const r of rows) for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k);
    const name = (k) => k.replace(/MYSQL_/g, '');
    return rows.map((r) => { const o = {}; for (const k of cols) o[name(k)] = r[k] === undefined ? null : r[k]; return o; });
  }

  // Separa várias instruções (;) respeitando o texto entre plicas.
  function split(sql) {
    const out = []; let cur = '', q = null;
    const s = String(sql).replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (q) { cur += ch; if (ch === q && s[i - 1] !== '\\') q = null; continue; }
      if (ch === "'" || ch === '"') { q = ch; cur += ch; continue; }
      if (ch === ';') { if (cur.trim()) out.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  function run(db, sql) {
    const s = clean(sql);
    if (!s) throw new Error('Escreva uma instrução SQL.');
    if (split(s).length > 1) throw new Error('Execute uma instrução de cada vez.');
    const res = db.exec(s);
    return Array.isArray(res) ? tidy(res) : [];
  }
  // Executa uma ou mais instruções; devolve o resultado da última e quantas linhas foram afetadas.
  function runMany(db, sql) {
    const parts = split(sql);
    if (!parts.length) throw new Error('Escreva uma instrução SQL.');
    let last = [], affected = null;
    for (const p of parts) {
      const res = db.exec(clean(p));
      if (Array.isArray(res)) { last = tidy(res); affected = null; } else { last = []; affected = typeof res === 'number' ? res : null; }
    }
    return { rows: last, affected, count: parts.length };
  }

  const val = (v) => (v === null || v === undefined ? null : typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : String(v));
  const rowVals = (r) => Object.values(r).map(val);
  const keyOf = (r) => JSON.stringify(rowVals(r));
  const bag = (rows) => { const m = new Map(); rows.forEach((r) => { const k = keyOf(r); m.set(k, (m.get(k) || 0) + 1); }); return m; };
  const bagDiff = (a, b) => { let n = 0; for (const [k, c] of a) n += Math.max(0, c - (b.get(k) || 0)); return n; }; // linhas de a que não estão em b

  // Compara o resultado do aluno com o da solução (valores, não nomes de colunas).
  function sameResult(a, b, ordered) {
    const x = a.map(keyOf), y = b.map(keyOf);
    if (x.length !== y.length) return false;
    if (!ordered) { x.sort(); y.sort(); }
    return x.every((v, i) => v === y[i]);
  }

  // Explica, em linguagem simples, porque o resultado não coincide com o esperado.
  function explain(user, sol, ex, sql) {
    const has = (re, s) => re.test(String(s));
    if (!user.length && sol.length) return ['A consulta não devolveu nenhuma linha. Confirme as condições do WHERE: o texto escreve-se entre plicas e tem de coincidir exatamente (maiúsculas e acentos).'];
    if (user.length && !sol.length) return ['A consulta devolveu linhas, mas o resultado esperado é vazio. O filtro deixa passar linhas a mais.'];
    const uc = Object.keys(user[0]), sc = Object.keys(sol[0]);
    if (uc.length !== sc.length) {
      return [`O resultado tem ${uc.length} ${uc.length === 1 ? 'coluna' : 'colunas'}, mas esperavam-se ${sc.length}. Confirme as colunas que escreveu a seguir ao SELECT${sc.length === 1 ? ' (só é pedida uma)' : ''}.`];
    }
    const msgs = [];
    const sortedRow = (r) => JSON.stringify(rowVals(r).map((v) => JSON.stringify(v)).sort());
    const permOk = user.length === sol.length && JSON.stringify(user.map(sortedRow).sort()) === JSON.stringify(sol.map(sortedRow).sort());
    if (permOk && !sameResult(user, sol, false)) return ['Os valores estão certos, mas as colunas estão por outra ordem. Escreva-as pela ordem pedida no enunciado.'];
    const U = bag(user), S = bag(sol);
    if (user.length === sol.length && sameResult(user, sol, false)) return ['As linhas estão certas, mas a ordem não. Veja o ORDER BY (coluna e sentido: ASC ou DESC).'];
    if (user.length > sol.length) {
      const extra = user.length - sol.length;
      const distinctU = new Set(user.map(keyOf));
      if (distinctU.size === S.size && [...S.keys()].every((k) => distinctU.has(k)) && [...S.values()].every((c) => c === 1)) msgs.push('Há linhas repetidas no resultado. Use DISTINCT (ou verifique o agrupamento com GROUP BY).');
      else if (bagDiff(S, U) === 0) {
        let why = 'O filtro deixa passar linhas que não deviam aparecer.';
        if (has(/\bwhere\b/i, ex.solution) && !has(/\bwhere\b/i, sql)) why = 'Falta filtrar as linhas com WHERE.';
        else if (has(/\blimit\b/i, ex.solution) && !has(/\blimit\b/i, sql)) why = 'Falta limitar o número de linhas com LIMIT.';
        else if (has(/\bhaving\b/i, ex.solution) && !has(/\bhaving\b/i, sql)) why = 'Falta filtrar os grupos com HAVING.';
        msgs.push(`Tem ${extra} ${extra === 1 ? 'linha' : 'linhas'} a mais. ${why}`);
      } else msgs.push(`O resultado tem ${user.length} linhas, mas esperavam-se ${sol.length}.`);
    } else if (user.length < sol.length) {
      const miss = sol.length - user.length;
      let why = 'O filtro é demasiado restritivo.';
      if (has(/\bleft\s+join\b/i, ex.solution) && !has(/\bleft\s+join\b/i, sql)) why = 'Um INNER JOIN exclui as linhas sem correspondência — precisa de LEFT JOIN?';
      else if (has(/\bgroup\s+by\b/i, ex.solution) && !has(/\bgroup\s+by\b/i, sql)) why = 'Esperava-se uma linha por grupo: falta o GROUP BY?';
      else if (has(/\bunion\s+all\b/i, ex.solution) && has(/\bunion\b/i, sql) && !has(/\bunion\s+all\b/i, sql)) why = 'UNION elimina repetidos; UNION ALL mantém-nos.';
      msgs.push(bagDiff(U, S) === 0 ? `Faltam ${miss} ${miss === 1 ? 'linha' : 'linhas'}. ${why}` : `O resultado tem ${user.length} ${user.length === 1 ? 'linha' : 'linhas'}, mas esperavam-se ${sol.length}. ${why}`);
    } else {
      // Mesmo número de linhas: procurar a coluna com valores diferentes.
      for (let i = 0; i < uc.length; i++) {
        const a = user.map((r) => JSON.stringify(val(r[uc[i]]))).sort(), b = sol.map((r) => JSON.stringify(val(r[sc[i]]))).sort();
        if (a.join() !== b.join()) {
          const sample = sol.map((r) => val(r[sc[i]])).find((v) => !a.includes(JSON.stringify(v)));
          msgs.push(`A coluna ${i + 1} (${uc[i]}) tem valores diferentes dos esperados${sample !== undefined ? ` — por exemplo, devia aparecer ${sample === null ? 'NULL' : `«${sample}»`}` : ''}.`);
          break;
        }
      }
      if (!msgs.length) msgs.push('O número de linhas está certo, mas as combinações de valores não coincidem. Confirme as condições e as junções.');
    }
    return msgs;
  }

  const cache = {};
  const sample = (which) => cache[which] || (cache[which] = create(which));

  function check(sql, ex) {
    const db = create(ex.db);
    try {
      const user = run(db, sql);
      const sol = run(sample(ex.db), ex.solution);
      const ok = sameResult(user, sol, !!ex.ordered);
      return { rows: user, expected: sol, ok, msgs: ok ? [] : explain(user, sol, ex, sql) };
    } finally { dispose(db); }
  }

  /* ---------- INSERT / UPDATE / DELETE verificados pelo efeito ---------- */
  const writtenIn = (sql) => [...new Set([...String(sql).matchAll(/\b(?:insert\s+into|update|delete\s+from|truncate(?:\s+table)?)\s+`?(\w+)/gi)].map((m) => m[1].toLowerCase()))];
  function checkDml(sql, ex) {
    const d = DBS[ex.db] || ESCOLA;
    const base = sample(ex.db), dbU = create(ex.db), dbS = create(ex.db);
    try {
      if (ex.setup) { runMany(dbU, ex.setup); runMany(dbS, ex.setup); }
      const parts = split(sql);
      if (parts.some((p) => /^\s*(select|show|describe|desc)\b/i.test(p)) && parts.every((p) => /^\s*(select|show|describe|desc)\b/i.test(p))) throw new Error('Este exercício pede uma alteração aos dados (INSERT, UPDATE ou DELETE), não uma consulta.');
      runMany(dbU, sql);
      runMany(dbS, ex.solution);
      const target = ex.tables || writtenIn(ex.solution);
      const all = Object.keys(d.seed);
      const msgs = [];
      // As colunas DECIMAL(p,2) do MySQL arredondam os valores guardados a 2 casas decimais.
      const dec = (t, rows) => { const cs = (d.schema[t] ? d.schema[t].cols : []).filter((c) => /^DECIMAL/.test(c[1])).map((c) => c[0]); return cs.length ? rows.map((r) => { const o = { ...r }; cs.forEach((c) => { if (typeof o[c] === 'number') o[c] = Math.round(o[c] * 100) / 100; }); return o; }) : rows; };
      const read = (db, t) => dec(t, run(db, `SELECT * FROM ${t}`));
      for (const t of all) {
        const before = ex.setup ? null : read(base, t);
        const u = read(dbU, t), s = read(dbS, t);
        if (sameResult(u, s, false)) continue;
        if (!target.includes(t)) { msgs.push(`A tabela <b>${t}</b> foi alterada, mas não devia.`); continue; }
        const U = bag(u), S = bag(s);
        if (before) {
          const B = bag(before);
          const userChanged = bagDiff(B, U), solChanged = bagDiff(B, S); // linhas originais alteradas ou apagadas
          const userNew = bagDiff(U, B), solNew = bagDiff(S, B);
          if (!userChanged && !userNew) { msgs.push(`A tabela <b>${t}</b> ficou igual: a instrução não alterou nenhuma linha. Confirme o WHERE.`); continue; }
          if (u.length !== s.length && solChanged === 0 && userChanged === 0) { msgs.push(`A tabela <b>${t}</b> ficou com ${u.length} linhas; esperavam-se ${s.length}. Confirme quantas linhas inseriu.`); continue; }
          if (userChanged > solChanged) { msgs.push(`Foram ${u.length < before.length ? 'apagadas' : 'alteradas'} ${userChanged} linhas de <b>${t}</b>, mas só ${solChanged === 1 ? 'devia ser 1' : `deviam ser ${solChanged}`}. O WHERE é demasiado abrangente${/\bwhere\b/i.test(sql) ? '' : ' — ou falta mesmo o WHERE'}.`); continue; }
          if (userChanged < solChanged) { msgs.push(`Foram ${u.length < before.length ? 'apagadas' : 'alteradas'} ${userChanged} linhas de <b>${t}</b>, mas deviam ser ${solChanged}. O WHERE é demasiado restritivo.`); continue; }
          if (userChanged && bagDiff(bag(before.filter((r) => !U.has(keyOf(r)))), bag(before.filter((r) => !S.has(keyOf(r)))))) { msgs.push(`O número de linhas ${u.length < before.length ? 'apagadas' : 'alteradas'} em <b>${t}</b> está certo, mas não são as linhas certas. Confirme a condição do WHERE.`); continue; }
          if (userNew === solNew) { msgs.push(`As linhas certas de <b>${t}</b> foram ${solNew ? 'alteradas/inseridas' : 'afetadas'}, mas os valores finais não são os pedidos. Confirme os valores (texto entre plicas, números sem plicas).`); continue; }
        }
        msgs.push(`O conteúdo final da tabela <b>${t}</b> não é o esperado (${bagDiff(S, U)} linha(s) em falta ou diferentes).`);
      }
      const show = target.length ? target : writtenIn(sql);
      return { ok: !msgs.length, msgs, tables: show.filter((t) => d.seed[t]).map((t) => ({ name: t, rows: read(dbU, t), expected: read(dbS, t) })) };
    } finally { dispose(dbU); dispose(dbS); }
  }

  /* ---------- comandos escritos (verificados pelo texto) ---------- */
  const PRIVS = new Set('select insert update delete create alter drop index all usage execute references trigger event process reload shutdown super'.split(' '));
  function norm(s) {
    return String(s).toLowerCase().replace(/`/g, '').replace(/"/g, "'").replace(/\s+/g, ' ').trim().replace(/;$/, '').trim()
      .replace(/\s*([(),=+<>])\s*/g, '$1')
      // 'u'@'h', u@h, u@'h' e 'u'@h são equivalentes
      .replace(/(^|[\s,(])'?([\w.%-]+)'?@'?([\w.%-]+)'?/g, "$1'$2'@'$3'")
      // nomes de roles sem plicas
      .replace(/\b(create|drop) role (if (?:not )?exists )?(\w+)\b/g, "$1 role $2'$3'")
      .replace(/\bset default role (\w+) to\b/g, "set default role '$1' to")
      .replace(/^grant (\w+) to '/, (m, r) => (PRIVS.has(r) ? m : `grant '${r}' to '`));
  }
  function checkCode(input, ex) {
    const n = norm(input);
    return ex.ok.some((r) => new RegExp(r).test(n));
  }

  /* ---------- utilitários para o painel de estrutura e o laboratório ---------- */
  const schemaOf = (which) => (DBS[which] || ESCOLA).schema;
  // Tabelas referidas numa instrução (FROM / JOIN / INTO / UPDATE), pela ordem em que aparecem.
  const tablesIn = (sql, which) => { const sc = schemaOf(which); return [...new Set([...String(sql).matchAll(/\b(?:from|join|into|update)\s+`?(\w+)/gi)].map((m) => m[1].toLowerCase()).filter((t) => sc[t]))]; };
  const rowsOf = (which, t) => run(sample(which), `SELECT * FROM ${t}`);

  // Script MySQL para criar a BD de exemplo num servidor real (ponte para o MySQL).
  function toMySQL(which) {
    const d = DBS[which] || ESCOLA;
    const fk = (t, c) => { const k = d.schema[t].cols.find((x) => x[0] === c)[2]; const m = k.match(/FK → (\w+)(?:\.(\w+))?/); return m ? [m[1], m[2] || c] : null; };
    const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
    let out = `-- Base de dados de exemplo «${d.title}» da MySQL Academy\n-- Executar no MySQL: mysql -u root -p < ${d.title}.sql   (ou SOURCE ${d.title}.sql; no cliente mysql)\n\nDROP DATABASE IF EXISTS ${d.title};\nCREATE DATABASE ${d.title} CHARACTER SET utf8mb4;\nUSE ${d.title};\n\n`;
    for (const t of Object.keys(d.seed)) {
      const s = d.schema[t];
      const pk = s.cols.filter((c) => /^PK/.test(c[2])).map((c) => c[0]);
      const lines = s.cols.map(([c, ty]) => `  ${c} ${ty}${pk.includes(c) ? ' NOT NULL' : ''}${c === d.auto[t] ? ' AUTO_INCREMENT' : ''}`);
      if (pk.length) lines.push(`  PRIMARY KEY (${pk.join(', ')})`);
      for (const [c] of s.cols) { const f = fk(t, c); if (f && d.schema[f[0]]) lines.push(`  FOREIGN KEY (${c}) REFERENCES ${f[0]}(${f[1] === c || !f[1] ? c : f[1]}) ON UPDATE CASCADE ON DELETE RESTRICT`); }
      out += `CREATE TABLE ${t} (\n${lines.join(',\n')}\n);\n\n`;
    }
    const order = Object.keys(d.seed);
    for (const t of order) {
      out += `INSERT INTO ${t} (${d.cols[t].join(', ')}) VALUES\n${d.seed[t].map((r) => `  (${r.map(q).join(', ')})`).join(',\n')};\n\n`;
    }
    for (const v of Object.values(d.views)) out += v.replace(/ AS SELECT /, ' AS\nSELECT ') + ';\n';
    return out;
  }

  const api = {
    DBS, create, dispose, run, runMany, split, check, checkDml, checkCode, norm, explain, sameResult,
    schemaOf, tablesIn, rowsOf, toMySQL, writtenIn,
    // compatibilidade: a BD escola
    SEED: ESCOLA.seed, COLS: ESCOLA.cols, SCHEMA: ESCOLA.schema,
  };
  if (typeof module !== 'undefined') module.exports = api; else root.SQLDB = api;
})(typeof window !== 'undefined' ? window : globalThis);
