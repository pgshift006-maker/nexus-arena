-- RLS para comentários
alter table comments enable row level security;

create policy "comments_read" on comments
  for select using (auth.uid() is not null);

create policy "comments_insert" on comments
  for insert with check (auth.uid() = author_id);

create policy "comments_delete" on comments
  for delete using (auth.uid() = author_id);

-- Trigger para manter comments_count atualizado
create or replace function update_comments_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set comments_count = comments_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set comments_count = comments_count - 1 where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_comment_change
  after insert or delete on comments
  for each row execute procedure update_comments_count();

-- Realtime para comentários
alter publication supabase_realtime add table comments;
