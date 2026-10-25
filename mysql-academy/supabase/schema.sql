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

-- ------------------------------------------------------------
-- Versão 7: pontuação do jogo Protocolo NEXUS. Guarda-se o melhor resultado de cada jogador
-- (missão completa, a começar na sala 1); a tabela de melhores jogadores é pública dentro do site.
-- ------------------------------------------------------------
create table if not exists public.game_scores (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  score      int not null default 0 check (score between 0 and 30000),
  time_s     int not null default 0,
  rooms      int not null default 0,
  runs       int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.game_scores enable row level security;
revoke all on public.game_scores from anon, authenticated;

-- Regista uma missão: guarda a melhor pontuação (em empate, o menor tempo) e conta as missões jogadas.
create or replace function public.submit_game_score(s int, secs int, n int) returns int
language plpgsql volatile security definer set search_path = public as
'declare uid uuid := auth.uid(); b int;
begin
  if uid is null or s is null or s < 0 or s > 30000 or secs < 60 or secs > 86400 or n < 1 or n > 12 then return null; end if;
  insert into public.game_scores as g (user_id, score, time_s, rooms, runs, updated_at)
  values (uid, s, secs, n, 1, now())
  on conflict (user_id) do update set
    runs = g.runs + 1,
    score = greatest(g.score, excluded.score),
    time_s = case when excluded.score > g.score or (excluded.score = g.score and excluded.time_s < g.time_s) then excluded.time_s else g.time_s end,
    rooms = case when excluded.score >= g.score then excluded.rooms else g.rooms end,
    updated_at = case when excluded.score > g.score then now() else g.updated_at end
  returning g.score into b;
  return b;
end';

create or replace function public.game_leaderboard(lim int default 50)
returns table (name text, turma text, score int, time_s int, runs int, updated_at timestamptz)
language sql stable security definer set search_path = public as
'select p.name, p.turma, g.score, g.time_s, g.runs, g.updated_at
   from public.game_scores g join public.profiles p on p.id = g.user_id
  where g.score > 0
  order by g.score desc, g.time_s asc, g.updated_at asc
  limit least(greatest(coalesce(lim, 50), 1), 300)';

revoke execute on function public.submit_game_score(int, int, int) from public, anon;
revoke execute on function public.game_leaderboard(int) from public;
grant execute on function public.submit_game_score(int, int, int) to authenticated;
grant execute on function public.game_leaderboard(int) to anon, authenticated;

-- ------------------------------------------------------------
-- Versão 8: no Protocolo NEXUS a missão termina quando o tempo de uma sala chega a 0, por isso todas as
-- missões (a começar na sala 1) contam. A melhor de cada jogador é a de maior nível atingido (salas
-- concluídas), depois a de mais pontos e, em empate, a mais rápida. game_leaderboard2 devolve o nível.
-- ------------------------------------------------------------
create or replace function public.submit_game_score(s int, secs int, n int) returns int
language plpgsql volatile security definer set search_path = public as
'declare uid uuid := auth.uid(); b int;
begin
  if uid is null or s is null or s < 0 or s > 30000 or secs < 10 or secs > 86400 or n < 0 or n > 12 then return null; end if;
  insert into public.game_scores as g (user_id, score, time_s, rooms, runs, updated_at)
  values (uid, s, secs, n, 1, now())
  on conflict (user_id) do update set
    runs = g.runs + 1,
    score = case when (excluded.rooms, excluded.score, -excluded.time_s) > (g.rooms, g.score, -g.time_s) then excluded.score else g.score end,
    time_s = case when (excluded.rooms, excluded.score, -excluded.time_s) > (g.rooms, g.score, -g.time_s) then excluded.time_s else g.time_s end,
    updated_at = case when (excluded.rooms, excluded.score, -excluded.time_s) > (g.rooms, g.score, -g.time_s) then now() else g.updated_at end,
    rooms = case when (excluded.rooms, excluded.score, -excluded.time_s) > (g.rooms, g.score, -g.time_s) then excluded.rooms else g.rooms end
  returning g.score into b;
  return b;
end';

create or replace function public.game_leaderboard2(lim int default 50)
returns table (name text, turma text, score int, rooms int, time_s int, runs int, updated_at timestamptz)
language sql stable security definer set search_path = public as
'select p.name, p.turma, g.score, g.rooms, g.time_s, g.runs, g.updated_at
   from public.game_scores g join public.profiles p on p.id = g.user_id
  where g.score > 0 or g.rooms > 0
  order by g.rooms desc, g.score desc, g.time_s asc, g.updated_at asc
  limit least(greatest(coalesce(lim, 50), 1), 300)';

revoke execute on function public.game_leaderboard2(int) from public;
grant execute on function public.game_leaderboard2(int) to anon, authenticated;

-- ------------------------------------------------------------
-- Versão 9: quiz ao vivo (estilo Kahoot). O professor cria uma sessão com as perguntas de um capítulo;
-- os alunos entram com o código (sem conta, só com um nome) e respondem no telemóvel ou no computador.
-- Tudo passa por funções (security definer): a resposta certa só é enviada aos alunos depois de revelada.
-- ------------------------------------------------------------
create table if not exists public.live_sessions (
  code         text primary key,
  host         uuid not null references auth.users (id) on delete cascade,
  chapter      text not null,
  title        text,
  questions    jsonb not null,
  secs         int not null default 20 check (secs between 5 and 120),
  state        text not null default 'lobby' check (state in ('lobby', 'question', 'reveal', 'end')),
  qindex       int not null default -1,
  q_started_at timestamptz,
  created_at   timestamptz not null default now()
);
create table if not exists public.live_players (
  code      text not null references public.live_sessions (code) on delete cascade,
  token     uuid not null default gen_random_uuid(),
  name      text not null,
  score     int not null default 0,
  joined_at timestamptz not null default now(),
  primary key (code, token),
  unique (code, name)
);
create table if not exists public.live_answers (
  code   text not null,
  token  uuid not null,
  qindex int not null,
  choice int not null,
  ms     int not null,
  points int not null,
  primary key (code, token, qindex),
  foreign key (code, token) references public.live_players (code, token) on delete cascade
);
alter table public.live_sessions enable row level security;
alter table public.live_players enable row level security;
alter table public.live_answers enable row level security;
revoke all on public.live_sessions, public.live_players, public.live_answers from anon, authenticated;

-- O professor cria a sessão; devolve o código de 6 algarismos.
create or replace function public.live_create(ch text, ti text, qs jsonb, s int) returns text
language plpgsql volatile security definer set search_path = public as
'declare c text;
begin
  if not public.is_teacher() or jsonb_typeof(qs) <> ''array'' or jsonb_array_length(qs) < 1 or jsonb_array_length(qs) > 40 then return null; end if;
  loop
    c := lpad((floor(random() * 900000) + 100000)::int::text, 6, ''0'');
    exit when not exists (select 1 from public.live_sessions where code = c);
  end loop;
  insert into public.live_sessions (code, host, chapter, title, questions, secs)
  values (c, auth.uid(), left(ch, 20), left(ti, 120), qs, greatest(5, least(coalesce(s, 20), 120)));
  return c;
end';

-- Comandos do professor: start/next (pergunta seguinte ou fim), reveal (mostra a resposta), end.
create or replace function public.live_control(c text, act text) returns boolean
language plpgsql volatile security definer set search_path = public as
'declare r public.live_sessions;
begin
  select * into r from public.live_sessions where code = c and host = auth.uid();
  if not found then return false; end if;
  if act in (''start'', ''next'') and r.state in (''lobby'', ''reveal'') then
    if r.qindex + 1 >= jsonb_array_length(r.questions) then
      update public.live_sessions set state = ''end'' where code = c;
    else
      update public.live_sessions set state = ''question'', qindex = r.qindex + 1, q_started_at = now() where code = c;
    end if;
  elsif act = ''reveal'' and r.state = ''question'' then
    update public.live_sessions set state = ''reveal'' where code = c;
  elsif act = ''end'' then
    update public.live_sessions set state = ''end'' where code = c;
  else
    return false;
  end if;
  return true;
end';

-- Um aluno entra com um nome (único na sessão); devolve o seu token secreto.
create or replace function public.live_join(c text, n text) returns uuid
language plpgsql volatile security definer set search_path = public as
'declare t uuid; nm text := left(regexp_replace(trim(coalesce(n, '''')), ''\s+'', '' '', ''g''), 20);
begin
  if length(nm) < 1 or not exists (select 1 from public.live_sessions where code = c and state <> ''end'') then return null; end if;
  if (select count(*) from public.live_players where code = c) >= 200 then return null; end if;
  insert into public.live_players (code, name) values (c, nm) on conflict do nothing returning token into t;
  return t;
end';

-- Resposta de um aluno: só conta dentro do tempo; até 1000 pontos, mais quanto mais rápida (mínimo 500 se certa).
create or replace function public.live_answer(c text, t uuid, ch int) returns boolean
language plpgsql volatile security definer set search_path = public as
'declare r public.live_sessions; el double precision; q jsonb; p int;
begin
  select * into r from public.live_sessions where code = c;
  if not found or r.state <> ''question'' then return false; end if;
  if not exists (select 1 from public.live_players where code = c and token = t) then return false; end if;
  el := extract(epoch from now() - r.q_started_at);
  if el > r.secs + 1.5 then return false; end if;
  q := r.questions -> r.qindex;
  if ch < 0 or ch >= jsonb_array_length(q -> ''opts'') then return false; end if;
  p := case when ch = (q ->> ''a'')::int then greatest(500, round(1000 * (1 - least(el, r.secs) / r.secs / 2)))::int else 0 end;
  insert into public.live_answers (code, token, qindex, choice, ms, points) values (c, t, r.qindex, ch, (el * 1000)::int, p)
  on conflict do nothing;
  if found then update public.live_players set score = score + p where code = c and token = t; end if;
  return true;
end';

-- Estado da sessão para os alunos (token) e para o professor (anfitrião): pergunta, tempo, respostas, classificação.
create or replace function public.live_poll(c text, t uuid default null) returns jsonb
language plpgsql stable security definer set search_path = public as
'declare r public.live_sessions; q jsonb; host boolean; res jsonb; me jsonb := null; n int; ans int; lft double precision;
begin
  select * into r from public.live_sessions where code = c;
  if not found then return null; end if;
  host := coalesce(r.host = auth.uid(), false);
  select count(*) into n from public.live_players where code = c;
  res := jsonb_build_object(''state'', r.state, ''qindex'', r.qindex, ''total'', jsonb_array_length(r.questions), ''secs'', r.secs,
    ''title'', r.title, ''chapter'', r.chapter, ''players'', n, ''host'', host);
  if r.state in (''question'', ''reveal'') then
    q := r.questions -> r.qindex;
    lft := greatest(0, r.secs - extract(epoch from now() - r.q_started_at));
    select count(*) into ans from public.live_answers where code = c and qindex = r.qindex;
    res := res || jsonb_build_object(''left'', lft, ''answered'', ans,
      ''question'', jsonb_build_object(''q'', q -> ''q'', ''sql'', q -> ''sql'', ''opts'', q -> ''opts''));
    if r.state = ''reveal'' then
      res := res || jsonb_build_object(''a'', q -> ''a'', ''why'', q -> ''why'', ''counts'',
        (select jsonb_agg((select count(*) from public.live_answers x where x.code = c and x.qindex = r.qindex and x.choice = i) order by i)
           from generate_series(0, jsonb_array_length(q -> ''opts'') - 1) i));
    end if;
  end if;
  if r.state in (''reveal'', ''end'') or host then
    res := res || jsonb_build_object(''top'', coalesce((select jsonb_agg(jsonb_build_object(''name'', name, ''score'', score) order by score desc, joined_at)
      from (select name, score, joined_at from public.live_players where code = c order by score desc, joined_at limit case when host then 200 else 10 end) z), ''[]''::jsonb));
  end if;
  if t is not null then
    select jsonb_build_object(''name'', p.name, ''score'', p.score,
      ''rank'', (select count(*) + 1 from public.live_players o where o.code = c and o.score > p.score),
      ''answered'', exists (select 1 from public.live_answers a where a.code = c and a.token = t and a.qindex = r.qindex),
      ''last'', case when r.state = ''reveal'' then (select jsonb_build_object(''choice'', a.choice, ''points'', a.points) from public.live_answers a where a.code = c and a.token = t and a.qindex = r.qindex) end)
      into me from public.live_players p where p.code = c and p.token = t;
    res := res || jsonb_build_object(''me'', me);
  end if;
  return res;
end';

revoke execute on function public.live_create(text, text, jsonb, int) from public, anon;
revoke execute on function public.live_control(text, text) from public, anon;
revoke execute on function public.live_join(text, text) from public;
revoke execute on function public.live_answer(text, uuid, int) from public;
revoke execute on function public.live_poll(text, uuid) from public;
grant execute on function public.live_create(text, text, jsonb, int) to authenticated;
grant execute on function public.live_control(text, text) to authenticated;
grant execute on function public.live_join(text, text) to anon, authenticated;
grant execute on function public.live_answer(text, uuid, int) to anon, authenticated;
grant execute on function public.live_poll(text, uuid) to anon, authenticated;

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
