-- ============================================================================
-- DOMIA · SEGURIDAD · SCRIPT 02 · CERRAR LAS TABLAS (activar RLS)
-- ----------------------------------------------------------------------------
-- ANTES de ejecutarlo (todo esto ya debe estar hecho):
--   [x] Script 01 ejecutado (funciones seguras y lista de personal).
--   [x] Código nuevo publicado en producción (main) y comprobado.
--   [ ] Copia de seguridad de tus datos (Supabase > Database > Backups, o exportar CSV).
--   [ ] Tener a mano supabase/02-cerrar-tablas-deshacer.sql por si algo no va bien.
--
-- Qué hace:
--   * Activa RLS en clientes, colaboradores, trabajos, incidencias y cobros_cliente.
--   * Solo el personal de la tabla "staff" (tú y Fran) accede a todo.
--   * Cada colaborador solo ve SUS trabajos, SUS incidencias, SUS pagos y su ficha.
--   * Las páginas públicas siguen funcionando porque usan las funciones del script 01.
--   * Endurece historial_trabajos, pagos_colaborador y solicitudes_colaborador.
--   * No toca la tabla "products" ni ningún dato.
-- ============================================================================

-- Seguro de vida: no continuar si la lista de personal está vacía (te quedarías sin acceso)
do $$
begin
  if (select count(*) from public.staff) < 1 then
    raise exception 'La tabla staff esta vacia: ejecuta antes el script 01';
  end if;
end $$;

-- Ayudante: id del colaborador que ha iniciado sesión (o null)
create or replace function public._mi_colaborador_id() returns bigint
language sql stable security definer set search_path = public as $$
  select c.id from public.colaboradores c
  where lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;
revoke all on function public._mi_colaborador_id() from public, anon;
grant execute on function public._mi_colaborador_id() to authenticated;

-- es_staff y el ayudante del script 01 no necesitan estar abiertos al público anónimo
revoke all on function public.es_staff() from anon;
revoke all on function public._portal_trabajo_id(text, text) from anon, authenticated;

-- 1. Tablas principales: personal = acceso total ------------------------------
alter table public.clientes       enable row level security;
alter table public.colaboradores  enable row level security;
alter table public.trabajos       enable row level security;
alter table public.incidencias    enable row level security;
alter table public.cobros_cliente enable row level security;

drop policy if exists staff_todo on public.clientes;
drop policy if exists staff_todo on public.colaboradores;
drop policy if exists staff_todo on public.trabajos;
drop policy if exists staff_todo on public.incidencias;
drop policy if exists staff_todo on public.cobros_cliente;

create policy staff_todo on public.clientes       for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_todo on public.colaboradores  for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_todo on public.trabajos       for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_todo on public.incidencias    for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_todo on public.cobros_cliente for all to authenticated using (public.es_staff()) with check (public.es_staff());

-- 2. Colaboradores: solo lectura de lo suyo (portal /portal) -----------------
drop policy if exists colab_ve_lo_suyo on public.colaboradores;
drop policy if exists colab_ve_lo_suyo on public.trabajos;
drop policy if exists colab_ve_lo_suyo on public.incidencias;

create policy colab_ve_lo_suyo on public.colaboradores for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
create policy colab_ve_lo_suyo on public.trabajos for select to authenticated
  using (colaborador_id = public._mi_colaborador_id());
create policy colab_ve_lo_suyo on public.incidencias for select to authenticated
  using (colaborador_id = public._mi_colaborador_id());

-- 3. pagos_colaborador: sustituye la política "cualquiera con sesión puede todo" ---
drop policy if exists "auth all pagos_colab" on public.pagos_colaborador;
drop policy if exists staff_todo on public.pagos_colaborador;
drop policy if exists colab_ve_lo_suyo on public.pagos_colaborador;
create policy staff_todo on public.pagos_colaborador for all to authenticated
  using (public.es_staff()) with check (public.es_staff());
create policy colab_ve_lo_suyo on public.pagos_colaborador for select to authenticated
  using (colaborador_id = public._mi_colaborador_id());

-- 4. solicitudes_colaborador: cualquiera puede ENVIAR (se mantiene), solo el personal LEE/EDITA ---
drop policy if exists "select auth solicitudes_colab" on public.solicitudes_colaborador;
drop policy if exists "update auth solicitudes_colab" on public.solicitudes_colaborador;
drop policy if exists staff_leer on public.solicitudes_colaborador;
drop policy if exists staff_editar on public.solicitudes_colaborador;
create policy staff_leer   on public.solicitudes_colaborador for select to authenticated using (public.es_staff());
create policy staff_editar on public.solicitudes_colaborador for update to authenticated using (public.es_staff()) with check (public.es_staff());

-- 5. historial_trabajos: solo personal, y el autor no se puede falsificar ----------
drop policy if exists "authenticated insert" on public.historial_trabajos;
drop policy if exists "authenticated read" on public.historial_trabajos;
drop policy if exists staff_leer on public.historial_trabajos;
drop policy if exists staff_insertar on public.historial_trabajos;
create policy staff_leer on public.historial_trabajos for select to authenticated using (public.es_staff());
create policy staff_insertar on public.historial_trabajos for insert to authenticated
  with check (public.es_staff() and lower(coalesce(usuario_email, '')) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- ============================================================================
-- Comprobación (solo lectura): las 9 tablas deben aparecer con rls_activa = true
-- ============================================================================
select c.relname as tabla, c.relrowsecurity as rls_activa
from pg_class c
where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
order by c.relname;
