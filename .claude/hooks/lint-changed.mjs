// PostToolUse hook — rulează ESLint pe fișierul .ts/.tsx tocmai modificat.
// Dacă apar probleme, le trimite înapoi modelului ca context, ca să le poată
// corecta imediat. Nu blochează editarea (doar informează).
import { basename } from "node:path";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let fp = "";
  try {
    const clean = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    const j = JSON.parse(clean || "{}");
    fp = j.tool_response?.filePath ?? j.tool_input?.file_path ?? "";
  } catch {
    process.exit(0);
  }

  if (!fp || !/\.tsx?$/.test(fp) || !existsSync(fp)) process.exit(0);

  // shell: true => rezolvă „npx" (npx.cmd) pe Windows.
  const res = spawnSync("npx", ["eslint", fp], { encoding: "utf8", shell: true });
  const output = `${res.stdout ?? ""}${res.stderr ?? ""}`.trim();

  if (res.status !== 0 && output) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PostToolUse",
          additionalContext:
            `ESLint a raportat probleme în ${basename(fp)} — corectează-le:\n${output}`,
        },
      }),
    );
  }
  process.exit(0);
});
