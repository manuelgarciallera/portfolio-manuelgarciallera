# Editorial runtime verification

Run `npm --prefix owner-platform run test:integration`. This check is also included in the owner `check` command.

Unlike the unit suite, this initializes the complete Payload application schema with the SQLite adapter and performs real database operations. It overrides the database with an in-memory instance, uses a random Payload secret and temporary test credentials, and destroys the instance afterwards. It does not connect to the owner's database, modify portfolio content, send email, or deploy anything.

The tests verify:

- Owner authentication using a generated login token.
- Creating a modular page draft without an optional brand override.
- Reordering blocks and reading the saved draft.
- Restoring the original version, including its block order and draft status.
- Denying anonymous draft access, updates and version reads.
- Keeping an article's pending edits private while anonymous reads continue to return its published revision, including requests with `draft: true`.

## Runtime defects discovered

The first execution failed before database initialization: generated enum identifiers for versioned mobile/tablet media frames exceeded the adapter's 63-character limit. Explicit short enum names now avoid that limit without changing the public API or content field names.

The next executions found that Payload supplies `undefined` optional group fields and hydrates unused arrays as `[]`. Brand override validation treated these as explicit invalid overrides. Empty optional overrides now inherit the base values; SQL persistence keeps cleared weight arrays as `[]`, because the version writer does not accept `null` arrays.

No existing database was migrated by this verification. PostgreSQL deployments must generate and review their schema migrations, including the enum names, against their own database before applying them.

## Limits

This is a local API integration check, not a browser usability test or a PostgreSQL integration test. It does not establish visual preview fidelity, Figma connectivity, production readiness, or public portfolio publication. The public app remains separate.
