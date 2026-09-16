# Borde de color del CTA — 16/09/2026

Manuel aprueba probar borde azul/violeta/rosa solo en «Ver proyectos», interior oscuro, texto blanco y geometría intacta. Base a7797b6; reserva Hub ec9fa557. Cambio runtime 889ee44, commit y push verificados126d11.

Implementación solo CSS: borde en pseudoelemento sin interacción, vuelta inicial4,8s y movimiento8s durante hover en dispositivos compatibles. Sin animación con reduced-motion; foco visible independiente y fallback forced-colors. Sin dependencias ni JavaScript nuevo. La guía de diseño orientó la restricción del efecto al CTA y la animación inicial finita para no competir permanentemente con el titular.

Pruebas: RED47979f por ausencia de borde; GREEN390/1280 (d67732/1f917d) comprueba degradado realmente variable, reduced-motion, geometría, foco y clic a #casos. Primera prueba de navegación usaba erróneamente #proyectos; corregida a destino existente #casos tras inspeccionar Hero.tsx, sin cambio del enlace real. Captura390 revisada. Hero completo ocho tamaños320–1280 PASS1f917d, sin desplazamiento respecto al release anterior; CTA390×712 conserva592,81–640,81.

Build30 rutas/tipos PASSa2d476, guardas hero/tipografía/navegación y lint del script0eb7e4. Bundle fresco11 rutas sin erroresb77419; home138663raw/50598gzip y privacidad65821raw/22490gzip, idénticos al runtime anterior. CSS añadido; no se mide aquí consumo energético ni GPU real.

Preview de Git dpl_9GexUhR3Sb2yw1kjUi5wjGBrSray READY23864a. Producción dpl_7a2gRg8bXNATMMdL7KTzQkmFyn5g READY, creada16:51:47CEST; alias https://manuelgarciallera.com confirmado023b34. Prueba LIVE390/1280 PASS6df778: borde, movimiento real, versión reducida, geometría, foco y navegación a casos. CI35111262582: validate SUCCESS; owner todavía en curso al comprobar3c4d08, no se afirma suite global terminada. Rollback anterior: dpl_2M4k9Sb3RqRMdMxNVr3w2X9ptWDp. Sin cambios CMS, cookies, DNS o procesos del usuario. Siguiente Manuel: revisión física de la propuesta visual publicada.
