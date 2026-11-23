import { describe, expect, it } from "vitest";
import { nameProblem, runIdFor } from "./hallOfFame";
import { newRun } from "./run";

describe("B7: runIdFor", () => {
  it("is stable for the same run and differs between runs", () => {
    const run = newRun(1);
    expect(runIdFor(run)).toBe(runIdFor({ ...run }));
    expect(runIdFor(run)).not.toBe(runIdFor({ ...run, wins: run.wins + 1 }));
    expect(runIdFor(run)).not.toBe(runIdFor(newRun(2)));
  });
  it("only uses characters the server accepts and fits its length limit", () => {
    expect(runIdFor(newRun(123456789))).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });
});

describe("B7: nameProblem", () => {
  it("accepts normal names", () => expect(nameProblem("Ada Lovelace")).toBeNull());
  it("rejects empty and whitespace-only names", () => {
    expect(nameProblem("")).not.toBeNull();
    expect(nameProblem("   ")).not.toBeNull();
  });
  it("rejects names that are too long or contain markup", () => {
    expect(nameProblem("x".repeat(21))).not.toBeNull();
    expect(nameProblem("<b>x</b>")).not.toBeNull();
  });
});
