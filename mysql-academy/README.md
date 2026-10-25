# MySQL Academy

Aplicação de **autoaprendizagem de MySQL** para desktop e telemóvel (PWA instalável, funciona offline), com lições, exemplos executáveis, exercícios interativos, registo de evolução e **ranking** entre alunos.

## Como se aprende

1. **Passo a passo, por páginas** — cada lição funciona como um assistente: cada página tem um conceito e os exercícios sobre ele, com uma barra de páginas e botões Anterior/Seguinte (ou as setas ← →). A página seguinte só abre depois de resolver os exercícios da atual. Quem preferir pode ver a lição inteira numa só página («Ver a lição inteira»). Se ficar bloqueado, pode ver a resposta certa ("Ver resposta certa") e continuar, perdendo o XP desse exercício.
2. **Correção que explica** — nas consultas, a app diz *porque* o resultado não está certo (falta o WHERE, linhas repetidas → DISTINCT, ordem errada → ORDER BY, colunas a mais ou por outra ordem, INNER vs LEFT JOIN…) e mostra o resultado esperado. INSERT/UPDATE/DELETE são verificados pelo **efeito nas tabelas** ("alterou 8 linhas, mas só devia ser 1 — falta o WHERE"), por isso qualquer forma correta é aceite.
3. **Formatos variados** — escolha múltipla, "qual é o resultado?" (prever o resultado de uma instrução), "corrija o erro" (instrução com um erro já escrita), ordenar cláusulas ou passos, escrever comandos, consultas, alterações de dados e criação de tabelas, e uma **visualização passo a passo** da execução de um SELECT (FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT).
4. **Revisão espaçada** — os exercícios em que o aluno precisou de várias tentativas, de dicas ou de ver a resposta voltam a aparecer na página **Revisão** ao fim de 1, 3, 7 e 14 dias; cada lição começa com um **aquecimento** opcional com um exercício de lições anteriores (prática intercalada).
5. **Manual do capítulo** — toda a matéria do capítulo num documento de consulta, sempre disponível (página própria, painel lateral durante as lições, imprimível/PDF).
6. **Miniteste final** — em cada tentativa são sorteadas 8 perguntas de um banco de 16 e 2 exercícios práticos (SQL escrito pelo aluno). Aprovação com 70% conclui o capítulo. As respostas certas só são mostradas depois de aprovar; antes disso, o aluno vê apenas quais as perguntas que errou.
7. **Ponte para o MySQL real** — cada capítulo tem tarefas para fazer num servidor MySQL instalado (com os erros reais a observar), os scripts `escola.sql` e `loja.sql` para descarregar, e um **projeto final** que o aluno entrega ao professor (script + resultados), com verificação automática dos requisitos.

## Conteúdo (7 capítulos · 34 lições · 279 passos · 167 exercícios · 130 perguntas e 21 exercícios práticos de miniteste)

1. Introdução ao MySQL
2. Criar bases de dados e tabelas (tipos de dados e restrições, **validação de dados com CHECK** — condições com AND/OR, BETWEEN e IN, regras entre colunas com nome e o caso do NULL —, multiplicidades e chaves estrangeiras sempre NOT NULL — relações 1:N, N:M, opcionais (0..1) e 1:1 com tabelas próprias, e a outra perspetiva, não adotada nas aulas, com chaves estrangeiras que aceitam NULL —, ON UPDATE CASCADE e ON DELETE RESTRICT, ALTER TABLE, **normalização: do enunciado às tabelas (1FN, 2FN, 3FN)** e um desafio final: modelar uma loja online)
3. Inserir, alterar e eliminar dados (INSERT, UPDATE, DELETE, TRUNCATE, manutenção de dados da BD loja e **transações**: START TRANSACTION, COMMIT, ROLLBACK, autocommit, uma encomenda em várias tabelas, falha a meio com anulação e concorrência — dois clientes e a última unidade, com um simulador de duas sessões)
4. Consultas com SELECT (SELECT, WHERE, ORDER BY/LIMIT/DISTINCT, agregações e GROUP BY/HAVING, JOIN, subconsultas, **funções de texto, números e datas**, **CASE e IFNULL/COALESCE**, **JOIN de três tabelas e UNION** e **perguntas de negócio** com enunciados abertos)
5. Índices e vistas (CREATE INDEX, EXPLAIN, CREATE VIEW)
6. Segurança: utilizadores, GRANT/REVOKE, roles
7. Backup e restauro (mysqldump, restauro, binlog, regra 3-2-1)

O motor do browser simula também as **transações** (START TRANSACTION/BEGIN, COMMIT, ROLLBACK, SAVEPOINT, autocommit, COMMIT implícito dos comandos DDL, SELECT … FOR UPDATE) e as restrições CHECK da BD loja (`stock >= 0`, `quantidade > 0`), com o erro 3819.

Duas bases de dados de exemplo correm no browser (AlaSQL): **escola** (pequena, para aprender) e **loja** (30 clientes, 18 produtos, 80 encomendas de 2024–2025, com datas e valores NULL), gerada sempre igual. O **Laboratório SQL** permite escolher a BD e executar várias instruções.

## Gamificação e registo de evolução

- XP por exercício (10–20 conforme o tipo; menos com várias tentativas ou dicas; zero se a solução foi consultada), +20 por lição **só se todos os exercícios forem resolvidos sem ver a resposta**, +100 por capítulo (miniteste aprovado) e +5 por cada revisão certa
- Níveis, dias seguidos (streak) e conquistas, incluindo conquistas de domínio (capítulo sem ver respostas, 10 revisões, prática no MySQL real, projeto entregue)
- Página **Progresso**: lições, exercícios e miniteste por capítulo, gráfico de 14 dias, histórico de tentativas, exportação CSV/JSON
- **Classificação** geral ou **desta semana** (XP dos últimos 7 dias), com filtro por **turma**

## Área do professor

- Tabela de alunos com filtro por turma e exportação CSV; detalhe de cada aluno com o histórico (incluindo o texto das respostas erradas), revisões, prática no MySQL real e o **projeto final** entregue.
- **Acesso reservado**: o site só abre a quem introduzir a **palavra-passe de acesso**, definida pelo gestor na Área do professor. A verificação é feita no Vercel (`public/middleware.js`, que recusa os ficheiros a quem não tem o cookie de acesso) e no Supabase (a palavra-passe fica guardada só como resumo SHA-256; criar conta exige o token de acesso). Com o servidor local (`npm start`) não há palavra-passe.
- **Reinício do progresso**: qualquer utilizador pode pedir, no Perfil, que o seu progresso seja reiniciado; o gestor aprova ou recusa na Área do professor (secção «Pedidos de reinício do progresso»). Ao aprovar, o progresso é apagado na conta e, na sincronização seguinte, em todos os dispositivos do utilizador.
- **Gestor do site**: atribui ou retira o perfil de professor (secção «Gestão de professores») e escolhe que **capítulos ficam visíveis para os alunos** (secção «Capítulos visíveis para os alunos»), para controlar o ritmo da turma.
- **Exercícios com mais dificuldade**: percentagem de alunos que acertaram à primeira, quantos viram a resposta e as **respostas erradas mais comuns** de cada exercício; perguntas dos minitestes mais erradas.

## Protocolo NEXUS (jogo 3D)

Jogo na primeira pessoa (só para computador), acessível no menu por baixo do Laboratório SQL. Na estação espacial Órion, tomada pela inteligência artificial NEXUS, o aluno usa SQL em terminais para abrir portas e desativar drones de segurança (sem violência: os drones são desligados com `UPDATE`).

- **Parte 1 (6 salas):** criogenia (`SELECT`), manutenção (`WHERE`), arquivo (`ORDER BY` / `LIMIT`), laboratório (`LIKE` + `UPDATE`), energia (`UPDATE` + `GROUP BY`) e hangar (`JOIN`).
- **Zonas e narrativa:** cada sala tem duas zonas separadas por um campo de forças, com um terminal em cada uma. O terminal da entrada só vê as tabelas da zona 1; a tarefa resolvida desliga o campo de forças e dá acesso ao segundo terminal, com outras tabelas. As tarefas mudam a sala: restauram a iluminação, desativam drones, desligam lasers e abrem a porta. A história avança com mensagens da VEGA (IA aliada), da NEXUS e de registos da tripulação guardados nas próprias tabelas.
- **Desafios diferentes em cada jogo:** os dados são gerados a partir de uma semente aleatória (códigos, técnicos, datas, drones, geradores, naves); o teste verifica 300 jogos gerados.
- **Ameaças:** drones que patrulham e perseguem o jogador quando o veem (as caixas tapam a vista), câmaras rotativas que alertam os drones, barreiras laser intermitentes e salas às escuras. **Pulsos EMP** (tecla Q) imobilizam drones e câmaras durante 8 segundos. **Cápsulas de tempo** em todas as salas: a verde dá +45 s ao relógio da sala; a roxa para o relógio durante 25 s.
- **Tempo e pontuação:** cada sala tem um tempo-limite (5 a 10 minutos). Nos últimos 30 s a NEXUS ativa o bloqueio total (drones e lasers mais rápidos) e, **se o tempo chegar a 0, a missão termina**. Pontos: 500 por tarefa, 5 por segundo que sobra, 300 por sala perfeita; descontam dicas (−100), capturas (−150), alarmes e câmaras (−200) e códigos errados (−50). Todas as missões começadas na sala 1 entram na tabela **Pontuações máximas** (na página do jogo, no menu de pausa e no ecrã final), com a melhor missão de cada jogador: primeiro o nível atingido (salas concluídas), depois os pontos e o tempo (Supabase: `game_scores`, `submit_game_score`, `game_leaderboard2`; servidor local: `/api/game/score` e `/api/game/leaderboard`).
- Cada sala dá também XP no curso (−5 por dica, 0 se vir a solução) e conquistas, e o progresso é sincronizado com a conta.
- Motor em Three.js (`public/game/`), com o mundo gerado em código; só é carregado quando o jogo é aberto. As salas estão em `public/game/levels.js` e são validadas por `test/game.test.js`.

## Quiz ao vivo (estilo Kahoot)

Área **Quiz ao vivo** no menu (e botão no Painel) para usar em aula:

- **Professor:** escolhe o capítulo (ou todos), o número de perguntas (5–20) e o tempo por pergunta (10–60 s) e cria o quiz. As perguntas são sorteadas do banco dos minitestes e as opções baralhadas. O ecrã para projetar mostra o código de 6 algarismos, o **QR code** e o link (`…/#/q/CÓDIGO`) e os nomes de quem entra; depois mostra cada pergunta com contagem decrescente e o número de respostas. Quando o tempo acaba (ou todos respondem) aparece o gráfico das respostas, a resposta certa com a explicação e a classificação; no fim, o pódio. Tem botão de ecrã inteiro.
- **Alunos:** entram no telemóvel ou no computador pelo link, pelo QR code ou com o código, só com um nome (não precisam de conta), e respondem em botões coloridos (▲ ◆ ● ■). Recebem logo se acertaram, os pontos e a posição.
- **Pontos:** resposta certa vale entre 500 e 1000 pontos — mais quanto mais rápida; errada ou sem resposta, 0. O tempo é medido no servidor.
- A resposta certa só é enviada aos alunos depois de revelada. Supabase: tabelas `live_sessions`, `live_players`, `live_answers` (sem acesso direto) e funções `live_create`/`live_control` (só professores), `live_join`, `live_answer` e `live_poll`. Servidor local: `/api/live/*`, em memória (criar o quiz pede a `TEACHER_KEY`).

## Publicar na Internet (gratuito)

Siga o guia **[PUBLICAR.md](PUBLICAR.md)**: o site fica no Vercel ou no Cloudflare Pages e as contas, o progresso e a classificação no Supabase (plano gratuito). Basta executar `supabase/schema.sql` no Supabase e preencher `public/config.js`. Quem já tinha executado a versão anterior do `schema.sql` deve executá-lo de novo: acrescenta as turmas e o XP semanal sem perder dados.

## Executar localmente

```bash
cd mysql-academy
npm start            # http://localhost:3000   (sem dependências, Node >= 18)
# opcional: PORT=8080 TEACHER_KEY=segredo DATA_DIR=/dados npm start
npm test             # valida todas as soluções, o motor SQL, a pontuação e o jogo
```

- Com `public/config.js` vazio, as contas e a classificação usam este servidor local (nome + PIN). Com o Supabase configurado, usam o Supabase (email + palavra-passe).
- Sem nenhum dos dois, a app funciona na mesma; o progresso fica guardado no dispositivo.
- **Área do professor** (`#/prof`): com o Supabase, contas com perfil de professor, atribuído pelo **gestor do site** na secção «Gestão de professores»; com o servidor local, a chave `TEACHER_KEY`.

## Estrutura

```
server.js          servidor local opcional: API (registo/login, sincronização, ranking) + ficheiros estáticos
supabase/schema.sql  tabelas, regras de segurança (RLS) e funções para o Supabase
public/config.js   endereço e chave pública do Supabase
public/backend.js  contas e sincronização (Supabase ou servidor local)
public/            a aplicação (HTML/CSS/JS puro, sem build)
  content.js       capítulos → lições → passos (learn/quiz/order/code/query/dml/ddl), resumo de sintaxe,
                   banco do miniteste, exercícios práticos e tarefas no MySQL real
  score.js         regras de XP, níveis, revisão espaçada e XP semanal (partilhado cliente/servidor)
  db.js            BD de exemplo "escola" e "loja", funções do MySQL em falta no motor, verificação
                   de consultas (com explicações), de INSERT/UPDATE/DELETE (pelo efeito) e de comandos
  game/levels.js   história e salas do Protocolo NEXUS (bases de dados, objetivos, regras das portas)
  game/game.js     motor 3D do jogo (Three.js)
  ddl.js           verificador de CREATE/ALTER/DROP TABLE (compara a estrutura obtida com a esperada; os CHECK são comparados pelo significado)
  app.js           interface e lógica (inclui o quiz ao vivo)
  vendor/qrcode.js gerador de QR codes (qrcode-generator, MIT), carregado só no ecrã do quiz ao vivo
  sw.js            service worker (offline)
```

## Notas

- O simulador usa AlaSQL: é uma aproximação do MySQL e não substitui um servidor real (por isso existem as tarefas de "Prática no MySQL real" e o projeto final). As lições de segurança e backup são validadas por padrões de texto (com tolerância a aspas e a `utilizador@anfitrião` sem plicas).
- Os IDs das lições e dos exercícios acrescentados nesta versão têm chaves próprias (ex.: `select.func.2`), por isso o progresso já guardado continua válido. As lições já começadas mantêm-se abertas mesmo quando surgem lições novas antes delas.
- A versão anterior está guardada no ramo `versao-1-0` do repositório.
- A pontuação é calculada no browser do aluno; as regras do Supabase impedem alterar o progresso de outros alunos e valores impossíveis, mas um aluno com conhecimentos técnicos poderia falsificar o seu próprio progresso.
