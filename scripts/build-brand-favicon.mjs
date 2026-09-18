// Reproducible binary export from the approved two-plane vector; no new deps.
import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const source = await readFile(new URL('../public/brand/m-fold.svg', import.meta.url))
const sizes = [16, 32, 48]
const images = await Promise.all(sizes.map(size => sharp(source).resize(size, size).png().toBuffer()))
const header = Buffer.alloc(6 + 16 * sizes.length)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
let offset = header.length
images.forEach((data, index) => {
  const entry = 6 + index * 16
  header[entry] = header[entry + 1] = sizes[index]
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(data.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += data.length
})
await writeFile(new URL('../src/app/favicon.ico', import.meta.url), Buffer.concat([header, ...images]))
console.log('Exported favicon.ico: 16, 32, 48 px from public/brand/m-fold.svg')
