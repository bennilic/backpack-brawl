# Changelog

All notable changes to this project are recorded here, newest first. Format loosely follows [Keep a Changelog](https://keepachangelog.com/). Every pull request adds its entries under **Unreleased** before it is merged.

Categories: `Added`, `Changed`, `Fixed`, `Removed`. Prefix entries with the requirement ID where one applies (B1–B7), and reference the PR number.

## Unreleased

### Added
- B1 | Sell items for half their price (rounded down) and reroll the shop for 1 🪙, with buttons that say why an action is not possible, and rules-panel and README texts (PR #3).
- B1 | `fr1:` unit tests for buying, selling, rerolling and the shopping-phase guard.
- Example unit tests `src/run.test.ts` (client) and `server/opponents.test.ts` (API), and a *Tests* section in `README.md` explaining how to run them and the `ex:` / `fr<n>:` naming.
- `DECISIONS.md` entry D-005: co-located `*.test.ts` unit tests with Vitest, written for the requirements.
- `DECISIONS.md` entry D-004: split of the requirements B1–B7 between the team members.
- `QUALITYGOALS.md` with the first quality goal, G1 (unit tests).
- `CHANGELOG.md` and `DECISIONS.md` to track changes and engineering decisions.
- Pull-request based workflow rules in `CLAUDE.md`.
- Exam reference material in `.claude/reference/` (course manuscript, diary guidelines) and project instructions in `CLAUDE.md` (commit `805864a`).

### Changed
- `.gitignore` excludes `.claude/settings.local.json` (personal settings).

### Fixed
- B1 | Buying with a full backpack no longer takes gold without delivering the item; the buy button now says "Backpack is full" (PR #3).
