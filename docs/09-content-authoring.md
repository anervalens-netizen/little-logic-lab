# Content authoring guide

## Source of truth

`content/game-catalog.json` defines game families. `content/archetype-presets.json` defines safe starting ranges. Concrete templates live in `content/level-templates/`. Generated one-axis reference ladders live in `content/level-ladders.json` and must be regenerated with `npm run generate:ladders`, not edited manually.

Run:

```bash
npm test
npm run generate
```

## New game checklist

A game definition must include:

- stable kebab-case ID;
- Romanian and English title;
- primary domain and secondary skills;
- minimum entry age;
- archetype;
- one primary learning goal;
- mechanic;
- at least two difficulty axes;
- progression rule;
- safety/UX guardrails;
- co-play prompt;
- offline transfer;
- no reading, microphone, camera or network requirement.

## Learning-goal test

Reject the game when the learning objective cannot be stated in one sentence.

Bad:

- “fun brain development”;
- “attention and memory and math and creativity”.

Good:

- “remember the location of one to four hidden objects”;
- “switch sorting from color to shape when the cue changes”;
- “compare two small quantities while controlling object size”.

## Distractor design

A distractor must be wrong for the intended reason.

Examples:

- visual matching: same category but different defining detail;
- quantity: control total occupied area so “more” is not merely “bigger”;
- category: avoid culturally ambiguous membership;
- sound: verify pronunciation and phonological distance;
- story order: only one intended causal sequence unless the task explicitly allows alternatives.

## Solvability constraints

Generators must assert:

- exactly one correct answer for scored single-choice levels;
- enough content items for all requested bins/options;
- no duplicate IDs;
- path reaches goal;
- memory sequence follows repeat rules;
- pattern has a unique completion;
- no inaccessible color-only distinction;
- all audio keys exist or a visual fallback is defined.

## Content packs

Recommended packs:

- familiar animals;
- vehicles;
- household objects;
- food;
- nature;
- geometric shapes;
- routines;
- emotions;
- safe social scenarios;
- sounds and rhythm.

Use original/licensed art and audio. Do not use branded characters.

## Romanian language review

- use common Romanian words for the target age;
- keep sentences short;
- avoid regional ambiguity when possible;
- verify plural, gender and articles;
- first-sound and rhyme games require native-speaker review;
- do not translate phonological levels mechanically from English.

## Cultural and emotional review

- represent varied families and abilities without making difference the puzzle;
- avoid fear, injury, punishment and shame;
- avoid moralizing ambiguous emotions;
- do not require a child to choose physical affection as the “correct” helping response;
- keep real-world missions physically safe and adult-guided.

## Asset contract

Each asset has:

```json
{
  "id": "cat-gray",
  "assetKey": "animals/cat-gray",
  "label": {"ro": "pisică", "en": "cat"},
  "attributes": {
    "category": "animal",
    "color": "gray",
    "size": "small",
    "shape": "rounded"
  }
}
```

Metadata drives logic; artwork drives presentation. Never infer correctness from filenames or screen position.

## Review status

Add future fields when production authoring starts:

- `draft`;
- `content_reviewed`;
- `language_reviewed`;
- `child_usability_reviewed`;
- `released`;
- reviewer and version;
- source/licensing record.
