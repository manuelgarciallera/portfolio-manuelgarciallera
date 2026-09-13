# Windows build: equivalent system-CA configuration verified

Base4a3ad7e. This supersedes the earlier build blocker only for the explicit invocation below. The ordinary npm build launcher is not yet changed. The rejected NEXT_TURBOPACK_USE_WORKER=0 candidate remains rejected.

## Mechanism and trust verification

[Node documents NODE_USE_SYSTEM_CA=1](https://nodejs.org/api/cli.html#node_use_system_ca1) as the environment alternative to --use-system-ca, available since24.6.0/22.19.0. This permits keeping system trust without passing the incompatible flag through NODE_OPTIONS into workers.

The current host has exactly --use-system-ca in NODE_OPTIONS (778e83). The diagnostic guards that exact value before changing anything in a child environment; it cannot discard unrelated options. Original process/global configuration remains unchanged. NODE_EXTRA_CA_CERTS and all other environment values are preserved; certificate verification is never disabled.

`node owner-platform/tests/diagnostics/system-ca-equivalence.cjs` compares parent/child/worker default trusted certificate sets without emitting certificates. Execution17c22d on Node24.13.0 passed: both forms have247 unique certificates and identical SHA256852033512837186a4ba6b4c6f20062bc791f1a4b690d9ebd5e87143b308a2cf5. Explicit-env/execArgv-empty worker now exits normally. This establishes equivalence on this observed host, not every platform/runtime.

## Build invocation and terminal evidence

From owner-platform:

```text
node -e "const assert=require('node:assert/strict');assert.equal(process.env.NODE_OPTIONS?.trim(),'--use-system-ca');const result=require('node:child_process').spawnSync(process.execPath,['scripts/build.mjs'],{stdio:'inherit',env:{...process.env,NODE_OPTIONS:'',NODE_USE_SYSTEM_CA:'1',NEXT_TELEMETRY_DISABLED:'1'}});if(result.error)throw result.error;process.exit(result.status??1)"
```

Session28583 exits0 (f41fdc): compile8.6s, TypeScript13.6s,23/23 pages, normal Turbopack workers enabled. No bundler substitution, upstream patch, dependency change, global CA/antivirus setting, public source change or deployment. No ordinary npm-build success is claimed yet.

Next Codex: integrate a narrowly guarded, version-aware equivalent child environment into the owner build launcher only after dedicated RED/GREEN tests; preserve all other options and legacy behavior. Native SQLite worker intermittency and provider/staging requirements remain separate. Do not call the whole CMS production-ready based on this build.

## Launcher integration (subsequent to 8b336e0)

The ordinary `npm run build` reproduced the actual worker error before the change (bc55ed, exit 1). A bare worker fixture alone passed and was not treated as proof of reproduction. The launcher-boundary test then failed on missing worker-compatible system trust (608a26, two failures).

`scripts/build-environment.mjs` now translates only the standalone `--use-system-ca` flag, only on Windows with Node 22.19+, 24.6+, or 25+. All other options, unsupported runtimes and non-Windows environments remain untouched. The original environment is not mutated; no worker disabling or certificate-verification bypass is introduced. Compound/quoted option strings deliberately remain unchanged rather than risking removal of unrelated arguments.

Seventeen targeted tests passed (ed207d). The ordinary `npm run build`, with no alternate command, exited 0 (session 24864, terminal 5488b7): compile 2.2 s, TypeScript 11.5 s, 23 static pages generated using 11 workers. Targeted ESLint exited 0 (a4569b); diff check clean. The repeated trust-set diagnostic passed (817210), with the same 247 certificates and digest, and the protected checkpoint remains unchanged.

This closes the observed build invocation failure, not the remaining CMS operational gates. No public deployment, production-provider setup, or recovery-account capability is implied.

Full `npm test` exited 0 (68962 / c18cef): 23 launcher/assets tests plus 1,346 unit tests in 171 files. Synthetic Payload fixtures emitted the existing no-email-adapter warnings; this is not a claim of production mail delivery. The new environment tests are included in the normal test command.
