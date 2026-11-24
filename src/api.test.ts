import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchOpponent } from "./api";

describe("B5: opponent search errors", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("explains an unreachable API and keeps the original error as cause", async () => {
    const networkError = new TypeError("Failed to fetch");
    vi.stubGlobal("fetch", () => Promise.reject(networkError));

    const failure = await fetchOpponent(1).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe("The opponent could not be reached. Check your connection and try again.");
    expect((failure as Error).cause).toBe(networkError);
  });
});
