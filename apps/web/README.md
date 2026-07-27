# Minte în joacă — PWA React/Pixi V2

Producția curentă este servită static prin Cloudflare Tunnel → Caddy și nu
folosește backend. Rebuild-ul V2 este pe branch-ul
`agent/v2-runtime-reboot`; nu trebuie publicat înainte ca toate verificările din
`docs/12-roadmap.md` să treacă.

## Rulare locală

```bash
cd ../..
npm install
npm run check:v2-runtime
npm run typecheck
npm run build:web
npm run test:web -- --project chromium-touch
npm run preview --workspace @little-logic-lab/web
```

`preview` este numai pentru verificare locală. `npm run build:web` impune
bugetul de shell și verifică precache-ul implementărilor lazy.

## Livrare statică

Serviciul Astra rulează cu `UMask=0077`, deci un build creat de Manager poate
avea moduri private chiar dacă artefactele sunt corecte. Pe hostul Caddy,
staging-ul se normalizează înainte de publicare, iar `rsync` impune aceleași
moduri în destinație:

```bash
find "$STAGING" -type d -exec chmod 0755 {} +
find "$STAGING" -type f -exec chmod 0644 {} +
rsync -a --chmod=D755,F644 --delete-delay --delay-updates \
  "$STAGING/" /opt/websites/logic-lab/dist/
docker exec unihub-caddy test -r /srv/logic-lab/index.html
```

După publicare se verifică `/release.json` prin URL-ul public. Un răspuns `403`
nu se atribuie Cloudflare înainte de verificarea permisiunilor din container.

## Runtime V2

- vocea RO este locală și decodificată în `AudioBuffer`;
- clipurile apropiate sunt preîncărcate și reutilizate;
- o singură replică poate fi activă;
- vocea și SFX folosesc magistrale separate;
- SFX sunt reduse cât timp vocea vorbește;
- `wait()` păstrează durata vizuală minimă și așteaptă vocea activă;
- vocile procedurale ale obiectelor sunt dezactivate;
- Splash așteaptă service worker activ, controlul paginii și identitatea release
  în Cache Storage înainte de Home, cu timeout de recovery;
- Home grupează primele trei jocuri deblocate în „Aventura lui Lumi”;
- `data-speech-state` și `data-offline-state` permit teste deterministe;
- `npm run check:v2-runtime` blochează revenirea la `new Audio()` și la vocile
  sintetice vechi.

## Structură relevantă

```text
src/
  main.tsx                 bootstrap React + styles V2
  app/
    update.ts              offline readiness și update sigur
    session.ts             preloading și secvențiere sesiune
  audio/
    audio.ts               output, voice bus, SFX bus, ducking
    playback.ts            fetch, decode, cache, playback lifecycle
    speech.ts              manifest RO, anulare și speech state
    voices.ts              API rezervat pentru viitorul pack Higgs
  screens/
    splash.tsx             pregătire offline
    home.tsx               Home și aventura golden-slice
  games/
    engine.ts              context awaitable
    choiceGame.ts          runtime sincronizat
  ui/dom.ts                wait audio-aware
  v2.css                   stratul vizual nou
```

## Starea conținutului

- nucleul pedagogic, ladder-ele și cele 15 familii P0 existente se păstrează;
- prioritatea de produs este acum golden slice:
  - `same-picture`;
  - `sort-by-color`;
  - `inset-puzzle`;
- cele 321 de clipuri Edge TTS rămân temporar și necesită revizie auditivă;
- viitorul pachet Higgs se generează offline și înlocuiește numai asset-urile;
- nu se adaugă jocuri noi înainte de validarea golden-slice.

## Validare obligatorie înainte de publicare

```bash
npm run check:v2-runtime
npm test
npm run typecheck
npm run build:web
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
```

Apoi:

- prima pornire online;
- închidere completă a aplicației;
- activare airplane mode;
- sesiune completă cu cele trei jocuri;
- suspend/resume;
- verificare zero canvas/audio/timer rezidual;
- test manual TalkBack/VoiceOver;
- observație copil–adult.

Roadmap-ul canonic este `../../docs/12-roadmap.md`, iar decizia V2 este
`../../docs/decisions/2026-07-27-v2-runtime-reboot.md`.
