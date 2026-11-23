import cors from "cors";
import express from "express";
import { createHallOfFame, parseLimit, publicEntry, validateRun, MAX_LIMIT } from "./hallOfFame.js";
import { opponentForRound, parseRound } from "./opponents.js";

const app = express();
const port = Number(process.env.PORT ?? 4200);

const hallOfFame = createHallOfFame();

// A run submission is a few dozen bytes; 2 kB leaves room and rejects anything abusive early.
app.use(cors()); app.use(express.json({ limit: "2kb" }));
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "backpack-brawl" }));

app.get("/api/opponents", (req, res) => {
  const requested = Number(req.query.latency ?? process.env.API_LATENCY ?? 1200);
  const latency = Number.isFinite(requested) ? Math.max(0, Math.min(5000, requested)) : 1200;
  setTimeout(() => {
    const round = parseRound(req.query.round);
    if (round === null) return res.status(400).json({ error: "round must be a positive whole number" });
    if (req.query.fail === "true" || process.env.API_FAIL === "true") {
      return res.status(503).json({ error: "The arena gates are shut. No challenger answered the call." });
    }
    res.json(opponentForRound(round));
  }, latency);
});

app.get("/api/hall-of-fame", (req, res) => {
  const limit = parseLimit(req.query.limit);
  if (limit === null) return res.status(400).json({ error: `limit must be a whole number from 1 to ${MAX_LIMIT}` });
  res.json({ entries: hallOfFame.top(limit), total: hallOfFame.size });
});

app.post("/api/hall-of-fame", (req, res) => {
  const { run, error } = validateRun(req.body);
  if (error) return res.status(400).json({ error });
  const result = hallOfFame.submit(run);
  if (result.status === "conflict") {
    return res.status(409).json({ error: "This runId was already submitted with different data. Each run can be submitted only once." });
  }
  const status = result.status === "created" ? 201 : 200;
  res.status(status).json({ entry: publicEntry(result.entry, result.rank), rank: result.rank, duplicate: result.status === "duplicate" });
});

// Body-parser failures (bad JSON, body too large) would otherwise produce an HTML error page.
app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err);
  const status = typeof err.status === "number" && err.status >= 400 && err.status < 500 ? err.status : 500;
  const message = status === 413 ? "Request body too large (limit 2 kB)." : status === 500 ? "Internal server error." : "Request body is not valid JSON.";
  res.status(status).json({ error: message });
});

app.listen(port, () => console.log(`Backpack Brawl API listening on http://localhost:${port}`));
