# Identidad de bloques en capturas y asistencia

## Problema y cambio acotado

La proyección editorial descartaba el `id` persistido por Payload en cada
bloque. Al intercambiar dos bloques con el mismo contenido, una captura podía
ser idéntica a la anterior y el contexto del asistente no permitía distinguirlos.

Las nuevas capturas conservan el identificador existente para todas las familias
de bloques. No se generan identificadores posicionales ni se modifica la página.
Un identificador presente debe ser una cadena de 1–128 caracteres alfanuméricos,
guion o guion bajo, y no puede repetirse dentro del layout. Los identificadores
inválidos se rechazan antes de crear una captura.

## Compatibilidad

- Los layouts antiguos sin identificadores siguen siendo legibles y capturables.
- No se reescriben capturas históricas, sus hashes ni propuestas existentes.
- El esquema del manifiesto sigue en versión 1: `pageBlocks` ya admite los campos
  JSON canónicos de la proyección. Las nuevas capturas con IDs tienen su propio
  hash; no se fuerza la reutilización de una captura histórica sin IDs.
- La comparación de propuestas ya sabía representar IDs cuando estaban presentes;
  ahora los recibe desde capturas reales, sin cambiar la interfaz.
- Una captura antigua sin identidad no debe asumirse apta para una futura
  aplicación asistida: habrá que recapturar y validar el estado actual.

## Evidencia ejecutada el 5 de septiembre de 2026

1. TDD: siete fallos esperados antes de corregir la proyección, cubriendo orden
   de bloques idénticos, IDs mal formados y duplicados. Después, 36 pruebas
   focalizadas correctas de captura, contexto y comparación.
2. Integración con Payload y SQLite reales: Payload genera dos IDs distintos;
   la captura y el contexto los conservan; una propuesta de inversión se muestra
   en el orden correcto con sus IDs. La captura original y el borrador mantienen
   su orden después de crear y revisar la propuesta.
3. `npm --prefix owner-platform run check`, con `VITEST_MAX_WORKERS=2` temporal:
   **660 unitarias en 141 archivos, 18 integraciones, lint, TypeScript y build**,
   todo con salida 0. La variable anterior se restaura al terminar el comando.
4. `npm run check:public-boundary`: **20 entradas**, salida 0. No hay cambios
   de código público, dependencias ni lockfiles en este incremento.

El ensayo SQLite no certifica PostgreSQL ni concurrencia de producción.
El aviso de ausencia de adaptador de correo sigue vigente. No se ha realizado
una nueva auditoría visual completa ni conectado un proveedor IA en este cambio.

## Lo que no resuelve todavía

Aceptar una propuesta sigue siendo una decisión auditada, no una escritura al
borrador. Antes de añadir esa escritura faltan la base completa para comparar
campos como título/encuadres, comprobación de revisiones actuales, consentimiento
específico, copia recuperable y aplicación transaccional con rollback. Tampoco se
ha activado publicación, despliegue ni integración CRM.
