# ADR 004: Implementare web-first (PWA) în loc de Expo/React Native pentru v1

Status: accepted for product direction; implementation details superseded by
ADR 005.

## Context

`AGENTS.md` recomanda Expo/React Native pentru aplicația mobilă. Mediul de
dezvoltare disponibil este un server Linux headless, iar utilizatorul țintă
este un copil de ~3 ani al cărui părinte vrea să ruleze jocul **local, acum**,
pe dispozitivele din casă, fără publicare și fără cont de dezvoltator.

## Decizie

Prima implementare de produs este o **aplicație web progresivă (PWA)** în
`apps/web`, construită cu Vite + TypeScript strict, reutilizând direct nucleul
pur `@little-logic-lab/core` prin aliasul `@core`.

## Motivație

- Nucleul este deliberat platform-independent — contractul se păstrează integral.
- PWA pe tabletă/telefon = fullscreen, iconiță pe ecran, offline complet după
  prima vizită (service worker cache-first), fără magazin de aplicații.
- Iterație mult mai rapidă pe un server headless (testare reală în Chromium
  headless cu capturi de ecran).
- Prototipul a validat rapid fluxul prin Web Speech și Web Audio. Produsul
  țintă folosește înregistrări românești locale și scene PixiJS.

## Consecințe

- `scripts/check-product-policy.mjs` are o excepție îngustă, comentată în cod:
  service worker-ul PWA (`apps/*/public/sw.js`) poate folosi `fetch()` — este
  chiar mecanismul care asigura offline-first — dar numai same-origin (verificat
  în cod prin `request.url.startsWith(self.location.origin)`). Toate celelalte
  reguli ale verificatorului rămân active și pentru `sw.js`.

- Persistența de produs folosește IndexedDB cu migrări versionate și fallback
  local; prototipul `localStorage` a fost eliminat.
- Haptics nu există pe web; feedback-ul este vizual + audio.
- Vocea română este livrată local printr-un manifest audio versionat;
  instrucțiunile au echivalent vizual.
- O aplicație nativă separată este amânată până după validarea release-ului P0.
- Regulile non-negociabile din `AGENTS.md` se aplică neschimbat: fără cont,
  reclame, analytics, cloud, cameră, microfon, locație, push, mecanici
  manipulative; offline complet; poartă pentru adulți; fără citit în fluxul
  copilului; jocurile deschise/hibride nu se punctează; dificultatea schimbă
  câte o axă; sesiunea se încheie calm la limită.

Verificările curente și porțile țintă sunt documentate în
`docs/12-roadmap.md`.
