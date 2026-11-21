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
