-- Tabela de notificações
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles on delete cascade,
  type       text not null, -- like | match_live | match_result | new_match
  title      text not null,
  body       text,
  link       text,
  read       boolean not null default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "notifications_own" on notifications
  for all using (auth.uid() = user_id);

alter publication supabase_realtime add table notifications;

-- ─────────────────────────────────────────
-- Trigger 1: curtida em post → avisa o autor
-- ─────────────────────────────────────────
create or replace function notify_post_like()
returns trigger as $$
declare
  v_author  uuid;
  v_liker   text;
  v_post_id uuid;
begin
  v_post_id := NEW.post_id;

  select author_id into v_author from posts where id = v_post_id;
  select name      into v_liker  from profiles where id = NEW.user_id;

  -- não notifica se curtiu o próprio post
  if v_author = NEW.user_id then return new; end if;

  insert into notifications (user_id, type, title, body, link)
  values (
    v_author,
    'like',
    v_liker || ' curtiu seu post',
    null,
    '/feed'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_post_liked
  after insert on post_likes
  for each row execute procedure notify_post_like();

-- ─────────────────────────────────────────
-- Trigger 2: confronto muda status → avisa membros das equipes
-- ─────────────────────────────────────────
create or replace function notify_match_status()
returns trigger as $$
declare
  v_rec      record;
  v_team_a   text;
  v_team_b   text;
  v_event_id uuid;
  v_title    text;
  v_body     text;
  v_link     text;
begin
  if NEW.status = OLD.status then return new; end if;
  if NEW.status not in ('ao_vivo', 'encerrado') then return new; end if;

  select name into v_team_a from teams where id = NEW.team_a_id;
  select name into v_team_b from teams where id = NEW.team_b_id;

  v_event_id := NEW.event_id;
  v_link     := '/eventos/confrontos?id=' || v_event_id::text;

  if NEW.status = 'ao_vivo' then
    v_title := '⚡ Confronto ao vivo!';
    v_body  := v_team_a || ' × ' || v_team_b || ' começou agora';
  else
    v_title := '🏁 Confronto encerrado';
    v_body  := v_team_a || ' ' || NEW.score_a || ' × ' || NEW.score_b || ' ' || v_team_b;
  end if;

  -- notifica todos os membros das duas equipes
  for v_rec in
    select distinct tm.user_id
    from team_members tm
    where tm.team_id in (NEW.team_a_id, NEW.team_b_id)
  loop
    insert into notifications (user_id, type, title, body, link)
    values (v_rec.user_id, NEW.status, v_title, v_body, v_link);
  end loop;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_match_status_change
  after update on matches
  for each row execute procedure notify_match_status();
