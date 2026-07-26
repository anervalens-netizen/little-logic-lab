import test from "node:test";
import assert from "node:assert/strict";

import {
  generateGentleMaze,
  generateGoNoGo,
  generateMemorySequence,
  generateNumberChoice,
  generateOrderLevel,
  generatePattern,
  generateSortLevel,
  generateTracePath,
  generateVisualChoice,
} from "../dist/index.js";

const items = [
  { id: "red-cat", attributes: { color: "red", category: "animal" } },
  { id: "red-dog", attributes: { color: "red", category: "animal" } },
  { id: "blue-duck", attributes: { color: "blue", category: "animal" } },
  { id: "blue-car", attributes: { color: "blue", category: "vehicle" } },
  { id: "green-boat", attributes: { color: "green", category: "vehicle" } },
  { id: "green-leaf", attributes: { color: "green", category: "nature" } },
  { id: "yellow-sun", attributes: { color: "yellow", category: "nature" } },
  { id: "yellow-bus", attributes: { color: "yellow", category: "vehicle" } },
];

function adjacent(left, right) {
  return Math.abs(left.row - right.row) + Math.abs(left.column - right.column) === 1;
}

test("100 visual-choice seeds remain unique and solvable", () => {
  for (let index = 0; index < 100; index += 1) {
    const level = generateVisualChoice(`visual:${index}`, {
      gameId: "same-picture",
      items,
      choiceCount: 4,
      similarityAttribute: "category",
    });
    assert.equal(new Set(level.payload.choiceIds).size, 4);
    assert.ok(level.payload.choiceIds.includes(level.payload.correctChoiceId));
  }
});

test("100 sort seeds map every selected item to an emitted bin", () => {
  for (let index = 0; index < 100; index += 1) {
    const level = generateSortLevel(`sort:${index}`, {
      gameId: "sort-by-color",
      items,
      attribute: "color",
      binCount: 2,
      itemCount: 4,
    });
    assert.equal(new Set(level.payload.itemIds).size, level.payload.itemIds.length);
    for (const itemId of level.payload.itemIds) {
      assert.ok(level.payload.bins.includes(level.payload.correctBinByItemId[itemId]));
    }
  }
});

test("100 sequence, pattern and number levels obey their bounds", () => {
  const symbols = ["a", "b", "c", "d"];
  for (let index = 0; index < 100; index += 1) {
    const sequence = generateMemorySequence(`sequence:${index}`, {
      gameId: "sequence-lights",
      symbols,
      sequenceLength: 5,
    });
    assert.equal(sequence.payload.sequence.length, 5);
    assert.ok(sequence.payload.sequence.every((value) => symbols.includes(value)));

    const pattern = generatePattern(`pattern:${index}`, {
      gameId: "repeat-pattern-ab",
      symbols,
      family: "ABC",
      totalLength: 8,
    });
    assert.equal(pattern.payload.visibleSequence.filter((value) => value === null).length, 1);
    assert.ok(symbols.includes(pattern.payload.answer));

    const number = generateNumberChoice(`number:${index}`, {
      gameId: "quantity-match",
      maxQuantity: 10,
      choiceCount: 4,
    });
    assert.equal(new Set(number.payload.options).size, 4);
    assert.ok(number.payload.options.includes(number.payload.correctChoice));
    assert.ok(number.payload.correctChoice >= 1 && number.payload.correctChoice <= 10);
  }
});

test("100 gentle mazes are contiguous from start to goal", () => {
  for (let index = 0; index < 100; index += 1) {
    const level = generateGentleMaze(`maze:${index}`, {
      gameId: "simple-maze",
      gridSize: 6,
    });
    assert.deepEqual(level.payload.safePath[0], level.payload.start);
    assert.deepEqual(level.payload.safePath.at(-1), level.payload.goal);
    for (let pathIndex = 1; pathIndex < level.payload.safePath.length; pathIndex += 1) {
      assert.ok(adjacent(level.payload.safePath[pathIndex - 1], level.payload.safePath[pathIndex]));
    }
  }
});

test("100 trace routes stay bounded and progress from start to goal", () => {
  for (let index = 0; index < 100; index += 1) {
    const level = generateTracePath(`trace:${index}`, {
      gameId: "trace-road",
      pathLength: 8,
      pathWidth: "narrow",
      turnCount: 10,
      guideStrength: "on_request",
    });
    assert.equal(level.payload.points.length, 13);
    assert.ok(
      level.payload.points.every(
        (point) =>
          point.x >= 0 &&
          point.x <= 1 &&
          point.y >= 0 &&
          point.y <= 1,
      ),
    );
    for (let pointIndex = 1; pointIndex < level.payload.points.length; pointIndex += 1) {
      assert.ok(
        level.payload.points[pointIndex].x >
          level.payload.points[pointIndex - 1].x,
      );
    }
  }
});

test("100 go/no-go and order levels are deterministic and complete", () => {
  for (let index = 0; index < 100; index += 1) {
    const seed = `mixed:${index}`;
    const goNoGo = generateGoNoGo(seed, {
      gameId: "tap-dont-tap",
      trialCount: 12,
      goRatio: 0.6,
      goStimulusId: "sun",
      noGoStimulusId: "cloud",
    });
    assert.equal(goNoGo.payload.trials.length, 12);
    assert.ok(goNoGo.payload.trials.every((trial, trialIndex) => trial.index === trialIndex));

    const order = generateOrderLevel(seed, {
      gameId: "daily-order",
      orderedStepIds: ["wash", "sit", "eat", "clean"],
      distractorIds: ["sleep"],
    });
    assert.deepEqual(order.payload.correctOrderIds, ["wash", "sit", "eat", "clean"]);
    assert.equal(new Set(order.payload.presentedIds).size, order.payload.presentedIds.length);
  }
});
