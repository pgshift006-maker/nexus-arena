-- Bucket público para imagens de posts. posts.image_url já existia desde
-- a migration inicial, só faltava a UI e o storage pra usá-lo. Mesmo
-- padrão de pastas por usuário do bucket de avatars.

insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

create policy "post_image_public_read" on storage.objects
  for select using (bucket_id = 'posts');

create policy "post_image_upload_own" on storage.objects
  for insert with check (
    bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "post_image_delete_own" on storage.objects
  for delete using (
    bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text
  );
