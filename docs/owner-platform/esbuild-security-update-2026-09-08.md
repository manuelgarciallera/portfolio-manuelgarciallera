# Actualización acotada de esbuild — owner

Base `a027190`. Ensayo local del 8 de septiembre de 2026, sin push/despliegue ni dependencias públicas modificadas.

## Motivo y alcance

La auditoría inicial (`npm audit --omit=dev --json`, sesión 97969, salida 1) registró 12 paquetes moderados por dos causas: esbuild y Payload. La dependencia `@esbuild-kit/core-utils@3.3.2` arrastraba esbuild 0.18.20; su consumidor instalado usa `transform`/`transformSync`. Drizzle ya utiliza 0.25.12 en otra rama del árbol.

Se fija únicamente `overrides.@esbuild-kit/core-utils.esbuild = 0.25.12`. Se conserva Payload 3.88.0 y Next 16.3.4, sin `audit fix --force`. Instalación con scripts deshabilitados. Comparación estructurada del lockfile: solo cambian esa copia de esbuild y sus binarios opcionales por plataforma. No se actualizan otras dependencias.

El [aviso de esbuild](https://github.com/advisories/GHSA-67mh-4wv8-2f99) afecta a su servidor de desarrollo; no es evidencia de explotación del portfolio. Se elimina la versión afectada en lugar de ignorar el aviso. Esta actualización atraviesa el rango declarado por core-utils y requiere conservar pruebas del cargador y de las herramientas de esquema.

## Evidencia

- Auditoría posterior, sesión 74222: salida 1, ahora 8 paquetes moderados; desaparece la cadena esbuild. Cero altos/críticos. **No es auditoría verde.**
- Transformaciones reales del consumidor: TypeScript a ESM asíncrono e importación/evaluación, TypeScript a CJS síncrono y evaluación; ambos devuelven el valor esperado. Salida 0.
- Puerta secuencial owner, sesión 65268, finalizada con salida 0: unitarias 974/974 (149 archivos), integración 43/43 (4 archivos), lint, typecheck y compilación Next de producción. Generación estática 23/23 completada. Build ejecutado con `OWNER_PLATFORM_BUILD_PHASE=1` y el binario Next directamente, sin limpiar directorios de desarrollo.
- Separación pública, sesión 72099, salida 0: `test:owner-isolation` 8/8 y `check:public-boundary` 21 entradas. No se cambia el manifiesto ni el lockfile de la web pública.
- Checkpoint `checkpoint/pre-editor-2026-09-04`: `0f0adf686b2752e23c25d224f8c60815b10fd451`, conservado.

El cambio queda validado para el entorno local probado, no como certificación de seguridad completa ni como despliegue. Reversión: revertir el commit dedicado y reinstalar desde el lockfile resultante; no implica restaurar bases de datos porque esta tanda no migra datos.

## Aviso que permanece

El [aviso de desbloqueo de cuentas de Payload](https://github.com/advisories/GHSA-jg8r-5jh2-v2xj) no publica versión corregida; `npm view payload version` devuelve 3.88.0. `Users.access.unlock` ya usa `ownerOnly`, pero esa inspección no certifica mitigación HTTP completa. No se acepta la bajada a 0.1.9 sugerida por npm ni se silencia el aviso.

Siguiente validación independiente: operación de desbloqueo con identidad no-owner y persistencia del bloqueo en fixture real. No provocar bloqueos de cuentas reales. El CMS mantiene pendiente este riesgo y las demás puertas de producción.
