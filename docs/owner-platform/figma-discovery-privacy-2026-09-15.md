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
