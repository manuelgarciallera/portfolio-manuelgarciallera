# Auditoría de alcance del Owner Studio

Esta lista contrasta las solicitudes y los tres planes existentes con la
implementación local. No convierte los límites de una fase en una afirmación
de producto terminado. Las solicitudes repetidas cuentan una vez: versiones,
edición modular, encuadres, conectores y control de animación son capacidades
comunes, no implementaciones separadas por cada mensaje.

## Planes y evidencia

| Requisito | Estado real | Evidencia / límite |
| --- | --- | --- |
| Checkpoint recuperable | Conservado | Tag `checkpoint/pre-editor-2026-09-04`, commit `0f0adf686b2752e23c25d224f8c60815b10fd451`; no reescritura ni despliegue |
| Fundación modular y permisos | Implementado | `src/platform/content`, `connectors/figma`, `security`; pruebas incluidas en la suite pública de 207 tests |
| Login privado owner | Operativo en local | Payload Users, bootstrap restringido, autorización servidor; evidencia en `browser-verification-2026-09-05.md`; no registro de visitantes |
| Páginas, proyectos y artículos | Operativo en local | Colecciones, catálogo de bloques, orden, borradores, versiones y papelera; `editorial-runtime-verification.md` |
| Editor sin depender de IA | Operativo dentro del catálogo | Lexical y formularios nativos; los módulos visuales especiales no son un editor libre de código |
| Recorte, zoom, encuadre y responsive | Operativo en local | Recetas reversibles por colocación y overrides móvil; `media-editor-verification.md`; no sobrescribe el original |
| Marca y animaciones configurables | Operativo en local | Colores semánticos, porcentajes validados, contraste, herencia y límites de movimiento; los porcentajes son guía, no cómputo de píxeles |
| Preview editorial | Operativo en local | Páginas, artículos y proyectos; `visual-editorial-preview.md`; no reproduce todavía toda la dirección artística de la web pública |
| Versiones por fecha y descripción | Operativo en local | Releases, snapshots inmutables y planes de restauración; `release-registration-verification.md`, `restore-integration-verification.md` |
| Puntuaciones de calidad | Evidencia registrada | Métricas con fuente/fecha/viewport; no se inventan puntuaciones ni se equiparan mediciones manuales a métricas de campo |
| Restauración | Probada en SQLite | Vuelve al borrador y conserva publicado/histórico; rollback ante fallo de auditoría; falta ensayo PostgreSQL y almacenamiento real |
| Preparación de publicación | Operativo en local | Paquete → revisión → artefacto → preflight/exportación; `document-action-controls-verification.md`; no despliega ni reemplaza la web |
| Figma | Adaptador y flujo local probado | Descubrimiento de solo lectura, aprobación e importación a borradores; persistencia con proveedor sintético; falta prueba con credenciales y archivo autorizado reales |
| Asistencia IA | Contrato y revisión local | Contexto acotado, switches, importación manual de propuestas, comparación legible y decisión auditada; `assistance-review-verification.md`; sin modelo conectado ni aplicación automática |
| Analítica dentro del panel | Lectura de snapshots importados | Importador y resumen de métricas/URLs; no es sincronización continua con una cuenta de Analytics |
| Linocube | Interfaz preparada y desactivada | Sin red ni integración CRM activa; no añade dependencias al editor |
| Panel acoplable/arrastrable | Diferido expresamente | El diseño aprobado reserva la carcasa dockable para una fase posterior; se conserva la navegación nativa de Payload |
| Actualizaciones automáticas | Configuración local, pendiente de activar | Dependabot para owner/Actions y CI independiente del CMS; `maintenance-automation-2026-09-05.md`. Sin auto-merge ni despliegue; faltan ejecución remota y reglas obligatorias del repositorio |

Los planes de fundación, vertical slice y fase 2 separan explícitamente el
funcionamiento local de la integración pública. Las casillas históricas de
«escribir test ausente» no se usan como prueba actual: se conservan los planes y
se remite a pruebas ejecutables, commits e informes. La versión owner de Next
se actualizó respecto al texto original del plan por la remediación documentada
de dependencias; no se actualizó por ello el runtime público.

## Lo que falta para uso real en producción

1. PostgreSQL de staging, migraciones revisadas, copias y ensayo de restauración;
   concurrencia y fallos de commit ambiguos no quedan certificados por SQLite.
2. Almacenamiento duradero/versionado y rollback de archivos. Las pruebas de
   importación actuales acreditan rollback de filas, no del proveedor de objetos.
3. Correo transaccional y recuperación de cuenta, controles de exposición,
   límites de acceso y monitorización operativa.
4. Resolver avisos de dependencias compatibles y repetir pruebas. Auditorías
   npm de esta sesión: owner 12 paquetes moderados afectados por dos cadenas;
   portfolio 1 paquete moderado (`fflate`); ambos devuelven exit 1, no «audit limpio».
5. Credenciales y permisos de Figma/analítica/modelos; revisión de costes,
   privacidad y límites antes de activarlos. Ninguna suscripción de usuario se
   supone equivalente a crédito API.
6. Aplicación reversible de propuestas al borrador con preview visual, detección
   de cambios concurrentes y consentimiento específico. Aceptar hoy solo deja
   constancia; no debe presentarse como edición IA completa.
7. Adaptador de publicación estática hacia el portfolio, comparación visual,
   responsive, accesible y de rendimiento contra el checkpoint, y aprobación
   de integración/despliegue. Ese puente sigue desactivado.

La versatilidad futura —shell dockable, nuevas familias de bloques, producto
vendible y CRM— no elimina esas puertas. Tampoco se puede prometer coste cero
permanente para alojamiento, almacenamiento, analítica o modelos externos.

## Las seis auditorías del portfolio

El informe `../portfolio-complete-audit-2026-09-04.md` recoge responsive,
accesibilidad, rendimiento, SEO, robustez y contenido. Su matriz de 60
combinaciones y Lighthouse corresponde a esa fecha, no a una nueva auditoría
de producción esta noche. Contenido y jerarquía siguen siendo recomendaciones;
no se reescriben desde este incremento CMS.

En esta sesión se vuelven a ejecutar las comprobaciones técnicas locales y la
comparación de bundle público. Eso no sustituye la revisión manual con lector
de pantalla, las métricas reales de visitantes o la inspección visual del
portfolio en producción. Los ajustes visuales antiguos no se vuelven a aplicar
por aparecer repetidos en el historial.

## Estado de entrega

### Revalidación operativa del 7 de septiembre de 2026

Antes del incremento de recuperación física se repitieron 700 pruebas unitarias
owner y 22 integraciones editoriales SQLite: todas correctas. El dashboard pasó
ocho combinaciones de navegador (320, 390, 768 y 1280 px, claro/oscuro), y los
controles documentales 22 escenarios en 390/1280 px. Estos últimos son fixtures
de componentes con endpoints sintéticos: no acreditan conexiones reales con
Figma, IA ni un barrido visual completo de todas las pantallas de Payload.

El aislamiento del owner pasó 8/8 y la frontera pública 21 entradas. No se
añadieron dependencias públicas. El tag protegido sigue resolviendo al commit
`0f0adf686b2752e23c25d224f8c60815b10fd451`.

La auditoría `npm audit --omit=dev` del owner sigue devolviendo salida 1:
12 paquetes moderados afectados por dos cadenas, cero altos/críticos. No se
aplica la bajada incompatible que propone npm. PostgreSQL sigue sin estar
disponible localmente; Docker está detenido. La validación SQLite no sustituye
un ensayo PostgreSQL ni una copia duradera de producción.

Incremento `aa6867f`: `npm run test:recovery` prueba la recuperación conjunta
de SQLite y medios sintéticos en procesos separados. La ejecución independiente
dio salida 0: 4 pruebas del helper, cinco archivos emparejados, cuatro imágenes
(original y derivados), dos versiones, rechazo de copia corrupta y edición
restaurada sin alterar origen/respaldo. Ver el
[informe de recuperación](recovery-drill-report-2026-09-07.md). No es todavía
un servicio de backup de producción. El commit concurrente público `9dc0bb0`
de Claude queda fuera del alcance de estas pruebas CMS y no se desplegó aquí.
La revisión independiente detectó una prueba de rechazo anónimo demasiado
permisiva; `b7d22a6` exige NotFound/404 y propaga errores inesperados. La revisión
del delta quedó aceptada, con tres pruebas adicionales del helper.
Reejecución independiente final sobre `b7d22a6`: salida 0, 7/7 pruebas de
helpers y recorrido físico completo correcto con los mismos cinco archivos.

Como seguimiento separado a Claude se ejecutaron las unitarias públicas:
205/207 pasaron y dos expectativas de fondo/padding de marcos fallaron tras
`9dc0bb0`. Se comunicó por Hub `ad70f182`; no se alteró el código público para
satisfacer expectativas antiguas ni se declara esa versión lista para desplegar.

El CV público queda como capacidad
pendiente de gestión de PDF: la colección Media actual admite solo imágenes;
no se ha publicado ni importado el CV de Figma. Se revisará el documento concreto
antes de exponerlo. Las versiones académicas/específicas no se publican por defecto.

Incremento del 7 de septiembre: acciones nativas y navegación editorial en
español; aviso/enlace de preview fuera de la barra de acciones para evitar
solapamientos en móvil. Ver `editor-language-verification-2026-09-07.md`.
La traducción de campos sigue pendiente. Los ocho paneles avanzados se han
movido al flujo del documento para evitar la superposición móvil de la barra
nativa. Hay verificación real del recorrido paquete/revisión/artefacto y
regresión automatizada; no equivale a certificar todo el shell responsive.
Ver `workflow-panels-verification-2026-09-07.md`, que conserva el desbordamiento
residual del menú nativo y el estado de la coordinación con Claude.

Incremento responsive posterior: accesos rápidos y buscador de 44 px en móvil,
sin ampliar desktop, y ajuste de nombres largos en resultados. Ver
`responsive-audit-2026-09-05.md`: recorrido real de login, creación de una página,
guardado, recarga y preview privado; ocho nuevas combinaciones browser,
687 unitarias, 20 integraciones, 22 controles browser y build owner correctos.
La auditoría completa de todos los editores, traducción coherente y cierre
de los requisitos de producción siguen pendientes.

Último incremento: encuadres históricos con variaciones móvil/tablet capturados
y utilizados por la asistencia, conservando el contrato desactivado de Linocube.
Ver `captured-crops-verification-2026-09-05.md`: 687 unitarias owner, 20 integraciones
SQLite, lint, tipos y build correctos; 207 unitarias públicas, 8 pruebas de
aislamiento, 11 guardas y 20 entradas públicas verificadas. No se aplican propuestas.

El título histórico y la identidad persistente de bloques quedaron incorporados
antes: `captured-title-verification-2026-09-05.md` y
`block-identity-verification-2026-09-05.md`, sin reescribir el histórico.

Incremento anterior: comparación legible de propuestas implementada y verificada.
Resultado: 653 unitarias owner, 17 integraciones SQLite y 22 casos browser;
lint, TypeScript y builds owner/público correctos. Portfolio: 207 unitarias,
11 guardas, 8 pruebas de aislamiento; 20 entradas públicas aisladas y 9 rutas
sin regresión de bundle. El check owner final usó una concurrencia temporal de
dos workers; el cierre intermitente del ejecutor permanece documentado.
El CMS local ha avanzado; no se declara listo para producción, ni se ha
publicado el panel o modificado el portfolio desde este trabajo.
