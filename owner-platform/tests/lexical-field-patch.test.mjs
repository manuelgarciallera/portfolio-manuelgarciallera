import assert from 'node:assert/strict'
import { readFile, mkdir, mkdtemp, writeFile, copyFile, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { patchLexicalField } from '../scripts/lexical-field-patch.mjs'

const original = await readFile(new URL('./fixtures/lexical-3.89/Field.original.txt', import.meta.url), 'utf8')
const browserOriginal = await readFile(new URL('./fixtures/lexical-3.89/Field.browser.original.txt', import.meta.url), 'utf8')
assert.equal(createHash('sha256').update(original).digest('hex'), '085b5a2cb46cd3f9a525560e54c018b5c03cfa941945f857d51e27825d4b851d')
assert.equal(createHash('sha256').update(browserOriginal).digest('hex'), '24f1a5c28b76ed50343c3a5e83ae7a597099944ec3e584bcde6694de25e3bd5d')

test('distributed browser field also serializes before idle, not only the unbundled source', async () => {
  const bundle = browserOriginal
  const source = patchLexicalField(bundle, '3.89.0')
  const start = source.indexOf('$t=Bt(')
  const end = source.indexOf(',Kt=', start)
  const reference = { current: null }
  let saved
  const pending = []
  const change = runInNewContext(`let ${source.slice(start, end)}; $t`, {
    Bt: fn => fn, Y: reference, k: value => { saved = value }, Le: fn => pending.push(fn),
  })
  const latest = { root: { children: [{ text: 'Texto', format: 3 }] } }
  change({ toJSON: () => latest })
  assert.deepEqual(saved, latest)
  assert.equal(reference.current, latest)
  assert.equal(pending.length, 0)
})

test('installer patches only the pinned field and refuses drift without changing it', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'owner-lexical-install-'))
  try {
    await mkdir(path.join(root, 'scripts'))
    const packageRoot = path.join(root, 'node_modules/@payloadcms/richtext-lexical')
    await mkdir(path.join(packageRoot, 'dist/field'), { recursive: true })
    await mkdir(path.join(packageRoot, 'dist/exports/client'), { recursive: true })
    await copyFile(new URL('../scripts/lexical-field-patch.mjs', import.meta.url), path.join(root, 'scripts/lexical-field-patch.mjs'))
    await writeFile(path.join(packageRoot, 'package.json'), JSON.stringify({ version: '3.89.0' }))
    const field = path.join(packageRoot, 'dist/field/Field.js')
    const browserField = path.join(packageRoot, 'dist/exports/client/Field-J6MIUIWP.js')
    await writeFile(field, original)
    await writeFile(browserField, 'Unexpected browser distribution')
    const run = () => spawnSync(process.execPath, ['scripts/lexical-field-patch.mjs'], { cwd: root, encoding: 'utf8', timeout: 10_000 })
    assert.notEqual(run().status, 0, 'Validate all inputs before writing either field')
    assert.equal(await readFile(field, 'utf8'), original)
    await writeFile(browserField, browserOriginal)
    const first = run()
    assert.equal(first.status, 0, first.stderr)
    assert.equal(createHash('sha256').update(await readFile(field)).digest('hex'), '7a98335fc974881f12f99e73ea03a593fe5085c9b14cbd601a59e55c7c0e180e')
    assert.equal(createHash('sha256').update(await readFile(browserField)).digest('hex'), '56af80bad8f158c3502510d8d3c2dd30dfe172be0fc2fefc47f506a55a096f7a')
    const second = run()
    assert.equal(second.status, 0, second.stderr)
    const damaged = `${await readFile(field, 'utf8')}\nUnexpected change`
    await writeFile(field, damaged)
    assert.notEqual(run().status, 0)
    assert.equal(await readFile(field, 'utf8'), damaged)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('patch is repeatable and refuses unknown dependency versions or edited files', () => {
  const patched = patchLexicalField(original, '3.89.0')
  assert.equal(patchLexicalField(patched, '3.89.0'), patched)
  assert.throws(() => patchLexicalField(original, '3.90.0'), /version/)
  assert.throws(() => patchLexicalField(`${original}\n`, '3.89.0'), /refusing/)
  assert.throws(() => patchLexicalField(`${patched}\n`, '3.89.0'), /refusing/)
})

test('native field updates its bookkeeping and submitted value before browser idle', () => {
  const source = patchLexicalField(original, '3.89.0')
  const start = source.indexOf('  const handleChange = useCallback(')
  const end = source.indexOf('  const styles = useMemo(', start)
  assert(start >= 0 && end > start, 'Locate the installed native change handler')
  const prevValueRef = { current: null }
  const pending = []
  let value
  const change = runInNewContext(`${source.slice(start, end)}; handleChange`, {
    useCallback: fn => fn,
    prevValueRef,
    setValue: next => { value = next },
    runDeprioritized: fn => { pending.push(fn) },
  })
  const latest = { root: { children: [{ text: 'Texto', format: 3 }] } }
  change({ toJSON: () => latest })
  assert.deepEqual(value, latest, 'Immediate save must include bold and italic')
  assert.equal(prevValueRef.current, latest, 'Native remount guard must advance with form value')
  assert.equal(pending.length, 0, 'No older deferred write may replay over the latest value')
})
