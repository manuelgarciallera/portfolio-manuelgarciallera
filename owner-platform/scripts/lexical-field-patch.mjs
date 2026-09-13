import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export async function prepareLexicalField(directory = new URL('../node_modules/@payloadcms/richtext-lexical/', import.meta.url)) {
  const { version } = JSON.parse(await readFile(new URL('package.json', directory), 'utf8'))
  // Validate both distributions before changing either. Payload's browser
  // export uses its precompiled chunk rather than the unbundled Field.js.
  const updates = await Promise.all(['dist/field/Field.js', 'dist/exports/client/Field-J6MIUIWP.js'].map(async name => {
    const file = new URL(name, directory)
    const source = await readFile(file, 'utf8')
    return { file, source, patched: patchLexicalField(source, version) }
  }))
  for (const { file, source, patched } of updates) if (patched !== source) await writeFile(file, patched)
}

// Payload 3.89.0 MIT-licensed native field. Keep its own prevValueRef and
// setValue update together; do not install a second editor-state writer.
export function patchLexicalField(source, version) {
  if (version !== '3.89.0') throw new Error('Review the Lexical patch for this version')
  const digest = createHash('sha256').update(source).digest('hex')
  if (digest === '56af80bad8f158c3502510d8d3c2dd30dfe172be0fc2fefc47f506a55a096f7a') return source
  if (digest === '24f1a5c28b76ed50343c3a5e83ae7a597099944ec3e584bcde6694de25e3bd5d') {
    return source.replace('Le=Be(),$t=Bt(M=>{Le(()=>{let De=M.toJSON();Y.current=De,k(De)})},[k,Le])', '$t=Bt(M=>{let De=M.toJSON();Y.current=De,k(De)},[k])')
  }
  if (digest === '7a98335fc974881f12f99e73ea03a593fe5085c9b14cbd601a59e55c7c0e180e') return source
  if (digest !== '085b5a2cb46cd3f9a525560e54c018b5c03cfa941945f857d51e27825d4b851d') {
    throw new Error('Unexpected native Lexical field; refusing to patch')
  }
  return source
    .replace("import { useRunDeprioritized } from '../utilities/useRunDeprioritized.js';", '')
    .replace('  const runDeprioritized = useRunDeprioritized() // defaults to 500 ms timeout\n;', '')
    .replace("    // Queue the update for the browser’s idle time (or Safari shim)\n    // and let the hook handle debouncing/cancellation.\n    void runDeprioritized(updateFieldValue);", '    // Owner: serialize the current state before any immediate form submission.\n    updateFieldValue();')
    .replace('[setValue, runDeprioritized]', '[setValue]')
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await prepareLexicalField()
