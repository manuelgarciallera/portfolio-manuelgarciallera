# Hero móvil · identidad y espacio inferior

Petición directa de Manuel del 17/09, base f3801d5. Reserva Hub216fac15-a371-435b-b48a-7877b3dc8239. Solo CSS móvil y prueba existente; CMS y shaders preservados.

- Conserva Manuel en primera línea y García-Llera Añón en segunda, texto HTML.
- Escala 8.6cqi/40px → 9.4cqi/44px; interlineado1.25.
- Margen superior del nombre -16px → 8px; fondo inferior160px más espacio de flujo ya existente. La siguiente sección no se recorta.
- RED a05edd: menos de150px de fondo bajo el nombre. GREEN b266b6:320/390/430/767, dos líneas, sin overflow, unos185px debajo; orb/CTA/h1 y altura de sección siguiente conservados en comparación local.
- 274 pruebas unitarias/43 archivos PASS a079f2. Compilación pública aislada30rutas y tipos PASS81feb7. Captura390 revisada para tipografía/espaciado; no acredita la animación ni carga del fallback.

La captura enviada por Manuel muestra una línea; no se reprodujo en el CSS local previo, que ya define dos. Intento de verificación de dominio agotó timeout b8189d; no atribuir a caché sin evidencia. Verificar el dominio después de publicación. Estado de publicación pendiente al crear este recibo.

## Cierre

Runtime fdafc99 commit/push cd9974. Escritorio siete tamaños PASS e35c6a; CI35183367182 completo SUCCESS9808b9. Preview6CHvK8vjZPW1LaL9ybBCWkP4rya8 ligado al SHA exacto ee4956. Promoción9e9979 genera producciónH3WEmuYJeJszxEPak4MieXReNt6T; READY y dominio original48eb77. LIVE320/390/430/767 PASS01b614, dos líneas/tamaño/margen inferior y siguiente sección intacta. No prueba física ni cambios del render WebGL. Rollback runtime11b2532. CMS local preservado sin publicar.
