# Arhitectura tehnică V2

Status: activ pe `agent/v2-runtime-reboot`  
Actualizat: 27 iulie 2026

## 1. Decizie

Aplicația rămâne web/PWA-first, cu React pentru shell și semantică, PixiJS pentru
scene interactive și `@little-logic-lab/core` pentru logica pedagogică pură.
Nu există backend în runtime, cont, sincronizare cloud sau analytics.

V2 schimbă în principal trei zone:

- pregătirea offline devine o poartă explicită înainte de Child Mode;
- vocea este bufferizată și controlează timeline-ul rundelor;
- primele trei jocuri formează golden slice-ul produsului și sunt dezvoltate
  înaintea extinderii catalogului.

Decizia detaliată este în
`docs/decisions/2026-07-27-v2-runtime-reboot.md`.

## 2. Stratificare

```text
┌──────────────────────────────────────────────────────┐
│ React application shell                              │
│ Splash · Home · Session · Parent Mode · settings    │
├──────────────────────────────────────────────────────┤
│ Round/runtime orchestration                          │
│ prepare · speech · demo · input · feedback · cleanup│
├──────────────────────────────────────────────────────┤
│ Game renderers                                       │
│ PixiJS/WebGL + DOM accessibility overlay             │
├──────────────────────────────────────────────────────┤
│ Game plugins                                         │
│ generate · initialize · reduce · evaluate · hint     │
├──────────────────────────────────────────────────────┤
│ @little-logic-lab/core                               │
│ generators · mastery · adaptation · scheduler        │
├──────────────────────────────────────────────────────┤
│ Local platform services                              │
│ IndexedDB · audio buffers · Cache Storage · SW       │
├──────────────────────────────────────────────────────┤
│ Bundled content                                      │
│ catalog · ladders · illustrations · Romanian audio   │
└──────────────────────────────────────────────────────┘
```

Dependențele merg în jos. Core-ul nu importă React, PixiJS, IndexedDB, Web Audio
sau alte API-uri de browser.

## 3. Structura curentă

```text
apps/web/
  src/
    app/                 profil, sesiuni, offline/update
    audio/               buses, buffering, speech manifest
    games/               plugins și runtime-uri comune
    runtime/             scene Pixi, lifecycle, diagnostics
    screens/             Splash, Home, joc, Parent Mode
    ui/                  input, feedback, timing comun
    generated/           registry și manifesturi tipizate
    art/                 asset-uri procedurale existente
    v2.css               stratul vizual nou
packages/core/           logică pură și deterministă
content/                 catalog, ladder-e și release manifests
schemas/                 contracte de date
scripts/                 generare și quality gates
tests/web/               Playwright, Axe, vizual, performanță
```

Pachete precum `game-runtime`, `game-renderers`, `content` sau `storage` se extrag
numai când există mai mult de un consumator real. Nu se fragmentează monorepo-ul
doar pentru simetrie arhitecturală.

## 4. Contractul jocului

Fiecare familie se bazează pe un plugin determinist:

```ts
interface GamePlugin<TConfig, TState, TAction, TPayload> {
  gameId: string;
  generate(seed: string, config: TConfig): GeneratedLevel<TPayload>;
  initialize(level: GeneratedLevel<TPayload>): TState;
  reduce(state: TState, action: TAction): TState;
  evaluate(state: TState): Evaluation;
  getHint(state: TState, hintIndex: number): Hint;
}
```

Responsabilități:

- generatorul creează un nivel rezolvabil și replayable;
- reducerul decide corectitudinea;
- rendererul prezintă starea și emite acțiuni;
- coordonatele, tween-urile și callback-urile vizuale nu decid mastery;
- persistarea nu conține decizii pedagogice.

## 5. Timeline-ul unei runde

Ținta V2 este o mașină de stări comună:

```text
PREPARE
  → INSTRUCTION
  → DEMONSTRATION
  → INPUT
  → FEEDBACK
  → TRANSITION
```

Orice fază poate trece la `CANCELLED` prin Home, limita sesiunii sau întreruperea
aplicației.

Implementarea branch-ului V2 este o etapă intermediară:

- `GameContext.speak()` este awaitable;
- `speakAndWait()` se rezolvă la finalul real al clipului;
- `wait()` păstrează durata vizuală minimă, dar așteaptă și vocea activă;
- `data-game-ready="true"` trebuie să apară numai după terminarea instrucțiunii;
- o replică nouă invalidează complet replica veche;
- cleanup-ul oprește vocea și eliberează scena.

R2 din roadmap va extrage explicit `RoundTimeline` și va elimina semantica de
tranziție rămasă în timeout-uri locale.

## 6. Arhitectura audio

```text
Romanian text / stable prompt ID
            │
            ▼
     speech manifest
            │
            ▼
fetch local asset → decodeAudioData → AudioBuffer cache
            │
            ▼
       voice bus ───────────────┐
                                ├─ output → device
Web Audio SFX → SFX bus ────────┘
                   ▲
                   └─ ducked while voice is active
```

Reguli:

- nu se folosește `new Audio()` pentru vocea copilului;
- poate exista maximum un clip verbal activ;
- clipurile apropiate se preîncarcă, nu întregul catalog în memoria RAM;
- vocea și SFX au magistrale separate;
- SFX sunt reduse în timpul vocii;
- lipsa unui clip păstrează demonstrația vizuală și nu produce request remote;
- vocile procedurale ale animalelor și obiectelor sunt dezactivate;
- viitorul pachet Higgs este generat offline și schimbă asset-urile, nu runtime-ul.

Identificarea curentă prin text exact este tranzitorie. R5 va introduce ID-uri
stabile, durată, hash și audit auditiv per clip.

## 7. Pornirea offline

Fluxul de producție:

```text
bootstrap
  → register service worker
  → navigator.serviceWorker.ready
  → page controlled by service worker
  → /release.json found in Cache Storage
  → data-offline-state="ready"
  → Child Home
```

Dacă browserul refuză service worker-ul, există timeout și aplicația poate rămâne
utilizabilă online, dar starea devine `unavailable`. Child Mode nu trebuie să
prezinte drept instalat un joc al cărui pachet nu este disponibil local.

Build-ul actual precache-uiește toate MP3-urile. Aceasta asigură offline complet,
dar poate încetini prima instalare. R1 măsoară costul real și poate separa shell,
pachet P0 și pachete opționale instalate numai din Parent Mode.

## 8. Rendering și lifecycle

React/DOM:

- navigație și ecrane;
- Parent Mode;
- controale semantice;
- accessibility overlays;
- layout și feedback textual.

PixiJS/WebGL:

- scene interactive;
- drag, snap, trace, reorder;
- mișcare contextuală;
- particule controlate.

Nivelurile consecutive pot reutiliza același `Application` Pixi pe același host.
Fiecare scenă trebuie să elimine:

- copii din stage;
- listeneri pointer;
- callback-uri ticker;
- timere și tweens;
- DOM overlay;
- lease-uri pentru texturi;
- audio activ.

La ieșirea din shell, contextul GPU este distrus. După cinci cicluri complete,
diagnostics trebuie să revină la zero.

## 9. Persistență

```text
IndexedDB: minte-in-joaca / profiles
  current          → snapshot schema v4
  recovery-latest  → ultimul payload invalid pentru recovery
```

Caracteristici:

- stare sincronă în memorie și scrieri serializate;
- migrare din localStorage și snapshot-uri v2/v3;
- recovery fără pierderea setărilor;
- export și delete în Parent Mode;
- nume opțional, numai local;
- fără identificator cloud sau dată exactă obligatorie;
- `sessionLocked` persistent, eliminat numai din Parent Mode;
- setări locale pentru Reduced Motion, contrast, ținte și viteza demonstrației.

Datele pedagogice rămân locale. Coordonatele brute, audio-ul și identificatorii
externi nu se persistă.

## 10. Content pipeline

1. Editează definiția jocului sau asset manifestul.
2. Generează ladder-ele și registry-ul tipizat.
3. Validează JSON Schema și guardrail-urile de vârstă.
4. Generează preview-uri deterministe.
5. Rulează teste de solvabilitate/property.
6. Verifică implementarea rendererului.
7. Revizuiește copy-ul și audio-ul românesc.
8. Bundle-uiește asset-urile aprobate.
9. Verifică precache-ul și identitatea release-ului.
10. Testează pe dispozitiv și în airplane mode.

Nu se folosește remote configuration sau OTA content în Child Mode.

## 11. Stack curent

- TypeScript 7 strict;
- React 19.2.8;
- PixiJS 8.19.0/WebGL;
- Vite 8;
- `idb` 8.0.3;
- Workbox prin `vite-plugin-pwa`;
- Web Audio cu voice/SFX buses;
- Playwright 1.62, Axe și teste Node/property;
- Cloudflare Tunnel + Caddy pentru livrare statică.

Un eventual wrapper Capacitor/TWA poate împacheta aceeași aplicație numai după
închiderea porților PWA. Nu poate duplica logica sau adăuga permisiuni inutile.

## 12. Failure modes

- Cache incomplet: păstrează Splash în pregătire, apoi raportează starea corectă.
- Asset audio lipsă: continuă vizual, fără serviciu remote.
- Redare întreruptă: generația veche nu poate avansa runda.
- IndexedDB corupt: recovery și explicație în Parent Mode.
- Content invalid: nu afișa nivelul.
- Eroare Pixi: logica pură rămâne validă și resursele sunt eliberate.
- App suspendată: oprește buclele vizuale și revino la o singură scenă.
- Update disponibil: aplică numai la limita sigură a sesiunii.

## 13. Porți de validare

Branch-ul V2 a fost scris prin conexiune GitHub și nu este considerat compilat
până la execuția pe server:

```bash
npm run check:v2-runtime
npm test
npm run typecheck
npm run build:web
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
```

Urmează verificare reală pe Android, airplane mode, suspend/resume,
TalkBack/VoiceOver și observație copil–adult. Criteriile complete sunt în
`docs/12-roadmap.md`.
