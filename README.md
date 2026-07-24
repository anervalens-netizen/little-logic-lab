# Little Logic Lab / „Minte în joacă”

Bibliotecă și arhitectură pentru o aplicație mobilă de jocuri logice destinată aproximativ vârstelor **2 ani și 6 luni – 6 ani**.

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
- Sesiune implicită 5–7 minute, configurabilă de adult.
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
apps/mobile/             contractul pentru viitoarea aplicație Expo
AGENTS.md                 instrucțiuni autoritative pentru Codex
```

## Verificare locală

```bash
npm install
npm test
npm run generate
```

`npm test` regenerează și validează cele 1.030 de ancore, verifică politica offline/privacy, compilează nucleul TypeScript și rulează 22 de teste, inclusiv verificări pe sute de seed-uri.

## Ordinea recomandată de implementare

1. Expo/React Native + shell copil/părinte.
2. Un vertical slice complet: „Găsește perechea identică”.
3. Runtime de plugin + conținut JSON + progres local.
4. Cele opt arhetipuri implementate în nucleu.
5. Pachetul P0 de 15 jocuri.
6. Accesibilitate, reduced motion, audio românesc și parent gate.
7. Pilot observat de părinte, fără a colecta date online.
8. Extindere către P1–P3.

Pentru implementare: `tasks/00-bootstrap.md`, apoi `tasks/01-same-picture-vertical-slice.md`. Vezi și `docs/11-codex-build-plan.md` și `AGENTS.md`.
