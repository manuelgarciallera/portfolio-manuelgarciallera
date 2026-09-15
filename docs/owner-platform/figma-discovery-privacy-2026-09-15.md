# Discovery Figma: privacidad explícita de respuestas

15/09/2026 · Codex · base ea1a777 más delta acotado.

## Hallazgo y cambio

El manejador `src/connectors/figma/request.ts` devolvía datos del archivo y
previews sin Cache-Control explícito. Las rutas POST de Next no se cachean por
defecto según la documentación instalada; no se ha observado una fuga ni se
afirma que estos datos estuvieran almacenados. Se aplica defensa adicional
consistente con `src/dashboard/readiness-request.ts`.

Todas las respuestas creadas por el manejador llevan `private, no-store`:
éxito, denegación, petición inválida/excesiva y resultados/errores del proveedor.
Conserva códigos, cuerpo y Retry-After. No cambia la autenticación, sus excepciones
no manejadas ni las respuestas que el framework pudiera generar antes de entrar
en este manejador. No modifica configuración global de caché.

## Evidencia ejecutada

- RED `f30e26`: seis pruebas fallan por Cache-Control ausente, no por importación.
- GREEN `6cd0ab`: 135 pruebas / 21 archivos de Figma, contratos IA y Linocube,
  salida 0. Se ejercita el manejador real con Request/Response y dependencias
  externas sintéticas; no petición real a Figma ni sesión Payload alojada.
- Lint dirigido y `npm run typecheck`: sesión75859 salida0 (`62d0b6`).
- `npm run check:public-boundary`: 21 entradas, salida0 (`abb0b8`).
- Checkpoint desreferenciado: `0f0adf686b2752e23c25d224f8c60815b10fd451`.
- No build completo ni ensayo de cabecera en servidor alojado en este incremento.

## Capacidad contrastada, no promesa de integración

- Figma discovery tiene proveedor de lectura y ruta autenticada; sin token
  devuelve disabled. Las pruebas verifican normalización y límites con red simulada.
- Los contratos IA validan propuestas acotadas; estas pruebas no activan modelos
  ni demuestran asistencia remota conectada.
- Linocube tiene validación de manifiestos y consumidor desactivado. El digest
  acredita integridad, no identidad del remitente; no hay sincronización CRM activa.
- Importación/revisión Figma tiene código y pruebas adicionales; no se ha probado
  aquí con una cuenta externa ni se declara toda la integración lista para venta.

Siguiente Codex: incorporar este cambio al próximo ensayo HTTP pertinente y
continuar puertas existentes, sin repetir estas baterías por rutina. Publicación
CMS, staging, correo y almacenamiento reales siguen pendientes.

## Ensayo HTTP posterior · 15/09 08:05 Madrid

Sesión53909 finaliza con salida0 (`24d23f`). Checkout aislado
`61aead71b86d90515c4357b69cef0c3be24094f7`, único delta de fuentes: nuevas
aserciones en `scripts/test-production-http.mjs`. Build fresco con configuración
sintética, PostgreSQL16 y login real en Chromium emulado a390/1280.

- Discovery anónimo403; propietario con JSON inválido400, exceso de cuerpo413
  y petición válida sin token503/disabled. Las cuatro respuestas HTTP llevan
  `private, no-store`.
- Readiness conserva las tres puertas false; un borrador editado persiste tras
  reiniciar el proceso Next. App, clúster y raíz sintética de datos cerrados/limpios.
- Editor completo y papelera no ejecutados; no se acredita éxito200 de discovery
  contra Figma externo. El200 sintético sigue cubierto por la prueba unitaria.
- Dependencias Linux reutilizadas desde la instalación previa después de comparar
  ambos lockfiles idénticos; no afirmar instalación nueva. La copia de código QA
  permanece local para reproducibilidad, distinta de la raíz de datos limpiada.
- Sin cambios runtime adicionales, datos reales, correo externo ni despliegue.

Las aserciones quedan en el harness habitual para futuras regresiones. No se ha
repetido el RED sobre un build viejo: el RED de manejador está documentado arriba.
