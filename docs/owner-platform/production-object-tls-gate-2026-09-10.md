# Puerta TLS antes de probar objetos con Next productivo

Fecha: 2026-09-10. Base `9a3b368`. Reserva Hub `826b6e9c-aab5-48f2-8fe1-6e9538d57787`.

## Resultado: incompleto, no aprobado para despliegue

Se añadió un modo experimental `--object-media` al runner productivo existente. Usa PostgreSQL sintético con las migraciones de objetos, un proveedor S3 de prueba en memoria y certificado efímero. La confianza adicional se limita al proceso Next hijo. No configura proveedores reales ni desactiva validación TLS.

Las dos ejecuciones iniciales llegaron a Next y pasaron el login de navegador a 390/1280, pero la subida devolvió HTTP 500. Diagnóstico `a84f57`: `ObjectRevisionWriteError`, causa `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Aplicación y clúster se cerraron; las raíces sintéticas se limpiaron.

Sonda independiente `782369`, mediante OpenSSL verificando la CA de prueba: el certificado observado tiene como emisor `AVG Web/Mail Shield Self-signed Root`, generado por AVG para certificados autofirmados. No es el certificado que sirve el fixture. El mismo fallo se reproduce fuera de Next (`0c1af0`) e incluso con CA explícita (`2eb03e`). Los almacenes Root consultados contienen la raíz normal de AVG, no esa raíz Self-signed. Esto identifica una limitación TLS local; no demuestra que el código de subida del CMS falle con un proveedor de certificado válido.

No se modifica AVG, el almacén de certificados, la confianza del sistema ni la política de producción. No se incorpora ese emisor desconocido para conseguir un verde.

## Mejora verificable del ensayo

- `object-tls-preflight.mjs` prueba la confianza en un proceso Node separado **antes** del build o de inicializar PostgreSQL. Fallo observado `28ec35`, salida 1 en unos tres segundos y limpieza de su raíz validada. Evita repetir builds costosos ante la misma condición.
- Directorios temporales propios con comprobación de ruta; si OpenSSL/Node no confirma cierre, se retienen en vez de borrarlos. El cierre del proveedor no impide intentar cerrar PostgreSQL.
- Se descartan stdout/stderr runtime, que pueden contener fragmentos de configuración imposibles de redactar con garantía. No se conserva el capturador diagnóstico temporal.
- Revisión independiente detectó y cerró dos P2: salida parcial potencialmente sensible y limpieza sin propagar cierre incierto de OpenSSL.

## Cobertura pendiente del modo experimental

El recorrido escrito verifica subida, reemplazo con bytes distintos, metadatos, privacidad anónima, revisiones anterior/actual después de reiniciar Next y scratch vacío. **Esos asertos todavía no han pasado completos**, porque TLS falla antes de escribir.

Se retiró el intento de crop nativo de este ensayo: requiere origen y sesión de navegador válidos, y el refetch protege contra loopback. No se relajan CSRF/SSRF para probarlo. Probarlo en staging con dominio y TLS válidos es una puerta separada.

Incluso cuando este ensayo pase, el proveedor en memoria vive durante el reinicio de Next: no acredita persistencia del proveedor, caídas, cuotas ni backup externo.

## Ejecución

Regresión final: modo legacy `715bcb` salida 0, build productivo, login de navegador 390/1280, HTTP privado y borrador conservado tras reinicio; aplicación/clúster cerrados y limpieza verificada. Suite existente de objetos HTTP/PostgreSQL 17.11 `c06735`: 4/4, salida 0, incluye crop/restauración, corrupción y fallos inyectados, con proceso/sesiones cerrados y limpieza. Esa suite usa su fixture autorizado, no prueba crop de Next productivo. Tipos/lint/diff `b52e02`: salida 0. Sin cambios en el código runtime; no se repite toda la batería unitaria.

En `owner-platform`, configurar `OWNER_POSTGRES_BIN` con herramientas PostgreSQL de prueba y ejecutar `node scripts/test-production-http.mjs --object-media`. `OWNER_TEST_OPENSSL` permite una ruta explícita; Windows usa por defecto OpenSSL de Git. Sin la opción, se conserva la prueba productiva legacy existente.

Siguiente responsable: Codex. Repetir la puerta en un entorno TLS válido; antes de despliegue real se necesitan proveedor autorizado y verificación de acceso, almacenamiento y restauración. Claude recibe evidencia por el Hub, no una declaración de CMS listo.
