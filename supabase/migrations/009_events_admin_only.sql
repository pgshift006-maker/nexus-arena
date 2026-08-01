-- Criar eventos/gincanas passa a ser um recurso do plano administrador.
-- A trava na UI (página /eventos/novo) é só experiência; a garantia real
-- de segurança é esta policy, que impede o insert via API mesmo que
-- alguém contorne a tela.

drop policy if exists "events_insert" on events;

create policy "events_insert" on events
  for insert with check (
    auth.uid() = created_by
    and (select role from profiles where id = auth.uid()) = 'admin'
  );
