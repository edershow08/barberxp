import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const source = await readFile("worker/index.js", "utf8");
const startMarker = "const html = `";
const endMarker = "`;\n\nconst DEFAULT_MISSION_RULES";
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker);

if (start < 0 || end < 0) {
  throw new Error("Não foi possível localizar o HTML do BarberXP.");
}

const html = source
  .slice(start + startMarker.length, end)
  .replaceAll("__USER_EMAIL__", "edershow08@gmail.com")
  .replaceAll("__IS_LEADER__", "true");

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await writeFile("dist/index.html", html);
