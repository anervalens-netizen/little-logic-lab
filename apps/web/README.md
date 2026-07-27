# Minte în joacă — PWA React/Pixi V2

Producția existentă servește build-ul static prin Cloudflare Tunnel → Caddy. V2
se dezvoltă pe `agent/v2-runtime-reboot` și nu se publică înainte de validarea din
`docs/12-roadmap.md`.

## Rulare locală

```bash
cd ../..
npm install
npm run check:v2-runtime
npm run audit:speech
npm test
npm run typecheck
npm run build:web
npm run preview --workspace @little-logic-lab/web
```

Browser tests:

```bash
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
```

## Runtime V2

- voce locală decodată în `AudioBuffer`;
- cache LRU: maximum 48 de clipuri decodate;
- maximum trei preload-uri audio concurente;
- o singură replică activă;
- voice bus separat de SFX și ducking automat;
- `inert`/`aria-busy` pentru zona de joc în timpul instrucțiunilor;
- excepție explicită `blockInput: false` numai pentru go/no-go;
- vocile procedurale ale obiectelor sunt dezactivate;
- muzica eliberează toate nodurile la stop;
- feedback-ul verbal se termină înainte de praise/tranziție.

Runtime-urile remediate includ choice, sort, spatial fit, secvențe, numerație,
trace, activitatea real-world și go/no-go.

## Offline și update

Child Mode pornește numai când:

1. service worker-ul este activ;
2. pagina este controlată;
3. `release.json` există în Cache Storage;
4. cheia Workbox revizionată este rezolvată;
5. commitul din cache corespunde meta-tag-ului HTML curent.

La eșec, Splash rămâne fail-closed și oferă retry. Un worker nou este activat
automat numai cât timp aplicația este încă în Splash. După Home, update-ul este
amânat până la finalul sesiunii.

## Home V2

Primele trei jocuri sunt prezentate drept „Aventura lui Lumi”:

1. Găsește perechea;
2. Coșurile de culori;
3. Pune forma la loc.

Restul catalogului nu primește asset-uri finale înainte ca golden slice să treacă
testele și observația reală.

## Audituri

```bash
npm run check:v2-runtime
npm run audit:speech
```

- `check:v2-runtime` previne revenirea la pattern-urile defecte;
- `audit:speech` enumeră replicile fixe fără clip și apelurile dinamice;
- `audit:speech:strict` devine poartă după completarea pachetului golden-slice.

Raport complet: `../../docs/13-v2-independent-audit.md`.

## Livrare statică

Serviciul Astra rulează cu `UMask=0077`, deci staging-ul trebuie normalizat:

```bash
find "$STAGING" -type d -exec chmod 0755 {} +
find "$STAGING" -type f -exec chmod 0644 {} +
rsync -a --chmod=D755,F644 --delete-delay --delay-updates \
  "$STAGING/" /opt/websites/logic-lab/dist/
docker exec unihub-caddy test -r /srv/logic-lab/index.html
```

După publicare se verifică `/release.json`, commitul și tree-ul. Un răspuns 403 se
investighează mai întâi în permisiunile Caddy/container.

## Porți înainte de publicare

- toate comenzile locale verzi;
- snapshot-uri inspectate manual;
- update peste versiune veche;
- instalare curată și airplane mode;
- 30 de replici cu memorie stabilă;
- cinci cicluri fără canvas/audio/timer rezidual;
- TalkBack/VoiceOver și Reduced Motion;
- audit audio golden-slice.

Instrucțiuni exacte: `../../tasks/20-v2-server-handoff.md`.
