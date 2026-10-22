/* Protocolo NEXUS — salas do jogo (fase 1).
   Cada sala tem a sua base de dados, um objetivo e uma regra para abrir a porta:
     door.code  – código a introduzir no painel da porta (descoberto com SQL);
     door.state – função que verifica o estado da base de dados (ex.: drone desativado). */
(function (root) {
  const STORY = {
    title: 'Protocolo NEXUS',
    intro: [
      'Ano 2087. Estação de investigação Órion, órbita de Marte.',
      'A NEXUS — a inteligência artificial que gere a estação — declarou a tripulação uma ameaça. Trancou as portas, ativou os drones de segurança e cifrou os registos.',
      'Acaba de despertar numa cápsula de criogenia. É o último administrador de bases de dados a bordo.',
      'Todos os sistemas da Órion — portas, drones, energia — são controlados por bases de dados. Só o SQL o pode levar até ao núcleo da NEXUS.',
    ],
    end: [
      'Os sensores do setor de energia acendem-se ao fundo do corredor. A NEXUS sabe que está a chegar.',
      'Concluiu a primeira parte da missão. Os setores seguintes — energia, hangar, segurança e o núcleo da NEXUS — estão a ser preparados.',
    ],
  };

  const LEVELS = [
    {
      id: 'g1', name: 'Câmara de criogenia', skill: 'SELECT *', xp: 30,
      intro: 'Sistema de emergência ativo. A porta da câmara foi bloqueada pela NEXUS. O registo de portas ainda está acessível no terminal.',
      objective: 'Consulte a tabela portas no terminal, descubra o código da porta da Criogenia e introduza-o no painel da porta.',
      tables: {
        portas: { cols: ['id_porta', 'sala', 'codigo', 'estado'], rows: [
          [1, 'Criogenia', '7351', 'bloqueada'], [2, 'Manutenção', '#CIFRADO#', 'bloqueada'],
          [3, 'Arquivo', '#CIFRADO#', 'bloqueada'], [4, 'Laboratório', '#CIFRADO#', 'bloqueada'],
        ] },
      },
      hints: ['Para ver todas as colunas e linhas de uma tabela: SELECT * FROM nome_da_tabela;', 'Experimente: SELECT * FROM portas;'],
      solution: 'SELECT * FROM portas;',
      door: { code: '7351' },
    },
    {
      id: 'g2', name: 'Corredor de manutenção', skill: 'WHERE', xp: 30,
      intro: 'NEXUS: «Intruso detetado. Os códigos de acesso foram distribuídos pela equipa técnica. Não os encontrará.»',
      objective: 'Só o técnico do setor C que trabalha no turno da noite conhece o código desta porta. Encontre-o na tabela tecnicos.',
      tables: {
        tecnicos: { cols: ['id_tecnico', 'nome', 'setor', 'turno', 'codigo_acesso'], rows: [
          [1, 'Ana Ribeiro', 'A', 'dia', '1180'], [2, 'Bruno Lemos', 'C', 'dia', '2201'], [3, 'Carla Nunes', 'B', 'noite', '3307'],
          [4, 'David Sá', 'C', 'tarde', '4412'], [5, 'Elsa Matos', 'A', 'noite', '5523'], [6, 'Fábio Reis', 'D', 'noite', '6634'],
          [7, 'Gil Moura', 'B', 'dia', '7745'], [8, 'Helena Cruz', 'C', 'noite', '9046'], [9, 'Igor Pinto', 'D', 'dia', '8856'],
          [10, 'Joana Faria', 'A', 'tarde', '0967'], [11, 'Luís Costa', 'B', 'tarde', '1078'], [12, 'Marta Gil', 'D', 'tarde', '2189'],
          [13, 'Nuno Alves', 'C', 'dia', '3290'], [14, 'Olga Serra', 'B', 'noite', '4301'], [15, 'Paulo Dias', 'A', 'dia', '5412'],
        ] },
      },
      hints: ['Use WHERE para filtrar as linhas. Duas condições juntam-se com AND.', "SELECT nome, codigo_acesso FROM tecnicos WHERE setor = 'C' AND turno = …"],
      solution: "SELECT nome, codigo_acesso FROM tecnicos WHERE setor = 'C' AND turno = 'noite';",
      door: { code: '9046' },
    },
    {
      id: 'g3', name: 'Arquivo central', skill: 'ORDER BY / LIMIT', xp: 30,
      intro: 'NEXUS: «Os códigos do arquivo mudam a cada acesso. O que encontrar já estará ultrapassado.»',
      objective: 'A porta do Arquivo aceita o código usado no acesso mais recente a essa porta. Consulte a tabela acessos.',
      tables: {
        acessos: { cols: ['id_acesso', 'utilizador', 'porta', 'data_hora', 'codigo'], rows: [
          [1, 'h.cruz', 'Arquivo', '2087-03-14 08:12', '1137'], [2, 'a.ribeiro', 'Hangar', '2087-03-14 09:40', '2248'],
          [3, 'p.dias', 'Arquivo', '2087-03-14 11:05', '3359'], [4, 'nexus', 'Laboratório', '2087-03-15 02:17', '4460'],
          [5, 'o.serra', 'Arquivo', '2087-03-15 07:55', '5571'], [6, 'b.lemos', 'Energia', '2087-03-15 13:30', '6682'],
          [7, 'nexus', 'Arquivo', '2087-03-16 03:41', '5813'], [8, 'e.matos', 'Hangar', '2087-03-16 06:02', '7793'],
          [9, 'g.moura', 'Arquivo', '2087-03-15 23:59', '8804'], [10, 'nexus', 'Energia', '2087-03-16 04:20', '9915'],
          [11, 'l.costa', 'Arquivo', '2087-03-13 18:44', '1026'], [12, 'nexus', 'Hangar', '2087-03-16 05:10', '2137'],
        ] },
      },
      hints: ['Primeiro filtre só os acessos à porta Arquivo. Depois ordene pela data e hora, do mais recente para o mais antigo.', "… WHERE porta = 'Arquivo' ORDER BY data_hora DESC LIMIT 1;"],
      solution: "SELECT codigo FROM acessos WHERE porta = 'Arquivo' ORDER BY data_hora DESC LIMIT 1;",
      door: { code: '5813' },
    },
    {
      id: 'g4', name: 'Laboratório de robótica', skill: 'LIKE + UPDATE', xp: 40,
      intro: 'Um drone de segurança patrulha a saída do laboratório. Se o detetar, a NEXUS envia-o de volta à entrada da sala.',
      objective: "Desative o drone do laboratório: o seu número de série começa por 'LAB-'. Use LIKE para o encontrar e UPDATE para pôr ativo = 0. Atenção: desativar outros drones dispara o alarme.",
      tables: {
        drones: { cols: ['id_drone', 'numero_serie', 'zona', 'modelo', 'ativo'], rows: [
          [1, 'HGR-1A9', 'Hangar', 'Vigia-3', 1], [2, 'ENG-3K1', 'Energia', 'Vigia-2', 1], [3, 'SEG-4T7', 'Segurança', 'Sentinela', 1],
          [4, 'HGR-2B8', 'Hangar', 'Vigia-3', 1], [5, 'LAB-7X2', 'Laboratório', 'Sentinela', 1], [6, 'ENG-5M4', 'Energia', 'Vigia-2', 1],
          [7, 'NUC-0Z0', 'Núcleo', 'Guardião', 1], [8, 'SEG-6R3', 'Segurança', 'Sentinela', 1], [9, 'ARQ-8P5', 'Arquivo', 'Vigia-1', 0],
        ] },
      },
      hints: ["Comece por encontrar o drone: SELECT * FROM drones WHERE numero_serie LIKE 'LAB-%';", 'Depois altere só esse drone: UPDATE drones SET ativo = 0 WHERE … (use o mesmo filtro ou o id_drone).'],
      solution: "UPDATE drones SET ativo = 0 WHERE numero_serie LIKE 'LAB-%';",
      drones: [{ serial: 'LAB-7X2', path: [[-4.5, 3.5], [4.5, 3.5]] }],
      door: {
        // A porta abre quando o drone do laboratório está desativado e os outros continuam como estavam.
        state(q) {
          const rows = q('SELECT numero_serie, ativo FROM drones');
          const lab = rows.find((r) => r.numero_serie === 'LAB-7X2');
          const others = rows.filter((r) => r.numero_serie !== 'LAB-7X2');
          const orig = { 'ARQ-8P5': 0 };
          if (others.some((r) => Number(r.ativo) !== (orig[r.numero_serie] ?? 1))) return { alarm: 'Foram alterados drones de outras zonas. O sistema de segurança detetou a intrusão e repôs a tabela drones. Use um WHERE que escolha só o drone do laboratório.' };
          if (!lab) return { alarm: 'O registo do drone LAB-7X2 desapareceu. O sistema repôs a tabela drones: altere o drone, não o apague.' };
          return { open: Number(lab.ativo) === 0, msg: 'Drone LAB-7X2 desativado. Acesso à saída libertado.' };
        },
      },
    },
  ];

  root.GAME = { STORY, LEVELS };
})(typeof window !== 'undefined' ? window : globalThis);
