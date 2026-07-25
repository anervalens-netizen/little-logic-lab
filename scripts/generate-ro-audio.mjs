import { execFile } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const exec = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const manifestPath = new URL(
  "../apps/web/src/audio/ro-RO-v1.json",
  import.meta.url,
);
const outputDirectory = fileURLToPath(
  new URL("../apps/web/public/audio/ro-RO-v1/", import.meta.url),
);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const binary = process.env["EDGE_TTS_BIN"] ?? "edge-tts";

await mkdir(outputDirectory, { recursive: true });
for (const prompt of manifest.prompts) {
  const output = `${outputDirectory}${prompt.id}.mp3`;
  await exec(binary, [
    "--voice",
    manifest.voice,
    "--rate=-8%",
    "--pitch=+4Hz",
    "--text",
    prompt.text,
    "--write-media",
    output,
  ]);
  process.stdout.write(`generated ${prompt.id}\n`);
}

process.stdout.write(
  `generated ${manifest.prompts.length} clips in ${outputDirectory.replace(root, "")}\n`,
);
