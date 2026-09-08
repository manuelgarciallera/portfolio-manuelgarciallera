# Artefacto de migración de medios: reanudación tras NudeProject

Estado: diseño propuesto por Codex, no ejecutor de producción. Continúa el ensayo
cerrado en `media-migration-clone-verification-2026-09-08.md`; no lo sustituye ni
declara migrados los medios reales. Base pública de esta reanudación: `b1512cc`.

## Decisión y alternativas

El próximo incremento será un plan verificable de solo lectura, separado de su
futuro ejecutor. Reutilizará el inventario y las revisiones existentes. No se
convertirá el worker sintético de QA en un comando de producción mediante un flag.

Una activación directa no permite demostrar la correspondencia entre versiones
históricas y bytes. Un script monolítico mezcla preparación, permiso y escritura.
Separar plan, verificación y ejecución permite revisar el cambio exacto antes de
aplicarlo y detectar que el origen haya cambiado después de preparar el plan.

## Contrato de confianza

- `LegacyMediaInventory.migrationReady` sigue siendo literalmente `false`.
  Un inventario sin incidencias no prueba la autenticidad de los archivos antiguos.
- Un hash verifica integridad, no autoría, permiso ni autenticidad histórica.
  Ningún JSON aportado por el cliente puede autorizar una migración.
- La autorización operativa se obtiene fuera del artefacto, en el servidor y
  para un origen, destino, backup y digest concretos. No se almacena un booleano
  `approved` que un cliente pueda cambiar para habilitar el ejecutor.
- Los snapshots y sus hashes permanecen intactos. Una futura tabla de resolución
  separada necesita su propio contrato y pruebas; el mapa experimental de QA no
  se adopta automáticamente como formato de producción.

## Datos del plan propuesto

Versión de esquema explícita, huella del inventario, revisión del código y
versiones exactas de Payload/adaptador. Identidades opacas de origen, destino y
backup; sin contraseñas, URLs firmadas, rutas locales ni texto editorial.

Cada correspondencia identifica `kind`, `documentId`, `referenceId`, variante y
SHA-256/tamaño exactos; enlaza una evidencia histórica conservada con una revisión
de destino verificada. La clave es la referencia completa, nunca solo filename.
Dos épocas pueden compartir nombre y contener bytes distintos.

El plan debe incluir todas las referencias vigentes, borradores, versiones,
papelera y snapshots, o detenerse por cobertura incompleta. No se rellenan
huecos históricos regenerando derivados ni usando la imagen actual.

Estados de resultado: `blocked` o `ready-for-clone-verification`. Ninguno habilita
publicación. Si hay archivos históricos irrecuperables, se informa de las
referencias afectadas; no se elimina historia ni se degrada silenciosamente.

## Límites y validaciones

Conservar límites del inventario: 10.000 referencias, 16 variantes por referencia,
10.000 archivos, 64 MiB por archivo, 1 GiB observado y 8 MiB de informe. El almacén
de revisiones tiene además un máximo de 64 MiB total por revisión: el plan debe
respetar ambos, no solo el límite por archivo. Manifiesto máximo 64 KiB.

Rechazar campos desconocidos, arrays dispersos, duplicados, referencias extra o
ausentes, SHA malformado, enteros inseguros, colisiones NFC/case y nombres no
seguros. Comprobar los bytes mediante el lector de revisiones existente, no fiarse
de un manifiesto que simplemente declare el hash esperado.

## Secuencia operativa futura

1. Cerrar escritores y comprobarlo; capturar backup físico de BD y medios.
2. Restaurar ese backup en un clon aislado y comprobar su recuperabilidad.
3. Construir plan y verificar cada correspondencia con evidencia auténtica.
4. Ensayar el plan exacto en el clon, incluyendo fallo parcial y rollback.
5. Antes del corte, volver a verificar origen, backup, versiones y digest. Si
   cambiaron, invalidar el plan; no continuar con una advertencia.
6. Preescribir revisiones inmutables y verificar lectura. Aplicar referencias en
   transacción dedicada con sesión viva; nunca escribir fuera de ella.
7. Verificar permisos owner/anónimo, versiones, snapshots, nueva edición y
   recuperación. Solo entonces valorar habilitar el binding.
8. Conservar origen, backup y recibo del resultado. No borrar archivos huérfanos
   automáticamente, ni en un fallo ni después de una migración correcta.

## Pruebas exigidas al siguiente incremento

Constructor/validador puro primero, sin acceso a BD ni red: orden determinista,
entrada no mutada, alteración de un byte invalida digest, rechazo de duplicados y
campos extra, cobertura histórica incompleta bloqueada, mismo nombre con hashes
distintos no confundido, límites por revisión y por informe respetados.

Después, verificador físico en directorios sintéticos: archivo cambiado durante
lectura, symlink/hardlink, revisión incompleta y manifiesto falsificado rechazados.
La integración del ejecutor queda para otro incremento tras revisar este contrato;
deberá repetir SQLite y PostgreSQL con el mismo artefacto y conservar evidencias.

## Pendientes y responsables

- Codex: convertir este diseño en contrato tipado y pruebas de solo lectura;
  revisión independiente antes de incorporar cualquier escritor operativo.
- Codex/Claude: cerrar la propuesta de aislamiento `9585548d`; no relajar el
  presupuesto público ni tomar dependencias server-only por dependencias cliente.
- Manuel: proveedor, persistencia, costes y autorización concreta del corte real
  cuando existan pruebas restaurables. No se solicita una decisión prematura.

No se cambia la web pública, el almacenamiento activo, el CV, el correo ni DNS.
No se afirma que el CMS esté listo para venta por haber terminado los ensayos.
