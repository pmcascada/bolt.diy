-- MySQL Academy — esquema para o Supabase (plano gratuito).
-- Executar uma vez no Supabase: SQL Editor → New query → colar este ficheiro → Run.
-- Pode ser executado de novo sem perder dados (é idempotente).

-- ============================================================
-- Tabelas
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 2 and 24),
  is_teacher  boolean not null default false,
  created_at  timestamptz not null default now()
);
create unique index if not exists profiles_name_unique on public.profiles (lower(name));

-- Progresso de cada aluno: o estado completo (exercícios, minitestes, histórico)
-- e um resumo usado na classificação.
create table if not exists public.progress (
  user_id        uuid primary key references public.profiles (id) on delete cascade,
  state          jsonb not null default '{}'::jsonb,
  xp             int not null default 0 check (xp between 0 and 20000),
  level          int not null default 1 check (level between 1 and 50),
  pct            int not null default 0 check (pct between 0 and 100),
  ex_done        int not null default 0 check (ex_done between 0 and 1000),
  chapters_done  int not null default 0 check (chapters_done between 0 and 50),
  streak         int not null default 0 check (streak between 0 and 3660),
  badges         int not null default 0 check (badges between 0 and 100),
  updated_at     timestamptz not null default now(),
  constraint progress_state_size check (pg_column_size(state) < 300000)
);

-- ------------------------------------------------------------
-- Atualização (versão 2): turmas, XP da semana e limite de XP maior.
-- Seguro de executar em bases de dados criadas com a versão anterior.
-- ------------------------------------------------------------
alter table public.profiles add column if not exists turma text;
alter table public.profiles drop constraint if exists profiles_turma_check;
alter table public.profiles add constraint profiles_turma_check check (turma is null or char_length(turma) <= 30);
alter table public.progress add column if not exists week_xp int not null default 0;
alter table public.progress drop constraint if exists progress_week_xp_check;
alter table public.progress add constraint progress_week_xp_check check (week_xp between 0 and 20000);
alter table public.progress drop constraint if exists progress_xp_check;
alter table public.progress add constraint progress_xp_check check (xp between 0 and 20000);
create index if not exists profiles_turma_idx on public.profiles (lower(turma));

-- ============================================================
-- Funções auxiliares
-- ============================================================
create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_teacher from public.profiles p where p.id = auth.uid()), false);
$$;

-- Verifica, antes do registo, se o nome ainda está livre.
create or replace function public.name_available(n text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles p where lower(p.name) = lower(trim(n)));
$$;

-- Classificação pública: só nome, turma e resumo, nunca o progresso detalhado.
-- O XP da semana só conta se o aluno teve atividade nos últimos 7 dias.
-- (leaderboard2 substitui a função leaderboard da versão 1, que pode ficar na base de dados sem uso.)
create or replace function public.leaderboard2(lim int default 100)
returns table (name text, turma text, xp int, week_xp int, level int, pct int, ex_done int, chapters_done int, streak int, badges int, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.name, p.turma, g.xp, case when g.updated_at > now() - interval '7 days' then g.week_xp else 0 end,
         g.level, g.pct, g.ex_done, g.chapters_done, g.streak, g.badges, g.updated_at
  from public.progress g join public.profiles p on p.id = g.user_id
  where not p.is_teacher
  order by g.xp desc, g.updated_at asc
  limit least(greatest(coalesce(lim, 100), 1), 500);
$$;

-- Cria o perfil e o registo de progresso quando um aluno cria conta.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, turma)
  values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)), 24),
          nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'turma', '')), 30), ''));
  insert into public.progress (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_progress() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists progress_touch on public.progress;
create trigger progress_touch before update on public.progress
  for each row execute function public.touch_progress();

-- ============================================================
-- Permissões e regras de segurança (Row Level Security)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.progress enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.progress from anon, authenticated;
grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (name, turma) on public.profiles to authenticated;   -- o aluno só pode mudar o nome e a turma
grant select, insert, update on public.progress to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_progress() from public, anon, authenticated;
grant execute on function public.leaderboard2(int) to anon, authenticated;
grant execute on function public.name_available(text) to anon, authenticated;
grant execute on function public.is_teacher() to authenticated;

drop policy if exists "profiles: ler o próprio ou professor" on public.profiles;
create policy "profiles: ler o próprio ou professor" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_teacher());

drop policy if exists "profiles: alterar o próprio" on public.profiles;
create policy "profiles: alterar o próprio" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "progress: ler o próprio ou professor" on public.progress;
create policy "progress: ler o próprio ou professor" on public.progress
  for select to authenticated using (user_id = auth.uid() or public.is_teacher());

drop policy if exists "progress: criar o próprio" on public.progress;
create policy "progress: criar o próprio" on public.progress
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "progress: alterar o próprio" on public.progress;
create policy "progress: alterar o próprio" on public.progress
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- Versão 3: gestor do site (is_admin). O gestor vê todas as contas e atribui ou retira
-- o perfil de professor a partir da Área do professor. Os alunos não conseguem alterar
-- is_teacher nem is_admin (só têm permissão para alterar o nome e a turma).
-- (Corpos das funções entre plicas, para que o script também possa ser executado por ferramentas
--  que não aceitam $$.)
-- ------------------------------------------------------------
alter table public.profiles add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
'select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)';

-- Lista de todas as contas (só devolve linhas ao gestor).
create or replace function public.admin_users()
returns table (id uuid, name text, email text, turma text, is_teacher boolean, is_admin boolean, created_at timestamptz)
language sql stable security definer set search_path = public as
'select p.id, p.name, u.email::text, p.turma, p.is_teacher, p.is_admin, p.created_at
   from public.profiles p join auth.users u on u.id = p.id
  where public.is_admin()
  order by lower(p.name)';

-- Atribui ou retira o perfil de professor. Só o gestor; não pode retirá-lo à própria conta.
create or replace function public.set_teacher(target uuid, make_teacher boolean) returns boolean
language sql volatile security definer set search_path = public as
'with changed as (
   update public.profiles set is_teacher = make_teacher
    where id = target and public.is_admin() and not (target = auth.uid() and not make_teacher)
   returning 1)
 select count(*) > 0 from changed';

revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.admin_users() from public, anon;
revoke execute on function public.set_teacher(uuid, boolean) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_users() to authenticated;
grant execute on function public.set_teacher(uuid, boolean) to authenticated;

-- ------------------------------------------------------------
-- Versão 4: definições do site. O gestor escolhe que capítulos ficam ocultos aos alunos
-- (para controlar o ritmo da turma). Todos podem ler; só o gestor altera, através de set_hidden_chapters().
-- ------------------------------------------------------------
create table if not exists public.settings (
  id               int primary key default 1 check (id = 1),
  hidden_chapters  text[] not null default '{}',
  updated_at       timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;
alter table public.settings enable row level security;
revoke all on public.settings from anon, authenticated;
grant select on public.settings to anon, authenticated;
drop policy if exists "settings: todos podem ler" on public.settings;
create policy "settings: todos podem ler" on public.settings for select to anon, authenticated using (true);

create or replace function public.set_hidden_chapters(ids text[]) returns boolean
language sql volatile security definer set search_path = public as
'with changed as (
   update public.settings set hidden_chapters = coalesce(ids, ''{}''), updated_at = now()
    where id = 1 and public.is_admin()
   returning 1)
 select count(*) > 0 from changed';
revoke execute on function public.set_hidden_chapters(text[]) from public, anon;
grant execute on function public.set_hidden_chapters(text[]) to authenticated;

-- ------------------------------------------------------------
-- Versão 5: palavra-passe de acesso ao site (definida pelo gestor).
-- Guarda-se apenas o resumo SHA-256 com sal. Quem acerta recebe um "token de acesso" derivado do resumo:
-- muda sempre que o gestor muda a palavra-passe, o que obriga todos a introduzi-la de novo.
-- O token é verificado pelo Vercel (middleware.js) em cada pedido de ficheiros e ao criar uma conta.
-- ------------------------------------------------------------
alter table public.settings add column if not exists site_pass_hash text;
alter table public.settings add column if not exists site_pass_salt text;
-- O resumo e o sal nunca são legíveis pela API: só as colunas públicas.
revoke select on public.settings from anon, authenticated;
grant select (id, hidden_chapters, updated_at) on public.settings to anon, authenticated;

-- Devolve o token de acesso se a palavra-passe estiver certa (NULL caso contrário, com 1 s de espera).
create or replace function public.site_login(p text) returns text
language sql volatile security definer set search_path = public as
'select case when x.ok then x.tok end
   from (select s.site_pass_hash = encode(sha256(convert_to(s.site_pass_salt || trim(p), ''UTF8'')), ''hex'') as ok,
                encode(sha256(convert_to(s.site_pass_hash || '':acesso'', ''UTF8'')), ''hex'') as tok
           from public.settings s where s.id = 1) x,
        lateral (select pg_sleep(case when x.ok then 0 else 1 end)) z';

create or replace function public.site_token_ok(t text) returns boolean
language sql stable security definer set search_path = public as
'select coalesce((select s.site_pass_hash is not null
                     and encode(sha256(convert_to(s.site_pass_hash || '':acesso'', ''UTF8'')), ''hex'') = t
                    from public.settings s where s.id = 1), false)';

-- Só o gestor; mínimo de 4 caracteres. Devolve o novo token (o gestor continua com acesso).
create or replace function public.set_site_password(p text) returns text
language sql volatile security definer set search_path = public as
'with n as (select encode(sha256(convert_to(gen_random_uuid()::text, ''UTF8'')), ''hex'') as salt),
      upd as (update public.settings s
                 set site_pass_salt = n.salt,
                     site_pass_hash = encode(sha256(convert_to(n.salt || trim(p), ''UTF8'')), ''hex''),
                     updated_at = now()
                from n
               where s.id = 1 and public.is_admin() and char_length(trim(p)) >= 4
           returning s.site_pass_hash)
 select encode(sha256(convert_to(site_pass_hash || '':acesso'', ''UTF8'')), ''hex'') from upd';

revoke execute on function public.site_login(text) from public;
revoke execute on function public.site_token_ok(text) from public;
revoke execute on function public.set_site_password(text) from public, anon;
grant execute on function public.site_login(text) to anon, authenticated;
grant execute on function public.site_token_ok(text) to anon, authenticated;
grant execute on function public.set_site_password(text) to authenticated;

-- Criar conta exige o token de acesso (impede contas criadas diretamente pela API por quem não tem a palavra-passe).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as
'begin
  if not public.site_token_ok(new.raw_user_meta_data ->> ''access'') then
    raise exception ''Acesso ao site não autorizado: introduza primeiro a palavra-passe de acesso.'';
  end if;
  insert into public.profiles (id, name, turma)
  values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data ->> ''name''), ''''), split_part(new.email, ''@'', 1)), 24),
          nullif(left(trim(coalesce(new.raw_user_meta_data ->> ''turma'', '''')), 30), ''''));
  insert into public.progress (user_id) values (new.id);
  return new;
end';

-- ------------------------------------------------------------
-- Versão 6: pedidos de reinício do progresso. O utilizador pede; o gestor aprova ou recusa.
-- Ao aprovar, o progresso fica vazio com a marca resetAt: os dispositivos do aluno, ao sincronizar,
-- apagam também o progresso local (senão voltaria a ser enviado para a conta).
-- ------------------------------------------------------------
create table if not exists public.reset_requests (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reason      text check (reason is null or char_length(reason) <= 300),
  status      text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  created_at  timestamptz not null default now(),
  decided_at  timestamptz
);
create unique index if not exists reset_requests_one_pending on public.reset_requests (user_id) where status = 'pendente';
alter table public.reset_requests enable row level security;
revoke all on public.reset_requests from anon, authenticated;
grant select, delete on public.reset_requests to authenticated;
grant insert (reason) on public.reset_requests to authenticated;
drop policy if exists "reset: ver os próprios" on public.reset_requests;
create policy "reset: ver os próprios" on public.reset_requests for select to authenticated using (user_id = auth.uid());
drop policy if exists "reset: pedir para si" on public.reset_requests;
create policy "reset: pedir para si" on public.reset_requests for insert to authenticated with check (user_id = auth.uid() and status = 'pendente');
drop policy if exists "reset: cancelar pendente" on public.reset_requests;
create policy "reset: cancelar pendente" on public.reset_requests for delete to authenticated using (user_id = auth.uid() and status = 'pendente');

-- Pedidos para o gestor (pendentes primeiro, depois os 30 mais recentes já decididos).
create or replace function public.admin_reset_requests()
returns table (id bigint, user_id uuid, name text, email text, turma text, reason text, status text, created_at timestamptz, decided_at timestamptz)
language sql stable security definer set search_path = public as
'(select r.id, r.user_id, p.name, u.email::text, p.turma, r.reason, r.status, r.created_at, r.decided_at
    from public.reset_requests r join public.profiles p on p.id = r.user_id join auth.users u on u.id = r.user_id
   where public.is_admin() and r.status = ''pendente'' order by r.created_at)
 union all
 (select r.id, r.user_id, p.name, u.email::text, p.turma, r.reason, r.status, r.created_at, r.decided_at
    from public.reset_requests r join public.profiles p on p.id = r.user_id join auth.users u on u.id = r.user_id
   where public.is_admin() and r.status <> ''pendente'' order by r.decided_at desc limit 30)';

-- Aprova (apaga o progresso) ou recusa um pedido pendente. Só o gestor.
create or replace function public.decide_reset(req bigint, approve boolean) returns boolean
language plpgsql volatile security definer set search_path = public as
'declare uid uuid;
begin
  if not public.is_admin() then return false; end if;
  update public.reset_requests set status = case when approve then ''aprovado'' else ''recusado'' end, decided_at = now()
   where id = req and status = ''pendente'' returning user_id into uid;
  if uid is null then return false; end if;
  if approve then
    update public.progress
       set state = jsonb_build_object(''resetAt'', floor(extract(epoch from now()) * 1000)::bigint),
           xp = 0, week_xp = 0, level = 1, pct = 0, ex_done = 0, chapters_done = 0, streak = 0, badges = 0
     where user_id = uid;
  end if;
  return true;
end';

revoke execute on function public.admin_reset_requests() from public, anon;
revoke execute on function public.decide_reset(bigint, boolean) from public, anon;
grant execute on function public.admin_reset_requests() to authenticated;
grant execute on function public.decide_reset(bigint, boolean) to authenticated;

-- ============================================================
-- Gestor do site: executar uma única vez, com o email da conta do gestor. A partir daí,
-- o gestor atribui o perfil de professor a outras contas na Área do professor.
--   update public.profiles set is_admin = true, is_teacher = true
--   where id = (select id from auth.users where email = 'email@do.gestor');
-- Palavra-passe inicial de acesso ao site (depois, o gestor muda-a na Área do professor):
--   with n as (select md5(random()::text) as salt)
--   update public.settings set site_pass_salt = n.salt,
--     site_pass_hash = encode(sha256(convert_to(n.salt || 'palavra-passe', 'UTF8')), 'hex') from n where id = 1;
-- ============================================================
