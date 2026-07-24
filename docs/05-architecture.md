# Technical architecture

## Decision summary

Use a cross-platform React Native application, preferably through the current stable Expo SDK at implementation time, with the New Architecture enabled. Keep learning logic in a pure TypeScript package and render games through plugins.

The system is offline-first and has no runtime backend in v1.

## Layering

```text
┌──────────────────────────────────────────────┐
│ Mobile shell                                 │
│ child home · session · parent gate · settings│
├──────────────────────────────────────────────┤
│ Game renderers                               │
│ RN semantic UI + optional Skia canvas        │
├──────────────────────────────────────────────┤
│ Game runtime                                 │
│ plugin state machines · hints · evaluation   │
├──────────────────────────────────────────────┤
│ @little-logic-lab/core                       │
│ generation · mastery · adaptation · scheduler│
├──────────────────────────────────────────────┤
│ Content                                      │
│ JSON catalog · presets · assets · audio      │
├──────────────────────────────────────────────┤
│ Local platform services                      │
│ SQLite · audio · haptics · secure settings   │
└──────────────────────────────────────────────┘
```

Dependencies point downward. The core package never imports React Native, Expo, SQLite, Skia or platform APIs.

## Suggested monorepo target

```text
apps/mobile/
packages/core/
packages/game-runtime/
packages/game-renderers/
packages/content/
packages/testing/
```

This seed repo implements only `packages/core`; Codex should add the rest incrementally.

## Game plugin contract

Every game family maps to an archetype plugin:

```ts
interface GamePlugin<TConfig, TState, TAction, TPayload> {
  gameId: string;
  generate(seed: string, config: TConfig): GeneratedLevel<TPayload>;
  initialize(level: GeneratedLevel<TPayload>): TState;
  reduce(state: TState, action: TAction): TState;
  evaluate(state: TState): Evaluation;
  getHint(state: TState, hintIndex: number): Hint;
}
```

Responsibilities:

- `generate`: creates a solvable level;
- `initialize`: starts a serializable state machine;
- `reduce`: processes child actions;
- `evaluate`: reports task-specific correctness;
- `getHint`: provides graded support;
- renderer: presents state and emits actions only.

Correctness must never be calculated from animation callbacks or UI coordinates.

## Runtime state machine

Recommended common states:

```text
loading
→ demonstration
→ ready
→ playing
→ feedback
→ hint
→ simplified
→ completed
→ transfer_prompt
→ closed
```

Any state can transition to `closed` through parent stop, session limit or distress.

## Rendering strategy

Use standard React Native views for:

- navigation;
- buttons;
- parent mode;
- textual settings;
- accessibility semantics;
- simple card grids and sorting.

Use React Native Skia for:

- animated 2D scenes;
- paths, tracing and mazes;
- drag-heavy shape puzzles;
- controlled particle or character animation.

Keep an accessible semantic overlay when a Skia canvas contains actionable objects. Do not sacrifice VoiceOver/TalkBack for visual convenience.

## State management

Prefer small explicit stores:

- session state;
- local profile/settings;
- game runtime state;
- content registry.

Avoid a global store that mixes animation state, persistence and pedagogy. The game reducer should be testable as a pure function.

## Persistence

Recommended local model:

```text
profiles
settings
skill_mastery
game_difficulty
sessions
attempt_events
content_version
```

SQLite characteristics:

- one transaction per completed attempt or session end;
- schema migrations are versioned and tested;
- delete/export from parent mode;
- optional display name only;
- no cloud identifier;
- no exact date of birth required; birth month/year is optional and local.

## Content pipeline

1. Author or edit a game definition.
2. Validate against JSON Schema.
3. Validate age-band axes and guardrails.
4. Generate deterministic preview levels.
5. Run solvability/property tests.
6. Review Romanian copy/audio.
7. Bundle approved content with the app.

Content updates in v1 ship through normal app releases. Avoid remote configuration or OTA content until privacy implications are reviewed.

## Audio and assets

- Bundle all child-facing assets.
- Prefer recorded Romanian narration by a consistent adult voice.
- Keep prompts short and replayable.
- Use asset manifests with stable IDs.
- Do not use remote image URLs.
- Avoid copyrighted characters or third-party art without licenses.

## Recommended stack at implementation time

- Current stable Expo SDK and compatible stable React Native.
- TypeScript strict mode.
- React Native Skia for selected canvases.
- Reanimated for motion.
- Expo SQLite.
- Expo Audio.
- Expo Haptics.
- JSON Schema/Zod at boundaries.
- Jest/Vitest for pure logic; React Native Testing Library for shell; Maestro or Detox for critical flows.

Framework versions change. Codex should verify current official documentation, use stable compatible versions and record them in an ADR.

## Security boundaries

- Child mode has no links, purchases, permission prompts or settings.
- Parent mode is behind an adult-level gate.
- Network calls are absent in production code.
- A CI rule should scan dependencies and permissions.
- Release testing includes airplane mode and packet inspection.
- Debug logging contains no child name or free text.

## Failure modes

- Corrupt local DB: preserve settings if possible, reset progress only with parent explanation.
- Invalid content: quarantine definition; never show an unsolvable level.
- Missing audio: show visual demonstration; do not crash.
- Animation failure: game logic remains operable.
- App interrupted: resume at session boundary, not mid-feedback loop.
