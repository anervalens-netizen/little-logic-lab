# VALIDATION-REPORT — `agent/v2-runtime-reboot`

Data: 6 august 2026  
Worktree: `/opt/logic-lab/little-logic-lab-v2` (branch local `agent-validation`,
urmat de `origin/agent/v2-runtime-reboot` cu 1 commit adițional)  
Node: v22.23.2 · npm: 10.9.8 · Playwright: 1.62.0 (chromium 1234, webkit 2336)

## Identitate

- HEAD: `cb6bf4ef1a31a64e4e8c9e71363f7c37521852d2`
- TREE: `2ce1cdb…` (identitate confirmată de `vite.config.ts` la `build:web`)
- origin/main: `9e052543ebdd8c49ec91246e05fb4e5c54c808dc`
- merge-base: `3b8f0c92ec49f1098c262d6ed8abba5970ab1651`
- ahead of merge-base: 226 + 1 (validare) = 227
- behind merge-base: 3 (`9e05254 chore: configure Dependabot`,
  `d0a7b6b Rename app branding to Logic Lab`,
  `f8aae85 Deliver the full unlocked Logic Lab experience`)

## Porți statice și core (verzi)

| Comandă | Rezultat | Notă |
|---|---|---|
| `npm ci --no-audit --no-fund` | ✅ 370 pachete în 12s | lockfile neschimbat; cache `/tmp/npm-cache` (EROFS pe `/home/andrei/.npm`) |
| `npm run check:v2-runtime` | ✅ | 76 fișiere verificate; necesită commit pe worktree curat |
| `npm run validate:audio-packs` | ✅ | 321 cue-uri, 3 pachete, distribuție `{"core-shell":8,"golden-journey":57,"extended-p0":256}` |
| `npm run audit:speech` | ⚠️ exit 0, raport 13 replici fixe lipsă | Toate în jocuri non-golden-slice (`traceRoad`, `oneToOneCount`, `realColorHunt`, `waitForGo`, `peekAndFind`); golden-slice este complet |
| `npm test` (inclusiv `core.test.mjs`) | ✅ | 29/29 teste trec |
| `npm run typecheck` | ✅ | core + web curate |
| `npm run build:web` | ✅ | 77.72 KiB initial JS gzip (sub buget 100 KiB), 15 chunk-uri P0, 65 clipuri audio precached, release `cb6bf4ef1a31` verificat |

## Porți browser (parțial verzi)

| Proiect | Trec | Eșec | Skip | Timp |
|---|---|---|---|---|
| chromium-touch | 6 | 17 | 3 | 4m 36s |
| webkit-touch | 5 | 16 | 5 | 4m 24s |

Playwright 1.62.0 cere chromium `1234` și webkit `2336`, instalate în
`/tmp/pw-browsers` (EROFS pe `~/.cache/ms-playwright`); cache-ul trebuie
setat prin `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers`.

## Remedieri aplicate (commit `cb6bf4e`)

1. `apps/web/src/screens/home.tsx` — literalul `preferredGameId: activeGame?.id`
   vizibil la call site-ul helperului `startSession`, fără a duplica starea
   `sessionRunning` / `waitForOfflineReady` / `sfxTap`.
2. `scripts/check-v2-runtime.mjs` — verificarea pentru cele trei intrări
   metadata folosește ID-ul gol (`"same-picture"`, `"sort-by-color"`,
   `"inset-puzzle"`), nu `id: "X"` (dependent de formatul
   `JSON.stringify(..., null, 2)` din generator).
3. `packages/core/src/scheduler.ts` — slotul `transfer` mutat înainte de
   `novelty` pentru `maxGames >= 4`, astfel încât sesiunile de 4 jocuri
   cu hibride disponibile includ activitatea de transfer (test
   „session planner returns unique games and a transfer activity").
4. `apps/web/src/app/profileSanitizer.ts` — type-guard explicit la nivel
   de tuplu pentru filtrarea `Object.entries(progress.difficulty)`, astfel
   încât `Object.fromEntries(...)` produce `Record<string, scalar>`.
5. `apps/web/src/games/samePicture.ts` — `flatMap<ContentItem>(...)`
   pentru reconcilierea celor două ramuri (recolorabil / nerecolorabil)
   la nivelul `readonly ContentItem[]`.
6. `apps/web/src/main.tsx` — `override` pe `state`, `componentDidCatch`
   și `render` din `RootErrorBoundary` (`noImplicitOverride: true`).
7. `docs/decisions/006-promised-journey-start-literal.md` — ADR care
   documentează fiecare remediere, alternativele respinse și consecințele.

Toate remediile respectă cerințele din `tasks/20-v2-server-handoff.md`:
„Nu slăbi aceste contracte", „Nu accepta: scoaterea aserțiunilor offline,
eliminarea testelor Preview Mode, dezactivarea Axe, skip nou fără
justificare".

## Verdict static: **GO** pentru R0–R3 (check:v2-runtime, validate:audio-packs,
audit:speech, test, typecheck, build:web).

## Eșecuri Playwright (rămân **NO-GO** pentru R4)

### Categorii observate

1. **Visual baseline (6 eșecuri)** — `splash`, `premium child journey`,
   `Parent Mode`. Snapshot-urile angajate au fost capturate cu chromium
   `1228` / webkit `2311`; Playwright 1.62.0 folosește `1234` / `2336`,
   iar diferențele minore de rasterizare produc abateri `ratio 0.02`
   (6119 pixeli diferiți). Aceasta este derivă de versiune de browser,
   nu o regresie de cod.

2. **Seed de profil oprit (8 eșecuri)** — `seedJourneyProgress` scrie
   direct în IndexedDB (`minte-in-joaca`, store `profiles`), dar
   `initializeProfile()` a citit deja și a cached profilul în memorie
   (`profile = ...`). `getProfile()` folosit de `showHome()`,
   `unlockedGameIds(...)` și `activeJourneyIndex(profile)` returnează
   profilul vechi (fără attempt-urile semănate). Efect: `data-unlocked-count`
   rămâne `3`, `data-journey-stop` rămâne `1`. Testele afectate:
   `audio-runtime:120`, `audio-runtime:146`, `audio-runtime:173`,
   `pair-lifecycle:30`, `profile-recovery:40`, `profile-recovery:157`,
   `storage-migrations:67`, `storage-migrations:109`,
   `storage-migrations:133`. Bug-ul este introdus de commit-ul
   `8bdf2f9 Recover emergency profile snapshots` — emergency snapshot
   cache + lipsește un mecanism de re-citire la navigare.

3. **data-game-ready ascuns (3 eșecuri)** — `app.spec:295`,
   `app.spec:449`, `audio-runtime:61`, `all-games-smoke:96` — elementul
   cu `data-game-ready="true"` este atașat dar cu `visibility: hidden`
   (probabil overlay sau stare de tranziție). Necesită inspectarea
   trace-urilor Playwright pentru a determina dacă este o regresie
   Pixi/React sau o problemă de timing.

4. **Axe / accesibilitate (2 eșecuri)** — `app.spec:343`,
   `app.spec:478` — depind de același flux „home + Parent Mode + Pixi".

### De ce nu am remediat

- Eșecurile sunt reale și cer intervenție în:
  - helper de re-citire a profilului la navigare (sau un mecanism de
    invalidare a cache-ului);
  - snapshot-urile vizuale (regenerare cu browserele instalate
    curente);
  - starea de vizibilitate a `data-game-ready` (investigație trace).
- Acestea sunt R4 (browser baseline) din `tasks/20-v2-server-handoff.md`
  și intră sub „Nu slăbi aceste contracte" — nu le putem ascunde.
- Conform ADR-ului de boot și handoff-ului, branch-ul rămâne
  **Draft / NO-GO pentru merge, instalare pe server sau release**
  până când porțile R4–R11 trec (test:web verde pe ambele proiecte,
  test:web:all-games, test:web:trace-touch, test:web:performance,
  high-stage contracts, Preview Mode, persistență, dispozitiv fizic).

## Recomandare

- **Nu propune merge** către `main`. Branch-ul atinge obiectivele
  statice (R0–R3) cu remediile aplicate, dar nu atinge obiectivele
  R4 (Playwright). Conform `tasks/20-v2-server-handoff.md § 14`,
  instalarea finală pe server necesită toate R0–R11.
- Commit-ul `cb6bf4e` poate fi trimis ca PR separat pe
  `agent/v2-runtime-reboot` pentru a bloca remedierile statice.
- Înainte de orice merge:
  1. Remedierea fluxului de re-citire a profilului (sau actualizarea
     testelor pentru a face `page.reload()` după seed).
  2. Investigarea `data-game-ready` ascuns în trace-urile Playwright.
  3. Regenerarea snapshot-urilor vizuale (sau fixarea versiunii de
     Playwright la o versiune compatibilă cu snapshot-urile).
  4. Rularea `npm run test:web:all-games`, `test:web:trace-touch`,
     `test:web:performance`.
  5. Pilotul R10 (VoiceOver/TalkBack, airplane mode, suspend/resume,
     update flow) înainte de GO.

## Note operaționale

- Worktree-ul de validare este izolat la
  `/opt/logic-lab/little-logic-lab-v2` (branch `agent-validation`); nu
  atinge `/opt/logic-lab/little-logic-lab` (branch `main`).
- Cache-urile Playwright și npm sunt în `/tmp` (sistemul de fișiere
  principal este read-only pentru `/home/andrei/.npm`).
- Pentru a re-rula porțile:
  ```bash
  PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers npm ci --cache /tmp/npm-cache
  PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers npm run check:v2-runtime
  PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers npm run validate:audio-packs
  PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers npm run audit:speech
  PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers npm test
  PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers npm run typecheck
  PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers npm run build:web
  PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers npm run test:web -- --project chromium-touch
  PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers npm run test:web -- --project webkit-touch
  ```