import { describe, expect, it } from "vitest";
import { runIdFor } from "../src/hallOfFame";
import { applyBattleResult, newRun } from "../src/run";
import { compareEntries, errorResponseFor, createHallOfFame, parseLimit, validateRun, MAX_LIMIT } from "./hallOfFame.ts";

const victory = { runId: "run-0001-aaaa", name: "Ada", wins: 5, lives: 2, rounds: 6 };
const defeat = { runId: "run-0002-bbbb", name: "Bob", wins: 3, lives: 0, rounds: 6 };

describe("B7: validateRun accepts real runs", () => {
  it("accepts a victory and a defeat", () => {
    expect(validateRun(victory).run).toEqual(victory);
    expect(validateRun(defeat).run).toEqual(defeat);
  });
  it("trims and collapses whitespace in the name", () => {
    expect(validateRun({ ...victory, name: "  Ada   Lovelace " }).run?.name).toBe("Ada Lovelace");
  });
  it("accepts umlauts", () => {
    expect(validateRun({ ...victory, name: "Jürgen" }).error).toBeUndefined();
  });
});

describe("B7: validateRun rejects invalid input", () => {
  const bad: [string, unknown][] = [
    ["null body", null],
    ["array body", [victory]],
    ["string body", "hi"],
    ["undefined body", undefined],
    ["extra field", { ...victory, outcome: "victory" }],
    ["__proto__ field", JSON.parse('{"__proto__": {"x": 1}, "runId": "run-0001-aaaa"}')],
    ["missing runId", { ...victory, runId: undefined }],
    ["short runId", { ...victory, runId: "abc" }],
    ["runId with slash", { ...victory, runId: "../../etc/passwd" }],
    ["numeric name", { ...victory, name: 42 }],
    ["empty name", { ...victory, name: "   " }],
    ["name too long", { ...victory, name: "x".repeat(21) }],
    ["markup in name", { ...victory, name: "<script>alert(1)</script>" }],
    ["control char in name", { ...victory, name: "Ada\u0000" }],
    ["newline in name", { ...victory, name: "Ada\nBob" }],
    ["string wins", { ...victory, wins: "5" }],
    ["fractional wins", { ...victory, wins: 4.5 }],
    ["NaN-like wins", { ...victory, wins: null }],
    ["too many wins", { ...victory, wins: 6, rounds: 7 }],
    ["negative wins", { ...defeat, wins: -1 }],
    ["too many lives", { ...victory, lives: 4 }],
    ["victory with 0 lives", { ...victory, lives: 0, rounds: 8 }],
    ["unfinished run (3 wins, 2 lives)", { ...defeat, lives: 2, rounds: 4 }],
    ["defeat with 0 wins and 0 lives but wrong rounds", { ...defeat, wins: 0, rounds: 1 }],
    ["implausibly fast victory", { ...victory, lives: 3, rounds: 1 }],
    ["huge rounds", { ...victory, rounds: 1e9 }],
  ];
  it.each(bad)("rejects %s with a message", (_label, body) => {
    const result = validateRun(body);
    expect(result.run).toBeUndefined();
    expect(typeof result.error).toBe("string");
    expect(result.error?.length).toBeGreaterThan(10);
  });
  it("does not echo a long unknown field name in full", () => {
    expect(validateRun({ ...victory, ["k".repeat(500)]: 1 }).error?.length ?? Infinity).toBeLessThan(200);
  });
});

describe("B7: ordering", () => {
  const entry = (wins: number, lives: number, sequence: number) => ({ runId: `run-${sequence}-xxxx`, name: "N", wins, lives, rounds: wins + 3 - lives, sequence });
  it("ranks victories before any defeat", () => {
    expect(compareEntries(entry(5, 1, 2), entry(4, 0, 1))).toBeLessThan(0);
  });
  it("ranks more wins first among defeats", () => {
    expect(compareEntries(entry(4, 0, 2), entry(2, 0, 1))).toBeLessThan(0);
  });
  it("ranks fewer rounds first among victories", () => {
    expect(compareEntries(entry(5, 3, 2), entry(5, 1, 1))).toBeLessThan(0);
  });
  it("breaks full ties by earlier submission", () => {
    expect(compareEntries(entry(5, 2, 1), entry(5, 2, 2))).toBeLessThan(0);
  });
});

describe("B7: createHallOfFame", () => {
  it("is empty at the start", () => {
    expect(createHallOfFame().top(10)).toEqual([]);
  });
  it("lists the best run first and does not leak runId", () => {
    const hall = createHallOfFame();
    hall.submit(defeat);
    hall.submit(victory);
    const top = hall.top(10);
    expect(top.map((e: { name: string }) => e.name)).toEqual(["Ada", "Bob"]);
    expect(top[0]).toEqual({ rank: 1, name: "Ada", outcome: "victory", wins: 5, lives: 2, rounds: 6 });
  });
  it("treats a resubmitted runId as a duplicate and stores it once", () => {
    const hall = createHallOfFame();
    hall.submit(victory);
    expect(hall.submit(victory).status).toBe("duplicate");
    expect(hall.size).toBe(1);
  });
  it("reports a conflict when a runId comes back with other data", () => {
    const hall = createHallOfFame();
    hall.submit(victory);
    expect(hall.submit({ ...victory, name: "Mallory" }).status).toBe("conflict");
    expect(hall.top(10)[0].name).toBe("Ada");
  });
  it("keeps at most maxEntries and drops the worst", () => {
    const hall = createHallOfFame(2);
    hall.submit(defeat);
    hall.submit(victory);
    const worse = hall.submit({ runId: "run-0003-cccc", name: "Cy", wins: 0, lives: 0, rounds: 3 });
    expect(worse.rank).toBeNull();
    expect(hall.size).toBe(2);
  });
  it("handles thousands of submissions quickly", () => {
    const hall = createHallOfFame();
    const start = performance.now();
    for (let i = 0; i < 3000; i += 1) hall.submit({ ...defeat, runId: `run-${String(i).padStart(6, "0")}`, wins: i % 5 });
    expect(performance.now() - start).toBeLessThan(2000);
  });
});

describe("B7: parseLimit", () => {
  it("defaults when missing", () => expect(parseLimit(undefined)).toBe(10));
  it("accepts 1 and the maximum", () => {
    expect(parseLimit("1")).toBe(1);
    expect(parseLimit(String(MAX_LIMIT))).toBe(MAX_LIMIT);
  });
  it.each(["0", "51", "-1", "abc", "1.5", "", "1e2"])("rejects %j", (value) => expect(parseLimit(value)).toBeNull());
  it("rejects repeated parameters (arrays)", () => expect(parseLimit(["1", "2"] as unknown as string)).toBeNull());
});

describe("B7: client run data matches the server's plausibility rules", () => {
  const sequences: [string, ("player" | "opponent")[]][] = [
    ["flawless victory", ["player", "player", "player", "player", "player"]],
    ["victory with two losses", ["opponent", "player", "opponent", "player", "player", "player", "player"]],
    ["immediate defeat", ["opponent", "opponent", "opponent"]],
    ["defeat after four wins", ["player", "player", "player", "player", "opponent", "opponent", "opponent"]],
  ];
  it.each(sequences)("accepts a real run: %s", (_label, winners) => {
    const run = winners.reduce((state, winner) => applyBattleResult(state, winner), newRun(7));
    const payload = { runId: runIdFor(run), name: "Ada", wins: run.wins, lives: run.lives, rounds: run.round };
    expect(validateRun(payload).error).toBeUndefined();
  });
});

describe("B7: errorResponseFor", () => {
  it("calls only a parse failure invalid JSON", () => {
    expect(errorResponseFor({ status: 400, type: "entity.parse.failed" })).toEqual({ status: 400, message: "Request body is not valid JSON." });
  });
  it("explains 413 and 415", () => {
    expect(errorResponseFor({ status: 413, type: "entity.too.large" }).message).toMatch(/too large/);
    expect(errorResponseFor({ status: 415, type: "charset.unsupported" }).message).toMatch(/UTF-8 JSON/);
  });
  it("uses a generic message for other 4xx errors", () => {
    expect(errorResponseFor({ status: 400, type: "request.aborted" })).toEqual({ status: 400, message: "Request body could not be read; resend it." });
  });
  it("keeps 5xx and unknown errors generic", () => {
    expect(errorResponseFor({ status: 503, message: "secret detail" })).toEqual({ status: 500, message: "Internal server error." });
    expect(errorResponseFor(new Error("secret detail")).message).toBe("Internal server error.");
    expect(errorResponseFor(undefined).status).toBe(500);
  });
});
