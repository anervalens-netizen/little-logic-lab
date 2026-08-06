# Minte în joacă — PWA React/Pixi V2

V2 se dezvoltă pe `agent/v2-runtime-reboot`. Branch-ul este Draft și nu se publică
sau instalează pe serverul final înainte de închiderea roadmap-ului canonic.

Audit curent: `../../docs/17-final-audit-2026-07-29.md`  
Roadmap: `../../docs/12-roadmap.md`

## Baseline local

```bash
cd ../..
npm ci --no-audit --no-fund
npm run check:v2-runtime
npm run validate:audio-packs
npm run audit:speech
npm test
npm run typecheck
npm run build:web
npm run preview --workspace @little-logic-lab/web
```

Browser baseline:

```bash
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
```

Release gates speciale:

```bash
npm run test:web:all-games
npm run test:web:trace-touch
npm run test:web:performance
```

## Child și Parent Mode

- Home are o singură acțiune: Continuă aventura;
- golden journey conține pereche, sortare culoare și puzzle;
- catalogul manual este numai în Parent Mode;
- `Previzualizează nivelul` rulează cu `previewMode=true`;
- preview-ul nu modifică attempt, mastery, difficulty, session sau session lock;
- o sesiune reală a copilului rămâne singura cale care modifică progresul.

## Runtime audio

- voce locală decodată în `AudioBuffer`;
- maximum o replică activă;
- cache LRU maximum 48;
- maximum trei preload-uri concurente;
- timeout fetch/decode/playback;
- playback rate limitat;
- watchdog de final;
- voice bus separat de SFX;
- ducking;
- input `inert`/`aria-busy` în timpul narațiunii;
- excepție numai pentru go/no-go;
- stable cue IDs pentru golden slice;
- vocile procedurale ale obiectelor dezactivate;
- muzica și vocea se opresc la background/freeze.

## Offline și update

Child Mode pornește numai când:

1. service worker-ul este ready;
2. pagina este controlată;
3. unul dintre `release.json`-urile cache-uite corespunde commitului HTML curent;
4. asset-urile provin din cache-ul acelui release sau din repair cache-ul curent;
5. toate clipurile `core-shell` și `golden-journey` au status bun, content type
   audio și corp nenul.

La eșec:

- Splash rămâne fail-closed;
- adultul poate repara asset-urile obligatorii same-origin;
- repair cache-urile vechi sunt ignorate și șterse;
- playback-ul citește direct repair cache-ul în airplane mode.

Update-ul workerului este aplicat numai la Splash sau la final de sesiune.

## Persistență locală

- IndexedDB;
- migrări v1/v2/v3 → v4;
- sanitizare profundă;
- snapshot sincron de urgență;
- token de generație;
- timeout open/write/bootstrap;
- fallback localStorage;
- storage health;
- recovery vizibil;
- export și delete.

După validarea executabilă trebuie unificată calea de scriere, eliminând API-ul
istoric redundant din `storage.ts`.

## Build gate

`npm run build:web` verifică:

- commit/tree/lockfile/Node;
- shell inițial sub 100 KiB gzip;
- toate cele 15 chunk-uri P0;
- toate clipurile startup în service worker;
- release identity în precache.

## Testare

- suita principală: fluxuri child/parent/preview, Axe, persistence, offline;
- migrations: v1/v2/v3;
- profile recovery;
- emergency snapshot;
- content pack repair;
- pair lifecycle;
- full catalog smoke;
- continuous trace;
- benchmark sintetic.

Rămâne de implementat high-stage layout + completion per arhetip, conform R3 din
roadmap.

## Livrare statică

Staging-ul trebuie normalizat înainte de rsync:

```bash
find "$STAGING" -type d -exec chmod 0755 {} +
find "$STAGING" -type f -exec chmod 0644 {} +
rsync -a --chmod=D755,F644 --delete-delay --delay-updates \
  "$STAGING/" /opt/websites/logic-lab/dist/
docker exec unihub-caddy test -r /srv/logic-lab/index.html
```

După publicare se verifică `/release.json`, commitul, tree-ul, asset-urile audio și
update-ul pe dispozitiv. Un 403 se investighează mai întâi în permisiunile
containerului.

## Înainte de serverul final

Obligatoriu:

- toate comenzile verzi;
- high-stage contracts;
- clean install/update/repair/airplane mode;
- Preview Mode fără mutații;
- crash/recovery;
- memorie și FPS;
- cinci cicluri fără resurse;
- TalkBack/VoiceOver;
- audio golden aprobat;
- pilot copil–adult;
- workflow GitHub manual verde;
- rollback documentat.

Instrucțiuni: `../../tasks/20-v2-server-handoff.md`.
