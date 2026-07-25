# Plan de execuție Codex

Roadmap-ul canonic este `docs/12-roadmap.md`. Acest document definește doar
disciplina de execuție.

## Ordine

1. `tasks/00-stabilization.md`
2. `tasks/01-golden-slice.md`
3. `tasks/02-p0-release.md`
4. `tasks/03-accessibility-privacy-release.md`

Nu se extinde catalogul înainte ca golden slice să treacă porțile din roadmap.

## Flux pentru fiecare livrare

1. Citește `AGENTS.md`, roadmap-ul, arhitectura și task-ul activ.
2. Inspectează codul, conținutul, starea Git și deployment-ul real.
3. Schimbă o singură zonă coerentă.
4. Rulează verificările proporționale, o singură dată pe candidatul final.
5. Verifică exact comportamentul pe runtime-ul livrat.
6. Actualizează numai documentele canonice afectate.
7. Commit, push și deploy din același conținut verificat.

## Poarta locală

```bash
npm test
npm run typecheck
npm run build:web
```

Release candidate-ul adaugă Playwright, offline/update, accessibility și
device performance conform `docs/12-roadmap.md`.
