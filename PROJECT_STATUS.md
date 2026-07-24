# Project status

Prepared: 24 July 2026

## Complete in this seed repository

- research basis and claim boundaries;
- 80 game families across 19 reusable archetypes and 10 domains;
- four age bands from 30 to 72 months;
- 1,030 generated one-axis progression anchors;
- 15-game P0 starter pack;
- deterministic generators for eight core archetypes;
- pure runtime reducers/evaluators for the first implementation set;
- mastery, support, adaptation and session scheduling logic;
- JSON schemas, sample templates, local data contracts and Romanian/English localization placeholders;
- offline/privacy policy checker;
- CI, issue templates and PR checklist;
- Codex task files and release checklist;
- 22 passing tests, including multi-seed property checks.

## Deliberately not implemented

- mobile UI and animation;
- production artwork or recorded audio;
- SQLite adapter and native parent gate;
- store metadata and privacy policy text for a legal entity;
- public/cloud services of any kind.

These belong to the implementation phase and must preserve `AGENTS.md`.

## Validation command

```bash
npm test
```

Expected summary:

```text
80 game families
1,030 progression anchors
22 passing tests
0 policy violations
```
