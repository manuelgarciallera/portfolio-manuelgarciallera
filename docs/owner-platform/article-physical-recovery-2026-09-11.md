# Recuperación física de artículos con medios

Base host `56b6269d2d686a684a33d3e3ba37ebe70ad42fee`, reserva Hub
`0f842145-d304-414a-b977-a0094a8193a9`. Incremento solo de pruebas.

## Qué faltaba

El ensayo full-owner anterior cubría páginas, marca, archivos, previews,
releases y planes de restauración, pero no sembraba artículos. Tener todas
las tablas en un dump no probaba un artículo real con historial y relaciones.

## Prueba añadida

Se crea por API local autorizada un artículo sintético, cuerpo clásico,
cita modular y bloque Imagen relacionado con un medio y un encuadre que tiene
receta móvil propia. Se edita antes de copiar para generar dos versiones.
El proceso fuente cierra antes de pg_dump. La restauración usa otra base y
otro proceso con proveedor de objetos inicialmente vacío.

Antes de editar la copia se comparan exactamente:

- Documento completo, cuerpo clásico y layout modular.
- Historial completo, comprobando que la paginación no omite versiones.
- Documento del encuadre y recetas; relaciones conservadas.
- Representación de datos del preview y SHA256 de la imagen servida.
- Rechazo anónimo del borrador e historial.

La copia admite una edición HTTP autenticada; mantiene cuerpo, layout e imagen
y añade historial. Después, el proceso de verificación vuelve a abrir el origen
y exige igualdad con la evidencia previa. No modifica contenido real.

## Resultado

`node scripts/test-recovery-postgres.mjs --object-media --full-owner`:
sesión 21621, salida `6bb923`, código 0. 45 pruebas del arnés pasan; 18 archivos
de backup, 12 archivos de medios, tres revisiones y tres versiones de página;
dos versiones de artículo restauradas y edición independiente confirmada.
Doce daños/ausencias rechazados antes de crear el destino. Origen y recibos
intactos. Clúster y procesos cerrados, solo raíz sintética de esta ejecución
retirada por el propio arnés. Lint focal `812dc0`, diffcheck `2d72df` pasan.
Revisión independiente read-only sin defectos importantes.

## Límites

Docker aislado PostgreSQL16.15. Base de contenedor f0435bf más overlays:
applicationCommit del informe no representa el árbol exacto del host. No es
ensayo limpio del commit final ni instalación fresca de dependencias.
Esta prueba acredita recuperación por API, no creación por UI ni render visual
del artículo restaurado. La edición visual está documentada por separado.
Sin proveedor real, copia externa, restauración multi-tenant, licencia comercial,
contrato de entrega, push o despliegue. No equivale aún a un botón de exportar
toda la web para clientes. Codex conserva esas puertas como pendientes.
