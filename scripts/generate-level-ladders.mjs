import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const catalog = JSON.parse(fs.readFileSync(path.join(root, "content", "game-catalog.json"), "utf8"));
const presets = JSON.parse(fs.readFileSync(path.join(root, "content", "archetype-presets.json"), "utf8"));

const bandOrder = catalog.ageBands.map((band) => band.id);
const bandRank = Object.fromEntries(bandOrder.map((id, index) => [id, index]));
const scalarKey = (value) => `${typeof value}:${JSON.stringify(value)}`;

function eligibleBandsFor(game) {
  return catalog.ageBands
    .filter((band) => bandRank[band.id] >= bandRank[game.entryBand])
    .filter((band) => band.minAgeMonths <= game.maxAgeMonths)
    .map((band) => band.id);
}

function valuesForAxis(axis, bands) {
  const values = [];
  const introducedAt = new Map();
  const seen = new Set();

  for (const bandId of bands) {
    const bandValues = presets.bands?.[bandId]?.[axis];
    if (!Array.isArray(bandValues) || bandValues.length === 0) {
      throw new Error(`Missing values for ${axis} in ${bandId}.`);
    }
    for (const value of bandValues) {
      const key = scalarKey(value);
      if (!seen.has(key)) {
        seen.add(key);
        values.push(value);
        introducedAt.set(key, bandId);
      }
    }
  }

  return { values, introducedAt };
}

function hardestBandFor(vector, axisSpecs, fallbackBand) {
  let rank = bandRank[fallbackBand];
  for (const [axis, value] of Object.entries(vector)) {
    const introduced = axisSpecs[axis].introducedAt.get(scalarKey(value));
    rank = Math.max(rank, bandRank[introduced] ?? rank);
  }
  return bandOrder[rank];
}

const ladders = [];
let totalAnchors = 0;

for (const game of catalog.games) {
  const bands = eligibleBandsFor(game);
  const axisSpecs = Object.fromEntries(
    game.difficultyAxes.map((axis) => [axis, valuesForAxis(axis, bands)]),
  );
  const indices = Object.fromEntries(game.difficultyAxes.map((axis) => [axis, 0]));
  const vector = Object.fromEntries(
    game.difficultyAxes.map((axis) => [axis, axisSpecs[axis].values[0]]),
  );

  const stages = [
    {
      id: `${game.id}:L001`,
      index: 1,
      recommendedBand: game.entryBand,
      difficulty: { ...vector },
      change: null,
      purpose: "baseline_safe_entry",
    },
  ];

  let stageIndex = 1;
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const axis of game.difficultyAxes) {
      const spec = axisSpecs[axis];
      const currentIndex = indices[axis];
      if (currentIndex + 1 >= spec.values.length) continue;

      const from = spec.values[currentIndex];
      const to = spec.values[currentIndex + 1];
      indices[axis] = currentIndex + 1;
      vector[axis] = to;
      stageIndex += 1;
      progressed = true;

      stages.push({
        id: `${game.id}:L${String(stageIndex).padStart(3, "0")}`,
        index: stageIndex,
        recommendedBand: hardestBandFor(vector, axisSpecs, game.entryBand),
        difficulty: { ...vector },
        change: { axis, from, to },
        purpose: "single_axis_progression_anchor",
      });
    }
  }

  totalAnchors += stages.length;
  ladders.push({
    gameId: game.id,
    title: game.title,
    entryBand: game.entryBand,
    axes: Object.fromEntries(
      game.difficultyAxes.map((axis) => [
        axis,
        axisSpecs[axis].values.map((value) => ({
          value,
          introducedAtBand: axisSpecs[axis].introducedAt.get(scalarKey(value)),
        })),
      ]),
    ),
    progressionPolicy: {
      advanceAfter: "three_recent_clean_successes_without_hints_across_more_than_one_session_when_feasible",
      holdWhen: "evidence_is_mixed_or_the_mechanic_is_new",
      simplifyWhen: "errors_or_hints_accumulate_or_motor_load_obscures_the_target_skill",
      note: "Anchors are reference points. Runtime may hold, repeat or step backward and must change only one major axis at a time.",
    },
    stages,
  });
}

const output = {
  version: "1.0.0",
  generatedFrom: ["content/game-catalog.json", "content/archetype-presets.json"],
  generatedAt: "deterministic-build-artifact",
  policy: {
    ageIsInitialPlacementOnly: true,
    singleAxisChange: true,
    automaticSpeedPressure: false,
    distressCountsAsFailure: false,
  },
  statistics: {
    gameFamilies: ladders.length,
    progressionAnchors: totalAnchors,
    minimumAnchorsPerGame: Math.min(...ladders.map((ladder) => ladder.stages.length)),
    maximumAnchorsPerGame: Math.max(...ladders.map((ladder) => ladder.stages.length)),
  },
  ladders,
};

fs.writeFileSync(
  path.join(root, "content", "level-ladders.json"),
  `${JSON.stringify(output, null, 2)}\n`,
  "utf8",
);

console.log(
  `Generated ${totalAnchors} one-axis progression anchors across ${ladders.length} game families.`,
);
