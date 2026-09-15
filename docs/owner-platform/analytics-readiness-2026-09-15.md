# Analítica e identidad: estado y siguiente conexión

## Evidencia actual

El dashboard tiene importación owner de snapshots, comprobación de integridad, resumen de tráfico/rutas/vitals y presentación. No equivale a conexión a visitantes reales. `src/app/api/web-vitals/route.ts` escribe logs; no alimenta esta colección. El contrato actual tampoco admite dispositivos, procedencia, países ni eventos de conversión.

Identidad pública verificada por HTTP el 15/09: Person incluye Manuel García-Llera Añón, alias sin tildes/guion, fotografía propia (HTTP200) y sameAs LinkedIn/GitHub/ORCID/Scholar. No duplicar marcado ni añadir palabras clave artificiales. Search Console y resultados de Google aún requieren revisar último rastreo; este turno no solicita indexación ni acredita actualización del buscador.

## Pruebas y corrección

Se añade fixture `owner-platform/tests/fixtures/analytics-synthetic.json`: 120 vistas y 60 visitantes INVENTADOS para pruebas, nunca tráfico real. Usar exclusivamente base aislada y desechable. No importarlo en la colección que se vaya a usar para producción: el campo source por sí solo NO aísla datasets ni evita que el último snapshot sustituya la vista principal.

Fallo reproducido (606c46): el resumen comparaba fuentes distintas. Ahora omite periodo anterior y deltas si source difiere, conservando cifras actuales y verificación de integridad. La segmentación de datasets sigue pendiente antes de sincronización automática.

Actualización temporal: seis casos RED (a29be3) demuestran que aceptaba ventanas solapadas, idénticas, futuras, más cortas, más largas o separadas por un hueco. Ahora solo calcula deltas entre ventanas adyacentes de igual duración UTC y misma fuente; conserva totales si no hay comparación válida. La prueba positiva usa dos días consecutivos, no dos exportaciones mensuales solapadas. No normaliza meses de distinta duración ni cambios de horario local: omite la comparación conservadoramente. No deduce identidad de propiedad a partir de source ni busca un periodo alternativo más antiguo.

Regresión: 81 pruebas de analytics/dashboard en 28 archivos pasan (af800e), tipos y lint focal sin errores. Prueba unitaria del cálculo, no nueva integración con proveedor ni despliegue CMS.

## Proveedor: propuesta, no activación

### Privacidad de respuestas e importaciones repetidas

Revisión 15/09 12:35 Madrid: los handlers de consulta e importación no declaraban política de caché. Once casos RED (d1f6a2) comprueban la ausencia en éxito, denegación, entrada inválida, exceso de tamaño y errores manejados. Ahora añaden `Cache-Control: private, no-store` siguiendo el patrón de readiness existente; estados, autenticación y contenido de respuestas intactos. Regresión 92 pruebas/28 archivos aprobadas (ab7301), tipos/lint focal/diff check correctos. Es prueba de handlers con dependencias controladas, no observación de CDN ni servidor desplegado; fallos de inicialización anteriores al handler quedan fuera del alcance. No se acredita una filtración previa.

Hallazgo pendiente del importador: `service.ts` reemplaza capturedAt por la hora de importación y `snapshotHash` incluye esa hora. El índice único del hash no acredita deduplicación del mismo agregado importado a horas distintas. No presentar el importador manual como sincronización idempotente; el futuro conector requiere identidad estable de propiedad/periodo, reintentos y prueba concurrente en BD. Esta revisión no cambia esquema ni borra duplicados/datos reales.

### Etiquetado visible y regresión del dashboard

El dashboard muestra la fuente del snapshot; `synthetic-qa` se presenta como «Datos de prueba · no son visitas reales». Una fuente ausente o inválida muestra «Fuente no identificada». Esto aporta transparencia, no aislamiento de datos.

Verificación del etiquetado: 75 pruebas en 28 archivos de analytics/dashboard pasan (8ed868), TypeScript y ESLint focal sin errores. El harness de navegador comprueba tanto estado vacío como estadísticas simuladas y aviso visible en 320/390/768/1280 px, claro y oscuro, sin desbordamiento horizontal ni errores de página (a2e906). Sigue siendo HTTP simulado, no una conexión a un proveedor ni una sesión completa del CMS.

1. Umami: candidato principal para piloto portable; API de estadísticas/eventos y opción cloud o instalación propia. Hay que confirmar plan, coste, región, mantenimiento y permisos antes de conectarlo. https://docs.umami.is/docs/api
2. Plausible: candidato si se prefiere servicio gestionado. Su Stats API v2 es lectura de agregados; documentación actual indica función Business, por lo que no presupuestar API incluida en cualquier plan. https://plausible.io/docs/stats-api
3. GA4: Data API permite informes para un dashboard propio. Considerarlo si hacen falta adquisición/campañas del ecosistema Google; no instalar por defecto ni duplicar recolectores. https://developers.google.com/analytics/devguides/reporting/data/v1

Fuentes consultadas 15/09/2026. No se han creado cuentas, claves, proveedores, cookies ni nuevos eventos públicos. No se afirma exención legal de consentimiento: revisar configuración, tratamiento y aviso antes de activar.

## Contrato del piloto

Verificación nueva: 76 pruebas de analítica/dashboard en 29 archivos pasan (f81ffe), lint focal y tipos. Harness responsive existente pasa ocho combinaciones 320/390/768/1280 claro/oscuro (bdc652): componentes reales con HTTP simulado, no sesión Payload completa ni analítica externa. No afirmar dashboard conectado por esta prueba.

- Una propiedad del dominio de producción y otra de QA; credenciales de lectura solo servidor owner. Nada de claves API en bundle público.
- Métricas iniciales: páginas vistas, visitantes estimados, rutas, origen agregado y dispositivo. Eventos separados: clic contacto, clic CV, clic Figma, clic LinkedIn. Un clic no equivale a descarga completada, lectura ni contratación.
- Contacto: éxito del servidor separado de clic en enviar; nunca texto, correo, nombre, IP ni URL con query libre en eventos del dashboard.
- No inventar duración, rebote ni Web Vitals si el proveedor no los devuelve. No sumar visitantes únicos por ruta como total.
- Aceptación: visita sintética se refleja solo en QA; rechazo/permiso según configuración; ausencia de doble conteo al navegar; error de proveedor conserva último dato con fecha y aviso, no ceros; reinicio conserva estadísticas; acceso anónimo denegado.

## Pendientes que requieren Manuel

Elegir modalidad/coste tras presupuesto concreto y entrar en la cuenta elegida para configurar acceso. No enviar secretos por chat. Para Search Console, sesión disponible y comprobación de URLs, no garantía de posición o fotografía.

## Siguiente hito acotado: primeras visitas verificadas

Actualización 15/09: recomendación concreta Umami Cloud Hobby, región UE, sin pasar a prueba de pago ni introducir tarjeta. La FAQ oficial confirma plan gratuito, regiones UE/EEUU y exportación. El precio del piloto es 0 USD de suscripción mientras se permanezca en el plan gratuito; no representa presupuesto del CMS ni garantiza cuotas ilimitadas. Comprobar cuotas, retención y disponibilidad efectiva de API en la cuenta antes de conectar. No actualizar de plan automáticamente.

Acción de Manuel: crear o abrir su cuenta en https://cloud.umami.is/signup, verificar el correo y seleccionar región europea. Mantener la titularidad y los secretos en la cuenta, no enviarlos al chat. Avisar cuando la sesión esté disponible. Si el alta exige pago, parar antes de aceptarlo.

Codex se encarga después de:

1. Comprobar condiciones, región, cuotas y permisos efectivos. Preparar propiedad de producción y QA separada si el plan lo admite; en caso contrario mantener QA local sin contaminar producción.
2. Preparar recolector mínimo y revisar consentimiento/aviso de privacidad, dominios y exclusión de contenido del formulario y parámetros libres. No activar grabación de sesiones ni identificación personal.
3. Verificar navegación SPA sin duplicados y eventos explícitos. Publicar únicamente tras pruebas y autorización aplicable.
4. Comprobar que una visita controlada aparece en la propiedad adecuada. Este hito puede cerrarse en el panel del proveedor antes de que exista CMS en la nube.
5. Conectar agregados al dashboard owner: API exclusivamente desde servidor, tratamiento de errores/cuotas, fecha de actualización, idempotencia y separación de fuentes. No afirmar que esta integración existe todavía.

Criterio de cierre del primer hito: visita y clic controlados observables, sin doble conteo ni datos del formulario, privacidad revisada, dominio público estable y configuración documentada. El dashboard propio conectado es un segundo hito, no una condición para empezar a medir.

Para CMS accesible desde cualquier lugar siguen pendientes infraestructura destino, medios durables, copia externa restaurada, recuperación de acceso por correo y ensayo de publicación/reversión. No obligar a Manuel a contratar esas piezas para comenzar la analítica. Search Console es otro acceso independiente; no es requisito para medir visitas.

Fuentes oficiales consultadas:
- https://docs.umami.is/docs/cloud/faq (plan gratuito; una prueba de plan de pago sí puede facturar al terminar).
- https://docs.umami.is/docs/cloud/sign-up (verificación de correo y elección de región).
- https://docs.umami.is/docs/cloud/api-key (API Cloud `/v1`, región `/eu`, autenticación Bearer y límite documentado de 50 llamadas/15 segundos; no prueba del permiso efectivo del plan).

Validación de esta actualización: revisión documental y Git HEAD/remoto sincronizados al inicio. Sin tests nuevos de runtime, contratación, tracker, conector ni despliegue en este turno.
