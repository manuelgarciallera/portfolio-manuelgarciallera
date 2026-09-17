# CMS · efectos visuales configurables pendientes

Fecha: 16/09/2026. Solicitud explícita de Manuel. Identificador: **CMS-VISUAL-01**.

**Estado: incorporado al backlog para desarrollo posterior; NO implementado en el CMS.**
No iniciar ahora ni interrumpir las mejoras actuales del portfolio. Al retomar el CMS, recuperar esta ficha y encajar su ejecución en la hoja de ruta, conservando las prioridades de fiabilidad y operación editorial del [ecosistema](../../00_Coordinacion_IA/docs/ECOSISTEMA.md). Sin fecha comprometida ni nueva automatización.

## Objetivo

Permitir aplicar y ajustar los efectos probados en el portfolio desde el editor, sin tocar código, como capacidad reutilizable en futuros productos digitales.

## Alcance solicitado

| Familia | Controles previstos |
| --- | --- |
| Halo y sombras | Colores, intensidad y difusión |
| Bordes | Degradado, grosor y giro |
| Texto | Barrido de color, dirección, duración e intervalo |
| Hover | Cristal y reflejos |

- Previsualización desktop/móvil y en los temas claro/oscuro.
- Presets iniciales: «Neón sutil», «Cristal» y «Barrido diagonal».
- Aplicar, ajustar y desactivar los efectos sin editar CSS o JavaScript.
- Mantener límites de contraste, rendimiento y respeto a movimiento reducido.

## Criterios para darlo por terminado

1. Un usuario del CMS puede seleccionar un preset, editar sus valores y ver el resultado antes de publicar.
2. Los ajustes persisten en el documento editorial y se recuperan al reabrirlo; previsualización y publicación reproducen la misma configuración.
3. Se puede desactivar/restaurar el efecto sin perder texto, enlace, foco ni geometría del componente.
4. Valores validados y acotados: no introducir ejecución arbitraria de CSS/JS. Definir rangos concretos durante el diseño técnico, no dar por aprobada cualquier combinación.
5. Verificar contraste de texto/foco, movimiento reducido, interacción táctil/ratón y presupuesto de carga antes de publicar.
6. Halo que siga el contorno real del componente: cápsula con tramos rectos, no una elipse aproximada. Comprobar el primer fotograma del barrido, no solo que exista una animación.

## Evidencia reutilizable al retomarlo

El portfolio sí contiene implementaciones, pero todavía no controles editoriales para ellas:

- [Corrección cápsula e inicio H1](hero-capsule-fix-2026-09-16.md), runtime `f3d62f3`.
- [CTA neón y cristal](hero-cta-neon-glass-2026-09-16.md).
- [Barrido diagonal](hero-diagonal-sweep-2026-09-16.md).
- Fuentes: `src/features/redesign/components/Hero.tsx`, `src/features/redesign/redesign.css`.
- Pruebas existentes: `scripts/verify-hero-cta-border.mjs`, `scripts/verify-hero-type-sweep.mjs`.

Revisar la versión vigente al retomarlo; estas referencias no fijan para siempre valores o arquitectura. Diseñar después el esquema de configuración, su integración con el editor y la previsualización/publicación. No se ha implementado ni verificado ese recorrido CMS por guardar esta ficha.

Siguiente responsable: Codex al reanudar el trabajo del CMS con Manuel. Entrega documental, no cambio de producción.

## CMS-LAYOUT-01 · colocación visual accesible

Solicitud posterior de Manuel (16/09/2026): pulir la usabilidad del CMS para personas no iniciadas, con arrastre de cajas, cruceta en móvil y desktop y ajuste imantado a márgenes o layout. **Registrado para diseño/prueba posterior; no implementado ni validado con usuarios.**

- Arrastrar para reordenar y mover bloques, con destino y contorno visibles antes de soltar.
- Cruceta de desplazamiento al seleccionar un elemento; ofrecer también teclado y comandos «Mover antes/después». Ninguna operación dependerá exclusivamente del arrastre.
- **Paso exacto solicitado por Manuel:** el centro de la cruceta muestra el número de píxeles de cada movimiento y permite introducir un valor exacto. Ofrecer además un modo continuo para desplazarse más rápido mientras se mantiene pulsada una dirección. Son dos modos explícitos, no una aceleración oculta. Este detalle se conserva como requisito pendiente; no existe todavía el control.
- Propuesta de modo inicial: layout guiado, con ajuste a columnas, márgenes y separaciones. Modo libre opcional dentro de una caja delimitada, no coordenadas absolutas indiscriminadas que rompan móvil.
- En móvil, separar selección, arrastre y scroll; controles táctiles claros y sin tapar el contenido. Mostrar posición y guías mientras se mueve, sin requerir precisión fina.
- Deshacer/rehacer, cancelar movimiento, restaurar alineación y previsualizar cada anchura antes de publicar.
- Separar orden de lectura y posición visual: comprobar teclado, foco, lectores de pantalla, solapamientos y contenido que crece.
- Los ajustes responsive deben heredarse de forma comprensible, con excepciones por formato explícitas; un cambio desktop no alterará móvil silenciosamente.
- Cierre exigido: crear, mover, alinear, deshacer, guardar, reabrir, previsualizar y publicar con resultado coherente en táctil y ratón/teclado. Probar con personas no iniciadas antes de afirmar usabilidad validada.

Diseñar sobre el editor existente al retomar CMS, sin abrir otro motor de layout ni importar librerías por anticipado. Pendientes: inspección de capacidades actuales, prototipo de interacción y aprobación de reglas antes de implementación.
