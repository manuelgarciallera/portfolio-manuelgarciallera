# Build público e aislamiento · 14/09/2026

Base comprobada: `6db0f20cbd3fb816f7cacd1b11e35008eee0c36a`.
Alcance: cierre de la verificación pendiente de los planes owner, no publicación.

## Ejecución

Build separado con el script existente `scripts/build-public-proof.mjs`,
aplicando al entorno hijo el normalizador de confianza TLS ya probado en owner:

```powershell
node --input-type=module -e "import { buildEnvironment } from './owner-platform/scripts/build-environment.mjs'; Object.assign(process.env, buildEnvironment(process.env)); await import('./scripts/build-public-proof.mjs')"
```

Sesión 20202, salida 0 (ad65d7). Compilación 31,4 s, tipos 15,7 s,
29 páginas generadas. Tabla de rutas sin owner/admin. Artefacto local
`owner-platform/.data/verification-artifacts/release-proof`; el script reemplaza
solo su artefacto previo de prueba. No borra datos editoriales ni el servidor
de desarrollo activo en 3015. No se desplegó nada.

## Resultado desglosado

`proveOwnerIsolation` sobre ese artefacto: salida 1 (525c98).

| Comprobación | Resultado |
| --- | --- |
| Procedencia del build ligada al HEAD y entradas | Correcta |
| Frontera pública | 21 entradas, cero violaciones |
| Presupuesto bundle | 10 rutas de manifiesto, cero regresiones; tolerancia intacta 1 % / 2048 bytes |
| Paquete owner privado | Sí |
| Runtime raíz idéntico al checkpoint | No |
| Lock raíz idéntico al checkpoint | No |
| Prueba global | **No aprobada** |

SHA-256 de entradas públicas:
`afe3e74dd42aee7dcf3969e635f6ca386a4c7ae71c6b0c0ee8a5201a8a48f84e`.
SHA-256 del snapshot de rutas:
`0b0b89a80d535b55b5ee18f28a078288712d8af70e524d7df7b8bead40b2696c`.

Los dos resultados negativos son diferencias reales frente al checkpoint:
Next/Sharp (`23b3824`), correo (`6077b2f`) y overrides de dependencias
(`b95b525`), entre otras modificaciones posteriores. No son una prueba de que
Payload se haya incorporado a la web. Tampoco se ocultan redefiniendo el
checkpoint ni modificando el baseline.

`git diff 45a1855 HEAD -- src public content package.json package-lock.json
next.config.ts` no devuelve cambios: el trabajo owner posterior al último
arreglo público no ha modificado esas entradas. Eso no demuestra igualdad
con el checkpoint del 04/09 ni sustituye una auditoría de todas las funciones.

## Pendiente

El criterio original de igualdad absoluta con el checkpoint no puede darse
por cumplido. Cualquier revisión de ese criterio debe separar explícitamente
las actualizaciones públicas de seguridad/contenido del trabajo owner y
mantener el checkpoint original recuperable. No actualizar automáticamente
el baseline ni revertir parches de seguridad para conseguir un verde.

Checkpoint resuelto de nuevo a
`0f0adf686b2752e23c25d224f8c60815b10fd451` (818904). Sin push ni despliegue.
