import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import sharp from 'sharp'

// Generated asset: render the existing navbar monogram, not a substitute logo.
const css = await readFile(new URL('../src/features/redesign/redesign.css', import.meta.url), 'utf8')
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 64, height: 64 }, deviceScaleFactor: 4 })
  await page.setContent('<div class="rd-root"><div class="is-visible is-compact rd-header"><span class="rd-brand-monogram">MG</span></div></div>')
  await page.addStyleTag({ content: css })
  await page.addStyleTag({ content: 'html,body{margin:0;background:transparent} .rd-root{min-height:0;background:transparent} .rd-header{position:static!important;display:grid!important;place-items:center!important;width:64px!important;height:64px!important;padding:0!important;background:transparent!important;border:0!important;backdrop-filter:none!important} .rd-brand-monogram{opacity:1!important;transform:scale(1.65)!important;transition:none!important}' })
  // Match the navbar's sans stack even in the standalone export document.
  await page.addStyleTag({ content: '.rd-brand-monogram{font-family:-apple-system,"SF Pro Display","Segoe UI",system-ui,"Helvetica Neue",sans-serif!important}' })
  const png = await page.screenshot({ omitBackground: true })
  const stats = await sharp(png).stats()
  assert.ok(stats.channels[0].max > 200 && stats.channels[0].min < 30, 'Monogram must contain visible white letters and dark background')
  const sizes = [16, 32, 48, 64]
  const frames = await Promise.all(sizes.map(size => sharp(png).resize(size, size).png().toBuffer()))
  const header = Buffer.alloc(6 + sizes.length * 16)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(sizes.length, 4)
  let offset = header.length
  for (let i = 0; i < sizes.length; i++) {
    const at = 6 + i * 16
    header[at] = sizes[i]
    header[at + 1] = sizes[i]
    header.writeUInt16LE(1, at + 4)
    header.writeUInt16LE(32, at + 6)
    header.writeUInt32LE(frames[i].length, at + 8)
    header.writeUInt32LE(offset, at + 12)
    offset += frames[i].length
    const metadata = await sharp(frames[i]).metadata()
    assert.equal(metadata.width, sizes[i])
    assert.equal(metadata.height, sizes[i])
  }
  const icon = Buffer.concat([header, ...frames])
  assert.equal(icon.length, offset)
  await writeFile(new URL('../src/app/favicon.ico', import.meta.url), icon)
  console.log(`Generated navbar MG favicon: ${sizes.join('/')}px, ${icon.length} bytes`)
} finally {
  await browser.close()
}
