# MySQL Academy

Aplicação de **autoaprendizagem de MySQL** para desktop e telemóvel (PWA instalável, funciona offline), com lições, exemplos executáveis, exercícios interativos, registo de evolução e **ranking** entre alunos.

## Como se aprende

1. **Passo a passo** — cada lição apresenta um conceito de cada vez (ex.: `SELECT`), seguido logo de um exercício sobre esse conceito. O passo seguinte (ex.: `WHERE`) só aparece depois de o aluno acertar. Se ficar bloqueado, pode ver a resposta certa a qualquer momento ("Ver resposta certa") e continuar a lição, perdendo o XP desse exercício.
2. **Lições sequenciais** — dentro de cada capítulo, cada lição desbloqueia a seguinte. Os capítulos podem ser abordados por qualquer ordem.
3. **Manual do capítulo** — toda a matéria do capítulo num documento de consulta, com resumo de sintaxe, sempre disponível (página própria, painel lateral durante as lições, imprimível/PDF).
4. **Miniteste final** — escolha múltipla (8 perguntas, ordem aleatória), desbloqueado após as lições; aprovação com 70% conclui o capítulo. Correção detalhada no fim; conta o melhor resultado.

## Conteúdo (7 capítulos · 27 lições · 188 passos · 104 exercícios · 58 perguntas de miniteste)

1. Introdução ao MySQL
2. Criar bases de dados e tabelas (tipos e restrições, chaves estrangeiras e relações 1:N com ON DELETE, relações N:M com chave composta, ALTER TABLE e um desafio final: modelar uma loja online)
3. Inserir, alterar e eliminar dados (INSERT, UPDATE, DELETE, TRUNCATE)
4. Consultas com SELECT (SELECT, WHERE, ORDER BY/LIMIT/DISTINCT, agregações e GROUP BY/HAVING, JOIN, subconsultas) – consultas executadas numa BD de exemplo no browser (AlaSQL)
5. Restrições, índices e vistas (CHECK, CREATE INDEX, CREATE VIEW)
6. Segurança: utilizadores, GRANT/REVOKE, roles
7. Backup e restauro (mysqldump, restauro, binlog, regra 3-2-1)

Exercícios: escolha múltipla, "escreva o comando", consultas SELECT validadas pelo resultado e criação/alteração de tabelas validadas pela estrutura obtida (colunas, tipos, chaves, restrições e ON DELETE), com mensagens sobre o que falta. Há ainda um **Laboratório SQL** livre.

## Gamificação e registo de evolução

- XP por exercício (10/15/20 conforme o tipo; menos com várias tentativas ou dicas; zero se a solução foi consultada), +20 por lição e +100 por capítulo (miniteste aprovado)
- Níveis, dias seguidos (streak) e conquistas
- Página **Progresso**: lições, exercícios e resultado do miniteste por capítulo, gráfico de 14 dias, histórico completo de tentativas e minitestes, exportação CSV/JSON
- **Classificação** entre alunos (requer o servidor); o XP é recalculado no servidor a partir do progresso

## Protocolo NEXUS (jogo 3D)

Jogo na primeira pessoa (só para computador), acessível no menu por baixo do Laboratório SQL. Na estação espacial Órion, tomada pela inteligência artificial NEXUS, o aluno usa SQL em terminais para abrir portas e desativar drones de segurança (sem violência: os drones são desligados com `UPDATE`).

- **Parte 1 (4 salas):** criogenia (`SELECT *`), manutenção (`WHERE`), arquivo (`ORDER BY` / `LIMIT`) e laboratório (`LIKE` + `UPDATE` para desativar o drone; um `UPDATE` sem `WHERE` dispara o alarme).
- **Pulsos EMP:** cápsulas espalhadas pelas salas; a tecla Q imobiliza os drones durante 8 segundos.
- Cada sala dá XP (−5 por dica, 0 se vir a solução) e conquistas, e o progresso é sincronizado com a conta.
- Motor em Three.js (`public/game/`), com o mundo gerado em código; só é carregado quando o jogo é aberto. As salas estão em `public/game/levels.js` e são validadas por `test/game.test.js`.

## Publicar na Internet (gratuito)

Siga o guia **[PUBLICAR.md](PUBLICAR.md)**: o site fica no Cloudflare Pages e as contas, o progresso e a classificação no Supabase (plano gratuito). Basta executar `supabase/schema.sql` no Supabase e preencher `public/config.js`.

## Executar localmente

```bash
cd mysql-academy
npm start            # http://localhost:3000   (sem dependências, Node >= 18)
# opcional: PORT=8080 TEACHER_KEY=segredo DATA_DIR=/dados npm start
npm test             # valida todas as soluções dos exercícios
```

- Com `public/config.js` vazio, as contas e a classificação usam este servidor local (nome + PIN). Com o Supabase configurado, usam o Supabase (email + palavra-passe).
- Sem nenhum dos dois, a app funciona na mesma; o progresso fica guardado no dispositivo.
- **Área do professor** (`#/prof`): com o Supabase, contas marcadas como professor; com o servidor local, a chave `TEACHER_KEY`.

## Estrutura

```
server.js          servidor local opcional: API (registo/login, sincronização, ranking) + ficheiros estáticos
supabase/schema.sql  tabelas, regras de segurança (RLS) e funções para o Supabase
public/config.js   endereço e chave pública do Supabase
public/backend.js  contas e sincronização (Supabase ou servidor local)
public/            a aplicação (HTML/CSS/JS puro, sem build)
  content.js       capítulos → lições → passos (learn/quiz/code/query), resumo de sintaxe e miniteste
  score.js         regras de XP e níveis (partilhado cliente/servidor)
  db.js            BD de exemplo "escola" + validação de respostas
  game/levels.js   história e salas do Protocolo NEXUS (bases de dados, objetivos, regras das portas)
  game/game.js     motor 3D do jogo (Three.js)
  ddl.js           verificador de CREATE/ALTER/DROP TABLE (compara a estrutura obtida com a esperada)
  app.js           interface e lógica
  sw.js            service worker (offline)
```

## Notas

- O simulador de SELECT usa AlaSQL: é uma aproximação do MySQL e não substitui um servidor real; as lições de DDL, segurança e backup são validadas por padrões de texto.
- A pontuação é calculada no browser do aluno; as regras do Supabase impedem alterar o progresso de outros alunos e valores impossíveis, mas um aluno com conhecimentos técnicos poderia falsificar o seu próprio progresso.
