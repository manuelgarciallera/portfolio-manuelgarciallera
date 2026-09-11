# Verificación editorial aislada en Docker

## Alcance y procedencia

Manuel autoriza iniciar Docker y preparar el entorno aislado. Base de código:
`6dc5c51de7680cb58257c82ab608992856df7177`. Se exporta únicamente
`owner-platform` mediante `git archive`; no se copian archivos `.env`, datos,
credenciales, dependencias Windows ni cambios sin commit.

Motor observado: Docker 29.7.2. Contenedor propio:
`owner-editor-6dc5c51-0911`. Imagen Playwright 1.62.0 noble, digest:
`sha256:baed2032d533817f3dbe6425de795788430ba345e819a1201337009ba17c9d07`.
Sin montajes host ni puertos publicados. El contenedor existente de Linocube
no se modifica.

Dentro del contenedor se instalan dependencias mediante el lock de owner y
Playwright 1.62.0 en el directorio padre, reproduciendo la resolución que en
Windows ofrece el paquete raíz. PostgreSQL 16.15, Node 24.18.0 y OpenSSL
3.0.13. Se ejecuta como `pwuser`, no root. Esta prueba no acredita compatibilidad
con todas las versiones de PostgreSQL ni con un proveedor alojado.

Tras instalar, se desconecta la red bridge; quedan únicamente conexiones
loopback internas. Se crea la caché requerida por el preflight y se ejecuta:

```text
OWNER_POSTGRES_BIN=/usr/lib/postgresql/16/bin npm run test:production:editor
```

## Resultados

- Inspección Docker: montajes `[]`, puertos `{}`, redes `{}` tras desconexión.
- Preflight TLS superado: el runner alcanza el build de configuración sintética
  (`2e28c2`). No se cambia AVG, confianza global, CSRF o validación TLS.
- Ensayo editorial completo: salida 0 (`29a4e5`). A 390 y 1280 px se verifican
  login por teclado y cookie, edición, reordenación por teclado, guardado,
  recarga y vista previa. Acceso anónimo rechazado; borradores conservados tras
  reinicio de Next (`59d6f0`). App y clúster cerrados, raíz sintética limpiada;
  inspección de procesos `7087ac` confirma únicamente init/sleep y la inspección.
- Ensayo combinado con `--object-media`: salida 0 (`8d719d`). Repite el editor
  en ambos anchos y verifica subida multipart, sustitución de imagen, nueva
  revisión, bytes actuales e históricos, privacidad anónima y conservación
  tras reiniciar la aplicación (`dc5988`). Scratch vacío. App/clúster cerrados,
  raíz limpiada; procesos comprobados en `0a98cd`.

Ambas puertas que Windows impedía ejecutar por TLS han pasado en este entorno.
No ha sido necesario cambiar el código del CMS ni debilitar las verificaciones.
El proveedor de objetos del ensayo permanece en memoria mientras se reinicia
Next: no demuestra supervivencia a caída del proveedor ni persistencia remota.

## Cierre

Contenedor propio detenido y conservado para repetir el entorno: estado `exited`.
No se elimina su imagen ni el archivo de código exportado. Solo Linocube-redis
permanece activo en la enumeración final. Frontera pública: 21 entradas, salida 0
(`86664f`). No se repiten unitarias completas al no haber cambios de código.

Próximas puertas: revisar la interfaz con Manuel antes de rediseñarla; validar
almacenamiento y recuperación en staging real antes de ofrecer operación
productiva. Las propuestas de controles visuales y temas no están implementadas
por esta verificación.

## Límites

No hay despliegue, cambio del diseño, proveedor real ni datos de usuarios.
El ensayo existente crea inicialmente un borrador por API con cookie; después
usa formularios y controles reales. No cubre creación inicial por UI, gestos
táctiles físicos, recorte de imágenes ni publicación externa.
