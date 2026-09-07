import { execFile } from 'node:child_process'
import { lstat, realpath, rm } from 'node:fs/promises'
import path from 'node:path'

export const safeEnvironment = (ambient = process.env) => {
  const allowed = /^(ComSpec|NUMBER_OF_PROCESSORS|OS|Path|PATHEXT|PROCESSOR_ARCHITECTURE|SystemDrive|SystemRoot|TEMP|TMP|windir|HOME|LANG|SHELL|TMPDIR|TZ)$/i
  return {
    ...Object.fromEntries(Object.entries(ambient).filter(([key]) => allowed.test(key))),
    DATABASE_URL: '', FIGMA_PERSONAL_ACCESS_TOKEN: '', FIGMA_PLAN: '', LOCAL_DATABASE_NAME: '',
    NODE_ENV: 'test', OWNER_BOOTSTRAP_SECRET: '', PAYLOAD_SECRET: '', RESEND_API_KEY: '', SMTP_PASS: '', SMTP_USER: '',
  }
}

export const redact = (message, secrets = []) => secrets.filter(Boolean).reduce((text, secret) => text.replaceAll(secret, '[redacted]'), message)

export const runCommand = (file, args, { env = safeEnvironment(), timeout = 60_000, secrets = [], acceptedCodes = [0], cwd } = {}) => new Promise((resolve, reject) => {
  // execFile waits for close, never invokes a shell and kills only its exact child on timeout.
  execFile(file, args, { env, cwd, timeout, windowsHide: true, maxBuffer: 2 * 1024 * 1024, encoding: 'utf8' }, (error, stdout, stderr) => {
    const code = error?.code ?? 0
    if (error?.killed || !acceptedCodes.includes(code)) {
      const detail = error?.killed ? 'timed out' : `failed (${code})`
      reject(new Error(redact(`${path.basename(file)} ${detail}: ${stderr || stdout || error?.message || ''}`, secrets)))
    } else resolve({ code, stdout: redact(stdout, secrets), stderr: redact(stderr, secrets) })
  })
})

export const preflightTools = async (directory) => {
  if (!directory?.trim()) throw new Error('Set OWNER_POSTGRES_BIN to the existing PostgreSQL binary directory.')
  const bin = path.resolve(directory)
  const tools = {}
  for (const name of ['initdb', 'pg_ctl', 'psql', 'createdb', 'pg_dump', 'pg_restore']) {
    const file = path.join(bin, name + (process.platform === 'win32' ? '.exe' : ''))
    try {
      if (!(await lstat(file)).isFile()) throw new Error('Not a file')
    } catch { throw new Error(`Missing PostgreSQL tool ${name} in OWNER_POSTGRES_BIN.`) }
    tools[name] = file
  }
  const versions = {}
  for (const [name, file] of Object.entries(tools)) versions[name] = (await runCommand(file, ['--version'])).stdout.trim()
  return { tools, versions }
}

export const assertTaskRoot = async (cache, root) => {
  const resolved = path.resolve(root)
  if (path.dirname(resolved) !== path.resolve(cache) || !/^owner-postgres-recovery-[a-zA-Z0-9]+$/.test(path.basename(resolved))) throw new Error('Unsafe PostgreSQL recovery task path.')
  if (!(await lstat(resolved)).isDirectory() || await realpath(resolved) !== path.join(await realpath(cache), path.basename(resolved))) throw new Error('Unsafe PostgreSQL recovery task link.')
  return resolved
}

export const cleanupTask = async ({ cache, root, stopped, workersClosed }) => {
  if (!stopped || !workersClosed) throw new Error(`Synthetic recovery data retained because shutdown was not proved: ${root}`)
  await assertTaskRoot(cache, root)
  await rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
}

export const databaseOptions = (port, database, password) => {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid recovery port.')
  if (!['owner_source', 'owner_restored'].includes(database)) throw new Error('Invalid recovery database.')
  return { host: '127.0.0.1', port, database, user: 'owner_recovery', password, ssl: false, connectionTimeoutMillis: 10_000 }
}

export const databaseCommand = (command, { port, database, archive }) => {
  databaseOptions(port, database, '')
  if (command === 'pg_restore' && database !== 'owner_restored') throw new Error('Native restore must target the new restore database.')
  const args = ['--host=127.0.0.1', `--port=${port}`, '--username=owner_recovery', '--no-password']
  if (command === 'createdb') return [...args, database]
  if (command === 'pg_dump') return [...args, `--dbname=${database}`, '--format=custom', `--file=${archive}`]
  if (command === 'pg_restore') return [...args, `--dbname=${database}`, '--exit-on-error', '--single-transaction', archive]
  throw new Error('Unsupported recovery database command.')
}
