import test from "node:test";
import assert from "node:assert/strict";
import { buildSessionPlan } from "../dist/index.js";

const candidate = (overrides) => ({
  gameId: "same-picture",
  skillId: "visual_discrimination",
  mode: "digital",
  domain: "visual_attention",
  masteryMean: 0.6,
  evidenceCount: 3,
  timesPlayed: 3,
  dueScore: 0.5,
  ageEligible: true,
  lastPracticedAtLocal: "2026-07-20T10:00:00.000Z",
  recentSupportLoad: 0.1,
  recentAbandonRate: 0,
  ...overrides,
});

test("premium scheduler is deterministic for the same evidence and seed", () => {
  const candidates = [
    candidate({ gameId: "same-picture", domain: "visual_attention" }),
    candidate({
      gameId: "sort-by-color",
      skillId: "classification_color",
      domain: "classification",
      masteryMean: 0.52,
    }),
    candidate({
      gameId: "inset-puzzle",
      skillId: "spatial_matching",
      domain: "spatial_planning",
      masteryMean: 0.7,
    }),
  ];
  const options = {
    seed: "premium-session",
    maxGames: 3,
    includeHybrid: false,
    nowLocal: "2026-07-28T10:00:00.000Z",
  };

  assert.deepEqual(
    buildSessionPlan(candidates, options),
    buildSessionPlan(candidates, options),
  );
});

test("premium scheduler prefers domain variety when alternatives exist", () => {
  const plan = buildSessionPlan(
    [
      candidate({ gameId: "match-a", domain: "visual_attention" }),
      candidate({
        gameId: "match-b",
        skillId: "visual_discrimination_2",
        domain: "visual_attention",
      }),
      candidate({
        gameId: "sort-a",
        skillId: "classification_color",
        domain: "classification",
      }),
      candidate({
        gameId: "puzzle-a",
        skillId: "spatial_matching",
        domain: "spatial_planning",
      }),
    ],
    {
      seed: "domain-variety",
      maxGames: 3,
      includeHybrid: false,
      nowLocal: "2026-07-28T10:00:00.000Z",
    },
  );

  assert.equal(plan.entries.length, 3);
  const selectedDomains = plan.entries.map(
    (entry) =>
      ({
        "match-a": "visual_attention",
        "match-b": "visual_attention",
        "sort-a": "classification",
        "puzzle-a": "spatial_planning",
      })[entry.gameId],
  );
  assert.equal(new Set(selectedDomains).size, 3);
});

test("high recent abandonment lowers selection pressure without excluding a game", () => {
  const stable = candidate({
    gameId: "stable",
    domain: "classification",
    dueScore: 0.55,
    recentAbandonRate: 0,
  });
  const distressed = candidate({
    gameId: "distressed",
    skillId: "working_memory",
    domain: "working_memory",
    dueScore: 1,
    recentAbandonRate: 1,
  });
  const plans = Array.from({ length: 40 }, (_, index) =>
    buildSessionPlan([stable, distressed], {
      seed: `abandon-${index}`,
      maxGames: 1,
      includeHybrid: false,
      nowLocal: "2026-07-28T10:00:00.000Z",
    }).entries[0]?.gameId,
  );

  const stableSelections = plans.filter((id) => id === "stable").length;
  assert.ok(stableSelections > 0);
  assert.ok(plans.some((id) => id === "distressed"));
});
