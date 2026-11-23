import type { RunState } from "./types";

export const HALL_OF_FAME_PATH = "/hall-of-fame";
export const NAME_MAX_LENGTH = 20;
const SUBMITTED_KEY = "backpack-brawl.hall-of-fame-submitted";

export interface HallEntry {
  rank: number;
  name: string;
  outcome: "victory" | "defeat";
  wins: number;
  lives: number;
  rounds: number;
}

export interface HallOfFameList {
  entries: HallEntry[];
  total: number;
}

export interface SubmitResult {
  entry: HallEntry;
  rank: number | null;
  duplicate: boolean;
}

/**
 * Stable id of a finished run. A finished run never changes, so the id survives a page reload
 * and the server can recognise a repeated submission of the same run.
 */
export function runIdFor(run: RunState): string {
  return `run-${run.seed}-${run.nextUid}-${run.round}-${run.wins}-${run.lives}`;
}

/** The client-side name check (the server checks again). Returns a message or `null` if fine. */
export function nameProblem(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "Enter a name to join the hall of fame.";
  if (trimmed.length > NAME_MAX_LENGTH) return `Use at most ${NAME_MAX_LENGTH} characters (now ${trimmed.length}).`;
  if (!/^[\p{L}\p{N} _.'-]+$/u.test(trimmed)) return "Use only letters, digits, spaces and the characters _ . ' -";
  return null;
}

export function wasSubmitted(runId: string): boolean {
  try {
    return localStorage.getItem(SUBMITTED_KEY) === runId;
  } catch {
    return false;
  }
}

export function markSubmitted(runId: string): void {
  try {
    localStorage.setItem(SUBMITTED_KEY, runId);
  } catch {
    // Storage may be blocked; the server still ignores a repeated runId.
  }
}

/** Reads the server's `{ error }` text; falls back to the status code if the body is not ours. */
async function readError(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return typeof body?.error === "string" ? body.error : `${fallback} (server answered ${response.status}).`;
}

async function request(url: string, init: RequestInit | undefined, doing: string): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error(`Could not ${doing}: the API is not reachable. Check that the server is running (npm run dev), then try again.`);
  }
}

export async function fetchHallOfFame(signal?: AbortSignal): Promise<HallOfFameList> {
  const response = await request("/api/hall-of-fame?limit=10", { signal }, "load the hall of fame");
  if (!response.ok) throw new Error(`Could not load the hall of fame: ${await readError(response, "Request failed")} Try again in a moment.`);
  return response.json() as Promise<HallOfFameList>;
}

export async function submitRun(run: RunState, name: string): Promise<SubmitResult> {
  const payload = { runId: runIdFor(run), name, wins: run.wins, lives: run.lives, rounds: run.round };
  const response = await request(
    "/api/hall-of-fame",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
    "submit your run",
  );
  if (!response.ok) {
    const retryable = response.status >= 500 ? " Your name is kept; try again." : "";
    throw new Error(`Your run was not saved: ${await readError(response, "Submission failed")}${retryable}`);
  }
  return response.json() as Promise<SubmitResult>;
}
