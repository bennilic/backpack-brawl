/**
 * Hall of fame: validation, ordering and the in-memory store. Everything here is a pure
 * function or a small factory, so it can be tested without starting Express.
 *
 * A finished run is submitted as { runId, name, wins, lives, rounds }. The server derives the
 * outcome itself and only accepts combinations a real run can produce (see `validateRun`).
 */
export const WINS_TO_VICTORY = 5;
export const START_LIVES = 3;
export const NAME_MAX_LENGTH = 20;
export const MAX_STORED_ENTRIES = 1000;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;

const ALLOWED_FIELDS = ["runId", "name", "wins", "lives", "rounds"];
const RUN_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
// Letters, digits, spaces and a few harmless marks. No control characters, no markup characters.
const NAME_PATTERN = /^[\p{L}\p{N} _.'-]+$/u;

/**
 * Validates a request body. Returns `{ run }` with a cleaned copy, or `{ error }` with a
 * message that says which field is wrong and what is allowed. Unknown fields are rejected.
 */
export function validateRun(body) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { error: "Body must be a JSON object with runId, name, wins, lives and rounds." };
  }
  const unknown = Object.keys(body).filter((key) => !ALLOWED_FIELDS.includes(key));
  if (unknown.length > 0) {
    return { error: `Unknown field(s): ${unknown.slice(0, 3).map((key) => JSON.stringify(key.slice(0, 30))).join(", ")}. Allowed: ${ALLOWED_FIELDS.join(", ")}.` };
  }

  if (typeof body.runId !== "string" || !RUN_ID_PATTERN.test(body.runId)) {
    return { error: "runId must be a string of 8-64 letters, digits, '-' or '_'." };
  }
  if (typeof body.name !== "string") return { error: "name must be a string." };
  // Checked on the raw text: trimming or collapsing first would silently turn a newline into a space.
  if (/\p{C}/u.test(body.name)) return { error: "name must not contain control characters or line breaks." };
  const name = body.name.trim().replace(/ +/g, " ");
  if (name.length < 1 || name.length > NAME_MAX_LENGTH) {
    return { error: `name must be 1-${NAME_MAX_LENGTH} characters long (after trimming).` };
  }
  if (!NAME_PATTERN.test(name)) {
    return { error: "name may only contain letters, digits, spaces and the characters _ . ' -" };
  }

  const wins = body.wins;
  const lives = body.lives;
  const rounds = body.rounds;
  for (const [field, value] of [["wins", wins], ["lives", lives], ["rounds", rounds]]) {
    if (!Number.isInteger(value)) return { error: `${field} must be a whole number.` };
  }
  if (wins < 0 || wins > WINS_TO_VICTORY) return { error: `wins must be between 0 and ${WINS_TO_VICTORY}.` };
  if (lives < 0 || lives > START_LIVES) return { error: `lives must be between 0 and ${START_LIVES}.` };

  // A run ends at the 5th win or the 3rd lost life, never both, so only two shapes are possible.
  const isVictory = wins === WINS_TO_VICTORY && lives >= 1;
  const isDefeat = lives === 0 && wins < WINS_TO_VICTORY;
  if (!isVictory && !isDefeat) {
    return { error: `This is not a finished run: it ends with ${WINS_TO_VICTORY} wins and at least 1 life left, or with 0 lives and fewer than ${WINS_TO_VICTORY} wins.` };
  }
  // Every battle is one win or one lost life, so the number of rounds is fixed by wins and lives.
  const expectedRounds = wins + (START_LIVES - lives);
  if (rounds !== expectedRounds) {
    return { error: `rounds is implausible: ${wins} wins and ${lives} lives left means ${expectedRounds} rounds.` };
  }
  return { run: { runId: body.runId, name, wins, lives, rounds } };
}

/** `victory` or `defeat`, derived from validated numbers (never taken from the client). */
export function outcomeOf(run) {
  return run.wins >= WINS_TO_VICTORY ? "victory" : "defeat";
}

/**
 * Sort order of the hall: victories first, then more wins, then fewer rounds, then more lives
 * left, then whoever submitted first. Negative = `a` ranks higher.
 */
export function compareEntries(a, b) {
  const victoryDiff = Number(outcomeOf(b) === "victory") - Number(outcomeOf(a) === "victory");
  if (victoryDiff !== 0) return victoryDiff;
  if (a.wins !== b.wins) return b.wins - a.wins;
  if (a.rounds !== b.rounds) return a.rounds - b.rounds;
  if (a.lives !== b.lives) return b.lives - a.lives;
  return a.sequence - b.sequence;
}

/** Parses `?limit=`; undefined gives the default, anything else must be a whole number 1-MAX_LIMIT. */
export function parseLimit(value) {
  if (value === undefined) return DEFAULT_LIMIT;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const limit = Number(value);
  return limit >= 1 && limit <= MAX_LIMIT ? limit : null;
}

/** What the API shows for an entry: no runId, no internal sequence. */
export function publicEntry(entry, rank) {
  return { rank, name: entry.name, outcome: outcomeOf(entry), wins: entry.wins, lives: entry.lives, rounds: entry.rounds };
}

/** In-memory store. Resubmitting a known runId is idempotent; the same id with other data conflicts. */
export function createHallOfFame(maxEntries = MAX_STORED_ENTRIES) {
  let entries = [];
  let nextSequence = 1;

  return {
    /** Returns `{ status: "created" | "duplicate" | "conflict", entry, rank }`. */
    submit(run) {
      const existing = entries.find((entry) => entry.runId === run.runId);
      if (existing) {
        const isSameRun = ["name", "wins", "lives", "rounds"].every((field) => existing[field] === run[field]);
        return { status: isSameRun ? "duplicate" : "conflict", entry: existing, rank: this.rankOf(existing) };
      }
      const entry = { ...run, sequence: nextSequence++ };
      entries = [...entries, entry].sort(compareEntries).slice(0, maxEntries);
      // A run worse than everything in a full hall is still accepted, but not kept (rank null).
      return { status: "created", entry, rank: this.rankOf(entry) };
    },
    rankOf(entry) {
      const index = entries.indexOf(entry);
      return index === -1 ? null : index + 1;
    },
    top(limit) {
      return entries.slice(0, limit).map((entry, index) => publicEntry(entry, index + 1));
    },
    get size() {
      return entries.length;
    },
  };
}

/**
 * Maps an error thrown by the body parser to the HTTP status and message we send.
 * Only a real parse failure is called "not valid JSON"; 5xx details are never exposed.
 */
export function errorResponseFor(err) {
  const status = typeof err?.status === "number" && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status === 500) return { status, message: "Internal server error." };
  if (status === 413) return { status, message: "Request body too large (limit 2 kB)." };
  if (status === 415) return { status, message: "Request body must be UTF-8 JSON (Content-Type: application/json)." };
  if (err.type === "entity.parse.failed") return { status, message: "Request body is not valid JSON." };
  return { status, message: "Request body could not be read; resend it." };
}
