import type { Opponent } from "./types";

/** Asks the API for this round's opponent; throws with the server's error text on failure. */
export async function fetchOpponent(round: number): Promise<Opponent> {
  let response: Response;
  try {
    response = await fetch(`/api/opponents?round=${encodeURIComponent(round)}`);
  } catch {
    throw new Error("The arena could not be reached. Check that the API is running (pnpm dev).");
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `The opponent search failed (HTTP ${response.status}).`);
  }
  return response.json() as Promise<Opponent>;
}
