# ADR 003 — React Native/Expo with pure TypeScript core

Status: superseded by ADR 004 and ADR 005.

## Context

The app needs iOS and Android, rich 2D interaction, local storage, audio, accessibility and efficient iteration by a coding agent.

## Historical decision

The initial proposal was Expo/React Native. It was not implemented. The active
product is web/PWA-first; see ADR 005.

## Consequences

- shared cross-platform product;
- strong TypeScript and testing workflow;
- Skia enables high-performance custom scenes;
- accessible overlays are required for canvas actions;
- framework/library compatibility must be verified at implementation time.
