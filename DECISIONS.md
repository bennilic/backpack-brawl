# Decisions

Log of significant engineering and process decisions, newest last. Add an entry whenever the team decides something it would have to defend in the exam (architecture, save policy, hall-of-fame ordering, status-effect values, qualitative goals, ...). The most important entries feed the **Important Decisions** section of `DIARY.md`.

Entries are never deleted. If a decision changes, add a new entry and set the old one to `Superseded by D-xxx`.

## Template

```markdown
## D-xxx: Short title
- **Date:** YYYY-MM-DD
- **Status:** Proposed | Accepted | Superseded by D-xxx
- **Requirement:** B1–B7 / qualitative / process
- **Context:** What problem or question made a decision necessary?
- **Options:** Alternatives considered, briefly.
- **Decision:** What we chose (one line).
- **Reason / trade-offs:** Why, and what we give up. Cite the manuscript chapter or exercise where relevant.
- **Evidence:** PR / commit / test.
```

## D-001: Restrict solutions to course concepts
- **Date:** 2026-11-21
- **Status:** Accepted
- **Requirement:** process
- **Context:** The exam requires each team member to explain and defend everything live.
- **Options:** Free choice of libraries and patterns; or only what the manuscript and the mystery-road exercises taught.
- **Decision:** Only use concepts from the course manuscript or mystery-road Exercises 1–7; no new libraries without team agreement.
- **Reason / trade-offs:** Everything stays explainable and traceable to course material, at the cost of possibly simpler solutions than a library would give.
- **Evidence:** `CLAUDE.md` Rule 1, commit `805864a`.

## D-002: Pull-request based workflow with a protected default branch
- **Date:** 2026-11-21
- **Status:** Accepted
- **Requirement:** process
- **Context:** Git usage is graded together with the diary, and two people work in one repository.
- **Options:** Push directly to the default branch; or short-lived branches merged via reviewed PRs.
- **Decision:** All changes go through a PR from a short-lived branch, reviewed by the other team member. The default branch (`master`, as in the parent repo) is protected where GitHub allows it.
- **Reason / trade-offs:** Visible review history and a green default branch, at the cost of some overhead for small changes.
- **Evidence:** `CLAUDE.md` Rule 4.

## D-003: Repository-relative paths only
- **Date:** 2026-11-21
- **Status:** Accepted
- **Requirement:** process
- **Context:** Both team members work on different machines.
- **Decision:** No absolute or user-specific paths in code, docs or scripts; shared Claude instructions live in committed `CLAUDE.md`, personal settings in the git-ignored `.claude/settings.local.json`.
- **Reason / trade-offs:** Anyone can clone and continue without edits.
- **Evidence:** `CLAUDE.md` "Working together and portability", `.gitignore`.

## D-004: Split the requirements between the team members
- **Date:** 2026-11-21
- **Status:** Accepted
- **Requirement:** process (B1–B7)
- **Context:** Two people work in one repository and both must be able to defend the whole solution in the exam. Some requirements change the same files, so the work is split into two clusters that touch different files.
- **Decision:** The requirements are split 50/50 by weight:

  | | Requirements | Weight | Main files |
  |---|---|---:|---|
  | **Person A (David): battle and items** | B3 status effects, B4 item sets and Burn, B2 backpack arrangement | 15 + 20 + 15 = 50% | `battle.ts`, `items.ts`, `types.ts`, `rules.ts`, `BattleView`, `Backpack.tsx` |
  | **Person B (Benjamin): run flow and API** | B1 shop economy, B5 matchmaking, B6 save and resume, B7 hall of fame | 10 + 10 + 10 + 20 = 50% | `run.ts`, `game.ts`, `GameProvider`, `api.ts`, `server/`, `docs/API.md`, a new page |

  - Order: David (Person A) does B3, B4, B2. Benjamin (Person B) does B1, B5, B6, B7.
  - B3 and B4 stay together because Burn reuses the status mechanism of poison and heal. B5, B6 and B7 stay together because they share the game state and the API.
  - The only overlap is B1 and B2 (`Backpack.tsx`, `run.ts`): B1 is merged first, B2 is rebased on it.
  - Before the exam each person walks the other through their cluster.
- **Reason / trade-offs:** Few shared files means few merge conflicts and clear ownership. The cost is that each person knows the other's cluster less well, which the PR reviews (D-002) and the walkthrough compensate for.
- **Evidence:** PR #2, `REQUIREMENTS.md` weights.

## D-005: Co-located `*.test.ts` unit tests with Vitest, written for the requirements
- **Date:** 2026-11-21
- **Status:** Accepted
- **Requirement:** qualitative (G1)
- **Context:** G1 requires unit tests. Vitest is already part of the starter, but the course manuscript does not teach testing (it only names tests as a quality gate in ch. 7 and 11).
- **Decision:**
  - Tests are co-located as `*.test.ts` files next to the code they test, on the server and in the frontend, so they are easy to find.
  - Apart from the examples in the PR that introduces them, unit tests are only written for functionality in `REQUIREMENTS.md`.
  - Examples are marked with the prefix `ex:` in their `describe` name. Tests for a functional requirement carry the requirement ID from `REQUIREMENTS.md` as prefix (`B1:`, `B2:`, and so on).
  - Tests use only `describe`, `it` and `expect` from Vitest. `--passWithNoTests` stays as it is.
- **Reason / trade-offs:** Vitest is already installed and shares the Vite config, so there is no new dependency. Co-location and the prefixes make it visible which tests are examples and which prove a requirement. The cost is that testing goes beyond the manuscript, so the subset is kept small, and that code outside `REQUIREMENTS.md` is not covered on purpose.
- **Evidence:** `src/run.test.ts`, `server/opponents.test.ts`, `README.md` section *Tests*.

## D-008: Hall of fame order, server-side validation and one submission per run
- **Date:** 2026-11-23
- **Status:** Accepted
- **Requirement:** B7
- **Context:** The hall of fame must rank runs in an order the team defines, reject invalid or implausible data, and never store a run twice. The server stores entries in memory only.
- **Options:**
  1. Trust the client's fields (`outcome`, `score`) and sort by a client-sent score.
  2. The server accepts only raw facts (`wins`, `lives`, `rounds`), checks that they describe a run the game can produce, derives the outcome itself and sorts on those facts.
  3. Replay the whole run on the server (needs seed and every decision; far beyond B7).
- **Decision:** Option 2. Order: victory first, then more wins, then fewer rounds, then more lives left, then the earlier submission. Rank is the position (ties are not shared). Plausibility: victory is `wins = 5` and `lives >= 1`, defeat is `lives = 0` and `wins < 5`, and `rounds = wins + (3 - lives)`. Each run carries a `runId` derived from the finished run state; the server stores a `runId` once (same data again: 200 duplicate, other data: 409) and the client also remembers it, so reloads and retries never create a second entry. Names are limited to 20 characters from letters, digits, spaces and `_ . ' -`; bodies to 2 kB; unknown fields are rejected; at most 1000 entries are kept.
- **Reasons / trade-offs:** The server cannot prove a run really happened (the course material has no signing or replay), so it only rejects what is impossible; a determined player can still submit a perfect-looking fake run. This is accepted for a local, unauthenticated exam app. Against a client-sent score, facts plus a server-side order cannot be gamed by sending a huge number. "Fewer rounds" and "more lives left" mean the same among victories (and rounds are constant among defeats), but both are listed so the rule stays correct if the game rules change. A strict allow-list for names keeps markup out of the stored data in addition to React's escaping. The 1000-entry cap bounds memory; a run that falls off the list can in theory be resubmitted.
- **Hardening after security review:** the API binds to `127.0.0.1` (not all interfaces) and CORS allows only `http://localhost:5174`, so another website or a LAN host cannot write to the hall. The Vite proxy target is `http://127.0.0.1:4200` to match.
- **Evidence:** `server/hallOfFame.js`, `server/hallOfFame.test.ts`, `docs/API.md`.
