# Task 01 — Golden slice

Status: activ

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

- 60 FPS, frame p95 sub 16,7 ms;
- input feedback sub 50 ms;
- fără citit necesar copilului;
- toate ancorele 30–36 luni relevante sunt consumate;
- offline și update PWA trec;
- observația cu copilul nu identifică blocaje majore.

Nu se migrează alte jocuri înainte de acest exit.

## Implementat

- shell React și scene Pixi lazy-loaded;
- lifecycle cu cleanup verificat prin distrugere/recreare;
- tap plus runtime comun drag/snap magnetic;
- overlay semantic pentru toate obiectele acționabile;
- IndexedDB cu migrare v1/v2 și fallback;
- manifest P0 compact generat din catalog/ladders;
- Parent Mode React și progresie limitată strict la stage-urile eligibile;
- 66 clipuri RO locale, fără Web Speech sau request-uri audio externe;
- Axe automat și șase baseline-uri vizuale Chromium/WebKit;
- telemetrie locală pentru frame p95, input latency și long tasks;
- primul pass pentru toate cele trei jocuri și E2E Chromium/WebKit.

Rămân deschise revizia auditivă umană, device performance, VoiceOver/TalkBack
și observația cu copilul.
