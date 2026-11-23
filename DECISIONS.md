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

## D-007: Save policy: store the run in `localStorage` after every change, resume a search as the shop, replay a battle from its frame
- **Date:** 2026-11-23
- **Status:** Accepted
- **Requirement:** B6
- **Context:** A refresh must continue the run on the matching screen, survive broken saves, and must not become a way to get a free reroll, another opponent, a second result or to dodge a loss.
- **Options:** (a) save only at round boundaries (shop start); (b) save after every state change and resume exactly; (c) additionally treat any refresh during a search/battle as a penalty (e.g. lose a life).
- **Decision:** (b). Saved: phase, run (round, gold, lives, wins, shop seed and offers, backpack) and, in a battle, the opponent and the shown frame. A search in progress is resumed as the shop (the opponent only depends on the round, nothing was paid, so searching again gives the same opponent). A battle is resumed at the saved frame: the result is not stored but simulated again from backpack and opponent, which is deterministic, so it is the same result; the result is applied to the run exactly once when the last frame is reached, and the already updated run is what gets saved. Saved data is validated field by field (version, types, ranges, known item ids, unique uids, round consistent with wins and lives, phase consistent with the run); anything wrong is deleted and the game starts without a run.
- **Reason / trade-offs:** Saving after every change means a refresh can never undo a purchase, a reroll or the start of a battle, so no free reroll (the seed is saved), no different opponent, no second result and no escaping a loss. Storing only what cannot be recomputed keeps the save small. Cost: the save lives in the player's browser and can be edited, so a determined player can cheat; the validation only guarantees a playable state, not honesty (acceptable for a local game, and the hall of fame validates on the server in B7). Plain `localStorage` and JSON only (ch. 17 state, ch. 18 offline storage).
- **Evidence:** `src/save.ts`, `src/save.test.ts`, `src/state/GameProvider.tsx`.
