# Portada NudeProject a sangre y pulso común de marco

Petición directa de Manuel: eliminar los filos claros de la portada, probar un
neón sutil al cambiar imágenes y publicar tras comprobarlo. Base `3afdca2`.
Checkpoint local `checkpoint/pre-project-frame-effects-2026-09-08` apunta a esa
base; no constituye todavía un respaldo remoto. Checkpoint pre-editor intacto.

## Cambio acotado

- Foto original y logo intactos. Se elimina la inclinación sobre cartulina y se
  usa un pequeño margen de seguridad fuera del marco con desplazamiento/zoom leve.
- Carrusel compartido: pulso interior de 1,4 segundos al entrar cada vista, con
  `--accent` del sistema. Misma regla para todos los proyectos, sin paletas nuevas,
  flashes continuos o dependencias. Solo se anima opacidad; la sombra es estática.
- El pseudo-elemento no captura eventos y desaparece al terminar. Movimiento
  reducido desactiva el pulso. No cambia autoplay, gestos, controles ni contenidos.
- No afecta a imágenes documentales `contain`, donde recortar ocultaría evidencia.
  Tampoco modifica el rail independiente de la galería editorial.

## Evidencia y límites

`node scripts/check-project-frame-effects.mjs`: RED con 16 posiciones de foto
descubiertas y 4 pulsos ausentes; GREEN tras el CSS. Prueba estilos reales en
Chromium, cuatro anchos y cuatro puntos del ciclo. Comprueba que solo la vista
activa tiene pulso, una repetición, sin interceptar eventos, y sin movimiento al
solicitar reducción. No es un test de React ni del recorrido entero.

Vitest focal: 13/13, dos archivos, salida0. Revisión independiente estática sin
Critical/Important; observación menor corregida: inmovilizar autoplay con la
preferencia reducida antes de capturar la portada y comprobar `data-frame=cover`.

`node scripts/check-project-frame-page.mjs`: servidor local 3014, ruta `/casos`,
390/768/1440; cover cargada, control siguiente, pulso, reducción de movimiento,
sin overflow de documento ni errores JS. Primera ejecución completa salida0.
Capturas privadas en `tmp/project-frame-check/`. Inspección visual móvil: foto a
sangre y logo legible. Captura del pulso se mejora congelando solo su animación
decorativa en el pico, porque una captura que espera estabilidad lo pierde.
Repetición final sesión98945 salida0 en los tres anchos: se espera que la portada
avance antes de usar el botón visible, sin click forzado; se comprueba cambio real
de src. Una sonda intermedia de click forzado desde cover agotó tiempo y queda
descartada como evidencia funcional. Lint focal salida0.

La primera sonda de `/` agotó networkidle durante compilación dev y posteriores
sondas agotaron espera de imagen lazy. No se presentan como resultados verdes ni
como regresión probada: `/casos` carga la misma pieza y sí pasó. Falta repetir la
portada completa sobre build estable antes de publicar. No confundir tiempos de
compilación local con métricas de producción.

## Publicación pendiente por concurrencia

Durante la tarea aparecieron modificaciones ajenas en `redesign.css`,
`responsive.css` y `redesign-responsive.unit.test.ts`. Se preservan sin incluirlas
en este commit. Reserva/relevo solicitado a Claude por Hub `9acebb45-58c3-4207-af48-e745098bde03`
y aviso de concurrencia `0d95693f-5844-4858-81c6-17d0b3e1dc21`. Sin respuesta observada
al documentar, no se infiere aceptación. No modificar navbar, orbe, correo ni CMS.
Claude cerró sus tres archivos en `75bffa8`, inspeccionado sin solape con este
delta. Se solicita confirmación de ventana mediante `50411fef-8ddb-442d-bb02-1a430c39ed9f`.

Próximo: recibir SHA cerrado/relevo de Claude, integrar sin solape, ejecutar
`check:all` y Vitest independiente sobre el HEAD final, comparar bundle sin subir
baseline, repetir navegador sobre build y solo entonces push/despliegue autorizado.
No se ha ejecutado esta puerta completa sobre el árbol concurrente, no hay push,
promoción o ID nuevo de despliegue que atribuir a este cambio.
