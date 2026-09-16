# Orbe orgánico · prueba aislada

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
