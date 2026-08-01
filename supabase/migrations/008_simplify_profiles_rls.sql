-- profiles ainda usava isolamento por school_id (herdado de 001), mas posts e
-- events já foram simplificados em 003/004 porque o módulo de escolas não
-- existe ainda. Com school_id nulo, `school_id = school_id` nunca é
-- verdadeiro (NULL = NULL é NULL), então o próprio usuário deixava de ver o
-- seu perfil (erro 406 no .single()). Simplifica para o mesmo modelo de
-- posts/events: qualquer autenticado lê, só o dono edita o próprio.

drop policy if exists "school_isolation_profiles" on profiles;

create policy "profiles_read" on profiles
  for select using (auth.uid() is not null);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);
