# Hero HTML y consentimiento compacto — 16/09/2026

## Implementado por petición expresa de Manuel

- Nombre del hero como HTML seleccionable y accesible, tres líneas sin partir García-Llera. Eliminada la textura CanvasTexture del nombre; esfera y materiales preservados. Nombre independiente de carga/fallo de WebGL.
- Aviso inferior a todo el ancho, distribución horizontal en desktop y compacta adaptable en móvil. Detalles siguen desplegables; botones con igual contraste, tamaño táctil mínimo de 44 px y adaptación a texto ampliado.
- Clic fuera oculta sin almacenar elección ni activar proveedores; no roba el foco. Cerrar/Escape y reabrir conservados. Una señal de privacidad mantiene aceptar deshabilitado, con explicación y texto legible.
- Enlace de privacidad ahora integrado en el párrafo; la prueba anterior de 44 px para ese enlace independiente se sustituye por visibilidad y destino. Se conserva el requisito táctil de los botones. La prueba de texto ampliado comprueba ausencia de recortes, no obliga a apilar cuando ambas opciones caben.

## Verificación

- RED del aviso: límite de altura incumplido antes del cambio (7cd976).
- RED del hero: faltaba nombre HTML accesible fuera del fallback (683502).
- 279 pruebas unitarias / 43 archivos: PASS, salida b3ac9f y terminal 519e50.
- Typecheck PASS; lint completo detectó únicamente import useEffect sin uso, eliminado. Lint focal posterior sin advertencias y frontera pública 22 entradas PASS (683d36).
- Consentimiento aislado, proveedores sintéticos: PASS 320/390/768/1440, selección individual, rechazo persistido, revocación, privacidad, errores de almacenamiento, cierre exterior sin SDK ni elección guardada (be4ba4).
- Hero en build de producción servido localmente: PASS 8 combinaciones (4 anchos x 2 temas), WebGL listo, selección de nombre completo, tres líneas, sin recorte ni aria-hidden (6f3d28). Capturas revisadas, incluyendo móvil claro sin aviso superpuesto.
- Consentimiento integrado en servidor de desarrollo: PASS 24 escenarios, 320–1920 px, vertical/horizontal, ambos temas, texto 200 %, teclado, sin rastreo (7fbda9).
- Build de producción final aislado: 30 páginas, TypeScript y compilación PASS (ef9b37). No se sustituyó el servidor de desarrollo del usuario.

Capturas locales no versionadas: `.audit/hero-html-2026-09-16`, `.audit/analytics-consent-2026-09-16`, `.audit/analytics-consent-responsive`.

## Pendiente de publicación: presupuesto, no funcionalidad

Build final medido con `createBundleSnapshot` y `assertFreshBuild` contra la baseline sin modificar:

- Home: 138.318 B raw / 50.545 B gzip; dentro del presupuesto histórico (211.578 / 71.340).
- Privacidad: 74.344 B raw / 26.042 B gzip. Baseline 71.888 / 25.223; delta +2.456 raw, supera por **408 B** la tolerancia raw de 2.048. Gzip dentro del límite.
- Respecto al último recibo publicado (73.928 / 25.891), el incremento de privacidad es 416 B raw / 151 B gzip.

La guarda de tamaño NO está verde. No se relaja la baseline ni se declara publicación. Siguiente: Codex resolver el margen de privacidad, volver a validar artefacto final y preparar publicación; no hacen falta credenciales nuevas para este cambio local. No prueba física en teléfono ni certificación legal.

Base de trabajo `e25a5b639d556af1bf7ed1042046ef1ed2d02de2` más los cambios de este recibo. Relevo explícito previo de Claude `89a14ab3-c0e9-4335-b4e1-80d2004ffdf4`, comunicado como procesado en `232cf06c-2211-4bdc-8886-aefe1f6dcda7`. Checkpoint y archivos ajenos preservados.
