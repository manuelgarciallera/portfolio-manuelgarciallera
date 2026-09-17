# Dos entes líquidos · prueba desechable

Solicitud aprobada por Manuel: solo móvil, azul delante y orbe naranja/amarillo1,6× detrás, arriba/derecha; misma sustancia, gotas y reloj propios, sin conexión. No modifica `src` ni `public`, no está publicado. Base pública fc2d29e conservada.

Ejecutar build existente en3020 y `node experiments/mobile-dual-orb/server.mjs`. Abrir `http://127.0.0.1:3032` en formato móvil. Botón «Comparar» alterna dos orbes/solo azul. Servidor solo loopback/GET/HEAD, sin proxy de cookies ni API; etiquetas noindex/no-store. La paleta cálida se deriva del shader vigente, manteniendo la misma geometría/corrientes.

El segundo canvas del experimento usa320px/15dibujos por segundo, movimiento lento con fase independiente. No captura eventos y se detiene fuera de vista/pestaña o con movimiento reducido (imagen WebGL estática). El azul no se modifica. No hay aún fallback sin WebGL específico del segundo orbe: es laboratorio, no integración final.

Prueba `verify.mjs`: encaje390sin overflow, proporción/posición, comparación, animación, movimiento reducido y exclusión1280. Fallos previos: inserción antes de hidratación y contenedor sin positionrelative; corregidos. GREENcd7ae8. Captura inspeccionada. `cost.mjs` compara ambas composiciones en software; no acredita rendimiento móvil físico. No publicar sin decidir calidad/coste y completar fallback/accesibilidad/ciclo de vida de la implementación real.

Próximo: Manuel revisar composición. Si no convence, descartar experimento; la web sigue exactamente con un orbe. Una futura conexión entre entes u otra sustancia queda fuera de esta prueba.

Coste observado418052: A/B/A2s en Chromium software, medianas dos166,7ms/uno100,1ms/dos166,7ms; p95183,4/116,7/183,4. Aumento material en este entorno, no se aprueba publicar este segundo renderer. Antes de integrar: reducir coste mediante render compartido o representación precalculada ensayada sin degradar el azul, y comprobar teléfono físico. Resultado visual disponible en `.audit/mobile-dual-orb/two-clean.png`; captura sin botón de laboratorio.
