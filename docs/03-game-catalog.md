# Catalogul jocurilor

Sursa de adevăr este `content/game-catalog.json`. Catalogul conține **80 familii de jocuri**. Fiecare familie este parametrizată prin axe de dificultate și poate genera multe niveluri deterministe din seed-uri și pachete de conținut.

Vârsta stabilește doar punctul inițial. Progresul real se bazează pe răspunsuri, indicii folosite și toleranța copilului.

Legendă priorități: **P0** primul release; **P1** extensie 3–4 ani; **P2** 4–5 ani; **P3** 5–6 ani.

## Percepție vizuală și atenție

| Joc | Intrare recomandată | Mecanică | Axele principale | Prioritate |
|---|---:|---|---|---:|
| **Găsește perechea identică**<br><sub>`same-picture`</sub> | 2 ani și 6 luni – 3 ani | Alege imaginea identică modelului dintre opțiuni. | `choiceCount`, `distractorSimilarity`, `targetCueDuration`, `sceneClutter` | P0 |
| **Potrivește umbra**<br><sub>`shadow-match`</sub> | 2 ani și 6 luni – 3 ani | Potrivește obiectul cu silueta lui. | `choiceCount`, `distractorSimilarity`, `targetCueDuration`, `sceneClutter` | P0 |
| **Aceeași culoare și formă**<br><sub>`color-shape-match`</sub> | 2 ani și 6 luni – 3 ani | Alege obiectul care are aceeași formă și aceeași culoare. | `choiceCount`, `distractorSimilarity`, `targetCueDuration`, `sceneClutter` | P1 |
| **Care este diferit?**<br><sub>`odd-one-out`</sub> | 2 ani și 6 luni – 3 ani | Identifică obiectul care diferă de restul printr-un atribut clar. | `choiceCount`, `distractorSimilarity`, `targetCueDuration`, `sceneClutter` | P1 |
| **Detectivul de imagini**<br><sub>`visual-search`</sub> | 2 ani și 6 luni – 3 ani | Găsește ținta într-o scenă simplă. | `choiceCount`, `distractorSimilarity`, `targetCueDuration`, `sceneClutter` | P1 |
| **Piesa lipsă**<br><sub>`missing-piece`</sub> | 3–4 ani | Alege piesa care completează imaginea. | `choiceCount`, `distractorSimilarity`, `targetCueDuration`, `sceneClutter` | P1 |
| **Micile diferențe**<br><sub>`spot-difference`</sub> | 3–4 ani | Găsește diferențele dintre două scene aproape identice. | `choiceCount`, `distractorSimilarity`, `targetCueDuration`, `sceneClutter` | P2 |
| **Întors sau la fel?**<br><sub>`orientation-match`</sub> | 4–5 ani | Alege forma identică, chiar dacă unele distractoare sunt rotite sau oglindite. | `choiceCount`, `distractorSimilarity`, `targetCueDuration`, `sceneClutter` | P2 |

## Clasificare și reguli

| Joc | Intrare recomandată | Mecanică | Axele principale | Prioritate |
|---|---:|---|---|---:|
| **Coșurile de culori**<br><sub>`sort-by-color`</sub> | 2 ani și 6 luni – 3 ani | Mută obiectele în coșul culorii potrivite. | `itemCount`, `binCount`, `ruleCount`, `ruleCueVisibility` | P0 |
| **Casa formelor**<br><sub>`sort-by-shape`</sub> | 2 ani și 6 luni – 3 ani | Mută cercurile, pătratele și triunghiurile în locul potrivit. | `itemCount`, `binCount`, `ruleCount`, `ruleCueVisibility` | P0 |
| **Mic, mijlociu, mare**<br><sub>`sort-by-size`</sub> | 2 ani și 6 luni – 3 ani | Grupează sau ordonează obiectele după mărime. | `itemCount`, `binCount`, `ruleCount`, `ruleCueVisibility` | P0 |
| **Unde locuiește?**<br><sub>`semantic-sort`</sub> | 2 ani și 6 luni – 3 ani | Sortează animale, vehicule, alimente sau obiecte casnice. | `itemCount`, `binCount`, `ruleCount`, `ruleCueVisibility` | P1 |
| **Aparține grupului?**<br><sub>`belongs-or-not`</sub> | 3–4 ani | Decide dacă obiectul aparține categoriei afișate. | `itemCount`, `binCount`, `ruleCount`, `ruleCueVisibility` | P1 |
| **Două reguli odată**<br><sub>`sort-two-features`</sub> | 3–4 ani | Sortează după combinații, de exemplu roșu și rotund. | `itemCount`, `binCount`, `ruleCount`, `ruleCueVisibility` | P2 |
| **Schimbăm regula**<br><sub>`rule-switch-sort`</sub> | 4–5 ani | Sortează după culoare, apoi după formă când semnalul se schimbă. | `trialCount`, `switchFrequency`, `ruleCueVisibility`, `conflictLevel` | P2 |
| **Poate fi în ambele**<br><sub>`overlapping-categories`</sub> | 5–6 ani | Plasează obiecte în una sau două categorii compatibile. | `itemCount`, `binCount`, `ruleCount`, `ruleCueVisibility` | P3 |

## Memorie de lucru

| Joc | Intrare recomandată | Mecanică | Axele principale | Prioritate |
|---|---:|---|---|---:|
| **Privește și găsește**<br><sub>`peek-and-find`</sub> | 2 ani și 6 luni – 3 ani | Privește un obiect, apoi alege-l după ce este acoperit. | `itemCount`, `delayMs`, `locationCount`, `transformation` | P0 |
| **Perechi ascunse**<br><sub>`pair-memory`</sub> | 2 ani și 6 luni – 3 ani | Întoarce cartonașe pentru a găsi perechi. | `itemCount`, `delayMs`, `locationCount`, `transformation` | P1 |
| **Ce lipsește?**<br><sub>`whats-missing`</sub> | 2 ani și 6 luni – 3 ani | Observă un grup, apoi identifică obiectul dispărut. | `itemCount`, `delayMs`, `locationCount`, `transformation` | P1 |
| **Unde s-a ascuns?**<br><sub>`hidden-location`</sub> | 2 ani și 6 luni – 3 ani | Ține minte sub ce recipient se află obiectul. | `itemCount`, `delayMs`, `locationCount`, `transformation` | P1 |
| **Repetă luminile**<br><sub>`sequence-lights`</sub> | 3–4 ani | Repetă o secvență scurtă de elemente luminoase. | `sequenceLength`, `presentationSpeedMs`, `modalityCount`, `recallMode` | P1 |
| **Ecoul sunetelor**<br><sub>`auditory-sequence`</sub> | 3–4 ani | Ascultă o secvență de sunete și repetă ordinea prin atingere. | `sequenceLength`, `presentationSpeedMs`, `modalityCount`, `recallMode` | P2 |
| **Fă pașii în ordine**<br><sub>`multi-step-directions`</sub> | 3–4 ani | Execută instrucțiuni de două, apoi trei etape. | `choiceCount`, `utteranceLength`, `attributeCount`, `repeatAvailability` | P2 |
| **Grila memoriei**<br><sub>`memory-grid`</sub> | 5–6 ani | Reține pozițiile marcate într-o grilă și reproduce-le. | `itemCount`, `delayMs`, `locationCount`, `transformation` | P3 |

## Control inhibitor și flexibilitate

| Joc | Intrare recomandată | Mecanică | Axele principale | Prioritate |
|---|---:|---|---|---:|
| **Așteaptă semnalul**<br><sub>`wait-for-go`</sub> | 2 ani și 6 luni – 3 ani | Atinge doar după apariția semnalului clar. | `trialCount`, `goNoGoRatio`, `signalDelayMs`, `ruleComplexity` | P0 |
| **Atinge, nu atinge**<br><sub>`tap-dont-tap`</sub> | 2 ani și 6 luni – 3 ani | Atinge țintele și ignoră obiectul interzis. | `trialCount`, `goNoGoRatio`, `signalDelayMs`, `ruleComplexity` | P1 |
| **Mișcă și îngheață**<br><sub>`freeze-move`</sub> | 2 ani și 6 luni – 3 ani | Mișcă un personaj la muzică și oprește-l la semnal. | `trialCount`, `goNoGoRatio`, `signalDelayMs`, `ruleComplexity` | P1 |
| **Spune opusul**<br><sub>`opposite-day-night`</sub> | 3–4 ani | La soare alege noapte; la lună alege zi. | `trialCount`, `goNoGoRatio`, `signalDelayMs`, `ruleComplexity` | P2 |
| **Încet sau repede**<br><sub>`slow-fast-rule`</sub> | 3–4 ani | Mută obiectul lent sau rapid după semnal, fără cronometru de performanță. | `trialCount`, `goNoGoRatio`, `signalDelayMs`, `ruleComplexity` | P2 |
| **Acum facem altfel**<br><sub>`switch-rule`</sub> | 4–5 ani | Răspunde după o regulă, apoi după alta semnalizată. | `trialCount`, `switchFrequency`, `ruleCueVisibility`, `conflictLevel` | P2 |
| **Culoarea sau forma?**<br><sub>`conflict-cards`</sub> | 5–6 ani | Alege atributul cerut când culoarea și forma sugerează răspunsuri diferite. | `trialCount`, `switchFrequency`, `ruleCueVisibility`, `conflictLevel` | P3 |
| **Oprește pe drum**<br><sub>`stop-signal-path`</sub> | 5–6 ani | Pornește personajul, dar oprește-l când apare semnalul. | `trialCount`, `goNoGoRatio`, `signalDelayMs`, `ruleComplexity` | P3 |

## Secvențe și tipare

| Joc | Intrare recomandată | Mecanică | Axele principale | Prioritate |
|---|---:|---|---|---:|
| **Ce facem întâi?**<br><sub>`daily-order`</sub> | 2 ani și 6 luni – 3 ani | Pune în ordine două-trei imagini dintr-o rutină familiară. | `stepCount`, `distractorCount`, `causalDistance`, `verbalSupport` | P0 |
| **Întâi și apoi**<br><sub>`first-then`</sub> | 2 ani și 6 luni – 3 ani | Alege ce se întâmplă înainte sau după o acțiune. | `stepCount`, `distractorCount`, `causalDistance`, `verbalSupport` | P1 |
| **Continuă modelul**<br><sub>`repeat-pattern-ab`</sub> | 2 ani și 6 luni – 3 ani | Completează modele simple de culori, forme sau obiecte. | `patternLength`, `patternFamily`, `missingPositions`, `modalityCount` | P1 |
| **Povestea în ordine**<br><sub>`story-order`</sub> | 3–4 ani | Aranjează imaginile unei povești scurte. | `stepCount`, `distractorCount`, `causalDistance`, `verbalSupport` | P1 |
| **Ce urmează?**<br><sub>`cause-next`</sub> | 3–4 ani | Alege consecința probabilă a unei acțiuni simple. | `stepCount`, `distractorCount`, `causalDistance`, `verbalSupport` | P2 |
| **Modele AAB, ABB, ABC**<br><sub>`complex-patterns`</sub> | 3–4 ani | Completează modele cu trei elemente sau grupări. | `patternLength`, `patternFamily`, `missingPositions`, `modalityCount` | P2 |
| **Copiază ritmul**<br><sub>`rhythm-copy`</sub> | 3–4 ani | Reproduce un ritm scurt prin atingeri. | `patternLength`, `patternFamily`, `missingPositions`, `modalityCount` | P2 |
| **Drumul din săgeți**<br><sub>`algorithm-arrows`</sub> | 5–6 ani | Ordonează săgeți pentru ca personajul să ajungă la țintă. | `stepCount`, `distractorCount`, `causalDistance`, `verbalSupport` | P3 |

## Raționament spațial și planificare

| Joc | Intrare recomandată | Mecanică | Axele principale | Prioritate |
|---|---:|---|---|---:|
| **Pune forma la loc**<br><sub>`inset-puzzle`</sub> | 2 ani și 6 luni – 3 ani | Potrivește forme mari în decupajele lor. | `pieceCount`, `rotationEnabled`, `outlineSupport`, `similarity` | P0 |
| **Construiește imaginea**<br><sub>`shape-builder`</sub> | 2 ani și 6 luni – 3 ani | Construiește un obiect din 2–5 forme simple. | `pieceCount`, `rotationEnabled`, `modelVisibility`, `symmetry` | P1 |
| **Labirintul blând**<br><sub>`simple-maze`</sub> | 2 ani și 6 luni – 3 ani | Ghidează personajul printr-un traseu fără fundături punitive. | `gridSize`, `branchCount`, `lookaheadSteps`, `movingHazards` | P1 |
| **Alege drumul bun**<br><sub>`route-choice`</sub> | 3–4 ani | Alege ruta care ajunge la țintă sau evită obstacolul. | `gridSize`, `branchCount`, `lookaheadSteps`, `movingHazards` | P2 |
| **Completează oglinda**<br><sub>`symmetry-complete`</sub> | 4–5 ani | Completează jumătatea lipsă a unui model. | `pieceCount`, `rotationEnabled`, `modelVisibility`, `symmetry` | P2 |
| **Tangram după model**<br><sub>`tangram-model`</sub> | 4–5 ani | Reproduce un model folosind forme geometrice. | `pieceCount`, `rotationEnabled`, `modelVisibility`, `symmetry` | P2 |
| **Care se potrivește rotit?**<br><sub>`mental-rotation`</sub> | 5–6 ani | Alege forma care devine identică după rotire. | `pieceCount`, `rotationEnabled`, `outlineSupport`, `similarity` | P3 |
| **Comenzi pe grilă**<br><sub>`grid-commands`</sub> | 5–6 ani | Construiește o secvență de comenzi pe o grilă. | `gridSize`, `branchCount`, `lookaheadSteps`, `movingHazards` | P3 |

## Numerație timpurie

| Joc | Intrare recomandată | Mecanică | Axele principale | Prioritate |
|---|---:|---|---|---:|
| **Dă câte unul**<br><sub>`one-to-one-count`</sub> | 2 ani și 6 luni – 3 ani | Dă fiecărui personaj exact un obiect. | `maxQuantity`, `choiceCount`, `symbolSupport`, `perceptualControl` | P0 |
| **La fel de multe**<br><sub>`quantity-match`</sub> | 2 ani și 6 luni – 3 ani | Potrivește două grupuri cu aceeași cantitate. | `maxQuantity`, `choiceCount`, `symbolSupport`, `perceptualControl` | P1 |
| **Mai multe sau mai puține**<br><sub>`more-less`</sub> | 3–4 ani | Alege grupul cu mai multe, mai puține sau la fel. | `maxQuantity`, `choiceCount`, `symbolSupport`, `perceptualControl` | P1 |
| **Numere în ordine**<br><sub>`number-order`</sub> | 3–4 ani | Așază cantități sau numere în ordine. | `maxQuantity`, `choiceCount`, `symbolSupport`, `perceptualControl` | P2 |
| **Construiește numărul**<br><sub>`make-number`</sub> | 4–5 ani | Alege sau combină grupuri care formează cantitatea cerută. | `maxResult`, `operationSteps`, `manipulativeSupport`, `storyComplexity` | P2 |
| **Mai vin câteva**<br><sub>`object-addition`</sub> | 5–6 ani | Urmărește o poveste cu obiecte adăugate și alege totalul. | `maxResult`, `operationSteps`, `manipulativeSupport`, `storyComplexity` | P3 |
| **Câte au rămas?**<br><sub>`object-subtraction`</sub> | 5–6 ani | Urmărește obiectele care pleacă și alege ce rămâne. | `maxResult`, `operationSteps`, `manipulativeSupport`, `storyComplexity` | P3 |
| **Mai lung, mai greu, egal**<br><sub>`balance-measure`</sub> | 4–5 ani | Compară lungimi, capacități sau balanțe vizuale. | `maxQuantity`, `choiceCount`, `symbolSupport`, `perceptualControl` | P2 |

## Limbaj și raționament social

| Joc | Intrare recomandată | Mecanică | Axele principale | Prioritate |
|---|---:|---|---|---:|
| **Ascultă și găsește**<br><sub>`listen-find`</sub> | 2 ani și 6 luni – 3 ani | Ascultă numele sau descrierea și alege obiectul. | `choiceCount`, `utteranceLength`, `attributeCount`, `repeatAvailability` | P0 |
| **Găsește după indicii**<br><sub>`describe-find`</sub> | 2 ani și 6 luni – 3 ani | Alege obiectul descris prin două-trei atribute. | `choiceCount`, `utteranceLength`, `attributeCount`, `repeatAvailability` | P1 |
| **Cuvinte din aceeași familie**<br><sub>`category-words`</sub> | 3–4 ani | Alege cuvântul sau imaginea din aceeași categorie. | `choiceCount`, `utteranceLength`, `attributeCount`, `repeatAvailability` | P1 |
| **Cu ce sunet începe?**<br><sub>`first-sound`</sub> | 4–5 ani | Potrivește cuvinte care încep cu același sunet. | `choiceCount`, `phonologicalDistance`, `wordLength`, `audioSupport` | P2 |
| **Cuvinte care rimează**<br><sub>`rhyme-match`</sub> | 5–6 ani | Alege cuvântul care rimează cu modelul. | `choiceCount`, `phonologicalDistance`, `wordLength`, `audioSupport` | P3 |
| **Cum se simte?**<br><sub>`emotion-match`</sub> | 2 ani și 6 luni – 3 ani | Potrivește expresia cu emoția sau situația simplă. | `choiceCount`, `contextLength`, `perspectiveCount`, `ambiguity` | P0 |
| **Ce ar ajuta?**<br><sub>`what-helps`</sub> | 3–4 ani | Alege o acțiune de ajutor într-o situație clară. | `choiceCount`, `contextLength`, `perspectiveCount`, `ambiguity` | P2 |
| **Întrebări din poveste**<br><sub>`story-comprehension`</sub> | 4–5 ani | Ascultă o poveste foarte scurtă și răspunde la întrebări. | `choiceCount`, `utteranceLength`, `attributeCount`, `repeatAvailability` | P2 |

## Coordonare și creativitate

| Joc | Intrare recomandată | Mecanică | Axele principale | Prioritate |
|---|---:|---|---|---:|
| **Urmează drumul**<br><sub>`trace-road`</sub> | 2 ani și 6 luni – 3 ani | Urmează un traseu foarte lat cu degetul. | `pathLength`, `pathWidth`, `turnCount`, `guideStrength` | P0 |
| **Mută și potrivește**<br><sub>`drag-and-fit`</sub> | 2 ani și 6 luni – 3 ani | Mută obiecte mari în ținte generoase. | `pieceCount`, `rotationEnabled`, `outlineSupport`, `similarity` | P0 |
| **Unește punctele**<br><sub>`connect-dots`</sub> | 3–4 ani | Unește 3–10 puncte în ordine, cu ghid vizual. | `pathLength`, `pathWidth`, `turnCount`, `guideStrength` | P2 |
| **Mărgele în model**<br><sub>`bead-pattern`</sub> | 3–4 ani | Așază mărgele virtuale după un model. | `patternLength`, `patternFamily`, `missingPositions`, `modalityCount` | P1 |
| **Desenează în oglindă**<br><sub>`mirror-draw`</sub> | 5–6 ani | Completează o linie sau formă simetrică, cu asistență. | `pathLength`, `pathWidth`, `turnCount`, `guideStrength` | P3 |
| **Creatura din forme**<br><sub>`shape-creature`</sub> | 2 ani și 6 luni – 3 ani | Construiește liber personaje din forme; fără scor. | `partCount`, `constraintCount`, `promptSpecificity`, `modelAvailability` | P1 |
| **Construiește o poveste**<br><sub>`story-builder`</sub> | 3–4 ani | Alege personaje, locuri și acțiuni pentru o poveste. | `partCount`, `constraintCount`, `promptSpecificity`, `modelAvailability` | P2 |
| **Atelierul de ritm**<br><sub>`rhythm-maker`</sub> | 3–4 ani | Creează și redă un ritm; poate fi copiat de adult. | `partCount`, `constraintCount`, `promptSpecificity`, `modelAvailability` | P2 |

## Transfer în lumea reală

| Joc | Intrare recomandată | Mecanică | Axele principale | Prioritate |
|---|---:|---|---|---:|
| **Vânătoarea de culori**<br><sub>`real-color-hunt`</sub> | 2 ani și 6 luni – 3 ani | Aplicația oferă o misiune scurtă; adultul și copilul găsesc obiecte în cameră. | `stepCount`, `ruleCount`, `memoryDelaySec`, `parentPromptSupport` | P0 |
| **Comoara din memorie**<br><sub>`memory-treasure`</sub> | 2 ani și 6 luni – 3 ani | Adultul ascunde un obiect în apropiere după o demonstrație. | `stepCount`, `ruleCount`, `memoryDelaySec`, `parentPromptSupport` | P1 |
| **Simon spune, pe bune**<br><sub>`real-simon-says`</sub> | 2 ani și 6 luni – 3 ani | Aplicația propune comenzi, adultul conduce jocul fără ecran. | `stepCount`, `ruleCount`, `memoryDelaySec`, `parentPromptSupport` | P1 |
| **Sortăm prin casă**<br><sub>`home-sort`</sub> | 2 ani și 6 luni – 3 ani | Alegeți o sarcină sigură: șosete, cuburi sau tacâmuri neascuțite. | `stepCount`, `ruleCount`, `memoryDelaySec`, `parentPromptSupport` | P1 |
| **Construiește după model**<br><sub>`build-from-model-real`</sub> | 3–4 ani | Privește un model simplu pe ecran, apoi recreează-l din cuburi. | `stepCount`, `ruleCount`, `memoryDelaySec`, `parentPromptSupport` | P2 |
| **Secvența de mișcări**<br><sub>`movement-sequence`</sub> | 3–4 ani | Aplicația arată 2–5 mișcări, apoi ecranul se stinge pentru reproducere. | `stepCount`, `ruleCount`, `memoryDelaySec`, `parentPromptSupport` | P2 |
| **Descrie și ghicește**<br><sub>`describe-and-guess-real`</sub> | 4–5 ani | Adultul descrie sau ghicește un obiect ales de copil. | `stepCount`, `ruleCount`, `memoryDelaySec`, `parentPromptSupport` | P2 |
| **Harta comorii**<br><sub>`treasure-map-real`</sub> | 5–6 ani | Creați o hartă simplă a unei camere și urmați 3–6 pași. | `stepCount`, `ruleCount`, `memoryDelaySec`, `parentPromptSupport` | P3 |

## Reguli transversale

- Fără clasamente, vieți, streak-uri, loot, reclame sau recompense aleatorii.
- Fără cronometru ca sursă principală de dificultate; viteza poate fi doar o acomodare opțională la 5–6 ani.
- După două erori se adaugă indiciu; după trei se simplifică o singură axă.
- Jocurile deschise și activitățile în lumea reală nu primesc scor.
- Fiecare joc are o extensie offline și o întrebare de co-play.

