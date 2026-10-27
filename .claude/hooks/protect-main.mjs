// Hook PreToolUse (Bash|PowerShell): la rama main es producción (Vercel despliega al hacer push).
// Regla del proyecto: nada cambia en main hasta que Samuel lo pida. Este hook no bloquea del todo:
// obliga a pedir confirmación explícita antes de cualquier comando que pueda tocar main.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const cmd = String(input?.tool_input?.command ?? "");
if (!/\bgit\b|\bgh\b/.test(cmd)) process.exit(0);

const rama = spawnSync("git", ["branch", "--show-current"], { cwd: input.cwd || process.cwd(), encoding: "utf8" }).stdout.trim();
const enMain = rama === "main" || rama === "master";

const toca = /\b(main|master)\b/;
const mutan = /\bgit\s+(?:-[^\s]+\s+)*(merge|commit|reset|rebase|cherry-pick|revert|pull|push|am|apply)\b/;

const razones = [];
if (/\bgit\s+push\b/.test(cmd) && (toca.test(cmd) || (enMain && !/\bgit\s+push\s+\S+\s+\S+/.test(cmd)))) {
  razones.push("push hacia main (despliega a producción en Vercel)");
}
if (/\bgit\s+(checkout|switch)\b[^|;&]*\b(main|master)\b/.test(cmd)) {
  razones.push("cambiar a la rama main");
}
if (enMain && mutan.test(cmd)) {
  razones.push("modificar la rama main (estás parado en main)");
}
if (/\bgh\s+pr\s+merge\b/.test(cmd)) {
  razones.push("fusionar un PR (puede llegar a main)");
}

if (razones.length === 0) process.exit(0);

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: `main = producción. Este comando intenta: ${razones.join("; ")}. Solo debe hacerse cuando Samuel lo ha pedido ("súbelo a main").`,
    },
  })
);
process.exit(0);
