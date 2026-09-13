import assert from 'node:assert/strict'

export const verifyBrowserRelease = async ({ page, origin, document, width }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  await page.goto(`${origin}/admin`, { waitUntil: 'domcontentloaded' })
  const capture = page.locator('details').filter({ has: page.getByText('Capturar revisión de una página', { exact: true }) })
  await capture.locator('summary').click()
  await capture.getByRole('combobox', { name: 'Página', exact: true }).selectOption({ label: `${document.title} · /${document.slug}` })
  await capture.getByRole('button', { name: 'Crear par de snapshots', exact: true }).click()
  await capture.getByText('Par de snapshots creado y auditado. Ya está disponible para registrar una versión.', { exact: true }).waitFor()
  const registration = page.locator('details').filter({ has: page.getByText('Registrar versión verificada', { exact: true }) })
  await registration.locator('summary').click()
  await registration.getByRole('combobox', { name: 'Snapshots coincidentes', exact: true }).selectOption({ label: `Página ${document.id} · current:${document.updatedAt}` })
  const releaseInput = {
    name: `Synthetic workflow ${width}`,
    changeSummary: 'QA fixture only. Scores are synthetic, not measured quality.',
    gitCommit: width.toString(16).padStart(40, '0'),
  }
  await registration.getByRole('textbox', { name: 'Nombre', exact: true }).fill(releaseInput.name)
  await registration.getByRole('textbox', { name: 'Commit Git completo', exact: true }).fill(releaseInput.gitCommit)
  await registration.getByRole('textbox', { name: 'Resumen de cambios', exact: true }).fill(releaseInput.changeSummary)
  await registration.getByRole('combobox', { name: 'Viewport', exact: true }).selectOption(width < 1024 ? 'mobile' : 'desktop')
  for (const name of ['Rendimiento', 'Usabilidad', 'Accesibilidad']) await registration.getByRole('spinbutton', { name, exact: true }).fill('80')
  await registration.getByRole('combobox', { name: 'Fuente', exact: true }).selectOption('manual')
  await registration.locator('input[name="measuredAt"]').fill('2026-09-11T10:00')
  const measuredAt = await registration.locator('input[name="measuredAt"]').evaluate(input => new Date(input.value).toISOString())
  await registration.getByRole('textbox', { name: 'Escribe REGISTRAR VERSIÓN', exact: true }).fill('REGISTRAR VERSIÓN')
  const registering = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/owner/releases')
    .then(response => ({ response }), error => ({ error }))
  await registration.getByRole('button', { name: 'Registrar versión', exact: true }).click()
  const result = await registering
  if ('error' in result) throw result.error
  const body = await result.response.json()
  assert.equal(result.response.status(), 201, JSON.stringify(body.errors ?? []))
  const release = body.release
  assert.equal(release.name, releaseInput.name)
  assert.equal(release.changeSummary, releaseInput.changeSummary)
  assert.equal(release.gitCommit, releaseInput.gitCommit)
  assert.deepEqual(release.quality.map(({ viewport, performance, usability, accessibility, source, measuredAt }) =>
    ({ viewport, performance, usability, accessibility, source, measuredAt })), [{
    viewport: width < 1024 ? 'mobile' : 'desktop', performance: 80, usability: 80,
    accessibility: 80, source: 'manual', measuredAt,
  }], 'The registered measurements exactly match the synthetic form values')
  await registration.getByRole('link', { name: 'Ver versión inmutable', exact: true }).waitFor()
  assert.equal(await registration.getByRole('button', { name: 'Registrar versión', exact: true }).isDisabled(), true)
  const saved = await page.evaluate(async id => {
    const response = await fetch(`/api/pages/${id}?draft=true&depth=0`, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error('Cannot read page after registration')
    return response.json()
  }, document.id)
  assert.deepEqual(saved, document, 'Capture and version registration do not modify the page')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  console.log(`[release-browser] PASS ${width}px native snapshot capture and immutable version registration`)
  // Replay the actual accepted request, not the response's populated relations
  // or persisted array-row IDs, when exercising the duplicate API conflict.
  return { release, releaseInput: result.response.request().postDataJSON() }
}
