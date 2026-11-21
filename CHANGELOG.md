# Changelog

All notable changes to this project are recorded here, newest first. Format loosely follows [Keep a Changelog](https://keepachangelog.com/). Every pull request adds its entries under **Unreleased** before it is merged.

Categories: `Added`, `Changed`, `Fixed`, `Removed`. Prefix entries with the requirement ID where one applies (B1–B7), and reference the PR number.

## Unreleased

### Added
- Quality goal QG2 (shared types between client and server) in `QUALITYGOALS.md` and `DECISIONS.md` entry D-006 (server in TypeScript).
- Example unit tests `src/run.test.ts` (client) and `server/opponents.test.ts` (API), and a *Tests* section in `README.md` explaining how to run them and the `ex:` / `fr<n>:` naming.
- `DECISIONS.md` entry D-005: co-located `*.test.ts` unit tests with Vitest, written for the requirements.
- `DECISIONS.md` entry D-004: split of the requirements B1–B7 between the team members.
- `QUALITYGOALS.md` with the first quality goal, QG1 (unit tests).
- `CHANGELOG.md` and `DECISIONS.md` to track changes and engineering decisions.
- Pull-request based workflow rules in `CLAUDE.md`.
- Exam reference material in `.claude/reference/` (course manuscript, diary guidelines) and project instructions in `CLAUDE.md` (commit `805864a`).

### Changed
- `.gitignore` excludes `.claude/settings.local.json` (personal settings).
