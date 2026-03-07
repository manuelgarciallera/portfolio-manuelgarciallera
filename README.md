This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Automation

Sync Claude preview file from Downloads into app component:

```bash
npm run sync:preview
```

One-command flow (lint + typecheck + commit + push to current branch) from Git Bash:

```bash
npm run ship -- "feat: refine portfolio visual parity"
```

You can also run it without message and it will auto-generate one based on changed files:

```bash
npm run ship
```

## CI

GitHub Actions runs on every push/PR to `main`:
- lint
- typecheck
- build
