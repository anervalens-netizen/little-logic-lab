# Technical architecture

## Decision summary

Use a web/PWA-first application with a React semantic shell and PixiJS game
scenes. Keep learning logic in a pure TypeScript package and render games
through plugins. TypeScript 7 is the workspace compiler.

The system is offline-first and has no runtime backend in v1.

## Layering

```text
┌──────────────────────────────────────────────┐
│ React web shell                              │
│ child home · session · parent gate · settings│
├──────────────────────────────────────────────┤
│ Game renderers                               │
│ PixiJS WebGL + accessible DOM overlay        │
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
│ IndexedDB · bundled audio · PWA cache         │
└──────────────────────────────────────────────┘
```

Dependencies point downward. The core package never imports React, PixiJS,
IndexedDB or browser APIs.

## Suggested monorepo target

```text
apps/web/
packages/core/
packages/game-runtime/
packages/game-renderers/
packages/content/
packages/storage/
packages/testing/
```

The current prototype implements `apps/web` and `packages/core`; the remaining
packages are extracted incrementally during R1/R2.

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

Use React/DOM for:

- navigation;
- buttons;
- parent mode;
- textual settings;
- accessibility semantics;
- simple card grids and sorting.

Use PixiJS with the production WebGL renderer for:

- animated 2D scenes;
- paths, tracing and mazes;
- drag-heavy shape puzzles;
- controlled particle or character animation.

Keep an accessible DOM overlay for every actionable canvas object. Do not
sacrifice VoiceOver/TalkBack for visual convenience.

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

IndexedDB characteristics:

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

## Stack

- TypeScript 7 native in strict mode.
- React 19.2 for shell and semantic UI.
- PixiJS 8/WebGL for game scenes and controlled motion.
- IndexedDB with versioned repositories and migrations.
- Bundled Romanian audio plus Web Audio.
- JSON Schema/Zod at boundaries.
- Node/Vitest/property tests and Playwright for critical flows.
- Vite 8 and Cloudflare Pages for static delivery.

Exact versions and rationale are in ADR 005.

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
