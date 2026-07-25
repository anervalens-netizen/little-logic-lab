import { execFile } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { expandAudioPrompts } from "./audio-manifest.mjs";

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
const idPrefix = process.env["AUDIO_ID_PREFIX"];
const prompts = expandAudioPrompts(manifest).filter(
  (prompt) => !idPrefix || prompt.id.startsWith(idPrefix),
);
const concurrency = Math.max(
  1,
  Math.min(8, Number(process.env["AUDIO_CONCURRENCY"] ?? 4)),
);

await mkdir(outputDirectory, { recursive: true });
for (let offset = 0; offset < prompts.length; offset += concurrency) {
  await Promise.all(
    prompts.slice(offset, offset + concurrency).map(async (prompt) => {
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
    }),
  );
}

process.stdout.write(
  `generated ${prompts.length} clips in ${outputDirectory.replace(root, "")}\n`,
);
