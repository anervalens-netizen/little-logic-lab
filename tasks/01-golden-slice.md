# Task 01 — Golden slice

Status: automat și Android complet; porțile umane rămân externe

## Goal

Definește standardul final de produs prin trei jocuri:
`same-picture`, `sort-by-color`, `inset-puzzle`.

## Required work

1. React shell și runtime Pixi lifecycle.
2. Loader tipizat din catalog/ladders.
3. Input comun tap/drag/snap și accessibility overlay.
4. IndexedDB cu replay determinist.
5. Art direction coerent, Lumi contextual și audio RO local.
6. Reduced Motion și audio-off equivalents.
7. Property, unit, E2E touch și visual regression tests.
8. Performance measurement pe dispozitivul țintă.

## Acceptance

- 60 FPS, frame p95 în maximum un interval de refresh;
- input feedback sub 50 ms;
- fără citit necesar copilului;
- toate ancorele 30–36 luni relevante sunt consumate;
- offline și update PWA trec;
- observația cu copilul nu identifică blocaje majore.

Exit-ul automat permite migrarea arhetipurilor cu aprobarea ownerului; pilotul
rămâne blocat până la validările umane.

## Implementat

- shell React și scene Pixi lazy-loaded;
- lifecycle cu cleanup verificat prin distrugere/recreare;
- tap plus runtime comun drag/snap magnetic;
- overlay semantic pentru toate obiectele acționabile;
- IndexedDB profil v4 cu migrare v1/v2/v3 și fallback;
- manifest P0 și registry lazy tipizat, generate din catalog/ladders/ordinea
  release, cu toate chunk-urile verificate în precache;
- manifest canonic pentru 36 ilustrații procedurale originale, cu maparea
  renderer–asset verificată static și fără pachet placeholder;
- Parent Mode React și progresie limitată strict la stage-urile eligibile;
- 321 clipuri RO locale, fără Web Speech sau request-uri audio externe;
- Axe automat și 42 baseline-uri vizuale deterministe Chromium/WebKit;
- telemetrie locală pentru frame p95, input latency și long tasks;
- OnePlus 6T real: 59,55–59,84 FPS, frame p95 16,8 ms, input 5,8–7,3 ms,
  zero long tasks și lifecycle fără resurse reziduale;
- 69,98 KiB JS inițial gzip, sub bugetul de 100 KiB;
- primul pass pentru toate cele trei jocuri și E2E Chromium/WebKit.

Rămân deschise revizia auditivă umană, VoiceOver/observația iOS, TalkBack
manual și observația cu copilul.
