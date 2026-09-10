# Lectura privada de originales capturados

2026-09-10 · Codex · base 0e34641 · sin publicación.

Servicio interno `src/preview/snapshot-media.ts`: exige owner, consulta la captura con `overrideAccess: false`, valida hash y procedencia y obtiene la revisión del manifiesto, nunca del documento media actual. Rechaza ausencia, duplicados y referencias legacy. Selecciona únicamente el original capturado; no introduce URLs arbitrarias ni amplía los permisos del transporte genérico. El almacenamiento inyectado debe verificar integridad de revisión y bytes, como los transportes existentes.

TDD: primer intento no cargó por módulo ausente; después del esqueleto, RED real: el caso de lectura histórica falló con Not implemented. GREEN: nueve pruebas focales. Suite completa nueva: 1048/1048 en 152 archivos, salida 0. Lint y typecheck salida 0; se corrigió un error de readonly en la construcción de la fixture. Revisión independiente read-only sin hallazgos accionables.

Limitación explícita: aún no conectado a un endpoint ni renderer. Faltan pruebas HTTP sobre Payload/almacenamiento reales, cabeceras privadas y visualización en navegador. No afirmar que el owner ya puede ver capturas históricas desde el panel. No se ha activado almacenamiento de objetos ni cambiado la web pública.

Reserva Hub 1945ad8f-7782-4fae-bbd8-c5a63e03355e. Siguiente responsable: Codex, consumidor privado y prueba de recuperación completa con la captura. Claude recibe el resultado para revisión; no se presupone aceptación.
