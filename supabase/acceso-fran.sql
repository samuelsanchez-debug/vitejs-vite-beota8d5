-- Acceso de Fran al CRM (francisco.orts@olcproperties.net)
-- Ejecutar en Supabase > SQL Editor, por partes. No toca contraseñas ni borra nada.

-- PARTE 1 · Mirar (solo lectura) -------------------------------------------------
-- a) ¿Está en la lista de personal autorizado?
select email from public.staff order by email;

-- b) ¿Existe su usuario de acceso y está confirmado?
--    email_confirmed_at vacío = no ha confirmado su correo.
--    banned_until con fecha futura = cuenta bloqueada.
select email, email_confirmed_at, last_sign_in_at, banned_until, deleted_at
from auth.users
where lower(email) like '%orts%';

-- PARTE 2 · Arreglar la lista de personal -----------------------------------------
-- Es seguro repetirlo: si ya está, no hace nada.
insert into public.staff (email) values ('francisco.orts@olcproperties.net')
on conflict (email) do nothing;

-- PARTE 3 · Comprobar ---------------------------------------------------------------
select email from public.staff where lower(email) = 'francisco.orts@olcproperties.net';
