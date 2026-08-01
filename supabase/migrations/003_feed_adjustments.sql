-- school_id opcional nos posts até o módulo de escolas estar pronto
alter table posts alter column school_id drop not null;

-- RLS simplificado: usuário autenticado lê tudo, só edita o próprio
drop policy if exists "school_isolation_posts" on posts;

create policy "posts_read" on posts
  for select using (auth.uid() is not null);

create policy "posts_insert" on posts
  for insert with check (auth.uid() = author_id);

create policy "posts_delete" on posts
  for delete using (auth.uid() = author_id);

-- RLS para hashtags e curtidas
alter table post_hashtags enable row level security;
alter table post_likes enable row level security;

create policy "hashtags_read" on post_hashtags
  for select using (auth.uid() is not null);

create policy "hashtags_insert" on post_hashtags
  for insert with check (auth.uid() is not null);

create policy "likes_read" on post_likes
  for select using (auth.uid() is not null);

create policy "likes_insert" on post_likes
  for insert with check (auth.uid() = user_id);

create policy "likes_delete" on post_likes
  for delete using (auth.uid() = user_id);

-- Trigger para manter likes_count atualizado
create or replace function update_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set likes_count = likes_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set likes_count = likes_count - 1 where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_like_change
  after insert or delete on post_likes
  for each row execute procedure update_likes_count();

-- Realtime para curtidas (posts já estava adicionado)
alter publication supabase_realtime add table post_likes;
