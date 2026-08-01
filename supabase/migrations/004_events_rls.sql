-- school_id opcional nos eventos até o módulo de escolas estar pronto
alter table events alter column school_id drop not null;

-- RLS eventos
drop policy if exists "school_isolation_events" on events;

create policy "events_read" on events
  for select using (auth.uid() is not null);

create policy "events_insert" on events
  for insert with check (auth.uid() = created_by);

create policy "events_update" on events
  for update using (auth.uid() = created_by);

create policy "events_delete" on events
  for delete using (auth.uid() = created_by);

-- RLS equipes
alter table teams enable row level security;

create policy "teams_read" on teams
  for select using (auth.uid() is not null);

create policy "teams_write" on teams
  for all using (auth.uid() is not null);

-- RLS membros de equipe
alter table team_members enable row level security;

create policy "team_members_read" on team_members
  for select using (auth.uid() is not null);

create policy "team_members_write" on team_members
  for all using (auth.uid() is not null);

-- RLS confrontos
alter table matches enable row level security;

create policy "matches_read" on matches
  for select using (auth.uid() is not null);

create policy "matches_write" on matches
  for all using (auth.uid() is not null);

-- RLS enquetes
alter table polls enable row level security;

create policy "polls_read" on polls
  for select using (auth.uid() is not null);

create policy "polls_write" on polls
  for all using (auth.uid() is not null);

-- RLS votos
alter table poll_votes enable row level security;

create policy "votes_read" on poll_votes
  for select using (auth.uid() is not null);

create policy "votes_insert" on poll_votes
  for insert with check (auth.uid() = user_id);

create policy "votes_delete" on poll_votes
  for delete using (auth.uid() = user_id);

-- Realtime já configurado nas migrations anteriores para matches e poll_votes
