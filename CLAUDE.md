# DOMIA CRM

CRM interno de Domia (gestión de clientes, trabajos/demandas, colaboradores, incidencias y cobros). Samuel trabaja en español: responde en español.

## Stack
- Vite 8 + React 19 + TypeScript. Casi toda la app está en `src/App.tsx` (~3.200 líneas). Otros: `src/form.tsx` (formulario público), `src/alta-colaborador.tsx` (alta pública de colaboradores).
- Tailwind por CDN (`index.html`, con `tailwind.config` que remapea los pesos: semibold 500, bold 600, black 700). No hay build de Tailwind.
- Supabase (clave anon escrita en el código; la seguridad real depende de RLS). Tablas: `clientes`, `colaboradores`, `trabajos`, `incidencias`, `solicitudes_colaborador`, `cobros_cliente`, `historial_trabajos`.
- Producción: Vercel (`domia-crm-two.vercel.app`), despliega solo al hacer push a `main`.

## Flujo de ramas (REGLA PRINCIPAL)
- Todo el desarrollo va en la rama `pruebas`. `main` es producción.
- **Nunca** tocar `main` (commit, merge, push) hasta que Samuel lo pida explícitamente ("súbelo a main", "pásalo a main"). Aprobar un cambio en `pruebas` no autoriza pasarlo a `main`.
- Pasar a main: skill `/subir-a-main` (fast-forward de `pruebas` a `main`, luego volver a `pruebas`).
- Un hook (`.claude/hooks/protect-main.mjs`) pide confirmación ante cualquier comando que pueda tocar `main`.
- Escribir en la base de datos de producción (Supabase) requiere confirmación explícita de Samuel.

## Reglas de trabajo
- **KOOPA y DOMIA son proyectos separados.** No mezclarlos en una misma conversación; si preguntan por KOOPA aquí, decir que va en otra sesión.
- No romper flujos existentes (botones de WhatsApp, guardado de estado, historial, pipeline). Revisar antes de quitar o mover algo.
- En rediseños visuales: enseñar primero un mockup y aplicar cuando Samuel lo apruebe.
- Estilo: profesional, minimalista, tipo SaaS; pocos emojis; fuentes suaves (no demasiado negrita).
- El panel `/admin` es privado e invisible: solo `ADMIN_EMAIL` (samuel.sanchez@olcproperties.net) lo ve; para el resto la app se comporta como si la ruta no existiera. No añadir enlaces visibles a él.
- Cada edición o borrado de un trabajo se registra en `historial_trabajos` (`registrarHistorial`, `dbSaveTrabajo`, `dbDeleteTrabajo`). Mantenerlo al tocar esos flujos.
- Teléfonos de colaboradores: mostrar `telefono || whatsapp`; los enlaces `wa.me` se construyen quitando espacios (`replace(/\s/g,'')`).

## Comandos
- `npm run dev` — servidor de desarrollo (en Claude Code: `preview_start` con `domia-crm-dev`; puede salir en 5173 o 5174; `host: true` permite acceso desde el móvil por la red local).
- `npx vite build` — comprueba que compila. `npm run build` falla hoy porque `tsc -b` arrastra ~870 errores antiguos.
- `npm run lint` — oxlint.
- `node .claude/hooks/tsc-check.mjs --check` — errores de TypeScript nuevos respecto a la línea base.

## TypeScript
El proyecto tiene ~870 errores de TypeScript antiguos (`any` implícitos, etc.). Un hook tras cada edición en `src/` compara con `.claude/hooks/tsc-baseline.json` y solo avisa de los **nuevos**. Si se arreglan errores antiguos a propósito: `node .claude/hooks/tsc-check.mjs --update-baseline`.

## Trampas de UI conocidas (móvil)
- Usar solo breakpoints mobile-first `sm:`; evitar variantes arbitrarias `max-*` (Tailwind CDN).
- `touch-pan-x` bloquea el scroll vertical: no usarlo en contenedores que también deben bajar.
- Un hijo flex con scroll interno necesita `min-h-0` en el padre.
- Filas de pestañas en pantallas estrechas: `overflow-x-auto` + botones `min-w-max whitespace-nowrap`.
- Tras cambios de CSS/config puede hacer falta recarga forzada; si Vite cambia de puerto, reiniciar el preview.
