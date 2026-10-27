-- ============================================================================
-- DOMIA · SEGURIDAD · SCRIPT 01 · SOLO AÑADE (no cambia nada de lo existente)
-- ----------------------------------------------------------------------------
-- Qué hace:
--   1. Añade a "trabajos" dos códigos aleatorios (uno para el enlace del cliente
--      y otro para el del colaborador). Los trabajos ya existentes los reciben solos.
--   2. Crea la lista de personal autorizado (tú y Fran) y la función es_staff().
--   3. Crea funciones seguras que usarán las páginas públicas (/aceptar, /verificar,
--      /cliente, /trabajo) y el formulario web, en lugar de acceder a las tablas.
--
-- Qué NO hace: no activa RLS, no borra nada, no cambia permisos de tablas.
-- La app actual sigue funcionando exactamente igual después de ejecutarlo.
-- Para deshacerlo todo: supabase/01-seguridad-deshacer.sql
-- ============================================================================

-- 1. Códigos aleatorios por trabajo ------------------------------------------
alter table public.trabajos add column if not exists token       uuid not null default gen_random_uuid();
alter table public.trabajos add column if not exists token_colab uuid not null default gen_random_uuid();
create unique index if not exists trabajos_token_key       on public.trabajos (token);
create unique index if not exists trabajos_token_colab_key on public.trabajos (token_colab);

-- 2. Configuración y personal autorizado -------------------------------------
-- (RLS activada y SIN políticas: nadie puede leerlas por la API; solo las funciones de abajo)
create table if not exists public.config_seguridad (
  clave text primary key,
  valor text not null
);
alter table public.config_seguridad enable row level security;
insert into public.config_seguridad (clave, valor) values ('enlaces_numericos', 'true')
  on conflict (clave) do nothing;

create table if not exists public.staff (
  email text primary key
);
alter table public.staff enable row level security;
insert into public.staff (email) values
  ('samuel.sanchez@olcproperties.net'),
  ('francisco.orts@olcproperties.net')
  on conflict (email) do nothing;

create or replace function public.es_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.es_staff() from public;
grant execute on function public.es_staff() to authenticated;

-- 3. Resolver el enlace de una página pública --------------------------------
-- p_ref puede ser el código aleatorio (seguro) o el número antiguo (mientras
-- config_seguridad.enlaces_numericos = 'true').
create or replace function public._portal_trabajo_id(p_ref text, p_rol text) returns bigint
language plpgsql stable security definer set search_path = public as $$
declare v bigint;
begin
  if p_ref is null or p_rol not in ('cliente', 'colaborador') then return null; end if;
  if p_ref ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    if p_rol = 'cliente' then
      select t.id into v from public.trabajos t where t.token = p_ref::uuid;
    else
      select t.id into v from public.trabajos t where t.token_colab = p_ref::uuid;
    end if;
    return v;
  end if;
  if p_ref ~ '^[0-9]{1,15}$'
     and coalesce((select valor from public.config_seguridad where clave = 'enlaces_numericos'), 'true') = 'true' then
    select t.id into v from public.trabajos t where t.id = p_ref::bigint;
    return v;
  end if;
  return null;
end $$;
revoke all on function public._portal_trabajo_id(text, text) from public;

-- 4. Leer los datos de una página pública (solo lo necesario) -----------------
create or replace function public.portal_get(p_ref text, p_rol text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  tid bigint;
  t public.trabajos%rowtype;
  ocultar text[];
begin
  tid := public._portal_trabajo_id(p_ref, p_rol);
  if tid is null then return null; end if;
  select * into t from public.trabajos where id = tid;

  if p_rol = 'cliente' then
    ocultar := array['token','token_colab','margen','presupuesto_colaborador',
                     'instrucciones_colaborador','notas_internas','partidas'];
    return jsonb_build_object(
      'trabajo', to_jsonb(t) - ocultar,
      'cliente', (select jsonb_build_object('nombre', c.nombre) from public.clientes c where c.id = t.cliente_id)
    );
  end if;

  ocultar := array['token','token_colab','margen','precio_cliente','notas_internas',
                   'partidas','iva','adelanto_tipo','adelanto_valor'];
  return jsonb_build_object(
    'trabajo', to_jsonb(t) - ocultar,
    'cliente', (select jsonb_build_object('direccion', c.direccion) from public.clientes c where c.id = t.cliente_id),
    'colaborador', (select jsonb_build_object('nombre', co.nombre) from public.colaboradores co where co.id = t.colaborador_id),
    'incidencias', coalesce((select jsonb_agg(to_jsonb(i) order by i.id desc)
                             from public.incidencias i where i.trabajo_id = t.id), '[]'::jsonb)
  );
end $$;
revoke all on function public.portal_get(text, text) from public;
grant execute on function public.portal_get(text, text) to anon, authenticated;

-- 5. Modificar el trabajo desde una página pública (solo campos permitidos) ---
create or replace function public.portal_update(p_ref text, p_rol text, p_patch jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  tid bigint;
  t public.trabajos%rowtype;
  permitidas text[];
  estados text[];
  campo text;
  sets text;
  r public.trabajos;
begin
  tid := public._portal_trabajo_id(p_ref, p_rol);
  if tid is null or p_patch is null or jsonb_typeof(p_patch) <> 'object' then return false; end if;
  if length(p_patch::text) > 200000 then raise exception 'peticion demasiado grande'; end if;
  select * into t from public.trabajos where id = tid;

  if p_rol = 'cliente' then
    permitidas := array['estado','aceptado_cliente','atendido','ultima_novedad','historial','notas',
                        'fecha','hora','cliente_verificado','trabajo_terminado','verificacion_rechazo'];
    estados := array['Aceptado','Cliente confirmó','Colaborador disponible'];
  else
    permitidas := array['estado','colaborador_id','atendido','ultima_novedad','historial','notas',
                        'fecha','hora','presupuesto_colaborador','trabajo_terminado','verificacion_rechazo'];
    estados := array['Visita confirmada','Solicitud','Colaborador disponible','Presupuesto recibido','Cliente confirmó'];
  end if;

  for campo in select jsonb_object_keys(p_patch) loop
    if not (campo = any (permitidas)) then
      raise exception 'campo no permitido: %', campo;
    end if;
  end loop;

  if p_patch ? 'estado' and not ((p_patch ->> 'estado') = any (estados)) then
    raise exception 'estado no permitido';
  end if;

  -- El colaborador solo puede dejar el trabajo sin asignar o tal como está
  if p_rol = 'colaborador' and p_patch ? 'colaborador_id'
     and (p_patch -> 'colaborador_id') <> 'null'::jsonb
     and (p_patch ->> 'colaborador_id')::bigint is distinct from t.colaborador_id::bigint then
    raise exception 'colaborador no permitido';
  end if;

  r := jsonb_populate_record(null::public.trabajos, p_patch);
  select string_agg(format('%I = ($1).%I', x.key, x.key), ', ') into sets
  from jsonb_object_keys(p_patch) as x(key);
  if sets is null then return true; end if;
  execute format('update public.trabajos set %s where id = $2', sets) using r, tid;
  return true;
end $$;
revoke all on function public.portal_update(text, text, jsonb) from public;
grant execute on function public.portal_update(text, text, jsonb) to anon, authenticated;

-- 6. El colaborador responde a una incidencia de SU trabajo -------------------
create or replace function public.portal_update_incidencia(p_ref text, p_inc_id bigint, p_patch jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  tid bigint;
  permitidas text[] := array['estado','fecha_propuesta','hora_propuesta','nota_colaborador','atendida','resolucion'];
  campo text;
  sets text;
  r public.incidencias;
begin
  tid := public._portal_trabajo_id(p_ref, 'colaborador');
  if tid is null or p_patch is null or jsonb_typeof(p_patch) <> 'object' then return false; end if;
  if length(p_patch::text) > 20000 then raise exception 'peticion demasiado grande'; end if;
  if not exists (select 1 from public.incidencias i where i.id = p_inc_id and i.trabajo_id = tid) then
    return false;
  end if;

  for campo in select jsonb_object_keys(p_patch) loop
    if not (campo = any (permitidas)) then
      raise exception 'campo no permitido: %', campo;
    end if;
  end loop;
  if p_patch ? 'estado' and (p_patch ->> 'estado') <> 'En proceso' then
    raise exception 'estado no permitido';
  end if;

  r := jsonb_populate_record(null::public.incidencias, p_patch);
  select string_agg(format('%I = ($1).%I', x.key, x.key), ', ') into sets
  from jsonb_object_keys(p_patch) as x(key);
  if sets is null then return true; end if;
  execute format('update public.incidencias set %s where id = $2', sets) using r, p_inc_id;
  return true;
end $$;
revoke all on function public.portal_update_incidencia(text, bigint, jsonb) from public;
grant execute on function public.portal_update_incidencia(text, bigint, jsonb) to anon, authenticated;

-- 7. Formulario web: buscar o crear cliente y crear la solicitud ---------------
create or replace function public.crear_solicitud_web(
  p_nombre text, p_telefono text, p_email text, p_direccion text,
  p_tipo text, p_descripcion text, p_notas text, p_historial text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  tel text;
  cid bigint;
  hoy date := (now() at time zone 'Europe/Madrid')::date;
  fotos text := '';
  n_fotos int := 0;
  seg text;
  prefijo constant text := 'foto:https://opijkazhbktiikdzbanb.supabase.co/storage/v1/object/public/fotos-demandas/demandas/';
begin
  tel := regexp_replace(coalesce(p_telefono, ''), '[\s.\-()]', '', 'g');
  if tel !~ '^\+?[0-9]{9,15}$' then raise exception 'telefono invalido'; end if;
  if coalesce(p_email, '') !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or length(p_email) > 150 then raise exception 'email invalido'; end if;
  if length(trim(coalesce(p_nombre, ''))) not between 1 and 120 then raise exception 'nombre invalido'; end if;
  if length(trim(coalesce(p_direccion, ''))) not between 1 and 250 then raise exception 'direccion invalida'; end if;
  if length(trim(coalesce(p_tipo, ''))) not between 1 and 200 then raise exception 'tipo invalido'; end if;
  if length(trim(coalesce(p_descripcion, ''))) not between 1 and 3000 then raise exception 'descripcion invalida'; end if;
  if length(coalesce(p_historial, '')) > 2000 then raise exception 'historial invalido'; end if;

  -- Solo se aceptan fotos subidas al bucket de la propia app (máximo 3)
  foreach seg in array string_to_array(coalesce(p_notas, ''), '||') loop
    if n_fotos < 3 and left(seg, length(prefijo)) = prefijo and length(seg) < 400 then
      fotos := fotos || case when fotos = '' then '' else '||' end || seg;
      n_fotos := n_fotos + 1;
    end if;
  end loop;

  select c.id into cid from public.clientes c where c.telefono = tel limit 1;
  if cid is null then
    insert into public.clientes (nombre, telefono, email, direccion, notas, creado)
    select r.nombre, r.telefono, r.email, r.direccion, r.notas, r.creado
    from jsonb_populate_record(null::public.clientes, jsonb_build_object(
      'nombre', trim(p_nombre), 'telefono', tel, 'email', trim(p_email), 'direccion', trim(p_direccion),
      'notas', 'Cliente registrado desde formulario web', 'creado', to_char(hoy, 'YYYY-MM-DD')
    )) r
    returning id into cid;
  end if;

  insert into public.trabajos (cliente_id, tipo, descripcion, origen, prioridad, estado, fecha, hora, margen, notas, historial)
  select r.cliente_id, r.tipo, r.descripcion, r.origen, r.prioridad, r.estado, r.fecha, r.hora, r.margen, r.notas, r.historial
  from jsonb_populate_record(null::public.trabajos, jsonb_build_object(
    'cliente_id', cid, 'tipo', trim(p_tipo), 'descripcion', trim(p_descripcion),
    'origen', 'web', 'prioridad', 'Media', 'estado', 'Solicitud',
    'fecha', to_char(hoy, 'YYYY-MM-DD'),
    'hora', to_char(now() at time zone 'Europe/Madrid', 'HH24:MI'),
    'margen', 30, 'notas', fotos, 'historial', coalesce(p_historial, '[]')
  )) r;
end $$;
revoke all on function public.crear_solicitud_web(text, text, text, text, text, text, text, text) from public;
grant execute on function public.crear_solicitud_web(text, text, text, text, text, text, text, text) to anon, authenticated;

-- ============================================================================
-- Comprobación (solo lectura): debe devolver 6 funciones y 2 columnas
-- ============================================================================
select 'funciones' as que, count(*)::text as total
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('es_staff','portal_get','portal_update','portal_update_incidencia','crear_solicitud_web','_portal_trabajo_id')
union all
select 'columnas token', count(*)::text
from information_schema.columns
where table_schema = 'public' and table_name = 'trabajos' and column_name in ('token','token_colab');
