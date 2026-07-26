# ADR 001 — Offline-first, no backend in v1

Status: accepted.

## Context

The target user is under six. Accounts, telemetry, advertising identifiers and remote content add privacy, compliance and failure risk without being necessary for the core learning experience.

## Decision

V1 has no runtime backend, account, cloud sync, remote configuration,
advertising, attribution or third-party analytics. Progress stays in browser
IndexedDB. Export is initiated by the parent.

## Consequences

Advantages:

- child gameplay works in airplane mode;
- smaller privacy surface;
- easier Kids Category/Families compliance;
- deterministic content;
- no service outage risk.

Costs:

- no cross-device sync;
- parent is responsible for backups/export;
- content ships with app releases;
- debugging relies on local reproducible seeds and manual export.
