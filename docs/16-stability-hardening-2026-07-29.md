# Plan și implementare — stabilitate V2

Data: 29 iulie 2026  
Branch: `agent/v2-runtime-reboot`  
Status: implementat în cod; necesită validare executabilă înainte de merge sau instalare

## Obiectiv

Reducerea riscului ca aplicația să:

- piardă progresul la închidere sau suspendare;
- declare greșit că este pregătită offline;
- rămână într-un Splash imposibil de reparat;
- afișeze un ecran gol după o eroare de bootstrap;
- blocheze un nivel din cauza unui clip audio local defect;
- repete instrucțiunea de două ori;
- lase ecrane, timere sau callback-uri reziduale după navigare;
- folosească ID-uri audio inexistente în golden slice.

## Principii

- fără backend cloud, cont sau analytics remote;
- fără instalare pe server înainte de maturizarea produsului;
- toate reparațiile de asset-uri sunt same-origin;
- Child Mode rămâne fail-closed când pachetul obligatoriu nu este complet;
- progresul local este protejat înaintea operațiilor asincrone;
- o eroare trebuie să lase o cale de recuperare vizibilă;
- verificările statice nu înlocuiesc typecheck, build și testele pe dispozitiv.

# Etapa 1 — Pachete offline verificabile

## Implementat

- registru audio împărțit în `core-shell`, `golden-journey` și `extended-p0`;
- validator pentru ID-uri duplicate, jocuri necunoscute, prefixe goale și cue-uri neatribuite;
- scanare Cache Storage cu concurență limitată;
- verificarea statusului HTTP și a dimensiunii reale a fiecărui clip obligatoriu;
- dimensiune afișată în Parent Mode;
- lista asset-urilor lipsă sau invalide;
- poartă startup pentru `core-shell` și `golden-journey`;
- reparație versionată numai pentru asset-urile obligatorii lipsă;
- request de reparație same-origin, cu `credentials: same-origin`;
- cache separat de reparație și ștergerea versiunilor vechi;
- Splash cu stare distinctă `pregătesc` / `repar`;
- test pentru clip șters → Child Mode blocat → reparare → Home disponibil.

## Criteriu

Un răspuns cache-uit gol, invalid sau lipsă nu poate trece drept pachet instalat.

# Etapa 2 — Persistență rezistentă la crash

## Implementat

- snapshot sincron de urgență înaintea fiecărei scrieri IndexedDB;
- snapshot-ul se elimină numai după confirmarea IndexedDB sau a fallback-ului;
- recuperarea snapshot-ului înainte de montarea UI;
- sanitizare profundă și confirmare durabilă după recuperare;
- checkpoint sincron la `pagehide`, `freeze` și `visibilitychange=hidden`;
- oprirea vocii și muzicii la ieșirea reală din pagină;
- reluarea setărilor la revenirea în foreground;
- test pentru închidere înainte de confirmarea IndexedDB.

## Criteriu

Fereastra dintre mutația în memorie și confirmarea IndexedDB nu mai poate pierde ultima stare dacă localStorage este disponibil.

# Etapa 3 — Runtime audio bounded

## Implementat

- timeout pentru fetch-ul asset-ului local;
- `AbortController` pentru request blocat;
- timeout pentru `decodeAudioData`;
- respingerea explicită a fișierelor cu zero bytes;
- watchdog calculat din durata reală a bufferului;
- oprirea și deconectarea sursei dacă evenimentul `ended` nu apare;
- playback rate limitat la intervalul sigur `0.5–2`;
- cache LRU și preload concurent limitat păstrate.

## Criteriu

Un fișier audio defect sau un service worker blocat nu poate ține runda în `loading` la nesfârșit.

# Etapa 4 — Navigare și bootstrap recuperabile

## Implementat

- factory-ul ecranului rulează înainte de modificarea ecranului curent;
- cleanup-ul ecranului este izolat în `try/finally`;
- ecranul vechi este eliminat chiar dacă propriul cleanup eșuează;
- diagnostic local `data-screen-cleanup-state`;
- fallback vizual pentru eroare în bootstrap;
- `RootErrorBoundary` pentru erori React;
- fallback pentru eșecul importului dinamic al Splash-ului;
- buton local de reload și detalii tehnice numai pentru adult.

## Criteriu

O eroare de bootstrap, import sau cleanup nu trebuie să lase pagina albă ori două ecrane active.

# Etapa 5 — Audio golden-slice coerent

## Implementat

- `same-picture` folosește `same-<vehicul>`;
- `sort-by-color` folosește cue-uri stabile pentru instrucțiune, hint, ajutor și culori;
- `inset-puzzle` folosește cue-uri stabile pentru instrucțiune, hint, ajutor și forme;
- hexagonul rămâne vizual și silențios până la existența unui clip real; nu se inventează un ID;
- auditul verifică atât textele fixe, cât și ID-urile audio;
- auditul scanează proprietățile cue declarate în jocuri;
- narațiunea duplicată din orchestrator a fost eliminată;
- jocul este singura sursă audio autoritară a rundei;
- shell-ul păstrează numai tranziția vizuală scurtă.

## Criteriu

Schimbarea textului vizual sau a punctuației nu poate rupe audio-ul golden-slice identificat prin ID.

# Etapa 6 — Garduri și teste

## Implementat

- `validate:audio-packs` este inclus în `npm test`;
- `check:v2-runtime` rulează și `check-stability-hardening`;
- politica de produs permite `fetch()` numai în două căi locale aprobate:
  - playback audio bundle-uit;
  - reparația same-origin a pachetului;
- orice alt `fetch`, URL remote, XHR sau WebSocket rămâne interzis;
- test pentru statusul pachetelor în Parent Mode;
- test pentru fail-closed și reparare;
- test pentru snapshot de urgență;
- testele anterioare pentru recovery, lifecycle Pixi și pair joining rămân.

# Porți executabile rămase

Aceste comenzi nu sunt declarate ca trecute în mediul care a scris branch-ul:

```bash
npm install
npm run check:v2-runtime
npm run validate:audio-packs
npm run audit:speech
npm test
npm run typecheck
npm run build:web
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
```

După orice remediere:

```bash
for i in 1 2 3; do
  npm run check:v2-runtime || exit 1
  npm run typecheck || exit 1
  npm run build:web || exit 1
  npm run test:web -- --project chromium-touch || exit 1
done
```

# Porți pe dispozitiv înainte de instalarea finală

1. clean install;
2. clip obligatoriu șters și reparat;
3. restart în airplane mode;
4. închidere imediat după o încercare și verificarea progresului;
5. suspend/resume în instrucțiune, drag și feedback;
6. 30 de replici diferite și măsurarea memoriei;
7. cinci cicluri joc → Home cu resursele la zero;
8. rotație portrait/landscape;
9. TalkBack/VoiceOver;
10. update peste o versiune instalată anterior.

## Verdict

**GO pentru continuarea dezvoltării și validarea executabilă. NO-GO pentru merge, release sau instalarea pe server.**

Următoarea etapă de produs este rafinarea interacțiunilor celor trei jocuri și Parent Mode recomandativ, nu extinderea catalogului.
