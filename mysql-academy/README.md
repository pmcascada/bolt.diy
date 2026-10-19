# MySQL Academy

Aplicação de **autoaprendizagem de MySQL** para desktop e telemóvel (PWA instalável, funciona offline), com lições, exemplos executáveis, exercícios interativos, registo de evolução e **ranking** entre alunos.

## Como se aprende

1. **Passo a passo** — cada lição apresenta um conceito de cada vez (ex.: `SELECT`), seguido logo de um exercício sobre esse conceito. O passo seguinte (ex.: `WHERE`) só aparece depois de o aluno acertar. Após 2 tentativas falhadas pode consultar a solução para avançar, sem pontuação.
2. **Lições sequenciais** — dentro de cada capítulo, cada lição desbloqueia a seguinte. Os capítulos podem ser abordados por qualquer ordem.
3. **Manual do capítulo** — toda a matéria do capítulo num documento de consulta, com resumo de sintaxe, sempre disponível (página própria, painel lateral durante as lições, imprimível/PDF).
4. **Miniteste final** — escolha múltipla (8 perguntas, ordem aleatória), desbloqueado após as lições; aprovação com 70% conclui o capítulo. Correção detalhada no fim; conta o melhor resultado.

## Conteúdo (6 capítulos · 20 lições · 146 passos · 77 exercícios · 48 perguntas de miniteste)

1. Introdução ao MySQL
2. Criar bases de dados e tabelas
3. Inserir, alterar e eliminar dados
4. Consultas com SELECT (SELECT, WHERE, ORDER BY/LIMIT/DISTINCT, agregações e GROUP BY/HAVING, JOIN, subconsultas) – consultas executadas numa BD de exemplo no browser (AlaSQL)
5. Segurança: utilizadores, GRANT/REVOKE, roles
6. Backup e restauro (mysqldump, restauro, binlog, regra 3-2-1)

Exercícios: escolha múltipla, "escreva o comando" e consultas SELECT validadas pelo resultado. Há ainda um **Laboratório SQL** livre.

## Gamificação e registo de evolução

- XP por exercício (10/15/20 conforme o tipo; menos com várias tentativas ou dicas; zero se a solução foi consultada), +20 por lição e +100 por capítulo (miniteste aprovado)
- Níveis, dias seguidos (streak) e conquistas
- Página **Progresso**: lições, exercícios e resultado do miniteste por capítulo, gráfico de 14 dias, histórico completo de tentativas e minitestes, exportação CSV/JSON
- **Classificação** entre alunos (requer o servidor); o XP é recalculado no servidor a partir do progresso

## Executar

```bash
cd mysql-academy
npm start            # http://localhost:3000   (sem dependências, Node >= 18)
# opcional: PORT=8080 TEACHER_KEY=segredo DATA_DIR=/dados npm start
npm test             # valida todas as soluções dos exercícios
```

- Sem servidor também funciona (abrindo `public/` num servidor estático): o progresso fica guardado no dispositivo; só o ranking fica indisponível.
- **Instalar**: no Chrome/Edge (desktop) ou no telemóvel, use "Instalar aplicação" / "Adicionar ao ecrã principal". Para acesso fora de `localhost` a PWA exige HTTPS (use um proxy como Caddy/nginx).
- **Professor**: com `TEACHER_KEY` definido, `GET /api/admin/students` com o cabeçalho `x-teacher-key` devolve o progresso detalhado por aluno (capítulos e histórico).

## Estrutura

```
server.js          API (registo/login, sincronização, ranking) + ficheiros estáticos; dados em data/students.json
public/            a aplicação (HTML/CSS/JS puro, sem build)
  content.js       capítulos → lições → passos (learn/quiz/code/query), resumo de sintaxe e miniteste
  score.js         regras de XP e níveis (partilhado cliente/servidor)
  db.js            BD de exemplo "escola" + validação de respostas
  app.js           interface e lógica
  sw.js            service worker (offline)
```

## Notas

- O simulador de SELECT usa AlaSQL: é uma aproximação do MySQL e não substitui um servidor real; as lições de DDL, segurança e backup são validadas por padrões de texto.
- As contas do ranking são simples (nome + PIN, guardado com scrypt). Não use palavras-passe reais; para uso em produção acrescente HTTPS e, se necessário, um fornecedor de identidade.
