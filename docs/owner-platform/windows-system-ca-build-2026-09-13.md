# Windows build: system CA worker incompatibility

Base `fb5e428`, Windows Node24.13.0, Next16.3.4. This is a diagnosed build-tool incompatibility and a verified one-shot workaround, not a fix to Node/Next or a permanent build configuration change.

## Reproduction

Ordinary owner build fails before compilation with `ERR_WORKER_INVALID_EXEC_ARGV`: `--use-system-ca` is not allowed in a worker's NODE_OPTIONS (`2363fa`). Node reports that the option is allowed in its environment. A basic Worker with inherited arguments succeeds (`0f0b6e`); a worker with explicit empty execArgv and the same system-CA option fails (`e63439`). Next's real option parser plus explicit empty execArgv reproduces the same rejection (`1f173f`). An initial `node -e` probe accidentally included the eval argument in parsed options and is not evidence for the CA diagnosis (`4aef6a`).

Installed source confirms `next/dist/build/turbopack-build/index.js` creates a thread worker, and `next/dist/lib/worker.js` explicitly supplies execArgv. `next/dist/build/index.js` honors `NEXT_TURBOPACK_USE_WORKER=0` to run the same Turbopack implementation in the main process. This switch is internal, not presented as a documented stable public API.

## Verified temporary invocation

From owner-platform, without changing machine-wide environment:

```text
node -e "const result=require('node:child_process').spawnSync(process.execPath,['scripts/build.mjs'],{stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_TURBOPACK_USE_WORKER:'0'}});if(result.error)throw result.error;process.exit(result.status??1)"
```

Session86741 compiles in10.2s, passes TypeScript, generates23/23 static pages and route output (`30081a`, `b0f5da`). NODE_OPTIONS, system trust, antivirus and certificate verification remain unchanged. Same bundler, no webpack substitution or upstream patch. This does not prove byte-identical build output or fix unrelated Windows native SQLite intermittency.

Use only as an explicit local workaround for this pinned combination. Do not silently add it to deployment or global settings. Revalidate after Node/Next updates; remove the workaround when the ordinary build succeeds under the same trust configuration. No runtime source, dependencies, accounts, database, public design or deployment changed in this investigation.
