# Integración de Mockups 3D (Apple-like) en el portfolio

## Qué ya está integrado
- Sección 3D en web usando:
  - `three`
  - `@react-three/fiber`
  - `@react-three/drei`
  - `gsap` + `ScrollTrigger`
- Archivo principal de escena:
  - `src/features/portfolio/three/PhoneMockupCanvas.jsx`
- Contenedor de sección y sincronización de scroll:
  - `src/features/portfolio/sections/DeviceSection.jsx`

## Flujo recomendado para meter tu modelo real
1. Exporta desde Blender/3ds Max a `GLB`.
2. Optimiza geometría/texturas.
3. Convierte a componente React si quieres control fino.
4. Sustituye el mockup procedural actual por el modelo real.

## Comandos útiles (referencia)
Usa estos comandos con `npx` para no acoplar herramientas globales:

```bash
# 1) inspeccionar
npx @gltf-transform/cli inspect public/models/iphone-source.glb

# 2) optimizar
npx @gltf-transform/cli optimize public/models/iphone-source.glb public/models/iphone-optimized.glb --compress draco --texture-compress webp

# 3) simplificar (si necesitas bajar peso extra)
npx @gltf-transform/cli simplify public/models/iphone-optimized.glb public/models/iphone-lite.glb --ratio 0.7

# 4) convertir a JSX (componente R3F)
npx gltfjsx public/models/iphone-optimized.glb -o src/features/portfolio/three/models/IphoneModel.jsx --transform
```

## Criterios de performance
- Objetivo GLB inicial: `< 3 MB` por modelo.
- Texturas en `webp/ktx2` cuando sea posible.
- `dpr` limitado (`1` a `1.7`) en Canvas.
- Evitar postprocesado pesado en móvil.
- Cargar escenas 3D con `dynamic(..., { ssr:false })`.

## Efectos Apple-level sin romper rendimiento
- Rotación/posición del modelo con `ScrollTrigger + scrub`.
- `MeshTransmissionMaterial` solo en piezas pequeñas (pantalla cristal).
- Luces simples + `Environment` preset.
- `ContactShadows` sutiles en lugar de múltiples shadow maps.
