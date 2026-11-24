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

  it.each([
    ["with the server's text", { error: "The arena gates are shut." }, "The arena gates are shut. Try again in a moment."],
    ["without a server text", null, "The opponent search failed (HTTP 503). Try again in a moment."],
  ])("ends an HTTP error %s with its own next step", async (_name, body, expected) => {
    vi.stubGlobal("fetch", () => Promise.resolve(new Response(body ? JSON.stringify(body) : "oops", { status: 503 })));

    await expect(fetchOpponent(1)).rejects.toThrow(expected);
  });
});
