# Task 03 — Accessibility, privacy and release hardening

## Goal

Prepare a private family pilot, not a public launch claim.

## Accessibility

- VoiceOver and TalkBack traversal on every child and parent screen;
- color never carries meaning alone;
- audio-off equivalent for all instructions;
- Reduce Motion path;
- large-target accommodation;
- forgiving drag/drop and edge handling;
- screen-size/device matrix.

## Privacy/security

- audit dependency tree and native permissions;
- verify no runtime network egress;
- parent gate for links/settings/export/delete;
- no child name in logs;
- review backup behavior;
- privacy notice accurately states local-only behavior;
- Data Safety/App Privacy forms match binaries.

## Pilot protocol

Use direct parent observation. Record only adult notes such as unclear instruction, accidental tap, needed hint, frustration signal and successful transfer to a real object. Do not infer intelligence, diagnose development or compare the child with age percentiles.

## Exit gate

All items in `docs/15-release-checklist.md` are either passed or explicitly documented as blocked.
