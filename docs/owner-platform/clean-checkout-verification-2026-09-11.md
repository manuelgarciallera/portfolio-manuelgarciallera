# Verificación desde Git limpio: f0435bf

## Procedencia

SHA exacto: f0435bfacad6beda0ed4c77e43b2c593536cd1ca.
Bundle completo local `.audit/owner-full-f0435bf.bundle`, verificado por Git,
sin prerrequisitos. SHA256:
`79FEDC59874D2CD1E22E85ED4AD7993C5A6248F1631298BC56CFF49DB2E4F181`.

Clonado en `/work/verification-f0435bf` del contenedor local
`owner-editor-6dc5c51-0911`; HEAD separado y árbol limpio antes de probar.
No se cambia HEAD ni el árbol compartido del host. Sin redes, montajes ni
puertos publicados (inspección6ce6c7). Dependencias Linux existentes copiadas,
no instalación nueva: lockfile del host y contenedor coincide SHA256
`FF25B164CF957B66A19E4A8F8FFBBAB5148B9E00A1AC40FC14B9F3598A47FB11`.
La igualdad del lockfile no sustituye una instalación reproducida desde cero.

No se incluyen los cambios locales ajenos ni documentos sin commit. Esta copia
prueba el código versionado; el bundle no es respaldo remoto ni contiene por
sí mismo la base de datos/medios de un cliente. No se han trasladado datos reales.

## Ensayos secuenciales

1. `node scripts/test-recovery-postgres.mjs --object-media --full-owner` con
   PostgreSQL16 local, datos sintéticos, dump/restore real y proveedor de objetos
   sintético.119eba salida0:45 pruebas del arnés,18 archivos de backup,
   12 archivos de medios verificados,3 revisiones y3 versiones de página.
   Rechaza12 casos de daño antes de asignar destino; login/historial/edición
   independiente/preview congelado y plan de restauración pasan. Estado fuente
   y recibos intactos. Clúster detenido y raíz de esa ejecución retirada.
2. Build producción y flujo HTTP/browser desde esta misma copia:a954d9 salida0.
   Páginas/marcas/encuadres, formato y artículos clásicos/modulares a390/1280,
   privacidad anónima y documentos/medios tras reinicio pasan. App/clúster
   cerrados y raíz sintética retirada. Git status vacío y HEAD exacto después
   del ensayo (aaa2b6). No overlays de código en esta comprobación.

Checkpoint protegido permanece en0f0adf686b2752e23c25d224f8c60815b10fd451.
Sin push ni despliegue. Esto no cierra las puertas de proveedor/infraestructura
real ni acredita CMS multi-cliente o UI comercial definitiva.
