// Rebuild only the four authorised NudeProject assets from verified Figma exports.
// Default: inspect the proposed outputs. --write replaces assets; --check verifies them.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const mode = process.argv[2] ?? '--inspect'
assert.ok(['--inspect', '--write', '--check'].includes(mode), 'Use --inspect, --write or --check')
assert.ok(process.argv.length <= 3, 'No additional paths or arguments are accepted')

const root = new URL('../', import.meta.url)
const sourceDirectory = '.audit/project-images-20260922/figma-originals'
const targetDirectory = 'public/projects/nude-project'
const fileKey = 'q8g3VDiheBeFjwQYLhrIbn'
const quality = 92
const maxBytes = 400 * 1024
const inputs = [
  { source: `${sourceDirectory}/nude-home-3x.png`, output: 'mobile-home.webp', width: 1290, height: 2796, node: '492:41478', scale: 3, sha256: 'bfcf3aa125d58e3f61f6e888bdd26694bb6d952237c4ef0ceae1943b5140c5d2' },
  { source: `${sourceDirectory}/nude-bag-3x.png`, output: 'mobile-bag.webp', width: 1290, height: 2796, node: '492:40700', scale: 3, sha256: 'ff7130216b7dc872fc826f021ae2b6383960012709f98ce6c1630043fdfbd5b0' },
  { source: `${sourceDirectory}/nude-nav-3x.png`, output: 'navigation-system.webp', width: 1410, height: 1500, node: '492:42909', scale: 3, sha256: '810d8d40a6b04db5f27d4e50a85629d5c67563162245eda71beb3cb581ddf05b' },
  { source: '.tmp-screens/nude-gallery/flow.png', output: 'flow.webp', width: 3400, height: 2100, node: '534:12084', scale: 'retained native export', sha256: 'bbdc109947f11ed4123b225fb663cb68f6bfc833ddca2c675d066c652f70ab02' },
]

const digest = (buffer) => createHash('sha256').update(buffer).digest('hex')
const describe = async (buffer) => {
  const { width, height, format, hasAlpha } = await sharp(buffer).metadata()
  return { width, height, format, hasAlpha, bytes: buffer.length, sha256: digest(buffer) }
}

// Validate every source and prepared output before replacing any public file.
const prepared = await Promise.all(inputs.map(async (entry) => {
  const input = await readFile(new URL(entry.source, root))
  assert.equal(digest(input), entry.sha256, `${entry.source}: source hash changed`)
  const source = await describe(input)
  assert.deepEqual([source.format, source.width, source.height], ['png', entry.width, entry.height], `${entry.source}: unexpected source dimensions`)
  // Native dimensions: no enlargement, crop, reconstruction or generation.
  const buffer = await sharp(input).webp({ quality, alphaQuality: 100, effort: 6 }).toBuffer()
  const after = await describe(buffer)
  assert.deepEqual([after.format, after.width, after.height], ['webp', entry.width, entry.height], `${entry.output}: dimensions changed`)
  if (source.hasAlpha && !after.hasAlpha) {
    // WebP may omit a redundant alpha channel when every source pixel is opaque.
    assert.equal((await sharp(input).stats()).isOpaque, true, `${entry.output}: transparency lost`)
  }
  assert.ok(after.bytes <= maxBytes, `${entry.output}: exceeds ${maxBytes} bytes`)
  const output = `${targetDirectory}/${entry.output}`
  const before = await describe(await readFile(new URL(output, root)))
  return { output, buffer, receipt: { output, source: entry.source, fileKey, node: entry.node, scale: entry.scale, sourceMetadata: source, before, after } }
}))

if (mode === '--write') {
  for (const entry of prepared) await writeFile(new URL(entry.output, root), entry.buffer)
}

if (mode === '--write' || mode === '--check') {
  for (const entry of prepared) {
    const actual = await readFile(new URL(entry.output, root))
    assert.equal(digest(actual), entry.receipt.after.sha256, `${entry.output}: generated asset differs`)
  }
}

console.log(JSON.stringify({ mode, quality, maxBytes, sharp: sharp.versions.sharp, webp: sharp.versions.webp, assets: prepared.map(({ receipt }) => receipt) }, null, 2))
