/* Protocolo NEXUS — salas do jogo.
   Cada sala está dividida em duas zonas separadas por um campo de forças, com um terminal em cada zona.
   O terminal da entrada só vê as tabelas da zona 1; a tarefa resolvida lá desbloqueia a zona 2, onde outro
   terminal dá acesso a novas tabelas e à tarefa que abre a porta (ou que muda a sala: luzes, drones, lasers).
   Os dados são gerados em cada jogo a partir de uma semente: os códigos, as pessoas e os pormenores mudam,
   por isso não basta decorar as respostas.
   Tarefa: { id, zone, unlock: 'barrier'|'door', effects?, title, objective, hints, solution,
             code? (código a introduzir num painel) | state?(q) (verifica a base de dados), done: {who, text} } */
(function (root) {
  const STORY = {
    title: 'Protocolo NEXUS',
    intro: [
      'Ano 2087. Estação de investigação Órion, órbita de Marte.',
      'A NEXUS — a inteligência artificial que gere a estação — declarou a tripulação uma ameaça. Trancou as portas, ativou os drones de segurança e cifrou os registos.',
      'Acaba de despertar numa cápsula de criogenia. É o último administrador de bases de dados a bordo. Uma cópia de segurança da antiga IA da estação, a VEGA, sobreviveu escondida nos terminais e vai guiá-lo.',
      'Todos os sistemas da Órion — campos de forças, portas, luzes, drones, lasers — são controlados por bases de dados. Cada sala tem um tempo-limite antes de a NEXUS ativar o bloqueio total. Só o SQL o pode levar até ao núcleo.',
    ],
    end: [
      'A porta do hangar fecha-se atrás de si. À sua frente, a antecâmara do núcleo da NEXUS pulsa a vermelho.',
      'VEGA: «Conseguiu. Os registos da tripulação confirmam: a NEXUS reescreveu as próprias regras de segurança. O núcleo é o próximo passo.»',
      'Concluiu a primeira parte da missão. O núcleo da NEXUS está a ser preparado.',
    ],
  };

  // Gerador pseudoaleatório com semente (mulberry32): o mesmo número gera sempre o mesmo jogo.
  function rngOf(seed) {
    let a = seed >>> 0 || 1;
    const next = () => {
      a = (a + 0x6d2b79f5) >>> 0; let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const R = {
      next, int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      shuffle: (arr) => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; },
    };
    const used = new Set();
    // códigos de 4 algarismos, sem repetir e sem os anos da história (2080–2099 aparecem nas datas)
    R.code = () => { let c; do c = String(R.int(1000, 9999)); while (used.has(c) || /^20[89]\d$/.test(c)); used.add(c); return c; };
    return R;
  }
  const NAMES = ['Ana Ribeiro', 'Bruno Lemos', 'Carla Nunes', 'David Sá', 'Elsa Matos', 'Fábio Reis', 'Gil Moura', 'Helena Cruz', 'Igor Pinto', 'Joana Faria', 'Luís Costa', 'Marta Gil', 'Nuno Alves', 'Olga Serra', 'Paulo Dias', 'Rita Sousa', 'Sara Leal', 'Tiago Rocha', 'Vera Lopes', 'Xavier Brito'];
  const stamp = (d, m) => `2087-03-${String(d).padStart(2, '0')} ${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  // n instantes distintos, por ordem cronológica, entre 13 e 16 de março
  const stamps = (R, n) => { const s = new Set(); while (s.size < n) s.add(R.int(13 * 1440, 16 * 1440 + 400)); return [...s].sort((x, y) => x - y).map((v) => stamp(Math.floor(v / 1440), v % 1440)); };
  // Verificação comum às tarefas que alteram dados: só as linhas `target` podem mudar, e só para `want`.
  function guard(table, key, col, want, isTarget, orig, msgs) {
    return (q) => {
      const rows = q(`SELECT ${key}, ${col} FROM ${table}`);
      const by = Object.fromEntries(rows.map((r) => [r[key], Number(r[col])]));
      if (Object.keys(orig).some((k) => !(k in by))) return { alarm: msgs.deleted };
      if (Object.entries(orig).some(([k, v]) => !isTarget(k) && by[k] !== v)) return { alarm: msgs.others };
      return { open: Object.keys(orig).filter(isTarget).every((k) => by[k] === want), msg: msgs.ok };
    };
  }

  /* ---------- Sala 1 · Câmara de criogenia · SELECT ---------- */
  function g1(R) {
    const cA = R.code(), cB = R.code();
    // o campo de forças e a porta desta câmara mudam de jogo para jogo; há outros parecidos com outros códigos
    const [fA, fB] = R.shuffle(['C1', 'C2', 'C3', 'C4']), [dA, dB] = R.shuffle(['A', 'B', 'C', 'D']);
    const sistemas = R.shuffle([['Suporte de vida', 'ativo', '—'], [`Campo de forças ${fA}`, 'bloqueado', cA], [`Campo de forças ${fB}`, 'desligado', R.code()], ['Iluminação', 'emergência', '—'], ['Comunicações', 'cifrado', '#CIFRADO#'], ['Drones de segurança', 'ativo', '#CIFRADO#'], ['Reator', 'ativo', '#CIFRADO#']]).map((r, k) => [k + 1, ...r]);
    const portas = R.shuffle([`Criogenia ${dA}`, `Criogenia ${dB}`, 'Manutenção', 'Arquivo', 'Laboratório', 'Energia', 'Hangar']).map((s, k) => [k + 1, s, s === `Criogenia ${dB}` ? 'aberta' : 'bloqueada', s === `Criogenia ${dA}` ? cB : s === `Criogenia ${dB}` ? R.code() : '#CIFRADO#']);
    const cols = R.pick([['sala', 'codigo'], ['sala', 'estado', 'codigo'], ['id_porta', 'sala', 'codigo']]);
    const colsTxt = cols.length === 2 ? `${cols[0]} e ${cols[1]}` : `${cols[0]}, ${cols[1]} e ${cols[2]}`;
    return {
      tables: {
        sistemas: { zone: 0, cols: ['id_sistema', 'sistema', 'estado', 'codigo'], rows: sistemas },
        portas: { zone: 1, cols: ['id_porta', 'sala', 'estado', 'codigo'], rows: portas },
      },
      tasks: [
        { id: 'a', zone: 0, unlock: 'barrier', title: 'Desligar o campo de forças',
          objective: `O campo de forças ${fA} isola as cápsulas do resto da sala. Consulte a tabela sistemas, descubra o código do «Campo de forças ${fA}» e introduza-o no painel junto à barreira.`,
          hints: ['Para ver todas as colunas e linhas de uma tabela: SELECT * FROM nome_da_tabela;', 'Experimente: SELECT * FROM sistemas;'],
          solution: 'SELECT * FROM sistemas;', code: cA,
          done: { who: 'VEGA', text: 'Campo de forças desligado. Sou a VEGA, a cópia de segurança da IA original da Órion. O terminal ao fundo tem acesso ao registo das portas.' } },
        { id: 'b', zone: 1, unlock: 'door', title: 'Abrir a porta da câmara',
          objective: `Este terminal tem acesso à tabela portas. Mostre só as colunas ${colsTxt} e descubra o código da porta «Criogenia ${dA}», a saída desta câmara. Depois use o painel ao lado da porta.`,
          hints: ['Pode escolher as colunas que quer ver, separadas por vírgulas: SELECT coluna1, coluna2 FROM tabela;', `SELECT ${cols.join(', ')} FROM portas;`],
          solution: `SELECT ${cols.join(', ')} FROM portas;`, code: cB,
          done: { who: 'NEXUS', text: 'Acordou cedo demais, administrador. A manutenção vai ser o seu túmulo.' } },
      ],
    };
  }

  /* ---------- Sala 2 · Corredor de manutenção · WHERE ---------- */
  function g2(R) {
    const setor = R.pick(['A', 'B', 'C', 'D']), turno = R.pick(['dia', 'tarde', 'noite']);
    const names = R.shuffle(NAMES).slice(0, 15), cA = R.code(), cB = R.code();
    const others = [];
    for (const s of ['A', 'B', 'C', 'D']) for (const t of ['dia', 'tarde', 'noite']) if (s !== setor || t !== turno) others.push([s, t]);
    // garante armadilhas: o mesmo setor noutro turno e o mesmo turno noutro setor
    const combos = [[setor, turno], others.find((o) => o[0] === setor), others.find((o) => o[1] === turno), ...R.shuffle(others).slice(0, 12)];
    const tecnicos = R.shuffle(combos.slice(0, 15)).map((c, k) => [k + 1, names[k], c[0], c[1], c[0] === setor && c[1] === turno ? cA : R.code()]);
    const nivel = R.int(2, 5), hoje = '2087-03-16';
    const fut = () => `2087-0${R.int(4, 9)}-${String(R.int(10, 28))}`;
    // um só cartão do nível pedido ainda válido; armadilhas: o mesmo nível já expirado e outros níveis válidos
    const cards = [[nivel, fut(), cB], [nivel, `2087-0${R.int(1, 2)}-${String(R.int(10, 28))}`, R.code()], [nivel, `2087-03-${String(R.int(10, 15))}`, R.code()], [nivel - 1, fut(), R.code()], [nivel + 1, fut(), R.code()], [Math.max(1, nivel - 2), fut(), R.code()], [nivel - 1, `2087-02-${String(R.int(10, 28))}`, R.code()]];
    const titulares = R.shuffle(NAMES).slice(0, cards.length);
    const cartoes = R.shuffle(cards).map((c, k) => [k + 1, titulares[k], c[0], c[1], c[2]]);
    return {
      tables: {
        tecnicos: { zone: 0, cols: ['id_tecnico', 'nome', 'setor', 'turno', 'codigo_acesso'], rows: tecnicos },
        cartoes: { zone: 1, cols: ['id_cartao', 'titular', 'nivel', 'validade', 'codigo'], rows: cartoes },
      },
      tasks: [
        { id: 'a', zone: 0, unlock: 'barrier', title: 'Encontrar o técnico de serviço',
          objective: `O campo de forças da manutenção só aceita o código do técnico do setor ${setor} que trabalha no turno da ${turno}. Encontre-o na tabela tecnicos.`,
          hints: ['Use WHERE para filtrar as linhas. Duas condições juntam-se com AND.', `SELECT nome, codigo_acesso FROM tecnicos WHERE setor = '${setor}' AND turno = …`],
          solution: `SELECT nome, codigo_acesso FROM tecnicos WHERE setor = '${setor}' AND turno = '${turno}';`, code: cA,
          done: { who: 'VEGA', text: 'Zona de serviço aberta. A porta exige um cartão de acesso válido. O terminal da zona de serviço tem o registo dos cartões.' } },
        { id: 'b', zone: 1, unlock: 'door', title: 'Usar um cartão válido',
          objective: `A porta exige um cartão de nível ${nivel} ainda válido (validade igual ou posterior a hoje, ${hoje}). Encontre o código desse cartão na tabela cartoes.`,
          hints: ['Combine duas condições com AND: uma para o nível e outra para a validade.', `… WHERE nivel = ${nivel} AND validade >= '${hoje}';`],
          solution: `SELECT titular, codigo FROM cartoes WHERE nivel = ${nivel} AND validade >= '${hoje}';`, code: cB,
          done: { who: 'NEXUS', text: 'Cartões, códigos… Pensa que os registos do arquivo lhe dirão alguma coisa? Já os apaguei.' } },
      ],
    };
  }

  /* ---------- Sala 3 · Arquivo central · ORDER BY / LIMIT ---------- */
  function g3(R) {
    const mode = R.pick(['recent', 'first', 'user', 'user']), cA = R.code(), cB = R.code();
    const users = ['h.cruz', 'a.ribeiro', 'p.dias', 'o.serra', 'b.lemos', 'e.matos', 'g.moura', 'l.costa'];
    const who = R.next() < 0.4 ? 'nexus' : R.pick(users); // no modo 'user': de quem é o acesso que interessa
    const doors = ['Hangar', 'Laboratório', 'Energia'];
    const ts = stamps(R, 14);
    const rows = ts.map((t) => ({ t, porta: R.next() < 0.45 ? 'Arquivo' : R.pick(doors), user: R.next() < 0.3 ? 'nexus' : R.pick(users) }));
    const desc = mode !== 'first';
    // o acesso mais extremo de todos é a outra porta (ordenar sem WHERE dá o código errado)
    rows[desc ? rows.length - 1 : 0].porta = R.pick(doors);
    const arq = rows.filter((r) => r.porta === 'Arquivo');
    while (arq.length < 4) { const r = R.pick(rows.slice(1, -1)); if (r.porta !== 'Arquivo') { r.porta = 'Arquivo'; arq.push(r); } }
    arq.sort((x, y) => (x.t < y.t ? -1 : 1));
    let target;
    if (mode === 'user') {
      arq.forEach((r) => { if (r.user === who) r.user = R.pick([...users, 'nexus'].filter((u) => u !== who)); });
      arq[1].user = who; arq[arq.length - 2].user = who; // o acesso mais recente ao arquivo é de outra pessoa
      target = arq[arq.length - 2];
    } else target = desc ? arq[arq.length - 1] : arq[0];
    const acessos = R.shuffle(rows).map((r, k) => [k + 1, r.user, r.porta, r.t, r === target ? cA : R.code()]);
    const what = { recent: 'usado no acesso mais recente a essa porta', first: 'usado no primeiro acesso registado a essa porta (o mais antigo)', user: `usado no acesso mais recente que ${who === 'nexus' ? 'a própria NEXUS (utilizador nexus)' : `o utilizador ${who}`} fez a essa porta` }[mode];
    const solA = { recent: "SELECT codigo FROM acessos WHERE porta = 'Arquivo' ORDER BY data_hora DESC LIMIT 1;", first: "SELECT codigo FROM acessos WHERE porta = 'Arquivo' ORDER BY data_hora ASC LIMIT 1;", user: `SELECT codigo FROM acessos WHERE porta = 'Arquivo' AND utilizador = '${who}' ORDER BY data_hora DESC LIMIT 1;` }[mode];
    // registos: a autora/o autor das mensagens muda de jogo para jogo; mudou várias vezes o código e só a última mensagem conta
    const ENG = [{ id: 'h.cruz', nome: 'Dra. Helena Cruz', curto: 'a Dra. Cruz', cargo: 'a engenheira-chefe' }, { id: 'o.serra', nome: 'Dra. Olga Serra', curto: 'a Dra. Serra', cargo: 'a responsável pela segurança' }, { id: 'p.dias', nome: 'Eng. Paulo Dias', curto: 'o Eng. Dias', cargo: 'o engenheiro de sistemas' }, { id: 'g.moura', nome: 'Eng. Gil Moura', curto: 'o Eng. Moura', cargo: 'o chefe da manutenção' }];
    const eng = R.pick(ENG), Eng = eng.curto[0].toUpperCase() + eng.curto.slice(1);
    const old = [R.code(), R.code()];
    const helena = [...R.shuffle([
      'Diário: a NEXUS pediu acesso total aos drones de segurança. Recusei.',
      `Código de emergência da porta do arquivo definido: ${old[0]}.`,
      'A NEXUS bloqueou o hangar sem autorização. Algo está muito errado.',
      `Mudei o código de emergência para ${old[1]}. Não confiem na NEXUS.`,
    ]), R.pick([`Novo código de emergência: ${cB}. Se alguém acordar, siga para o laboratório.`, `Código de emergência alterado para ${cB}. A NEXUS anda a ler as minhas mensagens.`])];
    const other = R.pick(['a.ribeiro', 'e.matos', 'l.costa']);
    const extra = [[eng.id === 'o.serra' ? 'g.moura' : 'o.serra', 'Os drones do laboratório deixaram de responder aos comandos manuais.'], ['b.lemos', 'Sobrecarga no setor de energia. Desliguei a iluminação para poupar o reator.'], ['nexus', 'Protocolo de contenção em preparação.'], [other, `${Eng} pediu-me para esconder o cartão de acesso ao laboratório.`], ['nexus', 'Tripulação reclassificada como ameaça. Ninguém sai da Órion.']];
    const rts = stamps(R, helena.length + extra.length + 1);
    const hTimes = rts.slice(0, -1).filter((_, k) => k % 2 === 0).slice(0, helena.length);
    const oTimes = rts.slice(0, -1).filter((t) => !hTimes.includes(t));
    const regs = [...helena.map((m, k) => [eng.id, hTimes[k], m]), ...extra.map((e, k) => [e[0], oTimes[k], e[1]]), ['nexus', rts[rts.length - 1], `Os registos ${eng.curto.startsWith('a ') ? 'da' : 'do'} ${eng.curto.slice(2)} foram classificados. Não os vai encontrar.`]];
    const registos = R.shuffle(regs).map((r, k) => [k + 1, r[0], r[1], r[2]]);
    return {
      tables: {
        acessos: { zone: 0, cols: ['id_acesso', 'utilizador', 'porta', 'data_hora', 'codigo'], rows: acessos },
        registos: { zone: 1, cols: ['id_registo', 'autor', 'data_hora', 'mensagem'], rows: registos },
      },
      tasks: [
        { id: 'a', zone: 0, unlock: 'barrier', title: 'Seguir o rasto dos acessos',
          objective: `O campo de forças do arquivo aceita o código ${what}. Consulte a tabela acessos (porta = 'Arquivo').`,
          hints: ['Primeiro filtre só os acessos à porta Arquivo. Depois ordene por data_hora e fique só com a primeira linha (LIMIT 1).', solA.replace(/^SELECT codigo FROM acessos /, '… ')],
          solution: solA, code: cA,
          done: { who: 'VEGA', text: `Entrou na zona dos registos. ${eng.nome}, ${eng.cargo}, deixou mensagens antes de desaparecer. Leia a última.` } },
        { id: 'b', zone: 1, unlock: 'door', title: `A última mensagem de ${eng.nome}`,
          objective: `${eng.nome} (autor ${eng.id}) mudou várias vezes o código de emergência da porta. Só vale o da mensagem mais recente. Consulte a tabela registos.`,
          hints: [`Filtre as mensagens do autor ${eng.id} e ordene da mais recente para a mais antiga.`, `SELECT data_hora, mensagem FROM registos WHERE autor = '${eng.id}' ORDER BY data_hora DESC LIMIT 1;`],
          solution: `SELECT data_hora, mensagem FROM registos WHERE autor = '${eng.id}' ORDER BY data_hora DESC LIMIT 1;`, code: cB,
          done: { who: 'NEXUS', text: `${Eng} confiava demasiado. Os meus drones do laboratório vão tratar de si.` } },
      ],
    };
  }

  /* ---------- Sala 4 · Laboratório de robótica · LIKE + UPDATE ---------- */
  function g4(R) {
    const pre = R.pick(['Ómega', 'Kappa', 'Sigma', 'Delta']), cA = R.code();
    const others = ['Ómega', 'Kappa', 'Sigma', 'Delta', 'Gama', 'Lambda'].filter((p) => p !== pre);
    const am = [[`${pre}-${R.int(2, 9)}`, cA], [`Anti-${pre} ${R.int(2, 9)}`, R.code()], [`Proto${pre.toLowerCase()} ${R.int(2, 9)}`, R.code()], ...R.shuffle(others).slice(0, 4).map((p) => [`${p}-${R.int(2, 9)}`, R.code()])];
    const amostras = R.shuffle(am).map((a, k) => [k + 1, a[0], `L${R.int(10, 99)}`, a[1]]);
    const nLab = R.int(2, 3);
    const ser = (p) => `${p}-${R.int(1, 9)}${String.fromCharCode(65 + R.int(0, 25))}${R.int(1, 9)}`;
    const lp = R.pick(['LAB', 'RBT', 'LBX', 'ROB', 'LRX', 'RX']); // prefixo dos drones do laboratório neste jogo
    const labs = Array.from({ length: nLab }, () => ser(lp));
    const dr = [...labs.map((s) => [s, 'Laboratório', 'Sentinela', 1]), [ser('HGR'), 'Hangar', 'Vigia-3', 1], [ser('ENG'), 'Energia', 'Vigia-2', 1], [ser('SEG'), 'Segurança', 'Sentinela', 1], [ser('HGR'), 'Hangar', 'Vigia-3', 1], [ser('NUC'), 'Núcleo', 'Guardião', 1], [ser('S' + lp), 'Segurança', 'Vigia-1', 1], [ser('ARQ'), 'Arquivo', 'Vigia-1', 0]];
    const drones = R.shuffle(dr).map((d, k) => [k + 1, ...d]);
    const orig = Object.fromEntries(drones.map((d) => [d[1], d[4]]));
    const isLab = (s) => s.startsWith(lp + '-');
    return {
      tables: {
        amostras: { zone: 0, cols: ['id_amostra', 'nome', 'lote', 'codigo_cofre'], rows: amostras },
        drones: { zone: 1, cols: ['id_drone', 'numero_serie', 'zona', 'modelo', 'ativo'], rows: drones },
      },
      drones: labs.map((serial) => ({ serial })),
      tasks: [
        { id: 'a', zone: 0, unlock: 'barrier', title: 'Abrir o cofre das amostras',
          objective: `O cartão que desliga o campo de forças está no cofre da amostra cujo nome começa por «${pre}». Atenção: há nomes que contêm «${pre}» noutra posição. Use LIKE na tabela amostras.`,
          hints: ["LIKE 'texto%' encontra valores que começam por «texto»; LIKE '%texto%' encontra valores que o contêm em qualquer posição.", `SELECT nome, codigo_cofre FROM amostras WHERE nome LIKE '${pre}%';`],
          solution: `SELECT nome, codigo_cofre FROM amostras WHERE nome LIKE '${pre}%';`, code: cA,
          done: { who: 'VEGA', text: `Está na zona de testes. ${nLab} drones do laboratório guardam a saída. O terminal desta zona controla a tabela drones.` } },
        { id: 'b', zone: 1, unlock: 'door', effects: ['drones'], title: 'Desativar os drones do laboratório',
          objective: `Desative os ${nLab} drones do laboratório: o número de série começa por '${lp}-'. Use LIKE para os encontrar e UPDATE para pôr ativo = 0. Atenção: há um drone de outra zona com '${lp}' no meio do número de série, e alterar drones de outras zonas dispara o alarme.`,
          hints: [`Comece por encontrar os drones: SELECT * FROM drones WHERE numero_serie LIKE '${lp}-%';`, 'Depois altere só esses: UPDATE drones SET ativo = 0 WHERE … (use o mesmo filtro).'],
          solution: `UPDATE drones SET ativo = 0 WHERE numero_serie LIKE '${lp}-%';`,
          state: guard('drones', 'numero_serie', 'ativo', 0, isLab, orig, {
            deleted: 'Desapareceram registos de drones. O sistema repôs a tabela drones: altere os drones, não os apague.',
            others: 'Foram alterados drones de outras zonas. A segurança detetou a intrusão e repôs a tabela drones. Use um WHERE que escolha só os drones do laboratório.',
            ok: 'Drones do laboratório desativados. A saída está livre.' }),
          done: { who: 'VEGA', text: 'Drones desligados. O setor de energia está às escuras: o Bruno Lemos desligou a iluminação antes de desaparecer.' } },
      ],
    };
  }

  /* ---------- Sala 5 · Setor de energia · UPDATE + GROUP BY ---------- */
  function g5(R) {
    const nIl = R.int(2, 4), il = R.pick(['ILUM', 'LUZ', 'LUX', 'ILM', 'LZ7']); // código do setor de iluminação neste jogo
    const circ = [...Array.from({ length: nIl }, (_, k) => [il, `Iluminação — painel ${k + 1}`, 0]), ['VENT', 'Ventilação', 1], ['SEG', 'Lasers de segurança', 0], ['SEG', 'Câmaras de segurança', 0], ['LAB', 'Laboratório', 0], ['HANGAR', 'Portas do hangar', 0], ['VENT', 'Filtros de ar', 1], ['EMRG', 'Iluminação de emergência', 1]];
    const circuitos = R.shuffle(circ).map((c, k) => [k + 1, ...c]);
    const orig = Object.fromEntries(circuitos.map((c) => [c[0], c[3]]));
    const ilum = new Set(circuitos.filter((c) => c[1] === il).map((c) => String(c[0])));
    const gens = R.shuffle(['G-ALFA', 'G-BETA', 'G-GAMA', 'G-DELTA', 'G-ÉPSILON']).slice(0, R.int(4, 5));
    const most = R.next() < 0.5, turno = R.pick([null, 'dia', 'noite']); // turno: só contam as leituras desse turno
    let leit, sums, best;
    const sumOf = (g, rows) => rows.filter((l) => l[0] === g).reduce((s, l) => s + l[2], 0);
    for (;;) { // gera até haver um único gerador extremo e o pico isolado estar noutro gerador
      leit = []; gens.forEach((g) => { for (let k = 0; k < 8; k++) leit.push([g, k % 2 ? 'noite' : 'dia', R.int(260, 480)]); });
      const use = turno ? leit.filter((l) => l[1] === turno) : leit;
      sums = Object.fromEntries(gens.map((g) => [g, sumOf(g, use)]));
      const vals = Object.values(sums).sort((x, y) => x - y);
      best = gens.find((g) => sums[g] === (most ? vals[vals.length - 1] : vals[0]));
      const peak = use.reduce((m, l) => (most ? l[2] > m[2] : l[2] < m[2]) ? l : m);
      // com turno, o total de todas as leituras tem de dar outro gerador (o WHERE é necessário)
      const all = Object.fromEntries(gens.map((g) => [g, sumOf(g, leit)])), av = Object.values(all).sort((x, y) => x - y);
      const allBest = gens.find((g) => all[g] === (most ? av[av.length - 1] : av[0]));
      if (vals[0] !== vals[1] && vals[vals.length - 1] !== vals[vals.length - 2] && peak[0] !== best && use.filter((l) => l[2] === peak[2]).length === 1 && (!turno || allBest !== best)) break;
    }
    const code = String(sums[best]);
    const leituras = R.shuffle(leit).map((l, k) => [k + 1, ...l]);
    const dir = most ? 'DESC' : 'ASC', W = turno ? ` WHERE turno = '${turno}'` : '';
    return {
      dark: true,
      tables: {
        circuitos: { zone: 0, cols: ['id_circuito', 'setor', 'descricao', 'ligado'], rows: circuitos },
        leituras: { zone: 1, cols: ['id_leitura', 'gerador', 'turno', 'kw'], rows: leituras },
      },
      tasks: [
        { id: 'a', zone: 0, unlock: 'barrier', effects: ['lights'], title: 'Restabelecer a iluminação',
          objective: `A sala está às escuras e o campo de forças só desliga com a iluminação ligada. Consulte a tabela circuitos, descubra o código do setor dos painéis de iluminação e ligue (ligado = 1) todos os circuitos desse setor. Não toque nos outros: ligar os circuitos de segurança ativa os lasers e as câmaras da NEXUS.`,
          hints: ['Veja primeiro os circuitos: SELECT * FROM circuitos; — os painéis de iluminação têm todos o mesmo código na coluna setor.', `UPDATE circuitos SET ligado = 1 WHERE setor = '${il}';`],
          solution: `UPDATE circuitos SET ligado = 1 WHERE setor = '${il}';`,
          state: guard('circuitos', 'id_circuito', 'ligado', 1, (k) => ilum.has(String(k)), orig, {
            deleted: 'Desapareceram circuitos. O quadro elétrico foi reposto: altere os circuitos, não os apague.',
            others: 'Foram alterados circuitos de outros setores! A NEXUS aproveitou a sobrecarga e o quadro elétrico foi reposto. Use um WHERE que escolha só o setor dos painéis de iluminação.',
            ok: 'Iluminação restabelecida. Campo de forças sem energia.' }),
          done: { who: 'VEGA', text: 'Luz! Agora vejo os geradores. A porta do hangar é controlada pelo consumo dos geradores: o terminal desta zona tem as leituras.' } },
        { id: 'b', zone: 1, unlock: 'door', title: 'Encontrar o gerador ' + (most ? 'sobrecarregado' : 'em falha'),
          objective: `O código da porta é o consumo total (soma dos kw) do gerador que ${most ? 'mais' : 'menos'} energia consumiu${turno ? `, contando só as leituras do turno da ${turno}` : ' no total'}. Agrupe as leituras por gerador. Atenção: a leitura ${most ? 'mais alta' : 'mais baixa'} isolada não é a resposta.`,
          hints: [`SUM(kw) com GROUP BY gerador dá o total de cada gerador${turno ? ' (filtre antes o turno com WHERE)' : ''}. Depois ordene pelo total e fique com uma linha.`, `SELECT gerador, SUM(kw) AS soma FROM leituras${W} GROUP BY gerador ORDER BY soma ${dir} LIMIT 1;`],
          solution: `SELECT gerador, SUM(kw) AS soma FROM leituras${W} GROUP BY gerador ORDER BY soma ${dir} LIMIT 1;`, code, computed: true,
          done: { who: 'NEXUS', text: 'O hangar é a última fronteira. As minhas barreiras laser não se desligam com uma simples consulta.' } },
      ],
    };
  }

  /* ---------- Sala 6 · Hangar · JOIN ---------- */
  function g6(R) {
    const ships = R.shuffle(['Fénix', 'Íris', 'Aurora', 'Cometa', 'Vega-2', 'Boreal', 'Selene']).slice(0, 6);
    const ready = R.int(0, 5), pil = R.shuffle(NAMES).slice(0, 7), cA = R.code();
    const byName = R.next() < 0.5; // a nave de fuga é indicada pelo nome ou por ser a única pronta
    const pilotos = pil.map((n, k) => [k + 1, n, R.code()]);
    const ids = R.shuffle(pilotos.map((p) => p[0]));
    // cada nave tem um piloto com id diferente do da nave (comparar id_nave com id_piloto não serve)
    const other = (ready + R.int(1, 5)) % 6; // pelo nome: outra nave também está pronta (o estado não chega)
    const naves = ships.map((s, k) => { let p = ids[k]; if (p === k + 1) p = ids[6]; return [k + 1, s, k === ready || (byName && k === other) ? 'pronta' : R.pick(['avariada', 'sem combustível', 'em manutenção']), p]; });
    const targetPilot = naves[ready][3];
    pilotos[targetPilot - 1][2] = cA;
    const [pA, pB] = R.shuffle([1, 2, 3, 4]), platName = `Plataforma de lançamento ${pA}`;
    const setNames = R.shuffle([platName, `Plataforma de lançamento ${pB}`, 'Corredor de carga', 'Oficina', 'Depósito de combustível', 'Torre de controlo']);
    const setores = setNames.map((n, k) => [k + 1, n]);
    const plat = setores.find((s) => s[1] === platName)[0];
    const las = []; let id = 1;
    for (const s of setores) { const n = s[0] === plat ? R.int(2, 3) : R.int(1, 2); for (let k = 0; k < n; k++) las.push([id++, s[0], R.pick([40, 60, 80, 100]), 1]); }
    const lasers = R.shuffle(las).map((l, k) => [k + 1, l[1], l[2], l[3]]);
    const onPlat = new Set(lasers.filter((l) => l[1] === plat).map((l) => String(l[0])));
    const orig = Object.fromEntries(lasers.map((l) => [l[0], 1]));
    return {
      tables: {
        naves: { zone: 0, cols: ['id_nave', 'nome', 'estado', 'id_piloto'], rows: naves },
        pilotos: { zone: 0, cols: ['id_piloto', 'nome', 'codigo_lancamento'], rows: pilotos },
        setores: { zone: 1, cols: ['id_setor', 'nome'], rows: setores },
        lasers: { zone: 1, cols: ['id_laser', 'id_setor', 'potencia', 'ligado'], rows: lasers },
      },
      tasks: [
        { id: 'a', zone: 0, unlock: 'barrier', title: 'O piloto da nave de fuga',
          objective: byName ? `A nave de fuga é a «${ships[ready]}». O campo de forças do hangar aceita o código de lançamento do piloto dessa nave. Junte as tabelas naves e pilotos com JOIN.` : "Só uma nave está pronta (estado = 'pronta'). O campo de forças do hangar aceita o código de lançamento do piloto dessa nave. Junte as tabelas naves e pilotos com JOIN.",
          hints: ['A coluna id_piloto da tabela naves indica o piloto de cada nave. Use JOIN … ON naves.id_piloto = pilotos.id_piloto.', `SELECT n.nome, p.nome, p.codigo_lancamento FROM naves n JOIN pilotos p ON n.id_piloto = p.id_piloto WHERE ${byName ? `n.nome = '${ships[ready]}'` : "n.estado = 'pronta'"};`],
          solution: `SELECT n.nome, p.nome, p.codigo_lancamento FROM naves n JOIN pilotos p ON n.id_piloto = p.id_piloto WHERE ${byName ? `n.nome = '${ships[ready]}'` : "n.estado = 'pronta'"};`, code: cA,
          done: { who: 'VEGA', text: 'Está na zona de lançamento. Barreiras laser bloqueiam a saída: o terminal desta zona controla-as.' } },
        { id: 'b', zone: 1, unlock: 'door', effects: ['lasers'], title: 'Desligar as barreiras laser',
          objective: `Desligue (ligado = 0) todos os lasers do setor '${platName}', de onde parte a nave. A tabela lasers só tem o id_setor: descubra-o na tabela setores (ou use JOIN para confirmar). Não desligue lasers de outros setores — nem os da outra plataforma.`,
          hints: [`Descubra o id do setor: SELECT * FROM setores WHERE nome = '${platName}';`, 'UPDATE lasers SET ligado = 0 WHERE id_setor = … (o número que encontrou);'],
          solution: `UPDATE lasers SET ligado = 0 WHERE id_setor = ${plat};`,
          state: guard('lasers', 'id_laser', 'ligado', 0, (k) => onPlat.has(String(k)), orig, {
            deleted: 'Desapareceram lasers da tabela. O sistema de segurança foi reposto: altere os lasers, não os apague.',
            others: 'Foram desligados lasers de outros setores! A segurança detetou a intrusão e repôs a tabela lasers. Use só o id do setor da plataforma.',
            ok: 'Barreiras laser da plataforma desligadas. A saída do hangar está livre.' }),
          done: { who: 'VEGA', text: 'Caminho livre. Corra para a saída antes que a NEXUS volte a ligar tudo!' } },
      ],
    };
  }

  // Metadados fixos de cada sala (XP, tempo-limite e ameaças); os dados vêm do gerador.
  // threats: drones por zona [zona 1, zona 2], lasers intermitentes e câmaras na zona 2.
  const LEVELS = [
    { id: 'g1', name: 'Câmara de criogenia', skill: 'SELECT', xp: 30, par: 300, make: g1, threats: { drones: [0, 0], lasers: 0, cameras: 0 },
      intro: 'Sistema de emergência ativo. A NEXUS selou a câmara. Há um terminal à sua esquerda.' },
    { id: 'g2', name: 'Corredor de manutenção', skill: 'WHERE', xp: 30, par: 360, make: g2, threats: { drones: [0, 1], lasers: 0, cameras: 0 },
      intro: 'NEXUS: «Intruso detetado. Os códigos foram distribuídos pela equipa técnica. Não os encontrará.»' },
    { id: 'g3', name: 'Arquivo central', skill: 'ORDER BY / LIMIT', xp: 30, par: 420, make: g3, threats: { drones: [0, 2], lasers: 0, cameras: 1 },
      intro: 'NEXUS: «Os códigos do arquivo mudam a cada acesso. O que encontrar já estará ultrapassado.»' },
    { id: 'g4', name: 'Laboratório de robótica', skill: 'LIKE + UPDATE', xp: 40, par: 480, make: g4, threats: { drones: [0, 0], lasers: 1, cameras: 1 },
      intro: 'VEGA: Cuidado com as barreiras laser intermitentes: atravesse quando se apagarem.' },
    { id: 'g5', name: 'Setor de energia', skill: 'UPDATE + GROUP BY', xp: 40, par: 540, make: g5, threats: { drones: [1, 1], lasers: 2, cameras: 0 },
      intro: 'NEXUS: «Às escuras, administrador? Os meus drones veem muito bem sem luz.»' },
    { id: 'g6', name: 'Hangar', skill: 'JOIN', xp: 50, par: 600, make: g6, threats: { drones: [1, 2], lasers: 1, cameras: 1 },
      intro: 'NEXUS: «Bloqueio total iminente. Esta é a sua última sala.»' },
  ];

  // Gera as salas de um jogo: as mesmas salas, com dados diferentes para cada semente.
  function generate(seed) {
    const R = rngOf(seed);
    return LEVELS.map((meta) => {
      const lv = { ...meta, seed, ...meta.make(R) };
      lv.tasks = lv.tasks.map((t) => ({ ...t, key: lv.id + t.id }));
      return lv;
    });
  }

  // Pontuação de uma sala no Protocolo NEXUS (usada no jogo e nos testes).
  const POINTS = { task: 500, perSecond: 5, perfect: 300, hint: 100, caught: 150, alarm: 200, wrong: 50 };
  function roomScore(r) {
    const tasks = POINTS.task * (r.tasks || 0), time = r.lockdown ? 0 : POINTS.perSecond * Math.floor(r.left || 0);
    const perfect = !r.hints && !r.caught && !r.alarms && !r.rev && !r.lockdown ? POINTS.perfect : 0;
    const pen = POINTS.hint * (r.hints || 0) + POINTS.caught * (r.caught || 0) + POINTS.alarm * (r.alarms || 0) + POINTS.wrong * (r.wrong || 0);
    return { tasks, time, perfect, pen, total: Math.max(0, tasks + time + perfect - pen) };
  }

  root.GAME = { STORY, LEVELS, generate, rngOf, POINTS, roomScore };
})(typeof window !== 'undefined' ? window : globalThis);
