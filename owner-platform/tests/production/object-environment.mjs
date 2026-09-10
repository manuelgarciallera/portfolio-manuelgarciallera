import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { runCommand } from '../recovery/postgres-runtime.mjs'
import { startObjectProviderFixture } from '../media/object-provider-fixture.ts'

// Synthetic TLS trust is scoped to the spawned Next process, never disabled.
export const startProductionObjectEnvironment = async ({ root, openssl }) => {
  const key = path.join(root, 'qa-key.pem')
  const cert = path.join(root, 'qa-cert.pem')
  await runCommand(openssl, ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert,
    '-days', '1', '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1'])
  const tls = { key: await readFile(key, 'utf8'), cert: await readFile(cert, 'utf8') }
  const scratch = path.join(root, 'object-scratch')
  await mkdir(scratch)
  const provider = await startObjectProviderFixture(tls)
  return {
    provider,
    environment: { ...provider.environment, NODE_ENV: 'production', NODE_EXTRA_CA_CERTS: cert,
      OWNER_MEDIA_SCRATCH_DIR: scratch, OWNER_SERVER_URL: 'https://owner.example.invalid' },
    async close() {
      await provider.close()
    },
  }
}
