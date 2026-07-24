# Game archetypes and logic contracts

Eighty game families map to a smaller set of reusable logic engines.

## 1. Visual choice

Input:

- target item;
- candidate items;
- optional shared attribute;
- target cue policy.

Correctness:

- selected ID equals target ID or matches the required attribute set.

Hints:

1. replay target;
2. dim one impossible distractor;
3. reduce choice count.

Used by identical match, shadow, odd-one-out, search, missing piece and orientation.

## 2. Sort

Input:

- items with semantic attributes;
- bins representing attribute values;
- one or two active rules.

Correctness:

- every item is in a compatible bin.

Hints:

1. highlight one example pair;
2. announce/show active rule;
3. reduce bins/items.

Rule-switch variant keeps trial history and changes the active attribute on a clear cue.

## 3. Memory hide/location

Input:

- object-location mapping;
- preview duration;
- delay;
- optional swap/removal.

Correctness:

- selected object/location matches the stored mapping or detected change.

Hints:

1. replay preview;
2. reveal one anchor;
3. reduce locations/delay.

## 4. Memory sequence

Input:

- symbol/sound set;
- generated sequence;
- presentation interval;
- recall mode.

Correctness:

- ordered replay matches sequence.

Hints:

1. replay at slower speed;
2. reveal first element;
3. reduce span by one.

No speed score.

## 5. Go/no-go and stop signal

Input:

- trial stream;
- active rule;
- go/no-go ratio;
- optional delayed stop.

Correctness:

- tap on go, wait on no-go, or stop motion at signal.

Hints:

1. restate and animate rule;
2. slow pacing;
3. reduce trials/conflict.

Avoid reflex-heavy timing.

## 6. Rule switch

Input:

- two rules;
- switch points;
- visible cue policy;
- conflict items.

Correctness:

- action follows currently active rule.

Hints:

1. display active rule continuously;
2. replay one demonstration;
3. remove conflicts or reduce switches.

## 7. Order and causal sequence

Input:

- ordered step IDs;
- optional distractors;
- story/routine audio.

Correctness:

- chosen sequence equals canonical order, or satisfies explicit causal constraints.

Hints:

1. lock first step;
2. narrate “first/then”;
3. remove distractor/reduce steps.

## 8. Pattern

Input:

- motif family AB/AAB/ABB/ABC/etc.;
- symbols;
- sequence length;
- blank positions.

Correctness:

- inserted symbols reproduce motif rule.

Hints:

1. group motif visually;
2. replay rhythm;
3. return to simpler family.

## 9. Spatial fit/construction

Input:

- pieces and transforms;
- target silhouettes/model;
- snap tolerance.

Correctness:

- transformed pieces cover target within tolerant bounds.

Hints:

1. show matching outline;
2. orient one piece;
3. reduce pieces or disable rotation.

Logic uses geometry/model metadata, not pixel-perfect child motion.

## 10. Gentle maze/planning

Input:

- grid/graph;
- start and goal;
- safe path;
- optional branches.

Correctness:

- path reaches goal without impossible transition.

Hints:

1. highlight next reachable cell;
2. show first segment;
3. reduce branch count/grid.

No lives or falling animations.

## 11. Number choice/comparison

Input:

- target quantity;
- controlled visual groups;
- options;
- optional symbol.

Correctness:

- numerical relation, not total area or object size.

Hints:

1. one-to-one alignment;
2. count aloud with highlights;
3. lower maximum quantity.

## 12. Number operation

Input:

- concrete object transformation;
- operation story;
- result options.

Correctness:

- final set or selected result matches transformation.

Hints:

1. replay object movement;
2. keep manipulatives visible;
3. reduce result/steps.

## 13. Listen choice/language

Input:

- recorded prompt;
- candidate images;
- attribute/category metadata.

Correctness:

- selected candidate satisfies prompt.

Hints:

1. repeat;
2. emphasize one attribute visually;
3. reduce choices.

No microphone.

## 14. Sound/phonology

Input:

- reviewed Romanian words/audio;
- target sound/rhyme;
- candidate words.

Correctness:

- metadata verified by language review.

Hints:

1. slow/repeat target;
2. isolate initial sound or rhyme;
3. increase phonological distance.

## 15. Social scenario

Input:

- context;
- character states;
- response options;
- accepted response set.

Correctness:

- may be one or several acceptable responses.

Hints:

1. name observable cue;
2. ask perspective question;
3. reduce ambiguity.

Do not encode moral certainty where context is ambiguous.

## 16. Trace

Input:

- path geometry;
- tolerance corridor;
- guide strength.

Correctness:

- sufficient path coverage with tolerant deviations.

Hints:

1. animated start direction;
2. widen corridor;
3. shorten path.

Never use pixel-perfect score.

## 17. Open-ended construction

Input:

- parts;
- optional prompt/model;
- constraints.

Correctness:

- none. Completion is child/parent choice.

System may save locally and describe used parts, but may not rank creativity.

## 18. Hybrid task

Input:

- parent instruction;
- safe materials;
- steps;
- adult confirmation.

Correctness:

- parent confirms or simply closes activity.

The phone should become a prompt and then yield attention to the real world.
