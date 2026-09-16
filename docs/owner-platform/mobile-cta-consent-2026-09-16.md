# CTA móvil y aviso compacto — 16/09/2026

Petición de Manuel: botón «Ver proyectos» y etiqueta mayores, algo más arriba; aviso móvil menos invasivo y explicación del aceptar deshabilitado. La captura acredita la señal «No rastrear» activa. Reserva Hub1a90fef2, basee09f535.

## Decisiones implementadas

- CTA móvil: texto14px frente a11,2; altura48px frente a43,2; más ancho y alrededor de20px más arriba. Ajuste vertical adicional en pantallas bajas para conservar titular y CTA dentro del primer viewport. Desktop intacto.
- Aviso móvil: acciones y detalles comparten fila cuando caben; columnas adaptables por rem, apilado al ampliar texto. Etiquetas visibles «Aceptar»/«Rechazar», nombres accesibles completos; mismo tamaño, contraste y área táctil mínima44px. Se conservan responsable, finalidad, proveedores, referencia a cookies y enlace de privacidad.
- Con DNT/GPC activo no se abre automáticamente un aviso que no permite consentir. El botón persistente de preferencias permite consultar el motivo y cerrar con «Entendido»; detalles siguen disponibles, casillas deshabilitadas. No se muestra un falso botón Aceptar. **No se permite aceptar mientras siga esa señal**: no se modifica el controlador ni se ignora la preferencia del navegador. Sin señal, aceptar/rechazar siguen operativos. No afirmar que esta presentación equivale a asesoramiento jurídico universal.
- No se guarda consentimiento por omisión, cierre o por «Entendido». No se cambia la configuración del móvil, las cuentas, los SDK ni la recogida de datos.

## Evidencia previa a publicación

- RED: CTA pequeño3114c7; banner no solicitado con privacy4cff90; altura206,25px frente a máximo180 en móvil7753fb.
- GREEN hero: ocho tamaños,320–1280, prueba2f01e8. Referencia390×712: CTA592,81–640,81 (antes611,86–655,05), etiqueta14px, escena desde712. Sin recortes ni overflow, desktop conservado.
- GREEN aviso normal/DNT/GPC sobre build de producción local35b7f6: aviso compacto y aceptar habilitado sin señal; cero banner inicial, cero SDK y ningún consentimiento creado con señales. Capturas revisadas en .audit/mobile-consent-2026-09-16.
- Consentimiento aislado4anchos: aceptar/rechazar, detalles, cierre exterior sin consentir, foco y errores pasan4e3d20. Se coloca el puntero fuera de las acciones antes de comparar estilos en reposo para no comparar un botón en hover con otro sin hover.
- Prueba200% detectó overflow3e3099; corregido con columnas auto-fit relativas a rem, sin recortar texto. Repetición24escenarios, ambos temas, teclado, horizontal/vertical, áreas táctiles y cero seguimiento PASS4f11d5.
- E2E Next real + SDK oficiales y colectores interceptados: opt-in, saneado, retirada y navegación PASS35b7f6. Seguridad DNT/GPC, almacenamiento bloqueado, preview, retirada durante carga y SDK fallido PASS588830.
- 279unitarias/43archivos y lint757dc3; lint final y frontera22 PASS0e87a9; build final30páginas/tipos e44e9d.
- Bundle fresco961955: home138663raw/50598gzip; privacidad65821raw/22490gzip. Incremento345raw/53gzip respecto al runtime anterior por presentación accesible; presupuesto original verde, sin nuevas dependencias ni cambio de baseline.

## Publicación y cierre

- Runtime d4eed238041468a726cbca2056415e89a91e00f4 comprometido y subido. CI35109549245 completada: validate y owner SUCCESS (ddd543).
- Producción dpl_2M4k9Sb3RqRMdMxNVr3w2X9ptWDp READY, creada16:36:55CEST, alias https://manuelgarciallera.com confirmado89ee9a. Promoción autorizada terminada2d3346.
- Repetición en dominio real: normal, DNT y GPC PASS ee6aa4, sin generar visitas analíticas de prueba. Captura home-dnt-live.png revisada: titular y CTA completos en390×712, sin aviso automático con DNT. Aviso normal compacto y aceptación habilitada verificados por el script.
- Hito implementado, publicado y verificado técnicamente; siguiente responsable Manuel: revisión en móvil físico. DNT/GPC siguen impidiendo la medición, no se han ignorado esas señales.
- Rollback identificado, no ejecutado: runtimec1b8cfe, deploymentdpl_7qwUUJXzaVbgYoTEf5NJUAr5Ej5b. CMS no publicado; servidor de usuario3015 preservado y QA3016 detenido. Automatización anterior permanece pausada.
