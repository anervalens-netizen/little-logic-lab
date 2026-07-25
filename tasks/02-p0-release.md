# Task 02 — Starter release P0

Status: activ

## Goal

Livrează toate familiile cu `implementationPriority: P0` prin arhetipuri
reutilizabile, după golden slice.

## Required work

1. Ridică toate cele 15 familii P0 la contractul Pixi comun; `drag-and-fit`
   există deja funcțional pe arhetipul `spatial-fit`.
2. Fără registru sau număr hard-coded; catalogul este sursa.
3. Plugin contract complet: generate, initialize, reduce, evaluate, getHint.
4. Ladders, unlock policy și scheduler conectate.
5. Manifest audio RO local, versionat și revizuit auditiv.
6. Replay/debug viewer numai în developer builds.
7. Property tests și verificări împotriva shortcut-urilor perceptuale.
8. Transfer prompt pentru fiecare joc.

## Acceptance

- contractul comun trece pentru toate familiile P0;
- hibridele/open-ended nu sunt punctate;
- o sesiune amestecă domenii fără repetiție;
- parent dashboard rămâne calitativ;
- release-ul funcționează complet offline.

## Implementat

- 15/15 familii P0 sunt funcționale;
- `spatial-fit` este comun pentru `inset-puzzle` și `drag-and-fit`;
- stage-urile cu până la 10 piese sunt împărțite în batch-uri de maximum 4;
- rotația, outline support și similarity au efect vizual/content;
- `shadow-match` reutilizează rendererul `choice` cu toate cele patru axe;
- `emotion-match` consumă cele 11 stage-uri prin același renderer, inclusiv opt
  emoții și perspective vizuale distincte;
- `listen-find` consumă toate cele 16 stage-uri prin rendererul `choice`, cu
  cerință audio locală, replay semantic și fără indiciu vizual al răspunsului;
- `one-to-one-count` reutilizează drag/snap Pixi pentru corespondență unică,
  inclusiv stage-ul complet cu trei prieteni;
- `sort-by-shape` și `sort-by-size` rulează cu `sort-by-color` pe batch-uri de
  maximum trei obiecte pe telefon și patru pe tabletă;
- stage-ul maxim de 12 obiecte/4 coșuri este E2E, cu grid tactil de minimum
  96 px și exact un canvas;
- lifecycle-ul păstrează exact un canvas, iar Chromium/WebKit au E2E și 20
  baseline-uri vizuale pentru cele zece scene Pixi.
