# Audit independent V2 — runtime, offline, audio și UX

Data: 27 iulie 2026  
Branch auditat și remediat: `agent/v2-runtime-reboot`  
Bază inițială: `3b8f0c92ec49f1098c262d6ed8abba5970ab1651`  
HEAD la închiderea acestui raport: `e6f528b10316deda800321f8847040b2b4e9a259`

## Verdict

**GO pentru validare executabilă pe server. NO-GO pentru merge sau release.**

A doua analiză a fost făcută independent de concluziile implementării inițiale și a
găsit defecte reale care ar fi putut produce în continuare exact simptomele raportate:
replici întrerupte, input activ prea devreme, cache offline fals pozitiv, update PWA
blocat, leak-uri de timere și memorie audio necontrolată.

Defectele confirmate prin citirea codului au fost remediate pe branch. Nu există însă
dovadă că branch-ul compilează și trece testele până când comenzile din secțiunea
„Porți obligatorii” sunt executate într-un checkout complet.

## Metodologie

Au fost verificate separat:

- lifecycle-ul audio și concurența dintre voce, SFX și muzică;
- fiecare dintre cele 15 familii P0, direct sau prin fabrica/arhetipul comun;
- momentul în care inputul devine disponibil;
- tranzițiile feedback → nivel/batch următor;
- anularea și eliberarea intervalelor/timerelor;
- instalarea PWA, identitatea release-ului și update-ul service worker-ului;
- limitele cache-ului audio decodat;
- semantică TalkBack/VoiceOver în timpul instrucțiunilor;
- acoperirea manifestului audio față de replicile din cod;
- testele și gardurile statice V2.

## Constatări confirmate și remediate

### 1. Lauda putea întrerupe ultima explicație

Un joc putea rezolva rezultatul după animația minimă, iar motorul pornea imediat
lauda. Acum motorul așteaptă `waitForSpeechIdle()` înainte de `praise()`.

### 2. Inputul putea deveni activ în timpul vocii

Blocarea este acum aplicată central pe `.game-play-area` prin:

- `inert` pentru semantică și tastatură;
- `aria-busy` pentru starea asistivă;
- `pointer-events: none` pentru touch;
- `data-speech-blocks-input` separat de simpla stare de redare.

Excepția este explicită și limitată la prompturile go/no-go unde apăsarea în timpul
replicii este chiar comportamentul evaluat.

### 3. „Urmează drumul” accepta input înainte de terminarea instrucțiunii

`data-game-ready` era setat înaintea demonstrației, iar rendererul nu avea un gate
logic. Acum `onAdvance` verifică `inputReady`, iar scena devine gata numai după
voce și demonstrația minimă.

### 4. Runtime-urile comune aveau tranziții independente de voce

Au fost refăcute fabricile comune:

- `choiceGame` — pereche, umbre, ascultare, emoții;
- `sortGame` — culoare, formă, mărime;
- `spatialFitGame` — puzzle și drag-and-fit.

Au fost sincronizate și jocurile dedicate:

- `dailyOrder`;
- `oneToOneCount`;
- `traceRoad`;
- `realColorHunt`;
- `waitForGo`.

Feedback-ul, schimbarea batch-ului și finalizarea nu mai trebuie să taie replica
activă.

### 5. Interval rezidual în rendererul DOM de alegere și sortare

Intervalele de anulare erau oprite la abandon, dar nu în toate căile de succes.
`finish()` le curăță acum idempotent și blochează inputul.

### 6. Cache offline fals pozitiv

Verificarea inițială accepta existența oricărui `/release.json`, inclusiv unul vechi.
Acum commitul din cache trebuie să fie identic cu meta-tag-ul build-ului HTML
curent.

### 7. Cheia Workbox revizionată nu era rezolvată corect

Workbox poate stoca `release.json` sub o cheie cu `__WB_REVISION__`. Verificarea
caută acum request-ul real în Cache Storage după pathname și citește acel response.

### 8. Update PWA putea bloca Splash-ul

În strategia `prompt`, noul worker trebuie activat explicit. Update-ul este acum
activat automat numai cât timp aplicația se află la limita sigură Splash. După
intrarea în Home, update-ul rămâne amânat până la finalul sesiunii.

### 9. Offline gate era fail-open și nereîncercabil

Aplicația putea intra în Home după timeout chiar dacă pachetul local nu era complet.
Acum rămâne în Splash, explică problema și oferă retry. Un rezultat negativ nu mai
rămâne memorat permanent; probe-ul poate reuși după terminarea instalării workerului.

### 10. Cache audio decodat fără limită

Buffer-ele decodate puteau crește pe parcursul sutelor de replici. Cache-ul este
acum LRU, limitat la 48 de clipuri. Preload-ul decodează maximum trei clipuri
concurent pentru a evita spike-uri CPU și memorie.

### 11. Muzica nu elibera toate nodurile programate

Oprirea muzicii anula timerul viitor, dar nu toate oscilatoarele deja programate.
Nodurile sunt acum urmărite, oprite, deconectate și incluse în diagnosticul de
resurse.

### 12. Acoperirea audio nu era verificată față de cod

`validate:audio` dovedește că manifestul și fișierele existente corespund, dar nu că
fiecare replică rostită din cod are un clip. Au fost adăugate:

```bash
npm run audit:speech
npm run audit:speech:strict
```

Prima comandă raportează lipsurile; varianta strictă devine poartă pentru pachetul
Higgs după ce toate replicile golden-slice sunt acoperite.

## Garduri automate adăugate

`npm run check:v2-runtime` verifică acum static:

- interdicția `new Audio()`;
- playback prin `decodeAudioData` și voice bus;
- limitarea cache-ului și a concurenței de preload;
- speech boundary și gate-ul `inert`;
- excepția controlată go/no-go;
- identitatea release-ului curent;
- rezolvarea cheilor Workbox revizionate;
- update-ul sigur la Splash;
- offline fail-closed;
- cleanup în choice/sort/music;
- prezența celor trei jocuri din aventura V2.

Testul Playwright V2 verifică suplimentar:

- commitul din precache egal cu build-ul HTML;
- `inert` în timpul instrucțiunii;
- speech state `idle` înainte de `data-game-ready`;
- Home cu cele trei opriri golden-slice.

## Porți obligatorii înainte de merge

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

După orice remediere, se repetă cel puțin:

```bash
npm run check:v2-runtime
npm run typecheck
npm run build:web
npm run test:web -- --project chromium-touch
```

## Porți obligatorii pe dispozitiv

1. instalare curată online;
2. confirmarea stării offline ready;
3. restart complet al aplicației;
4. airplane mode;
5. sesiune completă cu cele trei jocuri golden-slice;
6. suspend/resume în instrucțiune, drag și feedback;
7. update peste o versiune instalată anterior;
8. cinci cicluri joc → Home cu toate diagnosticele la zero;
9. profilare memorie înainte și după minimum 30 de replici diferite;
10. audiție umană a tuturor clipurilor folosite în golden slice.

## Probleme rămase deschise

### P0

- compilarea și testele nu au fost executate în mediul care a făcut auditul;
- rezultatul `npm run audit:speech` nu este încă disponibil;
- snapshot-urile V2 trebuie inspectate, nu regenerate automat;
- airplane mode și update-ul peste o instalare veche trebuie demonstrate real;
- memoria cache-ului de 48 de buffer-e trebuie măsurată pe Android.

### P1

- înlocuirea vocii Edge TTS cu pachetul Higgs revizuit;
- trecerea de la identificarea clipului prin text exact la ID stabil;
- finalizarea direcției artistice pentru cele trei jocuri;
- observație copil–adult și remedierea blocajelor UX.

## Regula de integrare

Branch-ul nu se integrează pe baza acestui raport. Se integrează numai pe baza:

- comenzilor verzi;
- dovezii airplane mode;
- inspecției vizuale;
- lipsei regresiilor de accesibilitate;
- raportului de memorie și cleanup.
