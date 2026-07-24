import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const catalog = JSON.parse(fs.readFileSync(path.join(root, "content", "game-catalog.json"), "utf8"));

const domainLabels = {
  visual_attention: "Percepție vizuală și atenție",
  classification: "Clasificare și reguli",
  working_memory: "Memorie de lucru",
  inhibition_flexibility: "Control inhibitor și flexibilitate",
  sequencing_patterns: "Secvențe și tipare",
  spatial_planning: "Raționament spațial și planificare",
  numeracy: "Numerație timpurie",
  language_social: "Limbaj și raționament social",
  fine_motor_creativity: "Coordonare și creativitate",
  hybrid_transfer: "Transfer în lumea reală",
};

const bandLabels = Object.fromEntries(catalog.ageBands.map((band) => [band.id, band.labelRo]));
const groups = Object.groupBy(catalog.games, (game) => game.domain);
const lines = [
  "# Catalogul jocurilor",
  "",
  `Sursa de adevăr este \`content/game-catalog.json\`. Catalogul conține **${catalog.games.length} familii de jocuri**. Fiecare familie este parametrizată prin axe de dificultate și poate genera multe niveluri deterministe din seed-uri și pachete de conținut.`,
  "",
  "Vârsta stabilește doar punctul inițial. Progresul real se bazează pe răspunsuri, indicii folosite și toleranța copilului.",
  "",
  "Legendă priorități: **P0** primul release; **P1** extensie 3–4 ani; **P2** 4–5 ani; **P3** 5–6 ani.",
  "",
];

for (const [domain, games] of Object.entries(groups)) {
  lines.push(`## ${domainLabels[domain] ?? domain}`, "");
  lines.push("| Joc | Intrare recomandată | Mecanică | Axele principale | Prioritate |");
  lines.push("|---|---:|---|---|---:|");
  for (const game of games) {
    lines.push(`| **${game.title.ro}**<br><sub>\`${game.id}\`</sub> | ${bandLabels[game.entryBand]} | ${game.mechanic} | ${game.difficultyAxes.map((axis) => `\`${axis}\``).join(", ")} | ${game.implementationPriority} |`);
  }
  lines.push("");
}

lines.push(
  "## Reguli transversale",
  "",
  "- Fără clasamente, vieți, streak-uri, loot, reclame sau recompense aleatorii.",
  "- Fără cronometru ca sursă principală de dificultate; viteza poate fi doar o acomodare opțională la 5–6 ani.",
  "- După două erori se adaugă indiciu; după trei se simplifică o singură axă.",
  "- Jocurile deschise și activitățile în lumea reală nu primesc scor.",
  "- Fiecare joc are o extensie offline și o întrebare de co-play.",
  ""
);

fs.writeFileSync(path.join(root, "docs", "03-game-catalog.md"), `${lines.join("\n")}\n`, "utf8");
console.log(`Generated docs/03-game-catalog.md with ${catalog.games.length} games.`);
