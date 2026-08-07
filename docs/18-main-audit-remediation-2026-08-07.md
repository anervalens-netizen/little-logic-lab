# Audit main și plan de remediere — 7 august 2026

Repository: `anervalens-netizen/little-logic-lab`  
Branch: `main`  
Bază audit: `759d31fe6ae9e3eed893574efc953dbcb1cbe6c1`

## Verdict

Arhitectura V2 este bună pentru continuarea dezvoltării, dar baseline-ul browser nu
poate fi considerat complet verde cât timp există teste Playwright sărite. Auditul
curent nu reia securitatea; focusul este runtime, persistență, mobile/PWA, UX și
livrare statică.

## Constatări

### P0 — profilul putea reveni la o stare veche după reload

Confirmat din cod și din `VALIDATION-REPORT.md`.

Cauza: `queueProfileSave()` scrie deja sincron un emergency snapshot înainte de
IndexedDB. Lifecycle-ul scria încă un snapshot la `visibilitychange/pagehide/freeze`.
La un reload, acel al doilea snapshot putea proveni din memoria veche și avea
prioritate la bootstrap față de un IndexedDB mai nou. Efect: seed/migrare/progres
corect în IndexedDB putea fi înlocuit cu profilul anterior.

Remediere: lifecycle-ul nu mai creează un snapshot nou. La limitele browserului
încearcă doar confirmarea cozii deja protejate. Snapshot-ul de urgență rămâne scris
sincron la fiecare mutație reală prin `queueProfileSave()`.

Au fost reactivate nouă teste direct legate de zonele reparate sau sărite cu o
justificare stale:

- recovery după profil parțial corupt;
- confirmarea emergency snapshot la boot;
- migrare IndexedDB v2 → v4;
- migrare IndexedDB v3 → v4;
- Home/journey baseline;
- selecția următoarei opriri după progres persistat;
- unlock-ul următorului joc după progres persistat;
- release/offline + speech input gate;
- cleanup-ul scenei Pixi în timpul feedback-ului de pereche.

### P0 operațional/mobile — buildul PWA de producție cere HTTPS

Child Mode este intenționat fail-closed și cere service worker. Pe telefon,
`http://IP:port` nu este secure context și nu poate satisface această condiție.
`localhost` pe desktop este tratat diferit de browser, de aici poate apărea exact
simptomul „merge pe PC, nu merge pe telefon” când testarea se face prin două URL-uri
diferite.

Nu slăbim offline gate-ul. Splash-ul explică acum explicit când problema este
transportul/secure contextul, în loc să o prezinte ca pachet audio incomplet.

Deployment recomandat: build static → Caddy → Cloudflare Tunnel/HTTPS. Nu rula
Vite preview ca serviciu final.

### P1 — baseline Playwright incomplet

Raportul din 6 august avea 23 teste sărite/proiect. Nouă teste au fost reactivate
în această remediere. Pentru Pixi, readiness-ul se validează acum prin contractul
`data-game-ready="true"`, nu prin „vizibilitatea” overlay-ului semantic aproape
transparent; full-catalog smoke folosește aceeași regulă.

Rămân categorii ce trebuie validate executabil:

- Axe timeout;
- continuous pointer path pentru `trace-road`;
- content-pack mutation/repair;
- snapshot-uri vizuale;
- câteva teste istorice care folosesc încă vechea aserțiune Pixi și trebuie
  revizuite individual;
- alte skip-uri istorice care trebuie revizuite individual, nu eliminate în masă.

Nu se vor elimina aserțiuni sau mări timeout-uri doar pentru a obține verde.

### P1 — datorie de persistență

Există încă două suprafețe de write: API-ul istoric din `storage.ts` și calea
`durableProfile.ts`. După ce browser gates sunt verzi, trebuie păstrată o singură
cale de scriere pentru a preveni ocolirea accidentală a emergency snapshot-ului.

### P1 — audio/catalog

`audit:speech` raportase 13 replici fixe lipsă în jocuri non-golden-slice. Nu
blochează golden journey, dar trebuie închis înainte ca acele jocuri să fie tratate
ca suprafață finală.

### P1 — dispozitiv real

Rămân obligatorii: Android/iOS clean install, update peste versiune veche, airplane
mode, suspend/resume, portrait/landscape, memorie după 30 clipuri și cinci cicluri
fără resurse reziduale.

## Plan de remediere/dezvoltare

1. **Acum:** reparare race profil + diagnostic HTTPS + reactivare teste recovery,
   migration, journey și readiness Pixi dependente de zonele remediate.
2. **Pe server înainte de deploy:** `npm ci`, static/core/typecheck/build și browser
   gates; remediază orice eșec real, fără skip nou.
3. **Deploy:** publică exclusiv `apps/web/dist` prin Caddy și HTTPS; verifică
   `/release.json`, service worker, MP3 content-type și cache current-release.
4. **Telefon:** șterge o singură dată datele vechii instalări dacă service workerul
   precedent este inconsistent; clean install online, apoi restart airplane mode.
5. **După stabilizare:** închide skip-urile rămase, unifică storage write path,
   completează audio non-golden și high-stage contracts.
6. **Abia apoi:** dezvoltare vizuală/pedagogică suplimentară și extinderea catalogului.

## Criteriu de acceptare pentru următorul deploy

Minimum: static/core/typecheck/build verzi, cele nouă teste reactivate verzi,
full-catalog smoke fără regresii de readiness, domeniul HTTPS servește buildul
curent, telefonul intră din Splash în Home și o sesiune golden poate fi terminată
fără pageerror.
