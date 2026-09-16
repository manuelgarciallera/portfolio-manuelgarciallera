# Orbe orgánico · prueba aislada

## Estado actualizado · integración y ondas de color

La versión azul aprobada se integra en el portfolio en `9541b07`, después de preservar el prototipo en `095e2ba`. Las notas históricas de aprobación pendiente de abajo corresponden a la etapa anterior.

Este laboratorio incorpora ahora el botón **Ondas de color / Azul original**. El azul es el valor inicial; `?palette=waves` abre directamente la nueva variante. Corrientes espaciales desfasadas mezclan azul/cian con violeta y un acento rosáceo limitado al 22%, sin modificar contorno, gotas ni flotación. No es un cambio uniforme de tono de toda la esfera. La variante sigue aislada de producción para revisión.

La prueba automatizada confirma diferencia de pigmento, retorno exacto al azul en el mismo fotograma, estabilidad con movimiento reducido y animación/pausa de la variante. Ambas paletas y temas se capturan en 390/900. No equivale a una prueba de batería en móvil físico.

Prototipo visual solicitado por Manuel el 16/09/2026. Abrir `index.html` en un navegador con WebGL; no necesita servidor, cuenta, red, librerías externas ni analítica. No está importado por Next ni publicado como ruta del portfolio.

Explora volumen deformable, giro lento alrededor de Z, flotación, corrientes internas independientes y colores azul/cian/violeta. El shader genera una **apariencia** líquida; no calcula física de fluidos ni transmisión óptica real. No sustituye la implementación pública todavía.

Controles: tema claro/oscuro y pausar/reanudar. El modo de movimiento reducido empieza quieto; se suspende el ciclo de dibujo al ocultar la pestaña. Resolución limitada a1,25 DPR, hasta600×600px; esto es un límite del prototipo, no una garantía de rendimiento móvil.

Verificación reproducible: `node scripts/verify-organic-orb-prototype.mjs`. Cubre shaders sin errores, cambios reales de imagen por tema y movimiento, pausa estable, movimiento reducido y ausencia de overflow en390/900px. Capturas en `.audit/organic-orb/`.

Antes de integrar:

1. Manuel compara la dirección estética con las referencias y con el candidato histórico `src/features/portfolio/three/HeroOrbCanvas.jsx`. No hay certeza de que ese archivo sea exactamente el ente recordado.
2. Afinar vidrio y profundidad: ahora prima el pigmento y las bandas; aún no reproduce el detalle de las imágenes de referencia.
3. Medir coste GPU, fluidez y batería en móvil físico, no solo navegador de escritorio; comparar con el canvas actual.
4. Decidir integración en la escena existente y alternativa estática accesible; validar fondo transparente y ambas composiciones responsive.
5. Verificar presupuesto, movimiento reducido, limpieza de recursos/contexto y publicar solo tras aprobación estética.

Estado: prueba local funcional, no elemento de producción ni motor reutilizable del CMS.

## Iteración · líquido emergente y gotas (16/09/2026)

Manuel aprueba tres salidas suaves de líquido que se estiran y vuelven a fusionarse con el cuerpo. Cinco gotas pequeñas siguen ciclos desfasados de separación y retorno; algunas están dentro del cuerpo en cada instante, no son cinco partículas visibles permanentemente. Las corrientes internas se han acelerado moderadamente, conservando giro lento y flotación.

Se amplía ligeramente el campo de visión del prototipo para dejar margen a las gotas; no cambia el tamaño ni la geometría del hero público. Capturas390/900 claro/oscuro inspeccionadas; sin recorte. La prueba comprueba también componentes pequeños separados en la imagen renderizada, no solo la presencia de código de partículas.

Servidor local de revisión: `http://127.0.0.1:3017/`, contenido actualizado al recargar. Limitado a loopback y a esta página; no accesible desde móvil remoto. Sigue pendiente aprobación visual y medida de rendimiento físico antes de cualquier integración pública.
