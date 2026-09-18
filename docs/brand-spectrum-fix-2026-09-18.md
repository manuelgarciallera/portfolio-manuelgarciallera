# Espectro visible en la M

Manuel confirma que el plano derecho parece morado y pide el espectro cian/azul/violeta/rosa del H1 adaptado a su tamaño, visible también en móvil sin hover. Base d439db9, producción anterior dpl_2s6QtUKR2W4ChbffD5eLr3XSG3Wc. Reserva Hub b7febff5.

Causa: background-size240% recortaba el espectro. Solo se modifica brand-signature.css: diagonal135°, paradas8/32/54/74%, tamaño100%, hover100–112% en vez de240%. Silueta, plano neutro, letras, navegación y Hero intactos. Sin nuevas dependencias.

Prueba raster Chromium de CSS real `node scripts/verify-brand-spectrum.mjs`: RED16px cian0/rosa0; GREEN16px cian9/azul38/violeta31/rosa12;36px41/209/168/56. Umbrales independientes, al menos3píxeles por familia. Capturas `.audit/brand-spectrum`. No es medición perceptual de usuarios.

280 tests PASS; build30 y TypeScript correctos; ESLint focal, Hero y responsive PASS. Navbar390/1280 ambos temas PASS: paleta compilada, hover y reduced motion, sin overflow. Capturas móvil y escritorio inspeccionadas. Presupuesto público sin incidencias, baseline intacta. Publicación pendiente. Volver atrás: revertir solo el commit de esta corrección, sin restauración destructiva del workspace.
