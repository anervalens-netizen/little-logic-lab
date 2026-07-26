# Task 02 — Starter release P0

Status: automat și Android complet; revizia audio și porțile umane rămân externe

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
  consumă toate cele 19 stage-uri și paginează 20 de prieteni în același
  context WebGL;
- `daily-order` rulează pe secvențiere Pixi comună și consumă toate cele 14
  stage-uri, până la șase pași, trei distractori, distanță cauzală și suport
  verbal minim;
- `real-color-hunt` reutilizează promptul Pixi fără a introduce scor pentru
  activitatea deschisă și consumă toate cele 13 stage-uri, până la șase
  misiuni, două reguli și 40 s de memorie;
- `peek-and-find` reutilizează rendererul `choice`, ascunde modelul inclusiv
  semantic și consumă toate cele 22 stage-uri, cu nouă locații, până la 6 s
  întârziere și transformări;
- `wait-for-go` reutilizează promptul Pixi pentru toate cele 19 stage-uri,
  până la 16 semnale, cu delay, stimuli multipli și inversarea regulii;
- `trace-road` folosește generator core verificat pe 100 seed-uri și tracking
  nativ de pointer pe canvas pentru toate cele 17 stage-uri;
- `sort-by-shape` și `sort-by-size` rulează cu `sort-by-color` pe batch-uri de
  maximum trei obiecte pe telefon și patru pe tabletă;
- stage-ul maxim de 12 obiecte/4 coșuri este E2E, cu grid tactil de minimum
  96 px și exact un canvas;
- toate cele 15 familii P0 folosesc acum Pixi, fără renderer DOM de prototip;
- nivelurile consecutive reutilizează shell-ul React și contextul WebGL, fără
  recreare GPU sau long tasks peste 100 ms în tranziție;
- finalul sesiunii persistă un lock local; Child Mode nu mai expune continuarea,
  iar Parent Mode este singura cale de a permite o sesiune nouă;
- lifecycle-ul păstrează exact un canvas, iar Chromium/WebKit au E2E și 30
  baseline-uri vizuale deterministe pentru cele cincisprezece scene Pixi.
