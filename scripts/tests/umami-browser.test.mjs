import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { UMAMI_BOOTSTRAP } from '../../src/lib/umami-tracker.ts'

test('real Umami tracker: filtered pageviews, SPA navigation and no duplicates (collection intercepted)', async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    const events = []
    await page.route('https://manuelgarciallera.com/**', route => route.fulfill({ contentType: 'text/html', body: '<html><head><title>Private title</title></head><body>QA</body></html>' }))
    await page.route('**/api/send', async route => {
      events.push(route.request().postDataJSON())
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ cache: 'qa-cache' }) })
    })
    await page.goto('https://manuelgarciallera.com/?email=private#secret')
    await page.evaluate(UMAMI_BOOTSTRAP)
    await page.waitForFunction(() => typeof window.umami === 'object')
    await page.waitForTimeout(1500)
    assert.equal(events.length, 1)
    assert.equal(events[0].payload.url, '/')
    assert.equal(events[0].payload.website, '7c0010a4-8f44-4340-8ee2-d8a7bda1152c')
    assert.equal(JSON.stringify(events).includes('private'), false)
    assert.equal('title' in events[0].payload, false)
    await page.evaluate(UMAMI_BOOTSTRAP)
    await page.evaluate(() => history.pushState({}, '', '/privacidad?email=private#secret'))
    await page.waitForTimeout(1500)
    assert.equal(events.length, 2)
    assert.equal(events[1].payload.url, '/privacidad')
    await page.evaluate(() => window.umami.track('private-event', { email: 'private' }))
    await page.waitForTimeout(500)
    assert.equal(events.length, 2)
  } finally { await browser.close() }
})
