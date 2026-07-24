# Release and family-pilot checklist

## Product boundary

- [ ] Store copy claims only specific skill practice.
- [ ] No IQ, diagnosis, treatment or guaranteed-development language.
- [ ] Adult understands that screen use does not replace sleep, movement, free play, reading or interaction.
- [ ] Default session is short and parent-controlled.
- [ ] No streak, leaderboard, lives, loot, autoplay, daily obligation or random reward.

## Content and learning logic

- [ ] Each game has one primary goal.
- [ ] Every scored level has a deterministic correct solution.
- [ ] Generated levels pass solvability/property tests.
- [ ] Difficulty changes one major axis at a time.
- [ ] Distress/abandon is not counted as failure.
- [ ] Open-ended and hybrid activities are unscored.
- [ ] Co-play and offline transfer prompts are available.
- [ ] Romanian prompts have been reviewed by an adult fluent speaker.

## Child UX

- [ ] No reading required.
- [ ] Demonstrations are short, replayable and not looping.
- [ ] Targets are substantially larger than platform minimums for the youngest band.
- [ ] Drag/drop uses forgiving hit zones.
- [ ] Feedback describes the action or strategy, not child identity.
- [ ] No harsh error sound, red failure screen or forced retry.
- [ ] Session has a calm ending and no child-mode continuation after the limit.

## Accessibility

- [ ] VoiceOver and TalkBack usable.
- [ ] Logical focus order.
- [ ] Audio-off equivalent.
- [ ] Meaning not encoded by color alone.
- [ ] Reduce Motion respected.
- [ ] Larger targets/high contrast supported.
- [ ] Tested on small and large screens.

## Privacy and security

- [ ] No account or backend.
- [ ] No analytics, ads, attribution, tracking or crash-reporting SDK.
- [ ] No camera, microphone, location, contacts, photo or notification permission.
- [ ] No production network call; packet check in airplane/online conditions.
- [ ] Child mode has no external links or purchases.
- [ ] Parent gate protects settings, links, export and deletion.
- [ ] Local data export works.
- [ ] Local deletion works and is verified.
- [ ] Logs contain no child name or free text.
- [ ] Backup behavior reviewed.

## Engineering

- [ ] `npm test` passes.
- [ ] Deterministic replay works from game ID + seed + difficulty + content version.
- [ ] Database migrations tested.
- [ ] Corrupt/invalid content fails closed.
- [ ] Missing audio does not crash.
- [ ] Animation failure does not alter correctness.
- [ ] Native manifests and dependency tree reviewed.
- [ ] Privacy policy and store declarations match the binary.

## Observed pilot

- [ ] Parent can stop instantly.
- [ ] Child understands first action from demonstration.
- [ ] No repeated accidental taps caused by layout.
- [ ] Hints help without revealing immediately.
- [ ] At least one offline transfer prompt is usable.
- [ ] Frustration signals trigger simplification or stop.
- [ ] Findings are recorded as usability observations, not developmental judgments.
