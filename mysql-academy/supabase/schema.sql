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
  xp             int not null default 0 check (xp between 0 and 5000),
  level          int not null default 1 check (level between 1 and 50),
  pct            int not null default 0 check (pct between 0 and 100),
  ex_done        int not null default 0 check (ex_done between 0 and 1000),
  chapters_done  int not null default 0 check (chapters_done between 0 and 50),
  streak         int not null default 0 check (streak between 0 and 3660),
  badges         int not null default 0 check (badges between 0 and 100),
  updated_at     timestamptz not null default now(),
  constraint progress_state_size check (pg_column_size(state) < 300000)
);

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

-- Classificação pública: só nome e resumo, nunca o progresso detalhado.
create or replace function public.leaderboard(lim int default 100)
returns table (name text, xp int, level int, pct int, ex_done int, chapters_done int, streak int, badges int, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.name, g.xp, g.level, g.pct, g.ex_done, g.chapters_done, g.streak, g.badges, g.updated_at
  from public.progress g join public.profiles p on p.id = g.user_id
  where not p.is_teacher
  order by g.xp desc, g.updated_at asc
  limit least(greatest(coalesce(lim, 100), 1), 500);
$$;

-- Cria o perfil e o registo de progresso quando um aluno cria conta.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)), 24));
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
grant update (name) on public.profiles to authenticated;          -- o aluno só pode mudar o nome
grant select, insert, update on public.progress to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_progress() from public, anon, authenticated;
grant execute on function public.leaderboard(int) to anon, authenticated;
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

-- ============================================================
-- Para dar acesso de professor a uma conta (executar à parte, com o nome certo):
--   update public.profiles set is_teacher = true where lower(name) = lower('Nome do Professor');
-- ============================================================
