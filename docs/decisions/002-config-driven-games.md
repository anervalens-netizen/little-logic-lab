# ADR 002 — Config-driven games with deterministic seeds

Status: accepted.

## Context

Dozens of game families share mechanics. Hand-written screens would duplicate logic and make difficulty inconsistent.

## Decision

Represent each level as game definition, content pack, seed and difficulty vector. Reuse archetype plugins and keep correctness in pure logic.

## Consequences

- many varied levels from small content packs;
- replayable bugs;
- property testing;
- consistent adaptation;
- content authors need schemas and preview tools;
- generators must enforce solvability.
