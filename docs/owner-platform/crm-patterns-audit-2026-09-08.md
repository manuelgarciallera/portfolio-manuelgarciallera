# CMS: contraste con CRM y auditoría del checkpoint

Fecha: 2026-09-08. Base pública: `64d33a3e850479d423291912efb35b1119b927f9`.
Estado: auditoría parcial, no certificación de accesibilidad ni aprobación para producción.

## Evidencia nueva

- `npm run check:all`: salida 0. 223 unitarias, 13 guards, frontera de 21 entradas, encoding, hero, responsive, lint, tipos, build de 29 rutas, presupuesto de 10 rutas sin ampliar baseline y audit de dependencias productivas sin vulnerabilidades notificadas.
- Vitest independiente: 37 archivos, 223 pruebas, salida 0.
- Owner: 149 archivos, 974 pruebas unitarias, salida 0.
- Dashboard owner: fixture interactivo en 320/390/768/1280, claro y oscuro, ocho escenarios pasan. Esto no equivale a probar login, almacenamiento o publicación reales.
- Navegador integrado sobre build local: `/proceso`, menú móvil abierto y cierre con Escape correctos. Se observó la transición antes de estabilizarse; no se interpreta esa captura transitoria como solapamiento persistente.
- Barrido de recortes: salida 0, 11 rutas por 6 anchuras (320–1440). Detecta contenido mayoritariamente oculto, no toda colisión ni recortes menores; `/investigacion` no está incluido.
- Imágenes: captura móvil actual revisada sin superposición; se detectó espera de decodificación no acotada en el script. Se añadió plazo de 30 segundos y limpieza del temporizador. La siguiente ejecución falló al decodificar `human-ai.webp` mediante optimizador a 3840 px. La comprobación HTTP posterior devuelve 200 tanto para original (0,013 s) como para optimizado (0,156 s): fallo intermitente, causa no demostrada. No cambiar calidad o CSS para ocultarlo. ESLint del script: salida 0. Repetición en curso.

## Contraste de repositorios (lectura, sin importar código)

### Frappe CRM

Fuentes: [repositorio](https://github.com/frappe/crm), [MobileLayout.vue](https://github.com/frappe/crm/blob/develop/frontend/src/components/Layouts/MobileLayout.vue), [MobileSidebar.vue](https://github.com/frappe/crm/blob/develop/frontend/src/components/Mobile/MobileSidebar.vue).

El código consultado separa layout móvil, cabecera y sidebar. Su sidebar usa diálogo y overlay, y cierra al cambiar la ruta. El README describe vistas con filtros, orden y columnas. Aplicación propuesta: probar el retorno a la lista y cierre del menú al navegar, también con Atrás y al reseleccionar la página actual. No copiar Vue/Headless UI a nuestro React/Payload.

### Twenty

Fuente: [README y repositorio](https://github.com/twentyhq/twenty).

Presenta objetos, campos y vistas definidos por código y versionados; stack React/TypeScript con backend y servicios propios. Aplicación propuesta: conservar esquemas tipados y separar configuración de presentación del contenido. No adoptar todo su stack para añadir una función al CMS. Esta lectura no verifica su usabilidad móvil ni sus tiempos de carga.

### EspoCRM

Fuente: [README y repositorio](https://github.com/espocrm/espocrm).

Describe frontend SPA, API REST, metadatos mediante JSON Schema y entidades/campos personalizables. Aplicación propuesta: futura integración mediante contratos API, no compartir tablas internas entre CMS y CRM. Su licencia declarada es AGPLv3; no se ha incorporado código. Una integración comercial o reutilización exige revisar la licencia concreta y el alcance antes de adoptarla.

## Lo que ya existe en nuestro CMS

`OwnerNavigationAccessibility.tsx` completa el menú Payload: diálogo móvil, Escape, contención y devolución de foco, fondo inert y restauración del scroll. `owner-shell.css` evita que las migas de pan empujen la cuenta fuera de pantalla. El dashboard ya tiene búsqueda y acciones de contenido probadas en ambas apariencias.

No tiene sentido añadir otro sistema de navegación por similitud con un CRM. La mejora debe responder a una carencia reproducida.

## Siguiente trabajo concreto, por orden

1. Completar barrido público y guardar evidencia de recortes/solapamientos antes de retocar CSS.
2. Verificar owner real: login → listado → editar borrador → guardar → recargar → recuperar versión. Móvil: teclado virtual, acciones alcanzables y pérdida de conexión. Desktop: teclado, foco y cambios sin guardar.
3. Contrastar cierre de menú con cambio de ruta, Atrás y selección de ruta actual contra el comportamiento real de Payload antes de añadir otro efecto.
4. Resolver almacenamiento durable y restauración ensayada siguiendo `media-cutover-trust-protocol-2026-09-08.md`; las pruebas con clones no habilitan un cutover real.
5. Solo después: filtros/vistas persistentes si el listado de contenido lo necesita. En móvil, priorizar búsqueda y acciones por registro; una tabla desplazable puede seguir siendo adecuada para comparación, no ocultar columnas sin acceso alternativo.

## Límites

No se han modificado diseño, dependencias, DNS, correo o producción en esta auditoría. No se ha instalado ningún CRM. Consultar repositorios no demuestra que sean superiores ni que nuestro CMS esté listo para venderse. Pendientes: pruebas de usuario, lector de pantalla, zoom, recorridos autenticados reales, rendimiento aislado y verificación de producción.

## Cierre de este tramo

La repetición de imágenes vuelve a fallar. Diagnóstico añadido: `human-ai.webp`, `currentSrc` vacío, `complete=false`, `naturalWidth=0`, top242px en viewport1100px. La URL de `src` es un fallback de Next, **no demuestra que el navegador haya solicitado la variante3840**. El fallo queda acotado a activación/carga diferida del escenario automatizado; no atribuirlo al optimizador sin evidencia de red. Primera ejecución interrumpida por espera no acotada; tres ejecuciones acotadas fallan. No hay verde global de imágenes.

Captura nueva aceptada: `tmp/process-images/390.png`, imagen a ancho de columna, proporción y separación de número/título correctas en el punto mostrado. Las capturas antiguas768/1440 no se usan como evidencia de esta ejecución.

Hub: inicio `88e30c24-4231-458c-b1a9-6b91a820b3be`, resultado parcial `b09dbc9d-982f-4f11-9aea-91c2f8c731b4`. Enviado no significa aceptado por Claude. Próximo responsable Codex: reproducir con scroll manual e instrumentación de peticiones la sexta imagen antes de modificar su carga o cerrar la auditoría; luego recorridos owner reales. No se han añadido nuevas funciones CMS en este tramo.

Contraste adicional: en el navegador integrado, navegar hasta el título Verificación carga la última imagen (`complete=true`, `naturalWidth=911`, variante1200). El test se ha aislado a una página nueva por anchura; aun así vuelve a fallar con `currentSrc` vacío. Descartada la explicación de reutilización de scroll como solución suficiente. Pendiente caracterizar activación de lazy loading en Chromium headless y registrar peticiones; no se declara defecto público resuelto ni prueba de imágenes aprobada.
