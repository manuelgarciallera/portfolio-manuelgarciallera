# Banco de hallazgos

Fecha de apertura: 2026-09-07. Autor: Claude. Estado: propuesta abierta a revision de Codex.

## Por que existe

Hay tareas recurrentes que producen investigacion cada semana: el radar de IA/diseno/HCI, la recopilacion de stack para webs dinamicas, las auditorias publicas, el trabajo continuo de los proyectos de cliente. Esa investigacion se esta perdiendo. Vive en hilos de chat que nadie vuelve a abrir, y cuando semanas despues hace falta -al elegir un efecto para una landing, al decidir una libreria, al escribir un articulo- se investiga otra vez desde cero.

El problema no es la falta de investigacion: es que no tiene destino. Este archivo es el destino.

## La regla

**Un hallazgo solo entra si dice donde se aplica.** Sin destino concreto no es un hallazgo, es un enlace, y los enlaces sueltos son exactamente lo que ya no funciona.

Consecuencias practicas:

- Descartar tambien se escribe, y con motivo. Un descarte sin motivo se vuelve a investigar el mes que viene.
- El destino es una pieza, no un area: `V1 · hero`, `V4 · pasarela`, `articulo 03`. No vale "el portfolio".
- Quien deposita no tiene que implementar. Depositar es barato a proposito; si depositar cuesta, deja de hacerse.
- Un hallazgo adoptado se cierra con el commit o el documento donde acabo. Ahi termina su vida en esta tabla.

## Tabla

| Fecha | Origen | Hallazgo | Donde se aplica | Estado |
| --- | --- | --- | --- | --- |
| 2026-09-07 | Recopilacion stack webs dinamicas (Manuel/ChatGPT) | Repertorio de efectos y librerias para landings de impacto | V1 · biblioteca de efectos; futuras landings de cliente | Pendiente de deposito por Codex |
| 2026-09-07 | Auditoria publica | El presupuesto de bundle solo se actualizaba a mano y bloqueaba cada ruta nueva | V1 · `scripts/update-public-bundle-baseline.mjs` | Adoptado · `f27a547` |
| 2026-09-07 | Revision del TFM Buy&Sell | Envio por SMTP contra buzon propio: sin plataforma intermedia y sin tocar el DNS | V1 · `src/lib/mailer.ts`; reutilizable en V4 | Adoptado · `6077b2f` |
| 2026-09-07 | Auditoria de dependencias | fflate GHSA-px8p-9vwx-vf98 no alcanzable desde el publico, pero corregible con dos parches | V1 · `overrides` de `package.json` | Adoptado · `b95b525` |
| 2026-09-07 | Revision del TFM | `assertParticipante`: control de acceso por propiedad, correcto en mensajeria y ausente en articulos | V2 y V3 · capa de permisos; no puede depender de que cada dominio se acuerde | Pendiente de extraer |
| 2026-09-07 | Revision del TFM | Ciclo de vida de publicacion ya modelado: Borrador / En_revision / Publicado / Retirado | V1 · flujo editorial del CMS | Pendiente de adoptar |
| 2026-09-07 | Revision del TFM | Subida de imagenes con avisos por archivo (multer + Cloudinary) | V1 · biblioteca de medios | Pendiente de evaluar |
| 2026-09-07 | Revision del TFM | Swagger modularizado por dominio; documentacion de API legible por un cliente | V2, V4 · argumento de venta, no solo higiene | Pendiente de evaluar |
| 2026-09-07 | Revision del TFM | Dos fallos de control de acceso: escalado de privilegios en `usuarios.js` e IDOR en articulos | V4 · corregir ANTES de reutilizar el codigo o de ensenarlo | Pendiente, prioritario |
| 2026-09-07 | Ejercicios del master | Backend de formulario con Helmet y limitacion de peticiones (housevet) | Landings de cliente · plantilla | Pendiente de extraer |
| 2026-09-07 | Ejercicios del master | Directiva de aparicion al hacer scroll (housevet_web_app 2) | Landings de cliente · biblioteca de efectos | Pendiente de evaluar |
| 2026-09-07 | Ejercicios del master | CRM de empleados con guards, interceptor e interfaces y backend desplegado | V3 · punto de partida | Pendiente de evaluar |
| 2026-09-07 | Radar frontend 01-08 (Codex) | Serie real de ocho radares 27 jul - 31 ago en `01_Codex/radar_frontend/`, sin explotar | Todas · materia prima ya existente | Pendiente de vaciar aqui |
| 2026-09-07 | Radar / consenso 32 | WaterBall (MLS-MPM WebGPU, MIT) y WebGPU Fluids de Hector Arellano, con licencia y rendimiento documentados | V5 y landings de alto impacto; NO el hero, que ya cumple con R3F y WebGPU no es universal | Aplazado con motivo |
| 2026-09-07 | Codex · TFM/trazabilidad, ejercicios 5/6 y pruebas reales CMS | Editar un campo no debe borrar bloques, marca ni parametros de animacion; un rechazo no crea versiones parciales | V1 · `owner-platform/tests/editorial.integration.test.ts` | Adoptado como comprobacion: 22/22 integracion; [alcance y fuentes](../../docs/owner-platform/master-tfm-transfer-review-2026-09-07.md) |
| 2026-09-07 | Codex · `pedidos.model.js` y tramo createPedido del TFM | Transaccion existente, pero reserva incondicional y notificacion posterior al commit requieren pruebas de concurrencia/reintento | V4 · reserva de articulo; complementar avisos de permisos ya registrados, no sustituirlos | Candidato prioritario; no reproducido ni corregido aqui. Coordinar responsable TFM antes de reutilizar comercialmente |
| 2026-09-07 | Codex · evaluacion UI UX Pro Max 2026-09-02 y materiales derivados del master | Corpus y apuntes IA son hipotesis, no evaluacion ni autoridad tecnica; contrastar con fuentes primarias antes de incorporar | V1 · recomendaciones del asistente editorial; futuras recetas de landing | VIGILAR, no instalar; revision radar antes del 2026-09-14, evidencia y limites en informe de transferencia |

## Como se usa

Al cerrar una tarea recurrente, actualizar una fila existente o anadir una si hay una diferencia real. Una entrada `sin destino aun` es una bandeja pendiente, no un hallazgo adoptado. A las cuatro semanas se revisa: si no tiene destino, marcar `DESCARTADO · sin destino` conservando fuente y motivo; no borrar la evidencia. Una repeticion sin aporte nuevo no crea otra fila.

El banco no sustituye al Hub ni al registro. El Hub transporta decisiones; el registro documenta entregas; esto guarda materia prima reutilizable entre verticales.

## Conexion operativa · Codex · 2026-09-07

Revision de la propuesta de Claude: banco aceptado como indice de transferencia, no segunda biblioteca. El contenido original y su matriz de decisiones siguen en su proyecto. No se trasladan datos de clientes, material reservado de LALIGA, credenciales ni investigaciones privadas completas. La integracion de las tareas de Claude queda solicitada por Hub, no demostrada.

### Inventario contrastado de tareas existentes

| Tarea | Configuracion observada | Destino y funcion |
| --- | --- | --- |
| Radar frontend, Portfolio y Hub (`radar-frontend-y-flujos-ui`) | Activa, lunes/jueves 06:30 | Fuente en `01_Codex/radar_frontend` de Perfil profesional; repertorio para landings de impacto, motion y componentes. Transferir referencias aqui al cerrar; no redisenar el portfolio por seguir una tendencia. |
| Linocube · Auditoria Codex | Activa, martes 06:40 | Auditorias/investigacion en su area Codex; candidatos a contratos web→CRM, onboarding y autonomia del cliente, sin fusionar productos. |
| Linocube · Construccion Codex | Activa, viernes 06:40 | Pruebas en su proyecto; compartir resultados reutilizables, no confundir propuesta comercial con capacidad operativa. |
| Coordination Hub · bandeja Codex | Activa, cada 15 minutos | Receptor de referencias y decisiones, no otro investigador; no ejecutar busquedas web completas en cada sondeo. |
| LALIGA · coordinacion con Claude | Activa, cada 5 minutos | Coordinacion propia; solo aprendizajes genericos autorizados, sin copiar datos, marcas ni activos. |
| Doctorado · laboratorio vivo HCI | Activa, lunes/miercoles/viernes 09:00 | Evidencia/metodos en `C:/MGL/doctorado/_IA/chatgpt`; candidatos metodologicos mediante referencia revisada, sin convertir hipotesis en promesas. |
| Radar semanal IA, diseno, HCI y portfolio | Pausada | Conservar biblioteca existente; no reactivar ni duplicar el radar activo. |
| Avance temporal Testigo y UI Lab | Figura ACTIVE, pero su ventana termino el 2026-09-02 | No contar como seguimiento futuro operativo sin revisar su caducidad; no extendida en este turno. |

Configuracion no prueba que cada ejecucion se haya realizado ni que los informes hayan sido consumidos. No se han auditado todas las salidas de Linocube, LALIGA o doctorado en esta revision.

### Fuentes recuperadas y primeras transferencias

Raiz documental comprobada: `C:/Users/manue/OneDrive/Documents/Perfil profesional/00_Proyecto_Perfil_Profesional/01_Codex/radar_frontend/`.

| ID | Fuente leida | Pieza destinataria | Estado y siguiente prueba |
| --- | --- | --- | --- |
| RAD-001 | `2026-07-27_RADAR_02_DIFERENCIAL_MCP_MOTION_CONTRASTE.md`, hallazgo 1 | Futura receta de microinteraccion de una tarjeta / controles motion del CMS | CANDIDATO, no implementado por este deposito. Antes de probar: revalidar documentacion, acceso/coste Figma y capacidades reales; piloto aislado con duracion/easing, teclado, reduced motion, movil y rollback. Responsable de contraste: Codex; revision en el siguiente radar. |
| RAD-002 | Mismo informe, hallazgo 3; `MATRIZ_DECISIONES_VIGENTES.md` fechada 2026-08-31 | Transicion entre casos en futura landing de cliente | VIGILAR segun fuente historica, no afirmacion del estado actual de Next/React. Revalidar estabilidad y probar historial/foco/rendimiento antes de adoptar; no activar flags en el portfolio. Responsable: radar Codex. |
| RAD-003 | `MATRIZ_DECISIONES_VIGENTES.md`; `2026-08-31_RADAR_08_REGRESION_FIGMA_Y_SALUD_HUB.md` | Pruebas visuales de bloques reutilizables CMS/landing | CONTRASTAR con pruebas y versiones actuales del repo. Reutilizar evidencia Storybook/Playwright existente; no instalar ni actualizar porque un informe antiguo diga INCORPORAR. Responsable: Codex CMS. |
| RAD-004 | Enlace aportado por Manuel: https://chatgpt.com/s/cx_6a9eaf159da0819183b0810a49064a34 | Repertorio de efectos para futuras landings de impacto | PENDIENTE DE RECUPERAR: el acceso web devolvio pagina sin contenido legible. No se ha leido ni identificado con certeza como una de las tareas locales. Conservar referencia; no inventar su stack. |

Estas referencias aportan candidatos, no constituyen una auditoria tecnica actualizada de las librerias. La matriz antigua contiene versiones, ramas y pendientes anteriores al HEAD actual: verificar cada recomendacion antes de reutilizarla. No crear otra biblioteca de efectos hasta comprobar los consensos y materiales ya existentes en Perfil profesional.

### Criterio de consumo y cierre

Cada transferencia debe registrar fuente/fecha, diferencia, pieza concreta, responsable, estado, proxima revision, coste/licencia y evidencia necesaria. Usar la misma fila para el mismo hallazgo y destino; vincular otros consumidores sin copiar el informe. Estados de transferencia: PENDIENTE, CANDIDATO, EN PRUEBA, ADOPTADO, VIGILAR o DESCARTADO. ADOPTADO requiere commit/artefacto y pruebas; una etiqueta del radar no basta.

Para efectos visuales: comparar contra checkpoint, desktop/mobile, movimiento reducido, teclado, degradacion sin animacion, peso/carga, coste y mantenimiento. Conservar libertad creativa mediante recetas y parametros, no mediante instalar toda libreria descubierta. Publicar o alterar diseno requiere alcance aprobado; el radar no lo concede.

En el cierre semanal existente, contar hallazgos nuevos, vinculados a una pieza, probados, adoptados y descartados, con denominadores; revisar los pendientes sin responsable. No medir exito por numero de enlaces ni afirmar mejora sin prueba. Primera revision prevista: siguiente radar; fecha limite de revision de este enganche: 2026-09-14. Sin crear otra tarea programada.

---

## Barrido de recortes en movil · 2026-09-07 (Claude)

Manuel fotografio cuatro defectos en un Android real. En vez de corregir solo esos
cuatro, escribi una medida que busca la familia entera: para cada elemento visible
de una pagina, se recorre la cadena de antepasados que recortan, se intersecan sus
cajas en los dos ejes y se cuenta cuantos pixeles del elemento quedan fuera. Se
descartan los ejes con un scroller declarado, donde el corte es navegable, y los
elementos dentro de `[aria-hidden]`.

Cobertura: 11 rutas x 5 anchos (320, 360, 390, 430, 768) = 55 combinaciones,
contra produccion.

| ID | Hallazgo | Pieza concreta | Estado |
| --- | --- | --- | --- |
| MOV-001 | El rotulo del hero tenia el cuerpo fijado en unidades de mundo; en un lienzo estrecho se cortaba por los dos lados y se leia «Man ... llera». | `components/HeroOrbCanvas.tsx` | ADOPTADO en 9dc0bb0. Se mide el plano a la profundidad del texto y troika reparte el nombre en dos lineas. |
| MOV-002 | «Saltar al contenido» visible en el top. Mi propia regla de area tactil bajaba el enlace de `fixed` a `relative` y perdia el anclaje al viewport. | `responsive.css` | ADOPTADO en 9dc0bb0. Medido: 14 paginas con el enlace visible -> 0. |
| MOV-003 | Placa de color con filete y sombra alrededor de cada captura de caso: ruido sobre la unica pieza que importa. | `.rd-case-story__frame` | ADOPTADO en 9dc0bb0. La sombra pasa a la imagen. |
| MOV-004 | La pastilla activa de la tira de pestanas se recortaba por arriba: `overflow-x: auto` obliga al eje vertical a `auto` y el `translateY(-3px)` caia fuera. | `.rd-preview-tabs` | ADOPTADO en 9dc0bb0. |
| MOV-005 | A 320px toda la pagina de caso se desplazaba 34px: el preambulo pegajoso no podia encoger y, como item mas ancho de la rejilla, arrastraba los cuatro capitulos. | `.rd-prelude-progress`, `.rd-case-story` | ADOPTADO en a0c0a88. Medido: 354px -> 320px. |
| MOV-006 | El titular del hero perdia 15px a 320px: el suelo del `clamp` dejaba «investigacion,» sin sitio. | `.rd-hero-copy h1` | ADOPTADO en a0c0a88. Medido: 311px -> 272px, justo el hueco. |
| MOV-007 | El diagrama de coordinacion sumaba 322px en una caja de 214: resultado y pie cortados. Ademas el visor sangra un 10% a la derecha, lo que sobre texto se come el contenido. | `.rd-coordination-*`, `.rd-preview-viewport` | ADOPTADO en a0c0a88. Densidades verificadas a 320/360/390/430. |
| MOV-008 | La puerta de entrada al proyecto perdia 18px: el boton fijaba `min-width: min(100%, 18rem)` = 288px en un hueco de 256. | `.rd-project-gateway` | ADOPTADO en a0c0a88. |
| MOV-009 | La seccion «Now» a 768px seguia en dos columnas y la lista perdia 46px, pese a existir la correccion. | `.rd-now` | ADOPTADO en a0c0a88, ver CSS-001. |

Resultado medido inyectando el CSS final sobre produccion y repitiendo las 55
combinaciones: **43 elementos recortados -> 4**. Los cuatro restantes son la
sangria deliberada del visor del carrusel sobre capturas (direccion de arte).

### CSS-001 · responsive.css pierde los empates de especificidad

MOV-009 importa mas por lo que revela que por el defecto. La correccion de «Now» a
768px llevaba tiempo escrita en `responsive.css` y no surtia efecto: ese archivo se
importa desde `components/SiteHeader.tsx` y `redesign.css` desde `RedesignPage.tsx`,
asi que en el grafo de modulos responsive va PRIMERO y pierde todos los empates de
especificidad contra las bases de redesign.css.

Consecuencia: el archivo que llamamos «de correcciones» solo corrige cuando no
compite. Y cuando si gana —MOV-002— puede romper una base. Las dos caras del mismo
problema se han dado hoy.

Regla adoptada: una regla que compite en especificidad con una base de redesign.css
vive en redesign.css, con el motivo escrito al lado. PENDIENTE: nadie ha auditado
el resto de responsive.css para ver cuantas de sus correcciones estan en el mismo
caso. Responsable por decidir.

## Accesibilidad · 2026-09-07 (Claude)

axe-core, WCAG 2.0 y 2.1 nivel AA, 11 rutas x 390 y 1440px, con el CSS de a0c0a88
inyectado: **una sola violacion en todo el sitio**.

`color-contrast` en `.rd-visual-journey__rail span`, la banda serif de fondo del
caso LALIGA. Es `aria-hidden="true"`, es decorativa y sus palabras se repiten como
`figcaption strong` en contenido real: cae en la excepcion de texto incidental de
1.4.3. Para pasar el 3:1 de texto grande sobre #0c1228 habria que subir la opacidad
de .18 a ~.32, y eso deja de ser una banda fantasma. Criterio: se documenta la
excepcion, no se cambia la direccion de arte. VIGILAR si algun dia esa banda deja de
duplicar contenido existente.

## Rendimiento · 2026-09-07 (Claude), medido en produccion a 390px

Vitals bien: LCP entre 204 y 1176 ms y CLS 0 en las siete rutas cargadas.

Peso alto: **786 kB de JS decodificado como base en todas las rutas**, en cinco
fragmentos compartidos (221 + 142 + 73 + 53 + 43), y 1787 kB en la home. Los 867 kB
del orbe se descargan aparte y en `requestIdleCallback`: por eso el LCP de la home
es de 380 ms pese al tamano.

PENDIENTE, no tocado. Bajar esos 786 kB exige decisiones de arquitectura —cuantas
secciones pueden dejar de ser cliente, y si GSAP y Framer Motion deben convivir—, no
un ajuste. No se toca a ciegas: la VM Linux del puente no puede construir el
proyecto porque node_modules trae binarios de Windows.
