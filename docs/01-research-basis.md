# Research basis and claim boundaries

Last reviewed: 24 July 2026.

## Practical conclusions

1. **Screen use must not displace sleep, movement, free play, reading or caregiver interaction.** WHO guidance for ages 2–4 limits sedentary screen time to no more than one hour per day and states that less is better. AAP guidance similarly emphasizes high-quality content, family context and what media crowds out.
2. **Co-use matters.** Adult participation helps connect on-screen symbols to language, objects and actions outside the screen.
3. **Educational design requires more than letters, numbers or bright graphics.** A well-supported framework describes active, engaged, meaningful and socially interactive learning around a clear goal.
4. **Executive function is trainable through practice and interaction, but “brain training” claims require restraint.** Research supports practice effects and sometimes near transfer; convincing broad transfer to intelligence or unrelated academic skills is inconsistent.
5. **Guided play is a useful design model.** Evidence suggests benefits for some early mathematics, shape knowledge and task switching, while results vary across outcomes.
6. **Milestones are for developmental orientation, not diagnosis.** CDC milestones describe what at least 75% of children can do by an age and explicitly are not standardized screening tools.
7. **The safest product architecture minimizes data.** A child-directed offline app can avoid most consent and tracking risks by collecting no online personal data and using no advertising or analytics SDKs.

## Evidence matrix

| Claim | Evidence reading | Product implication |
|---|---|---|
| Ages 2–4: screen time should be limited and should not replace active/social activity | WHO under-5 movement/sedentary/sleep guideline; AAP media guidance | Default short sessions; hard parent-configured cap; no autoplay or retention mechanics |
| High-quality content and co-viewing improve the chance of benefit | AAP “Media and Young Minds”; 2026 AAP co-viewing guidance | Parent prompts, shared play, offline extension after each game |
| Good educational apps are active, engaged, meaningful and socially interactive around a learning goal | Hirsh-Pasek et al., 2015 | Every game has one primary goal; decorative interactions are rejected |
| Executive-function skills develop through interaction and practice | Harvard Center on the Developing Child activity guide | Include inhibition, working memory and flexible-rule games across age bands |
| Working-memory training reliably improves trained/near tasks more than broad intelligence or unrelated skills | Melby-Lervåg, Redick & Hulme, 2016; related transfer reviews | Report specific practice progress; never market “IQ growth” |
| Some newer syntheses find small cognitive-training effects, with age, duration and method as moderators | Birtwistle et al., 2025; computer-training reviews | Treat evidence as mixed; test usability and near transfer, not grand claims |
| Guided play may outperform direct instruction for some math, shape and task-switching outcomes | Skene et al., 2022 | Use child choice plus adult guidance; avoid drill-only flows |
| Development varies by domain and child | CDC milestone framework | Age is initial placement only; adaptation is skill-specific |
| Kids apps should prevent child access to links and purchases and minimize third-party data | Apple Kids Category and Google Play Families policies | Parent gate; no ads, IAP, analytics, identifiers or outbound child links |
| Children receive extra data-protection safeguards in the EU | European Commission GDPR guidance, Article 8/12 | Local-only data, clear parent information, delete/export controls |

## Claim language allowed

Use:

- “exersează memoria vizuală”;
- “practică schimbarea regulii”;
- “dezvoltă familiaritatea cu cantități și secvențe”;
- “oferă activități pentru atenție, clasificare și planificare”;
- “progres observat în sarcini similare”.

Do not use:

- “crește IQ-ul”;
- “face copilul mai inteligent”;
- “accelerează dezvoltarea creierului”;
- “previne tulburări”;
- “diagnostichează întârzieri”;
- “garantează performanță școlară”.

## Source notes

Authoritative and primary sources:

- World Health Organization, *Guidelines on physical activity, sedentary behaviour and sleep for children under 5 years of age* (2019): https://www.who.int/publications/i/item/9789241550536
- American Academy of Pediatrics, *Media and Young Minds* (2016): https://publications.aap.org/pediatrics/article/138/5/e20162591/60503
- HealthyChildren/AAP, *Kids & Screen Time: How to Use the 5 C's of Media Guidance* (updated 2026): https://www.healthychildren.org/English/family-life/Media/Pages/kids-and-screen-time-how-to-use-the-5-cs-of-media-guidance.aspx
- HealthyChildren/AAP, *Why Co-Viewing Is Important* (updated 25 June 2026): https://www.healthychildren.org/English/family-life/Media/Pages/why-co-viewing-is-important-tips-to-share-screen-time-with-your-kids.aspx
- CDC milestone pages for 30 months, 3, 4 and 5 years (updated 2026): https://www.cdc.gov/act-early/milestones/
- Center on the Developing Child at Harvard University, *Enhancing and Practicing Executive Function Skills* (2014): https://developingchild.harvard.edu/resources/handouts-tools/activities-guide-enhancing-and-practicing-executive-function-skills/
- Hirsh-Pasek et al., *Putting Education in “Educational” Apps* (2015): https://pubmed.ncbi.nlm.nih.gov/25985468/
- Melby-Lervåg, Redick & Hulme, *Working Memory Training Does Not Improve Performance on Measures of Intelligence or Other Measures of Far Transfer* (2016): https://doi.org/10.1177/1745691616635612
- Skene et al., *Can guidance during play enhance children’s learning and development?* (2022): https://doi.org/10.1111/cdev.13730
- Birtwistle et al., *Training of Executive Functions in Children: A meta-analysis* (2025): https://doi.org/10.1177/21582440241311060
- Apple App Review Guidelines, Kids Category: https://developer.apple.com/app-store/review/guidelines/
- Google Play Families Policies: https://support.google.com/googleplay/android-developer/answer/9893335
- European Commission, safeguards for children’s data: https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data/are-there-any-specific-safeguards-data-about-children_en

## Uncertainty

The literature differs by intervention quality, child age, dose, adult involvement and outcome measure. The repo therefore implements a conservative interpretation: practice specific abilities, connect them to real-world play, measure only local task performance and avoid causal claims beyond the evidence.
