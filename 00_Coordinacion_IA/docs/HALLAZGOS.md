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
