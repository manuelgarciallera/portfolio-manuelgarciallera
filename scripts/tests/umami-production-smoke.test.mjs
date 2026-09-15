import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

// Explicit opt-in: this records one real QA pageview in the owner's Umami account.
test('production accepts a filtered pageview', { skip: process.env.UMAMI_PRODUCTION_SMOKE !== '1' }, async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    const collected = page.waitForResponse(r => r.url().includes('/api/send'), { timeout: 30000 })
    const response = await page.goto('https://manuelgarciallera.com/privacidad')
    assert.equal(response.status(), 200)
    const receipt = await collected
    assert.equal(receipt.status(), 200)
    const event = receipt.request().postDataJSON()
    assert.equal(event.payload.url, '/privacidad')
    assert.equal(event.payload.website, '7c0010a4-8f44-4340-8ee2-d8a7bda1152c')
    assert.equal('title' in event.payload, false)
    assert.equal(await page.locator('#portfolio-umami').count(), 1)
    console.log('Production HTML 200; Umami collection 200; one tracker; filtered pageview accepted.')
  } finally { await browser.close() }
})
