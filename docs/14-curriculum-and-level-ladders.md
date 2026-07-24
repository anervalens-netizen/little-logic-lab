# Curriculum and generated level ladders

The app does not use a single linear course. It uses a **skill graph**: each game family has its own difficulty vector, while age selects only a conservative starting point.

## Machine-readable sources

- `content/game-catalog.json`: 80 game families and their learning goals.
- `content/archetype-presets.json`: safe values by age band.
- `content/level-ladders.json`: generated reference anchors for every game.
- `scripts/generate-level-ladders.mjs`: deterministic ladder generator.

Run:

```bash
npm run generate:ladders
```

## What an anchor means

An anchor is a valid reference configuration, not a mandatory school-like level. Consecutive anchors differ on exactly one major axis. The runtime may:

- repeat an anchor with different content and seed;
- hold difficulty while a mechanic is still new;
- move one anchor forward after repeated clean success;
- move one anchor backward or add support after errors;
- stop without updating mastery when distress is observed.

This preserves interpretability. A child who struggles after `choiceCount` changes from 3 to 4 is not simultaneously exposed to more similar distractors and less visual support.

## Content variation versus cognitive difficulty

A seed or theme change does not necessarily increase difficulty. Examples:

- same configuration, different animals: content variation;
- same maze dimensions, different path: content variation;
- three choices instead of two: cognitive difficulty change;
- visible model changed to brief preview: cognitive difficulty change.

The scheduler should use content variation freely while adapting cognitive difficulty conservatively.

## Progression rule

Default advance recommendation:

1. at least three recent clean successes;
2. no hints or repeated wrong attempts;
3. calm engagement;
4. preferably evidence across more than one session;
5. next anchor stays inside the safety ceiling and changes one axis only.

Age never forces advancement. Parent mode may lock a game, pin a favorite or lower the starting point, but should not expose a competitive score.
