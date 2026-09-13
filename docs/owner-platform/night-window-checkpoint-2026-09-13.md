# Night window checkpoint — 13 September 2026

Base `6656ea6`. Manuel requested eight hours of continued work, with public hero/stack defects prioritized and no unnecessary redesign.

## Fresh public observations

On the real `manuelgarciallera.com` domain, browser screenshots at 1440×1000 show the white sphere above Manuel / García-Llera / Añón, without splitting the compound surname or placing the name behind the sphere. At 390×844 the Buy&Sell case shows seven stack icons in two complete rows with no lateral scrollbar or overlap. These are browser viewport tests, not a physical phone or an exhaustive site audit. Temporary viewport override reset. No public code changed or deployed in this window.

The app accepted a thread heartbeat `portfolio-y-cms-ventana-de-ocho-horas` every 30 minutes, with a stop/pause instruction at 05:35 Europe/Madrid on 14 September. Execution depends on host/app/scheduler availability; it is not proof of eight hours of continuous execution. Existing Hub polling is not duplicated.

## Windows native authentication check

Command from owner-platform:

```text
node scripts/test-integration.mjs tests/auth-recovery.integration.test.ts tests/auth-unlock.integration.test.ts
```

Fresh session 22989 exited 0 (`98ea13`): two files passed, eight tests passed and eight skipped, 25.43 seconds. SQLite fixtures are isolated under the parent's temporary directory, and cleanup runs after worker exit. Skipped tests are not claimed as verified here. Negative authentication/recovery cases produce expected error logs; fixture initialization warns about missing mail adapter. No real account, password or delivery was involved.

This does not close the historical intermittent Windows-native issue or prove all CMS workflows on Windows. The previous complete PostgreSQL/browser receipts remain separate evidence.

## Recovery decision still required

Current proposal in recovery-global-exhaustion-2026-09-13.md concerns a trusted operator **resending email** despite exhausted public quota. It does not cover an unavailable provider. src/config/email.ts rejects unconfigured delivery; scripts contain no operational account recovery command. Read-only inspection confirms that a no-email recovery path is missing, not implemented by the passing recovery tests.

Hub proposal `30b72b0c-3a6e-4d55-b3f5-1a967095caf5` distinguishes operator resend from offline recovery. The latter needs a security design and Manuel's approval before implementation: authenticated host control, unambiguous existing owner, explicit confirmation, session/token invalidation, and durable audit without secrets; never an anonymous bypass endpoint. The brainstorming design gate pauses that new capability, not the already-authorized reliability testing. No credentials changed and no access model expanded.

Next: continue existing verification/defect work; retain the offline recovery decision for Manuel. Do not repeatedly rerun green tests without a concrete hypothesis or change.
