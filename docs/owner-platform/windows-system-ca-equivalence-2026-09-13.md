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
