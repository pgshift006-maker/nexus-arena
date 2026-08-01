-- Correção de modelo: "admin" não é um cargo global que gerencia QUALQUER
-- gincana — cada admin só gerencia as gincanas que ele mesmo criou (é como
-- uma assinatura por competição). role='admin' continua sendo o requisito
-- pra CRIAR uma gincana nova (events_insert, migration 009); mas gerenciar
-- equipes/confrontos/modalidades de uma gincana já criada é restrito a
-- quem é o created_by daquele evento específico.

drop policy if exists "teams_write" on teams;
create policy "teams_write" on teams
  for all using (
    auth.uid() = (select created_by from events where id = teams.event_id)
  );

drop policy if exists "team_members_insert_admin" on team_members;
create policy "team_members_insert_owner" on team_members
  for insert with check (
    auth.uid() = (
      select e.created_by from teams t join events e on e.id = t.event_id where t.id = team_members.team_id
    )
  );

drop policy if exists "team_members_delete" on team_members;
create policy "team_members_delete" on team_members
  for delete using (
    auth.uid() = user_id
    or auth.uid() = (
      select e.created_by from teams t join events e on e.id = t.event_id where t.id = team_members.team_id
    )
  );

drop policy if exists "matches_write" on matches;
create policy "matches_write" on matches
  for all using (
    auth.uid() = (select created_by from events where id = matches.event_id)
  );

drop policy if exists "modalidades_write" on modalidades;
create policy "modalidades_write" on modalidades
  for all using (
    auth.uid() = (select created_by from events where id = modalidades.event_id)
  );

-- Fecha o gap de segurança: profiles_update_own (migration 008) deixava
-- qualquer usuário autenticado alterar o próprio role pela API, o que
-- furaria a trava de assinatura (auto-promover a admin sem pagar). Um
-- trigger reverte qualquer troca de role feita por uma sessão comum de
-- usuário; edições diretas no SQL Editor (que não rodam como 'authenticated')
-- continuam funcionando normalmente.

create or replace function prevent_role_self_change()
returns trigger as $$
begin
  if new.role <> old.role and auth.role() = 'authenticated' then
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists protect_profile_role on profiles;
create trigger protect_profile_role
  before update on profiles
  for each row execute function prevent_role_self_change();
