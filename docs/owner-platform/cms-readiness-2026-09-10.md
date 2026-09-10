# CMS: puerta operativa tras cierre del portfolio

Revisión del 10 de septiembre de 2026 sobre `6770a172995347ff8c8967ffcd98346f03636691`. Codex es el único integrador; Claude revisa sin escrituras simultáneas. No se modifica el diseño público ni se activa infraestructura.

## Evidencia nueva

- `npm run test`: 982 pruebas pasan, 149 archivos.
- `npm run typecheck`: salida 0, sin errores.
- `npm run test:integration`: 44 pruebas pasan, 5 archivos, salida 0. Bases SQLite y cuentas sintéticas; incluye desbloqueo por HTTP y operaciones editoriales/medios. Los rechazos 400/401/403 de los casos negativos son esperados. No acredita PostgreSQL alojado ni un dispositivo físico.
- `npm audit --omit=dev --json`: salida 1; ocho entradas moderadas procedentes de GHSA-jg8r-5jh2-v2xj, cero altas o críticas. `npm view payload version` devuelve 3.88.0. El [aviso oficial](https://github.com/advisories/GHSA-jg8r-5jh2-v2xj) sigue sin versión corregida.
- `Users.access.unlock` sigue restringido mediante `ownerOnly`; la prueba HTTP real pasa. No se elimina el aviso ni se aprueba una excepción de CI. No ejecutar el downgrade incompatible que propone audit fix --force.
- `src/payload.config.ts` no configura adaptador de correo. La recuperación de contraseña del CMS necesita transporte propio; el SMTP del formulario público no se hereda automáticamente. No se han enviado correos en esta revisión.

## Orden de cierre, no expansión de funcionalidades

1. Seguridad: revisión independiente de la mitigación de desbloqueo y decisión explícita ante el aviso sin parche. Responsable Codex; revisión solicitada a Claude por Hub `e7e91b77-84e0-42d1-8e9c-331cb8063e25`.
2. Almacenamiento: implementar y ensayar el transporte privado de objetos con claves inmutables, escritura condicional, verificación de integridad y restauración. No tratar el almacén actual basado en filesystem como compatible con Vercel.
3. Acceso recuperable: correo del panel, recuperación con token de un solo uso/caducidad y errores que no revelen cuentas. Verificar el recorrido completo en staging antes de abrir registro o login público.
4. Piloto owner: editar, guardar, previsualizar, publicar y restaurar; pruebas mobile/desktop y recuperación tras reinicio sobre la infraestructura elegida.
5. Solo después, organizaciones y segundo cliente con pruebas de aislamiento. No vender el estado owner-only como plataforma multiusuario.

## Dependencias de Manuel

No hace falta una nueva decisión para continuar pruebas y desarrollo local. Antes de contratar/activar Vercel owner + Neon + objetos privados, presentar coste y límites concretos para aprobación. Las credenciales se introducen en el proveedor, no en chats ni Hub. La elección técnica propuesta no prueba aprovisionamiento ni autoriza gasto.

Para el portfolio ya entregado, sigue siendo útil la comprobación del hero en el teléfono físico y confirmar la recepción del correo de prueba anterior. No repetir envíos reales por rutina.

Este avance es auditoría y definición de puertas de entrega: no añade funcionalidades, dependencias ni cambios runtime. No se presenta el CMS como listo para producción.
