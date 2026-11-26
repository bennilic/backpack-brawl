# Quality Goals

Qualitative goals (non-functional requirements) of Backpack Brawl, why they matter, and how we evaluate them. Goals are numbered G1, G2, ... Related decisions are logged in `DECISIONS.md`.

## G1 - Unit Tests

In order to ensure all functional requirements are fulfilled, unit tests are created so that we know if some functionality breaks
and the code can easier be refactored in the future.

## G2 - Type safety across client and server

In order to find wrong data shapes and misspelled fields before they reach a user, the TypeScript type checker covers the whole application, not only the React client. The API code in `server/` is TypeScript too (see D-009), so the contract between client and server is written in types and checked by the compiler.

**How we evaluate it:**
- `tsc -b` runs as the first step of `pnpm build` and checks `src/`, `vite.config.ts` and `server/` (via `tsconfig.server.json`). The build fails on any type error (there is no CI workflow yet; if one is added, it should run this command).
- `strict` mode is on for the server; `any` is not used, and untyped input (for example a request body) is typed `unknown` and validated before use.
- `erasableSyntaxOnly` keeps the server runnable by Node's type stripping, so the compiler rejects syntax Node cannot run.
- `pnpm lint` (typescript-eslint) covers `server/` as well.
