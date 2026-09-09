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
    expect(canvas).toContain('COMPACT_GEOMETRY')
  })

  // Manuel lo vio y Codex lo fotografio a 390: el orbe tapaba «uel Garci» y el
  // nombre se partia por el guion. La causa era aritmetica, no de material: con
  // orbY 0.34, escala 0.78 y rotulo en -0.52, el borde inferior del orbe caia en
  // -0.46 y la primera linea empezaba en -0.28. Se solapaban 0.18 unidades.
  //
  // Esta guarda hace la cuenta en vez de buscar cadenas. Si alguien vuelve a mover
  // cualquiera de los cinco numeros hasta que se toquen, falla aqui y no en el
  // telefono de Manuel.
  it('keeps the orb clear of the wordmark in the stacked composition', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/features/redesign/components/HeroOrbCanvas.tsx'),
      'utf8',
    )

    const leer = (clave: string): number => {
      const encontrado = source.match(new RegExp(`${clave}:\\s*(-?[0-9.]+)`))
      expect(encontrado, `falta ${clave} en COMPACT_GEOMETRY`).not.toBeNull()
      return Number(encontrado![1])
    }

    const orbY = leer('orbY')
    const orbScale = leer('orbScale')
    const orbGroupOffsetY = leer('orbGroupOffsetY')
    const orbRimScale = leer('orbRimScale')
    const wordmarkY = leer('wordmarkY')
    const wordmarkMaxSize = leer('wordmarkMaxSize')
    const wordmarkLineHeight = leer('wordmarkLineHeight')
    const wordmarkLines = leer('wordmarkLines')

    // El grupo exterior escala al interior, asi que su desplazamiento tambien.
    const centroOrbe = orbY + orbGroupOffsetY * orbScale
    const bordeInferior = centroOrbe - orbScale * orbRimScale
    const altoTexto = wordmarkLines * wordmarkMaxSize * wordmarkLineHeight
    const bordeSuperiorTexto = wordmarkY + altoTexto / 2

    // Separacion, no roce. Sobre fondo negro el solapamiento no refracta: tapa.
    expect(bordeInferior).toBeGreaterThan(bordeSuperiorTexto + 0.1)

    // Y la composicion entera tiene que caber en el plano visible, ~4.0 de alto.
    const bordeSuperiorOrbe = centroOrbe + orbScale * orbRimScale
    const bordeInferiorTexto = wordmarkY - altoTexto / 2
    expect(bordeSuperiorOrbe).toBeLessThan(2)
    expect(bordeInferiorTexto).toBeGreaterThan(-2)

    // El nombre se parte a proposito por el espacio, nunca por el guion.
    expect(source).toContain("const COMPACT_WORDMARK_TEXT = 'Manuel\\nGarcía-Llera\\nAñón'")
    // El apellido completo no es opcional: es la firma con la que publica.
    expect(source).toContain("const WIDE_WORDMARK_TEXT = 'Manuel García-Llera Añón'")
  })

  // El nombre se partia por el guion en escritorio y el orbe se comia las letras del
  // corte. Medido sobre el render real de produccion a 1440: plano util 4.144 y la
  // cadena a 0.46 pedia 4.355, un 5.1% de mas. El divisor 6.9 correspondia a
  // «Manuel Garcia-», la primera linea, no a la cadena entera.
  //
  // Esta guarda no busca cadenas: simula el calculo del componente sobre los anchos
  // de lienzo reales y exige que el rotulo quepa. Si vuelve a partirse, falla aqui.
  it('sizes the wordmark so it never breaks at the hyphen', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/features/redesign/components/HeroOrbCanvas.tsx'),
      'utf8',
    )

    const leer = (patron: RegExp, nombre: string): number => {
      const encontrado = source.match(patron)
      expect(encontrado, `falta ${nombre} en HeroOrbCanvas.tsx`).not.toBeNull()
      return Number(encontrado![1])
    }

    const avanceApaisado = leer(/WIDE_WORDMARK_ADVANCE = ([0-9.]+)/, 'WIDE_WORDMARK_ADVANCE')
    const avanceCompacto = leer(/COMPACT_WORDMARK_ADVANCE = ([0-9.]+)/, 'COMPACT_WORDMARK_ADVANCE')
    const topeApaisado = leer(/WORDMARK_MAX_SIZE = ([0-9.]+)/, 'WORDMARK_MAX_SIZE')
    const topeCompacto = leer(/wordmarkMaxSize: ([0-9.]+)/, 'wordmarkMaxSize')

    // Avances tipograficos medidos sobre el render, no estimados.
    // Cadena completa «Manuel García-Llera Añón». Derivada de la medida verificada
    // de «Manuel García-Llera» (9.47) por la razón de anchos de las dos cadenas en
    // la fuente real, 10.884/8.412 = 1.2939. Medida, no estimada.
    const CADENA_ENTERA = 12.25
    // Sin cambio: al pasar a tres líneas la más larga sigue siendo «García-Llera».
    const LINEA_LARGA_COMPACTA = 6.91
    // La camara y el fov son fijos, asi que el plano del rotulo siempre mide esto de
    // alto; solo cambia el ancho con la relacion de aspecto del lienzo.
    const ALTO_PLANO = 4.008

    const cabe = (
      anchoLienzo: number,
      altoLienzo: number,
      compacto: boolean,
    ): { fontSize: number; ocupa: number; disponible: number } => {
      const anchoPlano = ALTO_PLANO * (anchoLienzo / altoLienzo)
      const disponible = anchoPlano * 0.9
      const fontSize = Math.min(
        compacto ? topeCompacto : topeApaisado,
        disponible / (compacto ? avanceCompacto : avanceApaisado),
      )
      const ocupa = fontSize * (compacto ? LINEA_LARGA_COMPACTA : CADENA_ENTERA)
      return { fontSize, ocupa, disponible }
    }

    // Lienzos reales medidos en produccion, con su composicion.
    const casos: Array<[string, number, number, boolean]> = [
      ['escritorio 1440', 571, 497, false],
      ['escritorio 1280', 508, 442, false],
      ['escritorio 1024', 430, 374, false],
      ['movil 430', 430, 352, true],
      ['movil 390', 390, 352, true],
      ['movil 360', 360, 352, true],
      ['movil 320', 320, 352, true],
    ]

    for (const [etiqueta, ancho, alto, compacto] of casos) {
      const { ocupa, disponible } = cabe(ancho, alto, compacto)
      expect(ocupa, `${etiqueta}: el rotulo se sale y troika lo partiria`).toBeLessThanOrEqual(
        disponible,
      )
    }

    // Y que el margen no sea tan grande que el rotulo quede ridiculo en escritorio.
    const escritorio = cabe(571, 497, false)
    expect(escritorio.ocupa / escritorio.disponible).toBeGreaterThan(0.85)

    // Un solo divisor para las dos composiciones es exactamente el fallo que hubo.
    expect(source).not.toMatch(/maxWidth \/ 6\.9\b/)
    // Y el divisor apaisado no puede volver a ser el de la cadena corta.
    expect(avanceApaisado).toBeGreaterThan(11)
  })

  it('reports readiness only after the scene has rendered a frame', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/HeroOrbCanvas.tsx'), 'utf8')
    expect(source).toContain('function SceneReady')
    expect(source).toContain('useFrame(() =>')
    expect(source).toContain('<SceneReady onReady={onReady} />')
    expect(source).not.toContain('onCreated={onReady}')
  })
})
