# CMS owner: puertas operativas actuales

## Punto de control · 13 de septiembre, base 59fa03c

Esta sección prevalece sobre las cifras históricas de abajo, sin convertir
verificaciones locales en autorización de producción:

- Windows: el comando habitual `npm run build` termina correctamente; conserva
  confianza TLS y workers. `npm test`: 23 pruebas de scripts y 1.346 unitarias.
  Véase [el cierre del fallo CA](windows-system-ca-equivalence-2026-09-13.md).
- Integración Windows sobre `59fa03c`: `npm run test:integration` termina con
  salida 0 (35724 / 178cfe), 70 pruebas correctas y 24 omitidas, en 140,97 s.
  Las omisiones corresponden a puertas PostgreSQL; no se cuentan como aprobadas.
  El runner usa una raíz temporal sintética y finaliza después de su limpieza.
  Los rechazos HTTP y fallos de proveedor inducidos forman parte de los casos
  negativos. Ningún correo real ni cuenta productiva se utiliza.
- PostgreSQL, editor y recuperación física: el ensayo de checkout exacto
  `93b5610` pasó 94 integraciones, edición a 390/1280 y restauración con daños
  rechazados. No es una ejecución del HEAD posterior. Véase
  [el recibo de ese checkout](exact-checkout-content-2026-09-13.md).
- Readiness: respuestas privadas no almacenables verificadas por HTTP,
  manteniendo las puertas de producción cerradas. Véase
  [la prueba HTTP](readiness-cache-policy-2026-09-13.md).
- Dependencias: audit sin avisos, pero se conserva la restricción de desbloqueo
  owner; no se infiere un parche upstream del silencio de audit. Véase
  [la revisión de seguridad](dependency-security-recheck-2026-09-13.md).

Siguen abiertos: entorno alojado y correo real, copia externa/restauración en
destino, publicación/reversión autorizadas, comprensión de la interfaz por
Manuel y el incidente intermitente histórico de papelera (no reproducido, no
declarado corregido). No habilitar multi-tenant, modelos ni puente público.
La recuperación sin proveedor de correo utilizable requiere diseño y autoridad
antes de añadir una vía operativa nueva.

### Recuperación física Windows · seguimiento de 47e47cb

- `npm run test:recovery -- --versioned-media`: salida 0 (52786 / fa3b84).
  47 pruebas auxiliares; 27 archivos de respaldo, 26 medios verificados,
  tres versiones, seis revisiones recuperadas y siete daños rechazados antes
  de asignar el destino. Origen y recibos del respaldo intactos. Alcance:
  medios y previews reales con entradas mínimas persistidas de página/marca.
- `npm run test:recovery` falló inicialmente al importar configuración sin
  `PAYLOAD_SECRET` (81804 / d2c54f). El padre ya había generado un secreto
  sintético y lo enviaba por IPC, pero el override de getPayload llegaba tarde
  para la validación ejecutada al importar. Se corrige únicamente el worker de
  pruebas para introducir ese secreto en su entorno desechable antes del import.
  No se relajan validaciones ni se leen secretos ambientales.
- Repetición del comando: salida 0 (56023 / ee6bd7), 47 auxiliares y 12 controles
  del recorrido; cinco archivos, cuatro medios y dos versiones de página
  recuperados. Edición independiente y respaldo/origen intactos comprobados.
  Base informada 47e47cb más el cambio explícito del worker; no checkout exacto.
  ESLint del worker y diff check pasan (36624b).

Ambos runners cierran antes de terminar y ejecutan su limpieza de raíces
sintéticas. Son ensayos SQLite locales, no copias externas de producción.

Actualización sobre `8bd695e`: la evidencia de recuperación y editor se amplió
con un ensayo desde checkout limpio; véase
[recuperación HTTP y procedencia](recovery-http-verification-2026-09-11.md).
Incluye recuperación concurrente de un solo uso, límites compartidos en
PostgreSQL, restauración de datos/medios/contadores y dos páginas con marcas
distintas creadas desde la interfaz a 390/1280 px. El alojamiento real, correo
de staging, aislamiento de clientes y publicación siguen sin acreditarse.
Las cifras y la base que siguen son el registro histórico, no el HEAD actual.

Revisión sobre 8fb36e1. La fase anterior es progreso verificado: editor HTTPS,
medios y creación nativa por formulario han pasado en un contenedor aislado.
No se considera cumplido el objetivo general del CMS productivo.

## Qué está verificado y qué no

| Recorrido | Evidencia y alcance | Falta para cerrar |
| --- | --- | --- |
| Crear y editar páginas | Formulario real, dos bloques, guardar, ordenar con teclado, recargar, preview a390/1280; documento conservado tras reinicio Next | Uso físico móvil y revisión de comprensión con Manuel; otros tipos de bloque no quedan cubiertos por dos Portadas |
| Medios | Subida/sustitución multipart, bytes privados actuales/históricos tras reinicio Next, proveedor sintético | Configuración de objetos real, permisos, retención, límites y restauración remota |
| Recuperar datos | Ensayos históricos de copia PostgreSQL + revisiones y recuperación en procesos separados; ver full-owner-recovery-2026-09-10.md | Repetir con la infraestructura destino y copia externa recuperable |
| Recuperar acceso | Adaptador privado y controles de recuperación/sesiones implementados; no depende del correo del portfolio | Entrega real y enlace de recuperación en el origen del CMS de staging |
| Publicación | Paquetes, revisión, artefactos y preflight; puente público desactivado | Destino de prueba, publicación y reversión verificadas; autorización antes de desplegar |
| Editor visual propuesto | Requisitos de inspector, layout guiado, temas y controles documentados | Propuesta revisable y aprobación antes de sustituir la interfaz |
| Varios clientes | Identidad actual owner-only comprobada en access/owner.ts y Users.ts | Organizaciones/pertenencias y aislamiento; no se ofrece como multi-tenant |

## Por qué readiness sigue diciendo «no listo»

`src/dashboard/readiness.ts` comprueba sintaxis/configuración pero conserva
`productionReady:false`, `deploymentAllowed:false` y cinco puertas operativas:
entrega de correo, restauración DB, medios durables, puente público y revisión
de despliegue. Es deliberado: las pruebas locales no son evidencia del entorno
real. No convertirlas en true ni retirar bloqueadores para mejorar el indicador.

El documento inicial account-recovery-audit describe una ausencia histórica:
el código actual sí configura transporte y recuperación. No volver a implementar
esa pieza por leer el informe antiguo sin contrastarlo con config/email.ts,
Users.ts y los informes posteriores de recuperación.

## Secuencia siguiente y autoridad

1. Consolidar regresión del código existente y corregir únicamente fallos reales.
2. Preparar revisión del diseño con Manuel sin reemplazar el panel durante su
   ausencia. Una captura o un prototipo no es un CMS productivo.
3. Presentar coste/alcance exactos de staging y provisionar solo con autoridad
   aplicable; credenciales se introducen en el proveedor, no en chat ni Hub.
4. Verificar correo, almacenamiento, copia/restauración y publicación en ese
   destino antes de anunciar disponibilidad. El objetivo vigente excluye despliegue.
5. Después, validar otro cliente y módulos; no mezclarlo con el cierre owner.

No se reabre la elección de stack ni se activan nuevos servicios en esta revisión.
La web pública y el checkpoint permanecen protegidos.

## Regresión de esta revisión

- Unitarias completas Windows: 1251/1251 en164 archivos,149,66s, salida0
  (`a1d92f`). No sustituye prueba de proveedor.
- Integración completa en Docker PG16: primera ejecución termina con dos fallos
  (`07bc7a`). Ambos intentan abrir un activo público fuera de owner-platform
  en editorial.integration.test.ts. App/clúster sintéticos cerrados y raíz
  retirada; no fallo de runtime acreditado.
- Corrección acotada: generar imágenes WEBP sintéticas con sharp ya existente
  para esas dos pruebas. Se mantienen las subidas reales y aserciones de los
  proyectos, sin copiar el portfolio para ocultar la dependencia.
- Revisión independiente sin bloqueadores: las aserciones no dependen del
  dibujo o resolución del orbe y siguen usando Payload/archivos reales.
- Regresión SQLite editorial:33 pruebas pasan,1 omitida (concurrencia exclusiva
  de PostgreSQL),25,34s, salida0 (`cc8976`). Tipos0 (`b57e41`), lint0 y frontera
  pública21 (`562827`). La suite PostgreSQL completa se observa hasta terminar;
  no se sustituye por este ensayo focal.
- Repetición completa con controlador PG16:71/71 en10 archivos,106s (`649f58`),
  salida0 y cierre/sesiones/limpieza verificados (`fb2ec9`). Algunos fixtures
  conservan SQLite explícito (p.ej. auth-unlock), por lo que no son71 pruebas
  exclusivamente PostgreSQL. Los rechazos de permisos/tokens son casos negativos
  esperados. Inspección final solo init/sleep; contenedor detenido (`e1e394`).
