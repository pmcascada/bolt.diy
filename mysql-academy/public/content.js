/* Conteúdo pedagógico — aprendizagem gradual.
   Cada lição é uma sequência de passos: explicação (learn) seguida de um exercício sobre esse conceito.
   O passo seguinte só é mostrado depois de o aluno resolver o exercício.
   Tipos de exercício:
     quiz  – escolha múltipla     { q, opts, a, why }
     ddl   – CREATE/ALTER/DROP TABLE verificado pela estrutura resultante { q, solution, setup?, loose?, xp? }
     code  – escrever um comando  { q, ok:[regex sobre o texto normalizado], solution, hint }
     query – SELECT executado na BD "escola" (ou "loja") e comparado com a solução { q, solution, hint, ordered?, db?, start? }
     dml   – INSERT/UPDATE/DELETE verificado pelo efeito nas tabelas { q, solution, hint, db?, start? }
     order – ordenar as partes de uma instrução ou de um procedimento { q, parts, why }
   Um quiz pode mostrar uma instrução SQL (sql) — "qual é o resultado?"; start pré-preenche a resposta ("corrija o erro").
   Lições e exercícios acrescentados depois têm uma chave (key) própria, para não alterar os IDs já guardados.
   Cada capítulo tem ainda: cheat (resumo de sintaxe), test (banco de perguntas do miniteste),
   practice (exercícios práticos sorteados no miniteste) e real (tarefas para fazer num MySQL real). */
(function (root) {
const learn = (title, html, examples = []) => ({ t: 'learn', title, html, examples });
const quiz = (q, opts, a, why, sql) => ({ t: 'quiz', q, opts, a, why, ...(sql ? { sql } : {}) });
// "Qual é o resultado?": quiz que mostra uma instrução.
const predict = (q, sql, opts, a, why) => quiz(q, opts, a, why, sql);
const code = (q, ok, solution, hint, opts = {}) => ({ t: 'code', q, ok, solution, hint, ...opts });
// opts: db ('loja'), start (texto inicial, ex.: uma consulta com um erro para corrigir), xp
const query = (q, solution, hint, ordered, opts = {}) => ({ t: 'query', q, solution, hint, ordered: !!ordered, ...opts });
const dml = (q, solution, hint, opts = {}) => ({ t: 'dml', q, solution, hint, ...opts });
const order = (q, parts, why) => ({ t: 'order', q, parts, why });
const key = (k, step) => ({ ...step, key: k });
// Explicação com visualização passo a passo da execução de uma consulta (FROM → WHERE → … → LIMIT).
const viz = (title, html, spec) => ({ t: 'learn', title, html, examples: [], viz: spec });
// ddl: CREATE/ALTER/DROP TABLE verificado pela estrutura obtida. opts: setup (tabelas que já existem), loose (só o essencial), xp.
const ddl = (q, solution, hint, opts = {}) => ({ t: 'ddl', q, solution, hint, ...opts });
// run: true executa na BD escola; 'loja' executa na BD loja.
const ex = (sql, note, run) => ({ sql, note, run: !!run, ...(typeof run === 'string' ? { db: run } : {}) });

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
      <li><b>Chave primária</b> — a coluna que identifica cada linha de forma única, por exemplo <code>id_aluno</code>.</li></ul>
      <p>Execute o exemplo para ver a tabela <code>alunos</code> da base de dados de exemplo <b>escola</b>. A instrução <code>SELECT * FROM alunos;</code> significa simplesmente «mostra todas as colunas (<code>*</code>) da tabela alunos» — o comando <code>SELECT</code> será estudado em pormenor no capítulo 4; por agora basta observar o resultado.</p>`,
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
    learn('Famílias de comandos SQL', `<p>Os comandos SQL agrupam-se em famílias, de acordo com a sua função. Não precisa de os saber já escrever: cada família é estudada num capítulo próprio. Por exemplo, <code>CREATE TABLE</code> cria uma tabela nova (capítulo 2), <code>INSERT</code> acrescenta dados a uma tabela (capítulo 3), <code>SELECT</code> consulta dados (capítulo 4) e <code>GRANT</code> dá permissões a um utilizador (capítulo 6).</p>
      <table><tr><th>Família</th><th>Função</th><th>Comandos</th></tr>
      <tr><td>DDL</td><td>Definir estruturas</td><td><code>CREATE</code>, <code>ALTER</code>, <code>DROP</code></td></tr>
      <tr><td>DML</td><td>Manipular dados</td><td><code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code></td></tr>
      <tr><td>DQL</td><td>Consultar dados</td><td><code>SELECT</code></td></tr>
      <tr><td>DCL</td><td>Controlar acessos</td><td><code>GRANT</code>, <code>REVOKE</code></td></tr>
      </table>`),
    quiz('A que família pertence o comando CREATE TABLE?', ['DDL', 'DML', 'DCL', 'DQL'], 0, 'CREATE define estruturas: é DDL (Data Definition Language).'),
    quiz('E o comando GRANT?', ['DDL', 'DML', 'DCL', 'DQL'], 2, 'GRANT e REVOKE controlam permissões: DCL (Data Control Language).'),
    learn('Navegar no servidor: USE, SHOW TABLES e DESCRIBE', `<p>Um servidor MySQL guarda várias bases de dados, e cada base de dados tem várias tabelas. Para "navegar" usam-se três comandos simples:</p>
      <table><tr><th>Comando</th><th>O que faz</th></tr>
      <tr><td><code>USE escola;</code></td><td>escolhe a base de dados com que se vai trabalhar (a base de dados <b>ativa</b>). Os comandos seguintes referem-se às tabelas dessa base de dados.</td></tr>
      <tr><td><code>SHOW TABLES;</code></td><td>lista as tabelas da base de dados ativa — por isso só funciona depois do <code>USE</code>.</td></tr>
      <tr><td><code>DESCRIBE alunos;</code></td><td>mostra a estrutura de uma tabela: as colunas e o tipo de cada uma.</td></tr></table>
      <p>Uma sessão típica no cliente <code>mysql</code>: entrar (<code>mysql -u root -p</code>), ver as bases de dados (<code>SHOW DATABASES;</code>), escolher uma (<code>USE</code>), ver as tabelas (<code>SHOW TABLES;</code>) e, no fim, sair (<code>EXIT;</code>).</p>`,
      [ex('USE escola;\nSHOW TABLES;', 'Primeiro escolhe-se a base de dados; depois listam-se as suas tabelas.')]),
    key('o1', order('Ordene os passos de uma primeira sessão no cliente mysql: entrar no servidor, ver as bases de dados, escolher a escola, listar as suas tabelas e sair.',
      ['mysql -u root -p', 'SHOW DATABASES;', 'USE escola;', 'SHOW TABLES;', 'EXIT;'], 'Primeiro liga-se ao servidor; só depois de escolher a base de dados com USE é que SHOW TABLES lista as tabelas dela.')),
  ] },
  { title: 'Tipos de dados', steps: [
    learn('Para que servem os tipos de dados', `<p>Quando se cria uma tabela, é preciso dizer ao MySQL que colunas vai ter e <b>que tipo de valor</b> cada coluna guarda: números, texto, datas… Isso faz-se com o comando <code>CREATE TABLE</code>, que vai aprender a escrever no capítulo 2. Fica aqui um primeiro exemplo, só para ver onde os tipos são usados:</p>
      <pre><code>CREATE TABLE produtos (
  id_produto INT,          -- número inteiro
  nome       VARCHAR(60),  -- texto até 60 caracteres
  preco      DECIMAL(8,2), -- valor com 2 casas decimais
  validade   DATE          -- data
);</code></pre>
      <p>O tipo certo garante que os dados são válidos (não se guarda texto numa coluna de preços), ocupam o espaço adequado e podem ser comparados e ordenados corretamente. Nesta lição vai conhecer os tipos mais usados.</p>`),
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
    quiz('INSERT, UPDATE e DELETE pertencem a que família?', ['DDL', 'DML', 'DCL', 'DQL'], 1, 'São comandos de manipulação de dados.'),
    quiz('Qual o tipo indicado para valores monetários?', ['FLOAT', 'DOUBLE', 'DECIMAL', 'TEXT'], 2, 'DECIMAL é exato.'),
    quiz('Qual a diferença entre CHAR e VARCHAR?', ['Nenhuma', 'CHAR tem tamanho fixo; VARCHAR é variável', 'VARCHAR só guarda números', 'CHAR só guarda uma letra'], 1, 'CHAR(n) ocupa sempre n caracteres.'),
    quiz('Qual destas datas está no formato correto do MySQL?', ["'14/03/2025'", "'2025-03-14'", "'03-14-2025'", "'14.03.25'"], 1, 'AAAA-MM-DD.'),
    quiz('Qual destes NÃO é um SGBD relacional?', ['MySQL', 'PostgreSQL', 'Microsoft Excel', 'MariaDB'], 2, 'O Excel é uma folha de cálculo, não um sistema de gestão de bases de dados.'),
    quiz('O que identifica de forma única cada linha de uma tabela?', ['A primeira coluna', 'A chave primária', 'O nome da tabela', 'O tipo de dados'], 1, 'Não podem existir duas linhas com a mesma chave primária.'),
    quiz('Qual o comando que sai do cliente mysql?', ['STOP;', 'EXIT;', 'CLOSE;', 'END;'], 1, 'EXIT; (ou QUIT;).'),
    quiz('No modelo cliente/servidor, o MySQL Workbench é…', ['O servidor', 'Um cliente', 'Uma base de dados', 'Um tipo de dados'], 1, 'O Workbench envia pedidos SQL ao servidor, tal como o terminal mysql.'),
    quiz('A que família pertence o SELECT?', ['DDL', 'DML', 'DCL', 'DQL'], 3, 'DQL — Data Query Language (consulta).'),
    quiz('Que tipo guarda data e hora?', ['DATE', 'TIME', 'DATETIME', 'YEAR'], 2, 'DATETIME guarda as duas; DATE só a data e TIME só a hora.'),
    quiz('Qual o tipo mais adequado para a quantidade em stock de um produto?', ['VARCHAR(10)', 'INT', 'DECIMAL(8,2)', 'DATE'], 1, 'Um número inteiro.'),
    predict('O que mostra esta instrução?', 'SHOW DATABASES;', ['As tabelas da base de dados ativa', 'As bases de dados existentes no servidor', 'A estrutura de uma tabela', 'Os utilizadores do servidor'], 1, 'SHOW TABLES lista as tabelas; SHOW DATABASES lista as bases de dados.'),
  ],
  real: [
    'Instalar o MySQL Community Server (ou o XAMPP/MAMP, que já o incluem) e o MySQL Workbench.',
    'Abrir o terminal e ligar ao servidor com <code>mysql -u root -p</code>.',
    'Executar <code>SHOW DATABASES;</code> e <code>SELECT VERSION();</code> e comparar com o que aprendeu.',
    'Descarregar o script da BD <b>escola</b> (botão abaixo) e importá-lo com <code>mysql -u root -p &lt; escola.sql</code>.',
    'No MySQL Workbench, abrir a ligação local e executar <code>SELECT * FROM escola.alunos;</code>.',
  ],
  practice: [
    query('Mostre todas as colunas e linhas da tabela cursos.', 'SELECT * FROM cursos', 'SELECT * FROM …'),
    code('Escreva a instrução que mostra a versão do servidor MySQL.', ['^select version\\(\\)$'], 'SELECT VERSION();', 'SELECT VERSION();'),
    code('Escreva a instrução que lista as bases de dados existentes no servidor.', ['^show (databases|schemas)$'], 'SHOW DATABASES;', 'SHOW …'),
  ],
},
/* =============================== 2 =============================== */
{
  id: 'ddl', icon: 'table', title: 'Criar bases de dados e tabelas',
  desc: 'Tabelas, chaves primárias e estrangeiras, relações 1:N e N:M, ON DELETE e ALTER TABLE.',
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
  id_curso INT,
  nome VARCHAR(50),
  horas INT
);</code></pre><p>As colunas são separadas por vírgulas e a lista fica entre parênteses. Pode escrever a instrução numa só linha ou em várias, como preferir.</p>`),
    ddl('Crie a tabela clientes com as colunas id_cliente (INT) e nome (VARCHAR(50)).', `CREATE TABLE clientes (
  id_cliente INT,
  nome VARCHAR(50)
);`, 'CREATE TABLE clientes (id_cliente INT, nome …);'),
    learn('Chave primária e AUTO_INCREMENT', `<p>A <b>chave primária</b> (<code>PRIMARY KEY</code>) identifica cada linha de forma única e não aceita valores repetidos nem vazios.</p>
      <p>Com <code>AUTO_INCREMENT</code>, o MySQL atribui automaticamente o número seguinte a cada nova linha.</p>
      <p><b>Convenção usada neste curso:</b> a chave primária chama-se <code>id_</code> seguido do nome da tabela no singular — <code>id_aluno</code>, <code>id_curso</code>, <code>id_produto</code>. As chaves estrangeiras usam o mesmo nome da chave que referenciam (ex.: <code>alunos.id_curso</code> → <code>cursos.id_curso</code>), o que torna as ligações entre tabelas fáceis de ler.</p>
      <p>A chave primária pode ser indicada junto da coluna ou no fim, com <code>PRIMARY KEY (coluna)</code>:</p>`,
      [ex('CREATE TABLE produtos (\n  id_produto INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(60)\n);', 'Chave primária junto da coluna.'),
       ex('CREATE TABLE produtos (\n  id_produto INT AUTO_INCREMENT,\n  nome VARCHAR(60),\n  PRIMARY KEY (id_produto)\n);', 'A mesma tabela, com a chave primária no fim.')]),
    ddl('Crie a tabela fornecedores com id_fornecedor (inteiro, chave primária gerada automaticamente) e nome (VARCHAR(80)).', `CREATE TABLE fornecedores (
  id_fornecedor INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80)
);`, 'id_fornecedor INT AUTO_INCREMENT PRIMARY KEY, nome …'),
    learn('Restrições: NOT NULL, UNIQUE, DEFAULT e CHECK', `<p>As <b>restrições</b> são regras que o MySQL verifica sempre que se guardam dados numa coluna:</p><ul><li><code>NOT NULL</code> — o valor é obrigatório;</li><li><code>UNIQUE</code> — não podem existir valores repetidos;</li><li><code>DEFAULT valor</code> — valor usado quando não é indicado nenhum;</li><li><code>CHECK (condição)</code> — o valor tem de cumprir uma condição, por exemplo <code>preco DECIMAL(8,2) CHECK (preco &gt; 0)</code>. As condições usam os operadores de comparação <code>&gt;</code>, <code>&lt;</code>, <code>&gt;=</code>, <code>&lt;=</code>, <code>=</code> e <code>&lt;&gt;</code> (diferente). O CHECK é aprofundado no capítulo 5.</li></ul>
      <p>Escolha também o tipo certo: <code>CHAR(n)</code> para códigos de tamanho fixo (NIF, ISBN, código postal), <code>VARCHAR(n)</code> para texto variável e <code>DECIMAL(p,d)</code> para valores com casas decimais.</p>`,
      [ex("CREATE TABLE alunos (\n  id_aluno INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(80) NOT NULL,\n  email VARCHAR(100) UNIQUE,\n  idade INT DEFAULT 18\n);", 'Nome obrigatório, email sem repetidos, idade 18 por omissão.')]),
    quiz('Que restrição impede que uma coluna fique vazia?', ['UNIQUE', 'DEFAULT', 'NOT NULL', 'AUTO_INCREMENT'], 2, 'NOT NULL torna o valor obrigatório.'),
    quiz('Qual o tipo mais adequado para um NIF português (sempre 9 algarismos)?', ['INT', 'CHAR(9)', 'VARCHAR(255)', 'DECIMAL(9,0)'], 1, 'É um código de tamanho fixo e não se fazem contas com ele: CHAR(9).'),
    ddl('Crie a tabela livros com: id_livro (inteiro, chave primária automática); isbn com exatamente 13 caracteres, obrigatório e sem repetições; titulo até 150 caracteres, obrigatório; ano (inteiro, opcional); preco com 6 algarismos dos quais 2 decimais, por omissão 0.', `CREATE TABLE livros (
  id_livro INT AUTO_INCREMENT PRIMARY KEY,
  isbn CHAR(13) NOT NULL UNIQUE,
  titulo VARCHAR(150) NOT NULL,
  ano INT,
  preco DECIMAL(6,2) DEFAULT 0
);`, 'isbn CHAR(13) NOT NULL UNIQUE · preco DECIMAL(6,2) DEFAULT 0'),
    learn('Ver a estrutura de uma tabela', `<p>Depois de criar uma tabela, pode consultar a sua estrutura (colunas, tipos, chaves):</p>`, [ex('DESCRIBE alunos;', 'Também pode escrever DESC alunos;'), ex('SHOW TABLES;', 'Lista as tabelas da base de dados ativa.')]),
    code('Escreva o comando que mostra a estrutura da tabela alunos.', ['^(describe|desc|show columns from|explain) alunos$'], 'DESCRIBE alunos;', 'DESCRIBE ou DESC'),
    key('f1', ddl('Corrija o erro: o MySQL recusa a instrução abaixo (ERROR 1064). Ela devia criar a tabela editoras com id_editora (chave primária automática), nome (obrigatório) e pais.', `CREATE TABLE editoras (
  id_editora INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  pais VARCHAR(40)
);`, 'Procure uma vírgula em falta entre duas colunas.', { start: 'CREATE TABLE editoras (\n  id_editora INT AUTO_INCREMENT PRIMARY KEY\n  nome VARCHAR(80) NOT NULL,\n  pais VARCHAR(40)\n);' })),
  ] },
  { title: 'Chaves estrangeiras e relações 1:N', steps: [
    learn('Relações um-para-muitos (1:N)', `<p>Um curso tem <b>muitos</b> alunos, mas cada aluno pertence a <b>um</b> curso: é uma relação <b>1:N</b>. Representa-se colocando, na tabela do lado "muitos" (<code>alunos</code>), uma <b>chave estrangeira</b> (<code>FOREIGN KEY</code>) que referencia a chave primária da tabela do lado "um" (<code>cursos</code>).</p>
      <p>A chave estrangeira garante a <b>integridade referencial</b>: não é possível inscrever um aluno num curso que não existe.</p>`,
      [ex('CREATE TABLE alunos (\n  id_aluno INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(80) NOT NULL,\n  id_curso INT,\n  FOREIGN KEY (id_curso) REFERENCES cursos(id_curso)\n);', 'id_curso tem de existir em cursos.id_curso.')]),
    quiz('Numa relação 1:N entre clientes e encomendas (um cliente faz muitas encomendas), onde fica a chave estrangeira?', ['Em clientes: id_encomenda', 'Em encomendas: id_cliente', 'Nas duas tabelas', 'Numa terceira tabela'], 1, 'A chave estrangeira fica sempre do lado "muitos".'),
    learn('Regras para criar tabelas relacionadas', `<ul><li>A tabela referenciada (o "pai") tem de ser criada <b>antes</b> da tabela que a referencia (o "filho").</li>
      <li>A chave estrangeira tem de ter o <b>mesmo tipo</b> que a chave primária referenciada (INT com INT).</li>
      <li>Se a relação for obrigatória (ex.: todas as encomendas têm cliente), a chave estrangeira é <code>NOT NULL</code>.</li></ul>
      <p>A chave estrangeira pode ser escrita no fim da tabela (como acima) ou junto da coluna: <code>id_curso INT REFERENCES cursos(id_curso)</code>.</p>`),
    ddl('Já existe a tabela clientes. Crie a tabela encomendas com: id_encomenda (chave primária automática), data (DATE, obrigatória) e id_cliente (obrigatório), ligada a clientes.', `CREATE TABLE encomendas (
  id_encomenda INT AUTO_INCREMENT PRIMARY KEY,
  data DATE NOT NULL,
  id_cliente INT NOT NULL,
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);`, 'FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)', { setup: 'CREATE TABLE clientes (\n  id_cliente INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(80) NOT NULL\n);' }),
    learn('O que acontece ao apagar? ON DELETE', `<p>Se um cliente com encomendas for apagado, o que deve acontecer às suas encomendas? Isso define-se com <code>ON DELETE</code> na chave estrangeira:</p>
      <table><tr><th>Ação</th><th>Ao apagar o "pai"…</th><th>Quando usar</th></tr>
      <tr><td><code>RESTRICT</code> (por omissão)</td><td>a operação é <b>recusada</b> enquanto existirem "filhos"</td><td>dados que não se podem perder (clientes com encomendas)</td></tr>
      <tr><td><code>CASCADE</code></td><td>os "filhos" são <b>apagados também</b></td><td>dados que só existem com o pai (comentários de uma publicação)</td></tr>
      <tr><td><code>SET NULL</code></td><td>a chave estrangeira dos "filhos" fica <b>NULL</b></td><td>a ligação é opcional (funcionário sem departamento); a coluna não pode ser NOT NULL</td></tr></table>
      <p>Existe também <code>ON UPDATE</code>, com as mesmas opções, para quando a chave primária do pai muda.</p>`,
      [ex('FOREIGN KEY (id_publicacao) REFERENCES publicacoes(id_publicacao)\n  ON DELETE CASCADE', 'Apagar uma publicação apaga os seus comentários.')]),
    quiz('Uma encomenda tem várias linhas de encomenda. Ao apagar uma encomenda, as suas linhas devem desaparecer. Que ação usar?', ['ON DELETE RESTRICT', 'ON DELETE CASCADE', 'ON DELETE SET NULL', 'Não é possível'], 1, 'As linhas só fazem sentido com a encomenda: CASCADE.'),
    quiz('Ao fechar um departamento, os funcionários devem manter-se, mas ficar sem departamento. Que ação usar?', ['ON DELETE CASCADE', 'ON DELETE RESTRICT', 'ON DELETE SET NULL', 'ON UPDATE CASCADE'], 2, 'SET NULL mantém o funcionário e retira a ligação.'),
    quiz('Porque é que ON DELETE SET NULL falha numa coluna id_departamento INT NOT NULL?', ['Porque SET NULL só funciona com VARCHAR', 'Porque a coluna não aceita NULL', 'Porque falta AUTO_INCREMENT', 'Porque NOT NULL é o mesmo que CASCADE'], 1, 'SET NULL precisa de uma coluna que aceite NULL.'),
    ddl('Já existe a tabela departamentos. Crie a tabela funcionarios com id_funcionario (chave primária automática), nome (VARCHAR(80), obrigatório) e id_departamento, de forma que, ao apagar um departamento, os seus funcionários fiquem sem departamento.', `CREATE TABLE funcionarios (
  id_funcionario INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  id_departamento INT,
  FOREIGN KEY (id_departamento) REFERENCES departamentos(id_departamento)
    ON DELETE SET NULL
);`, 'ON DELETE SET NULL (e id_departamento tem de aceitar NULL)', { setup: 'CREATE TABLE departamentos (\n  id_departamento INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(60) NOT NULL\n);' }),
    ddl('Já existe a tabela publicacoes. Crie a tabela comentarios com id_comentario (chave primária automática), texto (TEXT, obrigatório) e id_publicacao (obrigatório). Ao apagar uma publicação, os seus comentários devem ser apagados.', `CREATE TABLE comentarios (
  id_comentario INT AUTO_INCREMENT PRIMARY KEY,
  texto TEXT NOT NULL,
  id_publicacao INT NOT NULL,
  FOREIGN KEY (id_publicacao) REFERENCES publicacoes(id_publicacao)
    ON DELETE CASCADE
);`, 'ON DELETE CASCADE', { setup: 'CREATE TABLE publicacoes (\n  id_publicacao INT AUTO_INCREMENT PRIMARY KEY,\n  titulo VARCHAR(100) NOT NULL\n);' }),
  ] },
  { title: 'Relações muitos-para-muitos (N:M)', steps: [
    learn('O problema das relações N:M', `<p>Um aluno frequenta <b>várias</b> disciplinas e cada disciplina tem <b>vários</b> alunos: é uma relação <b>muitos-para-muitos</b> (N:M).</p>
      <p>Não é possível representá-la com uma chave estrangeira numa das tabelas: um aluno teria de guardar vários <code>id_disciplina</code> na mesma coluna. A solução é criar uma <b>tabela de ligação</b> (ou associativa) com as duas chaves estrangeiras:</p>
      <pre><code>alunos 1 ──── N  inscricoes  N ──── 1 disciplinas</code></pre>
      <p>A relação N:M transforma-se em duas relações 1:N.</p>`),
    quiz('Como se representa uma relação N:M entre alunos e disciplinas?', ['Com uma chave estrangeira id_disciplina em alunos', 'Com uma chave estrangeira id_aluno em disciplinas', 'Com uma tabela de ligação que tem id_aluno e id_disciplina', 'Juntando as duas tabelas numa só'], 2, 'A tabela de ligação tem uma chave estrangeira para cada lado.'),
    learn('Tabela de ligação e chave primária composta', `<p>Na tabela de ligação, a chave primária é normalmente <b>composta</b> pelas duas chaves estrangeiras. Isto impede, por exemplo, inscrever o mesmo aluno duas vezes na mesma disciplina.</p>
      <p>Os dados que pertencem à <b>relação</b> (e não a um aluno ou a uma disciplina) ficam também na tabela de ligação — por exemplo, a data de inscrição ou a nota final.</p>`,
      [ex(`CREATE TABLE inscricoes (
  id_aluno INT,
  id_disciplina INT,
  data_inscricao DATE NOT NULL,
  nota_final INT,
  PRIMARY KEY (id_aluno, id_disciplina),
  FOREIGN KEY (id_aluno) REFERENCES alunos(id_aluno) ON DELETE CASCADE,
  FOREIGN KEY (id_disciplina) REFERENCES disciplinas(id_disciplina) ON DELETE CASCADE
);`, 'Chave primária composta e duas chaves estrangeiras.')]),
    quiz('Porque se usa PRIMARY KEY (id_aluno, id_disciplina) na tabela inscricoes?', ['Para ordenar os alunos', 'Para impedir que o mesmo aluno se inscreva duas vezes na mesma disciplina', 'Porque o MySQL não aceita AUTO_INCREMENT', 'Para apagar as inscrições automaticamente'], 1, 'A combinação aluno + disciplina tem de ser única.'),
    quiz('Onde deve ficar guardada a nota final de um aluno numa disciplina?', ['Na tabela alunos', 'Na tabela disciplinas', 'Na tabela de ligação inscricoes', 'Numa vista'], 2, 'A nota depende do aluno E da disciplina: pertence à relação.'),
    ddl('Já existe a tabela alunos. Crie a tabela disciplinas (id_disciplina, chave primária automática; nome VARCHAR(60), obrigatório) e a tabela de ligação inscricoes com id_aluno, id_disciplina e data_inscricao (DATE, obrigatória). Use uma chave primária composta e, se um aluno ou uma disciplina forem apagados, as inscrições correspondentes devem ser apagadas.', `CREATE TABLE disciplinas (
  id_disciplina INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(60) NOT NULL
);

CREATE TABLE inscricoes (
  id_aluno INT,
  id_disciplina INT,
  data_inscricao DATE NOT NULL,
  PRIMARY KEY (id_aluno, id_disciplina),
  FOREIGN KEY (id_aluno) REFERENCES alunos(id_aluno) ON DELETE CASCADE,
  FOREIGN KEY (id_disciplina) REFERENCES disciplinas(id_disciplina) ON DELETE CASCADE
);`, 'Crie primeiro disciplinas; depois inscricoes com PRIMARY KEY (id_aluno, id_disciplina) e duas FOREIGN KEY … ON DELETE CASCADE.', { setup: 'CREATE TABLE alunos (\n  id_aluno INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(80) NOT NULL\n);' }),
    ddl('Já existe a tabela livros. Um livro pode ter vários autores e um autor pode escrever vários livros. Crie a tabela autores (id_autor, chave primária automática; nome VARCHAR(100), obrigatório; nacionalidade VARCHAR(50)) e a tabela de ligação livros_autores, com chave primária composta por id_livro e id_autor.', `CREATE TABLE autores (
  id_autor INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  nacionalidade VARCHAR(50)
);

CREATE TABLE livros_autores (
  id_livro INT,
  id_autor INT,
  PRIMARY KEY (id_livro, id_autor),
  FOREIGN KEY (id_livro) REFERENCES livros(id_livro),
  FOREIGN KEY (id_autor) REFERENCES autores(id_autor)
);`, 'Duas tabelas: autores e livros_autores (com duas chaves estrangeiras).', { setup: 'CREATE TABLE livros (\n  id_livro INT AUTO_INCREMENT PRIMARY KEY,\n  titulo VARCHAR(150) NOT NULL\n);' }),
  ] },
  { title: 'Alterar e eliminar tabelas', steps: [
    learn('ALTER TABLE — acrescentar colunas', `<p>Uma tabela já existente pode ser alterada sem perder os dados. Para acrescentar uma coluna (por omissão fica no fim; <code>AFTER coluna</code> ou <code>FIRST</code> escolhem a posição):</p>`,
      [ex('ALTER TABLE alunos ADD COLUMN telefone VARCHAR(20) AFTER nome;', 'Acrescenta a coluna telefone a seguir a nome.')]),
    ddl('Acrescente à tabela alunos a coluna email (VARCHAR(100)), sem valores repetidos.', 'ALTER TABLE alunos ADD COLUMN email VARCHAR(100) UNIQUE;', 'ALTER TABLE alunos ADD COLUMN email … UNIQUE', { setup: 'CREATE TABLE alunos (\n  id_aluno INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(80) NOT NULL,\n  idade INT\n);' }),
    learn('MODIFY, CHANGE e RENAME COLUMN', `<table><tr><th>Comando</th><th>Faz</th></tr>
      <tr><td><code>MODIFY coluna TIPO …</code></td><td>muda o tipo e as restrições, mantendo o nome</td></tr>
      <tr><td><code>RENAME COLUMN antigo TO novo</code></td><td>só muda o nome (MySQL 8)</td></tr>
      <tr><td><code>CHANGE antigo novo TIPO …</code></td><td>muda o nome e a definição</td></tr></table>
      <p class="warn"><b>Atenção:</b> com MODIFY e CHANGE é preciso repetir a definição completa da coluna — uma restrição que não seja repetida (ex.: NOT NULL) é retirada.</p>`,
      [ex('ALTER TABLE alunos MODIFY nome VARCHAR(120) NOT NULL;', 'Aumenta o tamanho e mantém o nome obrigatório.'), ex('ALTER TABLE alunos RENAME COLUMN telefone TO telemovel;', 'Muda apenas o nome da coluna.')]),
    ddl('Na tabela produtos, torne o nome obrigatório e aumente o seu tamanho para 120 caracteres.', 'ALTER TABLE produtos MODIFY nome VARCHAR(120) NOT NULL;', 'ALTER TABLE produtos MODIFY nome …', { setup: 'CREATE TABLE produtos (\n  id_produto INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(50),\n  preco DECIMAL(6,2)\n);' }),
    ddl('Na tabela clientes, mude o nome da coluna tel para telefone, sem alterar o seu tipo.', 'ALTER TABLE clientes RENAME COLUMN tel TO telefone;', 'RENAME COLUMN … TO … (ou CHANGE)', { setup: 'CREATE TABLE clientes (\n  id_cliente INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(80) NOT NULL,\n  tel VARCHAR(15)\n);' }),
    learn('Acrescentar uma chave estrangeira', `<p>Quando a relação não foi definida ao criar a tabela, acrescenta-se depois. É boa prática dar-lhe um nome (ex.: <code>fk_tabela_referenciada</code>), para a poder remover mais tarde:</p>
      <pre><code>ALTER TABLE encomendas
  ADD CONSTRAINT fk_encomendas_clientes
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente);

ALTER TABLE encomendas DROP FOREIGN KEY fk_encomendas_clientes;</code></pre>
      <p>Os dados que já existem têm de respeitar a nova regra; caso contrário, o MySQL recusa a alteração.</p>`),
    ddl('As tabelas cursos e alunos já existem, mas ainda não estão ligadas. Acrescente à tabela alunos a chave estrangeira fk_alunos_cursos (coluna id_curso), de forma que, ao apagar um curso, os seus alunos fiquem sem curso.', 'ALTER TABLE alunos ADD CONSTRAINT fk_alunos_cursos FOREIGN KEY (id_curso) REFERENCES cursos(id_curso) ON DELETE SET NULL;', 'ADD CONSTRAINT … FOREIGN KEY … ON DELETE SET NULL', { setup: 'CREATE TABLE cursos (\n  id_curso INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(50) NOT NULL\n);\nCREATE TABLE alunos (\n  id_aluno INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(80) NOT NULL,\n  id_curso INT\n);' }),
    learn('Remover colunas e tabelas', `<pre><code>ALTER TABLE alunos DROP COLUMN telefone;   -- remove a coluna (e os seus dados)
RENAME TABLE alunos TO estudantes;          -- muda o nome da tabela
DROP TABLE IF EXISTS temporaria;            -- elimina a tabela inteira</code></pre>
      <p>Uma tabela referenciada por uma chave estrangeira <b>não pode</b> ser eliminada enquanto a tabela "filho" existir: elimina-se primeiro o "filho" e só depois o "pai" — a ordem inversa da criação.</p>`),
    quiz('As tabelas clientes e encomendas (com chave estrangeira para clientes) vão ser eliminadas. Qual a ordem correta?', ['Primeiro clientes, depois encomendas', 'Primeiro encomendas, depois clientes', 'Tanto faz', 'Não é possível eliminar tabelas relacionadas'], 1, 'Elimina-se primeiro a tabela que tem a chave estrangeira.'),
    ddl('Elimine as tabelas encomendas e clientes, pela ordem correta.', 'DROP TABLE encomendas;\nDROP TABLE clientes;', 'Duas instruções DROP TABLE: primeiro o "filho".', { setup: 'CREATE TABLE clientes (\n  id_cliente INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(80) NOT NULL\n);\nCREATE TABLE encomendas (\n  id_encomenda INT AUTO_INCREMENT PRIMARY KEY,\n  id_cliente INT NOT NULL,\n  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)\n);' }),
  ] },
  { key: 'norm', title: 'Do problema às tabelas: normalização', steps: [
    learn('Ler o enunciado e encontrar as entidades', `<p>Antes de escrever <code>CREATE TABLE</code>, é preciso decidir <b>que tabelas</b> criar. Num enunciado:</p>
      <ul><li>os <b>substantivos</b> importantes são candidatos a <b>entidades</b> (tabelas): cliente, livro, requisição…;</li>
      <li>as <b>características</b> de cada um são os <b>atributos</b> (colunas): nome, email, título…;</li>
      <li>os <b>verbos</b> que ligam entidades indicam <b>relações</b>: «um leitor <i>requisita</i> livros».</li></ul>
      <p>Para cada relação pergunta-se nos dois sentidos: «um leitor pode requisitar <b>quantos</b> livros?» e «um livro pode ser requisitado por <b>quantos</b> leitores?». As respostas dão a cardinalidade: 1:1, 1:N ou N:M.</p>
      <p><b>Exemplo:</b> «Uma clínica regista os seus médicos (nome, especialidade) e os pacientes (nome, NIF). Cada consulta tem data e hora, um médico e um paciente.» → entidades <code>medicos</code>, <code>pacientes</code> e <code>consultas</code>; cada consulta liga um médico a um paciente.</p>`),
    quiz('«Uma biblioteca regista os leitores (nome, email) e os livros (título, autor). Cada requisição tem uma data, um leitor e um livro.» Que tabelas deve criar?', ['Só requisicoes, com todas as colunas', 'leitores, livros e requisicoes', 'leitores e livros, com a data em livros', 'Uma tabela por cada coluna'], 1, 'Três entidades: a requisição liga um leitor a um livro e tem a sua própria data.'),
    learn('Porque não guardar tudo numa só tabela', `<p>Imagine a biblioteca a registar tudo numa única folha:</p>
      <table><tr><th>id_requisicao</th><th>data</th><th>nome_leitor</th><th>email_leitor</th><th>titulo</th><th>autor</th></tr>
      <tr><td>1</td><td>2025-03-02</td><td>Rita Sousa</td><td>rita@mail.pt</td><td>Os Maias</td><td>Eça de Queirós</td></tr>
      <tr><td>2</td><td>2025-03-09</td><td>Rita Sousa</td><td>rita@mail.pt</td><td>Mensagem</td><td>Fernando Pessoa</td></tr>
      <tr><td>3</td><td>2025-03-10</td><td>Luís Mota</td><td>luis@mail.pt</td><td>Os Maias</td><td>Eça de Queirós</td></tr></table>
      <p>Os dados repetem-se, e isso causa <b>anomalias</b>:</p>
      <ul><li><b>de atualização</b> — se a Rita mudar de email, é preciso alterar várias linhas (e basta esquecer uma para ficar incoerente);</li>
      <li><b>de inserção</b> — não é possível registar um livro novo enquanto ninguém o requisitar;</li>
      <li><b>de eliminação</b> — apagar a única requisição do Luís apaga também os dados do Luís.</li></ul>
      <p>A <b>normalização</b> resolve isto: cada facto fica guardado <b>uma só vez</b>, na tabela a que pertence.</p>`),
    quiz('Na folha acima, a Rita mudou de email. Que problema surge?', ['Nenhum', 'É preciso alterar várias linhas e é fácil deixar dados incoerentes', 'O MySQL não permite alterar emails', 'Perdem-se as requisições'], 1, 'É a anomalia de atualização: o mesmo facto está repetido.'),
    learn('As formas normais (1FN, 2FN e 3FN)', `<p>As <b>formas normais</b> são regras que, aplicadas por ordem, eliminam as repetições:</p>
      <table><tr><th>Forma</th><th>Regra</th><th>Exemplo de violação → correção</th></tr>
      <tr><td><b>1FN</b></td><td>Cada coluna guarda um <b>só valor</b> (atómico); não há listas nem colunas repetidas.</td><td><code>telefones = '912…, 935…'</code> → tabela <code>telefones(id_cliente, numero)</code></td></tr>
      <tr><td><b>2FN</b></td><td>Numa chave composta, cada coluna depende da <b>chave inteira</b>, não de parte dela.</td><td><code>inscricoes(id_aluno, id_disciplina, nome_disciplina)</code>: o nome só depende de id_disciplina → fica em <code>disciplinas</code></td></tr>
      <tr><td><b>3FN</b></td><td>Nenhuma coluna depende de <b>outra coluna que não é chave</b>.</td><td><code>clientes(…, codigo_postal, localidade)</code>: a localidade depende do código postal → tabela <code>codigos_postais</code></td></tr></table>
      <p>Resumo prático: <i>cada coluna deve depender da chave, da chave inteira e de nada mais além da chave</i>.</p>`),
    quiz('A tabela alunos tem a coluna disciplinas com o valor «Matemática, Física, Química». Que forma normal é violada?', ['1FN — a coluna guarda vários valores', '2FN', '3FN', 'Nenhuma'], 0, 'Uma coluna deve guardar um só valor: as disciplinas vão para uma tabela de ligação.'),
    quiz('Na tabela encomendas(id_encomenda, data, id_cliente, nome_cliente), o nome_cliente depende de id_cliente, que não é a chave. Que forma normal é violada?', ['1FN', '2FN', '3FN', 'Nenhuma'], 2, 'É uma dependência entre colunas que não são chave: o nome fica só na tabela clientes.'),
    ddl('Normalize a folha da biblioteca apresentada acima. Crie: leitores (id_leitor, chave primária automática; nome, obrigatório; email, obrigatório e sem repetições), livros (id_livro, chave primária automática; titulo, obrigatório; autor) e requisicoes (id_requisicao, chave primária automática; data, obrigatória; e as ligações obrigatórias ao leitor e ao livro).', `CREATE TABLE leitores (
  id_leitor INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE livros (
  id_livro INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  autor VARCHAR(100)
);

CREATE TABLE requisicoes (
  id_requisicao INT AUTO_INCREMENT PRIMARY KEY,
  data DATE NOT NULL,
  id_leitor INT NOT NULL,
  id_livro INT NOT NULL,
  FOREIGN KEY (id_leitor) REFERENCES leitores(id_leitor),
  FOREIGN KEY (id_livro) REFERENCES livros(id_livro)
);`, 'Três tabelas: primeiro leitores e livros; depois requisicoes, com duas chaves estrangeiras NOT NULL.', { loose: true, xp: 40 }),
  ] },
  { title: 'Desafio: modelar uma loja online', steps: [
    learn('O cenário', `<p>Uma pequena loja online precisa de uma base de dados. Leia os requisitos com atenção e decida os tipos, as chaves e as restrições. Use exatamente os nomes de tabelas e colunas indicados.</p>
      <ol>
        <li><b>clientes</b> — <code>id_cliente</code> (gerado automaticamente), <code>nome</code> (obrigatório, até 100 caracteres), <code>email</code> (obrigatório e sem repetições), <code>nif</code> (exatamente 9 caracteres, sem repetições).</li>
        <li><b>produtos</b> — <code>id_produto</code> (gerado automaticamente), <code>nome</code> (obrigatório), <code>preco</code> (obrigatório, com 2 casas decimais e sempre maior que 0), <code>stock</code> (inteiro, 0 por omissão).</li>
        <li><b>encomendas</b> — <code>id_encomenda</code> (gerado automaticamente), <code>data</code> (obrigatória) e o cliente que a fez (<code>id_cliente</code>, obrigatório). Um cliente que tenha encomendas <b>não pode ser apagado</b>.</li>
        <li><b>linhas_encomenda</b> — cada encomenda tem vários produtos e cada produto aparece em várias encomendas. Para cada produto de uma encomenda guarda-se a <code>quantidade</code> (obrigatória, maior que 0) e o <code>preco_unitario</code> (com 2 casas decimais). O mesmo produto não pode aparecer duas vezes na mesma encomenda e, se a encomenda for apagada, as suas linhas são apagadas também.</li>
      </ol>
      <p>Pense na ordem de criação das tabelas e no tipo de relação entre encomendas e produtos. A verificação aceita tamanhos de texto diferentes dos da solução, mas confirma os tipos, as chaves, as relações e as restrições pedidas.</p>`),
    ddl('Escreva as instruções CREATE TABLE para as quatro tabelas da loja online (clientes, produtos, encomendas e linhas_encomenda).', `CREATE TABLE clientes (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  nif CHAR(9) UNIQUE
);

CREATE TABLE produtos (
  id_produto INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  preco DECIMAL(8,2) NOT NULL CHECK (preco > 0),
  stock INT DEFAULT 0
);

CREATE TABLE encomendas (
  id_encomenda INT AUTO_INCREMENT PRIMARY KEY,
  data DATE NOT NULL,
  id_cliente INT NOT NULL,
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE RESTRICT
);

CREATE TABLE linhas_encomenda (
  id_encomenda INT,
  id_produto INT,
  quantidade INT NOT NULL CHECK (quantidade > 0),
  preco_unitario DECIMAL(8,2),
  PRIMARY KEY (id_encomenda, id_produto),
  FOREIGN KEY (id_encomenda) REFERENCES encomendas(id_encomenda) ON DELETE CASCADE,
  FOREIGN KEY (id_produto) REFERENCES produtos(id_produto)
);`, 'Ordem: clientes, produtos, encomendas, linhas_encomenda. A tabela linhas_encomenda é uma tabela de ligação (N:M) com chave primária composta.', { loose: true, xp: 60 }),
  ] }],
  cheat: [
    ['CREATE DATABASE [IF NOT EXISTS] bd;', 'Criar base de dados'], ['USE bd;', 'Selecionar a base de dados ativa'], ['DROP DATABASE bd;', 'Eliminar base de dados'],
    ['CREATE TABLE t (col TIPO [restrições], …);', 'Criar tabela'], ['id_tabela INT AUTO_INCREMENT PRIMARY KEY', 'Chave primária automática (id_ + nome da tabela)'],
    ['NOT NULL · UNIQUE · DEFAULT v', 'Restrições de coluna'], ['CHAR(9) · VARCHAR(100) · DECIMAL(8,2) · DATE', 'Tipos frequentes'],
    ['FOREIGN KEY (id_t2) REFERENCES t2(id_t2)', 'Chave estrangeira (relação 1:N)'], ['… ON DELETE RESTRICT | CASCADE | SET NULL', 'O que acontece ao apagar o "pai"'],
    ['PRIMARY KEY (id_a, id_b)', 'Chave primária composta (tabela de ligação N:M)'],
    ['DESCRIBE t; · SHOW TABLES;', 'Ver estrutura / listar tabelas'], ['ALTER TABLE t ADD COLUMN c TIPO [AFTER x];', 'Acrescentar coluna'],
    ['ALTER TABLE t MODIFY c TIPO …;', 'Alterar tipo/restrições'], ['ALTER TABLE t RENAME COLUMN a TO b;', 'Mudar o nome de uma coluna'], ['ALTER TABLE t CHANGE a b TIPO …;', 'Mudar nome e definição'],
    ['ALTER TABLE t ADD CONSTRAINT fk_x FOREIGN KEY (…) REFERENCES …;', 'Acrescentar chave estrangeira'], ['ALTER TABLE t DROP FOREIGN KEY fk_x;', 'Remover chave estrangeira'],
    ['ALTER TABLE t DROP COLUMN c;', 'Remover coluna'], ['DROP TABLE filho; DROP TABLE pai;', 'Eliminar tabelas (primeiro o "filho")'],
  ],
  test: [
    quiz('Que comando seleciona a base de dados ativa?', ['SELECT DATABASE escola', 'USE escola', 'OPEN escola', 'SET escola'], 1, 'USE nome;'),
    quiz('Qual a função de AUTO_INCREMENT?', ['Aumentar o tamanho da tabela', 'Gerar automaticamente valores sequenciais', 'Aumentar a velocidade', 'Fazer backup automático'], 1, '1, 2, 3, …'),
    quiz('Qual o tipo mais adequado para um código postal como 1000-001?', ['INT', 'CHAR(8)', 'DECIMAL(8,0)', 'DATE'], 1, 'Código de tamanho fixo com hífen: CHAR(8).'),
    quiz('Numa relação 1:N, onde se coloca a chave estrangeira?', ['Na tabela do lado "um"', 'Na tabela do lado "muitos"', 'Em ambas', 'Numa tabela de ligação'], 1, 'Ex.: id_cliente fica em encomendas.'),
    quiz('O que faz ON DELETE CASCADE?', ['Impede apagar o registo pai', 'Apaga também os registos filhos', 'Põe NULL nos filhos', 'Faz uma cópia antes de apagar'], 1, 'Os filhos são apagados com o pai.'),
    quiz('Que ação é aplicada se não se indicar ON DELETE?', ['CASCADE', 'SET NULL', 'RESTRICT (a eliminação é recusada se existirem filhos)', 'Nenhuma: os filhos ficam órfãos'], 2, 'O MySQL protege os dados por omissão.'),
    quiz('Como se representa uma relação muitos-para-muitos?', ['Com uma chave estrangeira em cada tabela', 'Com uma tabela de ligação com as duas chaves estrangeiras', 'Com uma coluna com vários valores', 'Com uma vista'], 1, 'A tabela de ligação divide a relação em duas relações 1:N.'),
    quiz('Qual a chave primária habitual da tabela de ligação inscricoes(id_aluno, id_disciplina)?', ['id_aluno', 'id_disciplina', 'PRIMARY KEY (id_aluno, id_disciplina)', 'Não tem chave primária'], 2, 'Chave composta: impede inscrições repetidas.'),
    quiz('Qual a diferença entre MODIFY e RENAME COLUMN?', ['Nenhuma', 'MODIFY altera o tipo/restrições; RENAME COLUMN só muda o nome', 'RENAME COLUMN altera o tipo', 'MODIFY apaga a coluna'], 1, 'CHANGE faz as duas coisas.'),
    quiz('Porque não se consegue eliminar a tabela clientes antes de encomendas?', ['Porque é maior', 'Porque encomendas tem uma chave estrangeira que referencia clientes', 'Porque tem AUTO_INCREMENT', 'Porque foi criada primeiro'], 1, 'Elimina-se primeiro o "filho".'),
    quiz('Que problema resolve a normalização?', ['Torna as consultas mais curtas', 'Elimina dados repetidos e as anomalias que eles causam', 'Cifra os dados', 'Cria índices automaticamente'], 1, 'Cada facto fica guardado uma só vez.'),
    quiz('Uma coluna telefones com o valor «912000000, 935000000» viola…', ['a 1FN', 'a 2FN', 'a 3FN', 'nenhuma forma normal'], 0, 'A 1FN exige valores atómicos.'),
    quiz('Que restrição deve ter uma chave estrangeira obrigatória?', ['UNIQUE', 'NOT NULL', 'DEFAULT 0', 'AUTO_INCREMENT'], 1, 'Se a relação é obrigatória, a coluna não aceita NULL.'),
    quiz('Que comando acrescenta uma coluna a uma tabela existente?', ['UPDATE TABLE … ADD', 'ALTER TABLE … ADD COLUMN', 'INSERT COLUMN', 'MODIFY TABLE'], 1, 'ALTER TABLE t ADD COLUMN c TIPO;'),
    quiz('Que tipo de dados usa normalmente uma chave estrangeira que referencia id_cliente INT?', ['VARCHAR(10)', 'INT', 'DECIMAL', 'O tipo não importa'], 1, 'Tem de ser do mesmo tipo da chave referenciada.'),
    predict('O que acontece ao executar esta instrução se a tabela clientes ainda não existir?', 'CREATE TABLE encomendas (\n  id_encomenda INT AUTO_INCREMENT PRIMARY KEY,\n  id_cliente INT NOT NULL,\n  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)\n);', ['A tabela é criada sem chave estrangeira', 'O MySQL recusa: a tabela referenciada tem de existir primeiro', 'A tabela clientes é criada automaticamente', 'A chave estrangeira fica desativada'], 1, 'O "pai" cria-se antes do "filho" (ERROR 1824).'),
  ],
  real: [
    'Criar a base de dados <code>pratica</code> com <code>CREATE DATABASE pratica CHARACTER SET utf8mb4;</code> e ativá-la com <code>USE</code>.',
    'Criar as tabelas <code>clientes</code> e <code>encomendas</code> (com chave estrangeira) e confirmar com <code>DESCRIBE</code> e <code>SHOW CREATE TABLE encomendas;</code>.',
    'Tentar inserir uma encomenda de um cliente que não existe e ler o erro <b>1452</b> (integridade referencial).',
    'Tentar eliminar <code>clientes</code> antes de <code>encomendas</code> e ler o erro <b>3730</b>; depois eliminar pela ordem certa.',
    'Desenhar o diagrama da BD no MySQL Workbench (Database → Reverse Engineer) e verificar as relações.',
  ],
  practice: [
    ddl('Já existe a tabela categorias. Crie a tabela artigos com id_artigo (chave primária automática), nome (VARCHAR(80), obrigatório), preco (DECIMAL(8,2)) e id_categoria (obrigatório), ligada a categorias.', `CREATE TABLE artigos (
  id_artigo INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  preco DECIMAL(8,2),
  id_categoria INT NOT NULL,
  FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);`, 'FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)', { setup: 'CREATE TABLE categorias (\n  id_categoria INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(50) NOT NULL\n);' }),
    ddl('Acrescente à tabela clientes a coluna data_nascimento (DATE).', 'ALTER TABLE clientes ADD COLUMN data_nascimento DATE;', 'ALTER TABLE … ADD COLUMN …', { setup: 'CREATE TABLE clientes (\n  id_cliente INT AUTO_INCREMENT PRIMARY KEY,\n  nome VARCHAR(80) NOT NULL\n);' }),
  ],
},
/* =============================== 3 =============================== */
{
  id: 'dml', icon: 'edit', title: 'Inserir, alterar e eliminar dados',
  desc: 'INSERT, UPDATE, DELETE e TRUNCATE.',
  lessons: [
  { title: 'INSERT — inserir dados', steps: [
    learn('Inserir uma linha', `<p>Adicionam-se linhas a uma tabela com <code>INSERT INTO</code>, indicando as colunas e os respetivos valores, pela mesma ordem:</p>`,
      [ex("INSERT INTO cursos (nome, horas)\nVALUES ('Marketing', 700);", 'O id_curso é gerado pelo AUTO_INCREMENT.')]),
    dml("Insira na tabela cursos o curso 'Direito' com 1000 horas (o id_curso é gerado automaticamente).", "INSERT INTO cursos (nome, horas) VALUES ('Direito', 1000);", "INSERT INTO cursos (nome, horas) VALUES ('…', …);"),
    learn('Texto, números e datas', `<p>Texto e datas escrevem-se entre <b>plicas</b> (<code>'Ana'</code>, <code>'2025-09-15'</code>); números escrevem-se sem plicas. Uma coluna sem valor indica-se com <code>NULL</code>.</p>
      <p>Indicar a lista de colunas é uma boa prática: o código fica claro e continua a funcionar se a estrutura da tabela mudar.</p>`),
    quiz('Como se escreve um valor de texto num INSERT?', ['Sem delimitadores', "Entre plicas: 'texto'", 'Entre parênteses retos', 'Com cardinal: #texto'], 1, 'Texto e datas usam plicas.'),
    learn('Inserir várias linhas', `<p>É possível inserir várias linhas numa só instrução, separando cada conjunto de valores por vírgulas:</p>`,
      [ex("INSERT INTO cursos (nome, horas) VALUES\n  ('Turismo', 600),\n  ('Música', 500);", 'Duas linhas numa só instrução.')]),
    dml("Numa só instrução, insira em cursos os cursos 'Artes' com 600 horas e 'Teatro' com 450 horas.", "INSERT INTO cursos (nome, horas) VALUES ('Artes', 600), ('Teatro', 450);", 'VALUES (…), (…);'),
    key('m1', dml("O aluno João Ramos (id_aluno 10) ainda não tem notas. Registe-lhe 14 a 'Bases de Dados' e 12 a 'Matemática'.", "INSERT INTO notas (id_aluno, disciplina, nota) VALUES (10, 'Bases de Dados', 14), (10, 'Matemática', 12);", 'Duas linhas na tabela notas: (10, …, …), (10, …, …)')),
  ] },
  { title: 'UPDATE — alterar dados', steps: [
    learn('UPDATE com WHERE', `<p><code>UPDATE</code> modifica linhas existentes. <code>SET</code> indica as novas colunas/valores e <code>WHERE</code> escolhe <b>quais</b> linhas alterar:</p>`,
      [ex("UPDATE alunos\nSET cidade = 'Évora'\nWHERE id_aluno = 3;", 'Só altera a linha com id_aluno 3.')]),
    dml('Altere a idade do aluno com id_aluno 5 para 22.', 'UPDATE alunos SET idade = 22 WHERE id_aluno = 5;', 'UPDATE alunos SET … WHERE …'),
    learn('Cuidado com o WHERE', `<p class="warn"><b>Sem WHERE, todas as linhas da tabela são alteradas.</b></p>
      <p>Boa prática: antes de um UPDATE importante, execute um <code>SELECT</code> com o mesmo WHERE para confirmar quais as linhas afetadas. O MySQL Workbench tem o modo <i>safe updates</i>, que recusa UPDATE/DELETE sem WHERE sobre uma chave.</p>`),
    quiz('O que acontece num UPDATE sem WHERE?', ['Dá sempre erro', 'Nada é alterado', 'Todas as linhas da tabela são alteradas', 'Só a primeira linha é alterada'], 2, 'Sem WHERE o UPDATE atinge a tabela inteira.'),
    learn('Expressões e várias colunas', `<p>O novo valor pode ser calculado a partir do atual, e podem alterar-se várias colunas separadas por vírgulas:</p>`,
      [ex("UPDATE notas SET nota = nota + 1\nWHERE disciplina = 'Programação';", 'Soma 1 valor a todas as notas de Programação.'), ex("UPDATE alunos SET idade = 21, cidade = 'Faro' WHERE id_aluno = 1;", 'Duas colunas de uma vez.')]),
    dml('Aumente em 100 as horas de todos os cursos.', 'UPDATE cursos SET horas = horas + 100;', 'SET horas = horas + 100'),
    learn('Condições no WHERE: comparar e combinar', `<p>O <code>WHERE</code> aceita qualquer condição que seja verdadeira ou falsa para cada linha. As mais usadas:</p>
      <table><tr><th>Operador</th><th>Significado</th><th>Exemplo</th></tr>
      <tr><td><code>=</code> / <code>&lt;&gt;</code></td><td>igual / diferente</td><td><code>cidade = 'Porto'</code></td></tr>
      <tr><td><code>&gt;</code> / <code>&lt;</code></td><td>maior / menor</td><td><code>idade &gt; 22</code></td></tr>
      <tr><td><code>&gt;=</code> / <code>&lt;=</code></td><td>maior ou igual / menor ou igual</td><td><code>nota &lt;= 9</code></td></tr>
      <tr><td><code>AND</code></td><td>as duas condições têm de ser verdadeiras</td><td><code>cidade = 'Porto' AND idade &gt; 20</code></td></tr>
      <tr><td><code>OR</code></td><td>basta uma ser verdadeira</td><td><code>cidade = 'Porto' OR cidade = 'Braga'</code></td></tr></table>
      <p>As datas comparam-se como o texto, entre plicas: <code>data &lt; '2025-07-01'</code> significa "antes de 1 de julho de 2025". No capítulo 4 (SELECT) verá ainda <code>IN</code>, <code>BETWEEN</code> e <code>LIKE</code>.</p>`,
      [ex("UPDATE alunos SET cidade = 'Faro'\nWHERE idade > 22 AND cidade = 'Braga';", 'Só os alunos de Braga com mais de 22 anos.')]),
    key('p1', predict('Quantas linhas altera esta instrução na BD escola?', "UPDATE alunos SET cidade = 'Faro'\nWHERE idade > 22;", ['Nenhuma', '3', '5', 'Todas (10)'], 1, 'Só os alunos com mais de 22 anos: Diogo (24), Filipe (23) e Hugo (25).')),
    key('f1', dml('Um colega queria mudar para 1000 as horas do curso de Gestão, mas a instrução abaixo alteraria todos os cursos. Corrija-a antes de a executar.', 'UPDATE cursos SET horas = 1000 WHERE id_curso = 2;', "Falta o WHERE: só o curso de Gestão (id_curso 2 ou nome = 'Gestão').", { start: 'UPDATE cursos SET horas = 1000;' })),
  ] },
  { title: 'DELETE e TRUNCATE', steps: [
    learn('DELETE', `<p><code>DELETE</code> remove linhas. Tal como no UPDATE, o <code>WHERE</code> indica quais — sem ele, a tabela fica vazia!</p>`, [ex('DELETE FROM alunos WHERE id_aluno = 10;', 'Remove apenas o aluno com id_aluno 10.')]),
    dml('Elimine da tabela alunos o aluno com id_aluno 7.', 'DELETE FROM alunos WHERE id_aluno = 7;', 'DELETE FROM … WHERE …'),
    learn('TRUNCATE', `<p><code>TRUNCATE TABLE t;</code> esvazia a tabela inteira de forma muito rápida e reinicia o contador <code>AUTO_INCREMENT</code>. Não aceita WHERE e mantém a estrutura da tabela.</p>`),
    quiz('Qual a diferença principal entre DELETE e TRUNCATE?', ['Não há diferença', 'TRUNCATE esvazia a tabela inteira rapidamente; DELETE aceita WHERE', 'TRUNCATE elimina também a estrutura', 'DELETE é mais rápido em tabelas grandes'], 1, 'TRUNCATE não aceita WHERE.'),
    code('Esvazie completamente a tabela registos, da forma mais rápida.', ['^truncate( table)? registos$'], 'TRUNCATE TABLE registos;', 'TRUNCATE TABLE …'),
    key('m1', dml('As notas negativas (inferiores a 10) foram anuladas. Elimine-as da tabela notas.', 'DELETE FROM notas WHERE nota < 10;', 'DELETE FROM notas WHERE nota < …')),
  ] },
  { key: 'loja', title: 'Manter os dados de uma loja', steps: [
    learn('A base de dados loja', `<p>Até aqui trabalhou com a pequena BD <b>escola</b>. A partir de agora vai também usar a BD <b>loja</b>, mais realista: 30 clientes, 18 produtos, 80 encomendas de 2024 e 2025 e as respetivas linhas.</p>
      <ul><li><code>clientes(id_cliente, nome, email, cidade, data_registo)</code></li><li><code>produtos(id_produto, nome, categoria, preco, stock)</code></li>
      <li><code>encomendas(id_encomenda, id_cliente, data, estado)</code></li><li><code>linhas_encomenda(id_encomenda, id_produto, quantidade, preco_unitario)</code></li></ul>
      <p>Use o botão <b>Estrutura das tabelas</b> nos exercícios para ver as colunas e os dados. No laboratório pode escolher a BD loja.</p>`,
      [ex("SELECT * FROM produtos WHERE categoria = 'Livros';", 'Os livros à venda.', 'loja')]),
    dml('A editora aumentou 5% o preço de todos os livros (categoria Livros). Atualize a tabela produtos.', "UPDATE produtos SET preco = preco * 1.05 WHERE categoria = 'Livros';", "SET preco = preco * 1.05 WHERE categoria = 'Livros'", { db: 'loja' }),
    dml("A loja passou a vender o produto 'Mochila', da categoria Desporto, a 35 €, com 20 unidades em stock. Registe-o (o id_produto é automático).", "INSERT INTO produtos (nome, categoria, preco, stock) VALUES ('Mochila', 'Desporto', 35, 20);", 'INSERT INTO produtos (nome, categoria, preco, stock) VALUES (…);', { db: 'loja' }),
    learn('Apagar dados relacionados', `<p>Numa BD real, as linhas de uma encomenda referenciam a encomenda (chave estrangeira). Para apagar encomendas é preciso apagar <b>primeiro</b> as suas linhas — ou ter definido <code>ON DELETE CASCADE</code>.</p>
      <p>Mas a tabela <code>linhas_encomenda</code> não tem a coluna <code>estado</code>: o estado está na tabela <code>encomendas</code>. Para escolher as linhas a apagar usa-se uma <b>subconsulta</b> — uma consulta entre parênteses que devolve uma lista de valores:</p>
      <ol><li><code>SELECT id_encomenda FROM encomendas WHERE estado = 'cancelada'</code> devolve a lista dos números das encomendas canceladas (o <code>SELECT</code> lê dados de uma tabela; é estudado no capítulo 4);</li>
      <li><code>WHERE id_encomenda IN (…)</code> escolhe as linhas cujo <code>id_encomenda</code> está nessa lista.</li></ol>`,
      [ex("DELETE FROM linhas_encomenda\nWHERE id_encomenda IN (SELECT id_encomenda FROM encomendas WHERE estado = 'cancelada');", 'Apaga as linhas das encomendas canceladas (na BD loja).', 'loja')]),
    dml('Elimine da BD as encomendas canceladas, incluindo as suas linhas. Escreva as duas instruções pela ordem certa, separadas por ponto e vírgula.', "DELETE FROM linhas_encomenda WHERE id_encomenda IN (SELECT id_encomenda FROM encomendas WHERE estado = 'cancelada');\nDELETE FROM encomendas WHERE estado = 'cancelada';", 'Primeiro as linhas (com uma subconsulta), depois as encomendas.', { db: 'loja', xp: 25 }),
    dml("As encomendas no estado 'enviada' feitas antes de 1 de julho de 2025 já chegaram ao destino. Atualize o seu estado para 'entregue'.", "UPDATE encomendas SET estado = 'entregue' WHERE estado = 'enviada' AND data < '2025-07-01';", "Duas condições: o estado e a data (as datas comparam-se entre plicas: '2025-07-01').", { db: 'loja' }),
  ] }],
  cheat: [
    ["INSERT INTO t (c1, c2) VALUES (v1, v2);", 'Inserir uma linha'], ["INSERT INTO t (c1, c2) VALUES (…), (…);", 'Inserir várias linhas'],
    ['UPDATE t SET c = v WHERE condição;', 'Alterar linhas'], ['UPDATE t SET c = c + 1 WHERE …;', 'Alterar com expressão'],
    ['DELETE FROM t WHERE condição;', 'Eliminar linhas'], ['TRUNCATE TABLE t;', 'Esvaziar tabela'],
  ],
  test: [
    quiz('Qual a sintaxe correta para inserir um curso?', ["INSERT cursos VALUES nome='Arte'", "INSERT INTO cursos (nome) VALUES ('Arte');", "ADD INTO cursos ('Arte')", "UPDATE cursos ADD ('Arte')"], 1, 'INSERT INTO … (colunas) VALUES (…).'),
    quiz('Como se escreve uma data num INSERT?', ['2025-03-14', "'2025-03-14'", '#2025-03-14#', '(2025,03,14)'], 1, 'Datas entre plicas.'),
    quiz("O que faz UPDATE alunos SET cidade = 'Faro';?", ["Altera a cidade só do primeiro aluno", "Altera a cidade de todos os alunos", "Dá erro por falta de WHERE", "Não altera nada"], 1, 'Sem WHERE afeta todas as linhas.'),
    quiz('Como se aumenta em 10% o preço de todos os produtos?', ['UPDATE produtos SET preco = 10%', 'UPDATE produtos SET preco = preco * 1.1', 'ALTER produtos preco + 10%', 'SET preco += 10'], 1, 'O novo valor pode ser calculado.'),
    quiz('O que faz DELETE FROM alunos; (sem WHERE)?', ['Elimina a tabela', 'Elimina todas as linhas, mantendo a tabela', 'Dá erro', 'Elimina a primeira linha'], 1, 'A estrutura mantém-se.'),
    quiz('Qual destes comandos aceita WHERE?', ['TRUNCATE', 'DELETE', 'DROP TABLE', 'CREATE TABLE'], 1, 'Só o DELETE filtra linhas.'),
    quiz('Que comando esvazia toda a tabela de forma rápida e reinicia o AUTO_INCREMENT?', ['DELETE FROM t WHERE 1', 'DROP TABLE t', 'TRUNCATE TABLE t', 'UPDATE t SET coluna = 0'], 2, 'TRUNCATE mantém a estrutura mas apaga todas as linhas.'),
    quiz('Antes de executar um UPDATE ou DELETE importante, qual é a boa prática?', ['Desligar o servidor', 'Testar primeiro o WHERE com um SELECT', 'Apagar os índices', 'Usar sempre TRUNCATE'], 1, 'O SELECT mostra exatamente que linhas vão ser afetadas.'),
    predict('Quantas linhas ficam na tabela alunos (10 linhas) depois desta instrução?', 'DELETE FROM alunos WHERE cidade = \'Lisboa\';', ['0', '6', '4', '10'], 1, 'Há 4 alunos de Lisboa: ficam 6.'),
    quiz('Que instrução regista um aluno sem indicar o id_aluno (AUTO_INCREMENT)?', ["INSERT INTO alunos VALUES ('Rita', 20)", "INSERT INTO alunos (nome, idade) VALUES ('Rita', 20)", "INSERT alunos SET id_aluno = AUTO", "UPDATE alunos ADD ('Rita', 20)"], 1, 'Indica-se a lista de colunas; o id é gerado automaticamente.'),
    quiz('Como se alteram duas colunas na mesma instrução?', ['UPDATE t SET a = 1 AND b = 2', 'UPDATE t SET a = 1, b = 2', 'UPDATE t SET (a, b) = 1, 2', 'São precisas duas instruções'], 1, 'As atribuições separam-se por vírgulas.'),
    quiz('Porque é que o MySQL pode recusar DELETE FROM encomendas WHERE id_encomenda = 5?', ['Porque falta LIMIT', 'Porque existem linhas de encomenda que a referenciam (chave estrangeira)', 'Porque DELETE não aceita WHERE', 'Porque a tabela tem AUTO_INCREMENT'], 1, 'A integridade referencial impede deixar linhas "órfãs" (a não ser com ON DELETE CASCADE).'),
    quiz('Que instrução apaga apenas os produtos sem stock?', ['DELETE produtos WHERE stock = 0', 'DELETE FROM produtos WHERE stock = 0', 'DROP produtos WHERE stock = 0', 'TRUNCATE produtos WHERE stock = 0'], 1, 'DELETE FROM … WHERE …'),
    predict('O que acontece a esta instrução?', "UPDATE cursos SET horas = horas * 2\nWHERE nome = 'Gestão';", ['Duplica as horas de todos os cursos', 'Duplica as horas apenas do curso de Gestão', 'Dá erro: não se pode usar a própria coluna', 'Põe as horas a 2'], 1, 'O novo valor é calculado a partir do atual, só nas linhas do WHERE.'),
    quiz('Como se insere um valor desconhecido numa coluna que aceita nulos?', ["''", '0', 'NULL', "'NULL'"], 2, "NULL sem plicas; 'NULL' seria o texto NULL."),
    quiz('Que cuidado ter antes de um DELETE com WHERE?', ['Nenhum', 'Executar primeiro um SELECT com o mesmo WHERE para ver as linhas afetadas', 'Fazer TRUNCATE', 'Desativar as chaves'], 1, 'Assim confirma exatamente o que vai ser apagado.'),
  ],
  real: [
    'Importar a BD <b>loja</b> (botão abaixo) e confirmar com <code>SELECT COUNT(*) FROM loja.encomendas;</code>.',
    'Inserir dois clientes e confirmar o <code>id_cliente</code> gerado com <code>SELECT LAST_INSERT_ID();</code>.',
    'No MySQL Workbench, tentar um <code>UPDATE</code> sem WHERE e observar o aviso do modo <i>safe updates</i> (Error 1175).',
    'Antes de cada UPDATE/DELETE, executar um SELECT com o mesmo WHERE e comparar o número de linhas afetadas.',
    'Tentar apagar uma encomenda que tem linhas e ler o erro <b>1451</b>; depois apagar pela ordem correta.',
  ],
  practice: [
    dml("Registe o curso 'Psicologia' com 1100 horas.", "INSERT INTO cursos (nome, horas) VALUES ('Psicologia', 1100);", "INSERT INTO cursos (nome, horas) VALUES (…);"),
    dml("Os alunos do Porto mudaram-se para Gaia. Atualize a cidade.", "UPDATE alunos SET cidade = 'Gaia' WHERE cidade = 'Porto';", "UPDATE alunos SET cidade = … WHERE cidade = …"),
    dml("Elimine as notas da disciplina de Programação.", "DELETE FROM notas WHERE disciplina = 'Programação';", "DELETE FROM notas WHERE …"),
  ],
},
/* =============================== 4 =============================== */
{
  id: 'select', icon: 'search', title: 'Consultas com SELECT',
  desc: 'O coração do SQL: selecionar, filtrar, ordenar, agrupar e juntar tabelas.',
  lessons: [
  { title: 'O comando SELECT', steps: [
    learn('A base de dados escola', `<p>Neste capítulo vai praticar consultas reais sobre a base de dados <b>escola</b>, que tem três tabelas:</p>
      <ul><li><code>alunos(id_aluno, nome, idade, cidade, id_curso)</code></li><li><code>cursos(id_curso, nome, horas)</code></li><li><code>notas(id_aluno, disciplina, nota)</code></li></ul>
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
    key('p1', predict('Quantas linhas devolve esta consulta?', 'SELECT DISTINCT cidade FROM alunos;', ['10', '4', '3', '1'], 1, 'Há alunos de 4 cidades diferentes: Lisboa, Porto, Braga e Coimbra.')),
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
    viz('Como o MySQL executa uma consulta', `<p>As cláusulas escrevem-se pela ordem <code>SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT</code>, mas o MySQL <b>executa-as por outra ordem</b>: primeiro lê a tabela (FROM), filtra as linhas (WHERE), forma os grupos (GROUP BY), filtra os grupos (HAVING), calcula as colunas (SELECT), ordena (ORDER BY) e só no fim limita (LIMIT).</p>
      <p>Avance passo a passo e veja o que acontece aos dados em cada fase:</p>`,
      { select: 'cidade, COUNT(*) AS qtd, AVG(idade) AS media', from: 'alunos', where: 'idade >= 20', group: 'cidade', having: 'COUNT(*) >= 2', order: 'qtd DESC, cidade', limit: 2 }),
    query('Mostre as cidades com 3 ou mais alunos.', 'SELECT cidade FROM alunos GROUP BY cidade HAVING COUNT(*) >= 3', 'GROUP BY cidade HAVING COUNT(*) >= 3'),
    key('o1', order('Ordene as cláusulas desta consulta, que mostra as 3 disciplinas com melhor média, considerando só as notas positivas e as disciplinas com pelo menos 3 notas.',
      ['SELECT disciplina, AVG(nota) AS media', 'FROM notas', 'WHERE nota >= 10', 'GROUP BY disciplina', 'HAVING COUNT(*) >= 3', 'ORDER BY media DESC', 'LIMIT 3'], 'A ordem de escrita é sempre SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT.')),
    key('p1', predict('Quantas linhas devolve esta consulta?', 'SELECT cidade, COUNT(*)\nFROM alunos\nWHERE idade > 21\nGROUP BY cidade;', ['5', '3', '4', '1'], 1, 'Com mais de 21 anos há alunos do Porto, de Braga e de Lisboa: 3 grupos, 3 linhas.')),
  ] },
  { title: 'Juntar tabelas com JOIN', steps: [
    learn('INNER JOIN', `<p>Os dados estão repartidos por várias tabelas. O <code>JOIN</code> volta a juntá-los através das colunas relacionadas. O <code>INNER JOIN</code> devolve apenas as combinações que têm correspondência nas duas tabelas:</p>
      <p>Os <b>aliases</b> de tabela (<code>a</code>, <code>c</code>) encurtam a escrita e evitam ambiguidades (as duas tabelas têm uma coluna <code>nome</code>).</p>`,
      [ex('SELECT a.nome, c.nome AS curso\nFROM alunos a\nINNER JOIN cursos c ON a.id_curso = c.id_curso;', 'Cada aluno com o nome do seu curso.', true)]),
    query('Mostre o nome de cada aluno com a disciplina e a nota (tabelas alunos e notas).', 'SELECT a.nome, n.disciplina, n.nota FROM alunos a INNER JOIN notas n ON n.id_aluno = a.id_aluno', 'JOIN notas n ON n.id_aluno = a.id_aluno'),
    learn('JOIN com WHERE', `<p>Depois de juntar as tabelas, pode filtrar por colunas de qualquer uma delas:</p>`,
      [ex("SELECT a.nome FROM alunos a\nJOIN cursos c ON a.id_curso = c.id_curso\nWHERE c.nome = 'Design';", 'Alunos do curso de Design.', true)]),
    query("Mostre o nome dos alunos do curso de Informática.", "SELECT a.nome FROM alunos a INNER JOIN cursos c ON a.id_curso = c.id_curso WHERE c.nome = 'Informática'", "WHERE c.nome = 'Informática'"),
    learn('LEFT JOIN', `<p>O <code>LEFT JOIN</code> devolve <b>todas</b> as linhas da tabela da esquerda, mesmo as que não têm correspondência; nesse caso as colunas da direita ficam a <code>NULL</code>. Para testar valores nulos usa-se <code>IS NULL</code> (nunca <code>= NULL</code>).</p>`,
      [ex('SELECT a.nome, n.nota\nFROM alunos a LEFT JOIN notas n ON n.id_aluno = a.id_aluno;', 'O João aparece com nota NULL.', true)]),
    query('Usando LEFT JOIN, mostre o nome dos alunos que não têm nenhuma nota.', 'SELECT a.nome FROM alunos a LEFT JOIN notas n ON n.id_aluno = a.id_aluno WHERE n.id_aluno IS NULL', 'LEFT JOIN … WHERE n.id_aluno IS NULL'),
    learn('JOIN com GROUP BY', `<p>JOIN e agregações combinam-se naturalmente — por exemplo, a média de cada aluno:</p>`,
      [ex('SELECT a.nome, AVG(n.nota) AS media\nFROM alunos a JOIN notas n ON n.id_aluno = a.id_aluno\nGROUP BY a.nome;', 'Média de notas por aluno.', true)]),
    query('Mostre o nome de cada curso e o número de alunos inscritos.', 'SELECT c.nome, COUNT(*) FROM cursos c INNER JOIN alunos a ON a.id_curso = c.id_curso GROUP BY c.nome', 'JOIN + GROUP BY c.nome'),
    key('f1', query('Corrija a consulta abaixo: devia mostrar o nome dos alunos e as notas iguais ou superiores a 15, mas as duas tabelas têm a coluna id_aluno e a junção fica ambígua. Use aliases (a, n).', 'SELECT a.nome, n.nota FROM alunos a JOIN notas n ON n.id_aluno = a.id_aluno WHERE n.nota >= 15', 'FROM alunos a JOIN notas n ON n.id_aluno = a.id_aluno', false, { start: 'SELECT nome, nota\nFROM alunos JOIN notas ON id_aluno = id_aluno\nWHERE nota >= 15;' })),
  ] },
  { title: 'Subconsultas', steps: [
    learn('Subconsulta escalar', `<p>Uma <b>subconsulta</b> é um SELECT dentro de outro. Quando devolve um único valor, pode ser usada numa comparação:</p>`,
      [ex('SELECT nome, idade FROM alunos\nWHERE idade > (SELECT AVG(idade) FROM alunos);', 'Alunos com idade acima da média (21,5).', true)]),
    query('Mostre o nome dos cursos com mais horas do que a média de horas dos cursos.', 'SELECT nome FROM cursos WHERE horas > (SELECT AVG(horas) FROM cursos)', '(SELECT AVG(horas) FROM cursos)'),
    learn('Subconsulta com IN', `<p>Quando a subconsulta devolve uma lista de valores, usa-se com <code>IN</code>:</p>`,
      [ex("SELECT nome FROM alunos\nWHERE id_aluno IN (SELECT id_aluno FROM notas WHERE disciplina = 'Programação');", 'Alunos com nota a Programação.', true),
       ex('SELECT nome FROM alunos\nWHERE id_aluno NOT IN (SELECT id_aluno FROM notas);', 'NOT IN faz o contrário: alunos que não aparecem na lista, ou seja, sem nenhuma nota.', true)]),
    query('Mostre o nome dos alunos que têm alguma nota igual ou superior a 17 (use IN com subconsulta).', 'SELECT nome FROM alunos WHERE id_aluno IN (SELECT id_aluno FROM notas WHERE nota >= 17)', 'WHERE id_aluno IN (SELECT id_aluno FROM notas …)'),
  ] },
  { key: 'func', title: 'Funções de texto, números e datas', steps: [
    learn('Funções de texto', `<p>As funções transformam os valores de cada linha:</p>
      <table><tr><th>Função</th><th>Exemplo</th><th>Resultado</th></tr>
      <tr><td><code>UPPER(t)</code> / <code>LOWER(t)</code></td><td><code>UPPER('Ana')</code></td><td>ANA</td></tr>
      <tr><td><code>LENGTH(t)</code></td><td><code>LENGTH('Porto')</code></td><td>5</td></tr>
      <tr><td><code>CONCAT(a, b, …)</code></td><td><code>CONCAT(nome, ' (', cidade, ')')</code></td><td>Ana Silva (Lisboa)</td></tr>
      <tr><td><code>LEFT(t, n)</code></td><td><code>LEFT('Lisboa', 3)</code></td><td>Lis</td></tr>
      <tr><td><code>SUBSTRING(t, início, n)</code></td><td><code>SUBSTRING('Bases', 2, 3)</code></td><td>ase</td></tr>
      <tr><td><code>TRIM(t)</code> / <code>REPLACE(t, a, b)</code></td><td><code>REPLACE('a-b', '-', '/')</code></td><td>a/b</td></tr></table>`,
      [ex("SELECT CONCAT(nome, ' (', cidade, ')') AS aluno, LENGTH(nome) AS letras\nFROM alunos;", 'Junta duas colunas e conta as letras do nome.', true)]),
    query('Mostre o nome de cada curso em maiúsculas e as primeiras 3 letras do nome (como sigla).', 'SELECT UPPER(nome), LEFT(nome, 3) FROM cursos', 'UPPER(nome), LEFT(nome, 3)'),
    learn('Funções numéricas', `<p><code>ROUND(x, d)</code> arredonda a <i>d</i> casas decimais; <code>FLOOR</code> e <code>CEIL</code> arredondam para baixo e para cima. As médias costumam ser arredondadas:</p>`,
      [ex('SELECT disciplina, ROUND(AVG(nota), 1) AS media\nFROM notas GROUP BY disciplina;', 'Média com uma casa decimal.', true)]),
    query('Na BD loja, mostre o nome e o preço com IVA (23%) de cada produto, arredondado a 2 casas decimais, com o nome preco_iva.', 'SELECT nome, ROUND(preco * 1.23, 2) AS preco_iva FROM produtos', 'ROUND(preco * 1.23, 2)', false, { db: 'loja' }),
    learn('Funções de datas', `<p>As datas guardam-se como <code>'AAAA-MM-DD'</code> e comparam-se como texto (<code>data &gt;= '2025-01-01'</code>). Funções úteis:</p>
      <table><tr><th>Função</th><th>Devolve</th></tr>
      <tr><td><code>CURDATE()</code></td><td>a data de hoje</td></tr>
      <tr><td><code>YEAR(d)</code>, <code>MONTH(d)</code>, <code>DAY(d)</code></td><td>o ano, o mês e o dia</td></tr>
      <tr><td><code>DATEDIFF(d1, d2)</code></td><td>o número de dias entre d2 e d1</td></tr>
      <tr><td><code>DATE_FORMAT(d, '%d/%m/%Y')</code></td><td>a data no formato português, ex.: 14/03/2025</td></tr></table>`,
      [ex("SELECT id_encomenda, DATE_FORMAT(data, '%d/%m/%Y') AS data_pt,\n       DATEDIFF('2025-12-31', data) AS dias_ate_fim_2025\nFROM encomendas\nWHERE YEAR(data) = 2025;", 'Na BD loja: encomendas de 2025.', 'loja')]),
    query('Na BD loja, quantas encomendas foram feitas em cada ano? Mostre o ano e o número de encomendas.', 'SELECT YEAR(data), COUNT(*) FROM encomendas GROUP BY YEAR(data)', 'SELECT YEAR(data), COUNT(*) … GROUP BY YEAR(data)', false, { db: 'loja' }),
    query("Na BD loja, mostre o id_encomenda e a data no formato dia/mês/ano das encomendas do cliente 3.", "SELECT id_encomenda, DATE_FORMAT(data, '%d/%m/%Y') FROM encomendas WHERE id_cliente = 3", "DATE_FORMAT(data, '%d/%m/%Y')", false, { db: 'loja' }),
  ] },
  { key: 'case', title: 'CASE e valores nulos (IFNULL, COALESCE)', steps: [
    learn('CASE — decidir dentro da consulta', `<p><code>CASE</code> devolve um valor diferente consoante uma condição — é o "se… então… senão" do SQL:</p>`,
      [ex("SELECT nome, nota,\n  CASE WHEN nota >= 18 THEN 'Excelente'\n       WHEN nota >= 10 THEN 'Aprovado'\n       ELSE 'Reprovado' END AS resultado\nFROM alunos a JOIN notas n ON n.id_aluno = a.id_aluno;", 'As condições são avaliadas por ordem; a primeira verdadeira ganha.', true)]),
    query("Na BD loja, mostre o nome de cada produto e uma coluna gama: 'alta' se o preço for 100 € ou mais, 'média' se for 30 € ou mais e 'baixa' nos restantes.", "SELECT nome, CASE WHEN preco >= 100 THEN 'alta' WHEN preco >= 30 THEN 'média' ELSE 'baixa' END AS gama FROM produtos", "CASE WHEN preco >= 100 THEN 'alta' WHEN … ELSE 'baixa' END", false, { db: 'loja' }),
    learn('NULL nas contas e nas funções', `<p><code>NULL</code> significa "valor desconhecido". Qualquer conta com NULL dá NULL, e <code>COUNT(coluna)</code> não conta os nulos (ao contrário de <code>COUNT(*)</code>).</p>
      <p><code>IFNULL(x, valor)</code> e <code>COALESCE(x, y, …)</code> substituem os nulos por um valor:</p>`,
      [ex("SELECT nome, IFNULL(email, '(sem email)') AS contacto FROM clientes;", 'Na BD loja: alguns clientes não indicaram email.', 'loja')]),
    predict('Na BD loja há 30 clientes e 3 não têm email. Quanto devolvem estas duas colunas?', 'SELECT COUNT(*), COUNT(email) FROM clientes;', ['30 e 30', '30 e 27', '27 e 27', '27 e 30'], 1, 'COUNT(*) conta linhas; COUNT(email) ignora os NULL.'),
    query("Na BD loja, mostre o nome e o email de cada cliente de Lisboa; quando o email for desconhecido, mostre 'sem email'.", "SELECT nome, IFNULL(email, 'sem email') FROM clientes WHERE cidade = 'Lisboa'", "IFNULL(email, 'sem email')", false, { db: 'loja' }),
  ] },
  { key: 'join3', title: 'Juntar três tabelas e UNION', steps: [
    learn('JOIN de três tabelas', `<p>Para responder a muitas perguntas é preciso atravessar várias tabelas. Na BD loja, para saber <b>que produtos</b> comprou <b>cada cliente</b> passa-se por <code>clientes → encomendas → linhas_encomenda → produtos</code>. Cada <code>JOIN</code> acrescenta uma tabela e a sua condição de ligação:</p>`,
      [ex("SELECT c.nome AS cliente, e.data, l.quantidade\nFROM clientes c\nJOIN encomendas e ON e.id_cliente = c.id_cliente\nJOIN linhas_encomenda l ON l.id_encomenda = e.id_encomenda\nWHERE c.id_cliente = 1;", 'Três tabelas: o cliente, as suas encomendas e as linhas de cada encomenda.', 'loja')]),
    query('Na BD loja, mostre o nome do produto e a quantidade de cada linha da encomenda 1.', 'SELECT p.nome, l.quantidade FROM linhas_encomenda l JOIN produtos p ON p.id_produto = l.id_produto WHERE l.id_encomenda = 1', 'JOIN produtos p ON p.id_produto = l.id_produto', false, { db: 'loja' }),
    query('Na BD loja, mostre o nome de cada cliente e o valor total gasto (soma de quantidade × preço unitário), considerando todas as encomendas. Chame total à soma.', 'SELECT c.nome, SUM(l.quantidade * l.preco_unitario) AS total FROM clientes c JOIN encomendas e ON e.id_cliente = c.id_cliente JOIN linhas_encomenda l ON l.id_encomenda = e.id_encomenda GROUP BY c.nome', 'Três tabelas e SUM(l.quantidade * l.preco_unitario) … GROUP BY c.nome', false, { db: 'loja', xp: 30 }),
    learn('UNION e UNION ALL', `<p><code>UNION</code> junta, <b>uma por baixo da outra</b>, as linhas de duas consultas com o mesmo número de colunas. Elimina as linhas repetidas; <code>UNION ALL</code> mantém-nas (e é mais rápido).</p>`,
      [ex("SELECT nome, 'aluno' AS tipo FROM alunos WHERE cidade = 'Braga'\nUNION\nSELECT nome, 'curso' FROM cursos;", 'Alunos de Braga e cursos, numa só lista.', true)]),
    predict('Quantas linhas devolve esta consulta?', "SELECT cidade FROM alunos WHERE idade > 22\nUNION\nSELECT cidade FROM alunos WHERE idade < 20;", ['5', '3', '2', '4'], 2, 'Acima de 22: Braga, Lisboa, Braga; abaixo de 20: Lisboa, Lisboa. O UNION elimina os repetidos: Braga e Lisboa.'),
    query("Mostre, numa só lista sem repetições, as cidades dos alunos da BD escola com mais de 22 anos e as dos alunos com menos de 20 anos (use UNION).", "SELECT cidade FROM alunos WHERE idade > 22 UNION SELECT cidade FROM alunos WHERE idade < 20", '… UNION …'),
  ] },
  { key: 'neg', title: 'Perguntas de negócio (BD loja)', steps: [
    learn('Da pergunta à consulta', `<p>No mundo real ninguém pede «faça um JOIN com GROUP BY». Pedem-se respostas: <i>«quais os nossos melhores clientes?»</i>. O trabalho é traduzir a pergunta:</p>
      <ol><li><b>Que dados</b> respondem à pergunta? → colunas e tabelas (<code>SELECT</code>, <code>FROM</code>, <code>JOIN</code>);</li>
      <li><b>Que linhas</b> interessam? → <code>WHERE</code>;</li><li>É preciso <b>resumir</b>? por quê? → <code>GROUP BY</code> e agregações, <code>HAVING</code>;</li>
      <li>Como <b>apresentar</b>? → <code>ORDER BY</code>, <code>LIMIT</code>, aliases.</li></ol>
      <p>Nesta lição, os enunciados são perguntas da direção da loja. Use a estrutura das tabelas e experimente: o resultado esperado é comparado com o seu.</p>`),
    query('A direção quer saber quantos clientes tem em cada cidade, da cidade com mais clientes para a com menos.', 'SELECT cidade, COUNT(*) AS clientes FROM clientes GROUP BY cidade ORDER BY clientes DESC, cidade', 'Agrupe por cidade e ordene pela contagem (empates por cidade).', true, { db: 'loja', xp: 25 }),
    query('Que produtos nunca foram vendidos? Mostre o nome.', 'SELECT nome FROM produtos WHERE id_produto NOT IN (SELECT id_produto FROM linhas_encomenda)', 'Os produtos cujo id não aparece em linhas_encomenda (NOT IN ou LEFT JOIN … IS NULL).', false, { db: 'loja', xp: 25 }),
    query('Quais são os 3 produtos que mais unidades venderam em encomendas que não foram canceladas? Mostre o nome e o total de unidades.', "SELECT p.nome, SUM(l.quantidade) AS unidades FROM produtos p JOIN linhas_encomenda l ON l.id_produto = p.id_produto JOIN encomendas e ON e.id_encomenda = l.id_encomenda WHERE e.estado <> 'cancelada' GROUP BY p.nome ORDER BY unidades DESC LIMIT 3", 'produtos → linhas_encomenda → encomendas; filtre o estado, some a quantidade, ordene e limite.', true, { db: 'loja', xp: 35 }),
    query('Qual foi a faturação (soma de quantidade × preço unitário) de cada mês de 2025, sem contar as encomendas canceladas? Mostre o mês e o valor, por ordem do mês.', "SELECT MONTH(e.data) AS mes, SUM(l.quantidade * l.preco_unitario) AS faturacao FROM encomendas e JOIN linhas_encomenda l ON l.id_encomenda = e.id_encomenda WHERE YEAR(e.data) = 2025 AND e.estado <> 'cancelada' GROUP BY MONTH(e.data) ORDER BY mes", 'GROUP BY MONTH(e.data), com WHERE no ano e no estado.', true, { db: 'loja', xp: 35 }),
    query('Que clientes já fizeram mais de 4 encomendas? Mostre o nome e o número de encomendas.', 'SELECT c.nome, COUNT(*) AS encomendas FROM clientes c JOIN encomendas e ON e.id_cliente = c.id_cliente GROUP BY c.nome HAVING COUNT(*) > 4', 'JOIN + GROUP BY + HAVING COUNT(*) > 4', false, { db: 'loja', xp: 30 }),
    query('Que clientes se registaram mas nunca fizeram nenhuma encomenda? Mostre o nome e a cidade.', 'SELECT c.nome, c.cidade FROM clientes c LEFT JOIN encomendas e ON e.id_cliente = c.id_cliente WHERE e.id_encomenda IS NULL', 'LEFT JOIN encomendas … WHERE e.id_encomenda IS NULL', false, { db: 'loja', xp: 30 }),
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
    predict('Quantas linhas devolve esta consulta na BD escola?', "SELECT nome FROM alunos\nWHERE cidade = 'Porto' OR idade < 20;", ['3', '5', '2', '10'], 1, 'Porto: Bruno, Eva, Inês; menos de 20: Carla e João. Total: 5.'),
    quiz('Qual a ordem correta das cláusulas?', ['SELECT, WHERE, FROM, ORDER BY', 'SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY', 'FROM, SELECT, HAVING, WHERE', 'SELECT, FROM, HAVING, GROUP BY'], 1, 'E LIMIT no fim.'),
    quiz('Que função devolve o número de dias entre duas datas?', ['DAYS()', 'DATEDIFF()', 'YEAR()', 'DATE_FORMAT()'], 1, "DATEDIFF('2025-12-31', data)"),
    quiz('O que devolve COUNT(email) numa tabela com 30 linhas, 3 delas com email NULL?', ['30', '27', '3', 'NULL'], 1, 'COUNT(coluna) ignora os nulos.'),
    quiz('Qual a diferença entre UNION e UNION ALL?', ['Nenhuma', 'UNION elimina as linhas repetidas; UNION ALL mantém-nas', 'UNION ALL junta colunas', 'UNION só funciona com duas tabelas iguais'], 1, 'UNION ALL é mais rápido por não eliminar repetidos.'),
    quiz('Como se mostra um texto alternativo quando o email é NULL?', ["WHERE email = NULL", "IFNULL(email, 'sem email')", "email OR 'sem email'", "CASE email NULL"], 1, 'IFNULL ou COALESCE.'),
    quiz('Para listar os produtos de cada cliente na BD loja, quantos JOIN são precisos (clientes, encomendas, linhas_encomenda, produtos)?', ['1', '2', '3', '4'], 2, 'Quatro tabelas, três junções.'),
    predict('Qual é o resultado desta expressão?', "SELECT CONCAT(LEFT('Lisboa', 3), '-', UPPER('pt'));", ["'Lis-PT'", "'Lisboa-pt'", "'LIS-pt'", 'Erro'], 0, 'LEFT devolve «Lis» e UPPER devolve «PT».'),
  ],
  real: [
    'Importar a BD <b>loja</b> e executar no MySQL Workbench três consultas da lição «Perguntas de negócio».',
    'Usar <code>EXPLAIN</code> antes de uma consulta com JOIN e identificar as tabelas lidas.',
    'Exportar o resultado de uma consulta para CSV no Workbench (botão <i>Export</i> da grelha de resultados).',
    'Escrever uma consulta com <code>DATE_FORMAT</code> e <code>DATEDIFF</code> sobre as encomendas e comparar com o simulador.',
  ],
  practice: [
    query('Mostre o nome e a idade dos alunos de Lisboa, do mais velho para o mais novo.', "SELECT nome, idade FROM alunos WHERE cidade = 'Lisboa' ORDER BY idade DESC", "WHERE cidade = 'Lisboa' ORDER BY idade DESC", true),
    query('Mostre cada disciplina e o número de notas registadas, só para as disciplinas com mais de 4 notas.', 'SELECT disciplina, COUNT(*) FROM notas GROUP BY disciplina HAVING COUNT(*) > 4', 'GROUP BY disciplina HAVING COUNT(*) > 4'),
    query('Mostre o nome dos alunos do curso de Gestão (use JOIN).', "SELECT a.nome FROM alunos a JOIN cursos c ON c.id_curso = a.id_curso WHERE c.nome = 'Gestão'", "JOIN cursos … WHERE c.nome = 'Gestão'"),
    query('Na BD loja, mostre a categoria e o preço médio dos produtos de cada categoria, arredondado a 2 casas decimais.', 'SELECT categoria, ROUND(AVG(preco), 2) FROM produtos GROUP BY categoria', 'ROUND(AVG(preco), 2) … GROUP BY categoria', false, { db: 'loja' }),
    query('Na BD loja, quantas encomendas existem em cada estado?', 'SELECT estado, COUNT(*) FROM encomendas GROUP BY estado', 'GROUP BY estado', false, { db: 'loja' }),
  ],
},
/* ========================= restrições, índices e vistas ========================= */
{
  id: 'adv', icon: 'layers', title: 'Restrições, índices e vistas',
  desc: 'CHECK para validar dados, índices para acelerar consultas e vistas (VIEW).',
  lessons: [
  { title: 'Validar dados com CHECK', steps: [
    learn('A restrição CHECK', `<p>Já conhece as restrições <code>NOT NULL</code>, <code>UNIQUE</code> e <code>DEFAULT</code>, e viu de passagem o <code>CHECK</code> no capítulo 2. Vamos agora aprofundá-lo. A restrição <code>CHECK</code> vai mais longe que as outras: define uma <b>condição</b> que todos os valores têm de cumprir. Se um INSERT ou UPDATE a violar, o MySQL recusa a operação.</p>
      <p>Pode escrever-se junto da coluna ou no fim da definição da tabela:</p>
      <pre><code>CREATE TABLE produtos (
  id_produto INT PRIMARY KEY,
  nome VARCHAR(60) NOT NULL,
  preco DECIMAL(8,2) CHECK (preco > 0),
  stock INT,
  CHECK (stock >= 0)
);</code></pre>
      <p>O MySQL aplica as restrições CHECK a partir da versão 8.0.16.</p>`),
    ddl('Crie a tabela artigos com id_artigo (INT, chave primária), nome (VARCHAR(60)) e preco (DECIMAL(8,2)) com uma restrição CHECK que garanta que o preço é maior que 0.', `CREATE TABLE artigos (
  id_artigo INT PRIMARY KEY,
  nome VARCHAR(60),
  preco DECIMAL(8,2) CHECK (preco > 0)
);`, 'preco DECIMAL(8,2) CHECK (preco > 0)'),
    learn('Quando a regra é violada', `<p>Experimente: a tabela é criada, mas a inserção de um preço negativo é recusada com um erro e a linha <b>não é guardada</b>.</p>`,
      [ex("CREATE TABLE precos (id_preco INT, valor DECIMAL(8,2) CHECK (valor > 0));", 'Cria uma tabela com uma regra de validação.'),
       ex("INSERT INTO precos VALUES (1, -5);", 'No MySQL: ERROR 3819 — Check constraint is violated. Experimente no laboratório.')]),
    quiz('O que acontece a um INSERT que viola uma restrição CHECK?', ['A linha é guardada com o valor corrigido para 0', 'A operação é recusada com um erro e a linha não é guardada', 'A linha é guardada mas fica marcada', 'A restrição é desativada'], 1, 'O CHECK garante que só entram dados válidos.'),
    learn('Restrições com nome e ALTER TABLE', `<p>Dar um <b>nome</b> à restrição torna as mensagens de erro mais claras e permite removê-la mais tarde. Também é possível acrescentar uma restrição a uma tabela que já existe:</p>
      <pre><code>ALTER TABLE alunos ADD CONSTRAINT chk_idade CHECK (idade >= 16);
ALTER TABLE alunos DROP CHECK chk_idade;</code></pre>
      <p>Ao acrescentar a restrição, as linhas que já existem também têm de a cumprir; caso contrário o ALTER TABLE falha.</p>`),
    ddl('Acrescente à tabela notas uma restrição chamada chk_nota que garanta que a nota está entre 0 e 20 (use BETWEEN).', 'ALTER TABLE notas ADD CONSTRAINT chk_nota CHECK (nota BETWEEN 0 AND 20);', 'ALTER TABLE notas ADD CONSTRAINT chk_nota CHECK (…)', { setup: 'CREATE TABLE notas (\n  id_aluno INT,\n  disciplina VARCHAR(50),\n  nota INT\n);' }),
  ] },
  { title: 'Índices', steps: [
    learn('Para que serve um índice', `<p>Um <b>índice</b> funciona como o índice remissivo de um livro: em vez de ler todas as páginas, salta-se diretamente para o sítio certo. Sem índice, para encontrar os alunos de Braga o MySQL tem de percorrer <b>todas</b> as linhas da tabela.</p>
      <p>Os índices aceleram as consultas que filtram (<code>WHERE</code>), juntam (<code>JOIN</code>) ou ordenam (<code>ORDER BY</code>) por essa coluna. A chave primária tem sempre um índice criado automaticamente.</p>`),
    quiz('Qual é a principal vantagem de criar um índice numa coluna?', ['Ocupa menos espaço em disco', 'Torna mais rápidas as pesquisas e junções por essa coluna', 'Impede valores repetidos em qualquer caso', 'Encripta os dados da coluna'], 1, 'O índice evita percorrer a tabela inteira.'),
    learn('CREATE INDEX', `<p>Cria-se um índice dando-lhe um nome e indicando a tabela e a(s) coluna(s). Por convenção os nomes começam por <code>idx_</code>:</p>`,
      [ex('CREATE INDEX idx_alunos_cidade ON alunos (cidade);', 'Acelera pesquisas como WHERE cidade = …'),
       ex('CREATE INDEX idx_notas_aluno_disc ON notas (id_aluno, disciplina);', 'Índice composto, com duas colunas.'),
       ex('CREATE UNIQUE INDEX idx_cursos_nome ON cursos (nome);', 'Índice único: também impede nomes de curso repetidos.')]),
    code('Crie um índice chamado idx_notas_disciplina na coluna disciplina da tabela notas.', [
      '^create index idx_notas_disciplina on notas ?\\(disciplina\\)$',
    ], 'CREATE INDEX idx_notas_disciplina ON notas (disciplina);', 'CREATE INDEX nome ON tabela (coluna);'),
    learn('Consultar e remover índices', `<pre><code>SHOW INDEX FROM alunos;                    -- lista os índices da tabela
DROP INDEX idx_alunos_cidade ON alunos;    -- remove um índice
EXPLAIN SELECT * FROM alunos WHERE cidade = 'Braga';   -- mostra se o índice é usado</code></pre>
      <p>O <code>EXPLAIN</code> mostra o plano de execução: na coluna <code>key</code> aparece o índice escolhido pelo MySQL.</p>`),
    code('Remova o índice idx_alunos_cidade da tabela alunos.', [
      '^drop index idx_alunos_cidade on alunos$', '^alter table alunos drop index idx_alunos_cidade$',
    ], 'DROP INDEX idx_alunos_cidade ON alunos;', 'DROP INDEX nome ON tabela;'),
    learn('Quando (não) criar índices', `<p>Os índices não são gratuitos: ocupam espaço e tornam os <code>INSERT</code>, <code>UPDATE</code> e <code>DELETE</code> mais lentos, porque o índice também tem de ser atualizado.</p>
      <ul><li><b>Vale a pena:</b> colunas muito usadas em WHERE, JOIN ou ORDER BY, em tabelas grandes.</li>
      <li><b>Não vale a pena:</b> tabelas pequenas, colunas raramente pesquisadas ou com muito poucos valores diferentes (ex.: sim/não).</li></ul>`),
    quiz('Em qual destas situações um índice é MENOS útil?', ['Coluna email usada para procurar clientes numa tabela com milhões de linhas', 'Coluna usada em JOIN entre duas tabelas grandes', 'Coluna ativo (sim/não) numa tabela com 20 linhas', 'Coluna data usada em ORDER BY em relatórios frequentes'], 2, 'Tabela pequena e coluna com só dois valores: o índice não traz ganho.'),
  ] },
  { title: 'Vistas (VIEW)', steps: [
    learn('O que é uma vista', `<p>Uma <b>vista</b> (<code>VIEW</code>) é uma consulta SELECT guardada com um nome, que se usa como se fosse uma tabela. A vista <b>não guarda dados</b>: sempre que é consultada, o MySQL executa a consulta e devolve os dados atuais.</p>
      <p>Serve para:</p><ul><li><b>simplificar</b> consultas complexas (ex.: um JOIN usado muitas vezes);</li><li><b>segurança</b>: mostrar apenas algumas colunas ou linhas a certos utilizadores;</li><li><b>estabilidade</b>: as aplicações usam a vista mesmo que as tabelas mudem.</li></ul>`),
    quiz('Uma vista guarda uma cópia dos dados?', ['Sim, é uma cópia atualizada todas as noites', 'Não, guarda a consulta; os dados vêm das tabelas quando é consultada', 'Sim, mas só das colunas indicadas', 'Só se for criada com UNIQUE'], 1, 'É uma "tabela virtual".'),
    learn('CREATE VIEW', `<p>Cria-se com <code>CREATE VIEW nome AS SELECT …</code>. A base de dados escola já tem esta vista, que junta alunos e cursos:</p>`,
      [ex('CREATE VIEW v_alunos_cursos AS\nSELECT a.nome AS aluno, a.idade, a.cidade, c.nome AS curso\nFROM alunos a JOIN cursos c ON a.id_curso = c.id_curso;', 'Definição da vista v_alunos_cursos (já existe na BD escola).'),
       ex('SELECT * FROM v_alunos_cursos;', 'Usa-se como uma tabela normal.', true)]),
    query('Usando a vista v_alunos_cursos, mostre o nome (aluno) dos alunos do curso de Design.', "SELECT aluno FROM v_alunos_cursos WHERE curso = 'Design'", "SELECT aluno FROM v_alunos_cursos WHERE curso = …"),
    query('Usando a vista v_alunos_cursos, mostre cada curso e o número de alunos de Lisboa nesse curso.', "SELECT curso, COUNT(*) FROM v_alunos_cursos WHERE cidade = 'Lisboa' GROUP BY curso", "WHERE cidade = 'Lisboa' GROUP BY curso"),
    code("Crie a vista v_alunos_porto com o nome e a idade dos alunos da cidade do Porto.", [
      "^create (or replace )?view v_alunos_porto as select nome,idade from alunos where cidade='porto'$",
    ], "CREATE VIEW v_alunos_porto AS SELECT nome, idade FROM alunos WHERE cidade = 'Porto';", 'CREATE VIEW nome AS SELECT …'),
    learn('Alterar, remover e proteger vistas', `<pre><code>CREATE OR REPLACE VIEW v_alunos_porto AS SELECT nome FROM alunos WHERE cidade = 'Porto';
DROP VIEW v_alunos_porto;
GRANT SELECT ON escola.v_alunos_cursos TO 'rececao'@'localhost';</code></pre>
      <p>Com o <code>GRANT</code> sobre a vista, o utilizador vê apenas as colunas da vista, sem acesso às tabelas originais. Vistas simples (uma só tabela, sem agregações) também permitem UPDATE; as restantes são só de leitura.</p>`),
    code('Elimine a vista v_alunos_porto.', ['^drop view (if exists )?v_alunos_porto$'], 'DROP VIEW v_alunos_porto;', 'DROP VIEW nome;'),
    key('f1', code('Corrija o erro: esta instrução devia criar a vista v_cursos_longos com o nome dos cursos com mais de 850 horas, mas o MySQL recusa-a.', ["^create (or replace )?view v_cursos_longos as select nome from cursos where horas>850$"], 'CREATE VIEW v_cursos_longos AS SELECT nome FROM cursos WHERE horas > 850;', 'Falta uma palavra-chave entre o nome da vista e o SELECT.', { start: 'CREATE VIEW v_cursos_longos\nSELECT nome FROM cursos WHERE horas > 850;' })),
  ] }],
  cheat: [
    ['col TIPO CHECK (condição)', 'Validar valores de uma coluna'], ['ALTER TABLE t ADD CONSTRAINT nome CHECK (…);', 'Acrescentar restrição com nome'], ['ALTER TABLE t DROP CHECK nome;', 'Remover restrição'],
    ['CREATE INDEX idx_nome ON t (col);', 'Criar índice'], ['CREATE UNIQUE INDEX idx ON t (col);', 'Índice que impede repetidos'], ['SHOW INDEX FROM t; · DROP INDEX idx ON t;', 'Listar / remover índices'], ['EXPLAIN SELECT …', 'Ver se a consulta usa índices'],
    ['CREATE VIEW v AS SELECT …;', 'Criar vista'], ['CREATE OR REPLACE VIEW v AS …;', 'Alterar vista'], ['DROP VIEW v;', 'Eliminar vista'],
  ],
  test: [
    quiz('Para que serve a restrição CHECK?', ['Criar um índice', 'Garantir que os valores cumprem uma condição', 'Verificar a palavra-passe', 'Fazer uma cópia de segurança'], 1, 'Ex.: CHECK (preco > 0).'),
    quiz('Qual destas definições impede notas acima de 20?', ['nota INT UNIQUE', 'nota INT DEFAULT 20', 'nota INT CHECK (nota <= 20)', 'nota INT INDEX 20'], 2, 'O CHECK valida o valor.'),
    quiz('Porque se deve dar um nome a uma restrição (CONSTRAINT chk_…)?', ['É obrigatório', 'Para a identificar nos erros e poder removê-la', 'Para a tornar mais rápida', 'Para criar um índice'], 1, 'ALTER TABLE … DROP CHECK nome.'),
    quiz('Que tipo de consultas um índice acelera?', ['Só INSERT', 'Pesquisas com WHERE, JOIN e ORDER BY pela coluna indexada', 'Só DELETE', 'Nenhuma; serve só para documentar'], 1, 'Evita percorrer a tabela inteira.'),
    quiz('Qual é uma desvantagem dos índices?', ['Tornam os SELECT mais lentos', 'Ocupam espaço e tornam as escritas mais lentas', 'Apagam dados antigos', 'Impedem o uso de JOIN'], 1, 'Cada escrita também atualiza o índice.'),
    quiz('Que comando mostra se o MySQL vai usar um índice numa consulta?', ['SHOW TABLES', 'DESCRIBE', 'EXPLAIN', 'ANALYZE INDEX'], 2, 'EXPLAIN mostra o plano de execução.'),
    quiz('O que é uma vista (VIEW)?', ['Uma cópia de segurança', 'Uma consulta guardada que se usa como uma tabela', 'Um tipo de índice', 'Um utilizador só de leitura'], 1, 'É uma tabela virtual.'),
    quiz('Como se dá acesso a apenas algumas colunas de uma tabela a um utilizador?', ['Com um índice nessas colunas', 'Criando uma vista com essas colunas e dando GRANT SELECT sobre a vista', 'Com CHECK nas colunas', 'Não é possível'], 1, 'As vistas são úteis para a segurança.'),
    quiz('Que instrução cria um índice único na coluna email da tabela clientes?', ['CREATE INDEX UNIQUE email ON clientes', 'CREATE UNIQUE INDEX idx_clientes_email ON clientes (email)', 'ALTER clientes UNIQUE email', 'CREATE KEY email'], 1, 'CREATE UNIQUE INDEX nome ON tabela (coluna);'),
    quiz('O que acontece ao acrescentar uma restrição CHECK que as linhas existentes não cumprem?', ['As linhas são apagadas', 'O ALTER TABLE falha', 'A restrição só se aplica a linhas novas', 'Os valores são corrigidos'], 1, 'Os dados existentes também têm de a cumprir.'),
    quiz('A chave primária precisa de um índice criado à mão?', ['Sim, sempre', 'Não, o MySQL cria-o automaticamente', 'Só em tabelas grandes', 'Só se for composta'], 1, 'A PRIMARY KEY tem sempre um índice.'),
    quiz('Como se altera a consulta de uma vista existente?', ['UPDATE VIEW', 'CREATE OR REPLACE VIEW', 'ALTER TABLE', 'MODIFY VIEW'], 1, 'Ou ALTER VIEW.'),
    quiz('Uma vista com GROUP BY permite UPDATE?', ['Sim', 'Não, é só de leitura', 'Só com CHECK', 'Só com índice'], 1, 'Vistas com agregações não são atualizáveis.'),
    predict('O que acontece a este INSERT?', 'CREATE TABLE stock (id_stock INT, qtd INT CHECK (qtd >= 0));\nINSERT INTO stock VALUES (1, -3);', ['A linha é guardada com qtd 0', 'É recusado (ERROR 3819) e a linha não é guardada', 'É guardado com um aviso', 'A restrição é ignorada'], 1, 'O CHECK recusa os valores que não cumprem a condição.'),
    quiz('Em que coluna de uma tabela de encomendas com milhões de linhas é mais útil um índice?', ['estado (4 valores possíveis)', 'id_cliente, usada em JOIN e WHERE', 'observacoes (texto livre)', 'Nenhuma'], 1, 'Colunas de junção e pesquisa frequentes beneficiam mais.'),
    quiz('Qual destas é uma vantagem das vistas?', ['Ocupam menos espaço que as tabelas', 'Escondem a complexidade e limitam o acesso a colunas', 'Tornam os INSERT mais rápidos', 'Substituem os backups'], 1, 'Simplicidade e segurança.'),
  ],
  real: [
    'Criar a tabela <code>stock</code> com um CHECK e provocar o erro <b>3819</b> com um valor inválido.',
    'Executar <code>EXPLAIN SELECT * FROM loja.encomendas WHERE id_cliente = 5;</code> antes e depois de criar um índice em <code>id_cliente</code> e comparar a coluna <i>key</i> e o número de linhas lidas.',
    'Criar uma vista na BD loja (ex.: faturação por cliente) e consultá-la como uma tabela.',
    'Ver a definição da vista com <code>SHOW CREATE VIEW</code>.',
  ],
  practice: [
    query("Usando a vista v_alunos_cursos, mostre o nome (aluno) e o curso dos alunos com 22 anos ou mais.", "SELECT aluno, curso FROM v_alunos_cursos WHERE idade >= 22", 'SELECT aluno, curso FROM v_alunos_cursos WHERE …'),
    code('Crie um índice chamado idx_alunos_nome na coluna nome da tabela alunos.', ['^create index idx_alunos_nome on alunos ?\\(nome\\)$'], 'CREATE INDEX idx_alunos_nome ON alunos (nome);', 'CREATE INDEX nome ON tabela (coluna);'),
    code("Crie a vista v_notas_altas com todas as colunas das notas iguais ou superiores a 15.", ["^create (or replace )?view v_notas_altas as select \\* from notas where nota>=15$"], 'CREATE VIEW v_notas_altas AS SELECT * FROM notas WHERE nota >= 15;', 'CREATE VIEW … AS SELECT …'),
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
    key('o1', order('A nova funcionária Marta precisa apenas de consultar a BD escola. Ordene os passos para lhe dar acesso através de um role.',
      ["CREATE ROLE 'leitor';", "GRANT SELECT ON escola.* TO 'leitor';", "CREATE USER 'marta'@'localhost' IDENTIFIED BY 'M4rta#2025';", "GRANT 'leitor' TO 'marta'@'localhost';", "SET DEFAULT ROLE 'leitor' TO 'marta'@'localhost';"],
      'O role e o utilizador têm de existir antes de se ligarem; o SET DEFAULT ROLE ativa o role quando ela inicia sessão.')),
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
    quiz("Qual instrução cria uma conta que só liga a partir da rede 192.168.1.x?", ["CREATE USER 'rui'@'%'", "CREATE USER 'rui'@'192.168.1.%' IDENTIFIED BY '…'", "CREATE USER 'rui' NETWORK 192.168.1", "GRANT NETWORK TO 'rui'"], 1, 'O anfitrião aceita o carácter universal %.'),
    quiz('Que privilégio permite apenas consultar dados?', ['INSERT', 'SELECT', 'UPDATE', 'ALL PRIVILEGES'], 1, 'SELECT.'),
    quiz('O que faz SET DEFAULT ROLE?', ['Cria um role', 'Ativa automaticamente um role quando o utilizador inicia sessão', 'Apaga os roles', 'Muda a palavra-passe'], 1, 'Sem isso o role tem de ser ativado com SET ROLE.'),
    quiz('Como se muda a palavra-passe de um utilizador?', ["UPDATE USER … PASSWORD", "ALTER USER 'u'@'h' IDENTIFIED BY 'nova'", "SET USER PASSWORD", "GRANT PASSWORD"], 1, 'ALTER USER … IDENTIFIED BY.'),
    quiz("Que objeto dá acesso apenas à tabela alunos da BD escola?", ['escola.*', '*.alunos', 'escola.alunos', 'alunos.*'], 2, 'bd.tabela.'),
    predict('Depois destas instruções, o que pode fazer a ana na tabela escola.alunos?', "GRANT SELECT, INSERT, UPDATE ON escola.alunos TO 'ana'@'localhost';\nREVOKE UPDATE ON escola.alunos FROM 'ana'@'localhost';", ['Nada', 'Consultar e inserir', 'Consultar, inserir e alterar', 'Só alterar'], 1, 'O UPDATE foi retirado; ficam SELECT e INSERT.'),
    quiz('Porque se deve evitar GRANT ALL ON *.* a contas de aplicações?', ['Porque é mais lento', 'Porque dá poder total sobre todo o servidor', 'Porque não funciona', 'Porque apaga os roles'], 1, 'Viola o menor privilégio.'),
    quiz('Que tipo de ligação protege as palavras-passe que viajam na rede?', ['Ligações cifradas (TLS)', 'Ligações por UDP', 'Ligações anónimas', 'Nenhuma'], 0, 'TLS cifra a comunicação.'),
  ],
  real: [
    'Criar um utilizador com privilégios só de leitura na BD escola e entrar com ele (<code>mysql -u nome -p</code>).',
    'Com esse utilizador, tentar um DELETE e ler o erro <b>1142</b> (privilégio negado).',
    'Criar um role, atribuí-lo, e confirmar com <code>SHOW GRANTS FOR … USING …;</code>.',
    'Listar as contas com <code>SELECT user, host FROM mysql.user;</code> e eliminar a conta de teste.',
  ],
  practice: [
    code("Crie o utilizador 'rita' que liga a partir de qualquer anfitrião, com a palavra-passe 'R1ta#2025'.", ["^create user (if not exists )?'rita'@'%' identified by 'r1ta#2025'$"], "CREATE USER 'rita'@'%' IDENTIFIED BY 'R1ta#2025';", "CREATE USER 'nome'@'%' IDENTIFIED BY '…';"),
    code("Dê a 'rita'@'%' os privilégios SELECT e INSERT na tabela notas da BD escola.", ["^grant select,insert on escola\\.notas to 'rita'@'%'$", "^grant insert,select on escola\\.notas to 'rita'@'%'$"], "GRANT SELECT, INSERT ON escola.notas TO 'rita'@'%';", 'GRANT …, … ON escola.notas TO …'),
    code("Retire a 'rita'@'%' o privilégio INSERT na tabela notas da BD escola.", ["^revoke insert on escola\\.notas from 'rita'@'%'$"], "REVOKE INSERT ON escola.notas FROM 'rita'@'%';", 'REVOKE … FROM …'),
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
    quiz('Para que serve a opção --single-transaction?', ['Faz backup de uma só tabela', 'Obtém uma cópia consistente (InnoDB) sem bloquear as tabelas', 'Comprime o ficheiro', 'Apaga os dados antigos'], 1, 'Obtém uma imagem consistente dos dados sem bloquear a base de dados.'),
  ] },
  { title: 'Restaurar uma base de dados', steps: [
    learn('Restaurar a partir do terminal', `<p>O restauro "reproduz" o ficheiro SQL no servidor, invertendo o redirecionamento (<code>&lt;</code>). Se o dump não foi feito com <code>--databases</code>, a base de dados tem de existir antes:</p>
      <pre><code>mysql -u root -p -e "CREATE DATABASE escola"
mysql -u root -p escola &lt; escola.sql</code></pre>
      <p>A opção <code>-e</code> ("execute") executa a instrução SQL indicada entre aspas e termina, sem abrir a linha de comandos <code>mysql&gt;</code>. Depois de restaurar, é boa prática confirmar os dados, por exemplo com <code>mysql -u root -p escola -e "SELECT COUNT(*) FROM alunos"</code>.</p>`),
    code('Escreva o comando que restaura o ficheiro loja.sql na base de dados loja (utilizador root, com palavra-passe).', ['^mysql -u ?root -p ?loja<loja\\.sql$', '^mysql -p -u ?root loja<loja\\.sql$'], 'mysql -u root -p loja < loja.sql', 'mysql -u … -p base < ficheiro'),
    learn('Restaurar dentro do cliente mysql', `<p>Se já estiver ligado ao <code>mysql&gt;</code>, pode executar um ficheiro de comandos com <code>SOURCE</code>:</p>
      <pre><code>USE escola;
SOURCE /caminho/escola.sql;</code></pre><p>Ficheiros comprimidos restauram-se com: <code>gunzip &lt; escola.sql.gz | mysql -u root -p escola</code>.</p>`),
    code('Dentro do cliente mysql, escreva o comando que executa o ficheiro escola.sql.', ['^source escola\\.sql$', '^\\\\\\. escola\\.sql$'], 'SOURCE escola.sql;', 'SOURCE ficheiro;'),
    learn('Testar os backups', `<p class="warn">Um backup só tem valor se o restauro funcionar.</p><p>Teste regularmente o restauro num servidor de testes, documente o procedimento e meça quanto tempo demora — isso é essencial para planear a recuperação.</p>`),
    quiz('Porque se deve testar o restauro regularmente?', ['Para gastar espaço', 'Para garantir que o backup é válido e utilizável', 'Porque o MySQL o exige', 'Para apagar backups antigos'], 1, 'Um backup nunca testado é apenas uma esperança.'),
    key('o1', order('Ordene os passos para testar um backup da BD escola sem tocar na base de dados original.',
      ['mysqldump -u root -p escola > escola.sql', 'mysql -u root -p -e "CREATE DATABASE escola_teste"', 'mysql -u root -p escola_teste < escola.sql', 'mysql -u root -p escola_teste -e "SELECT COUNT(*) FROM alunos"'],
      'Faz-se a cópia, cria-se uma BD vazia de teste, restaura-se lá o ficheiro e confirma-se que os dados estão completos.')),
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
    quiz('Qual o comando que exporta só a tabela alunos da BD escola?', ['mysqldump -u root -p alunos > a.sql', 'mysqldump -u root -p escola alunos > a.sql', 'mysqldump --table alunos', 'SELECT * INTO BACKUP alunos'], 1, 'Indica-se a BD e depois a(s) tabela(s).'),
    quiz('Para que serve a opção --databases do mysqldump?', ['Comprime o ficheiro', 'Permite várias BD e inclui o CREATE DATABASE no ficheiro', 'Exporta só a estrutura', 'Apaga as BD'], 1, 'Assim o restauro cria a BD.'),
    quiz('Um backup lógico de uma BD com 500 GB…', ['é muito rápido a restaurar', 'pode demorar muitas horas a gerar e a restaurar', 'não é possível', 'ocupa sempre menos de 1 GB'], 1, 'Para BD grandes, preferem-se backups físicos.'),
    quiz('Como se agenda um backup diário no Linux?', ['Com cron', 'Com GRANT', 'Com o binary log', 'Com SOURCE'], 0, 'O cron executa comandos a horas marcadas.'),
    quiz('Que ferramenta faz backups físicos sem parar o servidor?', ['mysqldump', 'Percona XtraBackup', 'SOURCE', 'EXPLAIN'], 1, 'Ou o MySQL Enterprise Backup.'),
    predict('Este comando faz o quê?', 'mysqldump -u root -p escola | gzip > escola.sql.gz', ['Restaura a BD escola', 'Gera o backup da BD escola já comprimido', 'Apaga a BD escola', 'Mostra o conteúdo do ficheiro'], 1, 'O | envia a saída do mysqldump para o gzip.'),
    quiz('O que significa PITR?', ['Restaurar até um instante exato', 'Comprimir backups', 'Replicar servidores', 'Cifrar ficheiros'], 0, 'Point-In-Time Recovery, com o binary log.'),
    quiz('Onde deve ficar pelo menos uma cópia do backup, segundo a regra 3-2-1?', ['No mesmo disco', 'Fora do local (ex.: outro edifício ou nuvem)', 'Na memória RAM', 'No servidor de produção'], 1, 'Protege contra incêndios, roubos e ransomware.'),
  ],
  real: [
    'Fazer o backup da BD escola com <code>mysqldump</code> e abrir o ficheiro .sql num editor de texto.',
    'Restaurar o ficheiro numa BD nova (<code>escola_teste</code>) e comparar <code>SELECT COUNT(*)</code> das tabelas.',
    'Gerar um backup comprimido com <code>| gzip</code> e restaurá-lo com <code>gunzip &lt; … | mysql …</code>.',
    'Escrever um pequeno script (.bat ou .sh) que faça o backup com a data no nome do ficheiro.',
  ],
  practice: [
    code('Escreva o comando que exporta a base de dados escola para o ficheiro escola.sql (utilizador root, com palavra-passe).', ['^mysqldump -u ?root -p ?escola>escola\\.sql$', '^mysqldump -p -u ?root escola>escola\\.sql$'], 'mysqldump -u root -p escola > escola.sql', 'mysqldump -u … -p base > ficheiro'),
    code('Escreva o comando que restaura o ficheiro escola.sql na base de dados escola (utilizador root, com palavra-passe).', ['^mysql -u ?root -p ?escola<escola\\.sql$', '^mysql -p -u ?root escola<escola\\.sql$'], 'mysql -u root -p escola < escola.sql', 'mysql -u … -p base < ficheiro'),
  ],
},
];


/* Enquadramento de cada lição: o que se vai aprender, porque é importante e como se liga ao resto do curso.
   Aparece no topo da lição e no manual do capítulo. */
const INTROS = {
  'intro.1': 'Antes de escrever comandos, é preciso perceber o que é uma base de dados, como a informação se organiza em tabelas e qual o papel do MySQL e da linguagem SQL. Estes conceitos são a base de todo o curso.',
  'intro.2': 'Nesta lição aprende a ligar-se a um servidor MySQL e a dar os primeiros comandos: ver as bases de dados, escolher uma, listar as suas tabelas e sair. Fica também a conhecer as famílias de comandos SQL, que correspondem aos capítulos seguintes.',
  'intro.3': 'Cada coluna de uma tabela guarda um tipo de valor: números, texto ou datas. Nesta lição conhece os tipos mais usados e aprende a escolher o adequado — uma decisão que vai tomar sempre que criar tabelas com CREATE TABLE, no capítulo 2.',
  'ddl.1': 'Uma base de dados é o "contentor" onde ficam as tabelas de um projeto. Antes de criar tabelas, aprende a criar, escolher e eliminar bases de dados.',
  'ddl.2': 'É aqui que os tipos de dados do capítulo 1 são usados: aprende a criar tabelas com CREATE TABLE, a definir a chave primária e a acrescentar regras (restrições) que impedem dados inválidos.',
  'ddl.3': 'As tabelas não vivem isoladas: um aluno pertence a um curso, uma encomenda pertence a um cliente. Nesta lição aprende a ligar tabelas com chaves estrangeiras (relações 1:N) e a decidir o que acontece quando se apaga um registo relacionado.',
  'ddl.4': 'Algumas relações são "muitos para muitos": um aluno tem várias disciplinas e cada disciplina tem vários alunos. Aprende a representá-las com uma tabela de ligação — um padrão que vai encontrar em quase todas as bases de dados reais.',
  'ddl.5': 'As necessidades mudam e as tabelas também: é preciso acrescentar colunas, corrigir tipos ou ligar tabelas já existentes. Aprende a alterar a estrutura com ALTER TABLE sem perder os dados, e a eliminar tabelas pela ordem certa.',
  'ddl.norm': 'Até aqui as tabelas eram indicadas no enunciado. Num projeto real é o aluno que as tem de decidir a partir de um texto. Nesta lição aprende a encontrar entidades e relações e a aplicar as formas normais para evitar dados repetidos.',
  'ddl.6': 'Desafio final do capítulo: a partir dos requisitos de uma loja online, cria sozinho as quatro tabelas, com chaves, relações e restrições. É a aplicação de tudo o que aprendeu no capítulo.',
  'dml.1': 'Com as tabelas criadas, é preciso colocar-lhes dados. Nesta lição aprende o comando INSERT, para acrescentar uma ou várias linhas a uma tabela.',
  'dml.2': 'Os dados mudam: um aluno muda de cidade, um preço aumenta. Aprende o comando UPDATE e, sobretudo, a escolher com WHERE exatamente as linhas a alterar — um UPDATE sem WHERE altera a tabela inteira.',
  'dml.3': 'Por fim, aprende a eliminar dados: linhas escolhidas com DELETE ou a tabela inteira com TRUNCATE. Tal como no UPDATE, o WHERE é o que separa uma operação segura de um desastre.',
  'dml.loja': 'Para praticar num cenário realista, passa a usar a base de dados loja, com clientes, produtos e encomendas. Aplica INSERT, UPDATE e DELETE a situações do dia a dia de uma loja, incluindo dados relacionados entre tabelas.',
  'select.1': 'Consultar dados é a tarefa mais frequente em SQL. Esta lição apresenta o comando SELECT: como ler uma tabela, escolher colunas e fazer cálculos no resultado.',
  'select.2': 'Raramente se quer ver uma tabela inteira. Aprende a filtrar as linhas com WHERE e com os operadores de comparação, AND/OR, IN, BETWEEN e LIKE.',
  'select.3': 'Um resultado útil está organizado. Aprende a ordenar (ORDER BY), a limitar o número de linhas (LIMIT) e a eliminar repetidos (DISTINCT) — por exemplo, para obter "os 3 melhores".',
  'select.4': 'Muitas perguntas pedem resumos: quantos alunos há por cidade, qual a média de cada disciplina. Aprende as funções de agregação e a agrupar linhas com GROUP BY e HAVING, e vê passo a passo como o MySQL executa uma consulta.',
  'select.5': 'A informação está repartida por várias tabelas relacionadas (capítulo 2). Com JOIN volta a juntá-la numa só consulta — por exemplo, cada aluno com o nome do seu curso.',
  'select.6': 'Às vezes a resposta depende de outra pergunta: "alunos com idade acima da média". Aprende a usar uma consulta dentro de outra (subconsulta).',
  'select.func': 'Os dados nem sempre estão no formato que se quer mostrar. Aprende funções para transformar texto, arredondar números e trabalhar com datas, usando também a BD loja.',
  'select.case': 'Aprende a criar categorias dentro de uma consulta com CASE (ex.: "caro", "barato") e a lidar com valores desconhecidos (NULL), que mudam o resultado das contas.',
  'select.join3': 'Nas bases de dados reais é comum atravessar três ou mais tabelas para obter uma resposta. Aprende também a juntar resultados de consultas diferentes com UNION.',
  'select.neg': 'Lição de aplicação: em vez de instruções passo a passo, recebe perguntas da direção da loja e tem de decidir que tabelas, filtros e agrupamentos usar. É assim que o SQL é usado no trabalho real.',
  'adv.1': 'Uma base de dados só é útil se os dados forem válidos. Aprofunda a restrição CHECK, que impede, por exemplo, preços negativos ou notas acima de 20.',
  'adv.2': 'Com milhões de linhas, uma consulta pode demorar muito. Os índices tornam as pesquisas rápidas. Aprende a criá-los e, sobretudo, quando vale a pena fazê-lo.',
  'adv.3': 'Aprende a guardar consultas com um nome (vistas), para simplificar consultas complexas e mostrar a cada utilizador apenas os dados de que precisa — o que prepara o capítulo de segurança.',
  'sec.1': 'Uma base de dados real é usada por várias pessoas e aplicações, e nem todas devem poder fazer tudo. Começa por aprender a criar e gerir contas de utilizador.',
  'sec.2': 'Depois de criar um utilizador, é preciso dizer o que ele pode fazer. Aprende a dar e retirar permissões com GRANT e REVOKE, ao nível do servidor, da base de dados ou de uma tabela.',
  'sec.3': 'Dar permissões a cada utilizador, um a um, torna-se difícil de gerir. Os roles agrupam permissões e atribuem-se de uma vez. A lição termina com as boas práticas de segurança.',
  'backup.1': 'Avarias, erros humanos e ataques acontecem. Esta lição explica porque se fazem cópias de segurança e como se fazem com o mysqldump.',
  'backup.2': 'Uma cópia de segurança só vale se for possível recuperá-la. Aprende a restaurar uma base de dados a partir de um ficheiro e a testar os backups.',
  'backup.3': 'Para terminar, uma visão de conjunto: backups físicos, recuperação até um instante exato e a regra 3-2-1, para planear uma estratégia de backup completa.',
};

/* IDs estáveis e estrutura derivada: capítulo.lição.exercício */
CHAPTERS.forEach((c, ci) => {
  c.idx = ci;
  let ln = 0;
  c.lessons.forEach((l) => {
    l.id = l.key ? `${c.id}.${l.key}` : `${c.id}.${++ln}`;
    l.chapter = c.id;
    l.intro = INTROS[l.id] || '';
    let n = 0;
    l.steps.forEach((s, si) => { s.idx = si; if (s.t !== 'learn') s.id = s.key ? `${l.id}.${s.key}` : `${l.id}.${++n}`; });
    l.ex = l.steps.filter((s) => s.t !== 'learn');
  });
  c.test.forEach((q, qi) => (q.id = `${c.id}.t${qi + 1}`));
  (c.practice || []).forEach((q, qi) => (q.id = `${c.id}.p${qi + 1}`));
});

const PASS_MARK = 70; // % mínima no miniteste para concluir o capítulo
const TEST_DRAW = { quiz: 8, practice: 2 }; // perguntas sorteadas em cada tentativa do miniteste

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
  { id: 'nexus1', icon: 'terminal', name: 'Primeiro acesso', desc: 'Abriu a primeira porta da estação Órion', test: (s) => s.gameDone >= 1 },
  { id: 'drone', icon: 'zap', name: 'Drone desligado', desc: 'Desativou um drone com SQL no Protocolo NEXUS', test: (s) => s.gameRooms.includes('g4') },
  { id: 'review', icon: 'refresh', name: 'Memória de elefante', desc: '10 revisões certas na página Revisão', test: (s) => s.reviews >= 10 },
  { id: 'clean', icon: 'eye', name: 'Sem espreitar', desc: 'Concluiu um capítulo sem ver nenhuma resposta', test: (s) => s.cleanChapters.length >= 1 },
  { id: 'real', icon: 'cpu', name: 'Mãos no servidor', desc: 'Fez todas as tarefas de «Prática no MySQL real» de um capítulo', test: (s) => s.realDone.length >= 1 },
  { id: 'project', icon: 'layers', name: 'Projeto entregue', desc: 'Entregou o projeto final ao professor', test: (s) => s.projectSent },
  { id: 'all', icon: 'award', name: 'Mestre MySQL', desc: 'Concluiu todos os capítulos', test: (s) => s.chaptersDone.length === CHAPTERS.length },
];

const api = { CHAPTERS, BADGES, PASS_MARK, TEST_DRAW };
if (typeof module !== 'undefined') module.exports = api; else root.CONTENT = api;
})(typeof window !== 'undefined' ? window : globalThis);
