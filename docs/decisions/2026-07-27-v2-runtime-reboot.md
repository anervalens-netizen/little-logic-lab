# Decizie — V2 runtime reboot

Data: 27 iulie 2026  
Status: implementat pe `agent/v2-runtime-reboot`, necesită validare locală și pe dispozitiv

## Context

PWA-ul era declarat offline-first, dar experiența reală putea porni înainte ca
service worker-ul să controleze pagina și înainte ca întregul precache să fie
activ. Vocea folosea câte un `HTMLAudioElement` nou, iar runtime-urile avansau
prin timere fixe, independent de momentul real în care clipul începea sau se
termina. Efectele și vocea foloseau aceeași magistrală, iar vocile procedurale ale
obiectelor produceau timbre artificiale și suprapuneri.

## Decizie

1. Vocea copilului se redă exclusiv din clipuri locale decodate în
   `AudioBuffer` și reutilizate din cache-ul memoriei.
2. Există o singură redare verbală activă. O replică nouă invalidează complet
   replica veche și callback-urile ei.
3. Timpii vizuali rămân durate minime, dar nicio secvență bazată pe `wait()` nu
   poate continua înainte ca vocea activă să se termine.
4. Vocea și efectele folosesc magistrale separate. SFX sunt reduse automat cât
   timp vocea vorbește.
5. Vocile sintetice procedurale ale obiectelor sunt dezactivate până la existența
   unui pachet audio local revizuit uman.
6. Prima intrare în Home așteaptă un service worker activ, controlul paginii și
   prezența identității release-ului în Cache Storage. Timeout-ul rămâne fallback
   pentru browsere care refuză service worker-ul.
7. Cele trei jocuri golden-slice devin o aventură vizuală comună pe Home, fără a
   elimina accesul la jocurile ulterioare.

## Consecințe

### Pozitive

- instrucțiunile, demonstrațiile și inputul nu se mai suprapun accidental;
- clipurile apropiate pot fi predecodate înaintea unei sesiuni;
- gameplay-ul instalat nu depinde de o conexiune permanentă;
- efectele nu mai concurează cu vocea;
- viitorul export Higgs poate înlocui asset-urile fără schimbarea runtime-ului;
- runtime-urile existente beneficiază de sincronizare prin primitiva comună
  `wait()`.

### Costuri și riscuri

- primul start poate dura mai mult deoarece precache-ul actual include toate cele
  321 de clipuri;
- `wait()` are acum semantică audio-aware și trebuie verificat în toate
  runtime-urile;
- cache-ul de `AudioBuffer` consumă memorie proporțional cu numărul de replici
  preîncărcate; v2 preîncarcă numai instrucțiunile apropiate;
- branch-ul trebuie compilat și testat pe server înainte de merge;
- designul aventurii este primul pass, nu direcția artistică finală.

## Alternative respinse

- continuarea cu `new Audio()` și ajustarea manuală a timeout-urilor;
- TTS online în timpul jocului;
- rescriere Android nativă înainte de stabilizarea produsului;
- păstrarea vocilor procedurale doar pentru că sunt offline;
- adăugarea altor familii de jocuri înainte de validarea celor trei golden-slice.

## Porți de acceptare

- `npm run check:v2-runtime`;
- `npm test`;
- `npm run typecheck`;
- `npm run build:web`;
- `npm run test:web -- --project chromium-touch`;
- pornire online o singură dată, apoi sesiune completă în airplane mode;
- nicio replică activă când apare `data-game-ready="true"`;
- zero resurse audio active după ieșirea din joc;
- audiție umană și pilot copil–adult înainte de release.
