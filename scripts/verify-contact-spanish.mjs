import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const base = process.env.PUBLIC_TEST_URL || 'http://127.0.0.1:3102'
const out = process.env.PUBLIC_TEST_OUTPUT || '.audit/project-images-20260922/contact-final'
await fs.mkdir(out, { recursive: true })
const report = { base, checks: [], intercepted: 0 }
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', locale: 'en-GB' })
  // Never deliver this synthetic message: simulate the network failure entirely
  // in the browser and block any accidental alternate contact API request.
  await page.route('**/api/contact*', async route => { report.intercepted++; await route.abort('failed') })
  await page.goto(base, { waitUntil: 'networkidle' })
  const consent = page.getByRole('button', { name: 'Cerrar preferencias sin cambiar la elección' })
  if (await consent.isVisible()) await consent.click()
  await page.locator('#contact-name').fill('Prueba local sin envío')
  await page.locator('#contact-email').fill('prueba@example.invalid')
  await page.locator('#contact-message').fill('Mensaje sintético para comprobar la recuperación de un fallo de red. No enviar.')
  await page.getByRole('button', { name: 'Enviar mensaje' }).click()
  const status = page.locator('.rd-contact-form__status')
  await page.locator('.rd-contact-form__status.is-error').waitFor()
  assert((await status.innerText()).includes('No se ha podido enviar el mensaje. Comprueba tu conexión o utiliza el correo electrónico.'), await status.innerText())
  assert.equal(report.intercepted, 1)
  report.checks.push('Error de red en español, navegador configurado en inglés, sin entrega real')
  assert.equal(await page.getByLabel('Correo electrónico', { exact: true }).inputValue(), 'prueba@example.invalid')
  const originalMessage = await page.locator('#contact-message').inputValue()
  assert(originalMessage.includes('Mensaje sintético'))
  const mailto = await page.getByRole('link', { name: 'Enviarlo por correo' }).getAttribute('href')
  assert(new URL(mailto).searchParams.get('body').includes(originalMessage))
  assert.equal(await page.getByRole('button', { name: 'Enviar mensaje' }).isEnabled(), true)
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  report.checks.push('Datos conservados, correo alternativo preparado, botón reutilizable y sin desbordamiento a390px')
  await status.scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(out, 'contact-error-es.png') })
  report.result = 'PASS'
} catch (error) {
  report.result = 'FAIL'
  report.failure = String(error.stack || error)
  process.exitCode = 1
} finally {
  await fs.writeFile(path.join(out, 'results.json'), JSON.stringify(report, null, 2))
  await browser.close()
}
console.log(JSON.stringify(report))
