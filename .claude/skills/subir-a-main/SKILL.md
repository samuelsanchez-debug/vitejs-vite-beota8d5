---
name: subir-a-main
description: Pasa los cambios validados de la rama pruebas a main (producción en Vercel) con comprobaciones previas. Solo la ejecuta el usuario escribiendo /subir-a-main.
disable-model-invocation: true
---

# Subir `pruebas` a `main` (producción)

El usuario ha pedido explícitamente pasar a producción. Sigue estos pasos en orden y **detente en cuanto falle uno**, explicando qué pasó. El hook `protect-main` pedirá confirmación en los comandos que tocan `main`; es lo esperado.

1. **Estado de partida**
   - `git branch --show-current` debe devolver `pruebas`. Si no, avisa y para.
   - `git status --short` debe estar limpio. Si hay cambios sin commit, enséñalos y pregunta si hacer commit antes; no los incluyas sin permiso.

2. **Comprobaciones**
   - `node .claude/hooks/tsc-check.mjs --check` (sin errores nuevos de TypeScript).
   - `npx vite build` (debe compilar). No uses `npm run build`: `tsc -b` falla por errores antiguos.
   - Si algo falla, para y cuéntalo.

3. **Resumen de lo que se va a subir**
   - `git fetch origin`
   - `git log --oneline origin/main..pruebas` y muéstralo al usuario en español, en lenguaje llano.
   - Si no hay commits nuevos, dilo y termina.

4. **Publicar**
   - `git push origin pruebas`
   - `git checkout main`
   - `git pull --ff-only origin main`
   - `git merge --ff-only pruebas` (si no es fast-forward, para: `main` tiene cambios que `pruebas` no; no fuerces nada ni hagas merge commit sin preguntar).
   - `git push origin main`
   - `git checkout pruebas`

5. **Informar**
   - Confirma el hash final (`git rev-parse --short main`) y que `main` y `pruebas` coinciden.
   - Recuerda que Vercel desplegará `domia-crm-two.vercel.app` en un par de minutos.
   - Termina siempre de vuelta en la rama `pruebas`.

Nunca uses `--force`, `reset --hard` ni borres ramas en este proceso.
