import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const catalog = JSON.parse(fs.readFileSync(path.join(root, "content", "game-catalog.json"), "utf8"));
const order = catalog.ageBands.map((band) => band.id);
const rank = Object.fromEntries(order.map((id, index) => [id, index]));

const sessionPolicy = {
  A30_36: {
    suggestedMinutes: [3, 5],
    digitalTasks: [1, 2],
    includeTransferWhenAdultPresent: true,
    initialChoiceCount: 2,
    maximumChoiceCountAtEntry: 3,
  },
  B36_48: {
    suggestedMinutes: [5, 7],
    digitalTasks: [2, 3],
    includeTransferWhenAdultPresent: true,
    initialChoiceCount: 3,
    maximumChoiceCountAtEntry: 4,
  },
  C48_60: {
    suggestedMinutes: [5, 7],
    digitalTasks: [3, 4],
    includeTransferWhenAdultPresent: true,
    initialChoiceCount: 4,
    maximumChoiceCountAtEntry: 6,
  },
  D60_72: {
    suggestedMinutes: [7, 10],
    digitalTasks: [3, 5],
    includeTransferWhenAdultPresent: true,
    initialChoiceCount: 5,
    maximumChoiceCountAtEntry: 8,
  },
};

const bands = catalog.ageBands.map((band) => {
  const available = catalog.games.filter(
    (game) => game.minAgeMonths <= band.maxAgeMonths && game.maxAgeMonths >= band.minAgeMonths,
  );
  const newGames = available.filter((game) => game.entryBand === band.id);
  const priorOrCurrent = available.filter((game) => rank[game.entryBand] <= rank[band.id]);
  const implementationCeiling = rank[band.id];
  const recommended = priorOrCurrent.filter((game) => {
    const priorityRank = Number(game.implementationPriority.slice(1));
    return priorityRank <= implementationCeiling;
  });

  const byDomain = Object.fromEntries(
    [...new Set(available.map((game) => game.domain))]
      .sort()
      .map((domain) => [domain, available.filter((game) => game.domain === domain).map((game) => game.id)]),
  );

  return {
    id: band.id,
    labelRo: band.labelRo,
    minAgeMonths: band.minAgeMonths,
    maxAgeMonths: band.maxAgeMonths,
    sessionPolicy: sessionPolicy[band.id],
    newGameIds: newGames.map((game) => game.id),
    recommendedGameIds: recommended.map((game) => game.id),
    availableGameIds: available.map((game) => game.id),
    gamesByDomain: byDomain,
  };
});

const output = {
  version: "1.0.0",
  generatedAt: "deterministic-build-artifact",
  note: "Age bands select conservative starting content only. Demonstrated mastery, support needs and child engagement control progression.",
  bands,
};

fs.writeFileSync(
  path.join(root, "content", "curriculum-map.json"),
  `${JSON.stringify(output, null, 2)}\n`,
  "utf8",
);
console.log(`Generated curriculum map for ${bands.length} age bands.`);
