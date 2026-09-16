# Orbe orgánico: integración aprobada

Manuel autoriza integrar y publicar la versión azul con líquido emergente y gotas, guardándola antes de explorar ondas azules, violetas y ligeramente rosadas. Prototipo recuperable: `095e2ba0b14719f27a42dee0871d588ec26d8f29`. La variante de color se preparará después, separada para comparar.

## Implementado

- `HeroOrbCanvas.tsx` y `organic-orb-shaders.ts`: WebGL nativo, contorno procedural, corrientes, flotación, giro y gotas; no simulación física.
- Máximo 30 dibujos/s y resolución máxima 384 móvil / 560 desktop. Suspensión fuera de pantalla y con pestaña oculta; limpieza de recursos.
- Cuatro imágenes transparentes generadas del propio shader para ambos temas y tamaños. Alternativa estática con movimiento reducido, fallo o pérdida de contexto.
- Se conserva la composición del H1, CTA y nombre HTML. El fallback absoluto evita que sus dimensiones intrínsecas estiren la caja.
- No se modifican CMS, consentimiento, analítica ni trabajo compartido ajeno. Reserva de coordinación: `14e734b1-5fb1-4394-b730-ea24f0be3620`.

## Evidencia local

- TypeScript y 274 pruebas en 43 archivos: pasan. Cinco comprobaciones antiguas de texto de implementación Three se sustituyen por cobertura real de renderizado y navegador.
- Build público aislado: 30 rutas. Presupuesto home: 138707 bytes raw / 50632 gzip (anterior 138731 / 50612); sin errores de presupuesto.
- Escala: seis viewports, 390–1920; composición y nombre correctos.
- Navegador: ambos temas en 390/1280, píxeles del orbe, movimiento real, límite de resolución, suspensión fuera de pantalla, fallback estático y pérdida de contexto.
- PNG transparentes inspeccionados visualmente. No se ha medido batería ni GPU en un móvil físico; el límite de dibujos no demuestra una tasa mínima de FPS.

## Publicación

Integración guardada y subida en `9541b0767f69dd5f8aa11562da61731149810b21`. CI `35150784079` SUCCESS (validate y owner). Preview `dpl_Eu88Zj7xathdA7ruxPVa2B2RHJzt` READY; promoción crea producción `dpl_E6gTMxSma2ent6swtpYxzjFvgVFs`, READY y alias `https://manuelgarciallera.com` verificados. Referencia pública anterior: `1eb1997`, despliegue `dpl_Dc1SFYuGf1zfrwkUgG29apTMK6s8`, conservado como retorno operativo.

Variante independiente guardada y subida después en `a7d64ed`: ondas espaciales azules/violetas, rosa suave, botón de comparación que recupera exactamente el azul en el mismo fotograma. Prueba local 390/900 PASS (ambos temas, pigmento, movimiento reducido, animación/pausa); capturas revisadas. Se sirve en `http://127.0.0.1:3017/?palette=waves`, solo equipo local. No sustituye el orbe azul público.

Las ocho transiciones de tema locales pasan. Logs Vercel de errores en la ventana consultada de cinco minutos: sin entradas. Esto no equivale a ausencia universal de errores.

Verificación LIVE posterior en el dominio: `verify-organic-orb-public.mjs` PASS 390/1280 en ambos temas (incluye pérdida de contexto en1280dark); `verify-desktop-orb-scale.mjs` PASS seis viewports390–1920. Ejecuciones con No rastrear activado, sin consentimiento de analítica. Publicación verificada, no solo enviada.
