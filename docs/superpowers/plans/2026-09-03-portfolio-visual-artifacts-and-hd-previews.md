# Portfolio Visual Artifacts and HD Previews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recuperar el artefacto refractivo original del hero, enriquecer capacidades y transición a casos con visuales pertinentes, y mostrar las capturas de proyecto con nitidez real en cualquier densidad de pantalla.

**Architecture:** Mantener la landing y su sistema de temas actuales. El hero reutilizará la implementación Three.js/R3F conservada en `archive/hero-v1`; las capacidades consumirán un catálogo tipado de activos raster reales; la transición a casos será un componente visual aislado; y el carrusel ajustará la negociación de imágenes de Next sin desactivar su optimizador.

**Tech Stack:** Next.js 16, React 19, TypeScript, `@react-three/fiber`, `@react-three/drei`, Next Image, CSS, Vitest, ImageGen.

**Spec:** `docs/superpowers/specs/2026-09-03-portfolio-visual-artifacts-and-hd-previews-design.md`

## Global Constraints

- Un único protagonista visual por tramo de página.
- Fondos `#050505` en modo oscuro y `#fbfbf8` en modo claro.
- El verde fosforito se reserva para conexión, investigación o estado activo.
- Ningún activo puede incorporar texto, CTA o marco ornamental.
- Todas las animaciones respetan `prefers-reduced-motion` y ningún canvas bloquea interacción o scroll.
- Verificar 390 × 844, 430 × 932, tableta, portátil y escritorio amplio.
- No publicar todavía el acceso «Research Lab» ni crear rutas nuevas.

## File map

- Modify `src/features/redesign/components/HeroOrbCanvas.tsx`: recuperar la esfera refractiva estable y su fondo dependiente del tema.
- Modify `src/features/redesign/components/Hero.tsx`: fallback único y semántica de carga del canvas.
- Modify `src/features/redesign/components/HeroOrbCanvas.unit.test.ts`: contrato de geometría, material, tema y movimiento reducido.
- Modify `src/features/redesign/components/CapabilityAccordion.tsx`: catálogo de capacidades con imagen por panel.
- Modify `src/features/redesign/components/CapabilityAccordion.unit.test.tsx`: presencia, unicidad y carga de los visuales.
- Create `public/art/capabilities/*.webp`: seis activos conceptuales transparentes o sobre blanco cálido.
- Create `src/features/redesign/components/CasesTransitionArtifact.tsx`: artefacto decorativo antes de casos.
- Create `src/features/redesign/components/CasesTransitionArtifact.unit.test.tsx`: contrato semántico del artefacto.
- Modify `src/features/redesign/components/CasesSection.tsx`: insertar el artefacto de transición.
- Modify `src/features/redesign/components/ResearchBanner.tsx`: clase estructural para el espaciado móvil del objeto HCI.
- Modify `src/features/redesign/components/ProjectPreviewCarousel.tsx`: calidad y `sizes` adecuados a cada variante.
- Modify `src/features/redesign/components/ProjectPreviewCarousel.unit.test.tsx`: calidad y estrategia de carga.
- Modify `src/features/redesign/redesign.css`: fondos, espacios, acordeones, artefactos y movimiento reducido.
- Modify `src/features/redesign/redesign-responsive.unit.test.ts`: contratos responsive y de reducción de movimiento.

---

### Task 1: Recuperar la esfera refractiva original del hero

**Files:**
- Modify: `src/features/redesign/components/HeroOrbCanvas.tsx`
- Modify: `src/features/redesign/components/Hero.tsx`
- Test: `src/features/redesign/components/HeroOrbCanvas.unit.test.ts`
- Test: `src/features/redesign/components/Hero.unit.test.tsx`

**Interfaces:**
- Consumes: `HeroOrbCanvasProps { isDark: boolean; reduceMotion: boolean; onReady?: () => void }`.
- Produces: el mismo componente público `HeroOrbCanvas`, sin cambiar sus consumidores.

- [ ] **Step 1: Escribir los tests que describen el artefacto recuperado**

```ts
it('recovers the stable refractive sphere from the archived hero', () => {
  expect(source).toContain('scale={[1.38, 1.06, 0.72]}')
  expect(source).toContain('sphereGeometry args={[1, 96, 64]}')
  expect(source).toContain('MeshTransmissionMaterial')
  expect(source).toContain('MeshDistortMaterial')
  expect(source).toContain("isDark ? '#050505' : '#fbfbf8'")
  expect(source).not.toContain('scale={[1.58, 0.82, 0.68]}')
})

it('keeps one fallback until the recovered canvas is ready', () => {
  expect(markup.match(/rd-hero-art-fallback/g)).toHaveLength(1)
  expect(markup).toContain('data-ready="false"')
})
```

- [ ] **Step 2: Ejecutar los tests y confirmar el fallo**

Run: `npx vitest run --config vitest.unit.config.ts src/features/redesign/components/HeroOrbCanvas.unit.test.ts src/features/redesign/components/Hero.unit.test.tsx`

Expected: FAIL porque el canvas actual usa el esferoide `1.58 × 0.82 × 0.68` y no adjunta el fondo temático.

- [ ] **Step 3: Portar la geometría y los materiales sin arrastrar la antigua landing**

Implementar en `HeroOrbCanvas.tsx` un único grupo estable:

```tsx
<color attach="background" args={[isDark ? '#050505' : '#fbfbf8']} />
<group ref={groupRef} position={[0, -0.02, 0.28]} scale={[1.38, 1.06, 0.72]}>
  <mesh>
    <sphereGeometry args={[1, 96, 64]} />
    <MeshTransmissionMaterial
      backside
      backsideThickness={0.48}
      chromaticAberration={0.01}
      distortion={0.09}
      distortionScale={0.16}
      temporalDistortion={reduceMotion ? 0 : 0.055}
      roughness={0.015}
      thickness={1.28}
      transmission={1}
      clearcoat={1}
      attenuationColor={isDark ? '#f7f7f3' : '#ffffff'}
      attenuationDistance={1.35}
    />
  </mesh>
  <mesh scale={[1.006, 1.004, 1.006]}>
    <sphereGeometry args={[1, 96, 64]} />
    <MeshDistortMaterial
      color="#f3f3ee"
      transparent
      opacity={0.62}
      roughness={0.18}
      distort={0.22}
      speed={reduceMotion ? 0 : 0.42}
      depthWrite={false}
    />
  </mesh>
</group>
```

Mantener la interpolación suave existente para puntero, pero reducir desplazamiento en móvil y no cambiar nunca el tipo de geometría después de `onReady`.

- [ ] **Step 4: Ejecutar tests de hero**

Run: `npx vitest run --config vitest.unit.config.ts src/features/redesign/components/HeroOrbCanvas.unit.test.ts src/features/redesign/components/Hero.unit.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit del hero recuperado**

```bash
git add src/features/redesign/components/HeroOrbCanvas.tsx src/features/redesign/components/Hero.tsx src/features/redesign/components/HeroOrbCanvas.unit.test.ts src/features/redesign/components/Hero.unit.test.tsx
git commit -m "feat: restore refractive hero artifact"
```

---

### Task 2: Incorporar una evidencia visual por capacidad

**Files:**
- Modify: `src/features/redesign/components/CapabilityAccordion.tsx`
- Modify: `src/features/redesign/components/CapabilityAccordion.unit.test.tsx`
- Create: `public/art/capabilities/product-system.webp`
- Create: `public/art/capabilities/design-system.webp`
- Create: `public/art/capabilities/frontend-surface.webp`
- Create: `public/art/capabilities/hci-material.webp`
- Create: `public/art/capabilities/human-ai.webp`
- Create: `public/art/capabilities/spatial-light.webp`
- Modify: `src/features/redesign/redesign.css`

**Interfaces:**
- Consumes: estado local `open: number` del acordeón.
- Produces: `Capability` con `title`, `body`, `href`, `cta`, `imageSrc` e `imageAlt`.

- [ ] **Step 1: Escribir el test de estructura y unicidad**

```tsx
it('associates one lazy visual with every capability answer', () => {
  const markup = renderToStaticMarkup(<CapabilityAccordion />)
  expect(markup.match(/class="rd-now__answer-visual"/g)).toHaveLength(6)
  expect(markup.match(/loading="lazy"/g)).toHaveLength(6)
  for (const name of ['product-system', 'design-system', 'frontend-surface', 'hci-material', 'human-ai', 'spatial-light']) {
    expect(markup).toContain(`/art/capabilities/${name}.webp`)
  }
})
```

- [ ] **Step 2: Ejecutar el test y confirmar el fallo**

Run: `npx vitest run --config vitest.unit.config.ts src/features/redesign/components/CapabilityAccordion.unit.test.tsx`

Expected: FAIL porque los paneles todavía no incluyen imágenes.

- [ ] **Step 3: Generar los seis activos con ImageGen**

Usar como dirección común: «minimal premium 3D editorial object, one clear concept, tactile matte black plus one translucent pastel material and a restrained fluorescent-lime connection, isolated, no text, no frame, generous negative space, 16:9». Cambiar únicamente la metáfora de cada archivo según las seis direcciones de la especificación. Guardar cada resultado en `public/art/capabilities/` y comprobar visualmente que no repite la misma forma.

- [ ] **Step 4: Convertir el catálogo en objetos tipados y renderizar la imagen dentro de la respuesta**

```tsx
interface Capability {
  title: string
  body: string
  href: string
  cta: string
  imageSrc: string
  imageAlt: string
}

<div className="rd-now__answer">
  <div>
    <p>{item.body}</p>
    <a href={item.href}>{item.cta} <span aria-hidden="true">→</span></a>
    <figure className="rd-now__answer-visual">
      <Image src={item.imageSrc} alt={item.imageAlt} width={1280} height={720} loading="lazy" sizes="(max-width: 760px) calc(100vw - 4rem), 44vw" />
    </figure>
  </div>
</div>
```

Actualizar el grid colapsable para que el wrapper interior tenga `min-height: 0`; animar opacidad y desplazamiento de la figura solo cuando `article.is-open`.

- [ ] **Step 5: Ejecutar tests del acordeón**

Run: `npx vitest run --config vitest.unit.config.ts src/features/redesign/components/CapabilityAccordion.unit.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit de las capacidades visuales**

```bash
git add public/art/capabilities src/features/redesign/components/CapabilityAccordion.tsx src/features/redesign/components/CapabilityAccordion.unit.test.tsx src/features/redesign/redesign.css
git commit -m "feat: add visual evidence to capabilities"
```

---

### Task 3: Dar aire al artefacto HCI en móvil

**Files:**
- Modify: `src/features/redesign/components/ResearchBanner.tsx`
- Modify: `src/features/redesign/redesign.css`
- Modify: `src/features/redesign/redesign-responsive.unit.test.ts`

**Interfaces:**
- Consumes: `.rd-research-copy` y `.rd-research-artifact` existentes.
- Produces: layout móvil sin solapamientos y con separación mínima de 32 px.

- [ ] **Step 1: Escribir el contrato responsive fallido**

```ts
expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*\.rd-research-artifact\s*\{[^}]*margin-top:\s*clamp\(2rem,\s*8vw,\s*3rem\)/)
expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*\.rd-research-banner\s*\{[^}]*grid-template-rows:\s*auto auto/)
```

- [ ] **Step 2: Ejecutar y comprobar el fallo**

Run: `npx vitest run --config vitest.unit.config.ts src/features/redesign/redesign-responsive.unit.test.ts`

Expected: FAIL por ausencia del flujo vertical explícito.

- [ ] **Step 3: Sustituir la colocación absoluta móvil por flujo de grid**

```css
@media (max-width: 767px) {
  .rd-research-banner { grid-template-columns: 1fr; grid-template-rows: auto auto; }
  .rd-research-artifact {
    position: relative;
    inset: auto;
    min-height: 16rem;
    margin-top: clamp(2rem, 8vw, 3rem);
  }
}
```

Mantener el CTA después del texto y antes del final del bloque; verificar que el objeto no queda pegado al párrafo ni empuja el CTA fuera de una altura razonable.

- [ ] **Step 4: Ejecutar tests responsive**

Run: `npx vitest run --config vitest.unit.config.ts src/features/redesign/redesign-responsive.unit.test.ts src/features/redesign/components/ResearchBanner.unit.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit del ajuste HCI**

```bash
git add src/features/redesign/components/ResearchBanner.tsx src/features/redesign/redesign.css src/features/redesign/redesign-responsive.unit.test.ts
git commit -m "fix: add breathing room to mobile HCI artifact"
```

---

### Task 4: Crear el artefacto de transición hacia casos

**Files:**
- Create: `src/features/redesign/components/CasesTransitionArtifact.tsx`
- Create: `src/features/redesign/components/CasesTransitionArtifact.unit.test.tsx`
- Create: `public/art/cases-convergence-v1.webp`
- Modify: `src/features/redesign/components/CasesSection.tsx`
- Modify: `src/features/redesign/components/CasesSection.unit.test.tsx`
- Modify: `src/features/redesign/redesign.css`
- Modify: `src/features/redesign/redesign-responsive.unit.test.ts`

**Interfaces:**
- Consumes: ningún estado de negocio.
- Produces: `CasesTransitionArtifact(): JSX.Element`, decorativo y sin interacción.

- [ ] **Step 1: Escribir tests de inserción y semántica**

```tsx
it('places one decorative convergence artifact before the cases label', () => {
  const markup = renderToStaticMarkup(<CasesSection />)
  expect(markup.indexOf('rd-cases-transition')).toBeLessThan(markup.indexOf('Casos seleccionados'))
  expect(markup.match(/rd-cases-transition/g)).toHaveLength(1)
  expect(markup).toContain('aria-hidden="true"')
})
```

- [ ] **Step 2: Ejecutar el test y confirmar el fallo**

Run: `npx vitest run --config vitest.unit.config.ts src/features/redesign/components/CasesTransitionArtifact.unit.test.tsx src/features/redesign/components/CasesSection.unit.test.tsx`

Expected: FAIL porque el componente no existe.

- [ ] **Step 3: Generar y guardar un activo distinto de los demás**

Prompt base: «three materially distinct minimalist 3D modules — research, design, implementation — converging toward one small central product node; matte black, milky pastel blue, soft coral and one fluorescent-lime signal; asymmetrical, transparent background, generous negative space, no text, no ringed planet, no egg, no repeated portfolio artifact».

Guardar como `public/art/cases-convergence-v1.webp`.

- [ ] **Step 4: Implementar el componente y su movimiento**

```tsx
export function CasesTransitionArtifact() {
  return (
    <figure className="rd-cases-transition" aria-hidden="true">
      <Image src="/art/cases-convergence-v1.webp" alt="" width={1536} height={1024} sizes="(max-width: 760px) 76vw, 38vw" />
    </figure>
  )
}
```

Insertarlo como primer hijo de `CasesSection`. Animar una deriva vertical máxima de 12 px y escala máxima de 1.02; desactivarla con movimiento reducido.

- [ ] **Step 5: Ejecutar tests de casos y responsive**

Run: `npx vitest run --config vitest.unit.config.ts src/features/redesign/components/CasesTransitionArtifact.unit.test.tsx src/features/redesign/components/CasesSection.unit.test.tsx src/features/redesign/redesign-responsive.unit.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit del puente visual**

```bash
git add public/art/cases-convergence-v1.webp src/features/redesign/components/CasesTransitionArtifact.tsx src/features/redesign/components/CasesTransitionArtifact.unit.test.tsx src/features/redesign/components/CasesSection.tsx src/features/redesign/components/CasesSection.unit.test.tsx src/features/redesign/redesign.css src/features/redesign/redesign-responsive.unit.test.ts
git commit -m "feat: add visual transition into selected cases"
```

---

### Task 5: Entregar previews realmente nítidas

**Files:**
- Modify: `src/features/redesign/components/ProjectPreviewCarousel.tsx`
- Modify: `src/features/redesign/components/ProjectPreviewCarousel.unit.test.tsx`
- Modify: `src/features/redesign/content/cases.ts` only if a source image must be replaced by an existing HD sibling.

**Interfaces:**
- Consumes: `variant: 'card' | 'feature'`, `priority` y `CaseVisualSlide.fit`.
- Produces: `quality={92}` y `sizes` coherentes con el ancho renderizado.

- [ ] **Step 1: Escribir tests para calidad, tamaños y carga**

```tsx
it('requests high-density project frames without disabling optimization', () => {
  const markup = renderToStaticMarkup(<ProjectPreviewCarousel label="Caso" slides={slides} engaged />)
  expect(markup).toContain('q=92')
  expect(markup).toContain('(max-width: 767px) 100vw, 58vw')
  expect(markup).not.toContain('unoptimized')
})
```

Añadir otro caso con `variant="feature"` y esperar `(max-width: 767px) 100vw, 62vw`.

- [ ] **Step 2: Ejecutar el test y confirmar el fallo**

Run: `npx vitest run --config vitest.unit.config.ts src/features/redesign/components/ProjectPreviewCarousel.unit.test.tsx`

Expected: FAIL porque la calidad actual es la predeterminada 75 y el `sizes` móvil infravalora algunas composiciones a pantalla completa.

- [ ] **Step 3: Configurar Next Image por variante**

```tsx
<Image
  src={slide.src}
  alt={isActive ? slide.alt : ''}
  fill
  quality={92}
  priority={priority && index === 0}
  sizes={variant === 'feature'
    ? '(max-width: 767px) 100vw, 62vw'
    : '(max-width: 767px) 100vw, 58vw'}
/>
```

Confirmar en `cases.ts` que todas las slides apuntan a sufijos `-hd.webp` cuando existe esa fuente. Conservar `club-mobile-hd.webp` como `contain`; no ampliarla para llenar una preview desktop.

- [ ] **Step 4: Ejecutar tests del carrusel y contenido**

Run: `npx vitest run --config vitest.unit.config.ts src/features/redesign/components/ProjectPreviewCarousel.unit.test.tsx src/features/redesign/content/cases.unit.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit de previews HD**

```bash
git add src/features/redesign/components/ProjectPreviewCarousel.tsx src/features/redesign/components/ProjectPreviewCarousel.unit.test.tsx src/features/redesign/content/cases.ts
git commit -m "fix: render project previews at high density"
```

---

### Task 6: Verificación visual integral y publicación

**Files:**
- Modify if needed: files touched in Tasks 1–5 only.
- Create: `.tmp-screens/qa-visual-artifacts/` comparison captures; do not commit.

**Interfaces:**
- Consumes: landing completa y URL local.
- Produces: evidencia visual comparada y despliegue productivo verificado.

- [ ] **Step 1: Ejecutar la suite completa**

Run:

```bash
npx vitest run --config vitest.unit.config.ts
npm run check:responsive
npm run lint
npm run typecheck
npm run build
```

Expected: todos los comandos terminan con código 0.

- [ ] **Step 2: Capturar estados comparables en el navegador elegido por el usuario**

Capturar hero oscuro y claro, seis acordeones abiertos, HCI y transición a casos en 390 × 844, 430 × 932, 768 × 1024, 1440 × 900 y 1920 × 1080. Para cada zona, colocar la referencia aportada o histórica junto a la implementación y comprobar recortes, pesos, espacios, bordes, fondos y solapamientos.

- [ ] **Step 3: Verificar nitidez efectiva de previews**

En DPR 2 y 3, inspeccionar el `currentSrc` de cada slide activa y confirmar que el ancho solicitado es igual o superior al ancho CSS multiplicado por DPR, dentro de los límites de la fuente. Comprobar visualmente texto pequeño y bordes de interfaz en Buy&Sell, LaLiga y TheUXUnion.

- [ ] **Step 4: Verificar comportamiento y accesibilidad**

Confirmar: una sola preview animándose; acordeón operable por teclado; ninguna imagen bloquea enlaces; `prefers-reduced-motion` congela movimientos; no hay errores de consola; no existe desplazamiento horizontal.

- [ ] **Step 5: Publicar y comprobar rutas principales**

Run:

```powershell
$env:NODE_USE_SYSTEM_CA='1'
npx vercel --prod --yes
```

Después comprobar respuestas 200 para `/`, `/casos`, `/casos/buy-sell-marketplace`, `/casos/laliga-club-operations-hub`, `/casos/the-ux-union` y `/articulos`.

- [ ] **Step 6: Entregar el enlace móvil**

Abrir `https://portfolio-manuelgarciallera.vercel.app/` a 390 × 844 y devolver ese enlace como primera línea del cierre, junto con resultados de pruebas y cualquier limitación real detectada.

## Deferred navigation contract

No requiere código en esta implementación. Cuando el dominio tenga contenido, una tarea independiente añadirá `Research Lab` al menú y mostrará `Something Human · Human–AI Research` como descriptor, con un único acento verde fosforito y destino externo verificable.
