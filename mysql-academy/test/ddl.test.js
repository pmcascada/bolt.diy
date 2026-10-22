// Testes do verificador de CREATE/ALTER/DROP TABLE (public/ddl.js).
const D = require('../public/ddl.js');
let bad = 0, n = 0;
const ok = (name, input, ex) => { n++; let r; try { r = D.check(input, ex); } catch (e) { r = { ok: false, msgs: ['ERRO: ' + e.message] }; } if (!r.ok) { bad++; console.log('✗ devia aceitar:', name, r.msgs); } };
const no = (name, input, ex, expect) => { n++; let r, m; try { r = D.check(input, ex); m = r.msgs.join(' | '); } catch (e) { r = { ok: false }; m = e.message; } if (r.ok || (expect && !new RegExp(expect, 'i').test(m))) { bad++; console.log('✗ devia recusar:', name, '→', r.ok ? 'aceite' : m); } };

const livros = { solution: `CREATE TABLE livros (id_livro INT AUTO_INCREMENT PRIMARY KEY, isbn CHAR(13) NOT NULL UNIQUE, titulo VARCHAR(150) NOT NULL, ano INT, preco DECIMAL(6,2) DEFAULT 0);` };
ok('igual', livros.solution, livros);
ok('várias linhas, ordem das restrições e PK no fim', `create table livros (
  id_livro int not null auto_increment,
  isbn char(13) unique not null,   -- código
  titulo varchar(150) not null,
  ano integer,
  preco decimal(6,2) default 0.00,
  primary key (id_livro)
)`, livros);
ok('UNIQUE ao nível da tabela, sem ;', 'CREATE TABLE livros (id_livro INT AUTO_INCREMENT, isbn CHAR(13) NOT NULL, titulo VARCHAR(150) NOT NULL, ano INT(4), preco DECIMAL(6,2) DEFAULT 0, PRIMARY KEY (id_livro), UNIQUE (isbn)) ENGINE=InnoDB', livros);
no('tipo errado', livros.solution.replace('CHAR(13)', 'VARCHAR(13)'), livros, 'isbn.*CHAR\\(13\\)');
no('falta NOT NULL', livros.solution.replace('titulo VARCHAR(150) NOT NULL', 'titulo VARCHAR(150)'), livros, 'titulo.*obrigatória');
no('falta UNIQUE', livros.solution.replace(' UNIQUE', ''), livros, 'UNIQUE');
no('falta DEFAULT', livros.solution.replace(' DEFAULT 0', ''), livros, 'DEFAULT 0');
no('coluna a mais', livros.solution.replace('ano INT,', 'ano INT, autor VARCHAR(80),'), livros, 'autor');
no('vírgula em falta', livros.solution.replace('ano INT,', 'ano INT'), livros, 'Não percebi');
no('tipo inexistente', livros.solution.replace('ano INT', 'ano NUMBER'), livros, 'desconhecido');
no('AUTO_INCREMENT sem chave', 'CREATE TABLE livros (id_livro INT AUTO_INCREMENT, isbn CHAR(13) NOT NULL UNIQUE, titulo VARCHAR(150) NOT NULL, ano INT, preco DECIMAL(6,2) DEFAULT 0)', livros, 'chave primária');

const fk = { setup: 'CREATE TABLE departamentos (id_departamento INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(60) NOT NULL);',
  solution: 'CREATE TABLE funcionarios (id_funcionario INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(80) NOT NULL, id_departamento INT, FOREIGN KEY (id_departamento) REFERENCES departamentos(id_departamento) ON DELETE SET NULL);' };
ok('FK igual', fk.solution, fk);
ok('FK na coluna + CONSTRAINT com nome', 'CREATE TABLE funcionarios (id_funcionario INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(80) NOT NULL, id_departamento INT REFERENCES departamentos(id_departamento) ON DELETE SET NULL)', fk);
ok('FK com nome', 'CREATE TABLE funcionarios (id_funcionario INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(80) NOT NULL, id_departamento INT, CONSTRAINT fk_func_dep FOREIGN KEY (id_departamento) REFERENCES departamentos (id_departamento) ON UPDATE CASCADE ON DELETE SET NULL)', fk);
no('ON DELETE errado', fk.solution.replace('SET NULL', 'CASCADE'), fk, 'ON DELETE SET NULL.*CASCADE');
no('sem ON DELETE', fk.solution.replace(' ON DELETE SET NULL', ''), fk, 'ON DELETE SET NULL');
no('SET NULL em coluna NOT NULL', fk.solution.replace('id_departamento INT,', 'id_departamento INT NOT NULL,'), fk, 'aceitar NULL');
no('tabela referenciada inexistente', fk.solution.replace('REFERENCES departamentos', 'REFERENCES deptos'), fk, 'ainda não existe');
no('tipo incompatível', fk.solution.replace('id_departamento INT,', 'id_departamento VARCHAR(10),'), fk, 'compatível');
no('falta FK', 'CREATE TABLE funcionarios (id_funcionario INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(80) NOT NULL, id_departamento INT)', fk, 'falta a chave estrangeira');

const nm = { setup: 'CREATE TABLE alunos (id_aluno INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(80) NOT NULL);',
  solution: `CREATE TABLE disciplinas (id_disciplina INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(60) NOT NULL);
CREATE TABLE inscricoes (id_aluno INT, id_disciplina INT, data_inscricao DATE NOT NULL, PRIMARY KEY (id_aluno, id_disciplina),
 FOREIGN KEY (id_aluno) REFERENCES alunos(id_aluno) ON DELETE CASCADE, FOREIGN KEY (id_disciplina) REFERENCES disciplinas(id_disciplina) ON DELETE CASCADE);` };
ok('N:M igual', nm.solution, nm);
ok('N:M PK por outra ordem', nm.solution.replace('PRIMARY KEY (id_aluno, id_disciplina)', 'PRIMARY KEY (id_disciplina, id_aluno)'), nm);
no('N:M ordem de criação errada', nm.solution.split(';').slice(1, 2).concat(nm.solution.split(';').slice(0, 1)).join(';'), nm, 'Crie primeiro a tabela disciplinas');
no('N:M duas PRIMARY KEY', nm.solution.replace('id_aluno INT, id_disciplina INT,', 'id_aluno INT PRIMARY KEY, id_disciplina INT PRIMARY KEY,').replace(' PRIMARY KEY (id_aluno, id_disciplina),', ''), nm, 'composta');
no('N:M PK só numa coluna', nm.solution.replace('PRIMARY KEY (id_aluno, id_disciplina)', 'PRIMARY KEY (id_aluno)'), nm, 'chave primária devia ser');

const alt = { setup: 'CREATE TABLE clientes (id_cliente INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(80) NOT NULL, tel VARCHAR(15));', solution: 'ALTER TABLE clientes RENAME COLUMN tel TO telefone;' };
ok('RENAME COLUMN', alt.solution, alt);
ok('CHANGE', 'ALTER TABLE clientes CHANGE tel telefone VARCHAR(15)', alt);
no('CHANGE com tipo diferente', 'ALTER TABLE clientes CHANGE tel telefone VARCHAR(20)', alt, 'VARCHAR\\(15\\)');
no('coluna inexistente', 'ALTER TABLE clientes RENAME COLUMN telef TO telefone', alt, 'não existe');
const mod = { setup: 'CREATE TABLE produtos (id_produto INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(50), preco DECIMAL(6,2));', solution: 'ALTER TABLE produtos MODIFY nome VARCHAR(120) NOT NULL;' };
ok('MODIFY', mod.solution, mod);
ok('MODIFY COLUMN', 'alter table produtos modify column nome varchar(120) not null;', mod);
no('MODIFY sem NOT NULL', 'ALTER TABLE produtos MODIFY nome VARCHAR(120)', mod, 'obrigatória');
const addfk = { setup: 'CREATE TABLE cursos (id_curso INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(50) NOT NULL); CREATE TABLE alunos (id_aluno INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(80) NOT NULL, id_curso INT);',
  solution: 'ALTER TABLE alunos ADD CONSTRAINT fk_alunos_cursos FOREIGN KEY (id_curso) REFERENCES cursos(id_curso) ON DELETE SET NULL;' };
ok('ADD FOREIGN KEY', addfk.solution, addfk);
ok('ADD FOREIGN KEY sem nome', 'ALTER TABLE alunos ADD FOREIGN KEY (id_curso) REFERENCES cursos (id_curso) ON DELETE SET NULL', addfk);
const drop = { setup: 'CREATE TABLE clientes (id_cliente INT PRIMARY KEY); CREATE TABLE encomendas (id_encomenda INT PRIMARY KEY, id_cliente INT, FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente));', solution: 'DROP TABLE encomendas; DROP TABLE clientes;' };
ok('DROP pela ordem certa', drop.solution, drop);
no('DROP pela ordem errada', 'DROP TABLE clientes; DROP TABLE encomendas;', drop, 'Elimine primeiro encomendas');
const chk = { setup: 'CREATE TABLE notas (id_aluno INT, disciplina VARCHAR(50), nota INT);', solution: 'ALTER TABLE notas ADD CONSTRAINT chk_nota CHECK (nota BETWEEN 0 AND 20);' };
ok('CHECK', 'alter table notas add constraint chk_nota check(nota between 0 and 20)', chk);
no('CHECK diferente', 'ALTER TABLE notas ADD CHECK (nota >= 0)', chk, 'CHECK');
// modo flexível (desafio): só exige o essencial
const loose = { loose: true, solution: 'CREATE TABLE produtos (id_produto INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(100) NOT NULL, preco DECIMAL(8,2) NOT NULL CHECK (preco > 0), stock INT DEFAULT 0);' };
ok('flexível: tamanhos e extras diferentes', 'CREATE TABLE produtos (id_produto INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(60) NOT NULL, descricao TEXT, preco DECIMAL(10,2) NOT NULL, stock SMALLINT DEFAULT 0, CHECK (preco >= 0.01))', loose);
no('flexível: falta CHECK', 'CREATE TABLE produtos (id_produto INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(60) NOT NULL, preco DECIMAL(10,2) NOT NULL, stock INT DEFAULT 0)', loose, 'CHECK');
no('flexível: preço sem 2 casas', 'CREATE TABLE produtos (id_produto INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(60) NOT NULL, preco DECIMAL(10,0) NOT NULL CHECK (preco > 0), stock INT DEFAULT 0)', loose, 'preco');
no('não aceita SELECT', 'SELECT * FROM produtos', loose, 'só aceita');
console.log(`${n} casos de teste do verificador, ${bad} falhados`);
if (bad) process.exit(1);
