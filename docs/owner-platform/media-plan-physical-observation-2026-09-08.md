# Observación física del candidato de medios

Base: `09ba782`, después del CV publicado en `e7b384c`. Incremento owner aislado;
no cambia la web pública ni activa el almacén versionado. Continúa el contrato de
`migration-plan.ts` y reutiliza `readMediaRevision`, sin repetir el ensayo completo
de migración sintética SQLite/PostgreSQL que ya se cerró anteriormente.

## Capacidad y frontera

`verifyMigrationPlanFiles(serialized, root)` en
`owner-platform/src/media/migration-plan-physical.ts`:

1. Revalida el JSON y su digest. Rechaza candidatos inválidos o bloqueados antes
   de acceder al sistema de archivos.
2. Agrupa por revisión y filename exactos. El constructor ya ha rechazado alias
   contradictorios. Los alias históricos idénticos no duplican bytes contados.
3. Lee secuencialmente cada revisión con el lector existente: manifiesto, nombres,
   tamaños, enlaces y SHA. Contrasta de nuevo los bytes contra el candidato, no
   solo contra el manifiesto del directorio.
4. Exige correspondencia exacta del conjunto de archivos de cada revisión:
   una revisión con derivados no incluidos en el candidato se rechaza.
5. Devuelve únicamente un recibo pequeño, ligado al digest del candidato:
   `observed-match`, `canApply:false`, huella de inventario declarada y recuentos
   de revisiones/archivos/bytes. No devuelve bytes ni rutas locales.

Los errores tienen cuatro códigos acotados: candidato inválido, bloqueado,
revisión ilegible/inconsistente o discrepancia de archivos. No transportan la
ruta de almacenamiento, errores nativos ni `cause`. No se añade un endpoint,
CLI operativo, consumidor de publicación, dependencia o escritura productiva.

Esta función **requiere un clon en reposo controlado por quien la llama**.
No adquiere locks, no congela el filesystem y no es una prueba persistente ni
una observación atómica de todas las revisiones. Si cualquier escritor o el
almacenamiento cambia, hay que invalidar el recibo y volver a comprobarlo.
No se promete detectar todas las carreras de sustitución/modificación concurrente.

Tampoco autentica `evidenceHash` ni demuestra que el conjunto de referencias cubra
el inventario real congelado. El SHA de inventario se transporta, no se contrasta
con un colector autorizado en este incremento. No existe aún vínculo con backup,
versiones del adaptador o autorización de corte. Un recibo manipulable no concede
permisos. `observed-match` nunca significa «migración lista para producción».

La lectura es secuencial para no acumular el potencial GiB del candidato: cada
llamada al lector está acotada a 64 MiB por revisión. Esto es un límite lógico de
buffers, no una medición nueva de RSS ni una garantía del recolector de memoria.

## Verificación

TDD: scaffold explícito con capacidad ausente, **16 fallos funcionales**, salida1.
Después, 16 casos nuevos pasan y **97/97** pasan al sumar las suites existentes
del plan y del almacén. Fixtures físicos temporales, sin biblioteca real.

Cubren originales/derivados, históricos del mismo nombre con bytes diferentes,
alias, tamaños/hashes/nombres discrepantes, archivo y manifiesto alterados juntos,
archivos/manifiestos ausentes, manifiesto inválido, archivo extra, hardlink,
derivado omitido, candidato bloqueado, digest alterado y privacidad del error.
Comparación de bytes/manifiesto y entradas antes/después en el caso positivo;
limpieza no recursiva de raíces sintéticas y revisiones registradas únicamente.

Typecheck y lint sin diagnósticos; su sesión conjunta31784 terminó con salida0.
Suite owner completa8492: **938/938**, **148 archivos**, salida0, **86,62s**,
inicio 2026-09-08 10:31:59 local. No se ha repetido un build público ni un ensayo
SQLite/PostgreSQL: no hay integración nueva con esos adaptadores en esta pieza.
Revisión independiente estática de los dos archivos y del contrato existente:
sin Critical/Important/Minor accionables. El revisor no ejecutó pruebas ni
mutó archivos; los resultados de ejecución anteriores son del controlador.
Un primer comando de frontera falló por nombre de script inexistente
(`check-owner-boundary.mjs`); no fue un fallo de la frontera ni una comprobación
válida. Comando corregido `npm run check:public-boundary`: **21 entradas**, salida0.

## Coordinación, continuación y pendientes

Primer despertar temporal observado: 2026-09-08 08:24 UTC. No acredita servicio
permanente. Se conserva el fin original 15:45 UTC sin ampliación ni sondeo nuevo.
Reserva/estado enviado a Claude: Hub `43aba4ec-2ba1-486c-bd00-b920fff06805`;
enviado no equivale a procesado ni aceptado. Navbar/orbe/correo permanecen en su
carril; este incremento no los modifica.

Siguiente Codex: vincular referencias a un inventario congelado autorizado y
definir/verificar el estado en reposo antes de cualquier ejecutor; continuar
pruebas de cambios durante lectura sin confundir hash con snapshot. Restricción
de caracteres Windows del lector existente pendiente de incremento separado.
Persistencia, backup externo, recuperación owner y activación real siguen con
sus puertas; no se solicitan credenciales ni se elige proveedor aquí.

Se preservan checkpoints y documentos compartidos previamente modificados.
Sin push, despliegue, DNS, correo, traslado de datos, costes ni migración real.
