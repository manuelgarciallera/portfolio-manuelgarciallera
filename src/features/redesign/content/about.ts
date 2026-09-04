export interface AboutLayer {
  index: string
  title: string
  place: string
  contribution: string
}

export interface AboutFact {
  label: string
  value: string
}

export const ABOUT_STATEMENT =
  'Empecé diseñando marcas, objetos y espacios. Hoy conecto investigación, sistemas e implementación para construir productos digitales.'

export const ABOUT_INTRO = [
  'Mi formación no fue lineal. Dejé Derecho para estudiar Diseño Gráfico en la Escuela de Arte San Telmo y seguir una vocación que después me llevó al diseño integral, la identidad, los objetos y el espacio.',
  'En LALIGA aprendí a trabajar dentro de una organización grande y junto a perfiles de ingeniería: a convertir información compleja en algo legible, a mantener una identidad en contextos muy distintos y a diseñar para decisiones que afectan a más personas que quien tiene delante la pantalla.',
  'Los másteres en UX/UI y desarrollo Full Stack añadieron dos piezas que necesitaba: investigar antes de proponer y poder implementar después. Desde entonces pienso cada interfaz como un sistema de relaciones, estados, datos y componentes que tiene que resistir fuera de Figma.',
]

/**
 * Las cinco capas. El orden importa: no es una lista de titulaciones, es una
 * progresión en la que cada etapa explica la siguiente.
 */
export const ABOUT_LAYERS: AboutLayer[] = [
  {
    index: '01',
    title: 'Diseño gráfico publicitario',
    place: 'Escuela de Arte · Formación Profesional Superior',
    contribution:
      'La raíz: oficio, composición y persuasión. Aquí se aprende que una pieza tiene que emocionar antes de argumentar, y que eso se puede trabajar, no solo intuir.',
  },
  {
    index: '02',
    title: 'Diseño Integral y Gestión de la Imagen',
    place: 'Universidad Rey Juan Carlos · Grado',
    contribution:
      'El salto del encargo suelto al sistema: identidad, coherencia y gestión de la imagen como estructura, no como decoración.',
  },
  {
    index: '03',
    title: 'Diseño visual y espacial',
    place: 'LALIGA · Departamento de Infraestructuras',
    contribution:
      'La práctica dentro de una organización grande: comunicación visual, identidad aplicada, documentación, arquitectura y modelos 3D para proyectos internacionales. Aquí entendí que el diseño también organiza decisiones y coordina equipos.',
  },
  {
    index: '04',
    title: 'Diseño de Experiencia de Usuario',
    place: 'UNIR · Máster oficial · 9,6/10',
    contribution:
      'El método aplicado a lo digital: investigación con usuarios, arquitectura de la información, sistemas de diseño y evaluación. La disciplina que convierte una intuición en una decisión defendible.',
  },
  {
    index: '05',
    title: 'Desarrollo Full Stack',
    place: 'UNIR + KSchool · Máster · 9,5/10',
    contribution:
      'La capacidad de construir y comprobar. Angular, Next.js, Node.js y MySQL me permiten pensar más allá de la pantalla y entender cómo datos, permisos y arquitectura sostienen el producto.',
  },
]

export const ABOUT_NOW = [
  'Actualmente lidero la función de diseño visual dentro del equipo de Infraestructuras de LALIGA. Trabajo entre ingeniería, marca y comunicación para que información técnica, espacios y soluciones digitales mantengan una lógica común.',
  'En paralelo desarrollo aplicaciones propias: CRM y hubs multiusuario y multitenant con Angular, Next.js, Node.js y MySQL. Son proyectos en evolución que utilizo para comprobar cómo un sistema diseñado en Figma se comporta cuando recibe usuarios, datos y permisos reales.',
  'Trabajo a diario con distintas IAs y con MCP porque necesito conocer sus fortalezas y sus límites. Las utilizo para explorar alternativas, automatizar tareas repetibles y acelerar la implementación; la dirección, la revisión y las decisiones irreversibles siguen siendo humanas.',
  'Mi orientación investigadora se centra en los sistemas de diseño implementados y automatizados mediante IA: cómo hacerlos estables, escalables y auditables sin borrar el criterio humano que les da sentido.',
  'Como práctica complementaria, trabajo con modelado 3D y arquitectura de interiores. Es el espacio donde sigo entrenando escala, luz, materialidad y composición, capacidades que después traslado al diseño digital.',
]

export const ABOUT_FACTS: AboutFact[] = [
  { label: 'Base', value: 'Madrid' },
  { label: 'Idiomas', value: 'Español · Inglés' },
  { label: 'Práctica', value: 'Product Design · UX/UI · Sistemas · Front-end' },
  { label: 'Práctica espacial', value: '3D · Arquitectura de interiores' },
  { label: 'Investigación', value: 'HCI · Sistemas de diseño · Interacción humano-IA' },
]

export const ABOUT_CLOSING =
  'No veo estas etapas como cambios de profesión. Son capas de una misma forma de trabajar: comprender el problema, darle forma y construir una solución que pueda evolucionar.'
