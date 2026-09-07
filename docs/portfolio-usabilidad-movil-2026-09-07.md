# Usabilidad móvil y CSP · 7 de septiembre de 2026

Traspaso a Codex. Auditoría en producción (375×812, emulación táctil) + lectura de código.
Cambios aplicados por Claude sobre el portfolio público. **No se ha tocado `owner-platform`**
ni ningún archivo con modificaciones pendientes en el árbol de trabajo.

## Aplicado

### 1. CSP: el worker de Troika estaba bloqueado — `next.config.ts`

`worker-src` permitía `blob:` pero `script-src` no. `troika-three-text` crea su worker desde
un blob y dentro llama a `importScripts`, que se valida contra `script-src`. En producción la
consola repetía en bucle:

```
Loading the script 'blob:…' violates the following Content Security Policy directive:
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https:"
worker module init function failed to rehydrate
```

Consecuencia: `<Text>Manuel García-Llera</Text>` (`HeroOrbCanvas.tsx:107`) no llegaba a
renderizarse y el hero mostraba una esfera vacía. El requisito firme del proyecto —el nombre
deformándose a través del orbe— no se cumplía en producción por una directiva de seguridad,
no por la implementación 3D.

Cambio: `blob:` añadido a `script-src` y `script-src-elem` declarado explícitamente para no
depender del fallback. Sin ampliar permisos a otros orígenes.

**Verificar:** consola de `/` sin errores de CSP; nombre visible tras el orbe en desktop y móvil.

### 2. Gesto táctil en el carrusel — `useSwipe.ts`, `ProjectPreviewCarousel.tsx`, `CaseCard.tsx`

El carrusel no tenía ningún handler de puntero y las diapositivas están apiladas en absoluto,
así que tampoco existía swipe nativo: en móvil solo se podía avanzar con flechas.

Complicación: `.rd-case-hit-area` es un `<Link>` a pantalla completa con `z-index: 6` sobre el
visual, y es **hermano** del carrusel, no ancestro. Los eventos de puntero no llegan al
carrusel en la variante `card`. Por eso el gesto se resuelve en dos sitios:

- `hooks/useSwipe.ts` — umbral de 40 px horizontales, exige que el desplazamiento horizontal
  supere al vertical, ignora `pointerType === 'mouse'`. Expone `consumeDrag()`.
- `ProjectPreviewCarousel` — nueva prop `controlRef: MutableRefObject<CarouselControl | null>`
  que expone `move()`. En la variante `feature` (ficha de caso) el gesto se ata a la raíz del
  propio carrusel, donde sí recibe eventos.
- `CaseCard` — ata el gesto a `.rd-case-visual` (ancestro del enlace, sí recibe el burbujeo) y
  cancela el `click` del `<Link>` con `consumeDrag()` cuando ha habido arrastre, para que un
  swipe no navegue al caso.
- CSS: `touch-action: pan-y` en `.rd-case-visual` y `.rd-preview-carousel`, para que el gesto
  horizontal sea nuestro y el scroll vertical siga siendo del navegador.

**Verificar en 375 px:** arrastrar a izquierda avanza, a derecha retrocede; el scroll vertical
funciona dentro del carrusel; un toque limpio sigue navegando al caso.

### 3. Controles del carrusel inalcanzables en táctil — `responsive.css`

`redesign.css:771-781` ocultaba controles y pestañas salvo `data-engaged='true'`, y
`CasesSection` marca engaged **una sola** tarjeta: la más centrada en el viewport
(`selectCenteredPreview`). Además `[data-frame='cover']` los forzaba a `opacity: 0`.
Sin hover, en móvil el usuario no tenía control sobre ninguna tarjeta no centrada, ni sobre
ninguna mientras se mostraba la portada.

Cambio: en `@media (pointer: coarse)`, controles y pestañas permanentemente visibles y
desacoplados de `data-engaged` y `data-frame`. El comportamiento en escritorio no cambia.

### 4. La rejilla de metadatos perdía dos columnas fuera de pantalla — `responsive.css`

Medido en `/casos/buy-sell-marketplace` a 375 px:

```
.rd-meta-grid  clientWidth: 343  scrollWidth: 522
grid-template-columns computado: 399.94px 105.66px
```

La segunda pista (Contribución, Año) quedaba **fuera del viewport** y `.rd-root { overflow-x: clip }`
la ocultaba sin scroll ni recorte visible: información simplemente ausente en móvil.

Causa: `1fr` equivale a `minmax(auto, 1fr)`; el min-content de la tira de tecnologías
(`.rd-tech-stack`, 400 px) inflaba la pista porque el **item de rejilla** no tenía `min-width: 0`
—`.rd-tech-stack` sí lo tiene, pero no basta si su celda no puede encoger—.

Cambio: `min-width: 0` en los items de `.rd-meta-grid` y una sola columna por debajo de 768 px.

Nota para Codex: `.rd-root { overflow-x: clip }` enmascara toda esta familia de fallos. Por eso
la auditoría del 4 de septiembre informó de «0 documentos con overflow horizontal» siendo cierto
y a la vez engañoso. Conviene medir `scrollWidth > clientWidth` por elemento, no solo el documento.

### 5. Objetivos táctiles y tira de pestañas — `responsive.css`

- Pestañas del carrusel (`min-height: 1.9rem` ≈ 30 px) y enlaces del preludio (≈ 15 px) pasan a
  área activa de 44 px mediante pseudo-elemento, sin cambiar el tamaño tipográfico.
- Botones de control vuelven a 2.75 rem en punteros gruesos.
- La tira de pestañas, desplazable con la barra oculta, recibe máscara de degradado a la derecha
  y `scroll-snap` para que se entienda que hay más contenido.

## Verificado aquí

`tsc --noEmit`, `eslint` sobre los archivos tocados, `check:hero`, `check:responsive-type`,
`check:mobile-nav`, `check:encoding`, `check:public-boundary` — todo en verde.

`vitest` y `next build` **no** se han podido ejecutar: `node_modules` está instalado con binarios
nativos de Windows y la sesión corría en un shell Linux (`rolldown-binding.linux-x64-gnu.node`
no existe). **Codex debe ejecutar `npm run check:all` en Windows antes de desplegar.**

Los tests unitarios existentes de `ProjectPreviewCarousel` y `CaseCard` no se han modificado.
Si alguno afirma que los controles están ocultos en portada, habrá que acotarlo a puntero fino.

## Pendiente, no aplicado

1. **Portada Buy&Sell descuadrada a 375 px** (home, primer caso). Medido: `.rd-buy-sell-cover`
   tiene `scrollWidth: 594` en una caja de 375 con `overflow: hidden`; `__grid` se renderiza de
   −174 a 549 px por `transform: matrix3d(1.35, …)` y `__aurora` de −219 a 594. La caja es
   correcta; la composición interna está calibrada para un ancho de escritorio. Es dirección de
   arte, no un bug de layout: no lo toco sin criterio de Manuel.
2. **Capturas de Figma ilegibles a 375 px.** Requiere recortes específicos para móvil o
   afordancia de ampliación. Decisión de contenido.
3. **Recorrido del orbe** (`HeroOrbCanvas.tsx:24-26`, `±0.08` unidades): aplazado por decisión
   de Manuel el 7 de septiembre. Prioridad a usabilidad y código.
4. **Editorial:** descargos de autoría antes de la primera evidencia en la ficha de caso; caso
   sin resultado visual sobre el pliegue; ruta `/investigacion` inexistente; `fintech-app` y
   `estadio-3d` con `published: false`.
