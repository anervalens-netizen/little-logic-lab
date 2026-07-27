# Handoff server — validare și integrare V2

Branch: `agent/v2-runtime-reboot`  
Bază inițială: `3b8f0c92ec49f1098c262d6ed8abba5970ab1651`  
Status: analiză independentă finalizată, cod neexecutat încă într-un checkout complet

## Obiectiv

Validează și corectează branch-ul V2 fără a slăbi cerințele introduse pentru audio,
offline, update, input și golden slice.

Citește înainte de orice modificare:

1. `docs/13-v2-independent-audit.md`;
2. `docs/12-roadmap.md`;
3. `docs/decisions/2026-07-27-v2-runtime-reboot.md`.

## 1. Sincronizare Git

```bash
git fetch origin --prune
git checkout agent/v2-runtime-reboot
git status --short
git log --oneline --decorate -n 30
git rev-parse origin/main
git merge-base origin/main HEAD
git diff --stat origin/main...HEAD
```

Dacă `main` a avansat, integrează-l controlat. Nu reseta branch-ul la baza veche și
nu copia selectiv numai anumite fișiere.

## 2. Verificări în ordinea obligatorie

```bash
node --version
npm --version
npm install
npm run check:v2-runtime
npm run audit:speech
npm test
npm run typecheck
npm run build:web
```

Branch-ul nu adaugă dependențe. Nu modifica lockfile-ul fără o cauză reală.

Dacă typecheck/build eșuează, repară mai întâi codul; nu elimina gardurile statice.

## 3. Verificări browser

```bash
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
```

După remedieri:

```bash
for i in 1 2 3; do
  npm run check:v2-runtime || exit 1
  npm run typecheck || exit 1
  npm run build:web || exit 1
  npm run test:web -- --project chromium-touch || exit 1
done
```

Nu regenera snapshot-uri înainte de inspecția diferențelor.

## 4. Zone obligatorii de inspectat

### Audio

- `audio/playback.ts`:
  - maximum 48 buffer-e decodate;
  - maximum trei preload-uri concurente;
  - anularea unei redări vechi;
  - lipsa bufferelor/nodurilor reziduale;
- `audio/speech.ts`:
  - generații;
  - idle waiters;
  - `inert`/`aria-busy`;
  - `blockInput: false` numai pentru go/no-go;
- `audio/audio.ts`:
  - voice bus separat;
  - ducking fără crearea AudioContext înainte de gest;
- `audio/music.ts`:
  - toate notele oprite/deconectate;
  - diagnostics la zero după stop;
- `games/engine.ts`:
  - lauda nu întrerupe ultima replică.

Rulează și păstrează rezultatul:

```bash
npm run audit:speech
```

Nu activa încă varianta strictă dacă raportul confirmă replici lipsă în catalogul
extins. Pentru golden-slice, fiecare lipsă este P0.

### Offline și update

Verifică explicit:

- cheia Workbox revizionată pentru `release.json`;
- commitul din precache egal cu meta-tag-ul HTML;
- controller activ înainte de Home;
- eșec fail-closed în Splash;
- retry după un install lent;
- update peste o versiune veche;
- activarea automată a workerului nou numai în Splash;
- update amânat în timpul unei sesiuni;
- cache incomplet, cache corupt și asset 403.

Nu înlocui verificarea printr-un simplu `caches.match('/release.json')`.

### Runtime jocuri

Verifică în special:

- `choiceGame.ts` — cleanup interval și input în hint/simplify;
- `sortGame.ts` — culoarea rostită înainte de batch-ul următor;
- `spatialFitGame.ts` — piesa/feedback înainte de finish;
- `dailyOrder.ts` — „Întâi/Apoi” sincronizat cu mutarea;
- `oneToOneCount.ts` — numărătoare și paginare;
- `traceRoad.ts` — input blocat înainte de ready;
- `realColorHunt.ts` — butonul dezactivat înainte de instrucțiune;
- `waitForGo.ts` — prompt no-go neblocant, dar feedback blocant.

### UI și accesibilitate

- Home cu un joc rămâne simplu;
- după deblocare apar exact cele trei opriri;
- portrait, landscape și ecran îngust;
- suport real `color-mix()` pe ținte;
- TalkBack/VoiceOver nu activează opțiuni când containerul este `inert`;
- home/replay rămân accesibile pentru ieșire sau repetare;
- Reduced Motion păstrează mecanica.

## 5. Test dispozitiv Android

1. păstrează o versiune veche instalată pentru testul de update;
2. publică build-ul V2 într-un mediu de test;
3. deschide versiunea veche și confirmă trecerea prin Splash la build-ul nou;
4. șterge instalarea/cache-ul și măsoară o instalare curată;
5. așteaptă starea offline ready;
6. închide complet aplicația;
7. activează airplane mode;
8. redeschide și joacă:
   - Găsește perechea;
   - Coșurile de culori;
   - Pune forma la loc;
9. suspendă/reia în instrucțiune, drag și feedback;
10. ieși în Home în timpul vocii;
11. repetă instrucțiunea;
12. verifică audio off, voice off, music și Reduced Motion;
13. rulează cinci cicluri și inspectează diagnostics;
14. redă minimum 30 de replici diferite și măsoară memoria.

Înregistrează:

- dispozitiv, Android și browser/WebView;
- timp prima pregătire;
- dimensiune Cache Storage;
- memorie înainte/după 30 de replici;
- dimensiunea cache-ului audio decodat;
- FPS, frame p95 și input-to-frame;
- erori console/network;
- resurse reziduale după cicluri.

## 6. Criterii de acceptare

- toate comenzile locale sunt verzi;
- zero `new Audio()` în codul copilului;
- zero voce procedurală reactivată;
- maximum o replică activă;
- maximum 48 de buffer-e decodate;
- input blocat înainte de ready, exceptând trialul no-go explicit;
- SFX/muzica nu acoperă vocea;
- intervale/timere/noduri la zero după cleanup;
- release-ul offline corespunde build-ului curent;
- update-ul vechi → nou nu blochează Splash;
- golden-slice funcționează complet în airplane mode;
- progresul supraviețuiește update-ului;
- Home V2 este lizibil pe telefon și tabletă;
- snapshot-urile sunt aprobate manual;
- roadmap-ul include măsurători reale.

## 7. Livrare

După validare:

1. actualizează `docs/13-v2-independent-audit.md` cu rezultatele comenzilor;
2. actualizează `docs/12-roadmap.md` cu măsurători și blocaje reale;
3. actualizează ADR-ul numai dacă decizia tehnică se schimbă;
4. păstrează commituri clare;
5. împinge branch-ul;
6. actualizează draft PR-ul;
7. nu face merge până când R0 și testul airplane mode sunt închise.

Nu începe pachetul Higgs sau redesignul final înaintea validării tehnice și a
măsurătorilor de dispozitiv.
