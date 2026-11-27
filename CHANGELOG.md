# Changelog

All notable changes to this project are recorded here, newest first. Format loosely follows [Keep a Changelog](https://keepachangelog.com/). Every pull request adds its entries under **Unreleased** before it is merged.

Categories: `Added`, `Changed`, `Fixed`, `Removed`. Prefix entries with the requirement ID where one applies (B1–B7), and reference the PR number.

## Unreleased

### Added

- B4 | Added Fire and Havel item sets with 3 new items each. Set bonuses activate when at least 2 items of the same set are equipped, for both players and opponents.
- B4 | Added deterministic set bonuses: Fire applies 2 Burn stacks every 4 ticks, regardless of whether 2 or 3 Fire items are equipped. Havel grants +2 additional Block per Havel item activation.
- B4 | Added Burn damage and decay: every 2 ticks, each Burn stack deals 2 damage, which is absorbed by Block first. After each Burn tick, 1 stack decays.
- B4 | Added set badges in the shop and battle view, active bonus indicators, Burn counters, combat-log messages, rules and tooltips. Updated opponent equipment and added B4 unit tests.
- B7 | Security hardening: the API binds to `127.0.0.1` and allows CORS only from `http://localhost:5174` (Vite proxy target updated to match); body-parser errors now get accurate messages (invalid JSON, 413, 415, other).
- B7 | Hall of fame: `GET`/`POST /api/hall-of-fame` with server-side validation (types, ranges, name rules, plausibility, unknown fields, 2 kB body limit), duplicate protection per run, a result-page form to save a run (retry without retyping, never twice), and a `/hall-of-fame` page with loading, empty and error states.
- B7 | `B7:` unit tests for validation, ordering, store and client helpers; `docs/API.md` documents the endpoints; `DECISIONS.md` entry D-008.
- B6 | Save and resume: the run is stored in `localStorage` after every change and restored on page load on the matching screen; corrupt, incompatible or impossible saves are discarded and the game starts without a run (`src/save.ts`, `src/state/GameProvider.tsx`).
- B6 | `B6:` unit tests for saving, resuming (shop, search, battle, finished) and rejecting corrupt data.
- `DECISIONS.md` entry D-007: save policy for B6.
- B5 | Resilient matchmaking: every search has an id and a round; only one search can run, and duplicate, late, stale or wrong-round answers are ignored (PR #4).
- B5 | `B5:` unit tests for starting, answering, failing and retrying a search.
- `DECISIONS.md` entry D-006: search ids in the game state instead of aborting requests.
- `QUALITYGOALS.md` goal G2 (type safety across client and server) and `DECISIONS.md` entry D-009 (server in TypeScript run by Node type stripping, no `tsx`).
- `tsconfig.server.json` so `tsc -b` (`pnpm build`) type-checks `server/`; ESLint covers it with Node globals.
- Dev dependencies `@types/express` and `@types/cors` (type-only; Express and cors ship no types, same reason as `@types/react`).
- B1 | Sell items for half their price (rounded down) and reroll the shop for 1 🪙, with buttons that say why an action is not possible, and rules-panel and README texts (PR #3).
- B1 | `B1:` unit tests for buying, selling, rerolling and the shopping-phase guard.
- Example unit tests `src/run.test.ts` (client) and `server/opponents.test.ts` (API), and a *Tests* section in `README.md` explaining how to run them and the `ex:` / `B<n>:` naming.
- `DECISIONS.md` entry D-005: co-located `*.test.ts` unit tests with Vitest, written for the requirements.
- `DECISIONS.md` entry D-004: split of the requirements B1–B7 between the team members.
- `QUALITYGOALS.md` with the first quality goal, G1 (unit tests).
- `CHANGELOG.md` and `DECISIONS.md` to track changes and engineering decisions.
- Pull-request based workflow rules in `CLAUDE.md`.
- Exam reference material in `.claude/reference/` (course manuscript, diary guidelines) and project instructions in `CLAUDE.md` (commit `805864a`).
- B3 | Added Poison and Heal combat effects. Poison stacks, deals damage every 4 ticks and ignores block; Heal restores HP up to the fighter's maximum.
- B3 | Added 3 Poison and 3 Heal items, opponent support, battle status display, combat-log entries, rules and tooltips.
- B3 | Added `B3:` unit tests for poison stacking and block bypass, healing limits and deterministic battle results.


### Changed
- The API server is TypeScript: `server/index.js` and `server/opponents.js` became `.ts` (renamed with `git mv`), started with `node server/index.ts`. No behaviour change.
- `.gitignore` excludes `.claude/settings.local.json` (personal settings).

### Fixed
- B5 | A failed opponent search now returns to a usable shop with an understandable message (before, the shop stayed locked in the searching phase); an unreachable API gets its own message (PR #4).
- B1 | Buying with a full backpack no longer takes gold without delivering the item; the buy button now says "Backpack is full" (PR #3).
