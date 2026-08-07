# Handoff server — redeploy `main` după auditul din 7 august 2026

## Obiectiv

Ia exclusiv `main`, validează remedierea de persistență/mobile și reinstalează
buildul static. Nu crea branch/PR și nu transforma Vite preview în serviciu final.

## 1. Actualizare checkout

```bash
set -euo pipefail
cd /opt/logic-lab/little-logic-lab
git fetch origin --prune
git checkout main
git pull --ff-only origin main
git status --short
git rev-parse HEAD
node --version
npm --version
```

Cerință: Node 22 și worktree curat.

## 2. Instalare și porți obligatorii

```bash
npm ci --no-audit --no-fund
npm run check:v2-runtime
npm run validate:audio-packs
npm run audit:speech
npm test
npm run typecheck
npm run build:web
```

Apoi rulează browser gates disponibile pe server:

```bash
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
npm run test:web:all-games
npm run test:web:trace-touch
```

Nu adăuga `test.skip`, nu mări timeout-uri pentru a ascunde deadlock-uri și nu
regenera snapshot-uri global fără inspecție.

Prioritate dacă apar eșecuri: testele recovery/migration reactivate, apoi
`data-game-ready`, content packs și trace-road.

## 3. Publicare statică

Buildul de publicat este `apps/web/dist/`.

```bash
STAGING="$(pwd)/apps/web/dist"
test -f "$STAGING/index.html"
test -f "$STAGING/release.json"
find "$STAGING" -type d -exec chmod 0755 {} +
find "$STAGING" -type f -exec chmod 0644 {} +
rsync -a --chmod=D755,F644 --delete-delay --delay-updates \
  "$STAGING/" /opt/websites/logic-lab/dist/
docker exec unihub-caddy test -r /srv/logic-lab/index.html
```

Cloudflare Tunnel/Auth proxy trebuie să ducă la site-ul static Caddy. Nu expune
buildul de producție telefonului prin `http://IP:4173`.

## 4. Verificare după deploy

Pe domeniul HTTPS verifică:

- `/release.json` corespunde HEAD-ului instalat;
- `sw.js` și manifestul sunt 200;
- MP3-urile au content type audio, nu HTML de login/redirect;
- Splash → Home funcționează pe telefon;
- o sesiune golden completă funcționează;
- reload nu pierde progresul;
- după clean install, airplane mode pornește și redă audio.

Dacă telefonul are un service worker vechi inconsistent, șterge o singură dată
site data/PWA pentru domeniu și repetă clean install online.

## 5. Raport final

Trimite: SHA instalat, comenzile care au trecut/eșuat, URL verificat, browser și
telefon, rezultat online/offline, plus orice pageerror/console error. Dacă un gate
P0 eșuează, repară cauza în `main`, repetă gate-ul și abia apoi republică.
