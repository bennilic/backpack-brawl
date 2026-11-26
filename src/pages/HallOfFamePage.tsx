import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { ROUTES } from "../game";
import { fetchHallOfFame, type HallOfFameList } from "../hallOfFame";

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; list: HallOfFameList };

export function HallOfFamePage() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setState({ kind: "loading" });
    setAttempt((count) => count + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchHallOfFame(controller.signal).then(
      (list) => setState({ kind: "ready", list }),
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ kind: "error", message: error instanceof Error ? error.message : "Could not load the hall of fame. Try again." });
      },
    );
    return () => controller.abort();
  }, [attempt]);

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h2 className="font-display text-3xl font-bold">🏆 Hall of fame</h2>
      <p className="text-sm text-muted">Victories first, then more wins, then fewer rounds, then more lives left. Ties go to the earlier run.</p>
      <div aria-live="polite" aria-busy={state.kind === "loading"}>
        {state.kind === "loading" && <p className="text-muted">Loading the best runs…</p>}
        {state.kind === "error" && (
          <div role="alert" className="flex flex-col items-start gap-2 rounded-lg border-2 border-life bg-panel p-4">
            <p>{state.message}</p>
            <button type="button" onClick={retry} className="rounded-md bg-gold px-4 py-2 font-display font-bold text-ink hover:brightness-110">
              Try again
            </button>
          </div>
        )}
        {state.kind === "ready" && state.list.entries.length === 0 && (
          <p className="rounded-lg border-2 border-panel-edge bg-panel p-4">
            No runs yet. Finish a run and save it under your name to be the first.{" "}
            <Link to={ROUTES.start} className="font-bold text-gold underline">
              Start a run
            </Link>
          </p>
        )}
        {state.kind === "ready" && state.list.entries.length > 0 && (
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Best runs, best first</caption>
            <thead>
              <tr className="border-b-2 border-panel-edge text-xs uppercase tracking-wider text-muted">
                <th scope="col" className="py-2 pr-2">Rank</th>
                <th scope="col" className="py-2 pr-2">Name</th>
                <th scope="col" className="py-2 pr-2">Result</th>
                <th scope="col" className="py-2 pr-2">Wins</th>
                <th scope="col" className="py-2 pr-2">Rounds</th>
                <th scope="col" className="py-2">Lives left</th>
              </tr>
            </thead>
            <tbody>
              {state.list.entries.map((entry) => (
                <tr key={entry.rank} className="border-b border-panel-edge">
                  <th scope="row" className="py-2 pr-2">{entry.rank}</th>
                  <td className="py-2 pr-2">{entry.name}</td>
                  <td className="py-2 pr-2">{entry.outcome === "victory" ? "👑 Victory" : "🪦 Defeat"}</td>
                  <td className="py-2 pr-2">{entry.wins}</td>
                  <td className="py-2 pr-2">{entry.rounds}</td>
                  <td className="py-2">{entry.lives}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
