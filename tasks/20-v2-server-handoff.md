# Handoff V2 — validare executabilă înainte de orice instalare

Branch: `agent/v2-runtime-reboot`  
Bază inițială: `3b8f0c92ec49f1098c262d6ed8abba5970ab1651`  
Status: **Draft / NO-GO pentru merge, server final sau release**

## Obiectiv

Folosește un checkout complet pentru a valida și remedia branch-ul. Această etapă
nu este instalarea produsului pe serverul final. Scopul este să închizi porțile
R0–R6 din roadmap cu cost minim și dovezi complete.

Citește înainte de modificare:

1. `AGENTS.md`;
2. `docs/17-final-audit-2026-07-29.md`;
3. `docs/12-roadmap.md`;
4. `docs/16-stability-hardening-2026-07-29.md`;
5. `docs/decisions/2026-07-27-v2-runtime-reboot.md`.

Nu folosi `docs/13` sau `docs/14` drept status curent; acestea sunt istoric.

---

# 1. Git și checkpoint

```bash
git fetch origin --prune
git checkout agent/v2-runtime-reboot
git status --short
git log --oneline --decorate -n 40
git rev-parse HEAD
git rev-parse HEAD^{tree}
git rev-parse origin/main
git merge-base origin/main HEAD
git diff --stat origin/main...HEAD
```

Reguli:

- worktree curat înainte de instalare;
- nu reseta branch-ul la baza veche;
- nu force-push;
- dacă `main` a avansat, integrează-l controlat și repetă toate porțile;
- consemnează SHA-urile în raport.

---

# 2. Mediu și instalare reproductibilă

```bash
node --version
npm --version
npm ci --no-audit --no-fund
```

Cerință: Node 22.

Dacă `npm ci` modifică lockfile-ul sau eșuează:

- nu continua la build;
- investighează lockfile/runtime;
- nu folosi `npm install` ca soluție permanentă;
- documentează cauza.

---

# 3. Porți statice și core

În această ordine:

```bash
npm run check:v2-runtime
npm run validate:audio-packs
npm run audit:speech
npm test
npm run typecheck
npm run build:web
```

## Nu slăbi aceste contracte

### Audio

- Web Audio bufferizat;
- maximum 48 buffer-e;
- maximum trei decode concurente;
- timeout fetch/decode/playback;
- o singură voce;
- current-release Cache Storage;
- zero `new Audio()`;
- zero voce procedurală de obiect;
- voice/SFX buses și ducking.

### Offline

- controller înainte de Home;
- release commit egal cu HTML;
- toate cache-urile inspectate pentru manifest;
- asset-uri numai din cache-ul release-ului curent sau repair cache-ul curent;
- content type audio;
- corp nenul;
- repair same-origin;
- obsolete repair caches excluse;
- fail-closed.

### Persistență

- snapshot emergency înainte de IndexedDB;
- token generation-safe;
- timeout open/write/bootstrap;
- fallback local;
- deep sanitization;
- Preview Mode fără mutații.

### Input/runtime

- `inert` în timpul vocii;
- excepție numai go/no-go;
- feedback înainte de tranziție;
- cleanup izolat;
- speech stop la background;
- fără dublarea instrucțiunii.

### Build

`npm run build:web` trebuie să confirme:

- release identity;
- tree;
- lockfile hash;
- Node;
- shell sub 100 KiB gzip;
- 15 chunk-uri P0 precached;
- toate clipurile startup precached.

---

# 4. Browser baseline

```bash
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
```

Inspectează snapshot-urile înainte de actualizare.

Nu accepta:

- regenerare globală fără review;
- timeout mărit pentru a ascunde deadlock;
- scoaterea aserțiunilor offline;
- eliminarea testelor Preview Mode;
- dezactivarea Axe;
- skip nou fără justificare.

După orice remediere:

```bash
for i in 1 2 3; do
  npm run check:v2-runtime || exit 1
  npm run typecheck || exit 1
  npm run build:web || exit 1
  npm run test:web -- --project chromium-touch || exit 1
done
```

---

# 5. Porți speciale de release

## Toate jocurile

```bash
npm run test:web:all-games
```

Verifică:

- toate cele 15 jocuri ajung la ready;
- exact un canvas;
- `data-progress-mode=preview`;
- Home eliberează tot;
- zero pageerror.

## Continuous trace

```bash
npm run test:web:trace-touch
```

## Benchmark sintetic

```bash
npm run test:web:performance
```

## High-stage contracts

Auditul final cere teste suplimentare pentru stage-urile maxime. Implementează
minimum un high-stage layout și un high-stage completion per arhetip:

- choice 8;
- sort 12/4;
- spatial 10;
- sequence 6+3;
- count 20;
- peek 9;
- go/no-go 16;
- hybrid 6/2/delay;
- trace 13 puncte.

Nu duplica testele pentru fiecare skin dacă același renderer este autoritar.

---

# 6. Preview Mode — verificare obligatorie

Înainte de preview salvează profilul complet. Completează și abandonează preview-uri.
După fiecare compară:

- attempts;
- sessions;
- sessionLocked;
- mastery;
- progress;
- difficulty;
- timesPlayed.

Trebuie să fie identice.

Verifică și Preview Mode când sesiunea copilului este deja locked; preview-ul nu
poate debloca sesiunea.

---

# 7. Persistență și recovery

Rulează/verifică:

- migration v1/v2/v3;
- profil parțial corupt;
- emergency snapshot;
- confirmare veche vs snapshot nou;
- IndexedDB blocked;
- write timeout;
- fallback;
- quota/storage unavailable;
- export după flush;
- delete complet.

După ce toate testele sunt verzi, recomandarea arhitecturală este să elimini API-ul
istoric de scriere din `storage.ts` și să păstrezi o singură cale de write.

---

# 8. Test offline/update pe dispozitiv

Nu folosi producția. Publică un staging temporar numai după porțile locale.

## Clean install

1. șterge instalarea/cache-ul;
2. deschide online;
3. măsoară timpul până la ready;
4. notează cache size și pack size;
5. force stop;
6. airplane mode;
7. redeschide;
8. joacă toate cele trei jocuri golden.

## Repair

1. șterge un clip obligatoriu;
2. confirmă fail-closed;
3. repară online;
4. force stop;
5. airplane mode;
6. redă exact clipul reparat.

## Update

1. păstrează buildul vechi instalat;
2. creează progres;
3. publică buildul candidat pe staging;
4. verifică activarea la Splash;
5. verifică update amânat în joc;
6. verifică progresul;
7. verifică eliminarea cache-urilor vechi.

## Suspend/resume

Testează în:

- instrucțiune;
- drag;
- feedback;
- tween;
- Parent preview.

---

# 9. Măsurători dispozitiv

Înregistrează:

- dispozitiv;
- Android/iOS;
- browser/WebView;
- viewport/DPR/refresh;
- timp clean install;
- timp cold start offline;
- Cache Storage total;
- bytes per pack;
- memorie baseline;
- memorie după 30 clipuri;
- decoded cache size;
- FPS;
- frame p95;
- input p95;
- long tasks;
- canvas/layers/nodes după 5 cicluri;
- erori console/network.

Bugete și criterii: `docs/12-roadmap.md`, R6.

---

# 10. Audio

Rulează și păstrează raportul:

```bash
npm run audit:speech
```

Golden-slice:

- orice cue lipsă este P0;
- hexagonul necesită clip real înainte de pilot;
- nu inventa ID-uri;
- nu activa TTS remote;
- nu face tot pachetul Higgs înainte de copy freeze.

`audit:speech:strict` devine poartă după migrarea suprafeței publicate.

---

# 11. Documentare după validare

Actualizează:

1. `docs/17-final-audit-2026-07-29.md` — rezultate reale;
2. `docs/12-roadmap.md` — bife, măsurători și blocaje;
3. `tasks/20-v2-server-handoff.md` — numai dacă procedura se schimbă;
4. ADR — numai dacă se schimbă decizia tehnică;
5. PR body — SHA, rezultate și verdict.

Nu rescrie auditul ca „GO” dacă lipsesc dispozitivul, accesibilitatea sau pilotul.

---

# 12. GitHub Actions

Workflow-ul `Validate architecture and content` este manual.

Îl lansezi o singură dată după:

- toate comenzile locale verzi;
- full-catalog verde;
- high-stage contracts verzi;
- worktree curat.

Nu reactiva `pull_request`/`push` fără aprobarea ownerului.

---

# 13. Livrabilele agentului de validare

Predă:

- `VALIDATION-REPORT.md` cu toate comenzile și outputurile;
- lista commiturilor de remediere;
- screenshot diff review;
- high-stage test matrix;
- offline/update report;
- performance/memory report;
- accessibility report;
- lista problemelor rămase P0/P1/P2;
- verdict clar: GO sau NO-GO;
- fără merge dacă verdictul nu este GO.

---

# 14. Criterii pentru instalarea finală pe server

Instalarea finală începe numai după R0–R11 din roadmap.

Obligatoriu:

- toate comenzile verzi;
- high-stage coverage;
- current-release offline cache;
- repair + offline playback;
- update real;
- zero pierdere de date;
- Preview Mode fără mutații;
- performanță în buget;
- audio golden aprobat;
- TalkBack/VoiceOver manual;
- pilot fără P0;
- workflow manual verde;
- rollback pregătit.

Până atunci, branch-ul și PR-ul rămân Draft/NO-GO.
