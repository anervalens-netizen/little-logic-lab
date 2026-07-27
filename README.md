# Little Logic Lab / „Minte în joacă”

Aplicație web/PWA și bibliotecă de jocuri logice pentru aproximativ
**2 ani și 6 luni – 6 ani**.

Proiectul este construit pentru un copil real, dar repo-ul nu conține nume,
fotografii, data nașterii sau alte date personale. Personalizarea și progresul
rămân exclusiv pe dispozitiv.

## Status V2

Rebuild-ul activ este `agent/v2-runtime-reboot`, pornit din commitul
`3b8f0c92ec49f1098c262d6ed8abba5970ab1651`.

Branch-ul introduce:

- audio local bufferizat și sincronizat cu rundele;
- magistrale separate voice/SFX și ducking;
- eliminarea vocilor procedurale neplăcute ale obiectelor;
- pregătire offline verificată înainte de Home;
- primul Home V2 cu „Aventura lui Lumi” pentru cele trei jocuri golden-slice;
- teste și check-uri de regresie V2;
- roadmap complet pentru validare, redesign și pachetul Higgs.

Branch-ul nu este release-ready până când serverul nu rulează toate porțile din
`docs/12-roadmap.md`.

## Ce conține proiectul

- **80 familii de jocuri**, grupate în 19 arhetipuri reutilizabile și 10 domenii;
- **1.030 ancore de progresie** generate automat, fiecare schimbând o singură
  axă;
- nucleu TypeScript pur pentru progres, dificultate, sesiuni, generatoare și
  state machines;
- 15 familii P0 funcționale;
- React pentru shell și Parent Mode;
- PixiJS/WebGL pentru scene;
- IndexedDB cu migrări și recovery;
- PWA versionată, statică, fără backend și fără egress de gameplay;
- documentație, cercetare, contracte și teste.

## Ce nu promite

Aplicația poate exersa potrivire, clasificare, memorie, inhibiție, flexibilitate,
planificare, vocabular și numerație timpurie. Nu este prezentată drept metodă de
creștere a IQ-ului și nu oferă diagnostic.

## Golden slice V2

Ordinea curentă de produs:

1. `same-picture` — Găsește perechea;
2. `sort-by-color` — Coșurile de culori;
3. `inset-puzzle` — Pune forma la loc.

Aceste trei jocuri trebuie aduse la standard vizual, audio și interactiv final,
validate în airplane mode și observate cu copilul înainte de extinderea
catalogului.

## Principii obligatorii

- offline-first; fără cont, reclame, analytics terț sau tracking;
- fără cameră, microfon, locație, contacte ori fotografii;
- sesiune implicită scurtă și blocare calmă după limită;
- fără streak-uri, vieți, clasamente, loot sau recompense aleatorii;
- fără rușinare și fără ecran de eșec;
- progres bazat pe stăpânire demonstrată, nu doar pe vârstă;
- fără citire obligatorie în Child Mode;
- voce românească locală și demonstrații vizuale;
- fiecare joc are co-play și transfer în lumea reală.

## Structură

```text
content/                 catalog, preseturi, ladder-e, teme și localizare
docs/                    produs, UX, arhitectură, decizii și roadmap
research/                matrice de dovezi și registru de surse
packages/core/           logică TypeScript independentă de UI
schemas/                 contracte JSON pentru conținut și date locale
scripts/                 generare, validare și quality gates
tasks/                   task-uri istorice și bounded assignments
apps/web/                PWA React/Pixi offline-first
AGENTS.md                reguli autoritative pentru coding agents
```

## Verificare locală

```bash
npm install
npm run check:v2-runtime
npm test
npm run typecheck
npm run build:web
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
```

Nu se publică direct după build. Se verifică apoi pe dispozitiv:

- primul start și instalarea completă;
- sesiune în airplane mode;
- audio sincronizat și fără suprapuneri;
- 60 FPS și input rapid;
- cleanup complet după cinci cicluri;
- TalkBack/VoiceOver;
- Reduced Motion și audio off;
- ștergere/export date locale.

## Documente curente

- roadmap canonic: `docs/12-roadmap.md`;
- decizia runtime V2:
  `docs/decisions/2026-07-27-v2-runtime-reboot.md`;
- arhitectură: `docs/05-architecture.md`;
- UX copil: `docs/06-child-ux-design-system.md`;
- siguranță/privacy: `docs/08-safety-privacy-compliance.md`;
- aplicația web: `apps/web/README.md`.
