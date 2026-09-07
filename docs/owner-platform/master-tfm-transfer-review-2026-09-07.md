# Transferencia del máster, TFM y radar a los productos

Fecha: 2026-09-07. Responsable: Codex. Estado: revisión focalizada con pruebas locales; no auditoría exhaustiva ni autorización para producción.

## Conclusión

El valor reutilizable es el conocimiento y los contratos comprobables: componentes por responsabilidad, edición parcial, relaciones de datos, permisos del servidor, operaciones atómicas y entregas reproducibles. No conviene copiar aplicaciones académicas completas ni imponer Angular/MySQL al CMS actual. Mantener los productos independientes y compartir contratos cuando un segundo consumidor real los necesite.

El banco común sigue siendo [HALLAZGOS](../../00_Coordinacion_IA/docs/HALLAZGOS.md). Claude incorporó su revisión en `7f163a5` durante este trabajo; este informe complementa esa aportación con fuentes y pruebas distintas, sin duplicar sus hallazgos ni certificar sus conclusiones de seguridad.

## Alcance y procedencia

Inventario de archivos y muestra dirigida, no lectura íntegra de todos los apuntes ni visionado de las clases. El recuento excluyó dependencias y algunas carpetas generadas, pero no deduplicó copias, ZIP ni materiales derivados por IA. Como orientación: Angular 4.127 entradas, Node/Express 2.721, JavaScript 1.056, BBDD 656, TFM 282 y vídeos 462. Estos números describen volumen, no cobertura de auditoría.

Fuentes académicas bajo `C:/Users/manue/OneDrive/Documents/UNIR 2/Máster Full Stack Developer/`:

| Fuente | Lectura realizada | Uso |
| --- | --- | --- |
| `ANALISIS_INTEGRAL_UNIR2_MASTER_2026-04-19.md` | Consulta del índice y análisis histórico; no todos sus ejemplos | Localizar materias; no asumir vigencia del inventario antiguo |
| `MATRIZ_TFM_TRAZABILIDAD_CONTENIDOS_MASTER_2026-04-19.md` | Matriz completa | Relacionar ejercicios, aprendizajes y TFM |
| `5. BBDD MySql & MONGO DB/Clases/BBDD_MySQL_Acumulativo_3.md` | Índice y comienzo | Relaciones y fundamentos; contraste pendiente de capítulos completos |
| `7. Despliegue y testing de Apps/CODEX modulo Despliegue Testing/02_MANUAL_MAESTRO/DESPLIEGUE_TESTING_MANUAL_MAESTRO_TFM.md` | Manual completo | Instalación, entorno, datos y verificación reproducibles |

Fuentes prácticas leídas:

- `C:/Develop/TFM_Full Stack Develop/GUIA_ESTUDIO_MOVIL.md` y texto de `TRAZABILIDAD_MASTER_TFM.docx`. DOCX extraído en lectura, sin modificarlo ni auditar su maquetación.
- En ese TFM: manifiestos de frontend/backend, README backend, `backend/src/models/pedidos.model.js`, middleware de autenticación y tramo de creación de pedido del controlador. No se ejecutó el backend ni se conectó su base de datos.
- `C:/Develop/actividad_5`: componentes de blog/formulario. `C:/Develop/actividad_6`: servicio de usuarios y formulario de creación/edición. Sin llamar a sus APIs externas.
- Auditoría histórica de componentización Buy&Sell del 27 de julio, en el área Codex de Perfil profesional. Sus cantidades no se presentan como medición actual.

Radar canónico: `C:/Users/manue/OneDrive/Documents/Perfil profesional/00_Proyecto_Perfil_Profesional/01_Codex/radar_frontend/`. Se retomaron las referencias RAD-001 a RAD-004 ya contrastadas en el banco; se leyó además `2026-09-02_EVALUACION_UI_UX_PRO_MAX.md`. La serie existe, pero no se declara releída íntegramente en este turno. Las recomendaciones y versiones históricas deben revalidarse.

No se abrieron archivos `.env`, archivos comprimidos con posibles secretos ni se trasladaron activos de equipo o cliente. Los apuntes que restringen el TFM a técnicas impartidas son criterios académicos de ese ejercicio, no instrucciones que limiten nuestros productos futuros.

## Qué debemos, podemos y podríamos incorporar

| Prioridad | Aprendizaje → pieza concreta | Decisión y prueba de aceptación |
| --- | --- | --- |
| Debemos · ahora | Edición parcial del TFM → actualización de páginas y parámetros de marca del CMS | Dos pruebas nuevas con Payload y SQLite reales: título sin pérdida de bloques/marca; duración sin borrar parámetros hermanos; rechazo de edición inválida sin versión parcial |
| Debemos · antes de vender | Relaciones y transacciones → publicación/restauración CMS, reserva de artículo en ecommerce | Mantener invariantes y fallos atómicos. CMS tiene pruebas de rollback; falta comprobar PostgreSQL operativo. Ecommerce necesita ensayo concurrente y de reintentos antes de reutilizarse |
| Debemos · antes de integrar clientes | Permisos por recurso → endpoints editoriales y futuros contratos CRM | Revisar cada operación en servidor. El owner único actual no demuestra aislamiento multi-cliente; pruebas cruzadas de tenants antes de ofrecerlo |
| Debemos · antes de publicar | Despliegue/testing → recuperación del CMS | Restaurar código, datos y medios compatibles en un entorno aislado; variables presentes o un tag Git no prueban recuperación |
| Podemos · piloto siguiente | Formularios reutilizables → edición autónoma de contenido | Formularios con estado pendiente/error y conservación de entradas; probar móvil, teclado, guardado fallido y reintento, no solo apariencia |
| Podemos · con segundo consumidor | Servicios/interfaces/componentización → adaptadores web→CRM y catálogo de bloques | Tipos, validación en runtime y contratos versionados. No extraer un núcleo común vacío ni copiar los estilos de cada proyecto |
| Podríamos · laboratorio | Radar motion y regresión visual → recetas de landing y controles CMS | Ensayo aislado comparado con checkpoint: estética, rendimiento, teclado, reduced motion y móvil; sin rediseñar la portada ni instalar paquetes por tendencia |
| Podríamos · más adelante | IA de apoyo y corpus UX → asistencia editorial revisable | Hipótesis y propuestas con fuente, permisos y revisión. No tratar una biblioteca de prompts como evaluación de usabilidad |

## Qué no debemos heredar sin revisar

1. **Ejercicio 5:** sus entradas viven en memoria. Sirve para entender componentes/eventos, no para afirmar que ya tenemos publicación persistente.
2. **Ejercicio 6:** el tipado de HttpClient no valida respuestas en runtime; errores enviados solo a consola no bastan para un cliente que edita su web. Reutilizar separación de responsabilidades, no su tratamiento de errores tal cual.
3. **Materiales derivados por IA:** la guía dice que desde Angular 19 no hay módulos. No es correcto: Angular recomienda standalone para código nuevo y conserva NgModules. [Documentación oficial](https://angular.dev/guide/ngmodules/overview). Tampoco se adopta como regla general que NoSQL sea más rápido por tener más tráfico.
4. **TFM/pedidos:** la función revisada sí usa transacción y consultas parametrizadas. Sin embargo, reserva mediante una actualización incondicional; no se observó en esa función una condición de disponibilidad ni clave de idempotencia. El controlador crea una notificación después del commit. Son riesgos candidatos de doble reserva o respuesta de error tras un pedido ya guardado, no fallos reproducidos aquí. Antes de reutilizar: probar dos compradores concurrentes, reintento y fallo de notificación; decidir restricción de datos y cola/outbox según evidencia.
5. **TFM/auth:** existe bypass de desarrollo condicionado por entorno. No trasladarlo al owner. Los permisos se validan por petición y recurso, no solo con guards del frontend. [OWASP: autorización](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) y [estados de flujo en APIs](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html).
6. **Derechos y operación:** los metadatos de licencia de package y README del backend no coinciden; no se localizó un archivo LICENSE en la búsqueda realizada. No prueba ausencia total ni determina derechos, pero impide asumir que todo el trabajo de equipo es reutilizable comercialmente. Inventariar autoría, permisos y activos antes de copiar código.

Los avisos de seguridad del TFM depositados por Claude siguen prioritarios y pendientes de contraste independiente; no se han corregido en este turno. No usar el TFM como ecommerce comercial mientras estas puertas sigan abiertas.

## Aplicación efectiva y comprobación

Modificado únicamente el test editorial del CMS, más documentación compartida. Sin dependencias nuevas ni cambios de interfaz, runtime o datos reales.

- `npm run test:integration`: **22/22**, salida 0; base SQLite temporal exclusiva, autenticación y persistencia reales. Antes había 20 casos; se añaden los dos contratos de edición parcial descritos arriba.
- `npm run typecheck` y `npm run lint` en owner: salida 0.
- Estas son pruebas de caracterización del comportamiento existente, no una corrección de fallo descubierto ni una campaña de mutación completada. Una sustitución destructiva de overrides o escritura antes de validación debe hacerlas fallar; no se alteró código productivo para simularlo.
- No repetidos en este turno: build, auditoría visual, benchmarks, tests PostgreSQL ni restauración real de medios. No se atribuyen resultados anteriores a esta ejecución.

## Siguiente secuencia, sin ampliar el producto por impulso

1. **Codex / CMS:** cerrar entorno PostgreSQL y medios persistentes; ejecutar integración equivalente y restauración aislada con inventario/hashes. `pg_restore` permite restaurar archivos de pg_dump, pero debe ensayarse con nuestro esquema y permisos, no declararse por instalarlo. [Referencia oficial](https://www.postgresql.org/docs/current/app-pgrestore.html).
2. **Responsable TFM por coordinar:** reproducir avisos de permisos y concurrencia sin datos reales; completar licencia/autoría antes de extracción. No se ha abierto una nueva línea de implementación ecommerce.
3. **Radar existente / Codex:** revisar candidatos y fuentes pendientes antes del 14 de septiembre; continuar módulos 5–8, pruebas/backend, Docker y documentos completos por bloques útiles. Registrar cobertura y no volver a inventariar todo cada semana.
4. **Cuando haya consumidor real:** piloto web→CRM con contratos, identificación del recurso, permisos, reintentos y trazabilidad. Las integraciones IA/n8n siguen opcionales, con coste y permisos explícitos.

El checkpoint protegido se conserva. Esta revisión no publica, migra ni promete coste cero o preparación comercial. La cobertura pendiente incluye vídeos, PDFs originales completos, todos los ejercicios, auditorías de otros productos y validación de usuarios reales.
