# Identificadores editoriales de URL — 2026-09-10

Base: `ba6b4fe80738d1eafc682287727c7ffbf64952c1`. Reserva Hub: `2bf57db7-9d3d-4437-9974-b29f04afe4fe`.

## Cambio

El campo compartido `slugField` permitía texto libre. Ahora conserva la validación nativa de Payload y exige un segmento de hasta 120 puntos de código: letras y números Unicode, marcas combinantes posteriores al primer carácter, guiones, guiones bajos y puntos salvo al inicio. Rechaza espacios, rutas completas, barras, parámetros, fragmentos y separadores codificados. No transforma el valor ni cambia mayúsculas o acentos.

No cambia esquema, dependencias, rutas públicas ni permisos. Es un contrato de entrada editorial, no un sanitizador universal ni una solución completa de enrutamiento/SEO. Una URL válida todavía puede requerir reglas de rutas reservadas o unicidad por organización cuando exista ese modelo.

## Compatibilidad

No se han migrado ni inspeccionado datos reales. Un registro histórico con un identificador antes admitido y ahora inválido puede necesitar corrección explícita al editarlo o restaurarlo. Antes de activar esta versión sobre contenido real, inventariar esos valores; no renombrarlos silenciosamente ni publicar cambios de URL sin considerar redirecciones. El cambio permanece local mientras se verifica.

## Evidencia

- RED previo: 16 fallos / 9 aciertos contra el campo sin validador (`806bbf`).
- GREEN focal: 25/25 (`ff880c`); tipos y lint salida 0 (`cc0b82`).
- Revisión independiente detectó ambigüedad en una fila array de `it.each` y en el texto sobre puntos: corregidas con filas `{ value }` y mensaje explícito.
- SQLite, colección real con permisos owner y borradores: 26/26 (`2431f8`, 62,89 s). Rechazo de cambios malformados sin alterar documento ni versiones, rechazo de creación inválida y aceptación posterior de Unicode.
- Regresión completa: 1229/1229 pruebas en 163 archivos (`60e42b`, 220,74 s, salida 0). Un intento anterior perdió su sesión durante reconexión y no se contabiliza; antes de repetir se comprobó ausencia de procesos Vitest.
- Frontera pública: 21 entradas, salida 0 (`00e4e0`).
- Primer intento PostgreSQL: `initdb.exe` agotó tiempo antes de ejecutar pruebas (`17d224`). No es resultado del CMS. El runner conservó la raíz sintética `owner-postgres-editorial-vGtAOR` al no probar cierre completo; consulta posterior no encontró procesos initdb/postgres (`089c82`). Sin limpieza manual ni cambios de seguridad del host.
- Repetición PostgreSQL 17.11: 26/26 (`77c9e8`, 39,68 s de Vitest, salida 0). Proceso y sesiones cerrados; clúster de esta repetición detenido y raíz eliminada por el runner. Credenciales ambientales ignoradas. No se ha eludido el fallo del primer intento aumentando tiempos o relajando controles.

No equivale a prueba visual, dispositivo físico o despliegue. No se modifica la web pública ni se declara cerrado el CMS de producción.
