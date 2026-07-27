# Roadmap canonic V2 — „Minte în joacă”

Status: activ  
Actualizat: 27 iulie 2026  
Branch de lucru: `agent/v2-runtime-reboot`  
Bază inițială: `3b8f0c92ec49f1098c262d6ed8abba5970ab1651`

Acesta este documentul autoritativ pentru continuarea proiectului. Agentul care
preia lucrul trebuie să verifice mai întâi HEAD-ul actual din `main`, să compare
branch-ul V2 cu acesta și să nu presupună că branch-ul poate fi integrat fără
validare.

## 1. Obiectiv

Produsul trebuie să fie o aplicație pentru copil care:

- pornește rapid și rămâne fluidă pe telefon;
- funcționează complet fără internet după prima pregătire;
- sincronizează vocea, demonstrația, animația și activarea inputului;
- arată ca o lume coerentă, nu ca o colecție de prototipuri;
- validează trei jocuri excelente înainte de a extinde catalogul;
- păstrează nucleul pedagogic, privacy-ul și progresul local existente.

## 2. Decizia de produs

Nu se rescrie proiectul de la zero și nu se adaugă momentan o aplicație Android
nativă separată.

Se păstrează:

- `packages/core` și generatoarele deterministe;
- dificultatea adaptivă și ladder-ele;
- IndexedDB, migrările și profilul local;
- React pentru shell și Parent Mode;
- PixiJS pentru scene;
- PWA statică fără backend, cont, analytics sau egress de gameplay;
- toate constrângerile din `AGENTS.md`.

Se reconstruiesc gradual:

- runtime-ul audio și timeline-ul rundelor;
- pregătirea offline;
- Home și direcția artistică;
- cele trei jocuri golden-slice;
- pachetul audio românesc.

Decizia tehnică detaliată este în
`docs/decisions/2026-07-27-v2-runtime-reboot.md`.

## 3. Starea branch-ului V2

### Implementat

- redare verbală locală prin `AudioBuffer`, nu `new Audio()`;
- cache în memorie pentru clipurile decodate;
- o singură replică activă, cu anulare deterministă;
- `speakAndWait()` și stare observabilă `data-speech-state`;
- primitiva comună `wait()` nu permite avansarea înainte de terminarea vocii;
- magistrale separate pentru voce și SFX;
- ducking automat al efectelor în timpul vocii;
- vocile procedurale ale obiectelor dezactivate;
- instrucțiunea generală a jocului redată o singură dată la intrare;
- preîncărcarea instrucțiunilor jocului curent și a laudelor;
- preîncărcarea chunk-ului jocului următor;
- pregătire PWA verificată prin service worker activ, controlul paginii și
  `/release.json` prezent în cache;
- Splash cu stare „Pregătesc…” înainte de Home;
- primul Home V2: cele trei jocuri golden-slice devin „Aventura lui Lumi”;
- CSS V2 izolat în `apps/web/src/v2.css`;
- test Playwright pentru offline gate, finalul vocii și aventura cu trei opriri;
- check local `npm run check:v2-runtime`;
- ADR V2.

### Nevalidat încă

Mediul care a scris branch-ul a avut acces GitHub direct, dar nu a avut checkout
local autentificat și nici `gh`. Prin urmare, următoarele nu trebuie considerate
trecute până la execuția lor pe server:

- TypeScript typecheck;
- build Vite și verificarea bugetului shell;
- testele core;
- Playwright Chromium/WebKit;
- snapshot-urile vizuale;
- verificarea reală în airplane mode;
- profilarea memoriei audio pe telefon.

## 4. Ordinea obligatorie de continuare

### R0 — Integrare și validare tehnică

Prioritate: P0.

1. Determină HEAD-ul curent din `main`.
2. Compară-l cu baza V2 menționată mai sus.
3. Rebase sau merge controlat al branch-ului, fără pierderea schimbărilor apărute
   între timp.
4. Rulează:

```bash
npm install
npm run check:v2-runtime
npm test
npm run typecheck
npm run build:web
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
```

5. Remediază orice eroare fără a elimina:
   - audio bufferizat;
   - speech-aware `wait()`;
   - offline readiness gate;
   - separarea voice/SFX;
   - testele V2.
6. Verifică bugetul inițial sub 100 KiB gzip.
7. Verifică lipsa ciclurilor de import problematice între `ui/dom` și
   `audio/speech`.

Exit:

- toate comenzile trec;
- nicio schimbare neintenționată în fișiere generate;
- build-ul expune commitul și tree-ul corect;
- testele noi rulează stabil de trei ori consecutiv.

### R1 — Offline real pe dispozitiv

Prioritate: P0.

Scop: după o singură pregătire online, întreaga sesiune trebuie să funcționeze în
airplane mode.

Lucrări:

- măsoară durata primei instalări și dimensiunea totală a precache-ului;
- verifică dacă cele 321 de MP3-uri fac instalarea prea lentă;
- dacă este necesar, împarte audio în:
  - pachet shell obligatoriu;
  - pachet P0 obligatoriu;
  - pachete de joc instalate controlat din Parent Mode;
- nu permite Child Mode să pornească un joc al cărui pachet nu este local;
- afișează numai în Parent Mode starea pachetelor și spațiul ocupat;
- păstrează gameplay-ul fără request-uri externe;
- testează cold start, suspend/resume, restart telefon și update PWA;
- testează cache corupt și recovery fără pierderea progresului.

Dispozitive minime:

- OnePlus 6T / Android 11;
- telefonul Android curent;
- tabletă WebKit/iPad dacă este disponibilă.

Exit:

- Home indică `data-offline-state="ready"` înainte de joacă;
- o sesiune completă cu cele trei jocuri trece în airplane mode;
- nicio eroare de asset sau audio în console;
- update-ul nu întrerupe sesiunea;
- prima instalare are un timp acceptabil măsurat, nu presupus.

### R2 — Timeline unic pentru toate arhetipurile

Prioritate: P0.

Scop: fiecare rundă urmează aceeași mașină de stări:

```text
PREPARE → INSTRUCTION → DEMONSTRATION → INPUT → FEEDBACK → TRANSITION
```

Lucrări:

- extrage un `RoundTimeline` explicit din sincronizarea actuală;
- elimină dependența semantică de `setTimeout` din jocuri;
- timeout-urile rămân numai pentru animații locale anulabile;
- fiecare fază primește `AbortSignal` sau cleanup echivalent;
- inputul este blocat în `PREPARE`, `INSTRUCTION` și `DEMONSTRATION`;
- repetarea instrucțiunii nu resetează greșit runda;
- navigarea Home oprește vocea, SFX-ul, tweens și timerele;
- feedback-ul verbal nu poate fi întrerupt de tranziția automată;
- toate arhetipurile consumă runtime-ul comun, nu copii locale.

Exit:

- zero pattern-uri `speak(); setTimeout(... advance ...)`;
- `data-game-ready="true"` apare numai cu speech state `idle`;
- anularea în fiecare fază readuce diagnosticele la zero;
- teste de contract pentru toate cele șase faze.

### R3 — Golden slice final

Prioritate: P0.

Jocurile:

1. `same-picture`;
2. `sort-by-color`;
3. `inset-puzzle`.

Cerințe comune:

- reacție vizuală sub 50 ms după atingere;
- fără reflow în timpul drag-ului;
- obiectele rămân sub deget;
- magnetism și snap predictibil;
- un singur punct vizual dominant;
- maximum două instrucțiuni înainte de input;
- demonstrația explică mecanica fără a rezolva repetitiv răspunsul;
- feedback contextual specific mecanicii;
- layout separat pentru portrait și landscape;
- 60 FPS pe dispozitivul minim;
- Reduced Motion păstrează sensul, elimină decorul.

#### Same Picture

- ținta și opțiunile trebuie să pară parte din aceeași scenă;
- distractorii similari trebuie să fie diferențiabili la dimensiunea reală;
- după răspuns corect, perechea se unește vizual;
- după eroare, indiciul evidențiază atributul comun, nu doar conturul corect.

#### Sort by Color

- coșurile devin zone clare din lume, nu carduri generice;
- obiectul selectat și destinația au feedback coordonat;
- vocea culorii se redă după plasare fără a bloca inutil următorul obiect;
- batch-urile nu par niveluri separate;
- la două reguli, schimbarea regulii are o tranziție explicită.

#### Inset Puzzle

- piesele folosesc pickup, shadow și snap consistent;
- gaura comunică forma fără contrast excesiv;
- rotația apare numai după stăpânirea potrivirii simple;
- auto-complete arată procesul, nu teleportează piesele;
- piesele multiple rămân lizibile pe ecrane mici.

Exit:

- fiecare joc trece un pilot adult și minimum trei sesiuni observate cu copilul;
- blocajele observate sunt documentate și remediate;
- baseline-uri vizuale aprobate pentru telefon/tabletă, portrait/landscape;
- testele de gameplay și cleanup trec.

### R4 — Direcție artistică V2

Prioritate: P1 după R3 funcțional.

Direcția recomandată: o lume calmă de aventură cu Lumi și elemente apropiate de
interesele copilului, inclusiv mașinuțe-jucărie generice, drumuri, garaje și
ateliere, fără folosirea mărcilor Hot Wheels.

Lucrări:

- definește paletă, grosime contur, lumină, umbre și scară;
- definește stările complete Lumi:
  - salut;
  - ascultă;
  - arată;
  - așteaptă;
  - bucurie;
  - indiciu;
  - odihnă;
- înlocuiește treptat ilustrațiile procedurale slabe cu asset-uri aprobate;
- folosește sprite sheets/WebP pentru mișcare repetată;
- păstrează SVG pentru UI și forme simple;
- creează scene reutilizabile, nu fundal separat pentru fiecare nivel;
- finalizează Home adventure map și Parent Mode;
- testează contrastul și claritatea la luminozitate redusă.

Exit:

- design tokens documentate;
- trei scene finale reutilizabile;
- Lumi coerent în toate stările;
- nicio combinație vizuală care sugerează reclamă sau brand extern;
- bundle și memoria rămân în buget.

### R5 — Pachet audio Higgs

Prioritate: P1 după stabilizarea runtime-ului.

Nu se conectează modelul Higgs la aplicație în runtime. Generarea se face offline,
în pipeline de build.

Pipeline:

```text
text canonic → Higgs WAV → eliminare tăceri → normalizare loudness
→ verificare clipping → compresie MP3/Opus → manifest ID/durată/hash
→ audiție umană → import în PWA
```

Lucrări:

- renunță treptat la identificarea clipurilor prin text exact;
- introduce ID-uri stabile pentru replici;
- generează mai întâi numai pachetul golden-slice;
- voce calmă, naturală, română corectă, fără entuziasm artificial;
- standardizează loudness-ul între toate clipurile;
- măsoară tăcerea de început și final;
- creează manifest cu durată și hash;
- pregătește opțional clipuri pentru obiecte, fără fallback procedural;
- audit auditiv de vorbitor nativ pentru fiecare clip publicat.

Exit:

- toate clipurile golden-slice aprobate;
- variație de loudness în limita stabilită;
- fără clipping și tăceri excesive;
- manifest validat automat;
- înlocuirea vocii nu modifică runtime-ul jocului.

### R6 — Observație și adaptare inteligentă

Prioritate: P1.

Datele rămân exclusiv locale.

Se înregistrează numai evenimente necesare pedagogic:

- latență până la prima acțiune;
- număr de încercări;
- hint utilizat;
- abandon;
- repetarea instrucțiunii;
- drag anulat;
- dificultate și seed;
- durată aproximativă a rundei.

Nu se înregistrează:

- audio;
- touch coordinates brute pe termen lung;
- identificatori externi;
- date personale;
- analytics remote.

Parent Mode trebuie să afișeze concluzii simple și prudente, nu scoruri de IQ sau
diagnostice.

Exit:

- datele pot fi exportate și șterse;
- nicio transmisie de rețea;
- adaptarea schimbă o singură axă majoră;
- observația adultului poate corecta o interpretare greșită.

### R7 — Restul jocurilor

Prioritate: P2.

Se extind numai după ce R0–R6 sunt închise. Ordinea se stabilește după:

1. potrivirea cu vârsta actuală;
2. valoarea observată în pilot;
3. reutilizarea arhetipurilor deja finalizate;
4. costul de asset-uri și testare.

Nu se implementează simultan toate cele 80 de familii. Se livrează loturi mici,
fiecare cu pilot și criterii de acceptare.

### R8 — Ambalare Android opțională

Prioritate: P3.

Capacitor sau Trusted Web Activity poate fi evaluat numai după ce PWA trece
airplane mode și update/recovery.

Scopul wrapper-ului ar fi distribuția asset-urilor și instalarea comodă, nu o a
doua aplicație cu logică duplicată.

Exit:

- aceeași bază de cod și același content pack;
- fără permisiuni inutile;
- fără Firebase sau SDK-uri de tracking;
- actualizare și rollback documentate.

## 5. Bugete obligatorii

- shell inițial: sub 100 KiB JS gzip;
- input-to-visual: sub 50 ms;
- frame p95: aproximativ 16,7 ms pe ținta 60 Hz;
- zero long tasks peste 100 ms în gameplay normal;
- zero canvas/audio/timer rezidual după cinci cicluri;
- maximum un clip verbal activ;
- zero request-uri externe în gameplay;
- zero pierdere de progres la update sau recovery.

Bugetele de memorie pentru audio trebuie măsurate în R1 și fixate în acest
document după măsurare reală.

## 6. Reguli pentru agentul de pe server

- lucrează pe branch-ul V2 până când toate porțile R0 trec;
- nu șterge testele ca să obții verde;
- nu reintroduce `new Audio()`;
- nu reintroduce vocile procedurale;
- nu adăuga backend, cont, analytics sau TTS online;
- nu extinde catalogul înainte de golden slice;
- actualizează acest roadmap după fiecare etapă închisă;
- consemnează măsurători reale și dispozitivul folosit;
- dacă o decizie se schimbă, adaugă ADR înainte de implementare.

## 7. Livrabilul imediat pentru server

Serverul trebuie să producă următorul rezultat, în această ordine:

1. branch integrat cu HEAD-ul curent;
2. toate verificările R0 verzi;
3. raport scurt cu erorile găsite și remediate;
4. măsurare prima instalare/offline pe Android;
5. confirmare că cele trei jocuri pot fi jucate complet în airplane mode;
6. capturi pentru noul Home cu trei opriri;
7. listă prioritizată de blocaje UX observate;
8. commit clar și, dacă workflow-ul proiectului o cere, PR către `main`.

Nu începe R3 sau generarea Higgs înainte ca punctele 1–5 să fie închise.
