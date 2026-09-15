# Ventana de avance · 15 de septiembre de 2026

Responsable: Codex. Ventana solicitada: 06:52–15:52 Europe/Madrid.

## Estado operativo vigente · 13:40 Madrid

Esta sección prevalece sobre las observaciones horarias históricas inferiores.

- Portfolio público: última publicación registrada `3e18af2`, despliegue `dpl_7ANJZytUU4Xg8sLosVYko8zkWsbh`; stack informativo sin estados interactivos inertes y enlace Figma explícito, tamaños y salto de línea conservados. Recibo [stack](stack-informativo-2026-09-15.md). No se ha repetido aquí la auditoría visual.
- CMS: cambios propios subidos hasta `5454ff8`, HEAD/remoto sin diferencia en comprobación de esta sesión. Hay documentos compartidos y carpetas privadas sin integrar: no confundir «commits propios subidos» con «árbol totalmente limpio».
- Analítica: comparaciones protegidas por fuente/periodo, fuente visible, respuestas privadas no almacenables e importación inválida rechazada antes de escritura. Pruebas y límites en [recibo](owner-platform/analytics-readiness-2026-09-15.md). No recoge visitas reales; el CMS no está desplegado.
- No es necesario repetir login en Vercel: la CLI autenticada ya permitió publicar. Solo se solicitará acceso nuevo ante un fallo concreto comprobado.
- Primera acción pendiente de Manuel: cuenta Umami Cloud Hobby, correo verificado y región UE; sin tarjeta ni trial de pago. Petición ya enviada, no reiterarla automáticamente. Codex comprobará condiciones/API y preparará integración y privacidad; no tratar una cuenta creada como tracking activado.
- Revisión del editor con Manuel: sigue pendiente en portátil. El recorrido automatizado de segunda página está probado, pero no sustituye comprobar si el usuario entiende y completa la tarea.
- CMS alojado: medios durables, copia externa restaurada, correo de recuperación y publicación/reversión en destino siguen pendientes. Analítica inicial en proveedor no depende de cerrar todo este alojamiento.
- Search Console: revisar último rastreo y estado de URLs cuando haya sesión disponible. Nombre/foto/marcado publicados no prueban que Google haya actualizado título, favicon o imagen.

No hay nueva contratación, traslado de datos ni despliegue del CMS autorizado por esta actualización. El siguiente paso técnico tras acceso es configurar/probar el piloto, no añadir más indicadores simulados ni repetir las mismas suites por rutina.

## Actualización prioritaria · 09:12–09:14 Madrid

PUBLICACIÓN RESUELTA: CLI Vercel59 cacheada estaba autenticada como Manuel
(`whoami`0263e6), aunque MCP devuelve404 y Chrome pide login. No hace falta
iniciar sesión en el portátil para esta publicación. Se corrigió el diagnóstico
previo de bloqueo al comprobar esta vía, sin nuevos permisos ni credenciales.

La promoción autorizada de Preview8769f59 generó el despliegue productivo
`dpl_5TGAUyowvBoUHZt2EkdGBhsw3y9v`, Ready con dominio principal asociado
(`afabf2`). Anterior identificada para rollback: `dpl_FDNSwy2n5atVLrxhoRan2LCrhWFX`.
Vercel reconstruyó al promover; no fue un simple cambio instantáneo de alias.

Verificación fresca del dominio:
- Sobre mí e Investigación sirven nombre completo (`d4ae73`).
- Favicon200; /admin y /api/users404, CMS no expuesto.
- Navegador1440: esfera blanca, nombre debajo en tres líneas con García-Llera
  íntegro; clic Contacto llega al encabezado visible (top408 dentro de1000).
- Buy&Sell390: título completo; siete iconos en filas4+3, sin barra horizontal,
  ancho342 y scrollWidth342. Captura inspeccionada, viewport restablecido.

No se acredita entrega de correo real, indexación actualizada en Google ni móvil
físico por estas comprobaciones. Cambios CMS posteriores a8769f59 están en Git,
no desplegados. Manuel puede revisar ahora el dominio desde el móvil.
Reanudaciones cada 30 minutos mediante la automatización existente; requieren
host y aplicación disponibles. No equivalen a nueve horas de ejecución continua.
Coordinación PILOT, escritor único; sin nuevos servicios ni despliegue del CMS.

## Estado comprobado al inicio

- HEAD `8769f59`, cinco documentos compartidos modificados conservados sin integrar.
- CI `34832232084`: completed/success, consultada el 15/09 a las 06:52.
- A las 06:53, producción `/sobre-mi` sigue devolviendo el título abreviado
  `Sobre mí | Manuel García-Llera`.
- El despliegue GitHub `6434907654` del SHA anterior es Preview y declara
  `production_environment:false`. Push y Preview no son publicación en el dominio.
- Última comprobación de acceso Vercel: login pendiente el 14/09; hay que
  comprobar de nuevo la sesión antes de atribuirle un bloqueo actual.
- Hub: planificación enviada `06f7c004-57a0-4b70-a07f-f05c71b35659`;
  envío no implica aceptación o disponibilidad de Claude.

## Hitos y criterios de cierre

1. **Portfolio publicado:** comprobar acceso, promover solo el portfolio autorizado
   si procede y contrastar título, favicon y rutas en el dominio real. Confirmar
   hero, stack y contacto en desktop/mobile emulados, sin confundir emulación
   con teléfono físico. No cerrar por CI ni por una URL Preview.
2. **CMS estable:** contrastar pendientes de `owner-platform/operational-gates-2026-09-11.md`
   con código y recibos posteriores; corregir defectos reproducibles con regresión.
   No repetir suites históricas sin hipótesis ni declarar staging verificado localmente.
3. **Segunda web:** preparar un recorrido reproducible con bloques existentes y
   datos sintéticos, conservando identidad y contenido tras recarga; sin reemplazar
   la interfaz durante la ausencia de Manuel ni abrir multitenencia por inferencia.
4. **Cierre:** commits propios explícitos, push comprobado, evidencias y lista de
   pendientes. Pausar esta ventana al terminar; no cerrar artificialmente el CMS.

## Manuel puede ayudar desde el móvil

- Confirmar recepción de un correo de prueba cuando se ejecute el ensayo acordado;
  las pruebas simuladas no acreditan entrega real.
- Revisar el dominio público tras aviso de publicación: esfera/nombre, iconos
  completos y llegada a Contacto. Comunicar navegador y captura si hay un fallo.
- Responder decisiones concretas de coste o alcance cuando exista propuesta
  contrastada; no se pide contratar nada ahora.
- Aprobar un segundo factor solo si corresponde a un inicio de sesión identificado
  y solicitado en ese momento. Nunca compartir contraseñas o códigos en el chat.

## Para el portátil

- No repetir el login de Vercel como requisito: ese bloqueo quedó resuelto mediante CLI.
- Probar el editor local: crear una página, elegir estilo, editar/ordenar bloques,
  previsualizar, guardar y recuperar. Validar comprensión, no solo apariencia.
- Configurar secretos directamente en el proveedor cuando se apruebe el staging;
  verificar cuenta, recuperación y permisos. No enviarlos por chat, Git o Hub.

## Pendientes que no son tareas exclusivas de Manuel

Codex debe resolver implementación, pruebas, integración, documentación y publicación
pública autorizada cuando tenga acceso. El CMS aún necesita correo real, medios
durables, copia externa restaurada y puente de publicación/reversión en destino.
No se ofrece todavía como plataforma multiusuario o producto comercial terminado.

## Incremento 07:24–07:28 Madrid

- Sesión Chrome disponible de Vercel comprobada: continúa en Login; no se ha
  completado acceso ni publicación. No se pidió otra autorización.
- Discovery Figma ahora declara respuestas privadas no almacenables, con seis
  fallos RED reproducidos y 135 pruebas de regresión aprobadas en 21 archivos.
  Tipos/lint dirigidos y frontera pública correctos; checkpoint intacto.
- Recibo: `owner-platform/figma-discovery-privacy-2026-09-15.md`.
  No se activan conectores, proveedores, cobros ni CMS público.

## Incremento HTTP posterior

La protección discovery queda verificada también por servidor Next construido
con PostgreSQL aislado:403/400/413/503, login390/1280 y borrador conservado tras
reinicio. Sesión53909 salida0; no editor completo ni Figma externo. CI remota
del cambio61aead7:34932864218 success. No equivale a CMS desplegado.

## Segunda página a320/768

Recorrido completo del editor pasa en tamaños compactos nuevos, sesión32740
salida0. Ocho páginas/dos marcas y contenido relacionado persisten tras reinicio,
con borradores privados. Capturas revisadas: segunda página de marca distinta
sin solapamientos observados, pero preview básica, no web comercial publicada.
Guion de prueba manual y límites en
`owner-platform/second-page-compact-2026-09-15.md`. No nueva decisión necesaria
desde móvil; la revisión humana del editor queda en la lista del portátil.
