#!/usr/bin/env node
/**
 * Comprueba desbordamiento horizontal POR ELEMENTO, no por documento.
 *
 * `.rd-root { overflow-x: clip }` hace que `document.scrollWidth` sea siempre
 * correcto: una página puede tener 61 px de contenido fuera del viewport y
 * seguir dando verde. Este script mide cada elemento y solo perdona lo que es
 * decorativo (dentro de `[aria-hidden="true"]`) o está declarado como región
 * desplazable (`overflow-x: auto | scroll`).
 *
 *   node scripts/check-layout-overflow.mjs [baseUrl]
 *   BASE_URL=https://… node scripts/check-layout-overflow.mjs
 */
import { chromium } from 'playwright'

const BASE = process.argv[2] || process.env.BASE_URL || 'http://localhost:3000'
const WIDTHS = [320, 360, 390, 768, 1024, 1440]
const ROUTES = [
  '/', '/casos', '/casos/buy-sell-marketplace', '/casos/laliga-club-operations-hub',
  '/casos/coordination-hub', '/casos/the-ux-union', '/articulos',
  '/articulos/del-objeto-a-la-interfaz', '/proceso', '/sobre-mi',
]

const probe = () => {
  const vw = document.documentElement.clientWidth
  const etiqueta = (el) => {
    const c = typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || ''
    return el.tagName.toLowerCase() + (c ? '.' + c.trim().split(/\s+/).slice(0, 2).join('.') : '')
  }
  const fuera = []
  const recortado = []
  const vistos = new Set()
  const els = document.querySelectorAll('body *')
  const rects = [...els].map((el) => el.getBoundingClientRect())
  const desbordes = [...els].map((el) => el.scrollWidth - el.clientWidth)

  els.forEach((el, i) => {
    const r = rects[i]
    if (r.width < 2 || r.height < 2) return
    const saleDelViewport = (r.right > vw + 2 || r.left < -2) && !vistos.has(el.parentElement)
    const desbordaDentro = desbordes[i] > 4 && el.clientWidth > 40
    if (!saleDelViewport && !desbordaDentro) return
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.opacity === '0') return
    if (el.closest('[aria-hidden="true"]')) return

    if (saleDelViewport) {
      vistos.add(el)
      fuera.push({ el: etiqueta(el), izq: Math.round(r.left), der: Math.round(r.right), texto: (el.textContent || '').trim().slice(0, 40) })
    }
    if (desbordaDentro && cs.overflowX !== 'auto' && cs.overflowX !== 'scroll') {
      recortado.push({ el: etiqueta(el), cw: el.clientWidth, sw: el.scrollWidth, overflowX: cs.overflowX, texto: (el.textContent || '').trim().slice(0, 40) })
    }
  })
  return { vw, fuera: fuera.slice(0, 12), recortado: recortado.slice(0, 12) }
}

const navegador = await chromium.launch()
let fallos = 0

for (const width of WIDTHS) {
  const ctx = await navegador.newContext({ viewport: { width, height: 900 }, hasTouch: width < 900 })
  for (const ruta of ROUTES) {
    const page = await ctx.newPage()
    try {
      await page.goto(BASE + ruta, { waitUntil: 'load', timeout: 30000 })
      await page.waitForTimeout(600)
      const { fuera, recortado } = await page.evaluate(probe)
      if (fuera.length || recortado.length) {
        fallos += fuera.length + recortado.length
        console.error(`\n✗ ${ruta} @ ${width}px`)
        for (const f of fuera) console.error(`   fuera del viewport  ${f.el}  ${f.izq}..${f.der}  «${f.texto}»`)
        for (const r of recortado) console.error(`   recortado           ${r.el}  cw${r.cw}/sw${r.sw} (${r.overflowX})  «${r.texto}»`)
      }
    } catch (error) {
      fallos++
      console.error(`\n✗ ${ruta} @ ${width}px — ${String(error).split('\n')[0]}`)
    }
    await page.close()
  }
  await ctx.close()
}

await navegador.close()

if (fallos > 0) {
  console.error(`\nLayout overflow check failed: ${fallos} incidencias en ${ROUTES.length} rutas × ${WIDTHS.length} anchos.`)
  console.error('Si alguna es sangrado intencionado, márcala con aria-hidden="true" o declárala overflow-x: auto.')
  process.exit(1)
}

console.log(`Layout overflow check passed (${ROUTES.length} rutas × ${WIDTHS.length} anchos).`)
