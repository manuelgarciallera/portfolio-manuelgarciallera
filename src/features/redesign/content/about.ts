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
  'Un diseñador que construye lo que diseña, y que llegó al software desde los objetos.'

export const ABOUT_INTRO = [
  'Mi formación no fue lineal, y esa es la parte útil. Empecé en una escuela de arte, pasé por el diseño como sistema, me detuve en la cultura material para escribir sobre ella, y terminé aprendiendo a levantar en código lo que antes solo podía dibujar.',
  'De ahí sale una forma concreta de trabajar: entiendo el producto digital como un objeto que se percibe antes de usarse, sé investigarlo con método, y sé llevarlo hasta el navegador sin que se pierda por el camino.',
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
    title: 'Los objetos como testimonio',
    place: 'Trabajo de Fin de Grado · cultura material alemana',
    contribution:
      'El giro teórico. Comparar objetos cotidianos de dos sistemas políticos enfrentados para leer, en su forma y su tacto, lo que cada uno esperaba de las personas. De aquí nace mi línea de investigación sobre lo háptico y lo óptico.',
  },
  {
    index: '04',
    title: 'Diseño de Experiencia de Usuario',
    place: 'Máster oficial universitario',
    contribution:
      'El método aplicado a lo digital: investigación con usuarios, arquitectura de la información, sistemas de diseño y evaluación. La disciplina que convierte una intuición en una decisión defendible.',
  },
  {
    index: '05',
    title: 'Desarrollo Full Stack',
    place: 'Máster propio · 60 ECTS',
    contribution:
      'La capacidad de construir. Front-end, servidor y base de datos: lo que permite que un prototipo llegue a producción sin intermediarios y sin perder fidelidad.',
  },
]

export const ABOUT_NOW = [
  'Trabajo en diseño visual dentro de una organización grande, donde los sistemas tienen que sobrevivir a muchos equipos y mucho tiempo.',
  'En paralelo desarrollo mi propia línea: interfaces que recuperan algo de la dimensión material que el diseño digital perdió, y flujos de trabajo donde la IA ejecuta lo sistemático y la persona conserva el criterio.',
  'Esa línea tiene continuidad académica: investigación en interacción persona-ordenador, con el tránsito de lo háptico a lo óptico como eje.',
]

export const ABOUT_FACTS: AboutFact[] = [
  { label: 'Base', value: 'Madrid' },
  { label: 'Idiomas', value: 'Español · Inglés' },
  { label: 'Práctica', value: 'UX/UI · Sistemas de diseño · Front-end' },
  { label: 'Investigación', value: 'HCI · Cultura material · Háptico y óptico' },
]

export const ABOUT_CLOSING =
  'Lo que me diferencia no es ninguna de las cinco etapas por separado: es que se explican entre sí.'
