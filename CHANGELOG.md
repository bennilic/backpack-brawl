# Changelog

All notable changes to this project are recorded here, newest first. Format loosely follows [Keep a Changelog](https://keepachangelog.com/). Every pull request adds its entries under **Unreleased** before it is merged.

Categories: `Added`, `Changed`, `Fixed`, `Removed`. Prefix entries with the requirement ID where one applies (B1–B7), and reference the PR number.

## Unreleased

### Added
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

### Changed
- The API server is TypeScript: `server/index.js` and `server/opponents.js` became `.ts` (renamed with `git mv`), started with `node server/index.ts`. No behaviour change.
- `.gitignore` excludes `.claude/settings.local.json` (personal settings).

### Fixed
- B1 | Buying with a full backpack no longer takes gold without delivering the item; the buy button now says "Backpack is full" (PR #3).
