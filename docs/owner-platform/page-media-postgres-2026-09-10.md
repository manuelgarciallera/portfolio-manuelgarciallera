# Page media restoration: PostgreSQL acceptance

Base a549a19. Synthetic databases only; no production migration or deployment.

The full-config media test previously hardcoded SQLite. A new db.name assertion
failed under the PostgreSQL controller (6254ae: expected postgres, got sqlite).
The test now chooses the actual adapter using the existing validated, loopback-only
controller metadata. The assertion remains to prevent mislabeled acceptance.

After this correction, the whole suite timed out (1a6b60); its exact cluster was
stopped and removed. A focused run passed on PostgreSQL 17.11 (dacf79). Inspection
showed full-config and minimal media fixtures sharing one SQL schema. Assigning
full-config its own schema allowed the full controller run to finish successfully.

## Evidence

- Full-config restoration on actual PostgreSQL: captured revision A and its bytes
  after Media-version retention; current library B unchanged; forged pin ignored;
  ordinary page editing preserves A.
- Final full controller run 3abc78: 56/56 tests, 8 files, 97.84 seconds test duration.
  Do not interpret all 56 as PostgreSQL tests: auth-unlock explicitly uses SQLite.
  The full-config test verifies its selected adapter directly.
- Controller verified process closed, zero remaining PostgreSQL sessions and exact
  temporary cluster shutdown/removal. No ambient provider credentials used.
- SQLite targeted rerun 635e41: 1/1; typecheck and lint exit 0.
- Runner now accepts explicit tests/...integration.test.ts paths and reports the
  selected suites accurately. Unsupported flags reject before creating a cluster.

No production source changed in this follow-up. This validates fresh-schema
operation, NOT migration of an existing database, provider TLS/IAM, disaster
recovery of production or browser interaction. Those remain separate gates.

Next Codex: owner-visible pinned-media status/control and browser acceptance;
PostgreSQL versioned migration rehearsal before any real-data deployment.
