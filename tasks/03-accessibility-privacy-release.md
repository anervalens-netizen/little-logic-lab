# Task 03 — Accessibility, privacy and release hardening

Status: automat complet; validarea manuală VoiceOver/TalkBack și pilotul rămân externe

## Goal

Prepare a private family pilot for the web/PWA product, not a public launch
claim.

## Accessibility

- VoiceOver/TalkBack traversal through the React shell and Pixi DOM overlays;
- color never carries meaning alone;
- audio-off equivalent for all instructions;
- Reduce Motion path;
- large-target accommodation;
- forgiving drag/drop and edge handling;
- screen-size/device matrix.

## Privacy/security

- audit dependency tree, CSP and browser permissions;
- verify no runtime network egress;
- parent gate for links/settings/export/delete;
- no child name in logs;
- review backup behavior;
- privacy notice accurately states local-only behavior;
- privacy notice matches the deployed PWA.

## Pilot protocol

Use direct parent observation. Record only adult notes such as unclear instruction, accidental tap, needed hint, frustration signal and successful transfer to a real object. Do not infer intelligence, diagnose development or compare the child with age percentiles.

## Exit gate

All items in `docs/15-release-checklist.md` are either passed or explicitly documented as blocked.

## Implementat

- overlay semantic pentru fiecare acțiune Pixi și ordine de focus verificată;
- audio-off, Reduced Motion, contrast ridicat, ținte tactile de 112 px și
  demonstrații 1,5× mai lente, persistate în profilul local v4;
- migrare fără pierderi din profilurile v1/v2/v3;
- feedback automat despre strategie/efort, cu reguli statice împotriva laudelor
  despre identitatea copilului;
- CSP, zero egress de gameplay, offline/PWA, export/delete și parent gate
  verificate automat;
- Axe, matrice Chromium/WebKit touch/desktop și baseline-uri vizuale.

Rămân explicit blocate de accesul fizic: VoiceOver/TalkBack manual, auditul
auditiv nativ, măsurarea pe dispozitivul Android țintă și observația copil–adult.
