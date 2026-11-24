# CLAUDE.md

Guidance for Claude Code when working in this repository. This file is committed, so every team member gets the same instructions.

## Project overview

**Backpack Brawl** is a small browser-based inventory auto-battler (React + TypeScript frontend, Express API). The player buys items in a shop, packs them into a 2×3 backpack and watches automatic battles against opponents fetched from a deliberately slow local API. A run lasts up to 3 lives / 5 wins. Full game rules are in `README.md`.

This is the **practical exam** of the course *Advanced Web Engineering* (AWE, CSDC). The starter is playable but incomplete: the team investigates the existing behaviour and extends it according to `REQUIREMENTS.md` (features B1–B7 plus qualitative goals).

- **Team:** Benjamin Lichtenstein, David Uncrut
- **Repo (team, private):** `https://github.com/bennilic/backpack-brawl` → remote `origin`
- **Parent repo (course starter):** `https://github.com/leonardo1710/backpack-brawl` → remote `upstream`
- Course project we learned the concepts on: `https://github.com/bennilic/mystery-road-awe-2026` (vanilla JS → TypeScript → React → backend → WebSockets)

### Stack

React 19, React Router 8, TypeScript (strict), Vite, Tailwind CSS 4, Express 5 (`server/`), Vitest, ESLint. Package manager: pnpm (npm works as well, see `README.md`).

### Commands (run from the repository root)

| Command | Purpose |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Vite frontend (`http://localhost:5174`) and Express API (`http://localhost:4200`) together; Vite proxies `/api` |
| `pnpm server` | API only |
| `pnpm build` | Type-check and production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest, run once (tests live as `*.test.ts` next to the code) |

### Architecture orientation

- Game rules are **plain TypeScript modules without React**; each rule function takes the current state and returns a new one (no mutation): `src/types.ts`, `items.ts`, `shop.ts`, `run.ts`, `battle.ts`, `game.ts`, `rules.ts`, `api.ts`.
- `src/state/` holds the game state for all pages (`GameProvider`, `useGame`) and `RequireRoute` (redirects to the page matching the current phase).
- `src/pages/` one component per screen, `src/components/` presentational parts, `src/App.tsx` routes.
- `server/index.ts` and `server/opponents.ts` implement the local API; the contract is documented in `docs/API.md` (new endpoints must be added there).
- Shop rolls use a seeded RNG stored in the run state: same seed, same offers. Keep everything deterministic.

### Requirements at a glance (details in `REQUIREMENTS.md`)

| ID | Feature | Weight |
|---|---|---:|
| B1 | Shop economy: sell for half price (rounded down), reroll for 1 🪙 | 10% |
| B2 | Backpack arrangement: select, move, swap, cancel | 15% |
| B3 | Status effects: Poison and Heal (≥ 3 items per effect) | 15% |
| B4 | Item sets (≥ 2 sets, one is Fire, ≥ 3 items each) with Burn | 20% |
| B5 | Resilient matchmaking: no duplicate/late/stale searches, error recovery | 10% |
| B6 | Save and resume via browser storage, tolerant of corrupt data | 10% |
| B7 | Hall of fame: validated API endpoints, own page, loading/empty/error states | 20% |

In addition the team must define, document and be able to defend a few **qualitative goals** (non-functionals) and how they are evaluated. Every team member must be able to explain and defend all engineering decisions in the exam.

## Rule 1: Only use concepts from the course

Only use concepts, techniques and APIs that were taught in **either**:

1. the course manuscript `.claude/reference/Advanced_Web_Engineering.pdf` (*Advanced Web Engineering*, Freudenthaler / Winter, v1.0), **or**
2. the course project `mystery-road-awe-2026` (Exercises 1–7).

Covered concepts (non-exhaustive, use the PDF as the source of truth):

| Source | Concepts |
|---|---|
| Manuscript ch. 1–6 | Event loop, scope and closures, values vs. references, mutation, prototypes, DOM events, debugging, ES modules, Promises, `async`/`await`, error flow, cancellation |
| Manuscript ch. 7–11 | Build-first mindset, package managers, Vite, linting/formatting, TypeScript, CI/CD (GitHub Actions) |
| Manuscript ch. 12–14 | Rendering and navigation architectures (SPA/MPA, SSR/CSR), hybrid rendering, state in long-lived applications |
| Manuscript ch. 15–17 | React foundations, component design and routing, state (`useState`, `useReducer`, context), immutable updates, derived state, reactive data flow |
| Manuscript ch. 18–20 | PWA, service workers, caching, offline operation |
| Manuscript ch. 21–22 | Web performance, web accessibility |
| Manuscript ch. 23–25 | WebSockets, multiuser message architecture, reliability and security in real-time apps |
| Mystery-road project | Exercises 1–7: ES modules, bug hunting, Vite/TypeScript/ESLint/Prettier/CI, React components and routing, route and query parameters as URL state, controlled forms, `useReducer`, context, `useEffect` and cleanup, fetch with loading/error/empty states, request races and cancellation, custom hooks, separating UI / application logic / API access, a Node backend, typed WebSocket messages |

How to apply this:

- Before proposing a solution, check that it only uses the concepts above. Prefer the simplest approach that fits them.
- The project's existing dependencies (React, React Router, Tailwind, Express, Vitest, ESLint) are fine. **Do not add new libraries or frameworks** (state libraries, form libraries, data-fetching libraries, UI kits, validation libraries, etc.) without asking the team first.
- If a requirement seems to need something outside the course material, stop and ask. Do not silently introduce it. If it is unavoidable, name the concept, say where the course material falls short, and note it for the diary.
- When explaining a decision, point to the manuscript chapter or exercise it comes from, so the team can defend it in the exam.
- Reading the PDF with the Read tool needs `pdftoppm` (poppler: `brew install poppler` on macOS, `apt-get install poppler-utils` on Linux).

## Rule 2: Keep the work explainable

Every team member must be able to explain and defend all code live. So:

- Prefer small, readable solutions over clever ones. No abstractions that the team cannot explain.
- Keep the existing structure: rule logic stays in pure, React-free TypeScript modules; React components stay presentational where possible.
- Write a test next to each new rule (`*.test.ts`, Vitest). Run `pnpm lint`, `pnpm test` and `pnpm build` before committing.
- Add or update documentation where required (for example `docs/API.md` for new endpoints, the rules panel and tooltips for new mechanics).
- Record qualitative goals and the trade-offs behind them while building (see the diary rule below), not afterwards.

## Rule 3: Development diary (graded)

The team submits **one development diary per team via Moodle before the examination**. It counts towards the combined *Development Process* criterion (10 points) together with Git usage. The official template is `.claude/reference/diary_guidelines.pdf`.

Maintain the diary as `DIARY.md` in the repository root (create it on the first entry) with exactly these sections:

1. **Header**: team members (Benjamin Lichtenstein, David Uncrut) and the repository link.
2. **Development Overview**: how the work was organised, who was responsible for which parts, which requirements were **not** implemented (if any).
3. **Important Decisions**: at least **three** significant decisions, each with context, options, choice and reason.
4. **AI Usage**: how and why AI tools were used during development.
5. **Final Reflection and Lessons learned**: a brief reflection.

Rules for the diary:

- Be concise and focus on meaningful decisions, not a list of every activity. The format is flexible.
- Reference Git commits (short hashes) or other evidence where appropriate.
- Whenever a significant decision is made (architecture, save policy, hall-of-fame ordering, qualitative goals, status-effect values, ...), offer to add it to the diary in the same session.
- Be honest in the AI Usage section: describe what Claude was used for (for example scaffolding, review, tests, explanations) and what the team decided themselves. Do not invent entries; ask the team if unsure.
- Never write secrets or personal data into the diary.

## Rule 4: Git usage (graded together with the diary)

- **Pull-request workflow (mandatory):** never commit or push directly to the default branch (`master`). For every change: create a short-lived branch from an up-to-date `master` (`<type>/<short-description>`, for example `feat/b1-sell-items`, `docs/diary-draft`), commit there, push, and open a pull request against `master`. One PR covers one logical change or requirement. The other team member reviews and approves; the author does not merge their own PR without that review. Claude opens PRs but never merges them. Prefer squash-free merges or keep commits meaningful, since the history is assessed.
- **Every PR must also:** add entries to `CHANGELOG.md` under *Unreleased* (see Rule 5), add an entry to `DECISIONS.md` if it contains a significant decision, and pass `pnpm lint`, `pnpm test` and `pnpm build`.
- Work in small, meaningful commits that each describe one logical change. Commit history is part of the assessment, so avoid giant "everything" commits and avoid rewriting history that is already pushed.
- Suggested commit message format (the team may change it, then update this line): `B<n> | short summary`, for example `B5 | Ignore late opponent responses`. Use `Docs |` or `Chore |` for work outside a requirement.
- Both team members commit under their own Git identity so that contributions are visible.
- Remotes: `origin` is the team repository (`bennilic/backpack-brawl`), `upstream` is the course parent repo (`leonardo1710/backpack-brawl`). Push to `origin` only; never push to `upstream`. Fetch from `upstream` only if the lecturers announce changes to the starter.
- The global rules about Jira, `pj-a0` and `lyra/<ticket>` branch names do not apply to this repository.

## Rule 5: CHANGELOG.md and DECISIONS.md

- `CHANGELOG.md` records every notable change, newest first, under *Unreleased*, with the requirement ID (B1–B7) and PR number where known. Update it in the same PR as the change.
- `DECISIONS.md` records significant decisions using the template at the top of that file (context, options, decision, reasons and trade-offs, evidence). Entries are append-only; a changed decision gets a new entry that supersedes the old one.
- The `DIARY.md` section *Important Decisions* is built from `DECISIONS.md`; keep the two consistent.

## Working together and portability

- David Uncrut needs to be added as a collaborator on the private `bennilic/backpack-brawl` repository to push. Clone with `git clone https://github.com/bennilic/backpack-brawl.git` and add the parent with `git remote add upstream https://github.com/leonardo1710/backpack-brawl.git`.
- Always use **repository-relative paths** in code, docs, scripts and in this file (for example `.claude/reference/diary_guidelines.pdf`). Never write absolute or user-specific paths such as `/Users/<name>/...`; run commands from the repository root.
- `.claude/settings.local.json` is personal and git-ignored. Shared instructions belong in this `CLAUDE.md` and shared reference material in `.claude/reference/`, both committed.
- Coordinate on who works on which requirement (B1–B7) to avoid merge conflicts, and note the split in the diary.
