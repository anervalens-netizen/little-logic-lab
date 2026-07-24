# ADR 003 — React Native/Expo with pure TypeScript core

Status: proposed until implementation versions are selected.

## Context

The app needs iOS and Android, rich 2D interaction, local storage, audio, accessibility and efficient iteration by a coding agent.

## Decision

Use the current stable Expo SDK compatible with stable React Native New Architecture. Use standard React Native UI for semantics and React Native Skia selectively for game canvases. Keep the domain core platform-independent.

## Consequences

- shared cross-platform product;
- strong TypeScript and testing workflow;
- Skia enables high-performance custom scenes;
- accessible overlays are required for canvas actions;
- framework/library compatibility must be verified at implementation time.
