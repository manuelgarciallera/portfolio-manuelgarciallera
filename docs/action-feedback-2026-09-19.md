# Respuesta compartida de pulsación · 19/09/2026

Base recuperable: `300b5f4` (CTA móvil anterior `688dbde`). Implementación `33e0e2b`, commit y push. Reserva Hub `86fd02c5-b3f9-491e-9bef-9382e04a5db4`.

Contacto interior del menú y Ver proyectos comparten token de sombra y manejadores de puntero. Entrada 60 ms, recuperación suave; sin transformación, prevención de eventos, captura explícita ni demora de navegación. Limpieza en soltar/cancelar/salir/perder captura/foco/menú contextual. CSS conserva alternativa active, movimiento reducido sin transición y contorno en colores forzados. CV y Contacto superior no cambian; no se toca orbe.

La primera implementación CSS-only falló con toque CDP: el enlace recibía el contacto y cargaba el token, pero no permanecía :active (diagnóstico `5253f7`). Se añadió estado visual compartido de puntero; no se modificó el test para omitir el fallo.

Verificación local de build de producción:

- Compilación 30 rutas y TypeScript: PASS `b141a3`.
- Unitarias: 280/45 PASS `76e4e1` (antes de añadir manejadores); comprobación funcional posterior cubre los manejadores reales.
- ESLint focal PASS `7ea1f3`; responsive 8 perfiles y estructura móvil PASS `012672`.
- Presupuesto público contra baseline intacto PASS `aecc24`; sin dependencias añadidas.
- Toque nativo emulado: sombra distinta, misma receta en ambos CTA, sin desplazamiento, cancelación restaura PASS `8ef619` / `8f07f8`.
- Menú: seis variantes 320/390/768 oscuro/claro + desktop, navegación Contacto, CV, cierre, movimiento reducido PASS `8ef619`.
- Captura `.audit/action-feedback/pressed.png` inspeccionada visualmente. No se certifica teléfono físico ni compatibilidad universal.

Investigación separada: [Nicepage y CMS](owner-platform/nicepage-research-2026-09-19.md). Documental, fuentes/licencias y dos módulos abiertos; sin copiar activos ni modificar CMS. La guía de investigación ayudó a separar funciones documentadas, inferencias y validaciones pendientes.

Preview `dpl_G4dzRN4bZAhUai4SUj8Pd81NKeaW` READY. Producción `dpl_G1GJKJjkiDMiKptrA3arLxkardT8` READY y dominio canónico asignado (`b89a7d`, `4b473d`). Prueba de pulsación sobre https://manuelgarciallera.com PASS `0684e4`. CI `35450416714`: validate y owner SUCCESS; consulta de errores de los últimos cinco minutos sin entradas (`57d282`), no garantía de ausencia universal de errores. Servidor local propio detenido.

Solo se añadieron después capturas al script y ajustes de indentación; sin cambio funcional respecto al runtime publicado. Próximo responsable: Manuel valoración perceptiva; Codex siguientes incrementos de CMS según el informe. Checkpoint anterior recuperable.
