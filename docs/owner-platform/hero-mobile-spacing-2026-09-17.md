# Hero móvil: elevar identidad y ampliar aire inferior

Verificación LIVE final: cuatro anchos320/390/430/767 PASSdf9180 exit0; nombre ampliado sin overflow, elevación24px, H1/CTA iguales y espacio inferior65px.

Petición de Manuel mediante croquis: subir orbe y nombre, ampliar texto hacia márgenes y mantener altura de sección para ganar fondo negro inferior. Base4e59037. Reserva c0d78a74-4972-4d88-a461-684c3fa94418.

Solo CSS dentro de max-width767px: conjunto trasladado visualmente24px hacia arriba sin quitar espacio del flujo; fuente6→6,7cqi, máximo28→32px. Conservados tamaño del orbe, distancia relativa orbe/nombre, H1, CTA, shader e interacción. El alto crece únicamente2,8–5px por la mayor tipografía: no se retrae el final de sección.

`verify-hero-mobile-spacing.mjs` compara contra las reglas anteriores en la misma página/fuentes/viewport: REDd571d1; GREEN22d4c4 sobre build de producción320/390/430/767. Orbe/nombre suben24px, texto+11,7% en teléfono, una línea sin overflow, CTA/H1 idénticos; espacio bajo nombre41→65px. Captura390 revisada. El comparador inicial leía el tamaño previo antes de estabilizarse (también ocurrió esperando dos RAF en LIVE). La fixture final convierte el tamaño anterior a píxeles, desactiva su transición y espera su valor computado; no altera producción ni rebaja los criterios.

Build aislado30rutas/tipos PASSaae6e8; presupuesto138706raw/50638gzip sin errores402ad4; diff limpio. Interacción sobre compilación390/1280PASS89af08. Sin dependencias ni cambios desktop.

Publicado a160cbae98a557ed46233d8fd47c37dd0a8ccfa2, CI35159152392SUCCESS. Previewdpl_uQ9yf8Bc1YK1fgfz8hQLzvGsMo8d; producción dpl_HZybwdW1iQWuXUmwHpLM28MAAqbS READY y dominios comprobadosb0c086. Incidencia transitoria de conexión durante consulta GitHub/Vercel, recuperada; HTTP2008bdbdd. Logs error5min vacíosb532ac. Servidor propio3020 detenido;3015/3017 preservados. Reversión87a709d/dpl_5r9hpB8XPcuaMwzHX11g91frABAU. Siguiente Manuel revisión estética móvil.
