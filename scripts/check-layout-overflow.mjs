#!/usr/bin/env node
/**
 * Comprueba que ningún contenido real quede fuera de la pantalla.
 *
 * `.rd-root { overflow-x: clip }` hace que `document.scrollWidth` sea siempre
 * correcto: una página puede tener 61 px de contenido fuera del viewport y
 * seguir dando verde. Este script no mide el documento: busca elementos que
 * lleven texto o sean interactivos y que el usuario no pueda ver, porque el
 * viewport o un ancestro con `overflow: hidden` los oculta.
 *
 * No se denuncia el sangrado deliberado: lo decorativo (`aria-hidden="true"`),
 * lo que vive dentro de una región declarada desplazable (`overflow-x: auto`),
 * y los patrones listados en SANGRADO_INTENCIONADO.
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

/** Piezas cuyo desbordamiento es dirección de arte, verificada a mano. */
const SANGRADO_INTENCIONADO = [
  '.rd-visual-journey__rail',   // raíl tipográfico en marquesina
  '.rd-preview-viewport',       // encuadre ampliado de la diapositiva
  '.rd-buy-sell-cover',         // portada editorial con planos en perspectiva
  '.rd-project-cover',
  '.rd-buy-sell-scene',
  '.rd-footer-artwork',
  '.rd-hero-art',
  '.rd-research-artifact',
  '.rd-manifesto-art',
  '.rd-now__visual',
  '.rd-cases-transition',
  '.rd-project-gateway__orbit',
]

const OCULTO_MINIMO = 0.5 // más de la mitad fuera de vista = contenido perdido

const probe = ([intencionado, minimo]) => {
  const vw = document.documentElement.clientWidth
  const etiqueta = (el) => {
    const c = typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || ''
    return el.tagName.toLowerCase() + (c ? '.' + c.trim().split(/\s+/).slice(0, 2).join('.') : '')
  }
  const llevaContenido = (el) => {
    if (el.matches('a[href], button, input, select, summary, [role="button"]')) return true
    for (const nodo of el.childNodes) if (nodo.nodeType === 3 && nodo.textContent.trim().length > 1) return true
    return false
  }
  const recorte = (el) => {
    // Rectángulo visible tras aplicar el recorte de cada ancestro.
    let caja = el.getBoundingClientRect()
    let izq = caja.left, der = caja.right
    for (let p = el.parentElement; p; p = p.parentElement) {
      const cs = getComputedStyle(p)
      if (cs.overflowX === 'hidden' || cs.overflowX === 'clip') {
        const pr = p.getBoundingClientRect()
        izq = Math.max(izq, pr.left)
        der = Math.min(der, pr.right)
      }
    }
    izq = Math.max(izq, 0)
    der = Math.min(der, vw)
    return { ancho: caja.width, visible: Math.max(0, der - izq), caja }
  }

  const perdidos = []
  for (const el of document.querySelectorAll('body *')) {
    if (perdidos.length >= 12) break
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) continue
    if (!llevaContenido(el)) continue
    if (el.closest('[aria-hidden="true"]')) continue
    if (el.closest('[data-bleed="intentional"]')) continue
    if (intencionado.some((sel) => el.closest(sel))) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.opacity === '0') continue

    // Dentro de una región desplazable el contenido fuera de vista es alcanzable.
    let enScroller = false
    for (let p = el.parentElement; p; p = p.parentElement) {
      const pcs = getComputedStyle(p)
      if (pcs.overflowX === 'auto' || pcs.overflowX === 'scroll') { enScroller = true; break }
    }
    if (enScroller) continue

    const { ancho, visible } = recorte(el)
    if (ancho > 0 && visible / ancho < 1 - minimo) {
      perdidos.push({
        el: etiqueta(el),
        visible: `${Math.round((visible / ancho) * 100)}%`,
        caja: `${Math.round(r.left)}..${Math.round(r.right)}`,
        texto: (el.textContent || '').trim().slice(0, 44),
      })
    }
  }
  return { vw, perdidos }
}

const EXECUTABLE = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined
const navegador = await chromium.launch(EXECUTABLE ? { executablePath: EXECUTABLE } : {})
let fallos = 0

for (const width of WIDTHS) {
  const ctx = await navegador.newContext({ viewport: { width, height: 900 }, hasTouch: width < 900 })
  for (const ruta of ROUTES) {
    const page = await ctx.newPage()
    try {
      await page.goto(BASE + ruta, { waitUntil: 'load', timeout: 30000 })
      await page.waitForTimeout(600)
      const { perdidos } = await page.evaluate(probe, [SANGRADO_INTENCIONADO, OCULTO_MINIMO])
      if (perdidos.length) {
        fallos += perdidos.length
        console.error(`\n✗ ${ruta} @ ${width}px`)
        for (const p of perdidos) console.error(`   ${p.el}  visible ${p.visible}  ${p.caja}  «${p.texto}»`)
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
  console.error(`\nLayout overflow check failed: ${fallos} elementos con contenido fuera de vista.`)
  console.error('Si alguno es sangrado deliberado, márcalo con data-bleed="intentional" o añádelo a SANGRADO_INTENCIONADO.')
  process.exit(1)
}

console.log(`Layout overflow check passed (${ROUTES.length} rutas × ${WIDTHS.length} anchos).`)
