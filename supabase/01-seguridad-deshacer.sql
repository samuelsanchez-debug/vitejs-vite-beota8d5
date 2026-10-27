-- ============================================================================
-- DOMIA · SEGURIDAD · DESHACER SCRIPT 01
-- Elimina todo lo que añadió 01-seguridad-anadir.sql. No toca ningún dato tuyo.
-- ============================================================================
drop function if exists public.crear_solicitud_web(text, text, text, text, text, text, text, text);
drop function if exists public.portal_update_incidencia(text, bigint, jsonb);
drop function if exists public.portal_update(text, text, jsonb);
drop function if exists public.portal_get(text, text);
drop function if exists public._portal_trabajo_id(text, text);
drop function if exists public.es_staff();
drop table if exists public.staff;
drop table if exists public.config_seguridad;
drop index if exists public.trabajos_token_key;
drop index if exists public.trabajos_token_colab_key;
alter table public.trabajos drop column if exists token;
alter table public.trabajos drop column if exists token_colab;
