# Minte în joacă — PWA React/Pixi

Aplicația P0 este live la `https://logic-lab.astancu.eu/`. Producția servește
build-ul static Vite prin Cloudflare Tunnel → Caddy; nu folosește un backend.

## Rulare locală

```bash
cd ../..
npm install
npm run dev --workspace @little-logic-lab/web
npm run build:web
npm run preview --workspace @little-logic-lab/web
```

`preview` este numai pentru verificare locală. `npm run build:web` impune
bugetul de shell și verifică precache-ul tuturor implementărilor lazy.

## Stare curentă

- TypeScript 7 strict, React 19, PixiJS 8/WebGL și Vite 8;
- 15/15 familii P0 funcționale, cu toate stage-urile ladder consumate;
- registry TypeScript generat din catalog + ordinea P0, fără listă manuală;
- 36 ilustrații procedurale originale, cu metadate canonice și ID-uri tipizate;
- jocurile și runtime-urile Pixi sunt chunk-uri lazy, precached pentru offline;
- profil, replay, progres și setări în IndexedDB cu migrări/recovery;
- snapshot local v3 și blocare calmă după sesiune, deblocată numai din Parent Mode;
- 324 clipuri românești locale și efecte Web Audio, fără servicii remote;
- overlay semantic, Reduced Motion, Axe și baseline-uri Chromium/WebKit;
- PWA versionată, CSP strict și zero egress de gameplay.

## Structură

```text
src/
  main.tsx           bootstrap React
  app/               sesiuni, profil, IndexedDB, update PWA
  generated/         content, asset manifest și registry lazy generate
  games/             implementările P0 și engine-ul transversal
  runtime/           scene Pixi reutilizabile
  screens/           splash, home, joc și Parent Mode
  audio/             manifest RO, playback local și efecte
  art/               Lumi, scene și renderere SVG procedurale locale
  ui/                input/feedback/parent gate
```

## Porți rămase pentru pilot

- audiția celor 324 clipuri de un vorbitor nativ;
- 60 FPS, input și lifecycle pe dispozitivul Android țintă;
- verificare manuală TalkBack/VoiceOver;
- observație copil–adult și remedierea blocajelor constatate.

Roadmap-ul canonic este `../../docs/12-roadmap.md`.
