import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

describe('HeroOrbCanvas recovered artifact', () => {
  it('recovers the stable refractive sphere without loading an HDR environment', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/HeroOrbCanvas.tsx'), 'utf8')

    expect(source).not.toContain('Environment')
    expect(source).toContain('<sphereGeometry args={[1, 96, 64]} />')
    expect(source).toContain('dpr={[1, 1.2]}')
    expect(source).toContain("isDark ? '#0d0e0c' : '#fafaf6'")
    expect(source).toContain('distort={0.22}')
    expect(source).toContain('speed={reduceMotion ? 0 : 0.42}')
    expect(source).toContain('scale={[1, 1, 1]}')
    expect(source).not.toContain('scale={[1.58, 0.82, 0.68]}')
  })

  // Manuel describio el defecto asi: «nuestra esfera es mas solida, y agranda el
  // nombre detras; el efecto no esta conseguido». Tenia razon, y las dos causas
  // estaban aseveradas aqui: una cascara blanca al 62% y otra gris al 18% sobre la
  // transmision, que convertian el vidrio en una bola de leche, y `thickness` 1.28
  // con el `ior` por defecto de 1.5, que hacia de lente de aumento en vez de gota.
  //
  // Lo que ahora sostiene el efecto es distinto y por eso se asevera distinto: un
  // vidrio fino que refracta sin ampliar, y un Fresnel en el canto. Un vidrio
  // limpio sobre fondo negro es un agujero negro; lo que hace que se perciba una
  // gota es el borde, no el relleno.
  it('keeps the drop readable instead of veiling the name behind it', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/HeroOrbCanvas.tsx'), 'utf8')

    // Ninguna cascara puede volver a velar el nombre.
    expect(source).not.toContain('opacity={0.62}')
    expect(source).not.toContain('opacity={0.18}')
    expect(source).toContain('opacity={0.05}')

    // Vidrio fino: refracta y ondula, no amplia.
    expect(source).toContain('thickness={0.55}')
    expect(source).toContain('ior={1.28}')
    expect(source).toContain('distortion={0.28}')
    expect(source).toContain('chromaticAberration={0.035}')

    // El canto es lo que hace legible la gota sobre cualquier fondo.
    expect(source).toContain('RIM_FRAGMENT')
    expect(source).toContain('blending={AdditiveBlending}')
    // En claro el canto oscurece; en oscuro ilumina.
    expect(source).toContain("isDark ? '#eaf4ff' : '#334155'")
  })

  // En apaisado el orbe se posa sobre el centro del nombre: es el efecto pedido.
  // En vertical no hay raton que lo mueva y el orbe ocupa una fraccion mucho mayor
  // del ancho, asi que sube y el rotulo baja hasta que solo se rozan. El corte lo
  // decide la anchura del viewport y NO la relacion de aspecto del lienzo: en
  // escritorio es 1.15 y en movil ~1.24, o sea que el movil es el mas apaisado de
  // los dos y esa medida los confundia.
  it('takes the stacked composition from the viewport, never from the canvas ratio', () => {
    const canvas = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/HeroOrbCanvas.tsx'), 'utf8')
    const hero = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/Hero.tsx'), 'utf8')

    expect(hero).toContain("matchMedia('(max-width: 767px)')")
    expect(hero).toContain('isCompact={isCompact}')
    expect(canvas).toContain('isCompact: boolean')
    expect(canvas).not.toContain('PORTRAIT_RATIO')
    expect(canvas).toContain('COMPACT_WORDMARK_Y')
  })

  it('reports readiness only after the scene has rendered a frame', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/HeroOrbCanvas.tsx'), 'utf8')
    expect(source).toContain('function SceneReady')
    expect(source).toContain('useFrame(() =>')
    expect(source).toContain('<SceneReady onReady={onReady} />')
    expect(source).not.toContain('onCreated={onReady}')
  })
})
