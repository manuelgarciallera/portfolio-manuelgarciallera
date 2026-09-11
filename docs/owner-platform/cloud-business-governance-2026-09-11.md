# Nube, marca y preparación empresarial

## Dirección propuesta

Linocube como marca paraguas de una plataforma modular: Web/CMS, CRM y Commerce.
Los nombres comerciales concretos se validan antes de registrarlos. El portfolio
personal conserva su identidad y actúa como piloto, no se renombra silenciosamente.
La marca, el nombre de una sociedad y el nombre de un repositorio son decisiones
distintas. Esta propuesta no cambia todavía propiedad, cuentas o arquitectura.

Primera oferta a validar: web diseñada con edición autónoma y mantenimiento.
CRM y comercio se incorporan cuando resuelvan necesidades concretas; no vender
el ecosistema entero antes de demostrar operación y soporte. Separar precio de
implantación, mantenimiento/alojamiento, módulos y consumos variables de IA.
No fijar tarifa sin medir costes y validar demanda.

## Operación en nube

Objetivo: CMS accesible mediante HTTPS desde cualquier ubicación autorizada,
sin depender del ordenador de desarrollo. Aplicación, PostgreSQL y almacenamiento
de objetos deben tener respaldo y restauración comprobados. Local sirve para
desarrollo/pruebas; staging para validar entregas; producción para uso real.

Una plataforma para clientes exige aislamiento real de organizaciones, permisos
del servidor, recuperación de cuenta, registro de cambios, límites de uso y
exportación/borrado controlados. El CMS actual es owner-only: tener varias páginas
no permite ofrecer ya varias organizaciones. Nube tampoco significa seguridad
automática; verificar sesiones, MFA cuando se incorpore, secretos, actualizaciones,
accesos de soporte e incidentes. Son requisitos, no controles todos acreditados.

Git conserva código, esquemas, migraciones, pruebas, documentación y referencias
de versiones. No debe recibir contraseñas, archivos .env, bases reales, sesiones,
HAR sin revisar o documentos personales de clientes. Bases y medios necesitan
copias cifradas externas y ensayos de restauración; un commit no los respalda.

## Estado de respaldo comprobado

Fetch de origin realizado el 11/09/2026 sobre HEADcccfe76. La comparación con
origin/codex/checkpoint-pre-editor-2026-09-04 da83 commits locales exclusivos y
0 remotos exclusivos. No confundir commits locales con copia remota.
El árbol contiene documentos compartidos y adjuntos sin revisar; no subirlos
en bloque. El push requiere separar respaldo y despliegue, ya que la tarea
vigente excluye publicar. No se afirma respaldo remoto de esos83 cambios.

Actualización sobre HEAD `27824c8`: GitHub devuelve `isPrivate: false` para
`manuelgarciallera/portfolio-manuelgarciallera`. No enviar automáticamente el
trabajo pendiente del CMS a ese destino público. Se propone un repositorio
privado de respaldo sin conexión a Vercel; creación pendiente de autorización.
Esto no cambia la visibilidad ni el despliegue del repositorio existente.

Se conserva una copia local Git bundle de HEAD y checkpoint bajo `.audit/`,
restaurada en un repositorio bare y comprobada con `git fsck --full` sin errores.
No es respaldo externo ni incluye cambios sin commit, bases o medios.
La prueba de una segunda página sigue abierta; no acredita todavía un producto
multicliente ni un segundo sitio publicado. Comunicación Hub de esta revisión:
`6a4d3156-7a5d-4a97-804d-0ce788dfa149`, enviado, no aceptación inferida.

## Preparación profesional antes del primer cliente

Mantener inventario de autoría y licencias de código, fuentes, imágenes y trabajo
de colaboradores; diferenciar material propio de TFM/LALIGA. Registrar quién
contrata dominios/proveedores y es titular de activos. Una futura transmisión
a sociedad debe documentarse, no deducirse del uso del nombre Linocube.

Preparar con asesoría contrato de servicio/licencia: alcance, propiedad,
soporte, pagos, cancelación, exportación, retención, responsabilidades e incidentes.
Definir los papeles reales en tratamiento de datos y los contratos necesarios
con clientes y proveedores. La AEPD explica que responsable y encargado deben
formalizar su relación y que el encargado tiene obligaciones propias [1].
No prometer cumplimiento RGPD por elegir una región europea o añadir un aviso.

Antes de cobrar o formalizar actividad, revisar con gestoría/PAE la modalidad
autónomo o sociedad según situación laboral, socios, riesgo, ingresos y costes.
CIRCE facilita trámites para ambas opciones [2]; no determina cuál conviene
en este caso. Una SL no sustituye contratos, controles ni revisión profesional.
No se inicia alta fiscal, registro de marca, firma o contratación en esta tarea.

Comprobar disponibilidad y conflictos de Linocube antes de invertir en identidad.
La OEPM ofrece información y búsqueda de marcas/nombres comerciales [3]. No se
ha realizado aquí una búsqueda exhaustiva ni se afirma disponibilidad jurídica.

## Orden de ejecución

1. Respaldo remoto comprobado sin desplegar y revisión de material excluido.
2. Segunda landing y CMS utilizables en entorno de prueba.
3. Presupuesto y autorización del destino nube, recuperación real y soporte.
4. Validación comercial pequeña y revisión profesional de contratos/actividad.
5. Aislamiento de clientes y módulos con contratos; después escalar la oferta.

Ninguna decisión exige fusionar ahora Linocube y CMS. La integración visual
y comercial puede ser común mientras se prueban límites técnicos y de datos.

## Fuentes oficiales

Consulta11/09/2026. Orientación de preparación, no dictamen jurídico o fiscal.

1. [AEPD: responsable y encargado](https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/8-responsable-y-encargado-del-tratamiento).
2. [CIRCE: creación de empresa o alta de autónomo](https://sedepyme.serviciosmin.gob.es/es-es/CreaEmpresaPorTiMismo/Paginas/Home.aspx).
3. [OEPM: marcas y nombres comerciales](https://www.oepm.es/es/marcas-y-nombres-comerciales).
