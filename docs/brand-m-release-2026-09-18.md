# Prueba reversible de marca M — 18 septiembre 2026

## Alcance autorizado

Manuel aprueba sustituir la marca actual conservando la silueta de su M de Framer y valorar después mantener, ajustar o volver atrás. Dos planos planos: cian `#22B8D6` a la izquierda y azul eléctrico `#2458E6` arriba/derecha. Sin degradado ni nueva animación. No se cambia el orbe, el Hero, el CMS ni el acceso al CV.

Se sustituye únicamente el monograma MG de la navbar (móvil y escritorio compacto). Se conserva el nombre y descripción actuales en escritorio expandido. La marca sigue enlazando a inicio con su nombre accesible. SVG transparente, favicon ICO con tamaños 16/32/48 y SVG en metadata/manifest. Exportador reproducible: `node scripts/build-brand-favicon.mjs`.

## Recuperación

Base anterior: `9364385`; producción anterior: `dpl_Gga3sP4GDanfjkfjARYj5Q4GBHWc`. Revertir únicamente el commit de implementación de marca o volver a ese despliegue, sin resetear cambios posteriores o ajenos. Las capturas Framer originales y el orbe no se modifican.

## Verificación previa

- RED: SiteHeader falla al exigir la nueva imagen antes de integrarla.
- GREEN: 280 pruebas unitarias / 45 archivos; ESLint focal sin errores.
- Build Next 16.3.4: 30 páginas, TypeScript correcto.
- Hero, responsive (8 perfiles), navegación móvil y frontera pública: PASS.
- Comparación del paquete público contra baseline: sin incidencias, baseline intacta.
- `node scripts/verify-brand-mark.mjs`: coincidencia exacta SVG/ICO a 16/32/48, colores de ambos planos y recorte inferior transparente.
- Capturas y prueba de navegador en `.audit/verify-brand-m.mjs`, no incluidas en el paquete público. Verificación automatizada no equivale a prueba en un dispositivo físico.

Navegador local: PASS 390/768/1280 en dark/light; imagen cargada, marca visible en su contexto, assets y favicon HTTP 200, sin overflow ni errores de página, apertura/cierre Escape del menú móvil. Capturas móvil dark/light y escritorio compacto inspeccionadas. SVG 178 bytes; ICO 895 bytes (anterior 5641).

## Publicación

Implementación `3882643`, enviada a origin. CI `35344388467`: validate y owner SUCCESS. Preview `dpl_6T3WY7HLDzEiy5X9oPtFZUAhHD7a` READY; reconstrucción con entorno production `dpl_2WzccPTYXvSEFKPXxrupLGTaZbLA` READY y alias `manuelgarciallera.com` confirmado. Consulta de errores de los últimos 5 minutos sin entradas (no garantiza ausencia universal de errores).

Prueba LIVE en el dominio: los seis escenarios 390/768/1280 dark/light PASS, mismos controles de asset/favicon, marca visible, menú móvil, ausencia de overflow y errores de página. No prueba en dispositivo físico.

Estado: publicado y verificado LIVE. La aceptación estética definitiva corresponde a Manuel.
