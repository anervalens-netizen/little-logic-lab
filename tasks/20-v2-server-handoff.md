# Handoff server — validare și integrare V2

Branch: `agent/v2-runtime-reboot`  
Bază inițială: `3b8f0c92ec49f1098c262d6ed8abba5970ab1651`  
Status: implementare GitHub directă, necompilată încă într-un checkout local

## Obiectiv

Validează, corectează și integrează runtime-ul V2 fără a elimina cerințele
introduse pentru audio, offline și golden slice.

## 1. Sincronizare Git

```bash
git fetch origin --prune
git checkout agent/v2-runtime-reboot
git status --short
git log --oneline --decorate -n 20
git rev-parse origin/main
git merge-base origin/main HEAD
git diff --stat origin/main...HEAD
```

Dacă `main` a avansat, integrează-l controlat în branch și rezolvă conflictele.
Nu reseta branch-ul la baza veche și nu copia selectiv doar documentația.

## 2. Verificări rapide

```bash
node --version
npm --version
npm install
npm run check:v2-runtime
npm test
npm run typecheck
npm run build:web
```

Nu modifica lockfile-ul dacă `npm install` nu justifică o schimbare reală de
dependențe. Branch-ul nu adaugă dependențe.

## 3. Verificări browser

```bash
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
```

Rulează testele de trei ori dacă apar probleme de timing:

```bash
for i in 1 2 3; do
  npm run test:web -- --project chromium-touch || exit 1
done
```

Nu mări arbitrar timeout-urile înainte de identificarea cauzei.

## 4. Zone probabile de verificat

### Audio

- `audio/playback.ts`: anulare, decode, lifecycle și cache;
- `audio/speech.ts`: generații, idle waiters și ducking;
- `audio/audio.ts`: magistralele voice/SFX și mute/unmute;
- `ui/dom.ts`: efectele semanticii audio-aware a `wait()` asupra tuturor jocurilor;
- cleanup și `resourceDiagnostics()` după ieșirea rapidă din joc.

### Offline

- primul install poate depăși 8 secunde din cauza celor 321 de MP3-uri;
- confirmă că `release.json` este găsit în Cache Storage;
- confirmă că pagina este controlată de service worker înainte de Home;
- diferențiază cache incomplet, controller absent și asset 403;
- nu elimina gate-ul doar pentru a grăbi testele.

### UI

- Home cu un singur joc trebuie să rămână curat;
- după deblocarea primelor trei jocuri trebuie să apară exact trei opriri;
- testează portrait, landscape și ecran foarte îngust;
- verifică suportul `color-mix()` pe țintele reale;
- regenerează snapshot-uri numai după inspecție vizuală.

### TypeScript

Verifică în special:

- tipurile pentru `Set(ADVENTURE_IDS)` din `home.tsx`;
- funcția async `GameContext.speak` și implementările existente;
- DOM/Web Audio types;
- closures din `waitForController`;
- importurile dintre `ui/dom.ts` și `audio/speech.ts`.

## 5. Test dispozitiv

Pe Android:

1. șterge instalarea/cache-ul existent;
2. deschide online și măsoară timpul până la Home;
3. închide complet aplicația;
4. activează airplane mode;
5. redeschide și joacă:
   - Găsește perechea;
   - Coșurile de culori;
   - Pune forma la loc;
6. suspendă și revino în fiecare joc;
7. ieși în Home în timpul instrucțiunii;
8. repetă instrucțiunea;
9. verifică audio off și Reduced Motion;
10. rulează cinci cicluri și inspectează diagnostics.

Înregistrează:

- dispozitiv, Android și browser/WebView;
- timp prima pregătire;
- dimensiune Cache Storage;
- FPS și frame p95;
- input-to-frame;
- erori console/network;
- resurse reziduale după cicluri.

## 6. Criterii de acceptare

- toate comenzile locale sunt verzi;
- zero `new Audio()` în codul copilului;
- zero voce procedurală reactivată;
- maximum o replică verbală activă;
- inputul nu devine activ înainte de finalul vocii;
- SFX nu acoperă vocea;
- sesiunea golden-slice funcționează complet în airplane mode;
- progresul supraviețuiește update-ului;
- Home V2 este lizibil pe telefon și tabletă;
- roadmap-ul este actualizat cu măsurători reale.

## 7. Livrare

După validare:

1. actualizează `docs/12-roadmap.md` cu rezultatele și blocajele reale;
2. actualizează ADR-ul numai dacă decizia tehnică se schimbă;
3. păstrează commituri clare;
4. împinge branch-ul;
5. actualizează draft PR-ul;
6. nu face merge în `main` până când R0 și testul airplane mode sunt închise.

Nu începe pachetul Higgs sau redesignul complet al celor trei jocuri înainte de
închiderea acestei validări.
