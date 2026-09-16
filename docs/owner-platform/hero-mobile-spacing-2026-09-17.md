# Hero móvil: elevar identidad y ampliar aire inferior

Petición de Manuel mediante croquis: subir orbe y nombre, ampliar texto hacia márgenes y mantener altura de sección para ganar fondo negro inferior. Base4e59037. Reserva c0d78a74-4972-4d88-a461-684c3fa94418.

Solo CSS dentro de max-width767px: conjunto trasladado visualmente24px hacia arriba sin quitar espacio del flujo; fuente6→6,7cqi, máximo28→32px. Conservados tamaño del orbe, distancia relativa orbe/nombre, H1, CTA, shader e interacción. El alto crece únicamente2,8–5px por la mayor tipografía: no se retrae el final de sección.

`verify-hero-mobile-spacing.mjs` compara contra las reglas anteriores en la misma página/fuentes/viewport: REDd571d1; GREEN22d4c4 sobre build de producción320/390/430/767. Orbe/nombre suben24px, texto+11,7% en teléfono, una línea sin overflow, CTA/H1 idénticos; espacio bajo nombre41→65px. Captura390 revisada. Se espera dos RAF tras aplicar reglas de comparación para estabilizar las unidades de contenedor; lecturas inmediatas anteriores capturaban layout aún sin recalcular, no un fallo publicado.

Build aislado30rutas/tipos PASSaae6e8; presupuesto138706raw/50638gzip sin errores402ad4; diff limpio. Sin dependencias ni cambios desktop. Pendiente commit/publicación y LIVE. Siguiente Manuel revisión estética móvil.
