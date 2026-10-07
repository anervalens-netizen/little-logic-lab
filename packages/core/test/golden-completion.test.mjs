import test from 'node:test';
import assert from 'node:assert/strict';
import { hasCompletedGoldenJourney } from '../../../apps/web/src/app/goldenJourney.ts';

test('golden completion needs four successes across at least two golden games', () => {
  const success = gameId => ({ gameId, completed: true, correctEventually: true, abandoned: false });
  assert.equal(hasCompletedGoldenJourney(Array.from({ length: 4 }, () => success('same-picture'))), false);
  assert.equal(hasCompletedGoldenJourney([success('same-picture'), success('same-picture'), success('inset-puzzle')]), false);
  assert.equal(hasCompletedGoldenJourney([success('same-picture'), success('same-picture'), success('inset-puzzle'), success('inset-puzzle')]), true);
  assert.equal(hasCompletedGoldenJourney(Array.from({ length: 5 }, () => success('other-game'))), false);
});
