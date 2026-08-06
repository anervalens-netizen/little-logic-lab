# Roadmap canonic V2 — „Minte în joacă”

Status: activ — **NO-GO pentru merge, server, pilot sau release**  
Actualizat: 29 iulie 2026  
Branch: `agent/v2-runtime-reboot`  
Bază `main`: `3b8f0c92ec49f1098c262d6ed8abba5970ab1651`  
Audit autoritativ: `docs/17-final-audit-2026-07-29.md`

Acest document este sursa canonică pentru ordinea de dezvoltare, validare și
livrare. Documentele anterioare rămân istoric și explicație, dar în caz de conflict
se urmează această ordine:

1. `AGENTS.md` și regulile de siguranță/privacy;
2. `docs/17-final-audit-2026-07-29.md`;
3. acest roadmap;
4. `tasks/20-v2-server-handoff.md`;
5. ADR-urile și documentele istorice.

---

# 1. Obiectiv și strategie

Construim o aplicație PWA premium, calmă și complet locală pentru copii de
aproximativ 30–72 luni. Produsul trebuie să exerseze abilități concrete, nu să
pretindă creșterea IQ-ului și nu să ofere diagnostic.

Strategia aprobată:

- dezvoltarea și auditurile continuă pe branch;
- serverul este folosit numai după închiderea porților P0;
- GitHub Actions nu rulează la fiecare commit; există o singură validare manuală
  finală;
- nu extindem catalogul până când golden-slice-ul este validat;
- nu introducem backend cloud, cont, analytics, TTS online sau remote content;
- păstrăm React/Pixi/core/IndexedDB și îmbunătățim incremental;
- trei jocuri excelente au prioritate față de multe jocuri doar funcționale.

Golden slice:

1. `same-picture`;
2. `sort-by-color`;
3. `inset-puzzle`.

---

# 2. Starea curentă confirmată static

## 2.1 Produs și Child Mode

Implementat:

- Home cu o singură acțiune principală: `CONTINUĂ AVENTURA`;
- trei opriri vizibile din prima pornire;
- jocul promis de Home este primul joc al sesiunii;
- progresul traseului este derivat din istoricul complet;
- golden-slice-ul nu poate bloca întreg produsul prin cerințe de perfecțiune;
- biblioteca manuală este exclusiv în Parent Mode;
- preview-ul adultului este separat de progresul copilului.

## 2.2 Frontend/runtime

Implementat:

- React pentru shell și ecrane;
- PixiJS/WebGL pentru scene;
- overlay semantic DOM;
- input `inert`/`aria-busy` în timpul narațiunii;
- excepție controlată numai pentru go/no-go;
- cleanup izolat pe ecran și pe fiecare joc;
- fallback React pentru bootstrap și import dinamic;
- lifecycle pentru hidden/pagehide/freeze;
- Reduced Motion, contrast și ținte extra-mari.

## 2.3 Audio

Implementat:

- Web Audio `AudioBuffer`;
- o singură replică activă;
- voice/SFX buses separate;
- ducking;
- cache LRU maximum 48;
- maximum trei preload-uri concurente;
- timeout fetch/decode/playback;
- watchdog de final;
- vocile procedurale ale obiectelor eliminate;
- cue IDs stabile pentru golden slice;
- playback și offline gate folosesc asset-urile release-ului curent;
- repair same-origin versionat.

## 2.4 Offline/PWA

Implementat:

- service worker controller înainte de Child Mode;
- release identity commit ↔ HTML;
- scanarea tuturor cache-urilor pentru manifestul curent;
- asset-uri acceptate numai din cache-ul release-ului curent sau repair cache-ul
  curent;
- pachete logice `core-shell`, `golden-journey`, `extended-p0`;
- verificarea statusului, content type și dimensiunii;
- Splash fail-closed;
- repair al clipurilor obligatorii;
- update automat numai la Splash și aplicare la limita sesiunii;
- build gate pentru toate chunk-urile și toate clipurile startup.

## 2.5 Persistență/backend local

Implementat:

- IndexedDB cu migrări v1/v2/v3 → v4;
- sanitizare profundă;
- fallback localStorage;
- snapshot sincron de urgență;
- token de generație pentru snapshot;
- timeout open/write/bootstrap;
- închiderea conexiunii IndexedDB întârziate;
- storage health în Parent Mode;
- recovery vizibil;
- export și delete local;
- Preview Mode fără attempt/mastery/difficulty/session lock.

## 2.6 Scheduler și progres

Implementat:

- mastery explicabil;
- recență;
- suport recent;
- abandon;
- latență prudentă;
- diversitate de domeniu;
- seed unic pe sesiune;
- unlock tolerant la succes cu sprijin;
- latența nu penalizează singură mastery-ul.

## 2.7 Teste și garduri

Există:

- `check:v2-runtime`;
- `check-stability-hardening`;
- `validate:audio-packs`;
- `audit:speech`;
- teste core/property;
- Playwright Chromium/WebKit;
- migration tests;
- profile recovery;
- cache repair;
- preview isolation;
- child session lock;
- pair lifecycle;
- continuous trace;
- full-catalog smoke;
- Axe;
- benchmark sintetic;
- build identity și precache gate.

## 2.8 Ce NU este încă demonstrat

Nu se declară ca trecute:

- `npm ci`;
- typecheck;
- build;
- testele Node;
- Playwright;
- snapshot-urile;
- full-catalog smoke;
- trace-touch;
- benchmark;
- update real;
- airplane mode real;
- memoria Android;
- accesibilitatea manuală;
- observația copilului.

---

# 3. Reguli de trecere între etape

Nicio etapă ulterioară nu poate compensa un eșec P0 anterior.

Reguli:

- nu se face merge pentru a „testa mai ușor”;
- nu se slăbesc testele;
- nu se regenerează snapshot-uri fără inspecție;
- nu se modifică lockfile-ul fără motiv documentat;
- nu se activează workflow-ul GitHub înainte de validarea locală;
- nu se publică buildul pe serverul final înainte de R8;
- nu se generează tot pachetul Higgs înainte de copy freeze;
- nu se extind cele 80 de familii înainte de R7;
- orice compromis nou de arhitectură primește ADR.

---

# R0 — Înghețarea checkpoint-ului și reproducibilitate

Prioritate: **P0**  
Loc de execuție: workstation/server de validare, nu producție

## Scop

Obținerea unui checkout curat, reproductibil și identificabil înaintea oricărei
remedieri executabile.

## Pași

```bash
git fetch origin --prune
git checkout agent/v2-runtime-reboot
git status --short
git rev-parse HEAD
git rev-parse origin/main
git merge-base origin/main HEAD
git diff --stat origin/main...HEAD
node --version
npm --version
```

Condiții:

- Node 22;
- niciun fișier modificat sau neversionat;
- branch-ul nu este resetat la baza veche;
- `main` este integrat controlat numai dacă a avansat;
- SHA-ul și tree-ul sunt notate în raportul de validare.

## Dovezi obligatorii

- output-ul comenzilor;
- SHA branch;
- SHA `origin/main`;
- merge-base;
- diff stat;
- versiuni Node/npm;
- confirmare worktree curat.

## Exit

- checkout curat;
- lockfile nemodificat;
- diferența față de `main` înțeleasă;
- nu există conflict nerezolvat.

---

# R1 — Baseline executabil: static, core, typecheck și build

Prioritate: **P0**

## Scop

Transformarea branch-ului din „confirmat static” în „compilează și produce un
artefact valid”.

## Comenzi

```bash
npm ci --no-audit --no-fund
npm run check:v2-runtime
npm run validate:audio-packs
npm run audit:speech
npm test
npm run typecheck
npm run build:web
```

## Ce trebuie verificat explicit

### Static guards

- zero `new Audio()`;
- zero voce procedurală de obiect;
- current-release cache;
- repair cache versionat;
- Preview Mode;
- cleanup izolat;
- snapshot generation-safe;
- timeout IndexedDB/audio/bootstrap;
- toate cue-urile stabile cunoscute.

### Core

- generatoare deterministe;
- solvabilitate;
- mastery;
- scheduler;
- dificultate pe o singură axă;
- teste de latență;
- teste de unlock.

### Typecheck

- zero erori TypeScript;
- fără `any` nou în codul produsului;
- contractele `previewMode` și `persistProgress` coerente;
- importurile dintre audio/app fără ciclu runtime defect.

### Build

- release identity egal cu HEAD;
- tree egal cu HEAD tree;
- lockfile hash corect;
- shell inițial sub 100 KiB gzip;
- 15 chunk-uri P0 precached;
- toate clipurile startup precached;
- fără asset lipsă;
- fără warning critic ignorat.

## Regula de remediere

Dacă o comandă eșuează:

1. păstrează logul complet;
2. repară cauza, nu simptomul;
3. nu șterge testul;
4. nu crește bugetul fără analiză;
5. rulează din nou toate comenzile R1;
6. documentează remedierea în auditul final.

## Exit

- toate comenzile verzi;
- worktree curat după generare;
- build reproducibil;
- output-ul verifică required audio;
- raport R1 salvat.

---

# R2 — Browser baseline Chromium și WebKit

Prioritate: **P0**

## Scop

Validarea fluxurilor principale pe două motoare mobile înainte de testele scumpe.

## Comenzi

```bash
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
```

## Contracte obligatorii

- Splash → Home;
- offline ready;
- un singur CTA copil;
- Parent gate;
- setări persistente;
- Parent preview fără mutații;
- child attempt cu replay metadata;
- child session lock;
- profile recovery;
- storage migrations;
- cache repair;
- pair cancellation;
- Axe;
- audio local;
- scene cleanup.

## Snapshot-uri

Pentru fiecare diferență:

1. deschide imaginea veche și nouă;
2. verifică telefon și tabletă;
3. verifică text tăiat, overflow, poziția CTA și Lumi;
4. verifică contrast și Reduced Motion;
5. aprobă explicit sau repară;
6. abia apoi actualizează baseline-ul.

Este interzisă regenerarea globală oarbă.

## Repetare critică

După remediere:

```bash
for i in 1 2 3; do
  npm run check:v2-runtime || exit 1
  npm run typecheck || exit 1
  npm run build:web || exit 1
  npm run test:web -- --project chromium-touch || exit 1
done
```

## Exit

- Chromium verde;
- WebKit verde;
- snapshot-uri aprobate;
- zero flake în trei runde Chromium;
- zero pageerror neexplicat.

---

# R3 — Matricea completă a jocurilor și stage-urilor

Prioritate: **P0**

## Scop

Dovedirea faptului că refactorizarea nu a stabilizat doar golden-slice-ul și a
stricat jocurile mai vechi.

## 3.1 Full-catalog smoke

```bash
npm run test:web:all-games
```

Trebuie să dovedească pentru toate cele 15 jocuri:

- catalogul adultului le poate porni când sunt eligibile/deblocate;
- `data-game-ready=true` apare;
- există exact un canvas;
- modul este `preview`;
- Home eliberează canvas, overlay și shell;
- zero pageerror.

## 3.2 Continuous trace

```bash
npm run test:web:trace-touch
```

Criterii:

- pointer continuu real;
- progres intermediar;
- finalizare traseu;
- revenire curată;
- zero canvas rezidual.

## 3.3 High-stage UI contracts

Se adaugă teste dedicate, preferabil câte unul per arhetip, nu câte unul per skin:

### Choice

- 8 opțiuni;
- touch target ≥96 px;
- target cue ascuns/temporizat;
- similaritate maximă;
- replay audio limitat.

Jocuri reprezentative:

- `same-picture`;
- `shadow-match`;
- `listen-find`;
- `emotion-match`.

### Sort

- 12 obiecte;
- 4 destinații;
- batch-uri responsive;
- schimbare de regulă;
- toate obiectele plasabile;
- un singur canvas.

Jocuri:

- `sort-by-color`;
- `sort-by-shape`;
- `sort-by-size`.

### Spatial fit

- 10 piese în batch-uri;
- rotație;
- outline none;
- forme similare;
- auto-complete;
- cleanup.

Jocuri:

- `inset-puzzle`;
- `drag-and-fit`.

### Sequence

- 6 pași;
- 3 distractori;
- suport verbal minim;
- ordonare completabilă.

### Count

- 20 destinatari;
- paginare;
- 8 opțiuni;
- fiecare primește exact unul.

### Peek/memory

- 9 locații;
- transformare;
- răspuns semantic ascuns;
- delay maxim testat prin ceas controlat.

### Go/no-go

- 16 semnale;
- schimbare de regulă;
- prompt no-go neblocant;
- fără recompensarea vitezei.

### Hybrid

- 6 misiuni;
- două reguli;
- delay de memorie controlat;
- fără attempt/mastery.

## 3.4 Completion contracts

Smoke-ul `ready` nu este suficient. Pentru fiecare arhetip trebuie cel puțin un
test care completează stage-ul maxim și verifică rezultatul.

## Exit

- toate cele 15 jocuri pornesc și se curăță;
- fiecare arhetip are high-stage layout test;
- fiecare arhetip are minimum un completion test;
- zero resurse reziduale;
- scripturile dedicate găsesc testele corecte.

---

# R4 — Persistență, crash, migrare și Preview Mode

Prioritate: **P0**

## Scop

Dovedirea că datele copilului nu se pierd și că instrumentele adultului nu le
contaminează.

## Scenarii automate

1. v1 localStorage → v4;
2. v2 IndexedDB → v4;
3. v3 session lock → v4;
4. profil parțial corupt;
5. attempt sănătos + secțiune coruptă;
6. snapshot emergency înainte de confirmare;
7. două snapshot-uri concurente, confirmare veche;
8. IndexedDB open blocat;
9. write timeout;
10. fallback localStorage;
11. localStorage full/indisponibil;
12. Preview Mode completat;
13. Preview Mode abandonat;
14. Preview Mode când child session este locked;
15. export după flush;
16. delete cu cleanup complet.

## Criterii Preview Mode

Profilul înainte și după trebuie să păstreze identic:

- `attempts`;
- `sessions`;
- `sessionLocked`;
- `masteryBySkill`;
- `progressByGame`;
- difficulty;
- timesPlayed.

Sunt permise numai efecte tranzitorii UI/audio.

## Test fizic kill/restart

1. finalizează un răspuns;
2. închide imediat aplicația;
3. redeschide;
4. verifică attempt-ul;
5. repetă la final de sesiune;
6. repetă în fallback mode.

## Datorie de arhitectură

După ce toate testele sunt verzi:

- elimină API-ul istoric de scriere din `storage.ts`;
- păstrează un singur repository de write;
- `storage.ts` rămâne schema/load/migration/export;
- `durableProfile.ts` sau un repository redenumit deține toate scrierile;
- adaugă guard care interzice scrierea directă în afara repository-ului.

## Exit

- zero pierdere în scenariile automate;
- kill/restart real verde;
- Preview Mode zero mutații;
- storage health corect;
- o singură cale de write.

---

# R5 — Offline, update și autoreparare pe dispozitiv

Prioritate: **P0**

## Scop

Dovedirea promisiunii principale: produsul instalat funcționează fără internet și
se actualizează fără blocaj sau pierdere de progres.

## 5.1 Clean install

Măsoară:

- timpul până la service worker ready;
- timpul până la controller;
- timpul până la offline ready;
- numărul de cache-uri;
- dimensiunea Cache Storage;
- dimensiunea core-shell;
- dimensiunea golden-journey;
- dimensiunea extended-p0.

Criterii:

- Splash explică pregătirea;
- Home apare numai după pachet complet;
- zero request extern;
- release commit egal cu HTML.

## 5.2 Restart airplane mode

1. close/force stop;
2. airplane mode;
3. restart;
4. Splash;
5. Home;
6. toate cele trei jocuri golden;
7. voce, hint, praise și final;
8. Parent Mode și export local.

Criteriu: zero rețea necesară.

## 5.3 Repair

1. șterge un clip core;
2. confirmă fail-closed;
3. conectează internetul;
4. repară;
5. verifică content type și bytes;
6. force stop;
7. airplane mode;
8. redă exact clipul reparat.

## 5.4 Update vechi → nou

1. instalează buildul anterior valid;
2. creează progres;
3. publică buildul candidat într-un mediu de test;
4. deschide vechiul build;
5. verifică activarea noului worker la Splash;
6. verifică update amânat în sesiune;
7. verifică progresul;
8. verifică eliminarea cache-urilor vechi;
9. verifică repair cache versioning.

## 5.5 Eviction/quota

- simulează clip lipsă;
- simulează cache parțial;
- inspectează storage estimate;
- verifică mesajul Parent Mode;
- nu permite joc indisponibil.

## Decizie privind pack split

După măsurare:

### Păstrează monolitic dacă

- timpul este acceptabil;
- dimensiunea este acceptabilă;
- memoria nu crește;
- update-ul este rezonabil.

### Separă fizic dacă

- prima pregătire este prea lungă;
- quota este riscantă;
- extended-p0 domină dimensiunea;
- update-ul retransferă prea multe asset-uri.

Split țintă:

- shell + core audio;
- golden pack obligatoriu;
- extended packs instalate numai din Parent Mode;
- jocul apare copilului numai dacă pack-ul este ready.

## Exit

- clean install verde;
- restart offline verde;
- repair + offline verde;
- update verde;
- progres păstrat;
- decizie pack split documentată cu cifre.

---

# R6 — Performanță, memorie și lifecycle fizic

Prioritate: **P0**

## Comandă sintetică

```bash
npm run test:web:performance
```

## Măsurători dispozitiv

- FPS mediu;
- frame p95;
- input-to-frame p95;
- long tasks >100 ms;
- memorie înainte de sesiune;
- memorie după 30 de replici distincte;
- cache audio decodat;
- texturi Pixi;
- listeners;
- canvas;
- accessibility layers;
- audio nodes;
- drag clones.

## Scenarii

1. same-picture cu 8 opțiuni;
2. sort 12/4;
3. puzzle 10 piese;
4. hint → simplify → success;
5. Home în timpul tween-ului;
6. Home în timpul vocii;
7. suspend în instrucțiune;
8. suspend în drag;
9. suspend în feedback;
10. 5 cicluri complete;
11. 30 de clipuri;
12. portrait ↔ landscape.

## Bugete

- input-to-visual <50 ms;
- frame p95 aproximativ 16,7–16,8 ms la 60 Hz;
- zero long task >100 ms în gameplay normal;
- maximum 48 buffer-e;
- maximum o voce activă;
- maximum 3 decode concurente;
- zero resurse active după cleanup;
- memoria revine aproape de baseline după cicluri.

## Exit

- benchmark sintetic verde;
- dispozitiv minim în buget;
- cinci cicluri fără leak;
- suspend/resume fără blocaj;
- raport cu dispozitiv/OS/browser.

---

# R7 — Golden slice premium final

Prioritate: **P1**, dar **poartă de pilot**

## Principii comune

- o singură sarcină vizuală;
- feedback în <50 ms;
- motion semantic;
- voce și animație sincronizate;
- fără text necesar copilului;
- fără branding extern;
- Reduced Motion echivalent;
- accesibilitate semantică;
- feedback calm și specific;
- fără confetti excesiv.

## 7.1 Same Picture

Dezvoltare:

- scene finală de atelier;
- modelul și opțiunile au aceeași scară perceptivă;
- distractori validați la 2/3/4/5/6/8 opțiuni;
- ținta temporară nu produce confuzie;
- perechea se unește vizual;
- hint-ul evidențiază atributul comun;
- simplificarea demonstrează, nu doar luminează;
- feedback audio specific vehiculului;
- anulare în fiecare fază.

Exit:

- toate stage-urile golden relevante completabile;
- zero confuzie model/opțiune în pilot;
- visual baselines aprobate;
- cleanup verde.

## 7.2 Sort by Color

Dezvoltare:

- garaje ca destinații reale;
- preview de drop/magnetism;
- obiect sub deget;
- snap și feedback coordonat;
- culoarea se termină înainte de batch nou;
- batch-ul nu pare ecran nou;
- schimbarea regulii este explicită;
- tap și drag echivalente;
- 12 obiecte/4 garaje fără aglomerare.

Exit:

- drag real pe telefon;
- target-uri lizibile;
- zero drop accidental;
- full stage completion verde.

## 7.3 Inset Puzzle

Dezvoltare:

- pickup/shadow;
- magnetism;
- snap scurt;
- target opacity calibrat;
- rotația după mastery;
- auto-complete demonstrativ;
- forme similare validate;
- clip real pentru hexagon;
- 10 piese în batch-uri coerente.

Exit:

- copilul înțelege targetul fără explicație suplimentară;
- max stage verde;
- audio complet;
- layout telefon mic verde.

## 7.4 Lumi și art direction

Livrabile:

- character bible;
- paletă;
- contur;
- umbre;
- perspectivă;
- scară;
- stări Lumi: idle, ascultă, arată, așteaptă, hint, bucurie calmă, odihnă;
- variante Reduced Motion;
- asset approval list;
- fără asset final în afara golden până la aprobare.

## Exit R7

- cele trei jocuri au calitate vizuală consistentă;
- toate interacțiunile sunt semantic animate;
- art/audio/copy sunt aprobate;
- nu există P0/P1 UX cunoscut în golden slice.

---

# R8 — Audio Higgs și copy freeze

Prioritate: **P1**, poartă de pilot

Higgs este unealtă offline de producție, nu dependență runtime.

## 8.1 Copy freeze

Pentru fiecare cue:

- ID stabil;
- text românesc final;
- scop;
- joc/fază;
- ton;
- viteză;
- variantă scurtă;
- fallback vizual.

Nu genera audio înainte de aprobarea copy-ului.

## 8.2 Pipeline

```text
cue ID + copy aprobat
→ Higgs WAV
→ trim leading/trailing silence
→ loudness normalization
→ clipping detection
→ sample-rate/channel validation
→ MP3/Opus
→ duration/hash manifest
→ audit nativ
→ pack import
```

## 8.3 Ordine

1. core-shell;
2. praise/support;
3. same-picture;
4. sort-by-color;
5. inset-puzzle;
6. hexagon;
7. restul P0 numai după golden approval.

## 8.4 Validări

- pronunție;
- accent românesc;
- naturalețe;
- lipsa entuziasmului artificial;
- volum consistent;
- tăceri;
- clipping;
- lipsa artefactelor;
- durată potrivită copilului;
- zero schimbare de text fără regenerare.

## Comenzi

```bash
npm run validate:audio
npm run validate:audio-packs
npm run audit:speech
npm run audit:speech:strict
```

`audit:speech:strict` poate fi aplicat pe întreaga aplicație numai când suprafața
publicată este complet migrată. Până atunci, golden-slice-ul trebuie să aibă zero
lipsuri.

## Exit

- golden audio complet;
- hexagon cue real;
- manifest cu hash/durată;
- audit nativ aprobat;
- airplane mode verde cu pachetul nou;
- înlocuirea audio nu cere modificarea jocurilor.

---

# R9 — Parent Mode, evidence V2 și scheduler explicabil

Prioritate: **P1**

## 9.1 Parent recommendations

Adaugă secțiuni:

- ce a exersat;
- ce pare stabil;
- unde a avut nevoie de sprijin;
- recomandarea următoare;
- motivul recomandării;
- activitate fără telefon;
- starea pachetelor;
- starea salvării.

Fără:

- procente psihometrice;
- comparații;
- diagnostic;
- etichete despre inteligență.

## 9.2 Evidence schema V2

Câmpuri candidate:

- task success;
- independence;
- latency band;
- self-correction;
- instruction repeats;
- motor assist;
- drag cancelled;
- difficulty stage;
- session role;
- selection reason.

Reguli:

- date locale;
- fără coordonate brute persistente;
- fără audio;
- fără identificator extern;
- limite de retenție;
- migrare versionată.

## 9.3 Scheduler reason

Persistă pentru fiecare intrare:

- warm-up familiar;
- obiectiv principal;
- variație;
- transfer;
- recuperare după abandon;
- revenire după pauză.

## 9.4 Storage simplification

- un singur write repository;
- schema/migration separate de write;
- teste fuzz/property pentru profil;
- health/recovery documentate.

## Exit

- Parent Mode produce o recomandare utilă și prudentă;
- motivul selecției poate fi explicat;
- preview nu contaminează date;
- schema migrează fără pierderi;
- zero scoruri false de precizie.

---

# R10 — Pilot observat copil–adult

Prioritate: **P0 release gate**

## Protocol minim

Minimum trei sesiuni golden-slice, în zile/momente diferite, supravegheate de
adult.

Se notează:

- înțelege CTA-ul;
- înțelege instrucțiunea;
- apasă înainte de ready;
- repetă cerința;
- ezită;
- abandonează;
- confundă targetul;
- are dificultăți motorii;
- reacționează la feedback;
- solicită ajutor;
- durata adecvată;
- semnale de oboseală/frustrare;
- transferul în lumea reală.

Nu se filmează sau stochează date în aplicație fără o decizie separată. Observația
poate fi notată manual de părinte.

## Clasificare probleme

- P0: nu poate continua, date pierdute, audio/input blocat, confuzie majoră;
- P1: are nevoie frecvent de ajutor, feedback ambiguu, layout slab;
- P2: polish, preferință, variație.

## Exit

- zero P0 observat;
- P1 majore remediate;
- cele trei jocuri pot fi folosite fără explicație permanentă a adultului;
- sesiunea se termină calm;
- roadmap-ul este actualizat cu dovezi reale.

---

# R11 — Release candidate și validare GitHub manuală

Prioritate: **P0**

## Pregătire

1. toate etapele R0–R10 închise;
2. worktree curat;
3. commit unic identificat;
4. documentație actualizată;
5. snapshot-uri aprobate;
6. raport dispozitiv;
7. rollback pregătit.

## Comenzi finale locale

```bash
npm ci --no-audit --no-fund
npm run check:v2-runtime
npm run validate:audio-packs
npm run audit:speech
npm test
npm run typecheck
npm run build:web
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
npm run test:web:all-games
npm run test:web:trace-touch
npm run test:web:performance
```

## GitHub Actions

Workflow-ul `Validate architecture and content` se lansează manual o singură dată.

Trebuie să treacă:

- `npm ci`;
- `npm test`;
- typecheck;
- build;
- generated artifacts clean.

Workflow-ul nu înlocuiește Playwright pe dispozitiv și testul fizic.

## Release report

Include:

- SHA;
- tree;
- lockfile hash;
- Node;
- shell gzip;
- cache total;
- clipuri obligatorii;
- test counts;
- dispozitive;
- FPS/memorie;
- offline/update;
- accessibility;
- pilot;
- probleme cunoscute;
- rollback.

## Exit

- toate porțile verzi;
- PR poate fi marcat Ready;
- auditul trece de la NO-GO la GO explicit;
- commitul candidat nu se mai modifică fără reluarea porților.

---

# R12 — Instalare pe server și rollout controlat

Prioritate: **finală**

Serverul este utilizat abia aici pentru build/release sau servirea preview-ului
final. Nu începe R12 pentru a descoperi erori de tip, teste sau arhitectură.

## 12.1 Staging

- build din SHA aprobat;
- output separat de producție;
- permisiuni normalizate;
- release.json verificat;
- CSP verificat;
- service worker verificat;
- URL de test separat.

## 12.2 Smoke staging

- Splash;
- Home;
- golden session;
- Parent Mode;
- Preview Mode;
- export;
- offline;
- update;
- repair;
- release identity.

## 12.3 Backup și rollback

Înainte de publicare:

- păstrează dist-ul anterior;
- păstrează SHA-ul anterior;
- comandă atomică de rollback;
- nu șterge cache-ul utilizatorului ca mecanism de update;
- documentează permisiunile Caddy/container.

## 12.4 Publicare

- sincronizare atomică;
- verificare HTTP;
- verificare `release.json`;
- verificare asset audio;
- PWA update de pe dispozitivul real;
- monitorizare manuală inițială.

## 12.5 Post-release

- test offline după update;
- progres păstrat;
- zero 403;
- zero asset lipsă;
- zero cache loop;
- raport final.

## Exit

- producție servește exact SHA-ul aprobat;
- rollback funcționează;
- dispozitivul instalat trece update + offline;
- documentația reflectă release-ul real.

---

# R13 — Dezvoltări ulterioare după release

Prioritate: **P2/P3**

Numai după release-ul golden stabil:

## Studio local

- catalog browser;
- seed/difficulty controls;
- preview multi-device;
- audio QA;
- pack builder;
- asset approvals;
- profile import;
- report generator;
- snapshot approval.

## Pack-uri opționale

- classification;
- visual attention;
- memory;
- inhibition;
- spatial;
- language/social;
- real-world.

## Wrapper Android

Capacitor/TWA doar dacă PWA este stabilă:

- aceeași aplicație;
- fără logică duplicată;
- fără Firebase;
- fără permisiuni inutile;
- golden pack inclus;
- update/rollback documentat.

## Extinderea catalogului

Loturi mici:

1. jocuri cu valoare observată;
2. arhetipuri deja validate;
3. asset/audio în buget;
4. teste complete;
5. pilot înainte de următorul lot.

---

# 4. Matricea porților

| Poartă | Automat | Manual | Dispozitiv | Blochează serverul |
|---|---:|---:|---:|---:|
| Static guards | da | nu | nu | da |
| Core/property | da | nu | nu | da |
| Typecheck | da | nu | nu | da |
| Build/identity | da | inspectare | nu | da |
| Chromium | da | snapshot | nu | da |
| WebKit | da | snapshot | nu | da |
| Full catalog | da | nu | nu | da |
| High-stage contracts | da | layout | nu | da |
| Trace touch | da | nu | emulat CDP | da |
| Performance sintetic | da | nu | nu | da |
| Clean install | nu | da | da | da |
| Airplane mode | nu | da | da | da |
| Update | parțial | da | da | da |
| Repair | da | da | da | da |
| Crash/recovery | da | da | da | da |
| TalkBack/VoiceOver | Axe | da | da | da |
| Audio review | validare | da | da | da |
| Pilot copil | nu | da | da | da |
| GitHub workflow | da, manual | nu | nu | da |

---

# 5. Definition of done finală

Aplicația poate fi considerată gata pentru server numai dacă:

- toate comenzile sunt verzi;
- high-stage contracts sunt complete;
- Preview Mode nu modifică date;
- storage recovery este demonstrat;
- current-release cache este demonstrat;
- repair urmat de offline playback este demonstrat;
- update vechi → nou este demonstrat;
- toate jocurile P0 pornesc și se curăță;
- golden-slice-ul este completabil în airplane mode;
- memoria și performanța sunt în buget;
- audio golden este aprobat;
- accesibilitatea manuală este aprobată;
- pilotul nu are P0;
- workflow-ul manual este verde;
- commitul și artefactul sunt identice;
- rollback-ul este pregătit.

Până atunci:

**PR Draft. NO-GO pentru merge, instalare și release.**
