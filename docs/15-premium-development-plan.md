# Plan de dezvoltare premium — „Minte în joacă”

Data: 28 iulie 2026  
Branch: `agent/v2-runtime-reboot`  
Sursă: `docs/14-premium-product-audit.md`

## Obiectiv

Transformarea aplicației dintr-o colecție tehnic avansată de jocuri într-un produs coerent, calm, inteligent și complet offline.

Principiul central:

> Mai întâi trei jocuri excelente într-o lume coerentă; apoi o platformă care le poate extinde fără pierderea calității.

## Reguli de execuție

- fără backend cloud în Child Mode;
- fără cont, analytics remote sau TTS online;
- fără extinderea catalogului înainte de golden slice;
- fără procente psihometrice prezentate adultului;
- fără rescriere nativă Android;
- fiecare etapă se închide prin teste și observație reală;
- documentația și manifesturile trebuie să corespundă codului executat.

# Etapa 0 — Validare branch V2

Prioritate: P0

## Lucrări

1. Integrează controlat `main` dacă a avansat.
2. Rulează:

```bash
npm install
npm run check:v2-runtime
npm run audit:speech
npm test
npm run typecheck
npm run build:web
npm run test:web -- --project chromium-touch
npm run test:web -- --project webkit-touch
```

3. Remediază type/build/test fără eliminarea gardurilor V2.
4. Testează clean install, update, airplane mode și cleanup pe Android.
5. Consemnează timpii și dimensiunea cache-ului.

## Exit

- toate porțile verzi;
- sesiune golden-slice completă în airplane mode;
- zero resurse reziduale după cinci cicluri;
- branch-ul rămâne Draft până la confirmarea dispozitivului.

# Etapa 1 — Simplificarea experienței copilului

Prioritate: P0

## 1.1 Home unic

Înlocuiește combinația actuală `JOACĂ + carduri + hartă` cu:

```text
Lumi + lumea curentă + CONTINUĂ AVENTURA
```

Child Mode nu afișează biblioteca completă.

## 1.2 Harta din prima pornire

- `same-picture`, `sort-by-color`, `inset-puzzle` sunt vizibile din prima zi;
- numai oprirea curentă este activă;
- următoarele sunt vizibile ca traseu, fără lacăte comerciale;
- adultul poate activa manual jocurile în Parent Mode;
- experiența vizuală nu se schimbă radical după unlock.

## 1.3 Metadata fără codul jocului

Generează:

```ts
interface GameMetadata {
  id: string;
  title: string;
  skillId: string;
  ageRange: [number, number];
  iconAssetId: string;
  packId: string;
  status: "available" | "recommended" | "later";
}
```

Home și Parent Mode folosesc metadata. Implementarea jocului se încarcă numai la start.

## Exit

- Home are o singură acțiune principală;
- Parent Mode se deschide fără `loadAllGames()`;
- nici Home nu importă codul tuturor jocurilor deblocate;
- harta este prezentă pentru profil nou;
- snapshot-uri aprobate portrait și landscape.

# Etapa 2 — Backend local V2

Prioritate: P0

## 2.1 Storage schema v5

Adaugă:

- `storageHealth`;
- `lastConfirmedWriteAtLocal`;
- `sessionSequence`;
- câmpurile de evidence necesare;
- metadata content pack;
- migrare tranzacțională v4 → v5.

## 2.2 Persistență durabilă

API țintă:

```ts
saveProfile(snapshot): Promise<WriteResult>
flushProfile(): Promise<void>
storageHealth(): StorageHealth
```

`flushProfile()` se apelează:

- după încercare;
- la final de sesiune;
- la `pagehide`;
- înainte de update/reload controlat.

Parent Mode afișează numai dacă există o problemă reală de stocare.

## 2.3 Validare profundă

- validator complet pentru profile;
- validare attempt/session/mastery/difficulty;
- quarantine pe secțiune invalidă;
- recovery fără resetarea întregului profil;
- fuzz/property tests pentru payload corupt.

## Exit

- kill/restart imediat după nivel nu pierde încercarea;
- fallback-ul plin este detectat;
- recovery testat;
- migrarea păstrează toate datele v4.

# Etapa 3 — Evidence, mastery și unlock V2

Prioritate: P0

## 3.1 Attempt evidence

Persistă local, limitat:

```ts
interface AttemptEvidenceV2 {
  completed: boolean;
  correctFirstTry: boolean;
  correctEventually: boolean;
  wrongAttempts: number;
  hintsUsed: number;
  responseLatencyBand: "fast" | "expected" | "slow" | "unknown";
  instructionRepeats: number;
  selfCorrected: boolean;
  motorAssistUsed: boolean;
  difficultyStageId: string;
  sessionRole: "warmup" | "growth" | "novelty" | "transfer";
}
```

Nu salva coordonate brute sau audio.

## 3.2 Mastery prudent

- păstrează model explicabil;
- evidence weight depinde de independență și dificultate;
- motor assist nu trebuie interpretat ca deficit logic;
- latența este bandă, nu metrică psihometrică absolută;
- recența și confidence sunt separate de scor.

## 3.3 Unlock flexibil

Un joc poate deveni disponibil prin:

- două completări reușite, inclusiv cu suport;
- stăpânire suficientă;
- recomandarea adultului;
- necesitatea de varietate;
- stagnare la jocul curent.

Nu cere perfecțiune și nu bloca întregul produs într-un singur joc.

## Exit

- profil nou vede traseul complet;
- jocurile noi nu necesită trei first-try perfecte;
- regresia de dificultate este posibilă fără rușinare;
- Parent Mode explică motivul recomandării.

# Etapa 4 — Scheduler premium

Prioritate: P1

## 4.1 Model de selecție

Fiecare sesiune scurtă:

1. warmup familiar;
2. obiectiv principal;
3. variație apropiată sau noutate;
4. transfer opțional.

Factorii folosiți:

- lastPracticedAt;
- mastery confidence;
- dificultatea ultimelor încercări;
- abandon;
- tip de interacțiune;
- varietate de domeniu;
- repetare recentă;
- durata sesiunii;
- preferința observată local.

## 4.2 Seed replayable, dar variat

Seed:

```text
profile-local-id-free-state + sessionSequence + date + role
```

Nu folosi numai data calendaristică.

## 4.3 Explicabilitate

Persistă motivul selecției:

- „încălzire familiară”;
- „exersare recomandată”;
- „variație nouă”;
- „activitate împreună”.

Parent Mode poate afișa motivul fără scoruri tehnice.

## Exit

- două sesiuni în aceeași zi nu sunt identice automat;
- nu apar două activități motorii grele consecutiv;
- planul poate fi replayed din seed;
- testele verifică varietate și guardrails.

# Etapa 5 — Golden slice vizual și interactiv

Prioritate: P0/P1

## 5.1 Direcție artistică

Temă recomandată:

```text
Lumi și atelierul mașinuțelor
```

Elemente:

- drum calm;
- garaj;
- atelier de culori;
- masă de forme;
- vehicule-jucărie generice;
- fără mărci externe.

## 5.2 Character bible Lumi

Stări minime:

- idle atent;
- vorbește;
- arată;
- așteaptă;
- oferă indiciu;
- bucurie calmă;
- odihnă.

Fiecare stare are:

- expresie;
- direcția privirii;
- gest;
- durată;
- variantă Reduced Motion;
- reguli când nu trebuie afișată.

## 5.3 Same Picture

- ținta este un obiect din scenă;
- opțiunile sunt obiecte reale din același mediu;
- răspunsul corect unește vizual perechea;
- hint-ul evidențiază atributul comun;
- distractorii sunt validați la dimensiunea reală.

## 5.4 Sort by Color

- coșurile devin zone ale atelierului;
- obiectul rămâne sub deget;
- destinația reacționează înainte de drop;
- snap magnetic;
- numele culorii este scurt și nu blochează inutil;
- batch-urile sunt continuarea aceleiași scene.

## 5.5 Inset Puzzle

- pickup cu shadow;
- target magnetic;
- snap satisfăcător, scurt;
- rotație numai după mastery;
- auto-complete demonstrează mișcarea;
- piese lizibile pe telefon mic.

## Exit

Pentru fiecare joc:

- input-to-visual sub 50 ms;
- 60 FPS pe dispozitiv minim;
- portrait și landscape aprobate;
- TalkBack/VoiceOver manual;
- minimum trei sesiuni observate cu copilul;
- blocajele documentate și remediate.

# Etapa 6 — Audio premium Higgs

Prioritate: P1

## 6.1 Stable prompt IDs

Înlocuiește text lookup cu:

```ts
interface AudioCue {
  id: PromptId;
  textRo: string;
  asset: string;
  durationMs: number;
  leadingSilenceMs: number;
  trailingSilenceMs: number;
  loudnessLufs: number;
  sha256: string;
}
```

## 6.2 Pipeline offline

```text
canonical copy
→ Higgs WAV
→ trim silence
→ loudness normalization
→ clipping check
→ compression
→ human review
→ pack manifest
```

## 6.3 Scope

Ordine:

1. Splash și sesiune;
2. same-picture;
3. sort-by-color;
4. inset-puzzle;
5. feedback comun;
6. restul jocurilor numai după aprobare.

## Exit

- `audit:speech:strict` verde pentru golden slice;
- voce naturală și consistentă;
- fără clipping;
- tăceri măsurate;
- înlocuirea asset-urilor nu modifică runtime-ul.

# Etapa 7 — Parent Mode premium

Prioritate: P1

## Rezumat nou

În loc de procente:

- „Ce a exersat”;
- „Ce pare stabil”;
- „Unde a avut nevoie de ajutor”;
- „Recomandarea următoare”;
- „Activitate fără telefon”.

## Controale

- activează/dezactivează jocuri;
- selectează tema vizuală;
- setează sensibilitatea motorie;
- gestionează content pack-uri;
- vezi starea offline și spațiul ocupat;
- exportă/șterge date;
- pornește o sesiune specială fără modificarea mastery.

## Exit

- nu afișează procente psihometrice;
- recomandările sunt explicabile;
- adultul poate interveni asupra unlock-ului;
- metadata se încarcă fără codul tuturor jocurilor.

# Etapa 8 — Content packs și distribuție

Prioritate: P2

## Pack-uri

```text
core
p0-golden
visual-attention
classification
memory
inhibition
spatial
real-world
```

Fiecare pack are:

- versiune;
- hash;
- mărime;
- jocuri;
- asset-uri;
- audio cues;
- status instalare;
- compatibilitate app/content schema.

## Capacitor opțional

După PWA validată:

- împachetează aceeași aplicație;
- golden pack inclus în APK;
- fără permisiuni suplimentare;
- fără logică nativă duplicată;
- update/rollback documentat.

## Exit

- golden slice funcționează imediat după instalare;
- pack-urile incomplete nu apar în Child Mode;
- repair disponibil din Parent Mode;
- PWA și wrapper folosesc același conținut.

# Etapa 9 — Studio local de dezvoltare

Prioritate: P2

## Funcții

- filtrează catalogul după vârstă/arhetip;
- controlează seed și difficulty;
- rulează preview telefon/tabletă;
- compară layout-uri;
- inspectează metadata și pack-uri;
- audiază prompturile;
- marchează asset-uri aprobate;
- importă exportul local al profilului;
- generează rapoarte QA;
- regenerează snapshot-uri numai cu aprobare explicită.

## Exit

- dezvoltarea jocurilor nu mai necesită editarea manuală a multor fișiere;
- QA vizual/audio este repetabil;
- catalogul, registry-ul și release-ul nu pot diverge;
- serverul personal rămâne tool de build, nu runtime pentru copil.

# Ordinea de lucru recomandată imediat

1. Etapa 0 — validare branch.
2. Metadata manifest + eliminarea `loadAllGames()` din Parent Mode.
3. Home unic și hartă vizibilă din prima pornire.
4. Unlock/storage/evidence V2.
5. Same Picture final.
6. Sort by Color final.
7. Inset Puzzle final.
8. Parent Mode premium.
9. Audio Higgs golden-slice.
10. Pack registry și Capacitor opțional.

Nu începe restul celor 15 jocuri și nu extinde cele 80 de familii înainte de punctul 7.
