import { useId, useRef, useState } from "react";
import { Link } from "react-router";
import { HALL_OF_FAME_PATH, markSubmitted, nameProblem, NAME_MAX_LENGTH, runIdFor, submitRun, wasSubmitted } from "../hallOfFame";
import type { RunState } from "../types";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "error"; message: string } | { kind: "done"; rank: number | null };

/** Name form that sends a finished run to the hall of fame, at most once per run. */
export function SubmitRun({ run }: { run: RunState }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>(() => (wasSubmitted(runIdFor(run)) ? { kind: "done", rank: null } : { kind: "idle" }));
  const [touched, setTouched] = useState(false);
  const isSending = useRef(false);
  const inputId = useId();
  const hintId = useId();
  const problem = nameProblem(name);
  const showProblem = touched && problem !== null;

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (problem !== null || isSending.current) return;
    isSending.current = true;
    setStatus({ kind: "sending" });
    try {
      const result = await submitRun(run, name.trim());
      markSubmitted(runIdFor(run));
      setStatus({ kind: "done", rank: result.rank });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Your run was not saved. Try again." });
    } finally {
      isSending.current = false;
    }
  }

  if (status.kind === "done") {
    return (
      <p role="status" className="text-muted">
        {status.rank === null ? "Your run is in the hall of fame." : `Saved! You are number ${status.rank} in the hall of fame.`}{" "}
        <Link to={HALL_OF_FAME_PATH} className="font-bold text-gold underline">
          See the hall of fame
        </Link>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-2 text-left">
      <label htmlFor={inputId} className="font-display font-bold">
        Your name for the hall of fame
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => setTouched(true)}
          maxLength={NAME_MAX_LENGTH * 2}
          autoComplete="nickname"
          aria-invalid={showProblem}
          aria-describedby={hintId}
          className="min-w-0 flex-1 rounded-md border border-panel-edge bg-ink px-3 py-2"
        />
        <button
          type="submit"
          disabled={status.kind === "sending"}
          className="rounded-md bg-gold px-4 py-2 font-display font-bold text-ink hover:brightness-110 disabled:opacity-60"
        >
          {status.kind === "sending" ? "Saving…" : status.kind === "error" ? "Try again" : "Save run"}
        </button>
      </div>
      <p id={hintId} className={`text-sm ${showProblem ? "text-life" : "text-muted"}`}>
        {showProblem ? problem : `Up to ${NAME_MAX_LENGTH} characters: letters, digits, spaces and _ . ' -`}
      </p>
      {status.kind === "error" && (
        <p role="alert" className="text-sm text-life">
          {status.message}
        </p>
      )}
    </form>
  );
}
