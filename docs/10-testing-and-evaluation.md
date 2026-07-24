# Testing and evaluation plan

## Unit tests

Core logic:

- deterministic RNG;
- mastery update;
- abandoned/distress attempts do not count as failure;
- one-axis difficulty changes;
- session composition and uniqueness;
- frustration ladder;
- schema migration;
- content lookup.

Game generators:

- level is deterministic;
- correct answer exists;
- single-choice has exactly one correct answer;
- sort bins cover every item;
- sequence respects constraints;
- pattern completion is unique;
- maze path reaches goal;
- quantities stay within range;
- no banned content requirement.

## Property tests

For many seeds:

- generator never throws for a valid configuration;
- all IDs are unique;
- all referenced assets exist;
- difficulty remains inside band bounds;
- level remains solvable;
- no answer is determined by screen position;
- replay from seed is identical.

## UI tests

- child can complete the flow without reading;
- target sizes meet project minimums;
- touch and drag hit slop;
- orientation and safe areas;
- audio replay;
- audio-off visual equivalence;
- reduced-motion behavior;
- parent gate;
- session cap;
- early stop;
- local delete/export.

## Accessibility tests

- VoiceOver and TalkBack traversal;
- every canvas action has semantic equivalent;
- color-blind simulation;
- high contrast;
- largest system text in parent mode;
- Switch Control/AssistiveTouch where feasible;
- no time-limited control;
- no flashing.

## Privacy/security tests

- airplane-mode completion of all P0 games;
- packet capture shows no runtime egress;
- final manifests have no sensitive permissions;
- dependency scan rejects analytics/ad/attribution SDKs;
- no external link in child mode;
- local data deletion removes profile, events and creations;
- export contains only documented fields.

## Observed child usability sessions

Use very small, parent-supervised pilots. Do not treat these as clinical experiments.

Observe:

- can the child infer the action after one demonstration;
- where taps miss;
- whether decorative motion distracts;
- time before disengagement;
- error response;
- whether parent prompts are usable;
- whether an offline equivalent can be completed;
- whether the session ends calmly.

Stop immediately on distress. Do not pressure completion.

## Evaluation boundaries

The app may evaluate:

- correctness on the current task;
- hint use;
- strategy tags;
- near transfer to a parallel version;
- real-world replication reported by parent.

The app must not infer:

- IQ;
- diagnosis;
- developmental age;
- school readiness;
- personality;
- attention disorder;
- emotional condition.

## Release gates

### P0 alpha

- same-picture vertical slice;
- local profile;
- parent gate;
- no network;
- unit tests pass;
- one physical device per platform.

### P0 beta

- 15 starter games;
- Romanian audio;
- reduced motion;
- local export/delete;
- five or more observed sessions with documented usability fixes;
- privacy manifest audit.

### Store candidate

- complete policy checklist;
- privacy policy;
- dependency/license review;
- accessibility pass;
- child-content review;
- no known crash or unsolvable seed;
- airplane-mode regression suite.
