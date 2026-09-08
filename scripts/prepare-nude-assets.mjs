// One-off, reproducible format optimisation of the authorised Figma exports.
import sharp from 'sharp'
import { mkdir, copyFile } from 'node:fs/promises'
const source = '.tmp-screens/nude-gallery'
const target = 'public/projects/nude-project'
await mkdir(target, { recursive: true })
for (const [input, output, width] of [
  ['home.png', 'mobile-home.webp', 430],
  ['bag.png', 'mobile-bag.webp', 430],
  ['flow.png', 'flow.webp', 2400],
  ['photo.png', 'editorial-photo.webp', 1600],
  ['nav.png', 'navigation-system.webp', 470],
]) {
  const info = await sharp(`${source}/${input}`).resize({ width, withoutEnlargement: true }).webp({ quality: 88 }).toFile(`${target}/${output}`)
  console.log(output, info.width, info.height, info.size)
}
await copyFile(`${source}/logo.svg`, `${target}/logo.svg`)
await mkdir('public/projects/visual-gallery', { recursive: true })
console.log(await sharp(`${source}/theux-art.png`).resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 86 }).toFile('public/projects/visual-gallery/theux-art.webp'))
