# Backpack Brawl API

The local API is a small Express server in `server/index.ts`. It listens on port 4200 (override with the `PORT` environment variable). During Vite development, `/api` is proxied to it, so the frontend uses relative URLs such as `/api/opponents?round=1`. All responses are JSON. Opponents are stateless; only the hall of fame (below) keeps state, in server memory, and loses it on restart. Request bodies are limited to 2 kB. The server listens on `127.0.0.1` only, and browsers may call it cross-origin only from `http://localhost:5174` (the Vite dev server, which proxies `/api`).

## `GET /api/health`

Always answers immediately with status 200:

```json
{ "ok": true, "service": "backpack-brawl" }
```

## `GET /api/opponents`

Returns the opponent for one round of a run. The opponent table lives in `server/opponents.ts`.

### Query parameters

| Parameter | Required | Meaning |
|---|---|---|
| `round` | yes | The 1-based round number. Must be a positive whole number written in digits (`1`, `2`, …). |
| `latency` | no | Response delay in milliseconds, clamped to 0–5000. Defaults to 1200. A value that is not a number falls back to the default. |
| `fail` | no | `fail=true` forces a 503 response (see below). |

### Success — 200

```json
{
  "id": "mossback-hermit",
  "name": "Mossback Hermit",
  "icon": "🐢",
  "hp": 25,
  "items": ["chipped-dagger", "pot-lid"],
  "round": 1
}
```

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable identifier of the opponent |
| `name` | string | Display name |
| `icon` | string | Emoji shown in the battle view |
| `hp` | number | Maximum (and starting) HP |
| `items` | string[] | Item ids from the catalog in `src/items.ts`; the same id may appear several times |
| `round` | number | The round this opponent was requested for (echoes `round`) |

The response matches the `Opponent` type in `src/types.ts`.

The answer is deterministic: the same `round` always returns the same opponent. There is one hand-built opponent per round for rounds 1–7. Every round past the table returns the last opponent with +6 HP per additional round. The table never needs more than 7 rounds (5 wins + 3 lives − 1), and an opponent never carries more than 6 items, the size of the player's 2×3 backpack.

### Errors

Every error response has the shape:

```json
{ "error": "human-readable explanation" }
```

| Status | When | `error` |
|---|---|---|
| 400 | `round` is missing, not a whole number, or less than 1 | `round must be a positive whole number` |
| 503 | `fail=true`, or the server was started with `API_FAIL=true` | `The arena gates are shut. No challenger answered the call.` |

An invalid `round` is reported as 400 even when failure is forced. All responses from this endpoint, errors included, arrive after the configured delay.

## `GET /api/hall-of-fame`

Lists the best runs, best first. Answers immediately.

| Parameter | Required | Meaning |
|---|---|---|
| `limit` | no | How many entries to return, whole number 1–50. Defaults to 10. |

Success — 200:

```json
{
  "entries": [{ "rank": 1, "name": "Ada", "outcome": "victory", "wins": 5, "lives": 2, "rounds": 6 }],
  "total": 1
}
```

`entries` is empty when nothing was submitted yet. `total` is the number of stored runs. An invalid `limit` gives 400 `{ "error": "limit must be a whole number from 1 to 50" }`.

**Order:** victories first, then more wins, then fewer rounds, then more lives left, then the earlier submission. `rank` is the 1-based position in that order (ties are not shared). See `DECISIONS.md` D-008.

## `POST /api/hall-of-fame`

Submits a finished run. Body (JSON, at most 2 kB, no other fields allowed):

```json
{ "runId": "run-4711-9-6-5-2", "name": "Ada", "wins": 5, "lives": 2, "rounds": 6 }
```

| Field | Rule |
|---|---|
| `runId` | string, 8–64 characters from `A-Z a-z 0-9 _ -`. Identifies the run so it can be stored only once. |
| `name` | string, 1–20 characters after trimming (repeated spaces collapse). Letters, digits, spaces and `_ . ' -` only; no control characters or markup. |
| `wins` | whole number 0–5 |
| `lives` | whole number 0–3: lives left at the end |
| `rounds` | whole number: rounds played |

The server accepts only runs the game can produce: either `wins` = 5 and `lives` ≥ 1 (victory), or `lives` = 0 and `wins` < 5 (defeat), and `rounds` must equal `wins + (3 − lives)`. The outcome is derived by the server; clients cannot send one.

| Status | When | Body |
|---|---|---|
| 201 | New run stored | `{ "entry": { …as in the list… }, "rank": 1, "duplicate": false }` |
| 200 | Same `runId` with the same data submitted again; nothing is stored twice | same shape with `"duplicate": true` |
| 400 | Not a JSON object, invalid JSON, unknown field, or a field that breaks the rules above | `{ "error": "…which field and what is allowed…" }` |
| 409 | The `runId` exists with different data | `{ "error": "…" }` |
| 413 | Body larger than 2 kB | `{ "error": "Request body too large (limit 2 kB)." }` |

`rank` is `null` when the hall holds 1000 runs and the new run ranks below all of them (it is accepted but not kept). At most 1000 runs are stored. Duplicate detection (200 / 409) only covers stored runs: a run that missed the cut or was later pushed out of the 1000 is forgotten and can be submitted again.

## Environment variables

| Variable | Effect |
|---|---|
| `PORT` | Port to listen on (default 4200). The Vite proxy expects 4200. |
| `API_LATENCY` | Default delay in milliseconds when a request has no `latency` parameter. |
| `API_FAIL` | `true` makes every opponent request fail with 503. |

Example: `API_FAIL=true pnpm server`.

## Client

`fetchOpponent(round)` in `src/api.ts` performs the request. It resolves with the `Opponent` on success and throws an `Error` carrying the server's `error` text (or a generic message with the status code) for any non-2xx response. When the API is not running, the Vite proxy answers with an error status of its own, which is reported the same way; a network failure rejects as well.

`fetchHallOfFame` and `submitRun` in `src/hallOfFame.ts` call the hall-of-fame endpoints. They throw an `Error` whose message says what failed, why (the server's `error` text, or that the API is unreachable) and what to do next.
