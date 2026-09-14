# Comparación incremental autorizada · 14/09/2026

Manuel autoriza explícitamente publicar las correcciones verificadas del portfolio
y añadir una comparación con la versión pública actual conservando el checkpoint.
No autoriza desplegar el CMS ni contratar servicios por esta confirmación.

Referencia pública: `45a185591d73d2d8baf014b57ac29c2c9c6dde31`, publicación
documentada en docs/contact-navigation-2026-09-13.md. Sus manifiesto runtime y
lock son idénticos a los actuales. El alcance de esta referencia es la comparación
de dependencias, no afirmar identidad byte a byte del contenido público posterior.

El verificador acepta --public-reference=<SHA completo>; exige commit existente
y ancestro de la revisión verificada. No admite HEAD ni ramas mutables. Sin esa
opción mantiene exactamente el criterio histórico. La salida conserva las dos
comparaciones históricas aunque sean falsas y añade publicReference con las dos
comparaciones actuales. No cambia etiqueta, presupuesto de bundle, frontera,
privacidad owner, procedencia ni controles de frescura del build.

Al verificar evidencia guardada reutiliza su referencia y rechaza una opción
contradictoria. La selección de un commit no constituye por sí misma autorización:
debe acompañarse de un recibo como este, con revisión y alcance documentados.

Pruebas: RED dos casos nuevos fallan fda8d8; GREEN 10/10, incluidos los ocho
históricos, 012fcc; lint/diff e89d71. Artefacto fresco sobre b70154d más cambio del
verificador: build/TypeScript/29páginas 3b6f6e salida0. Ensayo real d5086c:
criterio histórico passed:false; comparación explícita passed:true;
provenance:true, frontera21 sin violaciones y bundle sin regresiones. Los 16
controles de títulos compilados pasan. Hash de entradas públicas:
38da22ae425f5b88f06a7d119b1889268c69048442be83f8d3c314f4024028bc.

```powershell
$env:PUBLIC_BUILD_DIR='owner-platform/.data/verification-artifacts/release-proof'
node scripts/prove-owner-isolation.mjs --public-reference=45a185591d73d2d8baf014b57ac29c2c9c6dde31
```

Tras nuevos commits hay que construir un artefacto fresco o usar el mecanismo
de evidencia guardada: no falsificar el marcador para hacer pasar un build viejo.

## Publicación: incidencia de acceso independiente

Integración Vercel devuelve404 al projectId de .vercel/project.json y solo lista
otros dos proyectos en ese equipo. Navegador Chrome solicita login Vercel; el
acceso GitHub también solicita login. No se cambian permisos ni se crea otro
proyecto. Se deja el login Vercel abierto para Manuel. No confundir aprobación
del verificador con despliegue real ni readiness productivo del CMS.

Hub autorización/reserva f7fbda9d. Preservados los cinco documentos compartidos
modificados y el checkpoint0f0adf6. Siguiente Codex: confirmar subida Git y recuperar
sesión de publicación; no se necesita otra autorización para el alcance ya aprobado.
