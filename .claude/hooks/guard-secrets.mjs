// PreToolUse hook — blochează citirea/editarea fișierelor cu secrete.
// Primește pe stdin JSON-ul tool-call-ului și, dacă ținta e un fișier de
// secrete (.env*, exceptând .env.example, sau *.pem), refuză operația.
import { basename } from "node:path";

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    // Eliminăm un eventual BOM la început, ca să nu pice JSON.parse.
    const clean = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    const j = JSON.parse(clean || "{}");
    const fp = j.tool_input?.file_path ?? j.tool_input?.path ?? "";
    const name = basename(String(fp));

    const isSecret =
      (name.startsWith(".env") && name !== ".env.example") ||
      name.endsWith(".pem");

    if (isSecret) {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason:
              `Acces blocat de hook: „${name}” conține secrete (chei Supabase, ` +
              `ADMIN_PASSWORD etc.) și nu trebuie citit sau modificat de agent. ` +
              `Folosește „.env.example” ca referință.`,
          },
        }),
      );
    }
  } catch {
    // La orice eroare de parsare lăsăm operația să continue (nu blocăm orbește).
  }
  process.exit(0);
});
