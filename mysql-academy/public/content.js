/* Conteúdo pedagógico — aprendizagem gradual.
   Cada lição é uma sequência de passos: explicação (learn) seguida de um exercício sobre esse conceito.
   O passo seguinte só é mostrado depois de o aluno resolver o exercício.
   Tipos de exercício:
     quiz  – escolha múltipla     { q, opts, a, why }
     code  – escrever um comando  { q, ok:[regex sobre o texto normalizado], solution, hint }
     query – SELECT executado na BD "escola" e comparado com a solução { q, solution, hint, ordered? }
   Cada capítulo tem ainda: cheat (resumo de sintaxe para o manual) e test (miniteste final). */
(function (root) {
const learn = (title, html, examples = []) => ({ t: 'learn', title, html, examples });
const quiz = (q, opts, a, why) => ({ t: 'quiz', q, opts, a, why });
const code = (q, ok, solution, hint) => ({ t: 'code', q, ok, solution, hint });
const query = (q, solution, hint, ordered) => ({ t: 'query', q, solution, hint, ordered: !!ordered });
const ex = (sql, note, run) => ({ sql, note, run: !!run });

const CHAPTERS = [
/* =============================== 1 =============================== */
{
  id: 'intro', icon: 'compass', title: 'Introdução ao MySQL',
  desc: 'Bases de dados, SGBD, SQL e os primeiros comandos.',
  lessons: [
  { title: 'Bases de dados e SGBD', steps: [
    learn('O que é uma base de dados', `<p>Uma <b>base de dados</b> é um conjunto organizado de informação, guardado de forma estruturada para poder ser consultado e atualizado com facilidade.</p>
      <p>Nas <b>bases de dados relacionais</b> — como o MySQL — a informação é organizada em <b>tabelas</b>, e as tabelas relacionam-se entre si através de valores em comum.</p>`),
    quiz('Numa base de dados relacional, a informação é organizada em…', ['Ficheiros de texto soltos', 'Tabelas que se relacionam entre si', 'Pastas e subpastas', 'Folhas de cálculo independentes'], 1, 'O modelo relacional organiza os dados em tabelas relacionadas.'),
    learn('Tabelas, linhas e colunas', `<p>Uma tabela é formada por:</p>
      <ul><li><b>Colunas</b> (ou campos) — as características guardadas, por exemplo <code>nome</code> ou <code>idade</code>;</li>
      <li><b>Linhas</b> (ou registos) — cada elemento concreto, por exemplo um aluno;</li>
      <li><b>Chave primária</b> — a coluna que identifica cada linha de forma única, por exemplo <code>id</code>.</li></ul>
      <p>Execute o exemplo para ver a tabela <code>alunos</code> da base de dados de exemplo <b>escola</b>:</p>`,
      [ex('SELECT * FROM alunos;', 'Cada linha é um aluno; cada coluna, uma característica.', true)]),
    quiz('Na tabela alunos, o que representa uma linha?', ['Uma característica comum a todos os alunos', 'Um aluno concreto', 'O nome da base de dados', 'O tipo de dados de uma coluna'], 1, 'Cada linha (registo) corresponde a um elemento — neste caso, um aluno.'),
    quiz('Para que serve a chave primária?', ['Encriptar a tabela', 'Identificar cada linha de forma única', 'Ordenar os resultados', 'Guardar a palavra-passe'], 1, 'Não podem existir duas linhas com o mesmo valor de chave primária.'),
    learn('MySQL, SGBD e SQL', `<p>O <b>MySQL</b> é um <b>SGBD</b> — Sistema de Gestão de Bases de Dados — de código aberto. O SGBD trata do armazenamento, da segurança, do acesso concorrente e da recuperação dos dados.</p>
      <p>Funciona em modelo <b>cliente/servidor</b>: o <b>servidor</b> guarda os dados; os <b>clientes</b> (terminal <code>mysql</code>, MySQL Workbench, aplicações) enviam pedidos escritos em <b>SQL</b> — <i>Structured Query Language</i> — e recebem as respostas.</p>`),
    quiz('O que significa SQL?', ['Simple Query Link', 'Structured Query Language', 'System Quality Logic', 'Secure Question List'], 1, 'SQL é a linguagem usada para comunicar com bases de dados relacionais.'),
    quiz('No modelo cliente/servidor do MySQL, quem guarda os dados?', ['O cliente', 'O servidor', 'O browser', 'O sistema de ficheiros do aluno'], 1, 'O servidor guarda e gere os dados; os clientes apenas enviam pedidos.'),
  ] },
  { title: 'Ligar ao servidor e primeiros comandos', steps: [
    learn('Ligar ao servidor', `<p>No terminal do sistema operativo, liga-se ao servidor com o cliente <code>mysql</code>:</p>
      <pre><code>mysql -u root -p</code></pre>
      <p><code>-u</code> indica o utilizador e <code>-p</code> pede a palavra-passe. Depois de autenticado aparece a linha de comandos <code>mysql&gt;</code>, onde se escrevem as instruções SQL. Para sair escreve-se <code>EXIT;</code>.</p>`),
    quiz('Qual o comando para entrar como utilizador root, pedindo a palavra-passe?', ['mysql --root', 'mysql -u root -p', 'mysql login root', 'start mysql root'], 1, '-u indica o utilizador e -p pede a palavra-passe.'),
    learn('Instruções e ponto e vírgula', `<p>Cada instrução SQL termina com <b>ponto e vírgula</b> (<code>;</code>). As palavras-chave podem ser escritas em maiúsculas ou minúsculas, mas por convenção usam-se maiúsculas.</p>
      <p>Dois comandos úteis para explorar o servidor:</p>`,
      [ex('SHOW DATABASES;', 'Lista as bases de dados existentes no servidor.'), ex('SELECT VERSION();', 'Mostra a versão do MySQL.')]),
    code('Escreva o comando que lista as bases de dados do servidor.', ['^show (databases|schemas)$'], 'SHOW DATABASES;', 'Começa por SHOW…'),
    learn('Famílias de comandos SQL', `<p>Os comandos SQL agrupam-se em famílias, de acordo com a sua função:</p>
      <table><tr><th>Família</th><th>Função</th><th>Comandos</th></tr>
      <tr><td>DDL</td><td>Definir estruturas</td><td><code>CREATE</code>, <code>ALTER</code>, <code>DROP</code></td></tr>
      <tr><td>DML</td><td>Manipular dados</td><td><code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code></td></tr>
      <tr><td>DQL</td><td>Consultar dados</td><td><code>SELECT</code></td></tr>
      <tr><td>DCL</td><td>Controlar acessos</td><td><code>GRANT</code>, <code>REVOKE</code></td></tr>
      <tr><td>TCL</td><td>Controlar transações</td><td><code>COMMIT</code>, <code>ROLLBACK</code></td></tr></table>`),
    quiz('A que família pertence o comando CREATE TABLE?', ['DDL', 'DML', 'DCL', 'TCL'], 0, 'CREATE define estruturas: é DDL (Data Definition Language).'),
    quiz('E o comando GRANT?', ['DDL', 'DML', 'DCL', 'DQL'], 2, 'GRANT e REVOKE controlam permissões: DCL (Data Control Language).'),
  ] },
  { title: 'Tipos de dados', steps: [
    learn('Tipos numéricos', `<p>Cada coluna tem um <b>tipo de dados</b> que define o que pode guardar.</p>
      <ul><li><b>Inteiros</b>: <code>TINYINT</code>, <code>INT</code>, <code>BIGINT</code> — idades, quantidades, identificadores.</li>
      <li><b>Decimais exatos</b>: <code>DECIMAL(p,d)</code> — por exemplo <code>DECIMAL(8,2)</code> guarda até 999999,99. Ideal para dinheiro.</li>
      <li><b>Vírgula flutuante</b>: <code>FLOAT</code>, <code>DOUBLE</code> — valores científicos; podem ter pequenos erros de arredondamento.</li></ul>`),
    quiz('Que tipo deve usar para guardar um preço como 19,99 €?', ['FLOAT', 'DECIMAL(8,2)', 'VARCHAR(10)', 'DATE'], 1, 'DECIMAL guarda valores exatos, ideal para valores monetários.'),
    learn('Tipos de texto', `<ul><li><code>CHAR(n)</code> — texto de tamanho <b>fixo</b> (ex.: códigos postais, siglas).</li>
      <li><code>VARCHAR(n)</code> — texto de tamanho <b>variável</b> até n caracteres (ex.: nomes, emails).</li>
      <li><code>TEXT</code> — textos longos (ex.: descrições, comentários).</li></ul>
      <p>Os valores de texto escrevem-se entre <b>plicas</b>: <code>'Lisboa'</code>.</p>`),
    quiz('Qual é o tipo mais adequado para o nome de uma pessoa?', ['INT', 'VARCHAR(80)', 'DECIMAL(5,2)', 'BOOLEAN'], 1, 'VARCHAR guarda texto de tamanho variável.'),
    learn('Datas e valores lógicos', `<ul><li><code>DATE</code> — data no formato <code>'AAAA-MM-DD'</code>, por exemplo <code>'2025-03-14'</code>.</li>
      <li><code>DATETIME</code> / <code>TIMESTAMP</code> — data e hora.</li><li><code>TIME</code> — apenas a hora.</li>
      <li><code>BOOLEAN</code> — verdadeiro/falso (internamente <code>TINYINT(1)</code>).</li></ul>`,
      [ex('SELECT CURDATE();', 'Devolve a data atual no formato AAAA-MM-DD.')]),
    quiz("Qual o formato de uma DATE no MySQL?", ['DD/MM/AAAA', 'MM-DD-AAAA', 'AAAA-MM-DD', 'DD.MM.AA'], 2, "Ex.: '2025-03-14'."),
  ] }],
  cheat: [
    ['mysql -u root -p', 'Ligar ao servidor (terminal)'], ['SHOW DATABASES;', 'Listar bases de dados'], ['SELECT VERSION();', 'Versão do servidor'], ['EXIT;', 'Sair do cliente'],
    ['INT, DECIMAL(p,d)', 'Números inteiros / decimais exatos'], ['VARCHAR(n), CHAR(n), TEXT', 'Texto variável / fixo / longo'], ["DATE 'AAAA-MM-DD'", 'Datas'],
  ],
  test: [
    quiz('O que é um SGBD?', ['Uma linguagem de programação', 'Um sistema que gere o armazenamento e acesso a bases de dados', 'Um tipo de tabela', 'Um comando SQL'], 1, 'Sistema de Gestão de Bases de Dados.'),
    quiz('Numa tabela, as colunas representam…', ['Os elementos concretos', 'As características guardadas de cada elemento', 'As bases de dados', 'Os utilizadores'], 1, 'Cada coluna é um campo/característica.'),
    quiz('Que opção do cliente mysql pede a palavra-passe?', ['-u', '-h', '-p', '-d'], 2, '-p (password).'),
    quiz('Como termina uma instrução SQL no cliente mysql?', ['Com ponto final', 'Com ponto e vírgula', 'Com dois pontos', 'Com Enter apenas'], 1, 'O ; indica o fim da instrução.'),
    quiz('INSERT, UPDATE e DELETE pertencem a que família?', ['DDL', 'DML', 'DCL', 'TCL'], 1, 'São comandos de manipulação de dados.'),
    quiz('Qual o tipo indicado para valores monetários?', ['FLOAT', 'DOUBLE', 'DECIMAL', 'TEXT'], 2, 'DECIMAL é exato.'),
    quiz('Qual a diferença entre CHAR e VARCHAR?', ['Nenhuma', 'CHAR tem tamanho fixo; VARCHAR é variável', 'VARCHAR só guarda números', 'CHAR só guarda uma letra'], 1, 'CHAR(n) ocupa sempre n caracteres.'),
    quiz('Qual destas datas está no formato correto do MySQL?', ["'14/03/2025'", "'2025-03-14'", "'03-14-2025'", "'14.03.25'"], 1, 'AAAA-MM-DD.'),
  ],
},
/* =============================== 2 =============================== */
{
  id: 'ddl', icon: 'table', title: 'Criar bases de dados e tabelas',
  desc: 'CREATE, ALTER, DROP, chaves primárias e estrangeiras.',
  lessons: [
  { title: 'Criar e gerir bases de dados', steps: [
    learn('CREATE DATABASE', `<p>Uma base de dados é o "contentor" onde ficam as tabelas. Cria-se com:</p>
      <pre><code>CREATE DATABASE escola;</code></pre>
      <p>Se a base de dados já existir, o MySQL devolve um erro. Para o evitar usa-se <code>IF NOT EXISTS</code>. É também recomendável indicar o conjunto de caracteres <code>utf8mb4</code>, que suporta acentos e todos os símbolos:</p>`,
      [ex('CREATE DATABASE IF NOT EXISTS escola\n  CHARACTER SET utf8mb4;', 'Só cria se ainda não existir.')]),
    code('Crie uma base de dados chamada loja.', ['^create (database|schema) (if not exists )?loja( .*)?$'], 'CREATE DATABASE loja;', 'CREATE DATABASE nome;'),
    learn('USE — escolher a base de dados ativa', `<p>Um servidor tem várias bases de dados. Antes de trabalhar com tabelas é preciso indicar qual a base de dados <b>ativa</b>:</p>
      <pre><code>USE escola;</code></pre><p>A partir daí, todos os comandos referem-se às tabelas de <code>escola</code>. Com <code>SHOW TABLES;</code> listam-se as tabelas da base de dados ativa.</p>`),
    code('Selecione a base de dados loja para trabalhar nela.', ['^use loja$'], 'USE loja;', 'O comando tem apenas 3 letras.'),
    learn('DROP DATABASE', `<p>Para eliminar uma base de dados <b>e todo o seu conteúdo</b>:</p><pre><code>DROP DATABASE IF EXISTS loja;</code></pre>
      <p class="warn"><b>Atenção:</b> o DROP é irreversível. Faça sempre uma cópia de segurança antes.</p>`),
    quiz('O que faz DROP DATABASE escola?', ['Esconde a base de dados', 'Elimina a base de dados e todo o seu conteúdo', 'Faz uma cópia', 'Renomeia a base de dados'], 1, 'DROP é irreversível.'),
  ] },
  { title: 'Criar tabelas', steps: [
    learn('CREATE TABLE', `<p>Uma tabela define-se com o seu nome e a lista de colunas, cada uma com o respetivo tipo:</p>
      <pre><code>CREATE TABLE cursos (
  id INT,
  nome VARCHAR(50),
  horas INT
);</code></pre><p>As colunas são separadas por vírgulas e a lista fica entre parênteses.</p>`),
    code('Crie a tabela clientes com as colunas id (INT) e nome (VARCHAR(50)). Escreva numa só linha.', ['^create table clientes\\(id int(\\(\\d+\\))?,nome varchar\\(50\\)\\)$'], 'CREATE TABLE clientes (id INT, nome VARCHAR(50));', 'CREATE TABLE clientes (id INT, nome …);'),
    learn('Chave primária e AUTO_INCREMENT', `<p>A <b>chave primária</b> (<code>PRIMARY KEY</code>) identifica cada linha de forma única e não aceita valores repetidos nem vazios.</p>
      <p>Com <code>AUTO_INCREMENT</code>, o MySQL atribui automaticamente o número seguinte a cada nova linha:</p>`,
      [ex('CREATE TABLE produtos (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(60)\n);', 'O id é gerado automaticamente: 1, 2, 3…')]),
    code('Crie a tabela fornecedores com id INT AUTO_INCREMENT como chave primária e nome VARCHAR(80).', ['^create table fornecedores\\(id int(\\(\\d+\\))? (not null )?auto_increment primary key,nome varchar\\(80\\)\\)$', '^create table fornecedores\\(id int(\\(\\d+\\))? (not null )?primary key auto_increment,nome varchar\\(80\\)\\)$', '^create table fornecedores\\(id int(\\(\\d+\\))? (not null )?auto_increment,nome varchar\\(80\\),primary key\\(id\\)\\)$'], 'CREATE TABLE fornecedores (id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(80));', 'id INT AUTO_INCREMENT PRIMARY KEY, nome …'),
    learn('Restrições: NOT NULL, UNIQUE e DEFAULT', `<ul><li><code>NOT NULL</code> — o valor é obrigatório;</li><li><code>UNIQUE</code> — não podem existir valores repetidos;</li><li><code>DEFAULT valor</code> — valor usado quando não é indicado nenhum.</li></ul>`,
      [ex("CREATE TABLE alunos (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(80) NOT NULL,\n  email VARCHAR(100) UNIQUE,\n  idade INT DEFAULT 18\n);", 'Nome obrigatório, email sem repetidos, idade 18 por omissão.')]),
    quiz('Que restrição impede que uma coluna fique vazia?', ['UNIQUE', 'DEFAULT', 'NOT NULL', 'AUTO_INCREMENT'], 2, 'NOT NULL torna o valor obrigatório.'),
    quiz('Que restrição impede emails repetidos?', ['UNIQUE', 'DEFAULT', 'NOT NULL', 'CHECK NULL'], 0, 'UNIQUE garante que não há dois valores iguais.'),
    learn('Ver a estrutura de uma tabela', `<p>Depois de criar uma tabela, pode consultar a sua estrutura (colunas, tipos, chaves):</p>`, [ex('DESCRIBE alunos;', 'Também pode escrever DESC alunos;'), ex('SHOW TABLES;', 'Lista as tabelas da base de dados ativa.')]),
    code('Escreva o comando que mostra a estrutura da tabela alunos.', ['^(describe|desc|show columns from|explain) alunos$'], 'DESCRIBE alunos;', 'DESCRIBE ou DESC'),
  ] },
  { title: 'Chaves estrangeiras e alteração de tabelas', steps: [
    learn('Chave estrangeira', `<p>Uma <b>chave estrangeira</b> (<code>FOREIGN KEY</code>) é uma coluna que referencia a chave primária de outra tabela. Garante a <b>integridade referencial</b>: não é possível inscrever um aluno num curso que não existe.</p>`,
      [ex('CREATE TABLE alunos (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(80) NOT NULL,\n  curso_id INT,\n  FOREIGN KEY (curso_id) REFERENCES cursos(id)\n);', 'curso_id tem de existir em cursos.id.')]),
    quiz('Para que serve uma FOREIGN KEY?', ['Tornar a tabela mais rápida', 'Ligar duas tabelas e garantir a integridade referencial', 'Encriptar a coluna', 'Impedir valores NULL'], 1, 'Garante que o valor referenciado existe na outra tabela.'),
    learn('ALTER TABLE — acrescentar colunas', `<p>Uma tabela já existente pode ser alterada sem perder os dados. Para acrescentar uma coluna:</p>`, [ex('ALTER TABLE alunos ADD COLUMN telefone VARCHAR(20);', 'Acrescenta a coluna telefone.')]),
    code('Acrescente à tabela alunos a coluna email do tipo VARCHAR(100).', ['^alter table alunos add( column)? email varchar\\(100\\)$'], 'ALTER TABLE alunos ADD COLUMN email VARCHAR(100);', 'ALTER TABLE … ADD COLUMN …'),
    learn('ALTER TABLE — modificar e remover', `<pre><code>ALTER TABLE alunos MODIFY nome VARCHAR(120);   -- muda o tipo
ALTER TABLE alunos DROP COLUMN telefone;        -- remove a coluna
RENAME TABLE alunos TO estudantes;              -- muda o nome</code></pre>`),
    code('Remova a coluna cidade da tabela alunos.', ['^alter table alunos drop( column)? cidade$'], 'ALTER TABLE alunos DROP COLUMN cidade;', 'ALTER TABLE … DROP COLUMN …'),
    learn('DROP TABLE', `<p>Para eliminar uma tabela inteira (estrutura e dados):</p><pre><code>DROP TABLE IF EXISTS temporaria;</code></pre>`),
    code('Elimine a tabela temporaria.', ['^drop table (if exists )?temporaria$'], 'DROP TABLE temporaria;', 'DROP TABLE nome;'),
  ] }],
  cheat: [
    ['CREATE DATABASE [IF NOT EXISTS] bd;', 'Criar base de dados'], ['USE bd;', 'Selecionar a base de dados ativa'], ['DROP DATABASE bd;', 'Eliminar base de dados'],
    ['CREATE TABLE t (col TIPO [restrições], …);', 'Criar tabela'], ['id INT AUTO_INCREMENT PRIMARY KEY', 'Chave primária automática'],
    ['NOT NULL · UNIQUE · DEFAULT v', 'Restrições de coluna'], ['FOREIGN KEY (c) REFERENCES t2(id)', 'Chave estrangeira'],
    ['DESCRIBE t; · SHOW TABLES;', 'Ver estrutura / listar tabelas'], ['ALTER TABLE t ADD COLUMN c TIPO;', 'Acrescentar coluna'],
    ['ALTER TABLE t MODIFY c TIPO;', 'Alterar tipo'], ['ALTER TABLE t DROP COLUMN c;', 'Remover coluna'], ['DROP TABLE t;', 'Eliminar tabela'],
  ],
  test: [
    quiz('Que comando seleciona a base de dados ativa?', ['SELECT DATABASE escola', 'USE escola', 'OPEN escola', 'SET escola'], 1, 'USE nome;'),
    quiz('O que acontece com CREATE DATABASE IF NOT EXISTS loja se loja já existir?', ['Dá erro', 'Apaga e recria', 'Não faz nada e não dá erro', 'Cria loja2'], 2, 'IF NOT EXISTS evita o erro.'),
    quiz('Qual a função de AUTO_INCREMENT?', ['Aumentar o tamanho da tabela', 'Gerar automaticamente valores sequenciais', 'Aumentar a velocidade', 'Fazer backup automático'], 1, '1, 2, 3, …'),
    quiz('Uma chave primária pode ter valores repetidos?', ['Sim', 'Não', 'Só se for INT', 'Só com DEFAULT'], 1, 'Identifica cada linha de forma única.'),
    quiz('Qual o comando para acrescentar uma coluna a uma tabela existente?', ['UPDATE TABLE … ADD', 'ALTER TABLE … ADD COLUMN', 'INSERT COLUMN', 'MODIFY TABLE … NEW'], 1, 'ALTER TABLE altera a estrutura.'),
    quiz('O que garante uma FOREIGN KEY?', ['Que os valores são únicos', 'Que o valor existe na tabela referenciada', 'Que a coluna é obrigatória', 'Que a tabela é encriptada'], 1, 'Integridade referencial.'),
    quiz('Que comando mostra as colunas e tipos de uma tabela?', ['SHOW TABLES', 'DESCRIBE tabela', 'SELECT COLUMNS', 'LIST tabela'], 1, 'DESCRIBE (ou DESC).'),
    quiz('Qual a diferença entre DROP TABLE e ALTER TABLE … DROP COLUMN?', ['Nenhuma', 'O primeiro elimina a tabela inteira; o segundo só uma coluna', 'O segundo elimina a tabela', 'O primeiro só apaga os dados'], 1, 'DROP TABLE remove tudo.'),
  ],
},
/* =============================== 3 =============================== */
{
  id: 'dml', icon: 'edit', title: 'Inserir, alterar e eliminar dados',
  desc: 'INSERT, UPDATE, DELETE e transações.',
  lessons: [
  { title: 'INSERT — inserir dados', steps: [
    learn('Inserir uma linha', `<p>Adicionam-se linhas a uma tabela com <code>INSERT INTO</code>, indicando as colunas e os respetivos valores, pela mesma ordem:</p>`,
      [ex("INSERT INTO cursos (nome, horas)\nVALUES ('Marketing', 700);", 'O id é gerado pelo AUTO_INCREMENT.')]),
    code("Insira na tabela cursos (colunas nome e horas) o curso 'Direito' com 1000 horas.", ["^insert into cursos\\(nome,horas\\) ?values\\('direito',1000\\)$"], "INSERT INTO cursos (nome, horas) VALUES ('Direito', 1000);", "INSERT INTO cursos (nome, horas) VALUES ('…', …);"),
    learn('Texto, números e datas', `<p>Texto e datas escrevem-se entre <b>plicas</b> (<code>'Ana'</code>, <code>'2025-09-15'</code>); números escrevem-se sem plicas. Uma coluna sem valor indica-se com <code>NULL</code>.</p>
      <p>Indicar a lista de colunas é uma boa prática: o código fica claro e continua a funcionar se a estrutura da tabela mudar.</p>`),
    quiz('Como se escreve um valor de texto num INSERT?', ['Sem delimitadores', "Entre plicas: 'texto'", 'Entre parênteses retos', 'Com cardinal: #texto'], 1, 'Texto e datas usam plicas.'),
    learn('Inserir várias linhas', `<p>É possível inserir várias linhas numa só instrução, separando cada conjunto de valores por vírgulas:</p>`,
      [ex("INSERT INTO cursos (nome, horas) VALUES\n  ('Turismo', 600),\n  ('Música', 500);", 'Duas linhas numa só instrução.')]),
    code("Numa só instrução, insira em cursos (nome, horas) os cursos 'Artes' com 600 horas e 'Teatro' com 450 horas.", ["^insert into cursos\\(nome,horas\\) ?values ?\\('artes',600\\),\\('teatro',450\\)$"], "INSERT INTO cursos (nome, horas) VALUES ('Artes', 600), ('Teatro', 450);", 'VALUES (…), (…);'),
  ] },
  { title: 'UPDATE — alterar dados', steps: [
    learn('UPDATE com WHERE', `<p><code>UPDATE</code> modifica linhas existentes. <code>SET</code> indica as novas colunas/valores e <code>WHERE</code> escolhe <b>quais</b> linhas alterar:</p>`,
      [ex("UPDATE alunos\nSET cidade = 'Évora'\nWHERE id = 3;", 'Só altera a linha com id 3.')]),
    code('Altere a idade do aluno com id 5 para 22.', ['^update alunos set idade=22 where id=5$'], 'UPDATE alunos SET idade = 22 WHERE id = 5;', 'UPDATE alunos SET … WHERE …'),
    learn('Cuidado com o WHERE', `<p class="warn"><b>Sem WHERE, todas as linhas da tabela são alteradas.</b></p>
      <p>Boa prática: antes de um UPDATE importante, execute um <code>SELECT</code> com o mesmo WHERE para confirmar quais as linhas afetadas. O MySQL Workbench tem o modo <i>safe updates</i>, que recusa UPDATE/DELETE sem WHERE sobre uma chave.</p>`),
    quiz('O que acontece num UPDATE sem WHERE?', ['Dá sempre erro', 'Nada é alterado', 'Todas as linhas da tabela são alteradas', 'Só a primeira linha é alterada'], 2, 'Sem WHERE o UPDATE atinge a tabela inteira.'),
    learn('Expressões e várias colunas', `<p>O novo valor pode ser calculado a partir do atual, e podem alterar-se várias colunas separadas por vírgulas:</p>`,
      [ex("UPDATE notas SET nota = nota + 1\nWHERE disciplina = 'Programação';", 'Soma 1 valor a todas as notas de Programação.'), ex("UPDATE alunos SET idade = 21, cidade = 'Faro' WHERE id = 1;", 'Duas colunas de uma vez.')]),
    code('Aumente em 100 as horas de todos os cursos.', ['^update cursos set horas=horas\\+100$'], 'UPDATE cursos SET horas = horas + 100;', 'SET horas = horas + 100'),
  ] },
  { title: 'DELETE e transações', steps: [
    learn('DELETE', `<p><code>DELETE</code> remove linhas. Tal como no UPDATE, o <code>WHERE</code> indica quais — sem ele, a tabela fica vazia!</p>`, [ex('DELETE FROM alunos WHERE id = 10;', 'Remove apenas o aluno com id 10.')]),
    code('Elimine da tabela alunos o aluno com id 7.', ['^delete from alunos where id=7$'], 'DELETE FROM alunos WHERE id = 7;', 'DELETE FROM … WHERE …'),
    learn('TRUNCATE', `<p><code>TRUNCATE TABLE t;</code> esvazia a tabela inteira de forma muito rápida e reinicia o contador <code>AUTO_INCREMENT</code>. Não aceita WHERE e mantém a estrutura da tabela.</p>`),
    quiz('Qual a diferença principal entre DELETE e TRUNCATE?', ['Não há diferença', 'TRUNCATE esvazia a tabela inteira rapidamente; DELETE aceita WHERE', 'TRUNCATE elimina também a estrutura', 'DELETE é mais rápido em tabelas grandes'], 1, 'TRUNCATE não aceita WHERE.'),
    learn('Transações', `<p>Uma <b>transação</b> agrupa várias instruções que devem ser executadas como um todo. Até ser confirmada, pode ser anulada:</p>
      <pre><code>START TRANSACTION;
DELETE FROM alunos WHERE cidade = 'Porto';
SELECT COUNT(*) FROM alunos;   -- verificar
ROLLBACK;   -- desfaz tudo   (COMMIT; confirmaria)</code></pre>
      <p>As transações (tabelas InnoDB) garantem as propriedades <b>ACID</b>: Atomicidade, Consistência, Isolamento e Durabilidade.</p>`),
    code('Escreva o comando que anula (desfaz) a transação em curso.', ['^rollback( work)?$'], 'ROLLBACK;', 'O contrário de COMMIT.'),
    quiz('Que comando torna definitivas as alterações de uma transação?', ['SAVE', 'COMMIT', 'ROLLBACK', 'END'], 1, 'COMMIT confirma; ROLLBACK anula.'),
  ] }],
  cheat: [
    ["INSERT INTO t (c1, c2) VALUES (v1, v2);", 'Inserir uma linha'], ["INSERT INTO t (c1, c2) VALUES (…), (…);", 'Inserir várias linhas'],
    ['UPDATE t SET c = v WHERE condição;', 'Alterar linhas'], ['UPDATE t SET c = c + 1 WHERE …;', 'Alterar com expressão'],
    ['DELETE FROM t WHERE condição;', 'Eliminar linhas'], ['TRUNCATE TABLE t;', 'Esvaziar tabela'],
    ['START TRANSACTION; … COMMIT; / ROLLBACK;', 'Transação: confirmar / anular'],
  ],
  test: [
    quiz('Qual a sintaxe correta para inserir um curso?', ["INSERT cursos VALUES nome='Arte'", "INSERT INTO cursos (nome) VALUES ('Arte');", "ADD INTO cursos ('Arte')", "UPDATE cursos ADD ('Arte')"], 1, 'INSERT INTO … (colunas) VALUES (…).'),
    quiz('Como se escreve uma data num INSERT?', ['2025-03-14', "'2025-03-14'", '#2025-03-14#', '(2025,03,14)'], 1, 'Datas entre plicas.'),
    quiz("O que faz UPDATE alunos SET cidade = 'Faro';?", ["Altera a cidade só do primeiro aluno", "Altera a cidade de todos os alunos", "Dá erro por falta de WHERE", "Não altera nada"], 1, 'Sem WHERE afeta todas as linhas.'),
    quiz('Como se aumenta em 10% o preço de todos os produtos?', ['UPDATE produtos SET preco = 10%', 'UPDATE produtos SET preco = preco * 1.1', 'ALTER produtos preco + 10%', 'SET preco += 10'], 1, 'O novo valor pode ser calculado.'),
    quiz('O que faz DELETE FROM alunos; (sem WHERE)?', ['Elimina a tabela', 'Elimina todas as linhas, mantendo a tabela', 'Dá erro', 'Elimina a primeira linha'], 1, 'A estrutura mantém-se.'),
    quiz('Qual destes comandos aceita WHERE?', ['TRUNCATE', 'DELETE', 'DROP TABLE', 'CREATE TABLE'], 1, 'Só o DELETE filtra linhas.'),
    quiz('Numa transação, o que faz ROLLBACK?', ['Confirma as alterações', 'Anula as alterações não confirmadas', 'Reinicia o servidor', 'Faz backup'], 1, 'Desfaz desde o START TRANSACTION.'),
    quiz('O "A" de ACID significa…', ['Acesso', 'Atomicidade', 'Autenticação', 'Agregação'], 1, 'Tudo ou nada.'),
  ],
},
/* =============================== 4 =============================== */
{
  id: 'select', icon: 'search', title: 'Consultas com SELECT',
  desc: 'O coração do SQL: selecionar, filtrar, ordenar, agrupar e juntar tabelas.',
  lessons: [
  { title: 'O comando SELECT', steps: [
    learn('A base de dados escola', `<p>Neste capítulo vai praticar consultas reais sobre a base de dados <b>escola</b>, que tem três tabelas:</p>
      <ul><li><code>alunos(id, nome, idade, cidade, curso_id)</code></li><li><code>cursos(id, nome, horas)</code></li><li><code>notas(aluno_id, disciplina, nota)</code></li></ul>
      <p>As suas respostas são <b>executadas</b> e o resultado é comparado com o esperado. Pode experimentar à vontade.</p>`),
    learn('SELECT * — todas as colunas', `<p>O comando <code>SELECT</code> lê dados de uma tabela. A forma mais simples é:</p>
      <pre><code>SELECT * FROM tabela;</code></pre>
      <p>O asterisco <code>*</code> significa "todas as colunas" e <code>FROM</code> indica de que tabela se lê. Execute o exemplo:</p>`,
      [ex('SELECT * FROM cursos;', 'Todas as colunas e todas as linhas da tabela cursos.', true)]),
    query('Mostre todas as colunas e linhas da tabela alunos.', 'SELECT * FROM alunos', 'SELECT * FROM …'),
    learn('Escolher colunas', `<p>Normalmente não precisamos de todas as colunas. Basta indicar as que queremos, separadas por vírgulas, pela ordem em que devem aparecer:</p>`,
      [ex('SELECT nome, cidade FROM alunos;', 'Apenas o nome e a cidade de cada aluno.', true)]),
    query('Mostre apenas o nome e a idade de todos os alunos.', 'SELECT nome, idade FROM alunos', 'SELECT nome, idade FROM …'),
    learn('Aliases e cálculos', `<p>Com <code>AS</code> dá-se um nome (alias) a uma coluna do resultado. Também é possível fazer cálculos:</p>`,
      [ex('SELECT nome AS curso, horas / 40 AS semanas FROM cursos;', 'Converte horas em semanas de 40 horas.', true)]),
    query('Mostre o nome de cada curso e o número de horas multiplicado por 2 (chame-lhe horas_duplas).', 'SELECT nome, horas * 2 AS horas_duplas FROM cursos', 'SELECT nome, horas * 2 AS …'),
  ] },
  { title: 'Filtrar linhas com WHERE', steps: [
    learn('A cláusula WHERE', `<p>A cláusula <code>WHERE</code> filtra as linhas: só aparecem as que cumprem a condição.</p>
      <pre><code>SELECT colunas FROM tabela WHERE condição;</code></pre>
      <p>Valores de texto escrevem-se entre plicas:</p>`,
      [ex("SELECT * FROM alunos WHERE cidade = 'Lisboa';", 'Só os alunos de Lisboa.', true)]),
    query('Mostre todas as colunas dos alunos da cidade do Porto.', "SELECT * FROM alunos WHERE cidade = 'Porto'", "WHERE cidade = 'Porto'"),
    learn('Operadores de comparação', `<table><tr><th>Operador</th><th>Significado</th></tr><tr><td><code>=</code></td><td>igual</td></tr><tr><td><code>&lt;&gt;</code> ou <code>!=</code></td><td>diferente</td></tr><tr><td><code>&gt;</code> <code>&lt;</code></td><td>maior / menor</td></tr><tr><td><code>&gt;=</code> <code>&lt;=</code></td><td>maior ou igual / menor ou igual</td></tr></table>`,
      [ex('SELECT nome, idade FROM alunos WHERE idade >= 23;', 'Alunos com 23 anos ou mais.', true)]),
    query('Mostre o nome e a idade dos alunos com menos de 21 anos.', 'SELECT nome, idade FROM alunos WHERE idade < 21', 'WHERE idade < 21'),
    learn('Combinar condições: AND, OR e NOT', `<ul><li><code>AND</code> — as duas condições têm de ser verdadeiras;</li><li><code>OR</code> — basta uma ser verdadeira;</li><li><code>NOT</code> — nega a condição.</li></ul><p>Use parênteses para deixar clara a ordem de avaliação.</p>`,
      [ex("SELECT nome FROM alunos\nWHERE cidade = 'Lisboa' AND idade >= 20;", 'Lisboa e pelo menos 20 anos.', true)]),
    query('Mostre o nome dos alunos com mais de 21 anos que não sejam de Braga.', "SELECT nome FROM alunos WHERE idade > 21 AND cidade <> 'Braga'", 'Duas condições com AND; "diferente" é <>.'),
    learn('IN e BETWEEN', `<p><code>IN (…)</code> testa se o valor pertence a uma lista; <code>BETWEEN a AND b</code> testa um intervalo (inclui os extremos).</p>`,
      [ex("SELECT nome, cidade FROM alunos WHERE cidade IN ('Braga', 'Coimbra');", 'Equivale a cidade = … OR cidade = …', true), ex('SELECT nome, idade FROM alunos WHERE idade BETWEEN 20 AND 22;', 'Idades de 20 a 22.', true)]),
    query("Usando IN, mostre o nome dos alunos de Lisboa ou de Coimbra.", "SELECT nome FROM alunos WHERE cidade IN ('Lisboa', 'Coimbra')", "WHERE cidade IN ('Lisboa', 'Coimbra')"),
    learn('Procurar padrões com LIKE', `<p><code>LIKE</code> compara texto com um padrão: <code>%</code> representa qualquer sequência de caracteres e <code>_</code> exatamente um carácter.</p>`,
      [ex("SELECT nome FROM alunos WHERE nome LIKE '%a';", 'Nomes terminados em "a".', true), ex("SELECT nome FROM alunos WHERE nome LIKE '%Silva%';", 'Nomes que contêm "Silva".', true)]),
    query("Mostre o nome dos alunos cujo nome começa por 'C'.", "SELECT nome FROM alunos WHERE nome LIKE 'C%'", "LIKE 'C%'"),
  ] },
  { title: 'Ordenar e limitar resultados', steps: [
    learn('ORDER BY', `<p><code>ORDER BY</code> ordena o resultado: <code>ASC</code> (crescente, por omissão) ou <code>DESC</code> (decrescente). Pode ordenar por várias colunas — a segunda só desempata a primeira.</p>`,
      [ex('SELECT nome, idade FROM alunos ORDER BY idade DESC, nome;', 'Do mais velho para o mais novo; empates por nome.', true)]),
    query('Liste o nome e a idade dos alunos do mais novo para o mais velho e, em caso de empate, por nome.', 'SELECT nome, idade FROM alunos ORDER BY idade, nome', 'ORDER BY idade, nome', true),
    learn('LIMIT', `<p><code>LIMIT n</code> devolve apenas as primeiras <i>n</i> linhas. Combinado com <code>ORDER BY</code>, permite obter "os maiores" ou "os menores":</p>`,
      [ex('SELECT nome, horas FROM cursos ORDER BY horas DESC LIMIT 1;', 'O curso com mais horas.', true)]),
    query('Mostre o nome dos 2 alunos mais velhos.', 'SELECT nome FROM alunos ORDER BY idade DESC LIMIT 2', 'ORDER BY idade DESC LIMIT 2', true),
    learn('DISTINCT', `<p><code>DISTINCT</code> elimina as linhas repetidas do resultado:</p>`, [ex('SELECT DISTINCT disciplina FROM notas;', 'Cada disciplina aparece uma só vez.', true)]),
    query('Mostre, sem repetições, as cidades onde vivem os alunos.', 'SELECT DISTINCT cidade FROM alunos', 'SELECT DISTINCT …'),
  ] },
  { title: 'Funções de agregação e GROUP BY', steps: [
    learn('Funções de agregação', `<p>As funções de agregação resumem várias linhas num único valor:</p>
      <table><tr><th>Função</th><th>Devolve</th></tr><tr><td><code>COUNT(*)</code></td><td>número de linhas</td></tr><tr><td><code>SUM(col)</code></td><td>soma</td></tr><tr><td><code>AVG(col)</code></td><td>média</td></tr><tr><td><code>MIN(col)</code> / <code>MAX(col)</code></td><td>mínimo / máximo</td></tr></table>`,
      [ex('SELECT COUNT(*) AS qtd, AVG(idade) AS media FROM alunos;', 'Número de alunos e idade média.', true)]),
    query('Quantos alunos existem na tabela alunos?', 'SELECT COUNT(*) FROM alunos', 'COUNT(*)'),
    query('Qual é a nota máxima registada na tabela notas?', 'SELECT MAX(nota) FROM notas', 'MAX(nota)'),
    learn('GROUP BY', `<p><code>GROUP BY</code> forma grupos de linhas com o mesmo valor e calcula a agregação <b>em cada grupo</b>:</p>`,
      [ex('SELECT cidade, COUNT(*) AS qtd FROM alunos GROUP BY cidade;', 'Número de alunos por cidade.', true)]),
    query('Mostre cada disciplina e a respetiva nota média.', 'SELECT disciplina, AVG(nota) FROM notas GROUP BY disciplina', 'AVG(nota) … GROUP BY disciplina'),
    learn('HAVING', `<p><code>WHERE</code> filtra <b>linhas</b> antes de agrupar; <code>HAVING</code> filtra <b>grupos</b> depois de agrupar, normalmente usando a agregação.</p>
      <p>Ordem das cláusulas: <code>SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT</code>.</p>`,
      [ex('SELECT disciplina, AVG(nota) AS media\nFROM notas GROUP BY disciplina\nHAVING AVG(nota) > 13;', 'Só as disciplinas com média superior a 13.', true)]),
    query('Mostre as cidades com 3 ou mais alunos.', 'SELECT cidade FROM alunos GROUP BY cidade HAVING COUNT(*) >= 3', 'GROUP BY cidade HAVING COUNT(*) >= 3'),
  ] },
  { title: 'Juntar tabelas com JOIN', steps: [
    learn('INNER JOIN', `<p>Os dados estão repartidos por várias tabelas. O <code>JOIN</code> volta a juntá-los através das colunas relacionadas. O <code>INNER JOIN</code> devolve apenas as combinações que têm correspondência nas duas tabelas:</p>
      <p>Os <b>aliases</b> de tabela (<code>a</code>, <code>c</code>) encurtam a escrita e evitam ambiguidades (as duas tabelas têm uma coluna <code>nome</code>).</p>`,
      [ex('SELECT a.nome, c.nome AS curso\nFROM alunos a\nINNER JOIN cursos c ON a.curso_id = c.id;', 'Cada aluno com o nome do seu curso.', true)]),
    query('Mostre o nome de cada aluno com a disciplina e a nota (tabelas alunos e notas).', 'SELECT a.nome, n.disciplina, n.nota FROM alunos a INNER JOIN notas n ON n.aluno_id = a.id', 'JOIN notas n ON n.aluno_id = a.id'),
    learn('JOIN com WHERE', `<p>Depois de juntar as tabelas, pode filtrar por colunas de qualquer uma delas:</p>`,
      [ex("SELECT a.nome FROM alunos a\nJOIN cursos c ON a.curso_id = c.id\nWHERE c.nome = 'Design';", 'Alunos do curso de Design.', true)]),
    query("Mostre o nome dos alunos do curso de Informática.", "SELECT a.nome FROM alunos a INNER JOIN cursos c ON a.curso_id = c.id WHERE c.nome = 'Informática'", "WHERE c.nome = 'Informática'"),
    learn('LEFT JOIN', `<p>O <code>LEFT JOIN</code> devolve <b>todas</b> as linhas da tabela da esquerda, mesmo as que não têm correspondência; nesse caso as colunas da direita ficam a <code>NULL</code>. Para testar valores nulos usa-se <code>IS NULL</code> (nunca <code>= NULL</code>).</p>`,
      [ex('SELECT a.nome, n.nota\nFROM alunos a LEFT JOIN notas n ON n.aluno_id = a.id;', 'O João aparece com nota NULL.', true)]),
    query('Usando LEFT JOIN, mostre o nome dos alunos que não têm nenhuma nota.', 'SELECT a.nome FROM alunos a LEFT JOIN notas n ON n.aluno_id = a.id WHERE n.aluno_id IS NULL', 'LEFT JOIN … WHERE n.aluno_id IS NULL'),
    learn('JOIN com GROUP BY', `<p>JOIN e agregações combinam-se naturalmente — por exemplo, a média de cada aluno:</p>`,
      [ex('SELECT a.nome, AVG(n.nota) AS media\nFROM alunos a JOIN notas n ON n.aluno_id = a.id\nGROUP BY a.nome;', 'Média de notas por aluno.', true)]),
    query('Mostre o nome de cada curso e o número de alunos inscritos.', 'SELECT c.nome, COUNT(*) FROM cursos c INNER JOIN alunos a ON a.curso_id = c.id GROUP BY c.nome', 'JOIN + GROUP BY c.nome'),
  ] },
  { title: 'Subconsultas', steps: [
    learn('Subconsulta escalar', `<p>Uma <b>subconsulta</b> é um SELECT dentro de outro. Quando devolve um único valor, pode ser usada numa comparação:</p>`,
      [ex('SELECT nome, idade FROM alunos\nWHERE idade > (SELECT AVG(idade) FROM alunos);', 'Alunos com idade acima da média (21,5).', true)]),
    query('Mostre o nome dos cursos com mais horas do que a média de horas dos cursos.', 'SELECT nome FROM cursos WHERE horas > (SELECT AVG(horas) FROM cursos)', '(SELECT AVG(horas) FROM cursos)'),
    learn('Subconsulta com IN', `<p>Quando a subconsulta devolve uma lista de valores, usa-se com <code>IN</code>:</p>`,
      [ex("SELECT nome FROM alunos\nWHERE id IN (SELECT aluno_id FROM notas WHERE disciplina = 'Programação');", 'Alunos com nota a Programação.', true)]),
    query('Mostre o nome dos alunos que têm alguma nota igual ou superior a 17 (use IN com subconsulta).', 'SELECT nome FROM alunos WHERE id IN (SELECT aluno_id FROM notas WHERE nota >= 17)', 'WHERE id IN (SELECT aluno_id FROM notas …)'),
  ] }],
  cheat: [
    ['SELECT * FROM t;', 'Todas as colunas'], ['SELECT c1, c2 AS alias FROM t;', 'Colunas escolhidas e alias'],
    ["WHERE c = 'x' AND n > 10", 'Filtrar linhas'], ["IN ('a','b') · BETWEEN 1 AND 5", 'Listas e intervalos'], ["LIKE 'A%' · LIKE '_b%'", 'Padrões de texto'], ['IS NULL · IS NOT NULL', 'Valores em falta'],
    ['ORDER BY c [ASC|DESC]', 'Ordenar'], ['LIMIT n', 'Limitar número de linhas'], ['SELECT DISTINCT c FROM t;', 'Eliminar repetidos'],
    ['COUNT(*) SUM() AVG() MIN() MAX()', 'Agregações'], ['GROUP BY c HAVING COUNT(*) > 1', 'Agrupar e filtrar grupos'],
    ['t1 INNER JOIN t2 ON t1.x = t2.y', 'Junção com correspondência'], ['t1 LEFT JOIN t2 ON …', 'Todas as linhas de t1'],
    ['WHERE c > (SELECT AVG(c) FROM t)', 'Subconsulta'], ['SELECT→FROM→WHERE→GROUP BY→HAVING→ORDER BY→LIMIT', 'Ordem das cláusulas'],
  ],
  test: [
    quiz('O que devolve SELECT * FROM alunos?', ['Só a primeira coluna', 'Todas as colunas e linhas da tabela', 'O número de alunos', 'A estrutura da tabela'], 1, '* = todas as colunas.'),
    quiz("Qual a forma correta de filtrar os alunos de Braga?", ["WHERE cidade == Braga", "WHERE cidade = 'Braga'", "IF cidade = 'Braga'", "FILTER cidade 'Braga'"], 1, 'Texto entre plicas, comparação com =.'),
    quiz("Que nomes encontra LIKE 'A%'?", ['Nomes que terminam em A', 'Nomes que começam por A', 'Nomes com exatamente 2 letras', 'Nomes que contêm %'], 1, '% representa qualquer texto.'),
    quiz('Como se obtêm os 3 cursos com mais horas?', ['ORDER BY horas LIMIT 3', 'ORDER BY horas DESC LIMIT 3', 'TOP 3 horas', 'LIMIT 3 ORDER BY horas'], 1, 'Ordenar decrescente e limitar.'),
    quiz('Qual a diferença entre WHERE e HAVING?', ['Nenhuma', 'WHERE filtra linhas antes de agrupar; HAVING filtra grupos', 'HAVING é mais rápido', 'WHERE só funciona com JOIN'], 1, 'HAVING atua sobre os grupos.'),
    quiz('Que função conta linhas?', ['SUM()', 'COUNT()', 'TOTAL()', 'NUM()'], 1, 'COUNT(*).'),
    quiz('O que devolve um LEFT JOIN entre alunos e notas?', ['Só alunos com notas', 'Todos os alunos, com NULL nas notas em falta', 'Só as notas', 'Apenas as linhas sem correspondência'], 1, 'Mantém todas as linhas da esquerda.'),
    quiz('Como se testa se uma coluna não tem valor?', ['= NULL', 'IS NULL', "= ''", '== NULL'], 1, 'NULL compara-se com IS NULL.'),
  ],
},
/* =============================== 5 =============================== */
{
  id: 'sec', icon: 'shield', title: 'Segurança: utilizadores e permissões',
  desc: 'Contas, privilégios, roles (grupos) e boas práticas.',
  lessons: [
  { title: 'Utilizadores', steps: [
    learn('Princípio do menor privilégio', `<p>Por omissão existe a conta de administração <code>root</code>, com poder total. Nunca deve ser usada pelas aplicações nem pelos utilizadores do dia a dia.</p>
      <p>O <b>princípio do menor privilégio</b> diz que cada conta deve ter apenas as permissões estritamente necessárias à sua função. Assim, um erro ou um ataque têm um impacto limitado.</p>`),
    quiz('O princípio do menor privilégio diz que…', ['Todos devem ser administradores', 'Cada conta só deve ter as permissões estritamente necessárias', 'As palavras-passe devem ser curtas', 'Só o root pode usar a base de dados'], 1, 'Reduz o impacto de erros e ataques.'),
    learn('CREATE USER', `<p>No MySQL um utilizador é identificado por <b>nome e anfitrião</b> (de onde se pode ligar):</p>
      <pre><code>CREATE USER 'ana'@'localhost' IDENTIFIED BY 'Segura#2025';</code></pre>
      <ul><li><code>'ana'@'localhost'</code> — só liga a partir da própria máquina do servidor;</li><li><code>'ana'@'%'</code> — liga a partir de qualquer anfitrião;</li><li><code>'ana'@'192.168.1.%'</code> — só a partir da rede indicada.</li></ul>
      <p>Um utilizador acabado de criar ainda não tem privilégios sobre nenhuma base de dados.</p>`),
    code("Crie o utilizador 'joao' que liga a partir de localhost, com a palavra-passe 'abc123'.", ["^create user (if not exists )?'joao'@'localhost' identified by 'abc123'$"], "CREATE USER 'joao'@'localhost' IDENTIFIED BY 'abc123';", "CREATE USER 'nome'@'host' IDENTIFIED BY '…';"),
    quiz("O que significa o anfitrião '%' em 'maria'@'%'?", ['Só liga a partir da máquina local', 'Pode ligar a partir de qualquer anfitrião', 'A conta está desativada', 'Tem todos os privilégios'], 1, '% é o carácter universal.'),
    learn('Alterar e eliminar utilizadores', `<pre><code>ALTER USER 'ana'@'localhost' IDENTIFIED BY 'NovaPass#1';   -- mudar a palavra-passe
DROP USER 'ana'@'localhost';                               -- eliminar a conta
SELECT user, host FROM mysql.user;                         -- listar contas</code></pre>`),
    code("Elimine o utilizador 'joao'@'localhost'.", ["^drop user (if exists )?'joao'@'localhost'$"], "DROP USER 'joao'@'localhost';", 'DROP USER …'),
  ] },
  { title: 'Privilégios: GRANT e REVOKE', steps: [
    learn('GRANT', `<p>Os privilégios atribuem-se com <code>GRANT privilégios ON objeto TO utilizador</code>:</p>`,
      [ex("GRANT SELECT ON escola.* TO 'ana'@'localhost';", 'A ana pode consultar todas as tabelas da BD escola.'), ex("GRANT SELECT, INSERT, UPDATE ON escola.alunos TO 'ana'@'localhost';", 'Vários privilégios numa só tabela.')]),
    code("Dê ao utilizador 'ana'@'localhost' o privilégio SELECT em todas as tabelas da base de dados escola.", ["^grant select on escola\\.\\* to 'ana'@'localhost'$"], "GRANT SELECT ON escola.* TO 'ana'@'localhost';", 'GRANT … ON escola.* TO …'),
    learn('Níveis de privilégio', `<table><tr><th>Objeto</th><th>Abrange</th></tr><tr><td><code>*.*</code></td><td>todo o servidor</td></tr><tr><td><code>escola.*</code></td><td>todas as tabelas da BD escola</td></tr><tr><td><code>escola.alunos</code></td><td>apenas a tabela alunos</td></tr></table>
      <p>Privilégios comuns: <code>SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, ALL PRIVILEGES</code>. A opção <code>WITH GRANT OPTION</code> permite ao utilizador passar os seus privilégios a outros — use com cuidado.</p>`),
    quiz('Qual objeto aplica um privilégio apenas à tabela notas da BD escola?', ['*.*', 'escola.*', 'escola.notas', 'notas.*'], 2, 'base_de_dados.tabela'),
    learn('REVOKE', `<p>Para retirar privilégios usa-se <code>REVOKE</code> — repare que se escreve <b>FROM</b> e não TO:</p>`, [ex("REVOKE INSERT ON escola.alunos FROM 'ana'@'localhost';", 'A ana deixa de poder inserir alunos.')]),
    code("Retire a 'ana'@'localhost' o privilégio DELETE na base de dados escola (todas as tabelas).", ["^revoke delete on escola\\.\\* from 'ana'@'localhost'$"], "REVOKE DELETE ON escola.* FROM 'ana'@'localhost';", 'REVOKE … ON … FROM …'),
    learn('Consultar privilégios', `<p>Para verificar o que um utilizador pode fazer:</p>`, [ex("SHOW GRANTS FOR 'ana'@'localhost';", 'Lista os privilégios da ana.')]),
    code("Mostre os privilégios do utilizador 'ana'@'localhost'.", ["^show grants for 'ana'@'localhost'$"], "SHOW GRANTS FOR 'ana'@'localhost';", 'SHOW GRANTS FOR …'),
  ] },
  { title: 'Roles (grupos) e boas práticas', steps: [
    learn('CREATE ROLE', `<p>No MySQL 8, os grupos de utilizadores chamam-se <b>roles</b>: conjuntos de privilégios com nome, que se atribuem a vários utilizadores de uma vez. Quando o role muda, todos os seus membros são atualizados.</p>`,
      [ex("CREATE ROLE 'leitor';\nGRANT SELECT ON escola.* TO 'leitor';", 'Role com permissão de consulta.')]),
    code("Crie um role chamado 'editor'.", ["^create role (if not exists )?'editor'$"], "CREATE ROLE 'editor';", "CREATE ROLE 'nome';"),
    learn('Atribuir roles a utilizadores', `<p>Atribui-se um role com <code>GRANT</code> e define-se que fica ativo por omissão no início de sessão:</p>
      <pre><code>GRANT 'leitor' TO 'rui'@'localhost';
SET DEFAULT ROLE 'leitor' TO 'rui'@'localhost';</code></pre>`),
    code("Atribua o role 'leitor' ao utilizador 'rui'@'localhost'.", ["^grant 'leitor' to 'rui'@'localhost'$"], "GRANT 'leitor' TO 'rui'@'localhost';", "GRANT 'role' TO 'utilizador'@'host';"),
    learn('Boas práticas de segurança', `<ul><li>Palavras-passe fortes e únicas; nunca as guardar no código-fonte.</li><li>Não expor o MySQL (porta 3306) à Internet; restringir o anfitrião das contas.</li><li>Uma conta por aplicação, com privilégios mínimos; evitar <code>GRANT ALL</code> e <code>'%'</code> sem necessidade.</li><li>Rever periodicamente as contas e privilégios e remover as inativas.</li><li>Usar ligações cifradas (TLS).</li>
      <li>Nas aplicações, usar <b>prepared statements</b> (consultas parametrizadas) para evitar <b>SQL Injection</b> — ataque em que texto introduzido pelo utilizador é interpretado como SQL.</li></ul>`),
    quiz('Como se protege uma aplicação contra SQL Injection?', ['Usando prepared statements / consultas parametrizadas', 'Escondendo os nomes das tabelas', 'Usando sempre o utilizador root', 'Desligando o servidor à noite'], 0, 'Os parâmetros nunca são interpretados como código SQL.'),
  ] }],
  cheat: [
    ["CREATE USER 'u'@'host' IDENTIFIED BY 'pw';", 'Criar utilizador'], ["ALTER USER 'u'@'host' IDENTIFIED BY 'pw';", 'Mudar palavra-passe'], ["DROP USER 'u'@'host';", 'Eliminar utilizador'],
    ["GRANT SELECT, INSERT ON bd.* TO 'u'@'host';", 'Atribuir privilégios'], ["REVOKE INSERT ON bd.* FROM 'u'@'host';", 'Retirar privilégios'], ["SHOW GRANTS FOR 'u'@'host';", 'Ver privilégios'],
    ['*.* · bd.* · bd.tabela', 'Níveis: servidor, BD, tabela'], ["CREATE ROLE 'r'; GRANT … TO 'r';", 'Criar role e dar-lhe privilégios'], ["GRANT 'r' TO 'u'@'host';", 'Atribuir role'], ["SET DEFAULT ROLE 'r' TO 'u'@'host';", 'Ativar role por omissão'],
  ],
  test: [
    quiz('Porque não se deve usar a conta root nas aplicações?', ['Porque é lenta', 'Porque tem poder total e viola o princípio do menor privilégio', 'Porque não tem palavra-passe', 'Porque não consegue fazer SELECT'], 1, 'Um erro ou ataque teria impacto máximo.'),
    quiz("O utilizador 'ana'@'localhost' pode ligar-se a partir de outro computador?", ['Sim', 'Não, só a partir da máquina do servidor', 'Só com root', 'Só à noite'], 1, 'localhost = a própria máquina.'),
    quiz('Que privilégios tem um utilizador acabado de criar?', ['Todos', 'Apenas SELECT', 'Nenhum sobre as bases de dados', 'Os mesmos do root'], 2, 'É preciso atribuí-los com GRANT.'),
    quiz("Em GRANT SELECT ON loja.* TO 'x'@'%', o que significa loja.*?", ['Todas as BD', 'Todas as tabelas da BD loja', 'A tabela * da BD loja', 'Todos os utilizadores'], 1, 'bd.* = todas as tabelas da BD.'),
    quiz('Qual a sintaxe correta para retirar um privilégio?', ["REVOKE SELECT ON bd.* TO 'u'@'h'", "REVOKE SELECT ON bd.* FROM 'u'@'h'", "DELETE GRANT SELECT 'u'", "GRANT NOT SELECT"], 1, 'REVOKE … FROM.'),
    quiz('O que é um role no MySQL 8?', ['Um tipo de tabela', 'Um conjunto de privilégios com nome, atribuível a vários utilizadores', 'Um backup', 'Uma palavra-passe'], 1, 'Funciona como um grupo.'),
    quiz('O que faz WITH GRANT OPTION?', ['Encripta o privilégio', 'Permite ao utilizador passar os seus privilégios a outros', 'Remove privilégios', 'Dá acesso remoto'], 1, 'Deve ser usado com cuidado.'),
    quiz('O que é SQL Injection?', ['Um tipo de índice', 'Ataque em que dados introduzidos são executados como SQL', 'Um método de backup', 'Uma função de agregação'], 1, 'Previne-se com prepared statements.'),
  ],
},
/* =============================== 6 =============================== */
{
  id: 'backup', icon: 'archive', title: 'Backup e restauro',
  desc: 'mysqldump, restauro, backups físicos e estratégias.',
  lessons: [
  { title: 'Backups com mysqldump', steps: [
    learn('Porque fazer backups', `<p>Um <b>backup</b> é uma cópia de segurança que permite recuperar os dados após avarias de disco, erros humanos (um <code>DELETE</code> sem WHERE…), ataques como ransomware ou desastres no centro de dados.</p>
      <p>Existem dois tipos principais: <b>lógicos</b> (ficheiros com os comandos SQL que recriam os dados) e <b>físicos</b> (cópia dos ficheiros de dados do servidor).</p>`),
    quiz('Um backup lógico consiste em…', ['Uma cópia dos ficheiros de dados do disco', 'Um ficheiro com os comandos SQL que recriam a base de dados', 'Uma réplica do servidor', 'Uma fotografia do ecrã'], 1, 'O mysqldump gera backups lógicos.'),
    learn('mysqldump de uma base de dados', `<p>O <code>mysqldump</code> é um programa à parte, executado no <b>terminal do sistema operativo</b> (não dentro do <code>mysql&gt;</code>). O resultado é redirecionado com <code>&gt;</code> para um ficheiro:</p>`,
      [ex('mysqldump -u root -p escola > escola.sql', 'Exporta a BD escola para o ficheiro escola.sql.')]),
    code('Escreva o comando que exporta a base de dados loja para o ficheiro loja.sql, com o utilizador root (pedindo a palavra-passe).', ['^mysqldump -u ?root -p ?loja>loja\\.sql$', '^mysqldump -p -u ?root loja>loja\\.sql$'], 'mysqldump -u root -p loja > loja.sql', 'mysqldump -u … -p base > ficheiro'),
    learn('Opções úteis', `<pre><code>mysqldump -u root -p --databases escola loja > duas.sql   # várias BD (inclui CREATE DATABASE)
mysqldump -u root -p --all-databases > tudo.sql            # todas as BD
mysqldump -u root -p escola alunos > alunos.sql            # só uma tabela
mysqldump -u root -p --single-transaction --routines --events escola > escola.sql
mysqldump -u root -p escola | gzip > escola.sql.gz         # comprimido</code></pre>
      <p><code>--single-transaction</code> obtém uma cópia consistente de tabelas InnoDB sem bloquear a base de dados.</p>`),
    code('Escreva o comando que exporta TODAS as bases de dados para o ficheiro tudo.sql (utilizador root, com palavra-passe).', ['^mysqldump -u ?root -p ?--all-databases>tudo\\.sql$', '^mysqldump --all-databases -u ?root -p ?>tudo\\.sql$', '^mysqldump -u ?root --all-databases -p ?>tudo\\.sql$', '^mysqldump -p -u ?root --all-databases>tudo\\.sql$'], 'mysqldump -u root -p --all-databases > tudo.sql', 'Use a opção --all-databases'),
    quiz('Para que serve a opção --single-transaction?', ['Faz backup de uma só tabela', 'Obtém uma cópia consistente (InnoDB) sem bloquear as tabelas', 'Comprime o ficheiro', 'Apaga os dados antigos'], 1, 'Usa uma transação para obter uma imagem consistente.'),
  ] },
  { title: 'Restaurar uma base de dados', steps: [
    learn('Restaurar a partir do terminal', `<p>O restauro "reproduz" o ficheiro SQL no servidor, invertendo o redirecionamento (<code>&lt;</code>). Se o dump não foi feito com <code>--databases</code>, a base de dados tem de existir antes:</p>
      <pre><code>mysql -u root -p -e "CREATE DATABASE escola"
mysql -u root -p escola &lt; escola.sql</code></pre>`),
    code('Escreva o comando que restaura o ficheiro loja.sql na base de dados loja (utilizador root, com palavra-passe).', ['^mysql -u ?root -p ?loja<loja\\.sql$', '^mysql -p -u ?root loja<loja\\.sql$'], 'mysql -u root -p loja < loja.sql', 'mysql -u … -p base < ficheiro'),
    learn('Restaurar dentro do cliente mysql', `<p>Se já estiver ligado ao <code>mysql&gt;</code>, pode executar um ficheiro de comandos com <code>SOURCE</code>:</p>
      <pre><code>USE escola;
SOURCE /caminho/escola.sql;</code></pre><p>Ficheiros comprimidos restauram-se com: <code>gunzip &lt; escola.sql.gz | mysql -u root -p escola</code>.</p>`),
    code('Dentro do cliente mysql, escreva o comando que executa o ficheiro escola.sql.', ['^source escola\\.sql$', '^\\\\\\. escola\\.sql$'], 'SOURCE escola.sql;', 'SOURCE ficheiro;'),
    learn('Testar os backups', `<p class="warn">Um backup só tem valor se o restauro funcionar.</p><p>Teste regularmente o restauro num servidor de testes, documente o procedimento e meça quanto tempo demora — isso é essencial para planear a recuperação.</p>`),
    quiz('Porque se deve testar o restauro regularmente?', ['Para gastar espaço', 'Para garantir que o backup é válido e utilizável', 'Porque o MySQL o exige', 'Para apagar backups antigos'], 1, 'Um backup nunca testado é apenas uma esperança.'),
  ] },
  { title: 'Estratégias de backup', steps: [
    learn('Backups físicos', `<p>Em bases de dados grandes, copiar os ficheiros de dados é muito mais rápido do que gerar e reproduzir SQL. Ferramentas como <b>Percona XtraBackup</b> ou <b>MySQL Enterprise Backup</b> fazem cópias físicas consistentes sem parar o servidor.</p>`),
    quiz('Qual a principal vantagem de um backup físico em bases de dados grandes?', ['Ficheiro legível', 'Rapidez de cópia e de restauro', 'Funciona noutros SGBD', 'Não ocupa espaço'], 1, 'Copia diretamente os ficheiros de dados.'),
    learn('Binary log e recuperação num ponto no tempo', `<p>O <b>binary log</b> regista todas as alterações feitas aos dados. Depois de restaurar o último backup completo, podem reaplicar-se as alterações do binlog até um instante exato — por exemplo, até um minuto antes de um <code>DROP TABLE</code> acidental. Chama-se <b>PITR</b> (<i>Point-In-Time Recovery</i>).</p>`),
    quiz('Para que servem os binary logs na recuperação?', ['Acelerar consultas', 'Recuperar a BD até um ponto exato no tempo após restaurar um backup', 'Guardar palavras-passe', 'Criar utilizadores'], 1, 'Reaplicam as alterações posteriores ao backup.'),
    learn('Regra 3-2-1 e replicação', `<p>A <b>regra 3-2-1</b>: manter <b>3</b> cópias dos dados, em <b>2</b> tipos de suporte diferentes, com <b>1</b> cópia fora do local. Automatize os backups (<code>cron</code> no Linux, Agendador de Tarefas no Windows) e proteja os ficheiros com permissões e cifra.</p>
      <p>A <b>replicação</b> mantém uma cópia quase em tempo real noutro servidor, mas <b>não substitui</b> o backup: um erro (ex.: <code>DROP TABLE</code>) também é replicado.</p>`),
    quiz('O que é a regra 3-2-1?', ['3 backups por dia, 2 por semana, 1 por mês', '3 cópias, em 2 tipos de suporte, 1 delas fora do local', '3 utilizadores, 2 roles e 1 admin', '3 servidores, 2 réplicas e 1 mestre'], 1, 'Reduz o risco de perder todas as cópias.'),
    quiz('A replicação dispensa os backups?', ['Sim, é a mesma coisa', 'Não: um erro como DROP TABLE também é replicado', 'Sim, se houver 2 réplicas', 'Só em MySQL 8'], 1, 'A réplica copia também os erros.'),
  ] }],
  cheat: [
    ['mysqldump -u root -p bd > bd.sql', 'Backup de uma BD'], ['mysqldump -u root -p --databases bd1 bd2 > f.sql', 'Várias BD'], ['mysqldump -u root -p --all-databases > tudo.sql', 'Todas as BD'],
    ['mysqldump … --single-transaction', 'Cópia consistente sem bloqueio (InnoDB)'], ['mysqldump … | gzip > f.sql.gz', 'Backup comprimido'],
    ['mysql -u root -p bd < bd.sql', 'Restaurar (terminal)'], ['SOURCE ficheiro.sql;', 'Restaurar (dentro do mysql>)'],
    ['binary log + PITR', 'Recuperação num ponto no tempo'], ['3-2-1', '3 cópias, 2 suportes, 1 fora do local'],
  ],
  test: [
    quiz('Onde se executa o mysqldump?', ['Dentro do prompt mysql>', 'No terminal do sistema operativo', 'Só no MySQL Workbench', 'Num browser'], 1, 'É um programa à parte.'),
    quiz('Que símbolo redireciona a saída do mysqldump para um ficheiro?', ['<', '>', '|', '&'], 1, 'mysqldump … > ficheiro.sql'),
    quiz('Que opção exporta todas as bases de dados?', ['--all', '--all-databases', '--full', '-A-all'], 1, '--all-databases (ou -A).'),
    quiz('Como se restaura escola.sql pelo terminal?', ['mysqldump escola < escola.sql', 'mysql -u root -p escola < escola.sql', 'mysql restore escola.sql', 'RESTORE escola.sql'], 1, 'O cliente mysql lê o ficheiro com <.'),
    quiz('Dentro do cliente mysql, que comando executa um ficheiro .sql?', ['RUN', 'SOURCE', 'IMPORT', 'LOAD'], 1, 'SOURCE ficheiro.sql;'),
    quiz('Que mecanismo permite recuperar até um instante exato?', ['Replicação', 'Binary log (PITR)', 'TRUNCATE', 'GRANT'], 1, 'Reaplica as alterações registadas.'),
    quiz('Porque é que a replicação não substitui o backup?', ['Porque é lenta', 'Porque os erros também são replicados', 'Porque não copia índices', 'Porque só funciona em Windows'], 1, 'Um DROP acidental chega à réplica.'),
    quiz('O "1" da regra 3-2-1 refere-se a…', ['1 backup por dia', '1 cópia fora do local', '1 administrador', '1 disco'], 1, 'Protege contra desastres no local.'),
  ],
},
];

/* IDs estáveis e estrutura derivada: capítulo.lição.exercício */
CHAPTERS.forEach((c, ci) => {
  c.idx = ci;
  c.lessons.forEach((l, li) => {
    l.id = `${c.id}.${li + 1}`;
    l.chapter = c.id;
    let n = 0;
    l.steps.forEach((s, si) => { s.idx = si; if (s.t !== 'learn') s.id = `${l.id}.${++n}`; });
    l.ex = l.steps.filter((s) => s.t !== 'learn');
  });
  c.test.forEach((q, qi) => (q.id = `${c.id}.t${qi + 1}`));
});

const PASS_MARK = 70; // % mínima no miniteste para concluir o capítulo

const BADGES = [
  { id: 'first', icon: 'check', name: 'Primeiros passos', desc: 'Resolveu o primeiro exercício', test: (s) => s.exDone >= 1 },
  { id: 'ten', icon: 'hash', name: 'Dez certos', desc: '10 exercícios resolvidos', test: (s) => s.exDone >= 10 },
  { id: 'thirty', icon: 'cpu', name: 'Mente SQL', desc: '30 exercícios resolvidos', test: (s) => s.exDone >= 30 },
  { id: 'perfect', icon: 'target', name: 'Pontaria', desc: '10 exercícios à primeira tentativa', test: (s) => s.firstTry >= 10 },
  { id: 'test', icon: 'checkCircle', name: 'Aprovado', desc: 'Passou o primeiro miniteste', test: (s) => s.testsPassed >= 1 },
  { id: 'full', icon: 'star', name: 'Nota máxima', desc: '100% num miniteste', test: (s) => s.perfectTests >= 1 },
  { id: 'streak3', icon: 'flame', name: 'Em chamas', desc: '3 dias seguidos a estudar', test: (s) => s.streak >= 3 },
  { id: 'streak7', icon: 'zap', name: 'Imparável', desc: '7 dias seguidos a estudar', test: (s) => s.streak >= 7 },
  { id: 'select', icon: 'search', name: 'Detetive SELECT', desc: 'Concluiu o capítulo de SELECT', test: (s) => s.chaptersDone.includes('select') },
  { id: 'sec', icon: 'shield', name: 'Guardião', desc: 'Concluiu o capítulo de segurança', test: (s) => s.chaptersDone.includes('sec') },
  { id: 'all', icon: 'award', name: 'Mestre MySQL', desc: 'Concluiu todos os capítulos', test: (s) => s.chaptersDone.length === CHAPTERS.length },
];

const api = { CHAPTERS, BADGES, PASS_MARK };
if (typeof module !== 'undefined') module.exports = api; else root.CONTENT = api;
})(typeof window !== 'undefined' ? window : globalThis);
