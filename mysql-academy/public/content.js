/* Conteúdo pedagógico. Tipos de exercício:
   quiz  – escolha múltipla     { q, opts, a, why }
   code  – escrever um comando  { q, ok:[regex sobre o texto normalizado], solution, hint }
   query – SELECT executado na BD "escola" e comparado com a solução { q, solution, ordered?, hint } */
(function (root) {
const CHAPTERS = [
{
  id: 'intro', icon: '🚀', color: '#6c8cff', title: 'Introdução ao MySQL',
  desc: 'Bases de dados, SGBD, SQL e os primeiros comandos.',
  lessons: [
  {
    title: 'O que é uma base de dados?',
    body: `<p>Uma <b>base de dados</b> é um conjunto organizado de informação guardada de forma estruturada. Uma <b>base de dados relacional</b> organiza a informação em <b>tabelas</b> (linhas e colunas) que se relacionam entre si.</p>
    <p>O <b>MySQL</b> é um <b>SGBD</b> (Sistema de Gestão de Bases de Dados) de código aberto, que funciona em modelo <b>cliente/servidor</b>: o servidor guarda os dados e os clientes (terminal, aplicações, MySQL Workbench) enviam-lhe pedidos escritos em <b>SQL</b> (<i>Structured Query Language</i>).</p>
    <ul><li><b>Tabela</b> – conjunto de dados sobre um assunto (ex.: alunos).</li><li><b>Linha / registo</b> – um elemento (ex.: um aluno).</li><li><b>Coluna / campo</b> – uma característica (ex.: nome).</li><li><b>Chave primária</b> – identifica cada linha de forma única.</li></ul>`,
    examples: [{ sql: 'SELECT * FROM alunos;', note: 'Mostra todas as linhas e colunas da tabela alunos.', run: true }],
    ex: [
      { t: 'quiz', q: 'Qual é a função de um SGBD como o MySQL?', opts: ['Desenhar páginas web', 'Armazenar, organizar e gerir bases de dados', 'Compilar programas', 'Proteger o computador contra vírus'], a: 1, why: 'O SGBD gere o armazenamento, acesso e segurança dos dados.' },
      { t: 'quiz', q: 'Numa tabela, o que representa uma linha (registo)?', opts: ['Uma característica comum a todos os dados', 'Um elemento concreto, por exemplo um aluno', 'O nome da base de dados', 'Uma cópia de segurança'], a: 1, why: 'As colunas são as características; cada linha é um elemento.' },
      { t: 'quiz', q: 'O que significa a sigla SQL?', opts: ['Simple Query Link', 'Structured Query Language', 'System Quality Logic', 'Secure Question List'], a: 1, why: 'SQL = Structured Query Language, a linguagem para comunicar com bases de dados relacionais.' },
    ],
  },
  {
    title: 'Ligar ao servidor e primeiros comandos',
    body: `<p>Para falar com o servidor usa-se um cliente. No terminal:</p>
    <pre><code>mysql -u root -p</code></pre>
    <p>O MySQL pede a palavra-passe e abre a linha de comandos <code>mysql&gt;</code>. Cada instrução SQL termina com <b>ponto e vírgula</b> (<code>;</code>).</p>
    <p>Os comandos SQL dividem-se em famílias:</p>
    <ul><li><b>DDL</b> (definição): <code>CREATE</code>, <code>ALTER</code>, <code>DROP</code></li><li><b>DML</b> (manipulação): <code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code></li><li><b>DQL</b> (consulta): <code>SELECT</code></li><li><b>DCL</b> (controlo de acesso): <code>GRANT</code>, <code>REVOKE</code></li><li><b>TCL</b> (transações): <code>COMMIT</code>, <code>ROLLBACK</code></li></ul>
    <p>Comandos úteis para explorar: <code>SHOW DATABASES;</code>, <code>SELECT VERSION();</code> e <code>EXIT;</code>.</p>`,
    examples: [
      { sql: 'SHOW DATABASES;', note: 'Lista as bases de dados existentes no servidor.' },
      { sql: 'SELECT VERSION();', note: 'Mostra a versão do MySQL em execução.' },
    ],
    ex: [
      { t: 'code', q: 'Escreva o comando para listar as bases de dados do servidor.', ok: ['^show (databases|schemas)$'], solution: 'SHOW DATABASES;', hint: 'Começa por SHOW...' },
      { t: 'quiz', q: 'A que família pertence o comando GRANT?', opts: ['DDL', 'DML', 'DCL', 'DQL'], a: 2, why: 'GRANT/REVOKE controlam permissões: DCL (Data Control Language).' },
      { t: 'quiz', q: 'Qual o comando de terminal para entrar como utilizador root, pedindo a palavra-passe?', opts: ['mysql --root', 'mysql -u root -p', 'mysql login root', 'start mysql root'], a: 1, why: '-u indica o utilizador e -p pede a palavra-passe.' },
    ],
  },
  {
    title: 'Tipos de dados',
    body: `<p>Cada coluna tem um <b>tipo de dados</b>, que define o que pode guardar. Escolher bem poupa espaço e evita erros.</p>
    <table><tr><th>Categoria</th><th>Tipos</th><th>Exemplo</th></tr>
    <tr><td>Inteiros</td><td><code>TINYINT, INT, BIGINT</code></td><td>idade INT</td></tr>
    <tr><td>Decimais</td><td><code>DECIMAL(10,2), FLOAT, DOUBLE</code></td><td>preco DECIMAL(8,2)</td></tr>
    <tr><td>Texto</td><td><code>CHAR(n), VARCHAR(n), TEXT</code></td><td>nome VARCHAR(80)</td></tr>
    <tr><td>Data/hora</td><td><code>DATE, DATETIME, TIMESTAMP, TIME</code></td><td>nascimento DATE</td></tr>
    <tr><td>Lógico</td><td><code>BOOLEAN</code> (= TINYINT(1))</td><td>ativo BOOLEAN</td></tr></table>
    <p>Para valores monetários use <code>DECIMAL</code>, nunca <code>FLOAT</code>, porque este último pode ter erros de arredondamento.</p>`,
    examples: [{ sql: "-- Formato de datas no MySQL: 'AAAA-MM-DD'\nSELECT CURDATE();", note: 'Devolve a data atual.' }],
    ex: [
      { t: 'quiz', q: 'Que tipo deve usar para guardar um preço como 19,99 €?', opts: ['FLOAT', 'DECIMAL(8,2)', 'VARCHAR(10)', 'DATE'], a: 1, why: 'DECIMAL guarda valores exatos, ideal para dinheiro.' },
      { t: 'quiz', q: 'Qual o formato por omissão de uma DATE no MySQL?', opts: ['DD/MM/AAAA', 'MM-DD-AAAA', 'AAAA-MM-DD', 'AAAAMMDD apenas'], a: 2, why: "Ex.: '2025-03-14'." },
      { t: 'quiz', q: 'Qual é o tipo mais adequado para o nome de uma pessoa?', opts: ['INT', 'VARCHAR(80)', 'DECIMAL', 'BOOLEAN'], a: 1, why: 'VARCHAR guarda texto de tamanho variável.' },
    ],
  }],
},
{
  id: 'ddl', icon: '🏗️', color: '#34d399', title: 'Criar bases de dados e tabelas',
  desc: 'CREATE, ALTER, DROP, chaves primárias e estrangeiras.',
  lessons: [
  {
    title: 'Criar e eliminar bases de dados',
    body: `<p>Uma base de dados é o "contentor" das tabelas.</p>
    <pre><code>CREATE DATABASE escola;
USE escola;           -- passa a trabalhar nesta BD
SHOW DATABASES;
DROP DATABASE escola; -- apaga TUDO, sem volta!</code></pre>
    <p>Para evitar erros pode usar <code>IF NOT EXISTS</code> / <code>IF EXISTS</code>. Recomenda-se definir o conjunto de caracteres: <code>CHARACTER SET utf8mb4</code>, que suporta acentos e emojis.</p>`,
    examples: [
      { sql: 'CREATE DATABASE IF NOT EXISTS escola\n  CHARACTER SET utf8mb4;', note: 'Só cria se ainda não existir.' },
      { sql: 'USE escola;', note: 'Seleciona a base de dados ativa.' },
    ],
    ex: [
      { t: 'code', q: 'Crie uma base de dados chamada loja.', ok: ['^create (database|schema) (if not exists )?loja( .*)?$'], solution: 'CREATE DATABASE loja;', hint: 'CREATE DATABASE nome;' },
      { t: 'code', q: 'Selecione a base de dados loja para trabalhar nela.', ok: ['^use loja$'], solution: 'USE loja;', hint: 'O comando tem apenas 3 letras.' },
      { t: 'quiz', q: 'O que faz DROP DATABASE escola?', opts: ['Esconde a base de dados', 'Elimina a base de dados e todo o seu conteúdo', 'Faz uma cópia', 'Renomeia a base de dados'], a: 1, why: 'DROP é irreversível. Faça backup antes!' },
    ],
  },
  {
    title: 'Criar tabelas',
    body: `<p>Com <code>CREATE TABLE</code> definimos o nome, as colunas, os tipos e as <b>restrições</b>:</p>
    <ul><li><code>PRIMARY KEY</code> – identificador único da linha</li><li><code>AUTO_INCREMENT</code> – o MySQL gera o número sozinho</li><li><code>NOT NULL</code> – o valor é obrigatório</li><li><code>UNIQUE</code> – não pode repetir</li><li><code>DEFAULT</code> – valor por omissão</li></ul>
    <pre><code>CREATE TABLE alunos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  email VARCHAR(100) UNIQUE,
  idade INT DEFAULT 18
);</code></pre>
    <p>Use <code>DESCRIBE alunos;</code> para ver a estrutura e <code>SHOW TABLES;</code> para listar as tabelas.</p>`,
    examples: [{ sql: 'CREATE TABLE produtos (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(60) NOT NULL,\n  preco DECIMAL(8,2) DEFAULT 0\n);', note: 'Tabela com chave primária automática.' }],
    ex: [
      { t: 'code', q: 'Crie a tabela clientes com id INT (chave primária) e nome VARCHAR(50). Escreva numa só linha.', ok: ['^create table clientes\\(id int primary key,nome varchar\\(50\\)\\)$', '^create table clientes\\(id int(\\(\\d+\\))? (not null )?(auto_increment )?primary key,nome varchar\\(50\\)( not null)?\\)$', '^create table clientes\\(id int,nome varchar\\(50\\),primary key\\(id\\)\\)$'], solution: 'CREATE TABLE clientes (id INT PRIMARY KEY, nome VARCHAR(50));', hint: 'CREATE TABLE clientes (id INT PRIMARY KEY, nome ...);' },
      { t: 'quiz', q: 'Que restrição impede que uma coluna fique vazia?', opts: ['UNIQUE', 'DEFAULT', 'NOT NULL', 'AUTO_INCREMENT'], a: 2, why: 'NOT NULL torna o valor obrigatório.' },
      { t: 'code', q: 'Escreva o comando que mostra a estrutura da tabela alunos.', ok: ['^(describe|desc|show columns from|explain) alunos$'], solution: 'DESCRIBE alunos;', hint: 'DESCRIBE ou DESC' },
    ],
  },
  {
    title: 'Chaves estrangeiras e alterar tabelas',
    body: `<p>Uma <b>chave estrangeira</b> (<code>FOREIGN KEY</code>) liga uma tabela a outra e garante a <b>integridade referencial</b>: não se pode inscrever um aluno num curso que não existe.</p>
    <pre><code>CREATE TABLE alunos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  curso_id INT,
  FOREIGN KEY (curso_id) REFERENCES cursos(id)
);</code></pre>
    <p>Para alterar uma tabela existente:</p>
    <pre><code>ALTER TABLE alunos ADD COLUMN cidade VARCHAR(50);
ALTER TABLE alunos MODIFY nome VARCHAR(120);
ALTER TABLE alunos DROP COLUMN cidade;
RENAME TABLE alunos TO estudantes;
DROP TABLE estudantes;</code></pre>`,
    examples: [{ sql: 'ALTER TABLE alunos ADD COLUMN email VARCHAR(100);', note: 'Acrescenta uma coluna à tabela existente.' }],
    ex: [
      { t: 'code', q: 'Acrescente à tabela alunos a coluna email do tipo VARCHAR(100).', ok: ['^alter table alunos add( column)? email varchar\\(100\\)$'], solution: 'ALTER TABLE alunos ADD COLUMN email VARCHAR(100);', hint: 'ALTER TABLE ... ADD COLUMN ...' },
      { t: 'quiz', q: 'Para que serve uma FOREIGN KEY?', opts: ['Tornar a tabela mais rápida', 'Ligar duas tabelas e garantir integridade referencial', 'Encriptar a coluna', 'Impedir valores NULL'], a: 1, why: 'Garante que o valor referenciado existe na outra tabela.' },
      { t: 'code', q: 'Elimine a tabela temporaria.', ok: ['^drop table (if exists )?temporaria$'], solution: 'DROP TABLE temporaria;', hint: 'DROP TABLE nome;' },
    ],
  }],
},
{
  id: 'dml', icon: '✏️', color: '#fbbf24', title: 'Inserir, alterar e eliminar dados',
  desc: 'INSERT, UPDATE, DELETE e transações.',
  lessons: [
  {
    title: 'INSERT – inserir dados',
    body: `<p>Adicionam-se linhas com <code>INSERT INTO</code>. Indique sempre as colunas — o código fica mais claro e resiste a alterações na tabela.</p>
    <pre><code>INSERT INTO alunos (nome, idade, cidade)
VALUES ('Rita Alves', 21, 'Faro');

-- Várias linhas de uma vez:
INSERT INTO alunos (nome, idade, cidade) VALUES
  ('Tiago Sá', 20, 'Lisboa'),
  ('Marta Reis', 23, 'Porto');</code></pre>
    <p>Texto e datas vão entre <b>plicas</b> <code>'...'</code>; números não. Colunas <code>AUTO_INCREMENT</code> podem ser omitidas.</p>`,
    examples: [{ sql: "INSERT INTO cursos (id, nome, horas)\nVALUES (4, 'Marketing', 700);", note: 'Insere um novo curso (experimente no Laboratório).' }],
    ex: [
      { t: 'code', q: "Insira na tabela cursos (colunas nome e horas) o curso 'Direito' com 1000 horas.", ok: ["^insert into cursos\\(nome,horas\\) ?values\\('direito',1000\\)$"], solution: "INSERT INTO cursos (nome, horas) VALUES ('Direito', 1000);", hint: "INSERT INTO cursos (nome, horas) VALUES ('...', ...);" },
      { t: 'quiz', q: 'Como se escreve um valor de texto num INSERT?', opts: ['Sem delimitadores', 'Entre plicas: \'texto\'', 'Entre parênteses retos', 'Com cardinal #texto'], a: 1, why: "Texto e datas usam plicas." },
      { t: 'quiz', q: 'Porque é boa prática indicar as colunas no INSERT?', opts: ['É obrigatório', 'O código fica claro e não se estraga se a tabela mudar', 'Torna o INSERT mais rápido 10x', 'Evita o uso de plicas'], a: 1, why: 'Sem lista de colunas, qualquer ALTER TABLE pode partir o INSERT.' },
    ],
  },
  {
    title: 'UPDATE – alterar dados',
    body: `<p><code>UPDATE</code> modifica linhas existentes. A cláusula <code>WHERE</code> escolhe <b>quais</b>.</p>
    <pre><code>UPDATE alunos SET cidade = 'Évora' WHERE id = 3;
UPDATE notas SET nota = nota + 1 WHERE disciplina = 'Programação';</code></pre>
    <p class="warn">⚠️ <b>Sem WHERE, todas as linhas são alteradas!</b> Antes de um UPDATE importante, teste o WHERE com um <code>SELECT</code>.</p>
    <p>O MySQL Workbench tem o modo <i>safe updates</i>, que recusa UPDATE/DELETE sem WHERE sobre chave.</p>`,
    examples: [{ sql: "UPDATE alunos\nSET cidade = 'Évora'\nWHERE id = 3;", note: 'Só altera a linha com id 3.' }],
    ex: [
      { t: 'code', q: "Altere a idade do aluno com id 5 para 22.", ok: ['^update alunos set idade=22 where id=5$'], solution: 'UPDATE alunos SET idade = 22 WHERE id = 5;', hint: 'UPDATE alunos SET ... WHERE ...' },
      { t: 'quiz', q: 'O que acontece num UPDATE sem WHERE?', opts: ['Dá erro sempre', 'Nada é alterado', 'Todas as linhas da tabela são alteradas', 'Só a primeira linha é alterada'], a: 2, why: 'Sem WHERE o UPDATE atinge a tabela inteira.' },
      { t: 'code', q: 'Aumente em 100 as horas de todos os cursos da tabela cursos.', ok: ['^update cursos set horas=horas\\+100$'], solution: 'UPDATE cursos SET horas = horas + 100;', hint: 'SET horas = horas + 100' },
    ],
  },
  {
    title: 'DELETE, TRUNCATE e transações',
    body: `<p><code>DELETE</code> remove linhas; tal como o UPDATE, use <b>WHERE</b>.</p>
    <pre><code>DELETE FROM alunos WHERE id = 10;
TRUNCATE TABLE logs;   -- esvazia a tabela (rápido, reinicia AUTO_INCREMENT)</code></pre>
    <p>Para poder voltar atrás, use uma <b>transação</b> (tabelas InnoDB):</p>
    <pre><code>START TRANSACTION;
DELETE FROM alunos WHERE cidade = 'Porto';
SELECT COUNT(*) FROM alunos;   -- verificar
ROLLBACK;   -- desfaz   (ou COMMIT; para confirmar)</code></pre>
    <p>Transações cumprem as propriedades <b>ACID</b>: Atomicidade, Consistência, Isolamento, Durabilidade.</p>`,
    examples: [{ sql: 'START TRANSACTION;\nDELETE FROM alunos WHERE idade > 24;\nROLLBACK;', note: 'Nada é realmente apagado: o ROLLBACK desfaz.' }],
    ex: [
      { t: 'code', q: "Elimine da tabela alunos o aluno com id 7.", ok: ['^delete from alunos where id=7$'], solution: 'DELETE FROM alunos WHERE id = 7;', hint: 'DELETE FROM ... WHERE ...' },
      { t: 'quiz', q: 'Qual o comando que desfaz as alterações de uma transação?', opts: ['COMMIT', 'ROLLBACK', 'UNDO', 'RESET'], a: 1, why: 'ROLLBACK anula; COMMIT confirma.' },
      { t: 'quiz', q: 'Qual a diferença principal entre DELETE e TRUNCATE?', opts: ['Não há diferença', 'TRUNCATE esvazia a tabela inteira de forma rápida; DELETE aceita WHERE', 'DELETE é DDL e TRUNCATE é DML', 'TRUNCATE elimina também a estrutura'], a: 1, why: 'TRUNCATE não aceita WHERE e mantém a estrutura da tabela.' },
    ],
  }],
},
{
  id: 'select', icon: '🔎', color: '#f472b6', title: 'Consultas com SELECT',
  desc: 'O coração do SQL: filtrar, ordenar, agrupar e juntar tabelas.',
  lessons: [
  {
    title: 'SELECT, WHERE e operadores',
    body: `<p>O <code>SELECT</code> lê dados. A forma geral:</p>
    <pre><code>SELECT colunas FROM tabela WHERE condição;</code></pre>
    <p>Operadores: <code>=  &lt;&gt;  &lt;  &gt;  &lt;=  &gt;=</code>, e lógicos <code>AND  OR  NOT</code>. Pode dar <b>alias</b> às colunas com <code>AS</code>.</p>
    <p>Nos exemplos e exercícios deste capítulo usa a base de dados <b>escola</b>, com as tabelas <code>alunos(id, nome, idade, cidade, curso_id)</code>, <code>cursos(id, nome, horas)</code> e <code>notas(aluno_id, disciplina, nota)</code>. Pode <b>executar</b> os exemplos!</p>`,
    examples: [
      { sql: 'SELECT nome, cidade FROM alunos;', note: 'Só duas colunas.', run: true },
      { sql: "SELECT * FROM alunos\nWHERE cidade = 'Lisboa' AND idade >= 20;", note: 'Alunos de Lisboa com 20 ou mais anos.', run: true },
      { sql: 'SELECT nome AS aluno, idade FROM alunos WHERE idade < 21;', note: 'AS dá um nome à coluna no resultado.', run: true },
    ],
    ex: [
      { t: 'query', q: 'Mostre o nome de todos os alunos.', solution: 'SELECT nome FROM alunos', hint: 'SELECT nome FROM alunos' },
      { t: 'query', q: 'Mostre todas as colunas dos alunos da cidade do Porto.', solution: "SELECT * FROM alunos WHERE cidade = 'Porto'", hint: "WHERE cidade = 'Porto'" },
      { t: 'query', q: 'Mostre o nome dos alunos com mais de 21 anos que não sejam de Braga.', solution: "SELECT nome FROM alunos WHERE idade > 21 AND cidade <> 'Braga'", hint: 'Combine duas condições com AND; "diferente" é <>.' },
    ],
  },
  {
    title: 'ORDER BY, LIMIT, DISTINCT e LIKE',
    body: `<ul><li><code>ORDER BY coluna [ASC|DESC]</code> – ordena o resultado</li><li><code>LIMIT n</code> – devolve só as primeiras n linhas</li><li><code>DISTINCT</code> – elimina repetidos</li><li><code>LIKE</code> – procura padrões: <code>%</code> = qualquer texto, <code>_</code> = um carácter</li><li><code>IN (...)</code> e <code>BETWEEN a AND b</code> – listas e intervalos</li><li><code>IS NULL</code> – testa valores em falta</li></ul>
    <pre><code>SELECT nome, idade FROM alunos
WHERE nome LIKE 'A%'
ORDER BY idade DESC
LIMIT 3;</code></pre>`,
    examples: [
      { sql: 'SELECT nome, idade FROM alunos ORDER BY idade DESC LIMIT 3;', note: 'Os 3 alunos mais velhos.', run: true },
      { sql: 'SELECT DISTINCT cidade FROM alunos;', note: 'Cada cidade aparece uma só vez.', run: true },
      { sql: "SELECT nome FROM alunos WHERE nome LIKE '%a';", note: 'Nomes terminados em "a".', run: true },
      { sql: 'SELECT nome FROM alunos WHERE idade BETWEEN 20 AND 22;', note: 'Idades de 20 a 22 (inclusivé).', run: true },
    ],
    ex: [
      { t: 'query', q: 'Liste o nome e a idade dos alunos, do mais novo para o mais velho.', ordered: false, solution: 'SELECT nome, idade FROM alunos ORDER BY idade ASC', hint: 'ORDER BY idade' },
      { t: 'query', q: 'Mostre as cidades diferentes onde vivem os alunos.', solution: 'SELECT DISTINCT cidade FROM alunos', hint: 'Use DISTINCT' },
      { t: 'query', q: "Mostre o nome dos alunos cujo nome começa por 'C'.", solution: "SELECT nome FROM alunos WHERE nome LIKE 'C%'", hint: "LIKE 'C%'" },
      { t: 'query', q: 'Mostre o nome dos 2 alunos mais velhos.', ordered: true, solution: 'SELECT nome FROM alunos ORDER BY idade DESC LIMIT 2', hint: 'ORDER BY idade DESC LIMIT 2' },
    ],
  },
  {
    title: 'Funções de agregação, GROUP BY e HAVING',
    body: `<p>As funções de <b>agregação</b> resumem várias linhas num valor: <code>COUNT()</code>, <code>SUM()</code>, <code>AVG()</code>, <code>MIN()</code>, <code>MAX()</code>.</p>
    <p><code>GROUP BY</code> forma grupos e calcula a agregação em cada um. <code>HAVING</code> filtra <b>grupos</b> (o <code>WHERE</code> filtra <b>linhas</b>, antes de agrupar).</p>
    <pre><code>SELECT cidade, COUNT(*) AS qtd
FROM alunos
GROUP BY cidade
HAVING COUNT(*) &gt;= 2;</code></pre>
    <p>Ordem de escrita: <code>SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT</code>.</p>`,
    examples: [
      { sql: 'SELECT COUNT(*) AS qtd, AVG(idade) AS media FROM alunos;', note: 'Número de alunos e idade média.', run: true },
      { sql: 'SELECT cidade, COUNT(*) AS qtd FROM alunos GROUP BY cidade;', note: 'Alunos por cidade.', run: true },
      { sql: 'SELECT disciplina, ROUND(AVG(nota),1) AS media\nFROM notas GROUP BY disciplina HAVING AVG(nota) > 13;', note: 'Só disciplinas com média acima de 13.', run: true },
    ],
    ex: [
      { t: 'query', q: 'Quantos alunos existem na tabela?', solution: 'SELECT COUNT(*) FROM alunos', hint: 'COUNT(*)' },
      { t: 'query', q: 'Mostre a cidade e o número de alunos de cada cidade.', solution: 'SELECT cidade, COUNT(*) FROM alunos GROUP BY cidade', hint: 'GROUP BY cidade' },
      { t: 'query', q: 'Mostre a nota máxima de cada disciplina (disciplina e valor).', solution: 'SELECT disciplina, MAX(nota) FROM notas GROUP BY disciplina', hint: 'MAX(nota) com GROUP BY disciplina' },
      { t: 'query', q: 'Mostre as cidades com 3 ou mais alunos.', solution: 'SELECT cidade FROM alunos GROUP BY cidade HAVING COUNT(*) >= 3', hint: 'HAVING COUNT(*) >= 3' },
    ],
  },
  {
    title: 'JOIN – juntar tabelas',
    body: `<p>Os dados estão repartidos por várias tabelas; o <code>JOIN</code> volta a juntá-los através das chaves.</p>
    <ul><li><code>INNER JOIN</code> – só linhas com correspondência nas duas tabelas</li><li><code>LEFT JOIN</code> – todas as da esquerda, mesmo sem correspondência (campos a NULL)</li><li><code>RIGHT JOIN</code> – o inverso</li></ul>
    <pre><code>SELECT a.nome, c.nome AS curso
FROM alunos a
INNER JOIN cursos c ON a.curso_id = c.id;</code></pre>
    <p>As letras <code>a</code> e <code>c</code> são <b>alias</b> das tabelas e evitam ambiguidades (ambas têm uma coluna <code>nome</code>).</p>`,
    examples: [
      { sql: 'SELECT a.nome, c.nome AS curso\nFROM alunos a\nINNER JOIN cursos c ON a.curso_id = c.id;', note: 'Cada aluno com o nome do seu curso.', run: true },
      { sql: 'SELECT a.nome, n.nota\nFROM alunos a\nLEFT JOIN notas n ON n.aluno_id = a.id\nWHERE n.nota IS NULL;', note: 'Alunos sem nenhuma nota (o João).', run: true },
    ],
    ex: [
      { t: 'query', q: 'Mostre o nome de cada aluno e a respetiva disciplina e nota (tabelas alunos e notas).', solution: 'SELECT a.nome, n.disciplina, n.nota FROM alunos a INNER JOIN notas n ON n.aluno_id = a.id', hint: 'JOIN notas n ON n.aluno_id = a.id' },
      { t: 'query', q: 'Mostre o nome dos alunos do curso de "Informática" (junte alunos e cursos).', solution: "SELECT a.nome FROM alunos a INNER JOIN cursos c ON a.curso_id = c.id WHERE c.nome = 'Informática'", hint: "WHERE c.nome = 'Informática'" },
      { t: 'query', q: 'Mostre o nome do curso e o número de alunos inscritos em cada um.', solution: 'SELECT c.nome, COUNT(*) FROM cursos c INNER JOIN alunos a ON a.curso_id = c.id GROUP BY c.nome', hint: 'JOIN + GROUP BY c.nome' },
    ],
  },
  {
    title: 'Subconsultas',
    body: `<p>Uma <b>subconsulta</b> é um SELECT dentro de outro SELECT. Útil quando o valor de comparação tem de ser calculado.</p>
    <pre><code>SELECT nome, idade FROM alunos
WHERE idade &gt; (SELECT AVG(idade) FROM alunos);

SELECT nome FROM alunos
WHERE id IN (SELECT aluno_id FROM notas WHERE nota &gt;= 17);</code></pre>
    <p>Muitas subconsultas podem também ser escritas com <code>JOIN</code>; escolha a forma mais legível.</p>`,
    examples: [{ sql: 'SELECT nome, idade FROM alunos\nWHERE idade > (SELECT AVG(idade) FROM alunos);', note: 'Alunos acima da idade média.', run: true }],
    ex: [
      { t: 'query', q: 'Mostre o nome dos alunos com idade superior à média.', solution: 'SELECT nome FROM alunos WHERE idade > (SELECT AVG(idade) FROM alunos)', hint: 'Use (SELECT AVG(idade) FROM alunos)' },
      { t: 'query', q: 'Mostre o nome dos alunos que têm alguma nota igual ou superior a 17 (use IN com subconsulta).', solution: 'SELECT nome FROM alunos WHERE id IN (SELECT aluno_id FROM notas WHERE nota >= 17)', hint: 'WHERE id IN (SELECT aluno_id FROM notas ...)' },
    ],
  }],
},
{
  id: 'sec', icon: '🔐', color: '#a78bfa', title: 'Segurança: utilizadores e permissões',
  desc: 'Contas, privilégios, roles (grupos) e boas práticas.',
  lessons: [
  {
    title: 'Criar e gerir utilizadores',
    body: `<p>Nunca use a conta <code>root</code> nas aplicações. Crie contas com o mínimo de poder necessário (<b>princípio do menor privilégio</b>).</p>
    <pre><code>CREATE USER 'maria'@'localhost' IDENTIFIED BY 'Pa$$w0rd!';
ALTER USER 'maria'@'localhost' IDENTIFIED BY 'NovaPass#1';
DROP USER 'maria'@'localhost';
SELECT user, host FROM mysql.user;</code></pre>
    <p>Um utilizador é definido por <b>nome + anfitrião</b>: <code>'maria'@'localhost'</code> só liga da própria máquina; <code>'maria'@'%'</code> liga de qualquer lado; <code>'maria'@'192.168.1.%'</code> só da rede indicada.</p>`,
    examples: [{ sql: "CREATE USER 'ana'@'localhost' IDENTIFIED BY 'Segura#2025';", note: 'Cria o utilizador ana, sem privilégios ainda.' }],
    ex: [
      { t: 'code', q: "Crie o utilizador 'joao' que liga a partir de localhost, com a palavra-passe 'abc123'.", ok: ["^create user (if not exists )?'joao'@'localhost' identified by 'abc123'$"], solution: "CREATE USER 'joao'@'localhost' IDENTIFIED BY 'abc123';", hint: "CREATE USER 'nome'@'host' IDENTIFIED BY '...';" },
      { t: 'quiz', q: "O que significa o utilizador 'maria'@'%'?", opts: ['Só liga da máquina local', 'Pode ligar a partir de qualquer anfitrião', 'Está desativado', 'Tem todos os privilégios'], a: 1, why: "% é o carácter universal para o anfitrião." },
      { t: 'quiz', q: 'O princípio do menor privilégio diz que…', opts: ['Todos devem ser administradores', 'Cada conta só deve ter as permissões estritamente necessárias', 'As palavras-passe devem ser curtas', 'Só o root pode usar a BD'], a: 1, why: 'Reduz o impacto de erros e ataques.' },
    ],
  },
  {
    title: 'GRANT e REVOKE',
    body: `<p>Depois de criar o utilizador, atribuem-se privilégios com <code>GRANT</code> e retiram-se com <code>REVOKE</code>. Os privilégios podem aplicar-se a toda a instalação (<code>*.*</code>), a uma BD (<code>escola.*</code>) ou a uma tabela (<code>escola.alunos</code>).</p>
    <pre><code>GRANT SELECT ON escola.* TO 'ana'@'localhost';
GRANT SELECT, INSERT, UPDATE ON escola.alunos TO 'ana'@'localhost';
REVOKE INSERT ON escola.alunos FROM 'ana'@'localhost';
SHOW GRANTS FOR 'ana'@'localhost';
FLUSH PRIVILEGES;</code></pre>
    <p>Privilégios comuns: <code>SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, ALL PRIVILEGES</code>. <code>WITH GRANT OPTION</code> permite ao utilizador passar os seus privilégios a outros — use com cuidado.</p>`,
    examples: [{ sql: "GRANT SELECT ON escola.* TO 'ana'@'localhost';", note: 'A ana passa a poder apenas consultar a BD escola.' }],
    ex: [
      { t: 'code', q: "Dê ao utilizador 'ana'@'localhost' permissão de SELECT em todas as tabelas da base de dados escola.", ok: ["^grant select on escola\\.\\* to 'ana'@'localhost'$"], solution: "GRANT SELECT ON escola.* TO 'ana'@'localhost';", hint: "GRANT ... ON escola.* TO ..." },
      { t: 'code', q: "Retire a 'ana'@'localhost' o privilégio DELETE na base de dados escola.", ok: ["^revoke delete on escola\\.\\* from 'ana'@'localhost'$"], solution: "REVOKE DELETE ON escola.* FROM 'ana'@'localhost';", hint: 'REVOKE usa FROM (não TO).' },
      { t: 'code', q: "Mostre os privilégios do utilizador 'ana'@'localhost'.", ok: ["^show grants for 'ana'@'localhost'$"], solution: "SHOW GRANTS FOR 'ana'@'localhost';", hint: 'SHOW GRANTS FOR ...' },
    ],
  },
  {
    title: 'Roles (grupos) e boas práticas',
    body: `<p>No MySQL 8, os "grupos de utilizadores" chamam-se <b>roles</b>: conjuntos de privilégios que se atribuem a vários utilizadores de uma vez.</p>
    <pre><code>CREATE ROLE 'leitor';
GRANT SELECT ON escola.* TO 'leitor';

CREATE USER 'rui'@'localhost' IDENTIFIED BY 'Xyz#123';
GRANT 'leitor' TO 'rui'@'localhost';
SET DEFAULT ROLE 'leitor' TO 'rui'@'localhost';</code></pre>
    <h4>Boas práticas</h4>
    <ul><li>Palavras-passe fortes e únicas; nunca guardá-las no código.</li><li>Não expor o MySQL à Internet (porta 3306); restringir o anfitrião.</li><li>Uma conta por aplicação, com privilégios mínimos.</li><li>Evitar <code>GRANT ALL</code> e <code>'%'</code> sem necessidade.</li><li>Rever periodicamente <code>SHOW GRANTS</code> e remover contas inativas.</li><li>Ligar com SSL/TLS; proteger contra <b>SQL Injection</b> usando <i>prepared statements</i>.</li></ul>`,
    examples: [{ sql: "CREATE ROLE 'editor';\nGRANT SELECT, INSERT, UPDATE ON escola.* TO 'editor';", note: 'Role com permissões de leitura e escrita.' }],
    ex: [
      { t: 'code', q: "Crie um role chamado 'leitor'.", ok: ["^create role (if not exists )?'leitor'$"], solution: "CREATE ROLE 'leitor';", hint: "CREATE ROLE 'nome';" },
      { t: 'code', q: "Atribua o role 'leitor' ao utilizador 'rui'@'localhost'.", ok: ["^grant 'leitor' to 'rui'@'localhost'$"], solution: "GRANT 'leitor' TO 'rui'@'localhost';", hint: "GRANT 'role' TO 'utilizador'" },
      { t: 'quiz', q: 'Como se protege uma aplicação contra SQL Injection?', opts: ['Usando prepared statements / consultas parametrizadas', 'Escondendo os nomes das tabelas', 'Usando sempre o utilizador root', 'Desligando o servidor à noite'], a: 0, why: 'Os parâmetros nunca são interpretados como código SQL.' },
    ],
  }],
},
{
  id: 'backup', icon: '💾', color: '#fb923c', title: 'Backup e restauro',
  desc: 'mysqldump, restauro, backups físicos e estratégias.',
  lessons: [
  {
    title: 'Backups lógicos com mysqldump',
    body: `<p>Um <b>backup</b> é uma cópia de segurança que permite recuperar dados após falhas, erros humanos ou ataques. O <code>mysqldump</code> gera um ficheiro <code>.sql</code> com os comandos necessários para recriar a BD (backup <b>lógico</b>). Executa-se no terminal (não dentro do <code>mysql&gt;</code>).</p>
    <pre><code># uma base de dados
mysqldump -u root -p escola &gt; escola.sql
# várias / todas
mysqldump -u root -p --databases escola loja &gt; duas.sql
mysqldump -u root -p --all-databases &gt; tudo.sql
# só uma tabela
mysqldump -u root -p escola alunos &gt; alunos.sql
# consistente, com rotinas e eventos
mysqldump -u root -p --single-transaction --routines --events escola &gt; escola.sql</code></pre>
    <p>Pode comprimir: <code>mysqldump ... | gzip &gt; escola.sql.gz</code>.</p>`,
    examples: [{ sql: 'mysqldump -u root -p escola > escola.sql', note: 'Terminal do sistema: exporta a BD escola para um ficheiro.' }],
    ex: [
      { t: 'code', q: 'Escreva o comando para exportar a base de dados escola para o ficheiro escola.sql com o utilizador root (pedindo palavra-passe).', ok: ['^mysqldump -u ?root -p ?escola>escola\\.sql$', '^mysqldump -p -u ?root escola>escola\\.sql$'], solution: 'mysqldump -u root -p escola > escola.sql', hint: 'mysqldump -u ... -p base > ficheiro' },
      { t: 'quiz', q: 'Onde se executa o mysqldump?', opts: ['Dentro do prompt mysql>', 'No terminal do sistema operativo', 'No Workbench apenas', 'Só no servidor remoto'], a: 1, why: 'É um programa à parte, não um comando SQL.' },
      { t: 'quiz', q: 'Para que serve a opção --single-transaction?', opts: ['Faz backup de uma só tabela', 'Obtém uma cópia consistente (InnoDB) sem bloquear as tabelas', 'Comprime o ficheiro', 'Apaga os dados antigos'], a: 1, why: 'Usa uma transação para uma imagem consistente sem lock.' },
    ],
  },
  {
    title: 'Restaurar uma base de dados',
    body: `<p>O restauro "reproduz" o ficheiro SQL no servidor. Se a BD não existir, crie-a primeiro (a não ser que o dump tenha sido feito com <code>--databases</code>).</p>
    <pre><code>mysql -u root -p -e "CREATE DATABASE escola"
mysql -u root -p escola &lt; escola.sql

# dentro do cliente mysql:
SOURCE /caminho/escola.sql;

# ficheiro comprimido
gunzip &lt; escola.sql.gz | mysql -u root -p escola</code></pre>
    <p class="warn">⚠️ Um backup só é bom se o restauro for <b>testado</b>. Experimente restaurar regularmente num servidor de teste.</p>`,
    examples: [{ sql: 'mysql -u root -p escola < escola.sql', note: 'Repõe os dados do ficheiro na BD escola.' }],
    ex: [
      { t: 'code', q: 'Escreva o comando de terminal que restaura o ficheiro escola.sql na base de dados escola (utilizador root, com palavra-passe).', ok: ['^mysql -u ?root -p ?escola<escola\\.sql$', '^mysql -p -u ?root escola<escola\\.sql$'], solution: 'mysql -u root -p escola < escola.sql', hint: 'Troque o sentido do redirecionamento: <' },
      { t: 'quiz', q: 'Dentro do cliente mysql, que comando executa um ficheiro .sql?', opts: ['RUN ficheiro.sql', 'SOURCE ficheiro.sql', 'IMPORT ficheiro.sql', 'LOAD ficheiro.sql'], a: 1, why: 'SOURCE (ou \\.) executa o script.' },
      { t: 'quiz', q: 'Porque se deve testar o restauro regularmente?', opts: ['Para gastar espaço', 'Para garantir que o backup é válido e utilizável', 'Porque o MySQL o exige', 'Para apagar backups antigos'], a: 1, why: 'Um backup que nunca foi restaurado é apenas uma esperança.' },
    ],
  },
  {
    title: 'Estratégias de backup',
    body: `<p>Além do <code>mysqldump</code>, existem outras abordagens:</p>
    <ul><li><b>Backup físico</b> (cópia dos ficheiros de dados): mais rápido em BDs grandes. Ferramentas: <i>MySQL Enterprise Backup</i>, <i>Percona XtraBackup</i>.</li><li><b>Binary log</b> (<code>binlog</code>): regista todas as alterações e permite <b>recuperação num ponto no tempo</b> (PITR) após restaurar um backup completo.</li><li><b>Exportar tabelas</b>: <code>SELECT ... INTO OUTFILE</code> e <code>LOAD DATA INFILE</code> para CSV.</li><li><b>Replicação</b>: uma réplica serve de cópia quase em tempo real (não substitui o backup!).</li></ul>
    <h4>Regra 3-2-1</h4>
    <p><b>3</b> cópias dos dados, em <b>2</b> tipos de suporte diferentes, com <b>1</b> cópia fora do local. Automatize com <code>cron</code> (Linux) ou Agendador de Tarefas (Windows) e proteja os ficheiros com permissões e encriptação.</p>`,
    examples: [{ sql: "SELECT * FROM alunos INTO OUTFILE '/var/lib/mysql-files/alunos.csv'\nFIELDS TERMINATED BY ',' ENCLOSED BY '\"';", note: 'Exporta uma tabela para CSV.' }],
    ex: [
      { t: 'quiz', q: 'O que é a regra 3-2-1?', opts: ['3 backups por dia, 2 por semana, 1 por mês', '3 cópias, em 2 tipos de suporte, 1 delas fora do local', '3 utilizadores, 2 roles e 1 admin', '3 servidores, 2 réplicas e 1 mestre'], a: 1, why: 'Reduz o risco de perder todas as cópias de uma vez.' },
      { t: 'quiz', q: 'Para que servem os binary logs?', opts: ['Aumentar a velocidade das consultas', 'Recuperar a BD até um ponto exato no tempo, após restaurar um backup', 'Guardar palavras-passe', 'Criar utilizadores'], a: 1, why: 'Permitem reaplicar as alterações feitas depois do último backup.' },
      { t: 'quiz', q: 'A replicação dispensa os backups?', opts: ['Sim, é a mesma coisa', 'Não: um erro (ex. DROP TABLE) também é replicado', 'Sim, se houver 2 réplicas', 'Só em MySQL 8'], a: 1, why: 'A réplica copia também os erros. Backups continuam necessários.' },
    ],
  }],
},
];

/* IDs estáveis: capítulo.lição.exercício */
CHAPTERS.forEach((c, ci) => {
  c.idx = ci;
  c.lessons.forEach((l, li) => {
    l.id = `${c.id}.${li + 1}`;
    l.chapter = c.id;
    l.ex.forEach((e, ei) => (e.id = `${l.id}.${ei + 1}`));
  });
});

const BADGES = [
  { id: 'first', icon: '🌱', name: 'Primeiros passos', desc: 'Resolveu o primeiro exercício', test: (s) => s.exDone >= 1 },
  { id: 'ten', icon: '🔟', name: 'Dez certos', desc: '10 exercícios resolvidos', test: (s) => s.exDone >= 10 },
  { id: 'thirty', icon: '🧠', name: 'Mente SQL', desc: '30 exercícios resolvidos', test: (s) => s.exDone >= 30 },
  { id: 'perfect', icon: '🎯', name: 'Pontaria', desc: '5 exercícios à primeira tentativa', test: (s) => s.firstTry >= 5 },
  { id: 'streak3', icon: '🔥', name: 'Em chamas', desc: '3 dias seguidos a estudar', test: (s) => s.streak >= 3 },
  { id: 'streak7', icon: '🌋', name: 'Imparável', desc: '7 dias seguidos a estudar', test: (s) => s.streak >= 7 },
  { id: 'select', icon: '🔎', name: 'Detetive SELECT', desc: 'Completou o capítulo de SELECT', test: (s) => s.chaptersDone.includes('select') },
  { id: 'sec', icon: '🛡️', name: 'Guardião', desc: 'Completou o capítulo de segurança', test: (s) => s.chaptersDone.includes('sec') },
  { id: 'all', icon: '🏆', name: 'Mestre MySQL', desc: 'Completou todos os capítulos', test: (s) => s.chaptersDone.length === CHAPTERS.length },
];

const api = { CHAPTERS, BADGES };
if (typeof module !== 'undefined') module.exports = api; else root.CONTENT = api;
})(typeof window !== 'undefined' ? window : globalThis);
