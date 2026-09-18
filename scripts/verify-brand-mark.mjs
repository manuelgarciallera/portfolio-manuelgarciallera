import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'

const svg = await readFile(new URL('../public/brand/m-fold.svg', import.meta.url))
const ico = await readFile(new URL('../src/app/favicon.ico', import.meta.url))
assert.equal(ico.readUInt16LE(2), 1)
assert.equal(ico.readUInt16LE(4), 3)
for (const [index, size] of [16, 32, 48].entries()) {
  const entry = 6 + index * 16
  assert.equal(ico[entry], size)
  assert.equal(ico[entry + 1], size)
  const offset = ico.readUInt32LE(entry + 12)
  const png = ico.subarray(offset, offset + ico.readUInt32LE(entry + 8))
  const actual = await sharp(png).ensureAlpha().raw().toBuffer()
  const expected = await sharp(svg).resize(size, size).ensureAlpha().raw().toBuffer()
  assert.deepEqual(actual, expected, `${size}px ICO matches source vector`)
  const pixel = (x, y) => [...actual.subarray((y * size + x) * 4, (y * size + x) * 4 + 4)]
  assert.deepEqual(pixel(size / 4, size / 2), [0, 0, 0, 255], 'neutral left plane in default light favicon')
  const right = pixel(size * 3 / 4, size / 4)
  assert.equal(right[3], 255, 'opaque gradient right plane')
  assert.ok(right[2] > right[0] && right[2] > right[1], 'blue-violet middle of spectrum')
  assert.equal(pixel(size / 2, size * 7 / 8)[3], 0, 'transparent lower cutout')
}
console.log('Brand vector + ICO verified at 16, 32, 48 px: exact colors and transparent silhouette.')
