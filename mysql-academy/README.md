# MySQL Academy

Aplicação de **autoaprendizagem de MySQL** para desktop e telemóvel (PWA instalável, funciona offline), com lições, exemplos executáveis, exercícios interativos, registo de evolução e **ranking** entre alunos.

## Conteúdo (6 capítulos · 20 lições · 61 exercícios)

1. Introdução ao MySQL
2. Criar bases de dados e tabelas
3. Inserir, alterar e eliminar dados
4. Consultas com SELECT (WHERE, ORDER BY, GROUP BY/HAVING, JOIN, subconsultas) – com exercícios executados numa BD de exemplo no browser (AlaSQL)
5. Segurança: utilizadores, GRANT/REVOKE, roles
6. Backup e restauro (mysqldump, restauro, binlog, regra 3-2-1)

Cada lição tem explicação, exemplos (muitos executáveis) e exercícios: escolha múltipla, "escreva o comando" e consultas SELECT validadas pelo resultado. Há ainda um **Laboratório SQL** livre.

## Gamificação e registo de evolução

- XP por exercício (10/15/20 conforme o tipo; menos se precisar de várias tentativas ou dicas), bónus por lição (+20) e capítulo (+100)
- Níveis, dias seguidos (streak) e conquistas
- Página **Progresso**: percentagem por capítulo, gráfico de 14 dias, histórico completo de tentativas, exportação CSV/JSON
- **Ranking** com os outros alunos (requer o servidor); o XP é recalculado no servidor a partir dos exercícios resolvidos

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
  content.js       capítulos, lições, exemplos e exercícios (editar aqui para acrescentar matéria)
  score.js         regras de XP e níveis (partilhado cliente/servidor)
  db.js            BD de exemplo "escola" + validação de respostas
  app.js           interface e lógica
  sw.js            service worker (offline)
```

## Notas

- O simulador de SELECT usa AlaSQL: é uma aproximação do MySQL e não substitui um servidor real; as lições de DDL, segurança e backup são validadas por padrões de texto.
- As contas do ranking são simples (nome + PIN, guardado com scrypt). Não use palavras-passe reais; para uso em produção acrescente HTTPS e, se necessário, um fornecedor de identidade.
