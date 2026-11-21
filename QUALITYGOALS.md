# Quality Goals

Qualitative goals (non-functional requirements) of Backpack Brawl, why they matter, and how we evaluate them. Goals are numbered G1, G2, ... Related decisions are logged in `DECISIONS.md`.

## G1 - Unit Tests

In order to ensure all functional requirements are fulfilled, unit tests are created so that we know if some functionality breaks
and the code can easier be refactored in the future.

## G2 - Shared Types Between Client and Server

In order to catch mismatches between the frontend and the API at build time instead of at runtime, the server is written in TypeScript and shares its types with the frontend (e.g. one `Opponent` type instead of two separate descriptions of the same shape),
so that a changed API shape is flagged everywhere it is used.
