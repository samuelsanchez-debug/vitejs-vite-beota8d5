-- ============================================================================
-- DOMIA · SEGURIDAD · DESHACER SCRIPT 02
-- Deja las tablas exactamente como estaban antes: sin RLS en las 5 principales y
-- con las políticas originales en historial, pagos y solicitudes.
-- No borra ningún dato. Ejecútalo entero si algo deja de funcionar tras el 02.
-- ============================================================================

-- Tablas principales: RLS fuera y sus políticas nuevas fuera
drop policy if exists staff_todo on public.clientes;
drop policy if exists staff_todo on public.colaboradores;
drop policy if exists staff_todo on public.trabajos;
drop policy if exists staff_todo on public.incidencias;
drop policy if exists staff_todo on public.cobros_cliente;
drop policy if exists colab_ve_lo_suyo on public.colaboradores;
drop policy if exists colab_ve_lo_suyo on public.trabajos;
drop policy if exists colab_ve_lo_suyo on public.incidencias;

alter table public.clientes       disable row level security;
alter table public.colaboradores  disable row level security;
alter table public.trabajos       disable row level security;
alter table public.incidencias    disable row level security;
alter table public.cobros_cliente disable row level security;

-- pagos_colaborador: política original
drop policy if exists staff_todo on public.pagos_colaborador;
drop policy if exists colab_ve_lo_suyo on public.pagos_colaborador;
drop policy if exists "auth all pagos_colab" on public.pagos_colaborador;
create policy "auth all pagos_colab" on public.pagos_colaborador for all to authenticated using (true) with check (true);

-- solicitudes_colaborador: políticas originales
drop policy if exists staff_leer on public.solicitudes_colaborador;
drop policy if exists staff_editar on public.solicitudes_colaborador;
drop policy if exists "select auth solicitudes_colab" on public.solicitudes_colaborador;
drop policy if exists "update auth solicitudes_colab" on public.solicitudes_colaborador;
create policy "select auth solicitudes_colab" on public.solicitudes_colaborador for select to authenticated using (true);
create policy "update auth solicitudes_colab" on public.solicitudes_colaborador for update to authenticated using (true);

-- historial_trabajos: políticas originales
drop policy if exists staff_leer on public.historial_trabajos;
drop policy if exists staff_insertar on public.historial_trabajos;
drop policy if exists "authenticated insert" on public.historial_trabajos;
drop policy if exists "authenticated read" on public.historial_trabajos;
create policy "authenticated insert" on public.historial_trabajos for insert to public with check (auth.role() = 'authenticated');
create policy "authenticated read" on public.historial_trabajos for select to public using (auth.role() = 'authenticated');

-- Funciones del script 02 (las del 01 se quedan)
drop function if exists public._mi_colaborador_id();
grant execute on function public.es_staff() to anon;
grant execute on function public._portal_trabajo_id(text, text) to anon, authenticated;
