# Corrección contorno cápsula e inicio H1

16/09/2026 · Codex · base7cc07f0 · corrección solicitada por Manuel con captura.

Causa: la máscara radial elíptica del halo no seguía los segmentos rectos de la cápsula. Solución: span decorativo aria-hidden, sin eventos ni estado; pseudoelemento interior en cápsula hueca y blur5px en su envoltorio. Radio heredado, inset-1px y halo75%. Giro sincronizado, hover cristal, foco, navegación y dimensiones conservados. El blur se aplica después de formar el contorno. No elipse ni texto duplicado.

H1: color desde posición60% en ambos ejes (antes80%); barrido diagonal termina a800ms, ciclo20s intacto. Sin cambios de tamaño ni layout. Movimiento reducido desactiva los giros y el barrido.

RED CTA69ae62 y H12836f9; GREEN cuatro combinaciones CTA y cuatro barrido e0d32a. Captura móvil de cápsula revisada visualmente. Build30/tipos2607cf; lint Hero/pruebas y estructura b60c92. Presupuesto a867f9 PASS:138731 B raw/50613 B gzip, +68/+15 frente a138663/50598, por una capa HTML decorativa; mejora de fidelidad sin nueva dependencia ni lógica JS. Cambios compartidos ajenos preservados.

Reserva Hub bd0f4891-2fe6-4531-9306-65af85fd6ad3. Publicación pendiente al crear el recibo. Efectos configurables del CMS siguen siendo propuesta independiente, no implementados por esta corrección pública.
