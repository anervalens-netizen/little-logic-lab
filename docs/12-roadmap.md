# Roadmap canonic V2 — „Minte în joacă”

Status: activ, **NO-GO pentru merge/release până la validarea executabilă**  
Actualizat: 27 iulie 2026  
Branch de lucru: `agent/v2-runtime-reboot`  
Bază inițială: `3b8f0c92ec49f1098c262d6ed8abba5970ab1651`

Acesta este documentul autoritativ pentru continuarea proiectului. Raportul celei
de-a doua analize independente este `docs/13-v2-independent-audit.md`, iar pașii
executabili pentru server sunt în `tasks/20-v2-server-handoff.md`.

## 1. Obiectivul produsului

Aplicația trebuie să:

- funcționeze complet fără internet după pregătirea inițială;
- răspundă rapid și fluid pe telefonul minim suportat;
- sincronizeze vocea, demonstrația, animația și inputul;
- blocheze inputul în timpul explicației, cu excepții pedagogice explicite;
- arate ca o lume coerentă, nu ca o bibliotecă de prototipuri;
- valideze trei jocuri excelente înaintea extinderii catalogului;
- păstreze progresul exclusiv local și toate limitele din `AGENTS.md`.

Nu promitem creșterea IQ-ului și nu folosim aplicația pentru diagnostic.

## 2. Decizia de arhitectură

Nu se rescrie proiectul de la zero și nu se creează acum o a doua aplicație Android.

Se păstrează:

- `packages/core`, generatoarele și reducer-ele deterministe;
- ladder-ele și dificultatea adaptivă;
- IndexedDB, migrările și export/delete local;
- React pentru shell, Home și Parent Mode;
- PixiJS pentru scene interactive;
- PWA statică fără backend, cont, analytics sau egress de gameplay.

Se reconstruiesc gradual:

- runtime-ul audio și timeline-ul rundelor;
- pregătirea și update-ul offline;
- Home și direcția artistică;
- cele trei jocuri golden-slice;
- pachetul audio românesc.

ADR: `docs/decisions/2026-07-27-v2-runtime-reboot.md`.

## 3. Starea curentă a branch-ului V2

### Implementat

#### Audio

- voce locală prin Web Audio `AudioBuffer` și `decodeAudioData`;
- maximum o replică activă, cu întrerupere deterministă;
- `speak()` returnează promisiunea finalului real al clipului;
- `waitForSpeechIdle()` și `waitForSpeechBoundary()`;
- voice bus separat de SFX;
- ducking automat al efectelor și muzicii;
- cache LRU limitat la 48 de buffer-e decodate;
- maximum trei decodări de preload simultane;
- vocile procedurale ale obiectelor eliminate;
- muzica urmărește și eliberează toate nodurile programate;
- audit de acoperire audio disponibil prin `npm run audit:speech`.

#### Input și timeline

- `.game-play-area` devine `inert`, `aria-busy` și fără pointer input în timpul
  instrucțiunilor;
- excepția `blockInput: false` este permisă numai când apăsarea în timpul replicii
  este comportamentul evaluat, precum trialul no-go;
- lauda așteaptă finalul feedbackului verbal;
- inputul și tranzițiile au fost remediate în:
  - `choiceGame`;
  - `sortGame`;
  - `spatialFitGame`;
  - `dailyOrder`;
  - `oneToOneCount`;
  - `traceRoad`;
  - `realColorHunt`;
  - `waitForGo`;
- intervalele de anulare sunt închise și pe căile de succes;
- `traceRoad` nu mai acceptă input înaintea instrucțiunii.

#### Offline și update

- Child Mode este fail-closed dacă pachetul local nu este complet;
- Splash afișează pregătirea și oferă retry la eșec;
- un rezultat negativ poate fi reîncercat după terminarea instalării;
- service worker-ul trebuie să controleze pagina;
- `release.json` este găsit inclusiv sub cheia Workbox revizionată;
- commitul din precache trebuie să corespundă build-ului HTML curent;
- un worker nou este activat automat numai la limita sigură Splash;
- după Home, update-ul se amână până la finalul sesiunii.

#### Produs și testare

- Home V2 grupează primele trei jocuri în „Aventura lui Lumi”;
- CSS V2 este izolat în `apps/web/src/v2.css`;
- `npm run check:v2-runtime` codifică gardurile auditului;
- test Playwright pentru release offline curent, input `inert` și aventura V2;
- timeout-urile Playwright permit instalarea completă a precache-ului;
- documentație, ADR, audit independent și handoff actualizate.

### Verificat static, dar neexecutat

Mediul care a scris branch-ul a avut acces GitHub direct, nu un checkout local
complet. Nu sunt declarate ca trecute:

- instalarea dependențelor;
- TypeScript typecheck;
- build-ul Vite și bugetul shell;
- testele core;
- Playwright Chromium/WebKit;
- snapshot-urile vizuale;
- auditul efectiv al replicilor fără clip;
- testul real airplane mode;
- profilarea memoriei pe Android.

## 4. Ordinea obligatorie de continuare

### R0 — Validare tehnică și integrare

Prioritate: **P0**.

1. Determină HEAD-ul curent din `main`.
2. Compară-l cu baza V2 și branch-ul actual.
3. Nu face merge înainte de toate verificările.
4. Rulează:

```bash
npm install
npm run check:v2-runtime
npm run audit:speech
npm test
npm run typecheck
npm run build:web
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
```

5. Remediază erorile fără a elimina:
   - playback-ul bufferizat;
   - cache-ul limitat;
   - gate-ul `inert`;
   - release identity;
   - offline fail-closed;
   - update-ul sigur la Splash;
   - testele V2.
6. Inspectează manual fiecare snapshot modificat.
7. Rulează subsetul critic de trei ori consecutiv.

Exit:

- toate comenzile verzi;
- build sub 100 KiB JS gzip inițial;
- nicio modificare neintenționată în fișiere generate;
- nicio regenerare oarbă de snapshot-uri;
- branch reconciliat controlat cu `main`.

### R1 — Offline real și update pe dispozitiv

Prioritate: **P0**.

Teste obligatorii:

1. instalare curată online;
2. confirmare `data-offline-state="ready"`;
3. restart complet;
4. airplane mode;
5. sesiune golden-slice completă;
6. suspend/resume în instrucțiune, drag și feedback;
7. update peste o versiune instalată anterior;
8. cache incomplet/corupt și retry;
9. cinci cicluri joc → Home fără resurse reziduale.

Măsurători:

- timpul primei instalări;
- dimensiunea totală a precache-ului;
- memoria înainte și după minimum 30 de replici diferite;
- numărul de buffer-e decodate;
- timpul de cold start și restart offline.

Dacă cele 321 de MP3-uri fac instalarea neacceptabilă, audio se împarte în:

- shell obligatoriu;
- pachet golden-slice obligatoriu;
- pachete suplimentare instalate numai din Parent Mode.

Child Mode nu poate deschide un joc al cărui pachet nu este local.

Exit:

- sesiunea funcționează integral în airplane mode;
- update-ul nu blochează Splash și nu întrerupe sesiunea;
- cache-ul curent corespunde commitului HTML;
- memoria rămâne stabilă în bugetul măsurat;
- nicio cerere externă în gameplay.

### R2 — Acoperirea audio golden-slice

Prioritate: **P0**.

Rulează:

```bash
npm run audit:speech
```

Apoi:

- clasifică replicile lipsă în golden-slice vs. catalog extins;
- elimină replicile redundante;
- acordă ID stabil fiecărei replici publicate;
- generează clipurile golden-slice;
- validează manifest, durată, hash, clipping și loudness;
- audiază fiecare clip cu un vorbitor nativ;
- activează `npm run audit:speech:strict` pentru suprafața golden-slice.

Exit:

- zero replici golden-slice fără clip local;
- zero tăceri excesive sau clipping;
- vocea poate fi înlocuită fără modificarea jocurilor;
- lipsa unui clip rămâne fallback vizual, nu crash.

### R3 — Golden slice final

Prioritate: **P0**.

Jocuri:

1. `same-picture`;
2. `sort-by-color`;
3. `inset-puzzle`.

Cerințe comune:

- reacție vizuală sub 50 ms;
- frame p95 aproximativ 16,7 ms pe dispozitivul minim;
- fără reflow în timpul drag-ului;
- obiectele rămân sub deget;
- magnetism și snap predictibil;
- maximum două instrucțiuni înainte de input;
- nicio tranziție înaintea vocii;
- portrait și landscape verificate;
- Reduced Motion păstrează sensul;
- TalkBack/VoiceOver nu pot activa opțiunile în timpul explicației.

#### Same Picture

- ținta și opțiunile formează aceeași scenă;
- distractorii sunt lizibili la dimensiunea reală;
- răspunsul corect unește vizual perechea;
- indiciul explică atributul comun, nu doar conturul.

#### Sort by Color

- coșurile sunt zone clare din lume;
- obiectul și destinația au feedback coordonat;
- numele culorii se termină înainte de batch-ul următor;
- batch-urile par o singură activitate;
- schimbarea regulii are tranziție explicită.

#### Inset Puzzle

- pickup, shadow și snap consistente;
- gaura comunică forma fără contrast excesiv;
- rotația apare numai după stăpânirea potrivirii simple;
- auto-complete demonstrează procesul;
- layout lizibil pe ecran mic.

Exit:

- testele de gameplay și cleanup verzi;
- baseline-uri aprobate telefon/tabletă, portrait/landscape;
- pilot adult și minimum trei sesiuni observate cu copilul;
- blocajele observate remediate și documentate.

### R4 — Direcția artistică V2

Prioritate: **P1**, după R3 funcțional.

Direcție: lume calmă de aventură cu Lumi, mașinuțe-jucărie generice, drumuri,
garaje și ateliere, fără mărci sau personaje licențiate.

Lucrări:

- design tokens pentru paletă, contur, umbre și scară;
- stări Lumi: salut, ascultă, arată, așteaptă, bucurie, indiciu, odihnă;
- scene reutilizabile;
- asset-uri aprobate la build time;
- sprite sheets/WebP pentru mișcare repetată;
- SVG numai pentru UI și forme simple;
- finalizarea Home adventure și Parent Mode;
- test contrast/lizibilitate la luminozitate redusă.

Exit:

- trei scene finale reutilizabile;
- Lumi coerent în toate stările;
- zero sugestii de brand extern;
- bundle și memoria rămân în buget.

### R5 — Pachet audio Higgs

Prioritate: **P1**.

Higgs rulează numai în pipeline offline, niciodată în aplicație.

```text
text/ID canonic → Higgs WAV → trim tăceri → loudness
→ clipping check → MP3/Opus → manifest durată/hash
→ audiție umană → import PWA
```

Mai întâi se generează numai golden-slice. Vocea trebuie să fie calmă, naturală,
română corectă și fără entuziasm artificial.

### R6 — Observație și adaptare locală

Prioritate: **P1**.

Se păstrează local numai datele necesare:

- latență până la prima acțiune;
- încercări, hint, abandon;
- repetarea instrucțiunii;
- drag anulat;
- seed, dificultate și durată aproximativă.

Nu se păstrează audio, coordonate brute pe termen lung sau identificatori externi.
Parent Mode afișează concluzii prudente, nu scoruri de IQ.

### R7 — Restul jocurilor

Prioritate: **P2**.

Extinderea începe numai după R0–R6. Se livrează loturi mici, ordonate după:

1. potrivirea cu vârsta actuală;
2. valoarea observată în pilot;
3. reutilizarea arhetipurilor validate;
4. costul de audio, asset-uri și testare.

Nu se implementează simultan toate cele 80 de familii.

### R8 — Ambalare Android opțională

Prioritate: **P3**.

Capacitor sau Trusted Web Activity se evaluează numai după airplane mode și
update/recovery verificate. Wrapper-ul distribuie aceeași aplicație și aceleași
asset-uri; nu introduce logică duplicată, Firebase sau permisiuni inutile.

## 5. Bugete obligatorii

- shell inițial: sub 100 KiB JS gzip;
- input-to-visual: sub 50 ms;
- frame p95: aproximativ 16,7 ms la 60 Hz;
- zero long tasks peste 100 ms în gameplay normal;
- zero canvas, voce, ton, timer sau texture lease rezidual după cinci cicluri;
- maximum o replică activă;
- maximum 48 de buffer-e audio decodate;
- maximum trei decodări de preload simultane;
- zero request-uri externe în gameplay;
- zero pierdere de progres la update sau recovery.

Bugetul maxim în MiB pentru audio se fixează numai după măsurare reală pe Android.

## 6. Reguli pentru agentul de pe server

- citește întâi `docs/13-v2-independent-audit.md`;
- urmează `tasks/20-v2-server-handoff.md`;
- lucrează pe branch-ul V2 până când R0 este verde;
- nu șterge teste pentru a obține verde;
- nu reintroduce `new Audio()` sau vocile procedurale;
- nu elimina gate-ul offline ori `inert`;
- nu folosi TTS online în gameplay;
- nu extinde catalogul înainte de golden-slice;
- actualizează roadmap-ul după fiecare etapă;
- consemnează dispozitivul și măsurătorile reale;
- pentru orice schimbare de direcție, adaugă ADR.

## 7. Livrabil imediat pentru server

În această ordine:

1. HEAD `main` și comparația cu branch-ul V2;
2. toate verificările R0 verzi;
3. raportul `npm run audit:speech`;
4. raport scurt al erorilor de compilare/test și remedierilor;
5. test airplane mode și update pe Android;
6. profil memorie audio și cleanup;
7. capturi Home/golden-slice;
8. listă prioritizată a blocajelor UX;
9. commit clar și PR actualizat către `main`.

Nu începe asset-urile finale sau pachetul Higgs înainte ca punctele 1–6 să fie
închise.
