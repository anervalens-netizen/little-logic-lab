# Task 00 — Stabilizare și checkpoint

## Goal

Transformă prototipul local într-un baseline reproductibil înainte de
rescrierea vizuală.

## Required work

1. TypeScript 7 și Vite 8 într-un singur npm workspace/lockfile.
2. Checkpoint Git al prototipului, remote privat și branch curat.
3. Teste Playwright versionate, cu aserțiuni pentru flow, touch și offline.
4. Service worker cu revizii generate și test de upgrade.
5. Attempt events cu seed, ladder stage și content version.
6. Age eligibility și deblocare graduală din catalog.
7. Setări inițiale conservative, inclusiv Reduce Motion.
8. Deploy Cloudflare Pages verificat pe domeniul public.

## Acceptance

```bash
npm test
npm run typecheck
npm run build:web
```

Git commit, production build și deployment trebuie să descrie același conținut.
