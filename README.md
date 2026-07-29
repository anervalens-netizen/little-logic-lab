# Little Logic Lab / „Minte în joacă”

Aplicație web/PWA și bibliotecă de jocuri logice pentru aproximativ
**2 ani și 6 luni – 6 ani**.

Proiectul este construit pentru un copil real, dar repository-ul nu conține nume,
fotografii, data nașterii sau alte date personale. Personalizarea și progresul
rămân exclusiv pe dispozitiv.

## Status V2

Rebuild-ul activ este `agent/v2-runtime-reboot`, pornit din commitul
`3b8f0c92ec49f1098c262d6ed8abba5970ab1651`.

Stare: **Draft / NO-GO pentru merge, instalare pe server sau release**.

Branch-ul include:

- Child Home cu o singură aventură ghidată;
- Parent Preview fără modificarea progresului;
- audio local bufferizat, timeout-uri și stable cue IDs;
- maximum 48 de buffer-e și trei preload-uri concurente;
- voice/SFX buses, ducking și cleanup;
- input semantic blocat în timpul instrucțiunilor;
- offline fail-closed legat de commitul release-ului curent;
- pachete audio inspectabile și repair same-origin;
- playback direct din current-release/repair Cache Storage;
- emergency snapshot generation-safe;
- timeout IndexedDB și bootstrap;
- sanitizare profundă, migrări și recovery;
- scheduler cu recență, sprijin, abandon, latență și varietate;
- garduri statice și suite dedicate de release;
- audit final și roadmap detaliat.

Auditul curent este `docs/17-final-audit-2026-07-29.md`. Roadmap-ul autoritativ
este `docs/12-roadmap.md`.

## Ce conține proiectul

- **80 familii de jocuri**, 19 arhetipuri și 10 domenii;
- **1.030 ancore de progresie** cu schimbarea unei singure axe;
- nucleu TypeScript pur și determinist;
- 15 familii P0 implementate;
- React pentru shell și Parent Mode;
- PixiJS/WebGL pentru scene;
- IndexedDB cu migrări și recovery;
- PWA statică fără backend și fără egress de gameplay;
- conținut, cercetare, scheme, audituri și teste.

## Ce nu promite

Aplicația poate exersa potrivire, clasificare, memorie, inhibiție, flexibilitate,
planificare, vocabular și numerație timpurie. Nu este metodă de creștere a IQ-ului
și nu oferă diagnostic.

## Golden slice V2

Ordinea curentă:

1. `same-picture` — Găsește perechea;
2. `sort-by-color` — Coșurile de culori;
3. `inset-puzzle` — Pune forma la loc.

Aceste trei jocuri trebuie finalizate vizual, audio și interactiv, validate în
airplane mode și observate cu copilul înainte de extinderea catalogului.

## Principii obligatorii

- offline-first;
- fără cont, reclame, analytics terț sau tracking;
- fără cameră, microfon, locație, contacte ori fotografii;
- fără streak-uri, vieți, clasamente, loot sau recompense aleatorii;
- fără rușinare și fără ecran de eșec;
- sesiuni scurte și final calm;
- fără citire obligatorie în Child Mode;
- voce românească locală;
- progres local și prudent;
- co-play și transfer în lumea reală.

## Structură

```text
content/                 catalog, ladder-e, metadata și pachete
docs/                    produs, UX, arhitectură, audit și roadmap
research/                dovezi și registru de surse
packages/core/           logică TypeScript independentă de UI
schemas/                 contracte de conținut și date locale
scripts/                 generare, validare și garduri
tests/web/               Playwright, Axe, lifecycle și release gates
tasks/                   handoff-uri executabile
apps/web/                PWA React/Pixi offline-first
AGENTS.md                reguli pentru coding agents
```

## Baseline local obligatoriu

```bash
npm ci --no-audit --no-fund
npm run check:v2-runtime
npm run validate:audio-packs
npm run audit:speech
npm test
npm run typecheck
npm run build:web
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
```

## Porți speciale înainte de release

```bash
npm run test:web:all-games
npm run test:web:trace-touch
npm run test:web:performance
```

`npm run audit:speech:strict` devine poartă după acoperirea completă a suprafeței
audio publicate.

## Verificări fizice obligatorii

- clean install;
- update peste versiune veche;
- restart în airplane mode;
- repair urmat de playback offline;
- kill/restart după attempt;
- memorie după minimum 30 de replici;
- cinci cicluri fără resurse reziduale;
- portrait/landscape;
- TalkBack/VoiceOver;
- Reduced Motion și audio off;
- pilot copil–adult.

## Documente curente

- audit final: `docs/17-final-audit-2026-07-29.md`;
- roadmap canonic: `docs/12-roadmap.md`;
- stabilitate: `docs/16-stability-hardening-2026-07-29.md`;
- audit produs premium: `docs/14-premium-product-audit.md`;
- plan premium istoric: `docs/15-premium-development-plan.md`;
- decizie runtime: `docs/decisions/2026-07-27-v2-runtime-reboot.md`;
- handoff: `tasks/20-v2-server-handoff.md`;
- arhitectură: `docs/05-architecture.md`;
- UX copil: `docs/06-child-ux-design-system.md`;
- siguranță/privacy: `docs/08-safety-privacy-compliance.md`;
- aplicația web: `apps/web/README.md`.
