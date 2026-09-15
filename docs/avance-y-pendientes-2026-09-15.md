# Ventana de avance · 15 de septiembre de 2026

Responsable: Codex. Ventana solicitada: 06:52–15:52 Europe/Madrid.
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

- Completar login de Vercel en la sesión de navegador accesible a Codex si sigue
  pendiente. Un login independiente desde el móvil no autentica este navegador.
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
