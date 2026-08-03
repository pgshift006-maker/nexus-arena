-- Competições públicas/privadas. Toda competição ganha uma visibilidade
-- (pública por padrão, preserva o comportamento atual sem precisar de
-- backfill) e uma capa opcional. Competições privadas continuam listadas
-- em /eventos para descoberta (events_read segue aberta), mas o conteúdo
-- (posts, equipes, confrontos, enquetes...) só fica visível para o dono e
-- para participantes aprovados.

alter table events add column visibility text not null default 'public' check (visibility in ('public', 'private'));
alter table events add column cover_url text;

-- Quem participa de uma competição privada: 2 colunas cobrem os 3 fluxos
-- pedidos (solicitação, convite, adição manual) sem precisar de um enum
-- de "tipo" separado.
--   solicitação:    initiated_by='user',  status='pending'  -> dono resolve
--   convite:        initiated_by='owner', status='pending'  -> convidado resolve
--   adição manual:  initiated_by='owner', status='approved' direto
-- Reenvio após recusa é feito como delete + insert (mantém as policies de
-- update simples, sem precisar de uma transição "declined -> pending").
create table event_participants (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events on delete cascade,
  user_id      uuid not null references profiles on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  initiated_by text not null check (initiated_by in ('user', 'owner')),
  created_at   timestamptz default now(),
  resolved_at  timestamptz,
  unique (event_id, user_id)
);

create index event_participants_user_id_idx on event_participants(user_id);

alter table event_participants enable row level security;

create policy "event_participants_select" on event_participants
  for select using (
    auth.uid() = user_id
    or auth.uid() = (select created_by from events where id = event_participants.event_id)
  );

create policy "event_participants_insert_self_request" on event_participants
  for insert with check (
    auth.uid() = user_id and initiated_by = 'user' and status = 'pending'
  );

create policy "event_participants_insert_owner" on event_participants
  for insert with check (
    initiated_by = 'owner'
    and status in ('pending', 'approved')
    and auth.uid() = (select created_by from events where id = event_participants.event_id)
  );

-- Duas policies de update assimétricas: cada lado só resolve a linha que
-- o OUTRO lado iniciou, então nunca dá pra alguém aprovar o próprio pedido
-- nem "aceitar" o próprio convite em nome do dono.
create policy "event_participants_owner_resolves_request" on event_participants
  for update
  using (
    status = 'pending' and initiated_by = 'user'
    and auth.uid() = (select created_by from events where id = event_participants.event_id)
  )
  with check (
    initiated_by = 'user' and status in ('approved', 'declined')
    and auth.uid() = (select created_by from events where id = event_participants.event_id)
  );

create policy "event_participants_user_resolves_invite" on event_participants
  for update
  using (
    status = 'pending' and initiated_by = 'owner' and auth.uid() = user_id
  )
  with check (
    initiated_by = 'owner' and status in ('approved', 'declined') and auth.uid() = user_id
  );

create policy "event_participants_delete" on event_participants
  for delete using (
    auth.uid() = user_id
    or auth.uid() = (select created_by from events where id = event_participants.event_id)
  );

alter publication supabase_realtime add table event_participants;

-- Bucket público para capas de competição, mesmo padrão de pastas por
-- usuário dos buckets de avatars/posts. Público porque a capa precisa
-- aparecer mesmo pra quem não é participante (é o que permite descobrir
-- e pedir pra entrar numa competição privada).
insert into storage.buckets (id, name, public)
values ('event-covers', 'event-covers', true)
on conflict (id) do nothing;

create policy "event_cover_public_read" on storage.objects
  for select using (bucket_id = 'event-covers');

create policy "event_cover_upload_own" on storage.objects
  for insert with check (
    bucket_id = 'event-covers' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "event_cover_update_own" on storage.objects
  for update using (
    bucket_id = 'event-covers' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "event_cover_delete_own" on storage.objects
  for delete using (
    bucket_id = 'event-covers' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Helper de visibilidade, mesmo padrão SECURITY DEFINER de
-- current_user_school_id() (migration 007): precisa rodar sem RLS porque
-- lê events e event_participants, que são RLS-protegidas.
create or replace function public.can_view_event(p_event_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from events e
    where e.id = p_event_id
      and (
        e.visibility = 'public'
        or e.created_by = auth.uid()
        or exists (
          select 1 from event_participants ep
          where ep.event_id = e.id and ep.user_id = auth.uid() and ep.status = 'approved'
        )
      )
  );
$$;

-- events_read continua aberta de propósito (descoberta de competições
-- privadas). Todo o resto do conteúdo passa a depender de can_view_event().

drop policy if exists "posts_read" on posts;
create policy "posts_read" on posts
  for select using (event_id is null or public.can_view_event(event_id));

drop policy if exists "comments_read" on comments;
create policy "comments_read" on comments
  for select using (
    exists (
      select 1 from posts p
      where p.id = comments.post_id
        and (p.event_id is null or public.can_view_event(p.event_id))
    )
  );

drop policy if exists "teams_read" on teams;
create policy "teams_read" on teams
  for select using (public.can_view_event(event_id));

drop policy if exists "team_members_read" on team_members;
create policy "team_members_read" on team_members
  for select using (
    public.can_view_event((select t.event_id from teams t where t.id = team_members.team_id))
  );

drop policy if exists "matches_read" on matches;
create policy "matches_read" on matches
  for select using (public.can_view_event(event_id));

drop policy if exists "modalidades_read" on modalidades;
create policy "modalidades_read" on modalidades
  for select using (public.can_view_event(event_id));

drop policy if exists "polls_read" on polls;
create policy "polls_read" on polls
  for select using (
    public.can_view_event((select m.event_id from matches m where m.id = polls.match_id))
  );

drop policy if exists "votes_read" on poll_votes;
create policy "votes_read" on poll_votes
  for select using (
    public.can_view_event((select m.event_id from matches m join polls p on p.id = poll_votes.poll_id where m.id = p.match_id))
  );

-- Duas policies "for all" sobrando de migrations antigas dariam bypass nas
-- leituras acima via OR (Postgres combina múltiplas policies permissivas):
--
-- 1) "school_isolation_posts" (migration 007) ainda existe e cobre SELECT.
--    Hoje é inofensiva porque school_id costuma estar nulo dos dois lados
--    (módulo de escolas não está pronto), mas no dia em que school_id
--    passar a ser preenchido ela liberaria leitura de posts privados pra
--    qualquer um da mesma escola. Sem uso real hoje (posts_insert/delete
--    já cobrem escrita) — remover.
drop policy if exists "school_isolation_posts" on posts;

-- 2) "polls_write" (migration 004) nunca foi restrita como teams_write/
--    matches_write/modalidades_write foram na migration 011 — continua
--    "for all using (auth.uid() is not null)", o que também libera SELECT
--    pra qualquer autenticado. Troca por policies explícitas só de
--    escrita, mantendo a mesma condição de hoje (não é o escopo desta
--    migration apertar quem pode escrever enquetes, só parar de vazar
--    leitura por essa policy).
drop policy if exists "polls_write" on polls;
create policy "polls_insert" on polls
  for insert with check (auth.uid() is not null);
create policy "polls_update" on polls
  for update using (auth.uid() is not null);
create policy "polls_delete" on polls
  for delete using (auth.uid() is not null);

-- Ao trocar uma competição de pública pra privada, quem já está em uma
-- equipe dela vira participante aprovado automaticamente — ninguém perde
-- acesso ao que já estava participando.
create or replace function auto_approve_existing_team_members()
returns trigger as $$
begin
  if NEW.visibility = 'private' and OLD.visibility = 'public' then
    insert into event_participants (event_id, user_id, status, initiated_by, resolved_at)
    select NEW.id, tm.user_id, 'approved', 'owner', now()
    from team_members tm join teams t on t.id = tm.team_id
    where t.event_id = NEW.id
    on conflict (event_id, user_id) do nothing;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_event_visibility_change
  after update of visibility on events
  for each row execute procedure auto_approve_existing_team_members();

-- Remover (ou recusar) um participante também tira ele das equipes
-- daquela competição, pra não sobrar gente sem acesso ainda listada em
-- equipe/pontuação.
create or replace function remove_from_teams_on_participant_removal()
returns trigger as $$
declare
  v_event_id uuid := coalesce(OLD.event_id, NEW.event_id);
  v_user_id  uuid := coalesce(OLD.user_id, NEW.user_id);
begin
  if TG_OP = 'DELETE' or (TG_OP = 'UPDATE' and NEW.status = 'declined' and OLD.status <> 'declined') then
    delete from team_members
    where user_id = v_user_id
      and team_id in (select id from teams where event_id = v_event_id);
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger on_event_participant_removed
  after update or delete on event_participants
  for each row execute procedure remove_from_teams_on_participant_removal();

-- Notificações de solicitação/convite, mesmo padrão de notify_post_like()/
-- notify_match_status() (migration 005): trigger SECURITY DEFINER, sem
-- insert client-side (a RLS de notifications só deixa cada um inserir
-- notificação pra si mesmo).
create or replace function notify_event_participant_change()
returns trigger as $$
declare
  v_event_name text;
  v_owner_id   uuid;
  v_user_name  text;
  v_link       text;
begin
  select name, created_by into v_event_name, v_owner_id from events where id = coalesce(NEW.event_id, OLD.event_id);
  select name into v_user_name from profiles where id = coalesce(NEW.user_id, OLD.user_id);
  v_link := '/eventos/detalhe?id=' || coalesce(NEW.event_id, OLD.event_id)::text;

  if TG_OP = 'INSERT' then
    if NEW.initiated_by = 'user' and NEW.status = 'pending' then
      insert into notifications (user_id, type, title, link)
      values (v_owner_id, 'event_join_request', v_user_name || ' pediu para entrar em ' || v_event_name, v_link);
    elsif NEW.initiated_by = 'owner' and NEW.status = 'pending' then
      insert into notifications (user_id, type, title, link)
      values (NEW.user_id, 'event_invite', 'Você foi convidado para ' || v_event_name, v_link);
    end if;
    return NEW;
  end if;

  if TG_OP = 'UPDATE' and NEW.status <> OLD.status then
    if NEW.initiated_by = 'user' and NEW.status in ('approved', 'declined') then
      insert into notifications (user_id, type, title, link) values (
        NEW.user_id,
        case when NEW.status = 'approved' then 'event_request_approved' else 'event_request_declined' end,
        case when NEW.status = 'approved' then 'Sua solicitação para ' || v_event_name || ' foi aceita'
             else 'Sua solicitação para ' || v_event_name || ' foi recusada' end,
        v_link
      );
    elsif NEW.initiated_by = 'owner' and NEW.status in ('approved', 'declined') then
      insert into notifications (user_id, type, title, link) values (
        v_owner_id,
        case when NEW.status = 'approved' then 'event_invite_accepted' else 'event_invite_declined' end,
        v_user_name || (case when NEW.status = 'approved' then ' aceitou o convite para ' else ' recusou o convite para ' end) || v_event_name,
        v_link
      );
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_event_participant_change
  after insert or update on event_participants
  for each row execute procedure notify_event_participant_change();
