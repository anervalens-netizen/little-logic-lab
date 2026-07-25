# Minte în joacă — prototip web/PWA

Baseline funcțional pentru migrarea la stack-ul din `docs/12-roadmap.md`.
Nu este release candidate.

## Rulare locală

```bash
cd ../..
npm install
npm run dev --workspace @little-logic-lab/web
npm run build:web
npm run preview --workspace @little-logic-lab/web
```

Vite preview este numai pentru verificare locală. Producția țintă este
Cloudflare Pages; nu rula preview-ul ca serviciu persistent.

## Ce conține acum

- **14 prototipuri** din pachetul P0: potrivire imagini, umbre,
  sortare după culoare/formă/mărime, puzzle cu forme, ordonarea rutinelor,
  memorie vizuală, așteptarea semnalului, corespondență unu-la-unu,
  ascultă-și-găsește, emoții, drumul spre casă, vânătoare de culori (hibrid).
- **Sesiune adaptivă** (butonul JOACĂ): 3 jocuri alese de planificatorul din
  `@core` (încălzire → creștere → noutate), 5 minute implicit.
- **Dificultate adaptivă**: pornește conservator (2 opțiuni, o regulă) și
  schimbă câte o singură axă, pe baza ultimelor rezultate (din `@core`).
- **Mastery local** pe abilități (model beta din `@core`), vizibil părintelui.
- **Voce în română** (Web Speech API) + efecte sonore generate (Web Audio).
- **Poartă pentru adulți** (ține apăsat 3 secunde): progres, setări
  (durata sesiunii, voce, muzică, mișcare redusă), export/ștergere date.
- service worker cache-first prototip; update-ul versionat este restant în R0.

## Structură

```text
src/
  main.ts            intrare și service worker prototip
  styles.css         design system (paletă, butoane, animații, reduced motion)
  app/               router, stare globală, persistență, orchestrare sesiune
  audio/             context audio, voce ro-RO, efecte generate, muzică
  art/               paletă, helperi SVG, Lumi (mascota), itemi, forme, fețe,
                     rutine, decoruri — toată grafica e SVG desenată în cod
  ui/                helperi DOM, feedback (confetti, laude), poarta adulților
  games/             motor (engine), politica de suport, widget-uri,
                     cele 14 jocuri ca module independente
  screens/           splash, home, shell de joc, ecran părinte
packages/core (import @core)
                     nucleul pur TypeScript: generatoare, runtime-uri,
                     mastery, dificultate, planificator sesiune
```

## Limitări cunoscute

- registru și axe declarate manual; catalogul/ladders nu sunt încă runtime;
- persistență `localStorage`, fără seed replay complet;
- Web Speech depinde de dispozitiv;
- E2E-urile vechi nu sunt versionate;
- scenele DOM/CSS vor fi migrate incremental la React + PixiJS.

## Reguli păstrate

- Nivelurile sunt deterministe (seed), mecanica pură vine din `@core`.
- Fără citit necesar: instrucțiuni rostite + demonstrație vizuală (mânuță).
- Fără pedeapsă: 1 greșeală → încurajare, 2 → indiciu, 3 → terminăm împreună.
- Jocurile hibride (vânătoarea de culori) nu se punctează.
- Nimic nu părăsește dispozitivul.
