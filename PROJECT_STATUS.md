# Project status

Updated: 25 July 2026

## Current state

- The specification/core commit is intact.
- The OpenCode web prototype is present locally and not yet checkpointed.
- Root tests pass: 80 families, 1,030 progression anchors, 22 core tests.
- The web prototype type-checks and builds.
- 14 playable prototype modules exist; P0 contains 15 families and
  `drag-and-fit` is missing.
- The prototype manually declares games/difficulty axes; it does not consume
  the catalog and generated ladders as runtime content.
- OpenCode browser scripts were temporary and are not a committed quality gate.
- `logic-lab.astancu.eu` currently returns 404.

## Active direction

The product is web/PWA-first:

- TypeScript 7 native;
- React semantic shell;
- PixiJS 8/WebGL game scenes;
- IndexedDB persistence with deterministic replay;
- bundled Romanian recordings;
- generated, revisioned PWA caching;
- committed Playwright tests;
- Cloudflare Pages static deployment.

See `docs/12-roadmap.md` and ADR 005.

## Preserved foundation

- research and claim boundaries;
- 80 families, 19 archetypes, 10 domains;
- four age bands, 30–72 months;
- 1,030 one-axis progression anchors;
- pure generators/reducers/evaluators;
- mastery, support, adaptation and scheduler;
- JSON schemas, policy checker and localization placeholders.

## Current validation

```bash
npm test
npm run typecheck
npm run build:web
```

The prototype is not a release candidate until R0 and the golden slice gates
from the roadmap pass.
