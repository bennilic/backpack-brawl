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

## D-006: Search ids in the game state instead of aborting requests
- **Date:** 2026-11-23
- **Status:** Accepted
- **Requirement:** B5
- **Context:** The opponent API is slow and can fail. A second click, a failed search followed by a retry, or a new run could let an old answer arrive at the wrong time and start a battle for the wrong round or twice.
- **Options:** (a) Abort the old request with `AbortController`. (b) Give every search an id in the game state and let the pure transitions ignore answers that do not carry the current id. (c) A `useRef` flag in the page only.
- **Decision:** (b), plus a small ref in `ShopPage` that blocks a second click in the same tick. `startSearch` only works in the shop phase and creates `search = { id, round }` (`<gameId>:<n>`). `startBattle` and `searchFailed` apply an answer only while `phase === "searching"` and the id matches. A failure returns the phase to `shop` with the message; an opponent for a different round counts as a failed search.
- **Reason / trade-offs:** The rules stay pure and testable without timers or `fetch`, and a late answer is harmless even if the request itself could not be cancelled. The id contains the run's starting seed, so an answer from an old run cannot match the new run's `1:1`. The cost is that stale requests still run to completion on the server instead of being cancelled (`AbortController`, manuscript ch. 5/6, could be added). Concepts: immutable state updates and derived guards (ch. 15–17), request races (mystery-road exercise).
- **Evidence:** `src/game.test.ts` (`B5:` tests), branch `feat/b5-resilient-matchmaking`.

## D-009: The API server is written in TypeScript and run directly by Node
- **Date:** 2026-11-23
- **Status:** Accepted
- **Requirement:** qualitative (G2)
- **Context:** The frontend is strict TypeScript (manuscript ch. 10), but `server/` was plain JavaScript. The API code (validation, error handling, hall of fame) is exactly where wrong shapes of data cause bugs, and the client and the server should be checked by the same tool.
- **Options:**
  1. **Run the `.ts` files with Node's type stripping** (`node server/index.ts`, Node 24). No build step and no new runtime dependency.
  2. Add `tsx` (or `ts-node`) to run the files. Works on older Node versions, but adds a dependency just to start the server.
  3. Compile the server to `dist/` with `tsc` and run the output. Needs an extra build step and a second output folder in dev.
- **Decision:** Option 1. `server/*.ts` is started with `node server/index.ts`. A separate `tsconfig.server.json` (referenced from `tsconfig.json`) makes `tsc -b` in `pnpm build` type-check the server, and ESLint lints it with Node globals.
- **Reason / trade-offs:**
  - Node only removes the types and does not check them, so `tsc -b` is the real check. Type stripping supports only *erasable* syntax: no `enum`, `namespace` or parameter properties, and relative imports keep the `.ts` extension. `erasableSyntaxOnly` and `allowImportingTsExtensions` in the tsconfig make the compiler enforce this, so a mistake fails the build and not at runtime.
  - Needs Node 24 or newer (it is the version in use here). Old Node versions would need option 2 or 3.
  - Two new **devDependencies**, `@types/express` and `@types/cors`: Express and cors ship no type definitions, the same reason the project already has `@types/react`. They are type-only and add nothing at runtime.
  - This is a pure refactor: no behaviour of the API changed.
- **Evidence:** PR "Chore | Convert the API server to TypeScript", `tsconfig.server.json`, `package.json` (`server` script).

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
- **Evidence:** `server/hallOfFame.ts`, `server/hallOfFame.test.ts`, `docs/API.md`.
## D-007: Save policy: store the run in `localStorage` after every change, resume a search as the shop, replay a battle from its frame
- **Date:** 2026-11-23
- **Status:** Accepted
- **Requirement:** B6
- **Context:** A refresh must continue the run on the matching screen, survive broken saves, and must not become a way to get a free reroll, another opponent, a second result or to dodge a loss.
- **Options:** (a) save only at round boundaries (shop start); (b) save after every state change and resume exactly; (c) additionally treat any refresh during a search/battle as a penalty (e.g. lose a life).
- **Decision:** (b). Saved: phase, run (round, gold, lives, wins, shop seed and offers, backpack) the `gameId` (the run's starting seed, part of every B5 search id) and, in a battle, the opponent and the shown frame. A search in progress is resumed as the shop with `search: null` and `searchCount: 0` (a refresh kills every request in flight, so no answer can arrive; the opponent only depends on the round, nothing was paid, so searching again gives the same opponent). A battle is resumed at the saved frame: the result is not stored but simulated again from backpack and opponent, which is deterministic, so it is the same result; the replay is rebuilt directly from battle.ts because B5's `startBattle` only accepts the answer of a running search for the current round, which a battle saved after its last frame no longer matches; the result is applied to the run exactly once when the last frame is reached, and the already updated run is what gets saved. Saved data is validated field by field (version, types, ranges, known item ids, unique uids, round consistent with wins and lives, phase consistent with the run); anything wrong is deleted and the game starts without a run.
- **Reason / trade-offs:** Saving after every change means a refresh can never undo a purchase, a reroll or the start of a battle, so no free reroll (the seed is saved), no different opponent, no second result and no escaping a loss. Storing only what cannot be recomputed keeps the save small. Cost: the save lives in the player's browser and can be edited, so a determined player can cheat; the validation only guarantees a playable state, not honesty (acceptable for a local game, and the hall of fame validates on the server in B7). Plain `localStorage` and JSON only (ch. 17 state, ch. 18 offline storage).
- **Evidence:** `src/save.ts`, `src/save.test.ts`, `src/state/GameProvider.tsx`.

## D-010: Deterministic Poison and Heal combat rules
- **Date:** 2026-11-26
- **Status:** Accepted
- **Requirement:** B3
- **Context:** B3 requires Poison and Heal effects, but leaves their exact values and timing to the team. The effects must be deterministic and explained in the interface.
- **Options:**
  1. Apply Poison damage every tick or at a fixed interval.
  2. Let Poison stacks decay or keep them until the battle ends.
  3. Use fixed Heal values per item or percentage-based healing.
- **Decision:**
  - One battle tick represents 0.5 seconds.
  - Poison deals 1 HP damage per stack every 4 ticks (2 seconds), ignoring block.
  - Poison stacks accumulate and remain until the battle ends.
  - Poison items add stacks when their individual cooldown expires.
  - Item effects are processed before periodic Poison damage within the same tick.
  - Heal restores a fixed amount of HP, never exceeding the fighter's maximum HP.
  - Three Poison items and three Heal items use different cooldowns and effect values.
- **Reason / trade-offs:** Fixed intervals and values make combat deterministic, easy to test and understandable for players. Permanent Poison stacks make the effect increasingly powerful, but can cause a lot of damage in longer battles. Fixed Heal values are simple and easy to predict but less flexible than percentage-based healing. Poison bypasses block as required by B3.
- **Evidence:** `src/battle.ts`, `src/items.ts`, `src/rules.ts`, `src/components/BattleView.tsx`, `src/battle.test.ts` (3 B3 tests).

## D-012: Two-click backpack arrangement
- **Date:** 2026-11-27
- **Status:** Accepted
- **Requirement:** B2
- **Context:** Players need to move and swap backpack items using a clear interface.
- **Options:** Drag-and-drop or two-click selection.
- **Decision:** Use two-click selection with highlighted destinations and explicit cancellation.
- **Reason / trade-offs:** Simpler to implement, test and explain than drag-and-drop, while meeting all B2 requirements.
- **Evidence:** B2 implementation in `src/run.ts` and `src/components/Backpack.tsx`, four unit tests in `src/run.test.ts`.
## D-011: Item sets and deterministic Burn mechanics

- **Date:** 2026-11-26
- **Status:** Accepted
- **Requirement:** B4
- **Context:** B4 requires at least two item sets with three items each. Set bonuses must activate with at least two matching items and work for both players and opponents. The Fire set must introduce Burn, a deterministic status effect that is stronger and faster than Poison, respects Block and decays over time.
- **Options:**
  1. Increase the Fire set bonus with every additional Fire item, or keep it constant once two items are equipped.
  2. Apply Burn through individual Fire item activations, or periodically through one active Fire set.
  3. Grant Havel's Block bonus once per battle, or on every Havel item activation.
- **Decision:**
  - Two sets were added: **Fire** (Emberlight, Fire Cape, Ghast Fireball) and **Havel** (Havel's Helm, Havel's Armor, Havel's Greatshield).
  - A set becomes active with at least two matching items. Bonuses work identically for players and opponents.
  - **Fire:** An active Fire set applies 2 Burn stacks to the enemy every 4 ticks (2 seconds). The bonus does not increase with a third Fire item.
  - **Burn:** Every 2 ticks (1 second), each Burn stack deals 2 damage. Block absorbs damage first, and one Burn stack decays after each Burn tick.
  - **Havel:** Each Havel item activation grants 2 additional Block while the set is active. The bonus per activation does not increase with a third Havel item.
  - Normal item effects are resolved before Burn & Poison damage within the same tick.
  - Set badges, active bonuses, Burn stacks and combat events are displayed in the interface. Exact values are explained in the rules panel.
- **Reason / trade-offs:**
  - A fixed Fire set bonus makes Burn independent of whether two or three Fire items are equipped. Additional items still contribute their normal effects.
  - Periodic Burn application keeps the mechanic deterministic & easy to test.
  - Burn is more aggressive than Poison but can be absorbed by Block and gradually disappears.
  - Havel's bonus rewards defensive equipment. Additional Havel items can generate more total Block through their individual activations, even though the bonus per activation stays constant.
  - Fixed values & cooldowns simplify implementation & make the combat rules easier to understand.
- **Evidence:** `src/items.ts`, `src/types.ts`, `src/battle.ts`, `src/rules.ts`, `src/components/BattleView.tsx`, `src/components/ItemCard.tsx`, `server/opponents.ts`, `src/battle.test.ts` (B4 tests).
