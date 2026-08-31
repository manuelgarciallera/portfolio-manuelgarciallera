# Ampliación del escaparate de proyectos

Fecha: 2026-08-31

## Objetivo

Convertir la home y las páginas de caso en una exposición coherente de la práctica de Manuel García-Llera: investigación HCI, diseño de producto, sistemas de diseño e implementación. Buy&Sell funciona como primer patrón; The UX Union, Coordination Hub y LaLiga lo amplían sin convertirse en copias visuales.

La entrada a cada proyecto debe ser limpia, agradable y comprensible antes de pedir lectura. La evolución se muestra como evidencia, no como una cronología exhaustiva.

## Principio editorial

Cada caso responde, en este orden, a cinco preguntas:

1. **Problema:** ¿qué situación o necesidad originó el proyecto?
2. **Sistema:** ¿qué reglas, arquitectura y componentes se diseñaron?
3. **Producto:** ¿cómo se materializa en una experiencia reconocible?
4. **Implementación:** ¿qué llegó a funcionar y qué contribución realizó Manuel?
5. **Evidencia:** ¿qué puede revisar una persona externa y qué queda pendiente?

La tarjeta de la home ofrece una síntesis visual. La página interior desarrolla el razonamiento. Figma, código y demos son evidencias secundarias, nunca la identidad profesional principal.

## Arquitectura visual compartida

### Tarjeta de home

- Panel de identidad propio del proyecto dentro del portfolio blanco/negro.
- Lockup o nombre del proyecto, una frase de valor y una secuencia de 3–5 vistas.
- Imágenes rectas, sin perspectiva artificial.
- Una imagen activa; las demás se cargan bajo demanda.
- Controles anterior, siguiente, pausa y selección directa.
- Acción única: **Explorar el caso**.

### Cabecera del caso

- Título, afirmación breve y alcance real del proyecto.
- Panel visual con la misma secuencia de la tarjeta, a mayor escala.
- Dos accesos internos: **Explorar el sistema** y **Ver la implementación**.
- Metadatos: contexto, contribución, stack, año y estado.
- La fase de madurez será explícita: publicado, experimental o en evolución.

### Evolución

La evolución se expresa con una secuencia de artefactos seleccionados:

1. exploración o wireframe;
2. sistema o fundamentos;
3. prototipo Hi‑Fi;
4. versión implementada;
5. evidencia de validación, cuando exista.

No se mostrará una galería documental indiscriminada. Cada vista tendrá una etiqueta que explique qué demuestra.

## Casos

### 01 · Buy&Sell Marketplace

Estado: publicado. Continúa como patrón de referencia.

Firma visual: azul de marca contenido en el panel; producto, fundamentos, componentes y experiencia.

Mensaje principal: liderazgo UX/UI y sistema de diseño dentro de un TFM colectivo, con implementación frontend propia claramente delimitada.

### 02 · The UX Union

Estado: publicar como caso completo cuando estén incorporadas las exportaciones de Figma.

Firma visual: montaje editorial vivo construido con el lenguaje gráfico del proyecto. La intensidad cromática queda contenida en su panel para no contaminar el portfolio.

Secuencia:

1. propuesta de valor y universo de marca;
2. wireframes y arquitectura;
3. prototipo Hi‑Fi desktop;
4. sistema de diseño;
5. adaptación mobile;
6. implementación Next.js como estado actual.

Fuentes disponibles: aplicación local y recursos gráficos de hasta 1670 px. Fuentes pendientes: los dos enlaces de Figma mencionados por Manuel, que no llegaron en el mensaje.

### 03 · Coordination Hub

Estado: publicado; falta presentación visual.

Firma visual: diagrama operativo monocromo con estados y trazas, acompañado por una captura o representación del producto. Debe parecer una herramienta de supervisión, no una ilustración futurista genérica.

Secuencia:

1. problema de coordinación;
2. flujo solicitud → revisión → consenso;
3. niveles de autonomía L0–L3;
4. evidencia técnica y pruebas;
5. interfaz de supervisión, cuando exista.

Mensaje principal: diseño de interacción humano‑IA, gobernanza y trazabilidad verificable.

### 04 · Hub de Clubes — proyecto LaLiga

Estado: **caso en evolución**.

Firma visual: rojo coral, azul noche y superficies blancas del producto; alternancia entre vista club, infraestructura y mobile.

Secuencia inicial con material local HD:

1. home de club 1440 px;
2. home de infraestructuras 1440 px;
3. variante oscura;
4. experiencia mobile 390 px presentada en composición, no ampliada hasta pixelar;
5. comparación Figma/implementación como evidencia de convergencia.

Mensaje principal: plataforma multi‑rol y multi‑tenant para gestión documental gobernada, desarrollada con datos sintéticos.

Reglas de publicación:

- declarar que está en evolución;
- mencionar datos sintéticos;
- no enlazar preview privada, credenciales, repositorio ni documentación interna;
- no afirmar despliegue oficial ni adopción por LaLiga;
- atribuir marca y escudos a sus titulares;
- describir con precisión la contribución de Manuel, Claude y Codex.

## Imágenes y rendimiento

- Exportar desde Figma a escala 2 cuando la fuente lo permita.
- Mantener un ancho fuente mínimo de 1600 px para vistas desktop principales.
- Convertir raster a WebP con calidad visual aproximada 86–90.
- Conservar SVG para logotipos y diagramas vectoriales.
- No ampliar capturas mobile; se presentarán en un marco proporcionado.
- Solo la primera imagen del caso puede tener prioridad de carga.
- Presupuesto recomendado: 250 KB por vista; excepción justificada hasta 400 KB.
- Alt descriptivo basado en lo que demuestra la imagen, no en su apariencia.

## Modelo de contenido

El modelo `CaseStudy` incorporará:

- `status`: publicado, experimental o en evolución;
- `contribution`: aportación personal resumida;
- `collaboration`: reparto de responsabilidades cuando corresponda;
- visuales etiquetados por etapa;
- evidencias externas separadas de las acciones principales;
- nota de divulgación o atribución cuando el caso lo requiera.

## Accesibilidad y movimiento

- Navegación completa por teclado.
- Pausa visible y persistente.
- Autoplay desactivado con `prefers-reduced-motion`.
- El avance automático no genera anuncios constantes a lectores de pantalla.
- Contraste AA en controles y etiquetas.
- En ausencia de JavaScript se conserva una primera imagen significativa.

## Verificación

- Pruebas unitarias del modelo y del carrusel.
- Revisión del orden y de la autoría en cada caso.
- Lint, TypeScript y build de producción.
- Comprobación visual en claro y oscuro.
- Comprobación responsive en panorámico, 16", 14", tablet y móviles XL/XS.
- Revisión del peso y dimensiones de cada recurso.

## Fuera de alcance inmediato

- Publicar la demo privada de LaLiga.
- Terminar funcionalidades pendientes de los productos fuente.
- Crear el CMS del blog.
- Convertir Something Human Lab en un producto independiente.

