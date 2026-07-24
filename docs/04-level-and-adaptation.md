# Level system and adaptive progression

## Why parameterized levels

Hand-authoring hundreds of screens produces repetition, inconsistent difficulty and expensive maintenance. This repo treats a level as:

```text
game definition + content pack + seed + difficulty vector
```

A deterministic generator creates the concrete level. The same seed reproduces the same level for testing, support and replay.

## Difficulty vector

Examples:

```json
{
  "choiceCount": 3,
  "distractorSimilarity": 1,
  "targetCueDuration": 1500,
  "sceneClutter": 1
}
```

```json
{
  "sequenceLength": 3,
  "presentationSpeedMs": 1000,
  "modalityCount": 1,
  "recallMode": "direct_replay"
}
```

Each game lists its axes in `content/game-catalog.json`. Initial ranges by age band are in `content/archetype-presets.json`.

## One-axis rule

Only one major difficulty axis changes after a decision. This makes the child’s response interpretable and avoids sudden jumps.

Example progression for visual matching:

1. 2 very different choices, target remains visible.
2. 3 different choices.
3. 3 choices from the same category.
4. 4 choices.
5. target preview then hidden.
6. mild scene clutter.
7. more similar orientation or details.

Do not increase choice count, similarity and speed simultaneously.

## Mastery representation

The sample core uses a lightweight Beta model per skill:

```text
mean = alpha / (alpha + beta)
```

The prior starts neutral. Each completed attempt contributes fractional evidence:

- clean first-try success: strong positive evidence;
- eventual success with hints: moderate evidence;
- completion after several errors: weak evidence;
- abandoned level or distress: no mastery update.

Distress is not failure data.

The parent UI should display plain descriptions such as “în dezvoltare” or “bine exersat”, not percentages, IQ-like scores or age rankings.

## Advance, hold, simplify

Recommended logic:

### Advance one axis

Require:

- at least three recent clean successes;
- no hints;
- no distress;
- success observed across more than one session when feasible;
- current challenge not already at the age-band safety ceiling.

### Hold

Use when:

- performance is mixed;
- the child uses one hint but completes calmly;
- a mechanic is new;
- confidence is low due to little evidence.

### Simplify

Use when:

- average recent evidence is low;
- hints accumulate;
- two or more consecutive errors occur;
- the child stops engaging;
- motor demands obscure the cognitive target.

Simplification examples:

- reduce choices;
- reveal rule cue;
- widen path;
- reduce memory span;
- replay demonstration;
- remove a distractor;
- return from symbols to concrete objects.

## Frustration ladder

1. First error: neutral, specific feedback.
2. Second error: show one meaningful hint or replay the model.
3. Third error: simplify one axis.
4. Continued difficulty: complete a very easy final action and end the level.
5. Distress signal or parent action: end the session immediately.

No “wrong” buzzer, lost lives, red failure screen or forced retry.

## Session scheduler

Default structure for a short session:

- 1 warm-up task already familiar;
- 1–2 growth tasks near the current challenge point;
- 1 novelty task or new content skin;
- 1 hybrid/offline transfer prompt when the adult is present.

Suggested mix:

```text
60% current challenge
25% spaced review
15% novelty
```

This is a product heuristic, not a clinical rule. Parent settings can make sessions shorter.

The scheduler must:

- avoid repeating the same game twice in a session;
- avoid more than two tasks from the same domain in a row;
- respect audio, motion and motor accommodations;
- end at the configured time even mid-plan;
- never use streak loss or daily deadlines.

## Spaced review

A simple due score can combine:

- time since last practice;
- mastery uncertainty;
- recent difficulty;
- content freshness;
- parent-pinned favorites.

Do not interpret non-use as a deficit. The app should resume with an easy review after long gaps.

## Level-space estimate

Each game has 3–4 major axes with several safe values, plus content packs and deterministic seeds. This produces hundreds of valid combinations per archetype once artwork/audio packs are populated. Generators should enforce constraints so that only meaningful, solvable combinations are emitted.

The goal is not maximum combinatorics. It is varied practice without accidental difficulty spikes.

## Data stored locally

Per skill:

- alpha/beta evidence;
- evidence count;
- last local practice time;
- current difficulty vector;
- recent support needs.

Per attempt:

- game ID;
- seed;
- outcome;
- hints;
- wrong attempts;
- elapsed time bucket;
- simplification used;
- no free-form child text, voice, image or biometric data.
