# Roadmap canonic — „Minte în joacă”

Status: activ

Actualizat: 26 iulie 2026
Țintă: PWA premium, offline-first, pentru aproximativ 30–72 luni

Acest document este sursa canonică pentru direcția produsului, ordinea
livrărilor și porțile de acceptare. Arhitectura detaliată este în
`docs/05-architecture.md`; regulile obligatorii sunt în `AGENTS.md`.

## Status de execuție

- R0 engineering: complet; repository privat, TypeScript 7, PWA versionat,
  replay, age gating, migrare și E2E sunt verificate.
- R0 release: live la `https://logic-lab.astancu.eu/`; build verificat din `main`
  este servit static prin Cloudflare Tunnel + Caddy, cu CSP strict.
- R1: automat complet; React deține Splash, Home, tranzițiile de sesiune,
  shell-ul și Parent Mode, profilul este în IndexedDB, iar catalogul + ordinea P0
  generează manifestul compact și
  registry-ul TypeScript lazy. Cele 36 de ilustrații procedurale originale au
  manifest canonic, ID-uri tipizate și mapare completă renderer–asset.
  Parent Mode și orchestratorul sesiunii sunt lazy, iar shell-ul inițial este
  69,98 KiB gzip, sub bugetul de 100 KiB; toate cele 15 chunk-uri de joc sunt
  precached, iar scenele Pixi au lifecycle și overlay semantic.
  Exit-ul de performanță și traversarea semantică asistată TalkBack sunt închise
  pe OnePlus 6T real; porțile umane rămân.
- R2: primul pass funcțional există pentru golden slice, iar `drag-and-fit`
  rulează pe același arhetip `spatial-fit`, inclusiv stage-ul de 10 piese în
  batch-uri fără canvas rezidual. `shadow-match` reutilizează rendererul
  `choice`, iar `emotion-match` consumă același renderer cu opt emoții în două
  perspective vizuale. Familia `sort` folosește batch-uri responsive până la
  12 obiecte/4 coșuri pentru culoare, formă și mărime. `listen-find` consumă
  toate cele 16 stage-uri pe rendererul `choice`, cu indiciu audio și replay
  semantic fără expunerea răspunsului. `one-to-one-count` consumă toate cele
  19 stage-uri, până la 20 de prieteni, într-un singur context WebGL paginat.
  `daily-order` consumă toate cele 14 stage-uri, până la șase pași și trei
  distractori, inclusiv distanța cauzală și suportul verbal. `real-color-hunt`
  consumă toate cele 13 stage-uri, până la șase misiuni, două reguli și 40 s
  de memorie, fără punctarea copilului. `peek-and-find` consumă toate cele 22
  stage-uri, cu nouă locații, întârziere și transformări, ascunzând răspunsul
  vizual și semantic înainte de alegere. `wait-for-go`
  consumă toate cele 19 stage-uri, inclusiv semnale întârziate și schimbarea
  regulii. `trace-road` folosește generator determinist în core și tracking
  nativ de pointer pe canvas pentru toate cele 17 stage-uri. Toate cele 15
  familii P0 sunt acum Pixi. 321 clipuri RO locale, Axe și 42 baseline-uri
  vizuale cu seed și ceas fixe sunt integrate. Feedback-ul implicit descrie
  strategia/efortul, nu identitatea copilului. Lipsesc revizia umană a vocii,
  validarea observată și verificarea manuală pe iOS.
- R3 engineering: complet; 15/15 familii P0 consumă ladder-ele, scheduler-ul și
  unlock policy, iar finalul de sesiune blochează persistent continuarea în
  Child Mode. Numai Parent Mode poate permite o sesiune nouă. Pilotul privat
  rămâne condiționat de porțile externe de mai sus.
- R3 accessibility automation: complet; profilul local v4 migrează fără
  pierderi v1/v2/v3 și expune în Parent Mode contrast ridicat, ținte tactile de
  112 px și demonstrații 1,5× mai lente. Setările au efect în shell, overlay-ul
  Pixi și timpii explicativi, fără schimbarea dificultății. Parent gate este
  dialog modal real, captează/restaurează focusul și acceptă apăsare lungă de la
  pointer sau tastatură; scenele drag expun obiectele înaintea destinațiilor.
- R3 visual polish: Home a fost migrat din DOM imperativ în React și redesenat
  responsive pentru un joc, toate cele 15 jocuri și landscape. Acțiunea
  principală, Lumi și biblioteca formează acum o compoziție unitară, cu motion
  controlat integral de Reduced Motion. Instrucțiunea dispare înainte de
  control, astfel încât niciun reflow al shell-ului nu mai poate deplasa
  canvasul în timpul unui drag. Splash, co-play și finalul calm sunt acum React,
  folosesc aceeași ierarhie vizuală responsive și trec Axe + baseline-uri
  Chromium/WebKit; Splash este verificat separat și în landscape 844×390.
  Parent Mode are acum Rezumat/Setări/Date, progres bazat numai pe dovezi,
  layout telefon/tabletă și acces direct la reactivarea sesiunii. Shell-ul comun
  al jocurilor este React, cu timere și cleanup legate de lifecycle, replay
  semantic pe Lumi și controale statice ale căror animații nu afectează
  hit-testing-ul. Cinci cicluri mount/unmount consecutive pe Chromium și WebKit
  readuc la zero canvasurile, overlay-urile, clonele de drag, vocea, tonurile și
  referințele cache-ului SVG; dimensiunea cache-ului rămâne stabilă.
- R3 Android performance: închis pe OnePlus 6T, Android 11, Chrome 150,
  ecran fizic 1080×2340/60 Hz și viewport 384×699 la DPR 2,8125. Trei ferestre
  consecutive de aproximativ 10,1 s au susținut 59,55–59,84 FPS, frame p95
  16,8 ms, input-to-frame 5,8–7,3 ms și zero long tasks peste 100 ms. Tranziția
  completă eroare–indiciu–simplificare–nivel nou a susținut 59,62 FPS, input
  10,6 ms și zero long tasks. Shell-ul React și contextul WebGL sunt reutilizate
  între niveluri; cinci cicluri complete readuc toate resursele active la zero,
  cu cache SVG stabil la 9/64. Suspendarea Android oprește
  `requestAnimationFrame` la `visibilitychange=hidden`, iar revenirea păstrează
  exact o scenă.

## 1. Obiectiv

Construim o aplicație educațională calmă, foarte interactivă și performantă,
care exersează abilități concrete fără promisiuni despre IQ sau diagnostic.

Experiența copilului trebuie să pară o lume coerentă, nu un catalog de carduri:

- obiectele răspund imediat la atingere;
- drag-ul rămâne sub deget și are ținte magnetice;
- personajele reacționează contextual, nu prin animații decorative repetitive;
- sunetul, mișcarea și feedback-ul explică acțiunea fără citit;
- sesiunile se termină calm și mută periodic atenția în lumea reală.

Rămân obligatorii toate limitele de privacy, siguranță și non-dependență din
`AGENTS.md`.

## 2. Adevărul curent

### De păstrat

- `@little-logic-lab/core`: logică TypeScript pură și deterministă;
- 80 familii de jocuri, 19 arhetipuri și 10 domenii;
- 1.030 ancore parametrice de dificultate cu schimbare pe o singură axă;
- generatoare, runtime-uri, mastery, suport și planificatorul sesiunii;
- schemele JSON, politica offline/privacy și cele 23 teste core;
- toate cele 15 familii P0 au implementare funcțională;

### Înlocuit în R1/R2

- `localStorage` cu IndexedDB și migrări;
- vocea sintetică din browser cu audio românesc local, versionat;
- service worker-ul cu cache versionat din manifestul build-ului;
- testele temporare/brute-force cu teste Playwright versionate și aserțiuni;
- registrul manual duplicat cu un loader TypeScript generat, lazy și cache-uit;
- metadatele `sample-items`/`placeholder/*` cu manifestul canonic `p0-items`,
  generare TypeScript și biblioteca procedurală originală în stil unitar.

### Probleme care blochează extinderea

- cele 321 clipuri RO locale trebuie revizuite auditiv de un vorbitor nativ;
- VoiceOver, gesturile TalkBack cu explorare tactilă și observația copil–adult
  nu sunt încă închise. Traversarea și activarea semantică TalkBack asistată
  sunt verificate pe Android real.

## 3. Stack țintă

Versiunile exacte sunt fixate în ADR 005 și actualizate numai printr-o
schimbare verificată.

| Zonă | Alegere |
|---|---|
| Limbaj | TypeScript 7 native, strict |
| Shell și parent mode | React 19.2 |
| Scene interactive | PixiJS 8, WebGL |
| Build | Vite 8 |
| Logică pedagogică | `@little-logic-lab/core`, fără dependențe UI |
| Persistență | IndexedDB, repositories și migrări versionate |
| Audio | clipuri RO locale, versionate + Web Audio |
| PWA | precache generat cu revizii per asset |
| Testare | Node/Vitest, property tests, Playwright, Axe |
| Hosting | Cloudflare Tunnel + Caddy static; Pages rămâne opțional |

PixiJS este renderer, nu sursă de adevăr. Reducerul pur decide corectitudinea;
coordonatele, animația și callback-urile vizuale nu decid mastery.

Nu există backend, cont, cloud sync, analytics, reclame sau remote content.

## 4. Arhitectura țintă

```text
apps/web
  React shell · child flow · parent gate · settings
        │
packages/game-runtime
  lifecycle · input · hints · accessibility bridge · replay
        │
packages/game-renderers
  Pixi scenes · motion · particles · asset/audio registry
        │
packages/core
  generators · reducers · evaluation · mastery · scheduler
        │
packages/content
  catalog · ladders · typed manifests · bundled assets/audio
        │
packages/storage
  IndexedDB · migrations · export/delete · recovery
```

Dependențele merg numai în jos. Starea de animație nu intră în core sau în
persistența pedagogică.

## 5. Roadmap de livrare

### R0 — Stabilizare și checkpoint

Țintă: 1–2 zile.

- salvează munca OpenCode într-un checkpoint Git clar;
- configurează repository privat și `origin`;
- adoptă TypeScript 7 și un singur workspace/lockfile;
- elimină documentele și task-urile Expo/OpenCode depășite;
- aduce testele utile în repo și rescrie aserțiunile de produs;
- repară update-ul PWA, seed/replay, setările conservative și age gating;
- publică un preview reproductibil la `logic-lab.astancu.eu`.

Exit:

- `npm test`, `npm run typecheck`, `npm run build:web` trec;
- instalarea PWA primește build nou fără ștergere manuală de cache;
- fiecare attempt salvează seed, game ID, ladder stage și rezultat;
- Git și deployment-ul corespund aceluiași commit.

### R1 — Platforma premium

Țintă: 3–5 zile.

- React shell pentru navigație, parent mode și semantică;
- runtime Pixi cu lifecycle explicit;
- input comun: tap, press, drag, snap, trace, reorder;
- hit slop, ținte magnetice, anulare și revenire elastică;
- content loader tipizat din catalog/ladders;
- IndexedDB cu migrare, recovery, export și delete;
- asset/audio manifests și încărcare predictibilă;
- accessibility overlay și reduced-motion contract.

Exit:

- o scenă demonstrativă rulează pe telefon/tabletă fără leak-uri;
- input-to-visual sub 50 ms;
- rendererul poate fi distrus și recreat fără stare reziduală;
- rețeaua poate fi blocată complet după instalare.

### R2 — Golden slice

Țintă: 5–7 zile.

Se reconstruiesc la standard final:

1. `same-picture`;
2. `sort-by-color`;
3. `inset-puzzle`.

Standard vizual/interactiv:

- Lumi are stări și reacții contextuale;
- fiecare obiect are idle, touch, drag, correct, incorrect și exit;
- squash/stretch, anticipație, follow-through și particule controlate;
- drag-ul urmărește degetul la frame rate, fără clonă DOM;
- sunete locale distincte și voce românească înregistrată;
- scenă coerentă, fără text necesar copilului;
- feedback calm, specific și fără recompense variabile.

Exit:

- 60 FPS susținut pe dispozitivul Android țintă;
- toate ladder stages relevante pentru 30–36 luni sunt consumate;
- replay determinist din seed;
- Chromium și WebKit touch E2E;
- test observat cu copilul, cu problemele majore rezolvate.

Migrarea arhetipurilor poate continua după exit-ul automat și aprobarea
explicită a ownerului. Poarta Android este închisă; pilotul privat rămâne
blocat până la observația și reviziile umane.

### R3 — Starter release P0

Țintă: încă 2–3 săptămâni.

- implementează toate cele 15 familii P0;
- construiește arhetipurile comune înaintea skin-urilor;
- consolidează `spatial-fit` pentru `inset-puzzle` și `drag-and-fit`;
- conectează progresia reală, deblocarea graduală și scheduler-ul;
- finalizează audio RO, parent dashboard și transfer prompts;
- testează ecrane mici/mari, audio off, Reduce Motion și offline.
- după încheiere, ascunde toate intrările de joc până când un adult permite o
  sesiune nouă din Parent Mode.
- persistă în profil v4 contrastul ridicat, țintele extra-mari și viteza
  demonstrațiilor; păstrează migrarea fără pierderi din v1/v2/v3.

Exit:

- 15/15 P0 trec contractul comun;
- jocurile hibride/deschise nu influențează mastery;
- părintele vede progres calitativ, nu clasamente sau scor competitiv;
- private family pilot gata.

### R4 — Extindere 3–4 ani

Țintă: P0 + cele 26 familii P1.

- pattern AB/ABB/ABC;
- memory sequence;
- quantity-symbol;
- semantic classification;
- story order și gentle maze extins;
- limbaj și social helping.

Extinderea se face prin arhetipuri și conținut, nu prin duplicarea shell-ului.

### R5 — Extindere 4–6 ani

- 27 familii P2;
- 12 familii P3;
- rule switching, symmetry, tangram, mental rotation;
- rime, inferență, operații concrete și trasee algoritmice;
- activități open-ended și hibride mai bogate.

Estimare realistă până la toate cele 80 de familii la calitate ridicată:
10–16 săptămâni, incluzând artă, audio, device QA și iterații de utilizare.

## 6. Bugete de performanță

- 60 FPS; frame time p95 în maximum un interval de refresh: 16,7 ms nominal,
  maximum 16,8 ms raportat de ceasul browserului pe panoul țintă de 60 Hz;
- răspuns vizual la input sub 50 ms;
- drag-ul nu pierde pointerul și rămâne sub deget;
- shell inițial sub 100 KB gzip; runtime-urile/jocurile sunt lazy-loaded;
- asset packs sunt împărțite pe teme și preîncărcate numai pentru sesiune;
- zero long task peste 100 ms în gameplay normal;
- zero creștere persistentă de listeners, textures sau audio nodes după scene;
- start offline cald sub o secundă pe tableta țintă.

`?diagnostics=1` expune local `window.__logicLabPerformance.snapshot()` pentru
frame p95, input-to-frame, long tasks și resursele runtime active. Playwright
impune input sub 50 ms și zero resurse reziduale după cicluri repetate;
pragul de 60 FPS se evaluează pe dispozitivul Android real, nu în
headless/SwiftShader.

Pixi folosește WebGL în producție. WebGPU poate fi evaluat ulterior, nu este
poartă pentru v1.

## 7. Contract de interactivitate

Fiecare obiect acționabil trebuie să aibă:

- hit area de minimum 96 px și toleranță suplimentară;
- reacție imediată la pointer down;
- stare clară selected/dragging/hover/placed;
- snap magnetic și revenire fără penalizare;
- feedback audio-off echivalent;
- reduced-motion equivalent;
- semantică accesibilă în overlay;
- cleanup complet la ieșirea din scenă.

Animațiile ambientale nu concurează cu obiectivul și se opresc în Reduce
Motion. Nu folosim loop-uri rapide, confetti excesiv sau stimuli fără rol.

## 8. Conținut și progresie

`content/game-catalog.json` și `content/level-ladders.json` devin input de
build, nu documentație inertă.

Pipeline:

1. validare JSON/schema;
2. generare manifest TypeScript tipizat;
3. verificare asset/audio IDs;
4. property test de solvabilitate;
5. verificare tranziție pe o singură axă;
6. preview determinist din seed;
7. review vizual și audio;
8. bundle local.

Vârsta selectează doar intrarea conservatoare. Avansarea vine din dovezi;
aplicația nu deblochează automat tot catalogul.

## 9. Persistență și replay

Fiecare eveniment local include:

- `sessionId`;
- `gameId`;
- `levelSeed`;
- `ladderStageId`;
- content/app version;
- acțiune și rezultat structurat;
- fără free text, media sau identificatori externi.

Un nivel trebuie reprodus exact din seed + stage + content version. Exportul și
ștergerea sunt locale și protejate de parent gate.

## 10. Testare și porți

Pentru fiecare candidat:

```bash
npm test
npm run typecheck
npm run build:web
```

În plus:

- property tests pentru generator/runtime;
- teste de lifecycle și storage migrations;
- Playwright pe Chromium și WebKit, touch + desktop;
- offline cu toate request-urile de rețea blocate;
- update PWA de la versiunea precedentă;
- Axe plus verificare manuală VoiceOver/TalkBack;
- visual regression pentru golden slice;
- măsurare frame time/input latency pe dispozitiv real.

E2E verifică comportament observabil și rezultate, nu doar lipsa excepțiilor.

## 11. Livrare Cloudflare

Livrarea canonică actuală este Cloudflare Tunnel → Caddy static:

- build din commitul verificat;
- output `apps/web/dist`;
- custom domain `logic-lab.astancu.eu`;
- assets hash-uite și cache immutable;
- HTML/service worker cu strategie de update sigură;
- CSP fără endpoint-uri externe;
- artefact sincronizat în `/opt/websites/logic-lab/dist`.

Nu folosim Vite preview ca serviciu de producție și nu rulăm produsul pe
`dell-standby`.

Cloudflare Pages rămâne o opțiune administrată, nu o dependență și nu o poartă
de produs.

## 12. Ordinea imediată de lucru

1. revizuiește auditiv cele 321 clipuri RO și înlocuiește pronunțiile slabe;
2. verifică manual VoiceOver și gesturile TalkBack cu explorare tactilă;
3. rulează observația cu copilul și rezolvă blocajele majore;
4. începe R4 numai după închiderea problemelor P0 observate.

## Definition of done

O funcție nu este gata doar pentru că arată bine sau compilează. Este gata
când logica, seed-ul, ladder-ul, persistența, animația, audio, accesibilitatea,
offline-ul, testele și comportamentul observat sunt aliniate.
