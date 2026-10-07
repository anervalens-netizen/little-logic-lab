# Review: durable progression and release-bound audio repair

Golden-journey completion is a monotonic local profile flag, preserved independently
of the 500-attempt diagnostic history. Existing profiles derive it from validated
attempts before truncation. Local data deletion still clears the profile.

Audio repair caches include both audio-pack version and HTML release identity.
Legacy or other-release repair caches cannot satisfy readiness. Repair checks the
same-origin release manifest before and after downloads, bypassing precache keys;
a changed release invalidates the repair cache. No progress leaves the device.

Co-play completion remains disabled until its blocking narration finishes.
Browser checks supplement, and do not replace, the physical-device release gates.
