# Little Logic Lab / „Minte în joacă”

Aplicație web/PWA și bibliotecă de jocuri logice pentru aproximativ
**2 ani și 6 luni – 6 ani**.

Proiectul este construit pentru un copil real, dar repo-ul nu conține nume, fotografii, data nașterii sau alte date personale. Personalizarea se face numai local, în aplicația instalată.

## Ce conține

- **80 familii de jocuri**, grupate în 19 arhetipuri reutilizabile și 10 domenii: atenție vizuală, clasificare, memorie de lucru, control inhibitor, flexibilitate, secvențe, raționament spațial, numerație, limbaj/social, coordonare și activități în lumea reală.
- **1.030 ancore de progresie** generate automat, fiecare schimbând o singură axă; nivelurile sunt parametrice și deterministe, nu o listă rigidă: fiecare joc are axe precum număr de opțiuni, similitudinea distractorilor, lungimea secvenței, numărul de reguli sau gradul de ajutor.
- Un nucleu TypeScript pur pentru progres, dificultate, planificarea sesiunilor, opt generatoare și state-machine-uri de referință pentru primele arhetipuri.
- Specificație completă pentru un agent Codex: arhitectură, UX, animații, audio, privacy, testare, roadmap, task-uri executabile și criterii de acceptare.
- Cercetare și limite explicite ale afirmațiilor.

## Ce nu promite

Aplicația poate exersa abilități concrete: potrivire, clasificare, memorie, inhibiție, flexibilitate, planificare, vocabular și numerație timpurie. Nu trebuie prezentată ca metodă de „creștere a IQ-ului”. Cercetarea privind transferul îndepărtat al antrenamentului cognitiv este mixtă, iar cele mai solide efecte sunt de obicei asupra sarcinilor exersate sau apropiate.

## Pachetul de început: 30–36 luni

Primele jocuri recomandate pentru implementare:

1. Găsește perechea identică
2. Potrivește umbra
3. Coșurile de culori
4. Casa formelor
5. Mic, mijlociu, mare
6. Privește și găsește
7. Așteaptă semnalul
8. Ce facem întâi?
9. Pune forma la loc
10. Dă câte unul
11. Ascultă și găsește
12. Cum se simte?
13. Urmează drumul
14. Mută și potrivește
15. Vânătoarea de culori în lumea reală

Pentru această etapă: 2–3 opțiuni, o singură regulă, fără cronometru, instrucțiuni audio scurte, ținte foarte mari și adultul aproape.

## Principii obligatorii

- Offline-first; fără cont, reclame, analytics terț, push, cameră, microfon, locație sau identificatori.
- Sesiune implicită 5 minute, configurabilă de adult la 3, 5 sau 7 minute.
- După finalul sesiunii, numai Parent Mode poate permite una nouă.
- Fără infinite scroll, streak-uri, clasamente, vieți, loot sau recompense aleatorii.
- Fără rușinare și fără ecran de eșec. După erori: feedback specific, indiciu, simplificare, apoi încheiere pozitivă.
- Vârsta este doar punct de pornire; progresul se bazează pe stăpânire demonstrată.
- Fiecare joc are întrebare de co-play și activitate echivalentă în lumea reală.
- Jocurile deschise și hibride nu au scor.

## Structură

```text
content/                 catalog, preseturi, 1.030 ancore, teme și localizare
docs/                    research, produs, jocuri, UX, arhitectură, privacy
research/                matrice de dovezi și registru de surse
packages/core/           logică TypeScript independentă de UI
schemas/                 contracte JSON pentru conținut și date locale
scripts/                 generare, validare, policy checks și preview
tasks/                   pași de implementare gata pentru Codex
apps/web/                aplicația PWA React/Pixi, offline-first
AGENTS.md                instrucțiuni autoritative pentru Codex
```

**Aplicația PWA este live:** `https://logic-lab.astancu.eu/`; detalii locale în
`apps/web/README.md`.
Roadmap-ul canonic este `docs/12-roadmap.md`; stack-ul activ este în ADR 005.

## Verificare locală

```bash
npm install
npm test
npm run typecheck
npm run build:web
```

`npm test` regenerează și validează cele 1.030 de ancore, registry-ul P0 și
manifestul celor 36 de ilustrații procedurale, verifică politica
offline/privacy, compilează nucleul TypeScript și rulează 23 de teste, inclusiv
verificări pe sute de seed-uri. `npm run build:web` impune shell JS sub 100 KiB
gzip și verifică precache-ul tuturor chunk-urilor P0.

## Ordinea de implementare

1. Stabilizare, Git/deploy și contracte de date/PWA.
2. React shell + runtime PixiJS.
3. Golden slice: pereche, sortare culoare, puzzle.
4. Cele 15 familii P0.
5. Pilot observat și hardening.
6. Extindere P1–P3 prin cele 19 arhetipuri.

Vezi `tasks/00-stabilization.md`, `docs/11-codex-build-plan.md` și
`docs/12-roadmap.md`.
