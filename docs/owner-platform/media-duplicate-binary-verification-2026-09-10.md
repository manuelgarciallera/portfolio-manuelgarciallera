# Duplicación binaria: comprobación pendiente cerrada

Base `5153661`. Se amplía exclusivamente `owner-platform/tests/versioned-media-http.integration.test.ts`, sin modificar el binding, la configuración activa ni archivos reales. Atiende el primer pendiente menor de `media-increment-handoff-2026-09-08.md`.

La duplicación nativa REST ahora comprueba el inventario completo de tamaños y SHA-256 de original y derivados, conservando multiplicidad aunque Payload cambie nombres. Descarga cada archivo por HTTP autenticado y verifica bytes exactos; el borrador duplicado devuelve 404 al anónimo. Recortar el duplicado debe crear una revisión distinta de 600×400 y dejar intactos tanto el origen como la revisión inicial del duplicado.

## Evidencia de esta ejecución

- Prueba enfocada: 1/1, seis casos no seleccionados, salida 0.
- Integración SQLite completa: 44/44, cinco archivos, salida 0.
- Lint y tipos: salida 0.
- Integración PostgreSQL 17.11 completa: 44/44, cinco archivos, salida 0. Clúster propio en loopback, sin credenciales ambientales. El ejecutor confirmó cierre del proceso, cero sesiones restantes y parada/limpieza de su raíz sintética.
- Revisión independiente `review_duplicate_test`: lectura del delta y fixture, sin hallazgos accionables. El revisor no ejecutó pruebas ni modificó archivos.
- Checkpoint original resuelto con `^{}`: `0f0adf686b2752e23c25d224f8c60815b10fd451`, intacto.

Es cobertura nueva de comportamiento existente, no corrección de un fallo runtime reproducido: pasó desde la primera ejecución. No se declara un ciclo RED/GREEN inexistente. No se repite build público porque no cambia código distribuido ni dependencias.

Sin push ni despliegue en esta ventana. Sigue pendiente adaptar almacenamiento a objetos privados y probar recuperación en ese destino; este ensayo local no acredita R2, staging, tenencia múltiple ni CMS listo para producción. Permanecen también los otros pendientes menores del handoff (respuesta detenida hasta EOF y clasificación de logs).

Reserva enviada a Claude por Hub `3c2748fe-b3fa-4434-83b2-69eb7cfaea44`; revisión local independiente no equivale a aceptación de Claude. Próximo responsable: Codex, preparación operativa del almacenamiento.
