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
- **Status:** Proposed (names to be assigned)
- **Requirement:** process (B1–B7)
- **Context:** Two people work in one repository and both must be able to defend the whole solution in the exam. Some requirements change the same files, so the work is split into two clusters that touch different files.
- **Decision:** The requirements are split 50/50 by weight:

  | | Requirements | Weight | Main files |
  |---|---|---:|---|
  | **Person A (name TBD): battle and items** | B3 status effects, B4 item sets and Burn, B2 backpack arrangement | 15 + 20 + 15 = 50% | `battle.ts`, `items.ts`, `types.ts`, `rules.ts`, `BattleView`, `Backpack.tsx` |
  | **Person B (name TBD): run flow and API** | B1 shop economy, B5 matchmaking, B6 save and resume, B7 hall of fame | 10 + 10 + 10 + 20 = 50% | `run.ts`, `game.ts`, `GameProvider`, `api.ts`, `server/`, `docs/API.md`, a new page |

  - Order: Person A does B3, B4, B2. Person B does B1, B5, B6, B7.
  - B3 and B4 stay together because Burn reuses the status mechanism of poison and heal. B5, B6 and B7 stay together because they share the game state and the API.
  - The only overlap is B1 and B2 (`Backpack.tsx`, `run.ts`): B1 is merged first, B2 is rebased on it.
  - Before the exam each person walks the other through their cluster.
- **Reason / trade-offs:** Few shared files means few merge conflicts and clear ownership. The cost is that each person knows the other's cluster less well, which the PR reviews (D-002) and the walkthrough compensate for.
- **Evidence:** PR (to be added), `REQUIREMENTS.md` weights.

## D-005: Co-located `*.test.ts` unit tests with Vitest, written for the requirements
- **Date:** 2026-11-21
- **Status:** Accepted
- **Requirement:** qualitative (G1)
- **Context:** G1 requires unit tests. Vitest is already part of the starter, but the course manuscript does not teach testing (it only names tests as a quality gate in ch. 7 and 11).
- **Decision:**
  - Tests are co-located as `*.test.ts` files next to the code they test, on the server and in the frontend, so they are easy to find.
  - Apart from the examples in the PR that introduces them, unit tests are only written for functionality in `REQUIREMENTS.md`.
  - Examples are marked with the prefix `ex:` in their `describe` name. Tests for a functional requirement carry the prefix `fr<n>:`, where `<n>` is the requirement number (`fr1:` for B1, `fr2:` for B2, and so on).
  - Tests use only `describe`, `it` and `expect` from Vitest. `--passWithNoTests` stays as it is.
- **Reason / trade-offs:** Vitest is already installed and shares the Vite config, so there is no new dependency. Co-location and the prefixes make it visible which tests are examples and which prove a requirement. The cost is that testing goes beyond the manuscript, so the subset is kept small, and that code outside `REQUIREMENTS.md` is not covered on purpose.
- **Evidence:** `src/run.test.ts`, `server/opponents.test.ts`, `README.md` section *Tests*.

## D-006: Write the server in TypeScript and share types with the frontend
- **Date:** 2026-11-21
- **Status:** Proposed (needs agreement on the new dev dependencies, see Rule 1)
- **Requirement:** qualitative (G2); affects B5 and B7
- **Context:** The shape of an opponent is described twice: in `src/types.ts` and, implicitly, in `server/opponents.js`. A mismatch is only found at runtime. B7 adds more shared shapes (a finished run, a hall-of-fame entry).
- **Decision:** The server (`server/`) is migrated to TypeScript. Client and server share their API types through type-only imports (starting with `Opponent`; the hall-of-fame types follow with B7). `server/` is added to the type-check (`tsc -b`). The migration is its own PR and happens before B5 and B7 start, so the two requirements are built on the typed server. Details to settle in that PR: running `.ts` with Node's built-in TypeScript support (and raising the documented Node version) or with a runner, and the dev dependencies `@types/express` and `@types/cors`.
- **Reason / trade-offs:** If an API shape changes, the compiler flags every place that uses it on both sides (manuscript ch. 10). Types are erased at runtime, so the server still validates every incoming request (ch. 10.16, 24.4). The cost is a one-time migration, the new dev dependencies (they add no runtime code) and possibly a higher minimum Node version.
- **Evidence:** PR (to be added).

