# Publicar a MySQL Academy (gratuito): Supabase + Cloudflare Pages ou Vercel

- **Cloudflare Pages** aloja o site (ficheiros de `public/`), com HTTPS, sempre ligado.
- **Supabase** guarda as contas dos alunos, o progresso e a classificação.

Os nomes dos menus podem variar ligeiramente, porque estes serviços atualizam a interface com frequência.

## 1. Criar o projeto no Supabase

1. Crie uma conta gratuita em https://supabase.com e clique em **New project**.
2. Escolha um nome (ex.: `mysql-academy`), defina uma palavra-passe para a base de dados (guarde-a) e uma região próxima (ex.: *West EU (Ireland)* ou *Central EU (Frankfurt)*).
3. Aguarde 1–2 minutos até o projeto ficar pronto.

## 2. Criar as tabelas e as regras de segurança

1. No menu lateral abra **SQL Editor** → **New query**.
2. Copie todo o conteúdo do ficheiro [`supabase/schema.sql`](supabase/schema.sql), cole e clique em **Run**.
3. Deve aparecer *Success. No rows returned*. (Pode voltar a executar o script mais tarde sem perder dados.)

## 3. Configurar as contas de aluno

Em **Authentication** → **Sign In / Providers** → **Email**:

- Mantenha o **Email** ativo.
- **Recomendado para turmas: desligue "Confirm email".** O plano gratuito só envia alguns emails por hora; com a confirmação ligada, uma turma inteira a criar conta ao mesmo tempo fica à espera dos emails. Com a confirmação desligada, os alunos entram logo após criar a conta.

## 4. Copiar o endereço e a chave pública

1. Abra **Project Settings** → **API** (ou **Data API** / **API Keys**).
2. Copie o **Project URL** (ex.: `https://abcdefghijkl.supabase.co`) e a chave **anon** / **publishable** (pública).
   - **Nunca** use a chave `service_role` / `secret` no site.
3. Coloque os dois valores em [`public/config.js`](public/config.js):

   ```js
   window.APP_CONFIG = {
     supabaseUrl: 'https://abcdefghijkl.supabase.co',
     supabaseAnonKey: 'eyJhbGciOi…',
   };
   ```
4. Faça commit e push para o GitHub.

A chave pública pode ficar no site: os dados estão protegidos pelas regras de segurança do passo 2 (cada aluno só altera o seu progresso; a classificação só mostra nome e pontuação).

## 5. Publicar no Cloudflare Pages

1. Crie uma conta gratuita em https://dash.cloudflare.com.
2. **Workers & Pages** → **Create** → separador **Pages** → **Connect to Git** e autorize o acesso ao repositório `bolt.diy`.
3. Configure:
   - **Production branch:** o ramo com a app (ex.: `main`, ou `claude/mysql-learning-app-i359yb`)
   - **Framework preset:** *None*
   - **Build command:** (vazio)
   - **Build output directory:** `mysql-academy/public`
4. **Save and Deploy**. Ao fim de um minuto o site fica disponível em `https://<nome>.pages.dev`.
   Cada novo push para o ramo publica automaticamente uma nova versão.

### Alternativa: publicar no Vercel

1. Crie uma conta gratuita em https://vercel.com (pode entrar com a conta do GitHub).
2. **Add New…** → **Project** → importe o repositório `bolt.diy` (autorize o acesso, se pedido).
3. Configure:
   - **Root Directory:** `mysql-academy/public` (botão **Edit**)
   - **Framework Preset:** *Other*
   - **Build Command / Output Directory / Install Command:** deixar vazios (sem build)
4. **Deploy**. O site fica em `https://<nome>.vercel.app`; cada push para o ramo de produção publica uma nova versão.
5. Para publicar a partir do ramo `claude/mysql-learning-app-i359yb` (e não do `main`): **Settings** → **Environments** → **Production** → **Branch Tracking**; ou junte o ramo ao `main`.

O plano gratuito do Vercel (*Hobby*) destina-se a uso pessoal e não comercial.

## 6. Indicar o endereço do site ao Supabase

Em **Authentication** → **URL Configuration**, defina o **Site URL** com o endereço do passo 5 (ex.: `https://mysql-academy.pages.dev`) e acrescente-o também em **Redirect URLs**. É usado nos emails de recuperação da palavra-passe.

## 7. Criar a conta de professor

1. No site, em **Perfil** → **Criar conta**, crie a sua conta (ex.: nome *Prof. Rita*).
2. No Supabase → **SQL Editor**, execute (com o seu nome):

   ```sql
   update public.profiles set is_teacher = true where lower(name) = lower('Prof. Rita');
   ```
3. Volte a abrir o site: aparece no menu a **Área do professor**, com a evolução de todos os alunos (exportável em CSV). As contas de professor não entram na classificação.

## Manutenção

- **Pausa por inatividade:** no plano gratuito, um projeto sem utilização durante 7 dias é pausado (os dados mantêm-se). Para o reativar: painel do Supabase → projeto → **Restore project**.
- **Ver/editar dados:** **Table Editor** → tabelas `profiles` e `progress`.
- **Apagar um aluno:** **Authentication** → **Users** → apagar o utilizador (o perfil e o progresso são apagados com ele).
- **Palavra-passe esquecida:** o aluno usa "Esqueci-me da palavra-passe" no Perfil, ou o professor envia um link de recuperação em **Authentication** → **Users**.
