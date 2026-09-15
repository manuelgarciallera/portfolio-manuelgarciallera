# Stack informativo · 15/09/2026

Manuel aprueba retirar la falsa interacción del stack y conservar enlaces reales separados. Se mantiene el tamaño y el salto de fila: a 320 px forzar siete nombres no compensa perder legibilidad.

- TechStack: sin tabindex, title redundante ni color de marca interactivo. CSS sin hover/transición de color. No se convierten iconos en enlaces ni se desactivan los focos de controles reales.
- Buy&Sell: enlace existente al archivo de diseño rotulado «Abrir diseño en Figma», misma URL. No se inventan repositorios ni enlaces de otros proyectos.
- RED: prueba de stack falla por parada de teclado inerte (e16a56). GREEN: 254/254 pruebas, 40 archivos (aefacf), lint focal y typecheck correctos. Dos expectativas antiguas exigían literalmente el hover eliminado; retiradas, conservando las comprobaciones de legibilidad.
- Navegador local Chromium: 390 px, clic Bootstrap con hover activo conserva color blanco al 66% y transform none; captura inspeccionada. A 320/390/1440, ancho del stack igual a scrollWidth: 273/342/261 respectivamente. Sin tabindex. Enlace Figma y destino comprobados en DOM.
- No prueba en teléfono físico ni validación de permisos del archivo remoto de Figma. Sin cambios en CMS, hero, tamaños, dependencias ni URLs.

Reserva comunicada en Hub: 6c702ed1-aadc-4b03-8594-22fd5ca5f660. Codex integra. Publicación requiere recibo de despliegue: un commit/push no acredita producción.

## Publicación comprobada · 10:11 Madrid

Runtime commit/push `3e18af2`. Preview Ready `dpl_6WDHQAYHJrVp7tQn6yrE7pC9eXZo`; promoción generó producción `dpl_7ANJZytUU4Xg8sLosVYko8zkWsbh`, Ready. Rollback previo `dpl_5TGAUyowvBoUHZt2EkdGBhsw3y9v`.

Dominio real HTTP 200, etiqueta Figma nueva, sin tabindex inerte y CSS del stack descargado sin regla hover (88197a). DOM público confirmó el enlace. La repetición de mediciones con evaluate tras cambiar viewport en producción dio timeout del navegador; no se presenta como prueba táctil física. Viewport restablecido. Frontera pública pasa 21 entradas. Entrega Hub 48a37dc7-0995-4908-863f-663ed5674c04, reserva liberada.
