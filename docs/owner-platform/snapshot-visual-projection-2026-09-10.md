# Proyección histórica sin datos actuales

2026-09-10 · Codex · base 07d3053 · sin publicación.

Extraída la proyección editorial común de visual-service: el cargador actual conserva autenticación y consultas autorizadas. El cargador histórico nuevo usa loadValidatedSnapshot (extraído del lector de originales) para una única consulta autorizada; título, bloques, medios, marca y encuadres proceden del manifiesto. No consulta páginas, proyectos ni medios actuales. Referencias a proyectos no capturados producen avisos; medios legacy y títulos ausentes no se infieren.

Las imágenes versionadas usan la URL privada por snapshot. El proyector no verifica disponibilidad de bytes al construir la vista: el endpoint la verifica al servirlos. No se promete renderizado fiel de relaciones cuyo contenido nunca fue capturado ni de módulos personalizados no conectados al visor.

Verificación: RED dos casos contra esqueleto; GREEN seis focales, incluidos marca con color distintivo y encuadre con override móvil. Suite completa final 1062/1062, 153 archivos. Tipos/lint salida 0; frontera pública 21 entradas. Recuperación física SQLite con captura creada por servicio real: proyección antes y después del respaldo sin avisos, título original y URL privada correctos. No nueva prueba PostgreSQL ni navegador.

Revisión independiente: sin hallazgos runtime; pidió cobertura explícita de marca y encuadre, incorporada. Primera fixture adicional tenía marca incompleta y fue corregida a los ocho roles requeridos; no se relajó la validación. Reserva Hub aeabb7f4-9d8f-4653-a4f4-c26572541f71.

Siguiente: conectar una vista admin que distinga captura de borrador actual, enlace desde la captura y avisos de limitaciones; verificar navegador. Esta entrega no añade aún la pantalla ni activa almacenamiento. Checkpoint 0f0adf686b2752e23c25d224f8c60815b10fd451 intacto. Codex conserva siguiente responsabilidad.
