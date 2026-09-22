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
      'Aquí empecé a trabajar la composición, la tipografía y la comunicación visual de forma consciente. Aprendí a preguntarme qué debía transmitir cada pieza y a justificar las decisiones que tomaba.',
  },
  {
    index: '02',
    title: 'Diseño Integral y Gestión de la Imagen',
    place: 'Universidad Rey Juan Carlos · Grado',
    contribution:
      'Amplié esa mirada hacia los objetos, los espacios y la identidad. Mi TFG me llevó a estudiar cómo el diseño cotidiano refleja la sociedad que lo produce y cómo nos relacionamos con él a través de los sentidos.',
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
    place: 'UNIR · Máster oficial · 9,56/10',
    contribution:
      'Profundicé en investigación con usuarios, arquitectura de la información, sistemas de diseño y evaluación. Me interesaba aprender a contrastar una propuesta con las necesidades de las personas, no quedarme únicamente con mi impresión como diseñador.',
  },
  {
    index: '05',
    title: 'Desarrollo Full Stack',
    place: 'UNIR + KSchool · Máster · 9,86/10',
    contribution:
      'La capacidad de construir y comprobar. Angular, Next.js, Node.js y MySQL me permiten pensar más allá de la pantalla y entender cómo datos, permisos y arquitectura sostienen el producto.',
  },
]

export const ABOUT_NOW = [
  'Actualmente lidero la función de diseño visual dentro del equipo de Infraestructuras de LALIGA. Trabajo entre ingeniería, marca y comunicación para que información técnica, espacios y soluciones digitales mantengan una lógica común.',
  'En paralelo desarrollo aplicaciones propias, entre ellas un CMS y un Hub de coordinación entre IAs. Son proyectos en evolución con los que pruebo sistemas de componentes, flujos de edición y permisos. Distingo lo que ya puedo verificar en un prototipo de lo que aún necesita pruebas antes de utilizarse en producción.',
  'Trabajo a diario con Claude, Codex y herramientas conectadas mediante MCP. Antes de incorporar una tecnología intento entender cómo se comporta durante un proyecto completo: qué mantiene bien, dónde pierde contexto y qué debo comprobar yo. También he hecho pruebas de IA local; quiero profundizar en ella, pero prefiero consolidar lo que estoy utilizando antes de ampliar el conjunto de herramientas.',
  'Disfruto compartiendo lo que voy aprendiendo. He acompañado a nuevos ingenieros en su incorporación a la empresa y me gusta explicar el contexto, resolver dudas y facilitar un ambiente en el que preguntar resulte natural. Esa parte didáctica también está muy presente en cómo documento y presento mis proyectos.',
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

export interface AboutCredential {
  title: string
  institution: string
  detail?: string
}

/**
 * El bloque que lee en diez segundos quien te busca: un supervisor academico
 * antes de contestar un correo, o alguien de seleccion antes de abrir un caso.
 * Esa informacion existia repartida entre tres paginas y ninguna la reunia.
 *
 * Solo titulaciones cursadas y sus centros. Nada de habilitaciones, equivalencias
 * ni potenciales: eso lo sabe leer quien tiene que leerlo.
 */
export const ABOUT_CREDENTIALS: AboutCredential[] = [
  {
    title: 'Máster en Desarrollo Full Stack',
    institution: 'UNIR · KSchool',
    detail: '9,86 / 10',
  },
  {
    title: 'Máster oficial en Diseño de Experiencia de Usuario',
    institution: 'UNIR',
    detail: '9,56 / 10',
  },
  {
    title: 'Grado en Diseño Integral y Gestión de la Imagen',
    institution: 'Universidad Rey Juan Carlos',
  },
  {
    title: 'Diseño Gráfico Publicitario',
    institution: 'Escuela de Arte San Telmo · Formación Profesional Superior',
  },
]
