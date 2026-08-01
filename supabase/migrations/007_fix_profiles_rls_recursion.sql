-- Corrige recursão infinita (Postgres 42P17) nas políticas de RLS baseadas
-- em school_id: a subquery `select school_id from profiles where id = auth.uid()`
-- usada dentro da própria policy de `profiles` reaciona essa mesma policy.
-- Uma função SECURITY DEFINER contorna isso, pois roda com os privilégios do
-- dono da função, que não está sujeito à RLS (FORCE ROW LEVEL SECURITY não
-- foi habilitado em profiles).

create or replace function public.current_user_school_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select school_id from profiles where id = auth.uid()
$$;

drop policy if exists "school_isolation_profiles" on profiles;
create policy "school_isolation_profiles" on profiles
  for all using (
    school_id = public.current_user_school_id()
  );

drop policy if exists "school_isolation_events" on events;
create policy "school_isolation_events" on events
  for all using (
    school_id = public.current_user_school_id()
  );

drop policy if exists "school_isolation_posts" on posts;
create policy "school_isolation_posts" on posts
  for all using (
    school_id = public.current_user_school_id()
  );
