# Task 00 — Bootstrap the mobile workspace

## Goal

Create the smallest buildable iOS/Android shell without weakening any product constraint.

## Read first

- `AGENTS.md`
- `docs/00-product-principles.md`
- `docs/05-architecture.md`
- `docs/06-child-ux-design-system.md`
- `docs/08-safety-privacy-compliance.md`
- `docs/11-codex-build-plan.md`

## Required work

1. Verify current official stable Expo/React Native compatibility.
2. Record exact versions and rationale in `docs/decisions/003-cross-platform-stack.md`.
3. Scaffold `apps/mobile` using TypeScript strict mode and New Architecture.
4. Configure workspaces so the app imports `@little-logic-lab/core` without platform code entering the core.
5. Add lint/type/test scripts.
6. Add an explicit production-network deny layer or equivalent build check.
7. Add local SQLite migration skeleton; no profile data is transmitted.
8. Confirm final native manifests contain no sensitive permissions.

## Do not add

Backend, account, cloud sync, remote config, OTA content, analytics, crash-reporting SDK, attribution, ads, push, camera, microphone, location, contacts, photo access, social sharing or purchases.

## Acceptance

- iOS and Android development builds open to a static shell;
- airplane mode has no effect;
- `npm test` passes;
- dependency and source policy checks pass;
- selected versions are documented;
- no sensitive permission appears in native manifests.
