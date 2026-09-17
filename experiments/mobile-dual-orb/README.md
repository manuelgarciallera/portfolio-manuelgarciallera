# Dos entes líquidos · prueba desechable

## Optimización sin reducción de detalle (17/09)

Base010ee39. El canvas conserva320×320 y el shader original, pero usa scissor para omitir los fragmentos fuera del viewport. Un píxel de guarda protege el filtrado. Se limpia antes del recorte para evitar rastros; movimiento reducido repinta al desplazar sin avanzar el reloj. No se añade dependencia ni se modifica el azul. Regresión final: conexiónc12f09 y composición390/1280/reduced5a4cd2 PASS.

`clipping.test.mjs`: RED2be1df por ausencia de recorte → GREENd53655, caja158×312, 19694 píxeles con alfa, cero diferencias de canales visibles, cero errores WebGL y contexto válido. Se descartó una primera prueba débil sobre canvas aún sin inicializar y un cronometraje gl.finish sin resolución útil; no cuentan como evidencia. `cost.mjs --compare-clip` f44ede, secuencial misma página: full166,7/clipped150/blue116,6/clipped133,5/full183,3ms de mediana. Son ventanas cortas en Chromium software, no FPS de teléfono; mejora observada pero dos orbes siguen más caros que uno. No aprobación de producción. Siguiente: validar en Firefox Android físico y completar fallback/lifecycle de una futura integración.

## Evolución aprobada: formación y conexión (17/09)

Manuel aprueba la composición de946631e y añade formación al bajar, pocas gotas azules transferidas y brillo degradado al absorber. `scene.mjs` mantiene el renderer azul intacto: el cálido aparece por progreso de scroll pasivo (escala/opacidad); dos elementos decorativos reutilizados recorren arcos espaciados, sin capturar eventos. Llegadas activan un uniforme del shader cálido, sin canvas adicional ni blur. Movimiento reducido elimina transferencias y brillo; comparación, fuera de vista y pestaña oculta detienen el ciclo. Al volver arriba el cálido desaparece. La unión es una ilusión visual de laboratorio, no simulación física de transferencia de masa.

Pruebas: `connection.test.mjs` RED9d393d (naranja visible al entrar) → GREEN016592, incluyendo uniforme real de absorción, retorno arriba y reduced motion. `verify.mjs` GREENc90421 a390/1280, sin overflow ni errores. Captura connected.png inspeccionada. Coste ea718e A/B/A Chromium software: medianas183,3/100/183,3ms; primera muestra p95516,6ms, posible interferencia del final de otra prueba. No se interpreta como benchmark móvil ni mejora; sigue sin aprobar publicación. Panel3032 solicitado (encolado). Base946631e recuperable; ningún src/public ni despliegue.

Solicitud aprobada por Manuel: solo móvil, azul delante y orbe naranja/amarillo1,6× detrás, arriba/derecha; misma sustancia, gotas y reloj propios, sin conexión. No modifica `src` ni `public`, no está publicado. Base pública fc2d29e conservada.

Ejecutar build existente en3020 y `node experiments/mobile-dual-orb/server.mjs`. Abrir `http://127.0.0.1:3032` en formato móvil. Botón «Comparar» alterna dos orbes/solo azul. Servidor solo loopback/GET/HEAD, sin proxy de cookies ni API; etiquetas noindex/no-store. La paleta cálida se deriva del shader vigente, manteniendo la misma geometría/corrientes.

El segundo canvas del experimento usa320px/15dibujos por segundo, movimiento lento con fase independiente. No captura eventos y se detiene fuera de vista/pestaña o con movimiento reducido (imagen WebGL estática). El azul no se modifica. No hay aún fallback sin WebGL específico del segundo orbe: es laboratorio, no integración final.

Prueba `verify.mjs`: encaje390sin overflow, proporción/posición, comparación, animación, movimiento reducido y exclusión1280. Fallos previos: inserción antes de hidratación y contenedor sin positionrelative; corregidos. GREENcd7ae8. Captura inspeccionada. `cost.mjs` compara ambas composiciones en software; no acredita rendimiento móvil físico. No publicar sin decidir calidad/coste y completar fallback/accesibilidad/ciclo de vida de la implementación real.

Próximo: Manuel revisar composición. Si no convence, descartar experimento; la web sigue exactamente con un orbe. Una futura conexión entre entes u otra sustancia queda fuera de esta prueba.

Coste observado418052: A/B/A2s en Chromium software, medianas dos166,7ms/uno100,1ms/dos166,7ms; p95183,4/116,7/183,4. Aumento material en este entorno, no se aprueba publicar este segundo renderer. Antes de integrar: reducir coste mediante render compartido o representación precalculada ensayada sin degradar el azul, y comprobar teléfono físico. Resultado visual disponible en `.audit/mobile-dual-orb/two-clean.png`; captura sin botón de laboratorio.
