# Task 02 — Implement the P0 starter pack

## Goal

Expand only after Task 01 is complete. Implement every catalog entry with `implementationPriority: P0` using shared archetype plugins.

## Required approach

1. Group games by archetype; do not duplicate runtime logic per skin.
2. Implement plugin contract: `generate`, `initialize`, `reduce`, `evaluate`, `getHint`.
3. Keep renderer separate from correctness and mastery.
4. Use the generated ladder as reference; runtime changes one axis per decision.
5. Add deterministic replay/debug screen in developer builds only.
6. Add Romanian instruction/audio manifest.
7. Add property tests for solvability and no accidental shortcuts.
8. Add one real-world transfer prompt per game.

## Release content

P0 currently contains 15 game families. The exact source is `content/game-catalog.json`; do not hard-code this number in product code.

## Exit gate

- every P0 game passes shared acceptance criteria;
- one short session can mix domains without repeating a game;
- open-ended/hybrid activities are not scored;
- parent progress descriptions remain qualitative;
- airplane-mode release test passes.
