import test from "node:test";
import assert from "node:assert/strict";
import { recommendDifficultyDirection } from "../dist/index.js";

const strong = (responseMs) => ({
  completed: true,
  correctFirstTry: true,
  correctEventually: true,
  hintsUsed: 0,
  wrongAttempts: 0,
  responseMs,
});

test("three prompt clean responses may increase difficulty", () => {
  assert.equal(
    recommendDifficultyDirection([
      strong(2_800),
      strong(3_200),
      strong(3_600),
    ]),
    1,
  );
});

test("three slow clean responses hold difficulty instead of penalizing mastery", () => {
  assert.equal(
    recommendDifficultyDirection([
      strong(12_500),
      strong(13_200),
      strong(14_000),
    ]),
    0,
  );
});

test("slow responses reduce difficulty only when evidence is also weak", () => {
  assert.equal(
    recommendDifficultyDirection([
      {
        completed: true,
        correctFirstTry: false,
        correctEventually: true,
        hintsUsed: 1,
        wrongAttempts: 1,
        responseMs: 14_000,
      },
      {
        completed: true,
        correctFirstTry: false,
        correctEventually: false,
        hintsUsed: 1,
        wrongAttempts: 2,
        responseMs: 15_000,
      },
      {
        completed: true,
        correctFirstTry: false,
        correctEventually: true,
        hintsUsed: 1,
        wrongAttempts: 1,
        responseMs: 13_000,
      },
    ]),
    -1,
  );
});
