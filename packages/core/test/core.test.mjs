import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSessionPlan,
  createMastery,
  generateGentleMaze,
  generateMemorySequence,
  generatePattern,
  masteryMean,
  nextSupportAction,
  recommendDifficultyDirection,
  stepDifficulty,
  updateMastery,
} from "../dist/index.js";

test("mastery rises after clean success and falls relative to prior after failure", () => {
  const prior = createMastery();
  const success = updateMastery(prior, {
    completed: true,
    correctFirstTry: true,
    correctEventually: true,
    hintsUsed: 0,
    wrongAttempts: 0,
  }, "2026-07-24T10:00:00+03:00");

  const failure = updateMastery(prior, {
    completed: true,
    correctFirstTry: false,
    correctEventually: false,
    hintsUsed: 2,
    wrongAttempts: 3,
  }, "2026-07-24T10:00:00+03:00");

  assert.ok(masteryMean(success) > masteryMean(prior));
  assert.ok(masteryMean(failure) < masteryMean(prior));
});

test("abandoned or distress attempts do not alter mastery", () => {
  const prior = createMastery();
  const next = updateMastery(prior, {
    completed: false,
    correctFirstTry: false,
    correctEventually: false,
    hintsUsed: 0,
    wrongAttempts: 0,
    distressSignal: true,
  }, "2026-07-24T10:00:00+03:00");
  assert.deepEqual(next, prior);
});

test("difficulty changes at most one axis", () => {
  const result = stepDifficulty(
    { choiceCount: 2, similarity: 0 },
    [
      { name: "choiceCount", values: [2, 3, 4] },
      { name: "similarity", values: [0, 1, 2] },
    ],
    1,
  );
  assert.equal(result.changedAxis, "choiceCount");
  assert.deepEqual(result.vector, { choiceCount: 3, similarity: 0 });
});

test("difficulty direction requires repeated clean success", () => {
  const clean = {
    completed: true,
    correctFirstTry: true,
    correctEventually: true,
    hintsUsed: 0,
    wrongAttempts: 0,
  };
  assert.equal(recommendDifficultyDirection([clean, clean, clean]), 1);
});

test("support policy simplifies before ending a level", () => {
  assert.equal(nextSupportAction({
    consecutiveErrors: 3,
    hintsAlreadyShown: 1,
    levelAlreadySimplified: false,
    distressSignal: false,
    sessionMinutesElapsed: 2,
    sessionMinuteLimit: 7,
  }), "simplify_level");
});

test("session planner returns unique games and a transfer activity", () => {
  const candidates = [
    { gameId: "a", skillId: "visual", mode: "digital", masteryMean: 0.8, evidenceCount: 5, timesPlayed: 4, dueScore: 1, ageEligible: true },
    { gameId: "b", skillId: "memory", mode: "digital", masteryMean: 0.6, evidenceCount: 4, timesPlayed: 3, dueScore: 1, ageEligible: true },
    { gameId: "c", skillId: "sort", mode: "digital", masteryMean: 0.65, evidenceCount: 4, timesPlayed: 3, dueScore: 0.8, ageEligible: true },
    { gameId: "d", skillId: "novel", mode: "digital", masteryMean: 0.5, evidenceCount: 0, timesPlayed: 0, dueScore: 1, ageEligible: true },
    { gameId: "e", skillId: "transfer", mode: "hybrid", masteryMean: 0.5, evidenceCount: 0, timesPlayed: 0, dueScore: 1, ageEligible: true },
  ];
  const plan = buildSessionPlan(candidates, { seed: "test", maxGames: 4, includeHybrid: true });
  assert.equal(new Set(plan.entries.map((entry) => entry.gameId)).size, plan.entries.length);
  assert.ok(plan.entries.some((entry) => entry.role === "transfer"));
});

test("generators are deterministic", () => {
  const first = generateMemorySequence("seed", {
    gameId: "sequence-lights",
    symbols: ["a", "b", "c"],
    sequenceLength: 4,
  });
  const second = generateMemorySequence("seed", {
    gameId: "sequence-lights",
    symbols: ["a", "b", "c"],
    sequenceLength: 4,
  });
  assert.deepEqual(first, second);
});

test("pattern generator creates a single solvable blank", () => {
  const level = generatePattern("pattern", {
    gameId: "repeat-pattern-ab",
    symbols: ["red", "blue", "green"],
    family: "AB",
    totalLength: 6,
  });
  assert.equal(level.payload.visibleSequence.filter((value) => value === null).length, 1);
  assert.equal(level.payload.visibleSequence[level.payload.missingIndex], null);
});

test("gentle maze always reaches the goal without hazards", () => {
  const level = generateGentleMaze("maze", { gameId: "simple-maze", gridSize: 4 });
  const last = level.payload.safePath.at(-1);
  assert.deepEqual(last, level.payload.goal);
  assert.equal(level.difficulty.movingHazards, 0);
});

test("choice runtime supports neutral retry and completion", async () => {
  const { initializeChoice, reduceChoice, evaluateChoice } = await import("../dist/index.js");
  let state = initializeChoice("cat", ["cat", "dog", "duck"]);
  state = reduceChoice(state, { type: "select", value: "dog" });
  assert.equal(state.completed, false);
  assert.equal(state.wrongAttempts, 1);
  state = reduceChoice(state, { type: "select", value: "cat" });
  const evaluation = evaluateChoice(state);
  assert.equal(evaluation.completed, true);
  assert.equal(evaluation.correct, true);
  assert.ok(evaluation.score01 < 1);
});

test("sort runtime accepts forgiving correct drops and rejects wrong bins", async () => {
  const { initializeSort, reduceSort, evaluateSort } = await import("../dist/index.js");
  let state = initializeSort({ apple: "red", leaf: "green" });
  state = reduceSort(state, { type: "place", itemId: "apple", binId: "green" });
  assert.deepEqual(state.placedBinByItemId, {});
  state = reduceSort(state, { type: "place", itemId: "apple", binId: "red" });
  state = reduceSort(state, { type: "place", itemId: "leaf", binId: "green" });
  assert.equal(evaluateSort(state).correct, true);
});

test("memory sequence resets the child input after a mismatch", async () => {
  const { initializeMemorySequence, reduceMemorySequence } = await import("../dist/index.js");
  let state = initializeMemorySequence(["a", "b", "c"]);
  state = reduceMemorySequence(state, { type: "begin_recall" });
  state = reduceMemorySequence(state, { type: "tap_symbol", symbolId: "a" });
  state = reduceMemorySequence(state, { type: "tap_symbol", symbolId: "c" });
  assert.deepEqual(state.inputSequence, []);
  assert.equal(state.wrongAttempts, 1);
});

test("go/no-go evaluation scores accuracy, not reaction speed", async () => {
  const { initializeGoNoGo, reduceGoNoGo, evaluateGoNoGo } = await import("../dist/index.js");
  let state = initializeGoNoGo([
    { index: 0, expectedAction: "tap" },
    { index: 1, expectedAction: "wait" },
    { index: 2, expectedAction: "tap" },
    { index: 3, expectedAction: "wait" },
  ]);
  for (const observedAction of ["tap", "wait", "tap", "wait"]) {
    state = reduceGoNoGo(state, { type: "resolve_trial", observedAction });
  }
  const evaluation = evaluateGoNoGo(state);
  assert.equal(evaluation.score01, 1);
  assert.equal(evaluation.strategyTag, "rule_accuracy_without_speed_score");
});

test("order runtime requires exact causal order", async () => {
  const { initializeOrder, reduceOrder, evaluateOrder } = await import("../dist/index.js");
  let state = initializeOrder(["wash", "sit", "eat"]);
  state = reduceOrder(state, { type: "submit_order", itemIds: ["sit", "wash", "eat"] });
  assert.equal(state.completed, false);
  state = reduceOrder(state, { type: "submit_order", itemIds: ["wash", "sit", "eat"] });
  assert.equal(evaluateOrder(state).correct, true);
});

test("maze runtime follows a deterministic safe path", async () => {
  const { initializeMaze, reduceMaze, evaluateMaze } = await import("../dist/index.js");
  const path = [
    { row: 0, column: 0 },
    { row: 0, column: 1 },
    { row: 1, column: 1 },
  ];
  let state = initializeMaze(path);
  state = reduceMaze(state, { type: "move_to", point: { row: 1, column: 0 } });
  assert.equal(state.pathIndex, 0);
  state = reduceMaze(state, { type: "move_to", point: path[1] });
  state = reduceMaze(state, { type: "move_to", point: path[2] });
  assert.equal(evaluateMaze(state).correct, true);
});

test("31 months selects the conservative toddler band and settings", async () => {
  const { ageBandForMonths, initialSessionSettings } = await import("../dist/index.js");
  assert.equal(ageBandForMonths(31), "A30_36");
  assert.deepEqual(initialSessionSettings(31), {
    sessionMinutes: 5,
    startingChoiceCount: 2,
    targetSize: "extra_large",
    reducedMotion: true,
    musicEnabled: false,
  });
});

test("curriculum selects a conservative age-band anchor and moves one step", async () => {
  const { selectInitialAnchor, moveOnLadder, isSingleAxisTransition } = await import("../dist/index.js");
  const ladder = {
    gameId: "example",
    entryBand: "A30_36",
    stages: [
      { id: "L1", index: 1, recommendedBand: "A30_36", difficulty: { choices: 2, similarity: 0 }, change: null, purpose: "entry" },
      { id: "L2", index: 2, recommendedBand: "A30_36", difficulty: { choices: 3, similarity: 0 }, change: { axis: "choices", from: 2, to: 3 }, purpose: "step" },
      { id: "L3", index: 3, recommendedBand: "B36_48", difficulty: { choices: 3, similarity: 1 }, change: { axis: "similarity", from: 0, to: 1 }, purpose: "step" },
    ],
  };
  const initial = selectInitialAnchor(ladder, "B36_48");
  assert.equal(initial.id, "L3");
  const previous = moveOnLadder(ladder, initial.id, -1);
  assert.equal(previous.id, "L2");
  assert.equal(isSingleAxisTransition(previous.difficulty, initial.difficulty), true);
});
