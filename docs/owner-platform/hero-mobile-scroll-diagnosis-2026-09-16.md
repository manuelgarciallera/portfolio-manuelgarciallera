# Diagnóstico de lag móvil del Hero

Manuel reporta ligero lag al desplazar con el dedo. Diagnóstico únicamente: no modificación del runtime ni publicación. Base c46d89d, producción H1 b9dc91e.

## Evidencia

`HeroOrbCanvas.tsx`: dibujo hasta30fps mientras haya intersección; no suspensión durante interacción/scroll. Canvas móvil384×347 observado. Cada fragmento ejecuta hasta64 pasos de distancia, con tres lóbulos/cinco gotas y evaluaciones extra de normales. Consulta getBoundingClientRect en cada dibujo. Header y casos usan listeners scroll pasivos; no se encontró secuestro del gesto táctil en Hero.

Comparación temporal en navegador aislado sobre dominio público, viewport390×712, No rastrear, orbe visible. Instrumentación de drawArrays exclusivamente en la página de diagnóstico; ninguna modificación del servidor. Solicitud CDP de gesto táctil no cambió scrollY (permaneció400): NO acredita reproducción de desplazamiento real. Sí permite comparar carga con misma vista:

| Condición | Intervalo RAF mediano | p95 | Frames >33,4ms |
| --- | --- | --- | --- |
| Normal | 50,1ms | 83,3ms | 34/36 |
| Omitir solo dibujo WebGL | 16,7ms | 16,8ms | 0/102 |
| Pausar animaciones CSS Hero | 50ms | 66,7ms | 29/37 |
| Volver a normal | 50ms | 66,7ms | 31/36 |

Renderer: ANGLE/Vulkan SwiftShader (software), no GPU física del teléfono. Estos números son intervalos RAF de laboratorio, NO FPS reales de scroll del usuario. A/B reversible apunta a cálculo del orbe como coste dominante en esta prueba. No confirma causa única del síntoma físico; CSS/filtros pueden contribuir en otro dispositivo.

## Siguiente propuesta, no implementada

Priorizar scroll móvil: congelar último fotograma del orbe durante gesto e inercia y reanudar suavemente al cesar desplazamiento; no interceptar eventos ni convertir listeners en bloqueantes. Medir nuevamente y probar en móvil físico antes de cerrar. Si persiste, estudiar complejidad/calidad adaptativa y coste de filtros de forma aislada. No añadir nuevas gotas hasta resolver el presupuesto móvil.

Referencia técnica: https://web.dev/articles/animations-guide — animaciones que repintan y desenfoques requieren perfilado, no asumir que CSS garantiza fluidez. Limitación explícita: no se ha medido batería ni dispositivo físico.
