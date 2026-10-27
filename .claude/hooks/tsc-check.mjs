// Hook PostToolUse (Edit|Write) y comprobación manual: avisa solo de errores de TypeScript NUEVOS.
// El proyecto arrastra errores antiguos (ver tsc-baseline.json), así que se compara contra esa línea base.
//
// Uso:
//   hook:                   recibe el JSON del hook por stdin; solo actúa si se editó src/**/*.ts(x)
//   node tsc-check.mjs --check             comprueba todo el proyecto (usado por /subir-a-main)
//   node tsc-check.mjs --update-baseline   regenera la línea base con el estado actual
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");
const baselinePath = join(here, "tsc-baseline.json");
const arg = process.argv[2];

if (!arg) {
  let input = {};
  try {
    input = JSON.parse(readFileSync(0, "utf8"));
  } catch {}
  const file = String(input?.tool_input?.file_path ?? "").replace(/\\/g, "/");
  if (!/\/src\/.+\.tsx?$/.test(file)) process.exit(0);
}

const tsc = join(root, "node_modules", "typescript", "bin", "tsc");
if (!existsSync(tsc)) process.exit(0);

const run = spawnSync(process.execPath, [tsc, "-p", "tsconfig.app.json", "--noEmit", "--pretty", "false"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

// Una clave por error sin número de línea, para que mover código no cuente como error nuevo.
const errores = new Map();
for (const linea of (run.stdout || "").split(/\r?\n/)) {
  const m = linea.match(/^(src\/[^(]+)\((\d+),(\d+)\): error (TS\d+): (.*)$/);
  if (!m) continue;
  const clave = `${m[1]}|${m[4]}|${m[5].slice(0, 160)}`;
  const e = errores.get(clave) ?? { n: 0, ejemplo: `${m[1]}:${m[2]} ${m[4]} ${m[5].slice(0, 200)}` };
  e.n++;
  errores.set(clave, e);
}

if (arg === "--update-baseline") {
  const base = {};
  for (const [k, v] of errores) base[k] = v.n;
  writeFileSync(baselinePath, JSON.stringify(base, null, 0) + "\n");
  const total = [...errores.values()].reduce((a, v) => a + v.n, 0);
  console.log(`Línea base guardada: ${total} errores existentes en ${errores.size} grupos.`);
  process.exit(0);
}

const base = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : {};
const nuevos = [];
for (const [k, v] of errores) {
  const antes = base[k] ?? 0;
  if (v.n > antes) nuevos.push(`  +${v.n - antes}  ${v.ejemplo}`);
}

if (nuevos.length === 0) {
  if (arg === "--check") console.log("TypeScript: sin errores nuevos respecto a la línea base.");
  process.exit(0);
}

const msg = `TypeScript: ${nuevos.length} error(es) NUEVO(S) respecto a la línea base:\n${nuevos.slice(0, 15).join("\n")}${
  nuevos.length > 15 ? `\n  ... y ${nuevos.length - 15} más` : ""
}\n(Los errores antiguos del proyecto se ignoran; ver .claude/hooks/tsc-baseline.json)`;
console.error(msg);
process.exit(2);
