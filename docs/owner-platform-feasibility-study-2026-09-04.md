# Estudio de viabilidad — plataforma editorial, control y asistencia por IA

Fecha: 4 de septiembre de 2026  
Proyecto piloto: portfolio de Manuel García-Llera  
Decisión: definir una plataforma modular reutilizable sin degradar el frontend público actual.

## 1. Conclusión ejecutiva

El producto es viable, pero debe construirse como una plataforma de edición estructurada y no como un clon completo de Webflow. El portfolio es un buen campo de pruebas porque combina contenido editorial, casos extensos, medios, animaciones, responsive, SEO y requisitos de rendimiento reales.

La arquitectura recomendada es:

- Payload CMS 3 integrado con el Next.js 16 existente.
- PostgreSQL como fuente de contenido, revisiones, releases, auditorías y trabajos.
- Almacenamiento de objetos compatible con S3 para medios inmutables.
- Frontend actual como renderer protegido: los bloques aportan datos y parámetros, no CSS arbitrario.
- Panel privado adaptado al owner, construido sobre la administración extensible de Payload.
- Umami como analítica principal portable, con adaptadores para Vercel Analytics y Speed Insights.
- Un registro de releases propio que relacione contenido, código, despliegue, medios y puntuaciones.
- IA opcional en dos planos aislados: contenido estructurado y cambios de código en sandbox.

Payload es la mejor base porque comparte TypeScript, React y Next.js con el producto, tiene licencia MIT, bloques ordenables, autenticación, borradores, versiones, migraciones, medios, access control y soporte de multitenencia. Sanity sería la mejor alternativa si se priorizara una experiencia visual administrada sobre propiedad y capacidad de convertir el sistema en producto.

## 2. ¿Cambiará o empeorará el diseño público?

No tiene por qué cambiar. El CMS no renderizará el diseño; almacenará una representación tipada que consumirán los componentes actuales. El principio contractual será:

> El contenido puede cambiar; los componentes, tokens, reglas responsive y límites de movimiento siguen gobernados por el código.

Para impedir regresiones:

1. Cada bloque del CMS corresponderá a un componente ya verificado.
2. Las variantes visuales serán una lista cerrada, nunca nombres de clases escritos por el editor.
3. El contenido inicial importado deberá producir HTML y capturas equivalentes a la versión checkpoint.
4. La previsualización mostrará desktop, tablet, mobile y \`prefers-reduced-motion\` antes de publicar.
5. La publicación se bloqueará si fallan validaciones críticas, rutas, tipos o presupuestos de rendimiento.
6. Se mantendrán capturas de referencia de las páginas clave para regresión visual.

El panel administrativo se cargará en rutas privadas separadas. Su JavaScript no debe incorporarse a las páginas públicas. El frontend publicado seguirá usando render estático/caché y revalidación selectiva; introducir un CMS no exige convertir las páginas en render dinámico por visita.

## 3. Alcance realista del editor

### Control de contenido

- Proyectos, artículos, páginas, navegación, tecnologías y taxonomías.
- Título, entradilla, texto enriquecido, enlaces, citas, tablas sencillas y pies.
- SEO, Open Graph, canonical, estado editorial, programación y redirects.
- Orden de fich fichas y selección de proyectos destacados.
- Biblioteca multimedia, focal point, alt, créditos y metadatos.

### Composición modular

- Añadir, duplicar, ocultar, borrar y ordenar bloques.
- Crear una página desde plantillas: proyecto, artículo, landing o página editorial.
- Reutilizar bloques globales sin duplicar contenido.
- Elegir composiciones verificadas: texto izquierda/derecha, una/dos columnas, galería, carrusel, métricas, stack, CTA y siguiente proyecto.
- Restringir tipos de bloque por plantilla para evitar páginas incoherentes.

### Movimiento

Los efectos serán parámetros semánticos y limitados:

- preset;
- dirección;
- duración;
- retardo;
- stagger;
- umbral del viewport;
- repetición;
- autoplay;
- intervalo;
- intensidad;
- comportamiento reduced-motion.

El panel ofrecerá previsualización y restauración de valores. No expondrá timelines GSAP, selectores DOM ni JavaScript. Las combinaciones estarán limitadas por el componente y por presupuestos de movimiento para evitar mareo, lentitud o solapamientos.

### Lo que debe seguir requiriendo desarrollo

- Crear una familia visual completamente nueva.
- Cambiar breakpoints y sistema tipográfico.
- Añadir código arbitrario, CSS libre o scripts.
- Alterar autenticación, esquema, permisos o integraciones.
- Cambiar comportamiento de componentes fuera de las variantes verificadas.

Esta frontera permite mucha autonomía sin trasladar al owner la complejidad de ingeniería.

## 4. Panel del owner

La portada del panel debe responder primero a “¿qué necesita atención?”:

- borradores y publicaciones programadas;
- cambios sin publicar;
- rendimiento degradado;
- enlaces rotos;
- imágenes pesadas o sin alt;
- formularios o integraciones con errores;
- contenido desactualizado;
- copias de seguridad y última restauración verificada;
- actividad reciente y consumo de automatizaciones/IA.

Áreas principales:

1. Contenido.
2. Páginas y estructura.
3. Medios.
4. Publicaciones y versiones.
5. Estadísticas.
6. Calidad.
7. Automatizaciones.
8. Asistente.
9. Configuración y seguridad.

El diseño deberá ser limpio y sobrio, pero no se diseñará visualmente hasta poder compararlo con el lenguaje actual del portfolio y validar los flujos principales.

## 5. Versiones y recuperación

Una sola lista de “versiones” ocultaría estados diferentes. El sistema debe conservar tres capas relacionadas:

### Revisión de documento

Autosaves y cambios de un artículo, proyecto, página o ajuste. Permite restaurar una pieza concreta.

### Release de contenido

Conjunto inmutable de revisiones y medios que se publican juntos. Permite previsualizar una edición completa antes de hacerla visible.

### Release del sitio

Checkpoint visible para el usuario que relaciona:

- commit y tag de Git;
- artefacto y deployment;
- release de contenido;
- versión del esquema;
- nivel de migración de la base de datos;
- manifiesto de medios con hashes;
- configuración no secreta;
- resultados de pruebas;
- puntuaciones y métricas;
- autor, fecha y descripción breve;
- compatibilidad de rollback.

Restaurar una versión será una nueva acción registrada, nunca la reescritura silenciosa del historial. Un rollback de Vercel por sí solo no restaura contenido, base de datos ni medios externos; por eso el manifiesto debe coordinar las capas.

La lista del panel mostrará:

- fecha y número de release;
- descripción;
- estado;
- capturas de referencia;
- responsable;
- páginas afectadas;
- score de experiencia real;
- score de laboratorio;
- accesibilidad/SEO;
- fiabilidad;
- conversión;
- posibilidad real de restauración.

No se usará una única nota opaca. Lighthouse fluctúa según versión y condiciones; se guardarán metodología, versión, dispositivo y mediana de varias ejecuciones. Core Web Vitals se mostrará con percentil 75, muestra y periodo. Un resumen comercial podrá existir, pero siempre será explicable y tendrá versión de fórmula.

## 6. Analítica

El panel utilizará una interfaz propia de proveedor. La UI no conocerá directamente Umami, Vercel o Plausible:

\`\`\`text
AnalyticsProvider
  summary(range, filters)
  timeseries(metric, interval)
  breakdown(dimension)
  events(name, properties)
  health()
\`\`\`

Recomendación:

- Umami autohospedado como fuente principal portable y sin cookies.
- Vercel Speed Insights para experiencia real y Core Web Vitals.
- Adaptador opcional de Vercel Web Analytics.
- PostHog solo cuando haya producto multiusuario, experimentación o análisis avanzado que justifique su complejidad.

Eventos iniciales:

- apertura y finalización de caso;
- interacción con carrusel;
- clic en siguiente proyecto;
- clic en contacto, email, LinkedIn o CV;
- lectura de artículo;
- profundidad de lectura;
- error visible;
- uso de navegación y búsqueda.

La analítica será agregada y respetará privacidad. Los eventos deberán responder preguntas concretas, no registrar actividad por registrar.

## 7. Asistencia por IA

Es viable, pero no debe existir un agente omnipotente conectado a producción. El panel puede presentar una única conversación y operar internamente mediante dos planos.

### Agente de contenido

Puede:

- proponer o reescribir borradores;
- crear metadata, alt, resúmenes y taxonomías;
- buscar inconsistencias;
- transformar contenido a bloques tipados;
- preparar traducciones;
- crear una nueva revisión y una preview.

No publica, elimina en masa ni modifica permisos sin aprobación. Solo usa funciones de negocio estrictas; nunca SQL, shell o HTTP genéricos.

### Agente de código

Puede:

- analizar el repositorio;
- proponer un plan;
- trabajar en un worktree y contenedor efímero;
- generar un diff;
- ejecutar pruebas;
- producir una preview;
- explicar riesgos y rollback.

No recibe secretos de producción, no despliega, no mezcla a la rama protegida y no aprueba sus propias elevaciones. El owner revisa el diff y la preview.

La opción adecuada para contenido es la Responses API con funciones estrictas. Para código, Codex SDK o App Server dentro de un entorno aislado. “Iniciar sesión con Codex” no debe asumirse como un OAuth público universal: la primera versión usaría credenciales de servidor protegidas o una clave aportada por el owner, con presupuesto y permisos explícitos.

Todos los documentos, URLs, prompts, uploads y archivos del repositorio se tratarán como datos no confiables. El control de permisos vivirá fuera del modelo.

## 8. Seguridad mínima de producto

- Registro público deshabilitado.
- MFA/passkey cuando sea compatible con la solución final.
- Cookies \`HttpOnly\`, \`Secure\` y \`SameSite\`.
- Rate limiting compartido.
- permisos aplicados en servidor y por tenant;
- secretos fuera del navegador, prompts y logs;
- ledger append-only de herramientas, argumentos, diffs, aprobaciones y resultados;
- aprobación vinculada al hash exacto de la operación;
- uploads validados y reprocesados;
- importación por URL protegida frente a SSRF;
- ramas protegidas y preview antes de producción;
- backups de base de datos y objetos;
- pruebas periódicas de restauración.

## 9. Camino a producto vendible

El portfolio será tenant cero y validará el sistema. No se debe introducir multitenencia completa en la primera entrega, pero el dominio debe evitar decisiones que la impidan.

Para comercializar después harán falta:

- aislamiento por tenant;
- dominios y temas;
- roles;
- límites y cuotas;
- facturación;
- onboarding;
- templates versionados;
- marketplace o registro de bloques;
- migraciones por tenant;
- exportación;
- soporte;
- observabilidad y acuerdos de servicio;
- políticas, privacidad y tratamiento de datos.

La propuesta comercial no debe ser “otro CMS”. La diferenciación plausible es:

> Un sistema editorial para portfolios y sitios de autor con dirección visual protegida, movimiento controlable, calidad verificable, releases restaurables y asistencia segura.

Es más defendible que competir desde el comienzo como constructor universal.

## 10. Arquitecturas descartadas

### Panel totalmente personalizado desde cero

Máximo control, pero reconstruye auth, revisiones, editor, uploads, permisos y migraciones. Riesgo y coste innecesarios.

### Sanity como núcleo

Excelente Visual Editing y menor operación, pero mayor dependencia del Content Lake y funciones avanzadas ligadas a planes. Es segunda opción.

### Strapi

CMS maduro y MIT, pero servidor/admin separados del modelo React/Next existente; varias funciones editoriales avanzadas son comerciales.

### Directus

Muy sólido para productos database-first, pero su administración Vue separada encaja peor y su licencia actual añade incertidumbre para una futura oferta comercial.

### Keystatic

Magnífico para un portfolio pequeño basado en Git, pero insuficiente para releases coordinados, multitenencia, permisos y dashboard de producto.

## 11. Fases propuestas

### Fase 0 — preservar y medir

- checkpoint Git etiquetado;
- baseline de capturas, rutas, pruebas y rendimiento;
- contratos de renderer;
- matriz de contenido actual;
- decisión de proveedores y entornos.

### Fase 1 — núcleo editorial sin impacto visual

- Payload, Postgres, auth y medios;
- colecciones de proyectos, artículos y tecnologías;
- adaptador con fallback a contenido TypeScript;
- borradores, preview y revalidación;
- migración verificable página por página.

### Fase 2 — composición y movimiento

- páginas y bloques tipados;
- ordenación y templates;
- presets de movimiento;
- preview multipantalla;
- validaciones y regresión visual.

### Fase 3 — releases, calidad y analítica

- manifiestos y releases de contenido/sitio;
- backups y restauración;
- panel de métricas;
- auditorías programadas;
- calidad y alertas.

### Fase 4 — automatización e IA

- agente de contenido;
- ledger de trabajos y aprobaciones;
- agente de código aislado;
- diffs, tests y previews;
- límites de gasto y seguridad adversarial.

### Fase 5 — producto

- arquitectura multi-tenant;
- temas y dominios;
- roles, cuotas y facturación;
- onboarding;
- documentación y soporte.

Cada fase debe producir software usable y reversible. No se iniciará la siguiente si la anterior empeora el frontend, el rendimiento o la recuperación.

## 12. Criterios de éxito

- Equivalencia visual del contenido migrado.
- Ningún bundle administrativo cargado en el frontend público.
- Sin aumento material de CLS.
- Presupuesto de JavaScript público explícito.
- Preview y rollback demostrados, no solo documentados.
- 100 % de publicaciones asociadas a un release.
- Todas las operaciones IA registradas y reversibles.
- Ninguna publicación, merge o despliegue autónomo por IA.
- Exportación del contenido y los medios.
- Recuperación verificada de base de datos.

## 13. Riesgos y decisiones abiertas

1. La ambición de constructor visual puede disparar alcance. Debe mantenerse estructurado hasta validar uso real.
2. Payload reduce lock-in, pero aumenta responsabilidad operativa.
3. Las migraciones de contenido y esquema deben ser compatibles con rollback.
4. La analítica de bajo tráfico puede no tener muestra suficiente.
5. Los scores no deben convertirse en una falsa garantía.
6. La IA añade coste, superficie de ataque y necesidad de auditoría.
7. La multitenencia temprana ralentizaría el piloto; ignorarla por completo encarecería el producto posterior.
8. La experiencia visual del panel requerirá diseño y pruebas propias; el admin base es infraestructura, no el producto final.

## 14. Fuentes primarias principales

- [Payload — instalación y compatibilidad](https://payloadcms.com/docs/getting-started/installation)
- [Payload — bloques](https://payloadcms.com/docs/fields/blocks)
- [Payload — administración](https://payloadcms.com/docs/admin/overview)
- [Payload — borradores](https://payloadcms.com/docs/versions/drafts)
- [Payload — versiones](https://payloadcms.com/docs/versions/overview)
- [Payload — PostgreSQL](https://payloadcms.com/docs/database/postgres)
- [Payload — migraciones](https://payloadcms.com/docs/database/migrations)
- [Payload — almacenamiento](https://payloadcms.com/docs/upload/storage-adapters)
- [Payload — multitenencia](https://payloadcms.com/docs/plugins/multi-tenant)
- [Sanity — integración con Next.js](https://www.sanity.io/docs/nextjs)
- [Sanity — drag and drop](https://www.sanity.io/docs/visual-editing/enabling-drag-and-drop)
- [Umami 3 — descripción y API](https://docs.umami.is/docs)
- [Vercel — Instant Rollback](https://vercel.com/docs/instant-rollback)
- [Vercel — Web Analytics API](https://vercel.com/changelog/web-analytics-api)
- [Vercel — Speed Insights](https://vercel.com/docs/speed-insights/metrics)
- [Google — PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/about)
- [web.dev — umbrales Core Web Vitals](https://web.dev/articles/defining-core-web-vitals-thresholds)
- [OpenAI — Codex SDK](https://learn.chatgpt.com/docs/codex-sdk)
- [OpenAI — Codex App Server](https://learn.chatgpt.com/docs/app-server)
- [OpenAI — function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI — seguridad y aprobaciones](https://learn.chatgpt.com/docs/agent-approvals-security)
- [OpenAI — controles de datos de API](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint)
- [GitHub — releases inmutables](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases)
- [PostgreSQL — backup y recuperación](https://www.postgresql.org/docs/current/backup.html)

## 15. Estado del checkpoint previo

La versión previa al editor se conserva en:

- rama: \`codex/checkpoint-pre-editor-2026-09-04\`;
- commit: \`0f0adf686b2752e23c25d224f8c60815b10fd451\`;
- tag anotado: \`checkpoint/pre-editor-2026-09-04\`.

Antes de crear el checkpoint se verificaron estructura, responsive, lint, TypeScript, build y 108 pruebas unitarias. La consulta remota de \`npm audit\` no respondió y se interrumpió; debe repetirse con conectividad estable.

## 16. Ampliación — diseño atomizado, editor visual y librerías

### Decisión metodológica

Atomic Design es útil como modelo mental, no como una taxonomía rígida de carpetas. Brad Frost define átomos, moléculas, organismos, plantillas y páginas como etapas concurrentes, no como un proceso lineal. Para este producto emplearemos nombres menos ambiguos:

\`\`\`text
foundations
├─ tokens
├─ primitives
├─ components
├─ blocks
├─ templates
└─ pages
\`\`\`

- **Tokens:** color, tipografía, espacio, radios, capas y movimiento.
- **Primitives:** elementos accesibles sin identidad editorial compleja.
- **Components:** unidades reutilizables con comportamiento.
- **Blocks:** secciones editables completas y tipadas.
- **Templates:** reglas de composición por tipo de página.
- **Pages:** instancias con contenido real.

No se reorganizará el frontend existente solo para adoptar nombres nuevos. Esta arquitectura se aplicará a los límites nuevos y se irá extrayendo únicamente cuando aporte reutilización o seguridad.

### Editor visual seleccionado

**Puck** es la mejor capa de composición visual para una fase posterior:

- editor React embebible y drag-and-drop;
- licencia MIT apta para producto comercial;
- JSON bajo nuestro control;
- componentes registrados por nosotros;
- render publicado compatible con Server Components;
- permisos para insertar, editar, mover, duplicar o borrar;
- sistema de plugins y overrides;
- migraciones de datos y props.

Puck no sustituye Payload. La distribución de responsabilidades será:

\`\`\`text
Payload
  identidad, permisos, contenido, medios, versiones, publicación
        ↓
Puck Data + schemaVersion
  árbol de composición visual validado
        ↓
React renderers propios
  componentes, responsive, tokens y movimiento
\`\`\`

Puck permanece en una versión \`0.x\`, por lo que fijaremos versión, guardaremos fixtures históricos de JSON y exigiremos migraciones antes de retirar propiedades. La autorización real seguirá en Payload; ocultar una acción en la interfaz de Puck no es seguridad.

### Texto enriquecido

Se mantendrá **Lexical a través de Payload**. Añadir Tiptap, BlockNote o Plate duplicaría esquemas, serializadores y migraciones sin aportar valor al piloto:

- Tiptap es excelente y muy activo, pero añade otro runtime/editor.
- BlockNote ofrece una UX de bloques más terminada, pero introduce obligaciones MPL y paquetes avanzados comerciales/GPL.
- Plate es muy potente, pero excesivo para el contenido editorial previsto.

Lexical ya es la integración nativa de Payload, tiene licencia MIT, estado JSON, nodos personalizados y desarrollo activo. Puck se ocupará de la página; Lexical, del documento textual dentro de los bloques.

### Opciones descartadas como motor principal

| Opción | Razón |
| --- | --- |
| Craft.js | Riesgo de mantenimiento y demasiada UX fundamental por construir. |
| GrapesJS | Excelente para HTML/CSS casi libre, pero su modelo de canvas/DOM permite demasiadas combinaciones y se alinea peor con React tipado. |
| Builder.io | Experiencia madura, pero editor, datos y operación dependen del SaaS; encaja peor con la intención de producto propio. |
| Editor propio desde cero | Repetiría selección, drag-and-drop, historial, overlays, accesibilidad y migraciones sin ventaja inicial. |

### Catálogo, pruebas y gobernanza

Adoptar ahora:

- **Storybook**, ya presente, como catálogo ejecutable de componentes y bloques.
- **Vitest**, ya presente, para reglas, serialización y validadores.
- **Playwright**, ya presente, para flujos y regresión visual autocontenida.
- **axe-core para Playwright** para problemas de accesibilidad automatizables.
- **Dependabot semanal**, agrupando actualizaciones para evitar ruido.

Posponer:

- **Chromatic** hasta necesitar revisión visual cloud, equipo o navegadores múltiples.
- **Changesets** hasta publicar paquetes reutilizables.
- **Turborepo** hasta que existan al menos dos apps o paquetes con pipelines compartidos.
- **Registry de componentes** hasta distribuir bloques o templates a instalaciones externas.
- **Renovate** hasta que Dependabot resulte insuficiente.

Las capturas de Playwright deben generarse en un entorno CI fijado; las diferencias de sistema operativo, fuentes o navegador pueden alterar los píxeles aunque el código sea idéntico.

### Movimiento

Se conservarán las herramientas actuales —GSAP, Framer Motion y Lenis— y se construirá una capa semántica encima. Añadir otra librería de animación aumentaría el bundle y la superficie de inconsistencias. El contrato de movimiento traducirá presets del editor a las implementaciones existentes.

Cada preset tendrá:

- versión;
- valores permitidos;
- presupuesto máximo de duración/stagger;
- fallback reduced-motion;
- compatibilidad por componente y viewport;
- preview y fixture de regresión.

### Automatizaciones y agentes

Para el piloto no se introducirá todavía una plataforma distribuida compleja. Payload Jobs cubre tareas persistentes, reintentos y workflows sencillos; en serverless se ejecutará mediante endpoints autenticados llamados por un scheduler.

Cuando el sistema pase a producto multi-tenant o aloje agentes que esperen aprobaciones:

- **OpenAI Agents SDK JS** para el agente editorial;
- **Codex App Server** para el agente de código;
- **Temporal** para trabajos duraderos, reintentos y pausas humanas;
- **Cedar** como policy engine de producto, u OPA si la política se extiende a infraestructura;
- **MCP** como protocolo de integración, nunca como frontera de seguridad;
- **OpenTelemetry y ledger propio** para trazas y auditoría.

No se adoptará la plataforma OpenAI Evals como dependencia del producto: su cierre está anunciado para noviembre de 2026. Los datasets y evaluaciones serán propios, versionados y ejecutados en CI.

### Stack aprobado para el piloto

| Capa | Tecnología |
| --- | --- |
| Web pública | Next.js 16, React 19, TypeScript |
| CMS/backend | Payload CMS 3 |
| Datos | PostgreSQL |
| Medios | S3/R2 o adaptador equivalente con objetos versionados |
| Rich text | Payload Lexical |
| Composición visual | Payload Blocks primero; Puck tras estabilizar el modelo |
| Estilos públicos | CSS y tokens existentes; sin migración visual masiva |
| Movimiento | GSAP, Framer Motion y Lenis existentes |
| Catálogo | Storybook |
| Unit/component | Vitest y Storybook Test |
| E2E/visual | Playwright |
| Accesibilidad automatizada | axe-core |
| Analítica | Umami + Vercel Speed Insights mediante adapters |
| Actualizaciones | Dependabot al inicio |
| CI | GitHub Actions |

### Stack reservado para la fase de producto

| Necesidad | Tecnología candidata |
| --- | --- |
| Paquetes y apps múltiples | pnpm workspaces + Turborepo |
| Versionado de paquetes | Changesets |
| Distribución de bloques | registry propio compatible con manifiestos firmados |
| Workflows de agente durables | Temporal |
| Autorización de herramientas | Cedar/OPA |
| Agente editorial | OpenAI Agents SDK |
| Agente de código | Codex App Server en sandbox |
| Integraciones | MCP con allowlist |
| Observabilidad | OpenTelemetry |

No cambiaremos de npm a pnpm ni convertiremos el repositorio en monorepo durante el núcleo editorial. Payload recomienda pnpm, pero el proyecto funciona actualmente con npm; una migración simultánea no mejora al visitante y dificulta aislar errores. Se reconsiderará al separar paquetes.

## 17. Fuentes de la ampliación

- [Atomic Design — metodología original](https://atomicdesign.bradfrost.com/chapter-2/)
- [Puck — repositorio oficial](https://github.com/puckeditor/puck)
- [Puck — React Server Components](https://puckeditor.com/docs/integrating-puck/server-components)
- [Puck — migración de datos](https://puckeditor.com/docs/integrating-puck/data-migration)
- [Puck — permisos](https://puckeditor.com/docs/api-reference/permissions)
- [Lexical — repositorio oficial](https://github.com/facebook/lexical)
- [Payload Website Template](https://github.com/payloadcms/payload/blob/main/templates/website/README.md)
- [Payload Jobs Queue](https://payloadcms.com/docs/jobs-queue/overview)
- [Storybook — component testing](https://storybook.js.org/docs/writing-tests/component-testing)
- [Playwright — comparación visual](https://playwright.dev/docs/test-snapshots)
- [Playwright — accesibilidad](https://playwright.dev/docs/accessibility-testing)
- [dnd-kit — repositorio oficial](https://github.com/clauderic/dnd-kit)
- [Changesets — repositorio oficial](https://github.com/changesets/changesets)
- [Dependabot — actualizaciones](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-version-updates)
- [Turborepo — caché](https://turborepo.dev/docs/core-concepts/remote-caching)
- [OpenAI Agents SDK JS](https://github.com/openai/openai-agents-js)
- [Temporal — ejecución durable](https://docs.temporal.io/workflow-execution)
- [Cedar — repositorio oficial](https://github.com/cedar-policy/cedar)
- [MCP — especificación](https://github.com/modelcontextprotocol/modelcontextprotocol)

## 18. Restricción de coste, rendimiento y libertad creativa

### Decisión

El piloto tendrá un objetivo de **cero coste recurrente incremental**, pero no se presentará como una garantía perpetua. Un producto comercial, tráfico alto, retención larga, colaboración o IA intensiva acabarán generando costes de infraestructura. El diseño evitará costes fijos prematuros y permitirá sustituir proveedores.

### Presupuesto inicial

| Recurso | Estrategia del piloto | Coste incremental objetivo |
| --- | --- | ---: |
| Payload core | Autohospedado, MIT | 0 |
| Puck core | OSS MIT; sin Puck Cloud | 0 |
| Base de datos | Neon Free con scale-to-zero | 0 dentro de límites |
| Medios | Cloudflare R2 Standard | 0 dentro de límites |
| Analítica | Vercel incluido o Umami Hobby mediante adapter | 0 dentro de límites |
| CI y actualizaciones | GitHub Actions/Dependabot | 0 dentro de límites |
| IA | Desactivada por defecto; presupuesto explícito al activarla | variable |

Payload y Puck ofrecen núcleos MIT gratuitos. Puck Cloud es un producto separado y de pago; no es necesario para el editor visual base. No incorporaremos dependencias cloud de Puck en el piloto.

Neon Free ofrece actualmente 100 CU-horas mensuales y 0,5 GB por proyecto, con scale-to-zero. R2 Standard incluye 10 GB-mes, un millón de operaciones Class A, diez millones Class B y egress a Internet gratuito. Estos márgenes son razonables para un portfolio de bajo tráfico, pero deberán medirse.

Vercel Hobby es gratuito, pero sus condiciones lo restringen a uso personal no comercial. El portfolio piloto puede mantenerse allí mientras siga siendo personal. Al vender el editor o utilizar el despliegue como servicio comercial será necesario Vercel Pro —actualmente desde 20 USD/mes— o migrar el runtime a otro proveedor.

### Cómo impedir coste inesperado

- Adaptadores para base de datos, objetos y analítica.
- Límites de almacenamiento, uploads y transformaciones.
- Dashboard de consumo y alertas al 50/75/90 %.
- Hard limits cuando el proveedor lo permita.
- Imágenes procesadas una vez y servidas desde caché/CDN.
- Jobs agrupados y ejecutados fuera del request del visitante.
- IA opt-in con techo diario/mensual, estimación previa y cancelación.
- Sin proveedores comerciales como requisito del formato de contenido.
- Exportación periódica de contenido y medios.

### Cómo impedir peso público

- Rutas y bundles administrativos separados.
- Puck y Lexical cargados únicamente dentro del panel.
- Ningún SDK de edición en las páginas públicas.
- Render de bloques con Server Components cuando proceda.
- Consultas CMS en build/revalidación o caché, no una consulta completa por visitante.
- Importaciones dinámicas para componentes 3D y multimedia.
- Presupuestos CI de JavaScript, imágenes, LCP, INP y CLS.
- Comparación contra el checkpoint antes de cada migración.

El árbol JSON de composición no obliga a enviar el editor al navegador público. El visitante recibe el resultado renderizado y solo el JavaScript interactivo que ya necesita cada componente.

### Cómo preservar libertad creativa

Habrá dos niveles complementarios:

1. **Modo seguro del owner:** contenido, orden, variantes, tokens y movimiento dentro de contratos probados.
2. **Bloques de autor:** componentes React completamente personalizados para composiciones singulares.

Una sección experimental o artística no tendrá que reducirse a bloques genéricos. Se registra como 'CustomFeatureBlock', con sus propios campos y controles. El editor puede colocarla y configurarla; su implementación visual sigue teniendo libertad completa.

Los tokens tampoco deben homogenizarlo todo. Tendremos tokens globales, tokens de tema/proyecto y excepciones encapsuladas. El sistema busca consistencia operativa, no uniformidad estética.

### Costes inevitables si el proyecto prospera

- hosting comercial;
- mayor retención y recuperación de base de datos;
- almacenamiento y transformaciones de medios;
- pruebas visuales cloud multi-browser;
- ejecución de agentes y modelos;
- colas/workers durables;
- observabilidad y soporte;
- correo transaccional;
- dominios, seguridad y cumplimiento multi-tenant.

El criterio correcto no es “que nunca cueste”, sino que el coste aparezca únicamente cuando exista uso o valor que lo justifique, sea visible en el dashboard y pueda controlarse.

### Fuentes de coste verificadas

- [Payload self-hosted MIT](https://payloadcms.com/get-started)
- [Puck licencia MIT](https://github.com/puckeditor/puck/blob/main/LICENSE)
- [Puck Cloud pricing](https://puckeditor.com/pricing)
- [Vercel pricing](https://vercel.com/pricing)
- [Vercel Hobby y uso no comercial](https://vercel.com/docs/plans/hobby)
- [Neon pricing](https://neon.com/pricing)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Umami Cloud FAQ](https://docs.umami.is/docs/cloud/faq)

## 19. Conector Figma, edición no destructiva y permisos de IA

### Decisión

La importación desde Figma será una función prioritaria del panel. No se tratará como un simple campo de URL ni como una captura automática opaca: será un flujo asistido, trazable y reversible. El owner conecta su cuenta, pega el enlace de un archivo o nodo, revisa las propuestas y confirma qué frame se incorpora.

Para el piloto personal puede utilizarse un token personal con alcance mínimo. La arquitectura definitiva usará una aplicación OAuth 2 de Figma con `file_content:read`; es el mecanismo adecuado para un producto que actúa en nombre de distintos usuarios. La autenticación del panel, la autorización de Figma y la activación de IA son credenciales y permisos independientes.

### Flujo de importación

1. El owner conecta Figma mediante OAuth en el navegador.
2. Pega una URL de archivo, sección, frame o componente. El backend extrae `file_key` y `node-id`.
3. El conector consulta únicamente los nodos necesarios, genera miniaturas por lotes y mantiene caché para respetar los límites de Figma.
4. Una IA puede clasificar candidatos usando nombre del nodo, jerarquía, dimensiones, contexto del proyecto y miniatura renderizada.
5. La interfaz muestra varias propuestas, explicación breve y nivel de confianza. La selección final siempre es humana.
6. El nodo elegido se exporta y se copia al almacenamiento propio. No se enlazan directamente las URL temporales de Figma.
7. Se guarda procedencia: URL, archivo, nodo, nombre, versión, fecha, ajustes de exportación y hash.
8. Si Figma cambia, “Actualizar desde Figma” prepara una nueva versión y una previsualización; no sustituye lo publicado sin confirmación.

Los endpoints de archivos e imágenes de Figma están sujetos a límites que dependen de plan y asiento. Por eso se agruparán nodos en una petición, se usarán caché, cola y backoff, y la actualización será bajo demanda o por webhook cuando resulte apropiado. Las URL de image fills expiran en un máximo de 14 días, por lo que el activo final debe residir en nuestro almacenamiento.

### Editor de imagen y marco

El original importado será inmutable. El editor guardará una receta de presentación, no píxeles sobrescritos:

- recorte y relación de aspecto;
- zoom y punto focal X/Y;
- desplazamiento dentro del marco;
- modo `cover` o `contain`;
- tamaño y variante del marco;
- radios, fondo y preset visual permitidos;
- excepciones por breakpoint solo cuando sean necesarias.

El modelo separará `MediaAsset` (original, metadatos, procedencia y derivados) de `MediaPlacement` (encuadre aplicado en un bloque). Así una misma imagen puede tener encuadres distintos y restaurarse sin pérdida. Se generarán derivados AVIF/WebP responsivos una sola vez; el panel cargará el editor y la librería de recorte, pero la web pública no cargará ninguna dependencia administrativa.

### Centro de conectores y permisos

Cada conector tendrá estado, identidad conectada, scopes, último uso, caducidad y revocación. Los interruptores no serán meramente visuales: el servidor comprobará la política antes de cada operación.

Permisos separados por capacidad:

- conectado/desconectado;
- leer/listar;
- importar/copiar;
- proponer con IA;
- modificar borradores;
- publicar;
- ejecutar cambios de código.

Los tokens estarán cifrados en servidor y nunca llegarán al navegador público ni se incluirán en el contexto del modelo. Toda acción sensible producirá registro de auditoría. Publicar, borrar, desplegar o sustituir una versión requerirá confirmación explícita, aunque el conector esté activo.

### OpenAI, ChatGPT y Codex

El login del owner seguirá siendo el login del propio panel. Para la IA editorial, la opción sólida es una integración servidor-servidor con la Responses API y una clave de proyecto o cuenta de servicio con scopes y presupuesto limitados. No se basará el producto en asumir que cualquier usuario puede transferir al panel su suscripción de ChatGPT mediante un OAuth universal.

La IA editorial recibirá herramientas pequeñas y tipadas —por ejemplo `listFigmaNodes`, `proposeAsset`, `createDraft` o `updatePlacement`— y no acceso general a la base de datos. La Responses API admite herramientas propias y selección restringida de herramientas, lo que encaja con el panel de capacidades.

Codex se reservará para cambios de código o creación de bloques que excedan los controles del CMS. Se ejecutará fuera del request público, en un checkout aislado, y entregará diff, pruebas y preview antes de poder fusionar. No tendrá acceso directo a producción.

La capa de aplicación será neutral al proveedor (`AIProvider` + catálogo de capacidades). Esto permite evaluar más adelante Claude y Gemini sin rehacer el CMS ni los permisos. Copilot se estudiará como integración de desarrollo, no como requisito del editor editorial.

### Fases recomendadas

1. Conector Figma de solo lectura, explorador de frames, importación manual y procedencia.
2. Editor no destructivo de encuadre y derivados responsivos.
3. Sugerencias visuales con IA, siempre con confirmación.
4. Actualización/diff desde Figma, auditoría y límites de consumo.
5. Agente editorial; después agente de código aislado.
6. Adaptadores para otros modelos únicamente tras medir utilidad, coste y seguridad.

### Fuentes verificadas

- [Figma — autenticación REST](https://developers.figma.com/docs/rest-api/authentication/)
- [Figma — OAuth apps](https://developers.figma.com/docs/rest-api/oauth-apps/)
- [Figma — scopes](https://developers.figma.com/docs/rest-api/scopes/)
- [Figma — archivos e imágenes](https://developers.figma.com/docs/rest-api/file-endpoints/)
- [Figma — límites de uso](https://developers.figma.com/docs/rest-api/rate-limits/)
- [OpenAI — crear una respuesta con herramientas propias](https://developers.openai.com/api/reference/cli/resources/responses/methods/create)
- [OpenAI — claves de cuenta de servicio por proyecto](https://developers.openai.com/api/reference/cli/resources/admin/subresources/organization/subresources/projects/subresources/service_accounts/subresources/api_keys/methods/create)
