# Roadmap canonic — „Minte în joacă”

Status: activ

Actualizat: 25 iulie 2026
Țintă: PWA premium, offline-first, pentru aproximativ 30–72 luni

Acest document este sursa canonică pentru direcția produsului, ordinea
livrărilor și porțile de acceptare. Arhitectura detaliată este în
`docs/05-architecture.md`; regulile obligatorii sunt în `AGENTS.md`.

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
- schemele JSON, politica offline/privacy și cele 22 teste core;
- prototipul web ca referință funcțională pentru 14 jocuri.

### De înlocuit controlat

- registrul manual de jocuri cu un loader tipizat din catalog și ladders;
- DOM-ul imperativ al scenelor cu runtime React + PixiJS;
- `localStorage` cu IndexedDB și migrări;
- Web Speech cu înregistrări românești locale;
- service worker-ul cu cache versionat din manifestul build-ului;
- testele temporare/brute-force cu teste Playwright versionate și aserțiuni;
- ilustrațiile SVG generice cu un sistem artistic coerent și asset manifests.

### Probleme care blochează extinderea

- munca web nu are încă checkpoint Git/remote;
- `logic-lab.astancu.eu` răspunde 404;
- cele 1.030 ancore nu sunt conectate la aplicația web;
- 14 din 15 familii P0 au prototip; lipsește `drag-and-fit`;
- seed-ul nivelului nu este persistat pentru replay;
- eligibilitatea pe vârstă și deblocarea graduală nu sunt aplicate;
- testele E2E OpenCode au rămas în `/tmp`, în afara repo-ului;
- cache key-ul PWA este static și poate ține utilizatorii pe build-uri vechi.

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
| Audio | înregistrări RO bundled + Web Audio |
| PWA | precache generat cu revizii per asset |
| Testare | Node/Vitest, property tests, Playwright, Axe |
| Hosting | Cloudflare Pages static + custom domain |

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

Nu se migrează alte jocuri înainte de acest exit.

### R3 — Starter release P0

Țintă: încă 2–3 săptămâni.

- implementează toate cele 15 familii P0;
- construiește arhetipurile comune înaintea skin-urilor;
- adaugă `drag-and-fit`, lipsă din prototip;
- conectează progresia reală, deblocarea graduală și scheduler-ul;
- finalizează audio RO, parent dashboard și transfer prompts;
- testează ecrane mici/mari, audio off, Reduce Motion și offline.

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

- 60 FPS; frame time p95 sub 16,7 ms pe dispozitivul țintă;
- răspuns vizual la input sub 50 ms;
- drag-ul nu pierde pointerul și rămâne sub deget;
- shell inițial sub 100 KB gzip; runtime-urile/jocurile sunt lazy-loaded;
- asset packs sunt împărțite pe teme și preîncărcate numai pentru sesiune;
- zero long task peste 100 ms în gameplay normal;
- zero creștere persistentă de listeners, textures sau audio nodes după scene;
- start offline cald sub o secundă pe tableta țintă.

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

Producția este statică în Cloudflare Pages:

- build din commitul verificat;
- output `apps/web/dist`;
- custom domain `logic-lab.astancu.eu`;
- assets hash-uite și cache immutable;
- HTML/service worker cu strategie de update sigură;
- CSP fără endpoint-uri externe;
- preview deployments separate de producție.

Nu folosim Vite preview ca serviciu de producție și nu rulăm produsul pe
`dell-standby`.

## 12. Ordinea imediată de lucru

1. finalizează R0;
2. creează ADR 005 și toolchain TS7;
3. introduce testele committed și repară contractele de date/PWA;
4. construiește runtime-ul Pixi;
5. livrează `same-picture`;
6. livrează `sort-by-color`;
7. livrează `inset-puzzle`;
8. oprește și evaluează golden slice înainte de extindere.

## Definition of done

O funcție nu este gata doar pentru că arată bine sau compilează. Este gata
când logica, seed-ul, ladder-ul, persistența, animația, audio, accesibilitatea,
offline-ul, testele și comportamentul observat sunt aliniate.
