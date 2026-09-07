# Auditoría independiente del carril público antes del CMS

Fecha: 2026-09-07. Codex. Base inicial `b89f1e9`; revisión y pruebas sobre `a3667598869d77379f87b5227eaa79bd938e80ab`, que incorpora durante el turno la corrección de frontera de Claude. Sin modificaciones de runtime público/owner, dependencias, baseline, DNS, correo real o despliegue.

## Dictamen

No aprobar todavía la publicación como «todo verificado». Hay avances comprobados en aislamiento, dependencias, compilación y recuperación del formulario. Persisten un control de carga fallido, un recorte visual reproducido y metadatos de investigación incoherentes. La ruta nueva aún no está publicada. Separar defectos introducidos, deuda anterior y pasos operativos pendientes.

## Hallazgos priorizados

### 1. P1 · El recorrido visual de Coordination Hub altera y recorta su diagrama interno

- Localización: `src/features/redesign/redesign.css:1805`, reglas `.rd-visual-journey figure`, `figure>div` y `figcaption`; composición en `src/features/redesign/case/CaseVisualJourney.tsx` y `components/CoordinationDiagram.tsx`.
- El recorrido contiene figuras y el diagrama vuelve a ser un `figure`. Los selectores descendientes del recorrido también aplican su composición de dos columnas, tamaños y recortes a la figura interior y a sus divisiones. A 768 px, el esquema deja de ser una secuencia vertical: agentes y resultado aparecen en columnas estrechas y el texto de Codex queda oculto. No es el sangrado decorativo de una miniatura.
- `node scripts/check-layout-overflow.mjs http://127.0.0.1:3024`: **salida 1**, 60 combinaciones (10 rutas × 6 anchos); 16 detecciones, ocho a 320 px y ocho a 768 px, todas en Coordination Hub. Son nodos de texto repetidos en varias figuras, no 16 defectos independientes.
- Confirmación visual tras desplazar la página al diagrama interior (índice 4): captura `.audit/claude-coordination-clipped-768.png`. La primera figura del carrusel no reproducía el problema; se identificó el contenedor anidado correcto antes de concluir.
- Acción para Claude: limitar las reglas de composición a figuras exteriores/clases propias, respetar el componente interno y repetir el barrido. No añadir el diagrama a excepciones del test para ocultarlo. No atribuido como introducción de sus últimos commits: hay reglas del componente ya presentes en el checkpoint.

### 2. Puerta de publicación · El presupuesto de `/casos` continúa fallando

- `npm run check:all`: salida **1** después de compilar, por `check:public-bundle`.
- Incremento raw **2.226 B**, tolerancia **2.189 B**: excede el límite en **37 B**. El incremento gzip de esa ruta es 869 B. No implica por sí mismo un deterioro perceptible de velocidad, pero la puerta acordada no está superada.
- `npm run bundle:baseline` en simulación confirma la diferencia. El generador nuevo no se ha usado con `--write`; no se alteró el umbral ni se convirtió el resultado actual en su propia referencia aprobada.
- Acción: identificar/justificar la diferencia, optimizar si procede o revisar explícitamente el presupuesto con evidencia. Repetir el control antes de publicar.

### 3. P2 · Open Graph conserva la conclusión que se matizó en el contenido

- `src/app/investigacion/page.tsx:18`: `openGraph.description` afirma «Cómo el diseño del siglo XX eliminó la dimensión háptica…».
- El cuerpo de `content/research.ts` ya formula una pregunta e hipótesis con corpus acotado. La descripción antigua reaparece al compartir el enlace. Confirmada en el DOM construido, no solo por lectura del código.
- Acción: alinear la descripción social con el alcance abierto del texto; revisar también la coherencia del resto de metadatos. No se reescribió contenido durante esta auditoría.

### 4. P2 · Límite de cuerpo de contacto dependiente de una cabecera opcional

- `src/app/api/contact/route.ts:50`: se confía en `Content-Length` y después se consume `request.json()` completo.
- Harness local de la función real transpila TS, sustituye únicamente NextResponse y el transporte de correo: JSON de más de 20 KB sin esa cabecera y con honeypot devuelve 200; con cabecera 20000 devuelve 413; content-type incorrecto devuelve 415. **Cero envíos**, sin petición abusiva a producción.
- Esto demuestra que la aplicación no garantiza su límite de 12 KB; no demuestra un ataque exitoso al alojamiento ni ausencia de límites de Vercel. `git blame` sitúa esas líneas en el checkpoint `0f0adf68`, no en el SMTP nuevo de Claude.
- Acción posterior: lectura acotada por bytes y pruebas con cuerpos fragmentados/sin cabecera. La limitación de frecuencia con Map es además local a cada instancia; no presentarla como protección distribuida. No se probó abuso distribuido.

### 5. P2 · Investigación queda invisible si JavaScript no se ejecuta

- La regla `.rd-reveal` parte de opacity 0 (`redesign.css:1076`); la página depende de un useEffect para añadir `is-in`.
- Navegador con JavaScript desactivado, espera de 1,5 s: h1 con clase `rd-case-page-title rd-reveal`, opacity **0**. Con JS y desplazamiento normal, las líneas de investigación sí aparecen.
- Deuda de mejora progresiva, no prueba de caída de JavaScript en usuarios reales ni penalización SEO cuantificada. Conservar contenido visible por defecto y habilitar el estado animado solo cuando la ejecución esté disponible; comprobar movimiento reducido y teclado antes de cambiarlo.

### 6. Operación · Repositorio y producción no equivalen

- HTTP de lectura mediante curl de Windows: `.com` devuelve 200; `www.manuelgarciallera.com` y `manuelgarciallera.es` devuelven 308 al apex `.com`.
- `https://manuelgarciallera.com/investigacion` devuelve **404**; el servidor local compilado devuelve **200**, canonical correcto y título de investigación.
- Node fetch falló por cadena de confianza local (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`); no se desactivó TLS. curl pudo validar las respuestas indicadas. La comprobación de `www.manuelgarciallera.es` sufrió un fallo local de resolución y no se certifica de nuevo aquí.
- Esto requiere cerrar publicación y verificar después, no modificar DNS por intuición. No hubo despliegue ni acceso a credenciales desde esta auditoría.

## Qué sí pasó

| Comprobación | Resultado nuevo de este turno |
| --- | --- |
| `test:public-guards` | 13/13, incluidas ruta server-only permitida y fuga desde página rechazada |
| Frontera pública | 21 entradas, sin infracciones |
| Encoding, hero, tipografía, navegación móvil | Pasan sus comprobaciones estructurales; no sustituyen navegador |
| Lint y TypeScript públicos | Pasan dentro de check:all |
| Build Next | Compila y genera 28/28 páginas |
| `node node_modules/vitest/vitest.mjs run --config vitest.unit.config.ts` | 207/207, 32 archivos; esta suite no forma parte de check:all |
| `npm audit --omit=dev` por separado | 0 vulnerabilidades reportadas; check:all no llegó a ese paso |
| Versiones instaladas | nodemailer 10.0.1; fflate 0.6.11 y 0.8.3, comprobadas con npm ls |
| Investigación | 320/390/768/1024/1440 px × temas oscuro/claro: sin overflow documental ni texto fuera de viewport detectado; sin pageerror. No certifica contraste ni lectores de pantalla |
| Recuperación de formulario en móvil | API interceptada con 503: conserva texto, botón vuelve a estar disponible, mailto contiene el mensaje y dirección esperada; sin enviar correo |
| Construcción de SMTP | Transporte simulado: From propio, To fijo, Reply-To visitante, cabeceras sin CRLF, STARTTLS obligatorio en 587, cierre del transporter. No demuestra conexión IONOS ni entrega/SPF/DKIM reales |

El presupuesto medido cubre JS según manifiestos, no toda descarga diferida, imágenes, fuentes, GPU ni Core Web Vitals de usuarios. No se ejecutaron Lighthouse, auditoría axe completa, todas las interacciones ni pruebas SMTP reales. La captura completa de una página con contenido diferido puede mostrar huecos fuera de viewport: se contrastó desplazando a la sección antes de llamarlo defecto.

## Orden de cierre y coordinación

1. Claude: recorte del diagrama, descripción social y revisión del presupuesto; Codex repite los casos fallidos y check:all. Mantener sus mejoras que sí pasan.
2. Consolidar cambios owner anteriores con pruebas frescas y commit acotado, sin arrastrar archivos ajenos. A continuación PostgreSQL/medios/restauración; no ampliar ahora las funciones del editor.
3. Antes de producción: autoridad de publicación aplicable, copia remota comprobada, validaciones repetidas y contraste HTTP posterior. La auditoría no habilita publicación automática.

Hub: inicio `d380697b-9b69-4a81-9330-7a7563544eb9`; avance `30b96176-4366-4ba4-9b4f-5a116cd681ed`. Cambios del carril público solo leídos. Checkpoint `0f0adf686b2752e23c25d224f8c60815b10fd451` intacto. Las capturas son evidencia local generada; el informe se guarda separado de código y trabajos previos.
