# Entrega nocturna · 17 septiembre 2026

Informe único para Manuel al terminar la ventana de08:50 Europe/Madrid. En curso: no es un informe final ni acredita ocho horas continuas de trabajo.

## Confirmado antes de continuar CMS

- Público `4cd3aac`, producción `dpl_94PR7oS9dTa3PSVuXJG3iDoVgU1Z`, dominio original verificado. Nombre móvil Manuel / García-Llera Añón, mayor; fondo inferior ampliado sin recortar la sección blanca.
- Pruebas LIVE de pulsación sostenida, toque nativo emulado, release/cancel/blur y scroll390/1280 pasan. Layout320/390/430/767 pasa; CI y274unitarias correctas. Recibo: `hero-held-touch-2026-09-17.md`.
- Falta distinguir coste GPU del orbe de congelación funcional. Se añade diagnóstico A/B `scripts/measure-orb-frame-cost.mjs`; nunca interpretar software Chromium como FPS o batería del teléfono físico.
- Automatización existente activa hasta08:50; objetivo app continúa pausado, no hay API de reanudación. Seguimientos en esta misma tarea; sin ejecución continua garantizada.

## Orden de trabajo

1. Registrar medición de carga actual y resolver fallos reproducibles sin volver a congelar el orbe durante contacto/scroll. No volver a reducir el nombre a una línea.
2. Revisar estado real CMS y pendientes actuales, no ejecutar de nuevo auditorías históricas completas por rutina. Prioridad: recorrido editar → ordenar → deshacer → guardar → reabrir → previsualizar → revisar/restaurar, con lenguaje comprensible y móvil usable.
3. Investigación diferencial de interfaces CMS con fuentes primarias fechadas; conservar lo que sirva a una tarea concreta, no rediseñar por tendencias. Consultar primero HALLAZGOS y recibos existentes.
4. Recuperar CMS-LAYOUT-01 y CMS-VISUAL-01 de `visual-effects-backlog-2026-09-16.md`. Cruceta con paso exacto visible/editable en el centro y movimiento continuo; alternativas teclado, imanes y deshacer. Presets de efectos con límites de contraste/movimiento/rendimiento. Son solicitudes, no capacidades terminadas por documentarlas.
5. Commits recuperables con pruebas y recibos. No publicar CMS, crear infraestructura ni contratar servicios. Si una tarea requiere decisión nueva, apuntarla aquí y avanzar otra segura.

## Preguntas para mañana · consolidar, no repetir durante la noche

- Revisión física del orbe: ¿mantiene fluidez en tu navegador al mantener el dedo y desplazar? Las pruebas emuladas no sustituyen tu teléfono. No se requiere respuesta para continuar trabajo CMS aislado.
- Recuperación sin correo: existe propuesta anterior, no un bypass implementado. Si sigue siendo necesaria tras inspección actual, presentar una única decisión de seguridad y alternativas antes de desarrollar una vía privilegiada (ver `night-window-checkpoint-2026-09-13.md`).
- Infraestructura/servicios: añadir solo decisiones concretas que bloqueen un hito verificado, con coste y alcance. No pedir claves por chat ni repetir autorizaciones ya concedidas.

## Resultados de esta noche

### Diagnóstico inicial · coste del orbe, no aprobado todavía

LIVE A/B reversible `measure-orb-frame-cost.mjs`, salida `d0bf33`, canvas384×384, Chromium SwiftShader/Vulkan software. Tres ventanas2,5s: normal mediana100ms/p95116,7ms (27muestras,26>33,4ms); omitir únicamente drawArrays del orbe16,7/16,7ms (151muestras,0>33,4ms); restaurar normal100/116,7ms (27muestras,26>33,4ms). Se restaura el dibujo y se cierra el navegador de diagnóstico; producción intacta.

Conclusión limitada: coste de cálculo del shader dominante en este laboratorio. NO demuestra100ms en el teléfono físico; NO permite afirmar ausencia de lag ni pasar el gate de rendimiento. Siguiente: optimización aislada medible con comparación de borde/calidad, contacto sostenido, scroll y presupuesto. No volver a la pausa al hacer scroll ni al impulso que termina mientras se mantiene pulsado. El CMS no debe declararse iniciado/completado por este diagnóstico.

Actualizar esta sección con cada hito material: commit, prueba y resultado, limitación, pendiente y responsable. Investigación y propuestas deben quedar separadas de implementación y publicación.

### Investigación 3D/CMS y experimento descartado

Ver `interactive-3d-and-cms-research-2026-09-17.md`: fuentes primarias, criterios táctiles/carga y contraste con editor existente. Precálculo shader preservó píxeles pero empeoró 34 % en SwiftShader; revertido, no publicado. Comparador reutilizable con gate explícito `--require-improvement`. CMS: 57 pruebas focales pasan (`a73a7b`); todavía no nueva interfaz ni validación con principiantes. Siguiente incremento: comunicar/restaurar herencia responsive en encuadre existente antes de abrir un motor libre. Investigación no sustituye implementación.

### Siguiente corrección de coste principal

`hero-orb-layout-cost-2026-09-17.md`: 12 lecturas de layout por 12 dibujos en producción; caché invalidada por ResizeObserver elimina esas lecturas en pruebas locales390/1280 y conserva redimensionado. No modifica shader ni calidad, no demuestra mejora GPU ni FPS físico. Estado de publicación y pruebas finales en ese recibo.

Runtime actualizado `11b2532`, subido y publicado en producción `dpl_CCMdh5LKN8bpidGS1Abj9gyZ7wsj`, READY/alias original. CI web+owner SUCCESS; LIVE caché/resize390/1280 PASS. No regresión de presupuesto. La prueba física de fluidez sigue pendiente, pero el trabajo CMS aislado no requiere acceso al teléfono ni una nueva clave; no confundir esta continuación con aprobar métricas GPU físicas.

Para el siguiente incremento CMS, revisar además `MediaPlacements.ts`: el hook combina excepciones anteriores con las entrantes. Al implementar «volver al valor heredado», probar guardado/reapertura en base real para asegurar que una excepción borrada no se reconstruye por combinación parcial. No basta con probar el selector o el adaptador de preview.
