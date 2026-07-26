# Safety, privacy and store-compliance baseline

This is an engineering checklist, not legal advice.

## Default privacy posture

The safest design is to avoid collecting or transmitting child data.

V1 requirements:

- no account;
- no backend;
- no third-party analytics;
- no ad SDK;
- no attribution SDK;
- no device fingerprinting;
- no advertising ID;
- no camera, microphone, contacts, photos or location;
- no push notification token;
- no chat, sharing or user-generated online content;
- all progress and creations stored locally;
- optional local name only;
- parent-controlled deletion/export.

## Apple Kids Category

Apple’s current guidance requires a child-focused experience and places external links or purchasing opportunities behind a parental gate. Kids Category apps generally should not include third-party advertising or analytics and should not send personally identifiable or device information to third parties.

Engineering implications:

- no outbound links in child mode;
- parent gate for privacy policy, support and licenses;
- no IAP in v1;
- no ads;
- no third-party analytics;
- privacy policy even when collection is minimal;
- age band selected accurately.

Source: https://developer.apple.com/app-store/review/guidelines/ and https://developer.apple.com/kids/

## Google Play Families

Google Play Families policies require accurate target-audience declarations and restrict transmission of child/device identifiers. Current policy explicitly addresses Android advertising ID, device identifiers and location.

Engineering implications:

- do not request `AD_ID`;
- do not include SDKs that access identifiers;
- do not request location;
- audit merged Android manifest and dependencies;
- publish an accessible privacy policy;
- complete Data Safety accurately;
- test all active release tracks.

Source: https://support.google.com/googleplay/android-developer/answer/9893335

## COPPA

For a commercial child-directed online service that collects personal information from children under 13, COPPA may require notice, verifiable parental consent, security, retention controls and deletion rights.

V1 avoids online collection. If a future version adds cloud sync, accounts, persistent identifiers or third-party services, perform a dedicated legal/privacy review before implementation.

Source: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions

## GDPR and children

EU children receive additional safeguards. When processing based on consent for online services, parental authorization thresholds vary by member state between 13 and 16. Information addressed to children must be clear and accessible.

Data-minimization implications:

- process only what is necessary;
- local-only progress where possible;
- no consent bundling;
- clear parent-facing notice;
- deletion/export;
- privacy by design and default;
- no manipulative privacy choices.

Source: https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data/are-there-any-specific-safeguards-data-about-children_en

## Permission allowlist

Production app should require no sensitive runtime permission.

Expected:

- audio playback: no permission;
- haptics: no permission;
- browser IndexedDB: no permission.

Disallowed unless architecture is formally changed:

- microphone;
- camera;
- precise or approximate location;
- contacts;
- calendars;
- photos/media;
- Bluetooth;
- advertising ID;
- notifications.

## Network policy

- Game content and audio are bundled.
- No production API client.
- Disable remote updates/content in v1.
- CI scans source for `fetch`, `axios`, WebSocket and disallowed SDKs.
- Release test in airplane mode.
- Optional packet capture confirms no runtime egress.

Build tooling may access networks during development; installed child gameplay may not.

## Local data retention

- Attempt events can be summarized after 90 days locally.
- Keep aggregates needed for adaptation.
- Parent can delete immediately.
- No hidden backup. Review iCloud/Android backup behavior and exclude sensitive local files if necessary.
- Do not log child name in console or crash reports.

## Security tests

- parent gate cannot be bypassed by back navigation;
- external link cannot open from child mode;
- app survives malformed local content;
- export requires parent action;
- delete is confirmed twice;
- no sensitive permissions in final manifests;
- dependency audit contains no tracking SDK;
- all gameplay works with network disabled.

## Medical boundary

The app is not a screening, diagnostic or treatment tool. It should advise parents to discuss developmental concerns or lost skills with a pediatric professional rather than interpreting game results.
