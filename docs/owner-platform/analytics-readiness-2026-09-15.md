# Analítica e identidad: estado y siguiente conexión

## Evidencia actual

El dashboard tiene importación owner de snapshots, comprobación de integridad, resumen de tráfico/rutas/vitals y presentación. No equivale a conexión a visitantes reales. `src/app/api/web-vitals/route.ts` escribe logs; no alimenta esta colección. El contrato actual tampoco admite dispositivos, procedencia, países ni eventos de conversión.

Identidad pública verificada por HTTP el 15/09: Person incluye Manuel García-Llera Añón, alias sin tildes/guion, fotografía propia (HTTP200) y sameAs LinkedIn/GitHub/ORCID/Scholar. No duplicar marcado ni añadir palabras clave artificiales. Search Console y resultados de Google aún requieren revisar último rastreo; este turno no solicita indexación ni acredita actualización del buscador.

## Pruebas y corrección

Se añade fixture `owner-platform/tests/fixtures/analytics-synthetic.json`: 120 vistas y 60 visitantes INVENTADOS para pruebas, nunca tráfico real. Usar exclusivamente base aislada y desechable. No importarlo en la colección que se vaya a usar para producción: el campo source por sí solo NO aísla datasets ni evita que el último snapshot sustituya la vista principal.

Fallo reproducido (606c46): el resumen comparaba fuentes distintas. Ahora omite periodo anterior y deltas si source difiere, conservando cifras actuales y verificación de integridad. No resuelve comparabilidad de ventanas temporales ni segmentación de datasets: puertas pendientes antes de sincronización automática.

## Proveedor: propuesta, no activación

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
