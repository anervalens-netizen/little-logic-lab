# Audit premium — produs, frontend și backend local

Data: 28 iulie 2026  
Branch auditat: `agent/v2-runtime-reboot`  
Bază: `3b8f0c92ec49f1098c262d6ed8abba5970ab1651`  
PR: `#1`

## Verdict executiv

Aplicația are o fundație tehnică peste nivelul unui prototip obișnuit: core determinist, IndexedDB cu migrări, PWA offline, React/Pixi, accesibilitate și un catalog bogat. Totuși, produsul nu este încă premium.

Blocajul principal nu mai este numai performanța sau sincronizarea audio. Blocajul este lipsa unei experiențe de produs unificate:

- catalogul și arhitectura sunt mai mature decât experiența copilului;
- Home combină sesiunea automată cu o bibliotecă de jocuri și o hartă parțială;
- cele 80 de familii creează amploare, dar nu profunzime percepută;
- progresul și schedulerul sunt funcționale, dar prea simplificate pentru a părea cu adevărat inteligente;
- Parent Mode afișează date precise vizual, deși modelul din spate oferă doar estimări orientative;
- designul vizual rămâne bazat pe carduri, SVG-uri procedurale și efecte generale, nu pe o lume coerentă;
- pipeline-ul de conținut nu separă suficient metadata, codul jocurilor și asset-urile instalate.

Verdict:

- **GO** pentru validarea tehnică a branch-ului V2;
- **NO-GO** pentru prezentarea aplicației drept produs premium;
- direcția corectă este aprofundarea golden-slice-ului, nu extinderea catalogului.

## 1. Clarificarea „backend-ului”

Aplicația nu are și nu are nevoie de backend cloud în runtime. „Backend-ul” relevant este local și include:

- `packages/core`: generatoare, mastery, dificultate și scheduler;
- `apps/web/src/app`: profil, sesiuni, unlock, content lookup și persistence;
- IndexedDB/localStorage fallback;
- service worker, Cache Storage și content packs;
- pipeline-urile de generare, validare și release;
- viitorul studio local de authoring și QA.

Această alegere este potrivită pentru privacy, latență și utilizare offline. Nu recomand adăugarea unui server online pentru copil, cont, sincronizare cloud sau analytics remote.

## 2. Frontend — ce este bun

### 2.1 Shell și interacțiune

- React este folosit pentru ecrane și semantică, iar PixiJS pentru scene interactive.
- țintele tactile sunt mari;
- există Reduced Motion, contrast și ținte extra-mari;
- overlay-urile DOM păstrează TalkBack/VoiceOver;
- lifecycle-ul Pixi și audio a fost întărit în V2;
- sesiunea are început și final predictibile;
- Parent Mode este separat prin gate.

### 2.2 Principii de produs sănătoase

- fără reclame, cont, push, streak-uri sau recompense aleatorii;
- fără ecrane punitive;
- co-play și transfer în lumea reală;
- sesiuni scurte și blocare după limită;
- voce și asset-uri locale;
- corectitudinea este decisă de logică, nu de animație.

Aceste principii trebuie păstrate integral.

## 3. Frontend — probleme care împiedică nivelul premium

### P0-FE-01 — Home are prea multe modele mentale

Home oferă simultan:

- un buton mare `JOACĂ` pentru sesiunea automată;
- carduri individuale de joc;
- „Aventura lui Lumi” numai după deblocarea a trei jocuri;
- ulterior o secțiune separată „Mai multe jocuri”.

Pentru copil există mai multe acțiuni principale, contrar regulii „un obiectiv pe ecran”. Experiența premium trebuie să aibă o singură intrare dominantă:

```text
Continuă aventura
```

Selectarea manuală a jocurilor trebuie mutată în Parent Mode sau într-o zonă secundară accesibilă adultului.

### P0-FE-02 — Harta premium apare prea târziu

„Aventura lui Lumi” apare numai când toate cele trei jocuri sunt deblocate. Până atunci copilul vede interfața clasică de carduri. Produsul începe deci cu experiența mai slabă și oferă experiența mai coerentă abia ulterior.

Harta trebuie să existe din prima pornire:

- primul nod activ;
- următoarele noduri vizibile, dar calme;
- progresul comunicat prin lume, nu prin ascunderea completă a conținutului;
- fără lacăte agresive sau mecanici de raritate.

### P0-FE-03 — Cardurile domină designul

Designul actual folosește frecvent:

- carduri albe rotunjite;
- borduri colorate;
- umbre mari;
- glass/backdrop blur;
- icon + titlu;
- grile scrollabile.

Acesta este un design de aplicație web prietenos, nu o experiență premium pentru copil. Golden slice-ul trebuie să pară o lume interactivă:

- garaj, drum, atelier, parc sau curte;
- obiectele sunt parte din scenă, nu plasate pe carduri;
- destinațiile sunt elemente ale mediului;
- Lumi reacționează în scenă;
- UI-ul rămâne numai pentru Home, replay și progres minimal.

### P0-FE-04 — Direcția artistică este încă procedurală

Cele 36 de ilustrații procedurale sunt coerente tehnic, dar au expresivitate limitată. Premium necesită:

- character bible pentru Lumi;
- asset bible pentru obiecte și medii;
- contur, lumină, umbre, perspectivă și scară standardizate;
- asset-uri aprobate manual;
- sprite sheets/WebP pentru mișcări recurente;
- SVG numai pentru forme și UI simplu.

Nu trebuie înlocuite toate asset-urile simultan. Se finalizează mai întâi asset-urile celor trei jocuri golden-slice.

### P1-FE-05 — Animația este prea generică

Există `pop-in`, `jelly`, `wiggle`, `happy-jump`, pulse și bob. Acestea creează reacție, dar nu explică întotdeauna mecanica.

Premium motion trebuie să fie semantic:

- perechea se apropie și se unește;
- obiectul sortat călătorește către zona lui;
- piesa de puzzle are pickup, shadow, magnetism și snap;
- schimbarea regulii modifică scena;
- Lumi privește obiectul relevant, nu plutește permanent.

Se elimină motion-ul periferic continuu și efectele care nu adaugă informație.

### P1-FE-06 — Feedback-ul este prea uniform

Politica comună este bună ca siguranță, însă mesajele și efectele sunt prea generale. „Aproape”, glow-ul și lauda finală nu explică întotdeauna strategia.

Fiecare arhetip trebuie să furnizeze feedback specific:

- potrivire: „Uită-te la urechi și la culoare”;
- sortare: „Acesta este roșu; coșul roșu este aici”;
- puzzle: „Rotește colțul spre locul lui”;
- secvență: „Mai întâi ne spălăm, apoi ne îmbrăcăm”.

### P1-FE-07 — Parent Mode este informativ, dar nu decizional

Parent Mode afișează sesiuni, activități, minute și progres, însă nu răspunde suficient la întrebările adultului:

- Ce a fost ușor?
- Unde a ezitat?
- A avut probleme logice sau motorii?
- Ce joc recomandă aplicația data viitoare?
- Ce activitate echivalentă pot face fără telefon?
- Ce pachete sunt instalate offline?

Premium Parent Mode trebuie să ofere concluzii scurte și acțiuni, nu doar contoare.

### P1-FE-08 — Procentele de progres sugerează precizie excesivă

`masteryMean` este transformat în procent și afișat ca meter 0–100. Modelul este util pentru adaptare internă, dar nu justifică o măsurare psihometrică precisă.

Recomandare:

- elimină procentul vizual;
- folosește stări prudente: „în explorare”, „devine stabil”, „pare stăpânit”;
- afișează separat cantitatea de dovezi;
- nu compara abilitățile între ele prin bare cu lungimi aparent exacte.

## 4. Backend local — ce este bun

### 4.1 Core pur și determinist

- generatoarele și reducerele sunt independente de UI;
- seed-ul permite replay;
- dificultatea se schimbă pe o singură axă;
- mastery folosește un model Beta simplu și explicabil;
- schedulerul separă warmup, growth, novelty și transfer;
- datele rămân locale.

### 4.2 Persistență defensivă

- IndexedDB cu fallback local;
- migrare v1/v2/v3 → v4;
- recovery pentru payload invalid;
- queue serială pentru scrieri;
- export și delete;
- profil conservator dacă stocarea eșuează.

## 5. Backend local — probleme pentru nivel premium

### P0-BE-01 — Unlock-ul este prea rigid și liniar

Un joc nou se deblochează numai după trei reușite perfecte, fără hint sau greșeală, în minimum două sesiuni. Această regulă:

- penalizează copilul care învață cu suport;
- poate bloca produsul într-un singur joc;
- face harta cu trei opriri indisponibilă prea mult timp;
- confundă „performanța perfectă” cu „pregătirea pentru varietate”.

Unlock V2 trebuie să folosească:

- completări reușite, inclusiv cu suport;
- toleranță la greșeli;
- interes/abandon;
- varietate minimă;
- posibilitatea adultului de a activa jocuri;
- progres gradual, nu lanț strict.

### P0-BE-02 — Mastery este prea agregat

Modelul actual reduce o încercare la un singur scor derivat din first try, hints și greșeli. Nu separă:

- înțelegerea regulii;
- memoria;
- discriminarea vizuală;
- execuția motorie;
- latența;
- autocorectarea;
- repetarea instrucțiunii;
- dificultatea reală a nivelului.

Pentru premium, mastery nu trebuie să devină complex sau opac, dar trebuie să păstreze dovezi mai relevante:

```text
AttemptEvidence
- taskSuccess
- independence
- responseLatencyBand
- selfCorrection
- motorAssist
- instructionRepeats
- difficultyStage
- confidenceWeight
```

Scorul intern poate rămâne explicabil și prudent.

### P0-BE-03 — Schedulerul nu implementează recență reală

`dueScore` este în principal `1 - masteryMean`. Schedulerul nu folosește suficient:

- data ultimei exersări;
- repetarea recentă a aceluiași arhetip;
- oboseala în sesiune;
- alternarea tap/drag/listen;
- preferința observată;
- activități care au fost abandonate;
- progresul pe aceeași abilitate prin jocuri diferite.

Scheduler premium:

- un warmup familiar;
- un obiectiv principal;
- o variație apropiată;
- un transfer/opțional;
- evită două jocuri motorii grele consecutiv;
- persistă motivul selecției pentru Parent Mode.

### P0-BE-04 — Seed-ul sesiunii este prea predictibil

Planul automat folosește data calendaristică. Mai multe sesiuni în aceeași zi pot repeta aceeași selecție. Seed-ul trebuie să includă un contor local de sesiune sau un ID persistent, păstrând replay-ul.

### P0-BE-05 — Date utile există în contract, dar nu sunt persistate

`AttemptOutcome` permite `responseMs` și `distressSignal`, însă `StoredAttempt` nu le păstrează. Nu sunt păstrate nici:

- repetări ale instrucțiunii;
- drag anulat;
- ajutor motor;
- motivul simplificării;
- rolul jocului în sesiune.

Aceste evenimente trebuie adăugate numai local, în formă agregată și limitată.

### P0-BE-06 — Persistența este fail-silent

Scrierile sunt serializate, dar `saveProfile()` nu oferă confirmare apelantului. Dacă aplicația este închisă imediat, ultima încercare poate rămâne numai în memorie sau în coada de scriere. Eșecurile de IndexedDB/localStorage nu sunt vizibile în Parent Mode.

Necesare:

- `flushProfile()` la final de nivel/sesiune și `pagehide`;
- stare `storageHealth`;
- ultimul snapshot confirmat;
- recovery UI în Parent Mode;
- test de kill/restart după o încercare.

### P1-BE-07 — Validarea profilului este prea superficială

Type guard-ul verifică structura de nivel superior, dar nu validează complet fiecare attempt, session, mastery entry și difficulty scalar. Un payload parțial corupt poate fi acceptat.

Recomandare:

- schemă runtime generată din JSON Schema sau validator TypeScript dedicat;
- migrare tranzacțională;
- quarantining al secțiunii invalide, nu reset total;
- teste property/fuzz pentru profile corupte.

### P1-BE-08 — Parent Mode încarcă toate implementările de joc

`showParentScreen()` folosește `loadAllGames()`. Pentru a afișa titluri și skill-uri, aplicația importă toate chunk-urile jocurilor și codul lor vizual.

Trebuie separat:

```text
GameMetadataManifest  — titlu, skill, icon asset, age, status
GameImplementation    — codul încărcat numai când începe jocul
```

Aceeași separare trebuie aplicată Home. Astfel scad latența, memoria și cuplarea dintre UI și runtime.

### P1-BE-09 — Content pack-urile nu sunt entități explicite

Service worker-ul tratează build-ul aproape monolitic. Premium offline are nevoie de:

- core pack;
- golden-slice pack;
- pachete opționale;
- versiune, hash, mărime și stare instalată;
- instalare/reparare numai din Parent Mode;
- joc indisponibil dacă pack-ul nu este complet local.

Pentru aplicația personală, un wrapper Capacitor poate împacheta golden-slice-ul după validarea PWA, fără rescriere nativă.

### P1-BE-10 — Catalogul este prea larg și conține metadata istorică

Catalogul declară 80 de familii și stări precum `sample_implemented`, în timp ce 15 jocuri sunt deja funcționale. Există și diferențe posibile între `interaction` din catalog și implementarea reală reutilizată.

Necesare:

- status generat din cod/release, nu editat manual;
- verificare contract catalog ↔ registry ↔ renderer;
- eliminarea metadata stale;
- „curated release set” separat de „research backlog”.

## 6. Lipsa unui backend de dezvoltare premium

Nu recomand backend online în aplicația copilului. Recomand însă un **studio local de produs** pentru dezvoltare:

```text
apps/studio
- catalog și ladder browser
- preview la dimensiuni reale
- control seed/difficulty
- comparație portrait/landscape
- audit copy și audio
- stare content pack
- vizualizare evenimente locale exportate
- aprobarea asset-urilor
- generare snapshot-uri numai după review
```

Studio-ul poate rula pe serverul personal și poate produce build-uri statice, fără a deveni dependență runtime.

## 7. Arhitectura țintă premium

```text
apps/child-web
  Child Journey · Session · Parent Gate

apps/studio
  Content authoring · Preview · Audio QA · Pack builder

packages/core
  Generators · reducers · evidence · scheduler

packages/runtime
  RoundTimeline · input · support · cleanup · diagnostics

packages/content
  Metadata · ladders · localized copy · pack manifests

packages/assets
  Lumi · environments · objects · audio registry

packages/storage
  schema · migrations · event aggregation · health · flush
```

Separarea se face gradual. Nu este necesară o restructurare masivă înainte de validarea golden-slice-ului.

## 8. Priorități recomandate

### P0 — înainte de redesign complet

1. Rulează toate porțile tehnice existente.
2. Introdu metadata manifest fără importarea implementărilor.
3. Schimbă unlock-ul liniar/perfect într-un model flexibil.
4. Adaugă `flushProfile`, storage health și validare profundă.
5. Persistă dovezile locale necesare fără analytics remote.
6. Reproiectează Home cu o singură acțiune principală.
7. Harta există din prima zi, nu numai după trei unlock-uri.

### P1 — produs premium golden-slice

1. Finalizează lumea vizuală și character bible.
2. Refă `same-picture`, `sort-by-color`, `inset-puzzle` la standard final.
3. Introdu feedback specific mecanicii.
4. Refă Parent Mode ca recomandări și acțiuni.
5. Mastery/scheduler V2 prudent și explicabil.
6. Audio cu ID-uri stabile și pachet Higgs aprobat.

### P2 — platformă și extensie

1. Content pack registry.
2. Studio local de authoring/QA.
3. Extindere în loturi mici pe arhetipuri validate.
4. Wrapper Capacitor opțional.
5. Testare longitudinală și observație copil–adult.

## 9. Criteriul real de „premium”

Aplicația poate fi considerată premium când:

- copilul intră direct într-o lume coerentă;
- fiecare atingere are răspuns imediat și contextual;
- vocea, Lumi și obiectele par parte din aceeași scenă;
- trei jocuri sunt excelente, nu cincisprezece doar funcționale;
- aplicația alege activitățile cu un motiv explicabil;
- Parent Mode oferă recomandări prudente și utile;
- funcționează complet offline și recuperează elegant erorile;
- asset-urile, copy-ul și audio-ul au review uman;
- observația copilului influențează produsul mai mult decât numărul de funcții.
