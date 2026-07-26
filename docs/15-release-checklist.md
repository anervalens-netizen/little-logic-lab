# Release and family-pilot checklist

## Product boundary

- [x] Product copy claims only specific skill practice.
- [x] No IQ, diagnosis, treatment or guaranteed-development language.
- [x] Parent notice states that the app does not replace sleep, movement or free play.
- [x] Default session is short and parent-controlled.
- [x] No streak, leaderboard, lives, loot, autoplay, daily obligation or random reward.

## Content and learning logic

- [x] Each game has one primary goal.
- [x] Every scored level has a deterministic correct solution.
- [x] Generated levels pass solvability/property tests.
- [x] Difficulty changes one major axis at a time.
- [x] Distress/abandon is not counted as failure.
- [x] Open-ended and hybrid activities are unscored.
- [x] Co-play and offline transfer prompts are available.
- [x] Romanian prompt manifest is complete and structurally validated.

## Child UX

- [x] No reading required.
- [x] Demonstrations are short, replayable and not looping.
- [x] Targets are substantially larger than platform minimums for the youngest band.
- [x] Drag/drop uses forgiving hit zones.
- [x] Feedback describes the action or strategy, not child identity.
- [x] No harsh error sound, red failure screen or forced retry.
- [x] Session has a calm ending and no child-mode continuation after the limit.

## Accessibility

- [x] TalkBack semantic traversal and activation verified on Android hardware.
  Home, choice, drag and parent gate expose logical focus; the gate is modal and
  supports long-press keyboard input.
- [ ] VoiceOver and human TalkBack touch-exploration review complete.
- [x] Logical focus order.
- [x] Audio-off equivalent.
- [x] Meaning not encoded by color alone.
- [x] Reduce Motion respected.
- [x] Larger targets/high contrast supported.
- [x] Tested automatically on small and large screens.

## Privacy and security

- [x] No account or backend.
- [x] No analytics, ads, attribution, tracking or crash-reporting SDK.
- [x] No camera, microphone, location, contacts, photo or notification permission.
- [x] No gameplay network call; installed build reloads with network disabled.
- [x] Child mode has no external links or purchases.
- [x] Parent gate protects settings, links, export and deletion.
- [x] Local data export is implemented.
- [x] Local deletion clears IndexedDB and every fallback key.
- [x] Logs contain no child name or free text.
- [x] Backup behavior is documented as manual parent export only.

## Engineering

- [x] `npm test` passes.
- [x] Deterministic replay works from game ID + seed + difficulty + content version.
- [x] Database migrations v1/v2/v3 → v4 are tested.
- [x] Corrupt/invalid content fails closed.
- [x] Missing audio does not crash.
- [x] Animation failure does not alter correctness.
- [x] PWA manifests and dependency tree reviewed.
- [x] Privacy notice matches the PWA; native store declarations are not applicable.

## Physical-device gates

- [x] Android target sustains 60 FPS and input/lifecycle budgets.
  OnePlus 6T/Android 11/Chrome 150: 59,55–59,84 FPS, frame p95 16,8 ms,
  input 5,8–7,3 ms, zero long tasks și zero resurse după cinci cicluri.
- [ ] All 321 Romanian clips pass native-speaker auditory review.

## Observed pilot

- [ ] Parent can stop instantly.
- [ ] Child understands first action from demonstration.
- [ ] No repeated accidental taps caused by layout.
- [ ] Hints help without revealing immediately.
- [ ] At least one offline transfer prompt is usable.
- [ ] Frustration signals trigger simplification or stop.
- [ ] Findings are recorded as usability observations, not developmental judgments.
