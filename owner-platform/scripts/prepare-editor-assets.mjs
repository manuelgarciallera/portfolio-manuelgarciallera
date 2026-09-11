import { cp, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Ship the editor already installed by the lockfile, including its workers.
// Never fetch executable code from a CDN at runtime.
export async function prepareEditorAssets(publicDirectory = fileURLToPath(new URL('../public/', import.meta.url))) {
  const source = new URL('../node_modules/monaco-editor/', import.meta.url)
  const { version } = JSON.parse(await readFile(new URL('package.json', source), 'utf8'))
  const { dependencies } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Unsupported Monaco asset version')
  if (dependencies['monaco-editor'] !== version) throw new Error('Installed Monaco does not match the pinned editor version')
  const relative = `vendor/monaco/${version}`
  const destination = path.join(publicDirectory, relative)
  await mkdir(destination, { recursive: true })
  await cp(new URL('min/vs/', source), path.join(destination, 'vs'), { recursive: true })
  await cp(new URL('LICENSE', source), path.join(destination, 'LICENSE'))
  await cp(new URL('ThirdPartyNotices.txt', source), path.join(destination, 'ThirdPartyNotices.txt'))
  return `/${relative}/vs`
}
