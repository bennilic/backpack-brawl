import type { Opponent } from "./types";

/** Asks the API for this round's opponent; throws with the server's error text on failure. */
export async function fetchOpponent(round: number): Promise<Opponent> {
  let response: Response;
  try {
    response = await fetch(`/api/opponents?round=${encodeURIComponent(round)}`);
  } catch (cause) {
    throw new Error("The opponent could not be reached. Check your connection and try again.", { cause });
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `The opponent search failed (HTTP ${response.status}).`);
  }
  return response.json() as Promise<Opponent>;
}
