# Exact source checkout verification: 531af02

Status: browser, integration and physical recovery passed; installation limitation
remains. No deployment approval.

- Full bundle `.audit/owner-exact-531af02.bundle` verified (4a85f9), complete
  history and HEAD531af02b1509417539cee1418cc560a1bbfa691c.
- Isolated checkout `/tmp/owner-exact-531af02-W8DCJW` in the existing synthetic
  Docker QA container. Git tracked status clean; no source overlays.
- Fresh `npm ci --strict-peer-deps --no-fund` failed with EAI_AGAIN fetching
  zod from registry.npmjs.org (159f2a). Subsequent getent also failed (59191b).
  This is an installation failure, not an application test result.
- Reused installed Linux dependencies from the earlier isolated QA directory.
  Complete lockfile diff (0c1595) contains only the root hasInstallScript:true
  marker; dependency resolutions are unchanged. No lockfile was edited.
  The failed installation left no node_modules directory. The copy and native
  patch preparer completed successfully (06a617); tracked Git remains clean.
  This does not prove a clean install. Previous Windows clean-install evidence
  is separately documented and must not be substituted for this failed run.
- Browser harness session76183 completed with exit0 (299546), object media and
  controlled idle scheduling, using PostgreSQL16 tools. Native editorial flows
  passed at390/1280; six pages, two brands, two placements and two articles
  survived process restart. Anonymous drafts/history remained private. The
  runner confirmed owned application and cluster shutdown and synthetic cleanup.
- Post-browser Git tracked status remains clean (00a65f). Complete integration
  runner passed93/93 in12 files,115.40s (778c6f); exit0 and session/cluster cleanup
  verified abc84b. PostgreSQL16.15, synthetic loopback SCRAM; some fixtures
  explicitly select SQLite, so this is not93 PostgreSQL-only assertions.
- Full physical recovery passed (f42a53), applicationCommit exactly531af02,
  after47 helper tests (17dd41). Native dump/restore:18 backup files,12 media
  files,3 revisions;12 corrupt/missing cases rejected before allocation.
  Login, history, frozen preview and independent page/article edits worked
  after recovery. Original logical state and backup receipts stayed unchanged.
  The runner confirmed shutdown and cleanup. Synthetic local drill only.

No production changes, real credentials, new provider or public code edits.
Next: installation and intermittent Windows native-crash limitations remain
open, as does the operator recovery path under exhausted mail quota. Those
gaps are not closed by successful editorial and backup tests.
