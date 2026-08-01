-- Modalidades: uma gincana pode ter vários esportes/atividades. Cada
-- confronto passa a pertencer a uma modalidade do evento. A classificação
-- geral continua somando todos os confrontos do evento (pontuação da
-- gincana como um todo), então não precisa mudar.

create table modalidades (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

alter table matches add column modalidade_id uuid references modalidades on delete set null;

alter table modalidades enable row level security;

create policy "modalidades_read" on modalidades
  for select using (auth.uid() is not null);

create policy "modalidades_write" on modalidades
  for all using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

-- Só admin cria equipes e decide quem entra numa equipe. Qualquer membro
-- ainda pode sair da própria equipe voluntariamente.

drop policy if exists "teams_write" on teams;
create policy "teams_write" on teams
  for all using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

drop policy if exists "team_members_write" on team_members;

create policy "team_members_insert_admin" on team_members
  for insert with check (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

create policy "team_members_delete" on team_members
  for delete using (
    auth.uid() = user_id
    or (select role from profiles where id = auth.uid()) = 'admin'
  );

-- Confrontos (matches) também ficam exclusivos do admin, consistente com
-- a trava já existente na UI.

drop policy if exists "matches_write" on matches;
create policy "matches_write" on matches
  for all using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );
