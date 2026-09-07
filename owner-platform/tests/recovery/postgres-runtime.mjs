import { execFile } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { lstat, mkdir, mkdtemp, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises'
import net from 'node:net'
import { tmpdir } from 'node:os'
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
      const bufferExceeded = code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'
      const detail = error?.killed && !bufferExceeded ? 'timed out' : `failed (${code})`
      // maxBuffer and forced termination may cut through a credential. Omit
      // all captured output (and the raw error message), keeping the reason.
      const diagnostics = bufferExceeded || error?.killed
        ? '[Raw diagnostics omitted: subprocess output may be incomplete.]'
        : stderr || stdout || error?.message || ''
      reject(new Error(redact(`${path.basename(file)} ${detail}: ${diagnostics}`, secrets)))
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

const runDefinitions = {
  editorial: { prefix: 'owner-postgres-editorial-', role: 'owner_editorial', databases: ['owner_editorial'] },
  recovery: { prefix: 'owner-postgres-recovery-', role: 'owner_recovery', databases: ['owner_source', 'owner_restored'] },
}

const runDefinition = (kind) => {
  const definition = runDefinitions[kind]
  if (!definition) throw new Error('Unsupported PostgreSQL run kind.')
  return definition
}

export const assertTaskRoot = async (cache, root, taskPrefix = runDefinitions.recovery.prefix) => {
  const resolved = path.resolve(root)
  const escapedPrefix = taskPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (path.dirname(resolved) !== path.resolve(cache) || !(new RegExp(`^${escapedPrefix}[a-zA-Z0-9]+$`)).test(path.basename(resolved))) throw new Error('Unsafe PostgreSQL task path.')
  if (!(await lstat(resolved)).isDirectory() || await realpath(resolved) !== path.join(await realpath(cache), path.basename(resolved))) throw new Error('Unsafe PostgreSQL task link.')
  return resolved
}

export const cleanupTask = async ({ cache, root, stopped, workersClosed, taskPrefix }) => {
  if (!stopped || !workersClosed) throw new Error(`Synthetic recovery data retained because shutdown was not proved: ${root}`)
  await assertTaskRoot(cache, root, taskPrefix)
  await rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
}

export const editorialDatabaseConfig = async (environment, { cache }) => {
  const engine = environment.OWNER_INTEGRATION_ENGINE || 'sqlite'
  const root = environment.OWNER_INTEGRATION_DIRECTORY
  if (engine === 'sqlite') {
    const prefix = path.join(tmpdir(), 'owner-editorial-qa-')
    if (!root || !path.resolve(root).startsWith(path.resolve(prefix)) || !(await lstat(root)).isDirectory()) throw new Error('Unsafe SQLite editorial fixture directory.')
    return { engine, url: `file:${path.join(root, 'editorial.db').replaceAll('\\', '/')}` }
  }
  if (engine !== 'postgres') throw new Error('Unsupported editorial database engine.')
  const definition = runDefinitions.editorial
  try {
    await assertTaskRoot(cache, root, definition.prefix)
    const pool = JSON.parse(environment.OWNER_INTEGRATION_POSTGRES || '')
    const keys = Object.keys(pool).sort()
    const expectedKeys = ['connectionTimeoutMillis', 'database', 'host', 'password', 'port', 'ssl', 'user']
    if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)
      || pool.host !== '127.0.0.1'
      || !Number.isInteger(pool.port) || pool.port < 1024 || pool.port > 65535
      || pool.database !== definition.databases[0]
      || pool.user !== definition.role
      || !/^[a-f0-9]{64}$/.test(pool.password)
      || pool.ssl !== false
      || pool.connectionTimeoutMillis !== 10_000) throw new Error('Invalid metadata')
    return { engine, pool }
  } catch {
    throw new Error('Invalid isolated editorial PostgreSQL metadata.')
  }
}

export const createPostgresCluster = async ({ cache, kind, tools }) => {
  const definition = runDefinition(kind)
  await mkdir(cache, { recursive: true })
  const root = await mkdtemp(path.join(cache, definition.prefix))
  const cluster = path.join(root, 'cluster')
  const passwordFile = path.join(root, 'init-password')
  const password = randomBytes(32).toString('hex')
  const env = { ...safeEnvironment(), PGPASSWORD: password, PGCONNECT_TIMEOUT: '10', PSQLRC: path.join(root, 'no-psqlrc') }
  const command = (name, args, options) => runCommand(tools[name], args, { env, secrets: [password], ...options })
  let port
  let initAttempted = false
  let initialized = false
  let startAttempted = false
  let startConfirmed = false

  const options = (database) => {
    if (!definition.databases.includes(database)) throw new Error('Invalid PostgreSQL run database.')
    return { host: '127.0.0.1', port, database, user: definition.role, password, ssl: false, connectionTimeoutMillis: 10_000 }
  }
  const query = (database, sql) => command('psql', ['-X', '--host=127.0.0.1', `--port=${port}`, `--username=${definition.role}`, '--no-password', `--dbname=${database}`, '--set=ON_ERROR_STOP=1', '--tuples-only', '--no-align', '--command', sql])
  const createDatabase = async (database) => command('createdb', ['--host=127.0.0.1', `--port=${port}`, `--username=${definition.role}`, '--no-password', database])

  return {
    root,
    cluster,
    command,
    options,
    query,
    createDatabase,
    async initialize() {
      await assertTaskRoot(cache, root, definition.prefix)
      port = await new Promise((resolve, reject) => {
        const probe = net.createServer()
        probe.once('error', reject)
        probe.listen(0, '127.0.0.1', () => {
          const chosen = probe.address().port
          probe.close((error) => error ? reject(error) : resolve(chosen))
        })
      })
      await writeFile(passwordFile, `${password}\n`, { flag: 'wx', mode: 0o600 })
      initAttempted = true
      await command('initdb', ['--pgdata', cluster, `--username=${definition.role}`, '--auth-host=scram-sha-256', '--auth-local=scram-sha-256', '--pwfile', passwordFile, '--encoding=UTF8', '--locale=C'])
      initialized = true
      await writeFile(path.join(cluster, 'postgresql.auto.conf'), `listen_addresses = '127.0.0.1'\nport = ${port}\npassword_encryption = 'scram-sha-256'\nunix_socket_directories = ''\n`, { flag: 'w' })
      startAttempted = true
      await command('pg_ctl', ['start', '-D', cluster, '-l', path.join(root, 'postgres.log'), '-w', '-t', '30'], { timeout: 45_000 })
      startConfirmed = true
      await createDatabase(definition.databases[0])
      if ((await query(definition.databases[0], 'SHOW listen_addresses')).stdout.trim() !== '127.0.0.1') throw new Error('PostgreSQL did not bind only to loopback.')
      if ((await query(definition.databases[0], `SELECT count(*) FROM pg_authid WHERE rolname='${definition.role}' AND rolpassword LIKE 'SCRAM-SHA-256$%'`)).stdout.trim() !== '1') throw new Error('Synthetic PostgreSQL role does not use SCRAM.')
      return options(definition.databases[0])
    },
    async shutdown({ childrenClosed }) {
      let stopped = !startAttempted && (!initAttempted || initialized)
      if (startAttempted) {
        await assertTaskRoot(cache, root, definition.prefix)
        const state = await command('pg_ctl', ['status', '-D', cluster], { acceptedCodes: [0, 3] })
        if (!startConfirmed && state.code === 3) throw new Error('Unconfirmed startup: cannot prove that no startup child remains.')
        if (state.code === 0) {
          const pidInfo = (await readFile(path.join(cluster, 'postmaster.pid'), 'utf8')).split(/\r?\n/)
          if (path.resolve(pidInfo[1]) !== path.resolve(cluster)) throw new Error('Cluster PID file does not identify this exact data directory.')
          await command('pg_ctl', ['stop', '-D', cluster, '-m', 'fast', '-w', '-t', '30'], { timeout: 45_000 })
        }
        if ((await command('pg_ctl', ['status', '-D', cluster], { acceptedCodes: [3] })).code !== 3) throw new Error('Exact PostgreSQL cluster did not stop.')
        try { await stat(path.join(cluster, 'postmaster.pid')); throw new Error('PostgreSQL PID file remained after shutdown.') } catch (error) { if (error?.code !== 'ENOENT') throw error }
        stopped = true
      }
      await cleanupTask({ cache, root, stopped, workersClosed: childrenClosed, taskPrefix: definition.prefix })
    },
  }
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
