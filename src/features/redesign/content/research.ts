export const RESEARCH_STATEMENT =
  'Investigo cómo las interfaces —y la inteligencia artificial integrada en ellas— ayudan a las personas a comprender, decidir y actuar. La pregunta no es nueva: la traje del estudio de objetos físicos, donde empezó.'

export const RESEARCH_QUESTION =
  '¿En qué medida el diseño del siglo XX desplazó la dimensión háptica hacia lo óptico, por qué motivos, y qué efecto tiene recuperarla sobre la comprensión, la confianza y la decisión de quien usa una interfaz contemporánea?'

export const RESEARCH_INTRO: readonly string[] = [
  'Vengo del objeto antes que de la pantalla. Esa procedencia no es una anécdota biográfica: es lo que me permite mirar una interfaz y preguntarme qué se perdió por el camino, en lugar de darla por dada.',
  'La investigación está abierta y quiero que se note. Hay dos polos en tensión deliberada y no los cierro aquí: uno histórico y material, otro empírico y aplicado. Lo que publico se escribe desde su intersección.',
]

export interface ResearchRootObject {
  readonly name: string
  readonly note: string
}

export const RESEARCH_ROOT_OBJECTS: readonly ResearchRootObject[] = [
  { name: 'Moccadolly', note: 'La cafetera como objeto doméstico donde el gesto todavía tiene resistencia.' },
  { name: 'Trabant', note: 'Producción escasa que conserva materialidad donde la abundancia la eliminó.' },
  { name: 'Braun SK4', note: 'La bisagra: el funcionalismo convierte el objeto en superficie óptica.' },
  { name: 'El molinillo de mi padre', note: 'El caso que no está en ningún catálogo y sostiene el argumento entero.' },
]

export const RESEARCH_ROOT: readonly string[] = [
  'El trabajo empezó comparando objetos de diseño de la RDA y la RFA entre 1949 y 1989. Dos sistemas políticos produciendo utensilios para las mismas manos, con recursos distintos y con ideas opuestas sobre qué debe hacer un objeto.',
  'Lo que encontré es sensorial antes que estético: en ese corpus, el funcionalismo occidental retira textura, peso, resistencia y temperatura, y deja en su lugar una superficie cada vez más óptica. Lo que se ve creció; lo que se toca, no. Es la lectura que defiendo de un conjunto acotado de objetos, no una ley general del siglo XX.',
  'De ahí sale todo lo demás, y sale como hipótesis: si el desplazamiento de lo háptico a lo óptico empezó en los objetos, la interfaz digital no inaugura nada, es el punto más lejano de un recorrido que ya estaba en marcha. Hasta dónde aguanta esa continuidad es precisamente lo que queda por investigar.',
]

export interface ResearchLine {
  readonly index: string
  readonly title: string
  readonly body: string
  readonly status: string
}

export const RESEARCH_LINES: readonly ResearchLine[] = [
  {
    index: '01',
    title: 'Del objeto a la interfaz',
    body: 'Genealogía háptico-óptica: de la cultura material del siglo XX a la interfaz contemporánea. El gesto sin textura, el bucle de recompensa como sustituto emocional del tacto, la voz como desaparición del cuerpo.',
    status: 'Línea histórica y material',
  },
  {
    index: '02',
    title: 'Interfaces que ayudan a decidir',
    body: 'HCI aplicado y medible: cómo una interfaz con IA integrada cambia lo que una persona entiende, en qué confía y qué acaba haciendo. Es la línea que exige prototipos, participantes y métricas; su diseño experimental está por construir.',
    status: 'Línea empírica y aplicada',
  },
  {
    index: '03',
    title: 'Sistemas de diseño como gramáticas',
    body: 'Un sistema de diseño no organiza: legisla. Determina qué puede y qué no puede decirse en una pantalla. Línea complementaria, escrita desde la práctica en producto real.',
    status: 'Alimenta artículos, no tesis',
  },
]

export const RESEARCH_METHOD: readonly string[] = [
  'Research through Design en el sentido de Frayling: el proyecto no ilustra la investigación, es uno de sus instrumentos. Cada caso publicado aquí debe dejar por escrito qué se preguntó, qué se decidió y qué se descartó. Ese es el criterio con el que los escribo y con el que hay que juzgarlos.',
  'Diseño centrado en las personas según ISO 9241-210 y doble diamante para estructurar el trabajo aplicado: encuadre, investigación, sistema, prototipo, desarrollo y validación, con la evidencia que corresponde a cada fase.',
  'Y una regla que me impongo: distinguir siempre lo medido de lo inferido. Una estimación presentada como dato es el error más caro que puede cometer alguien que investiga.',
]

export const RESEARCH_FRAMEWORK: readonly string[] = [
  'Alois Riegl · óptico y háptico',
  'Vilém Flusser · filosofía del objeto',
  'Jean Baudrillard · el sistema de los objetos',
  'Maurice Merleau-Ponty · fenomenología del cuerpo',
  'Dieter Rams · el funcionalismo como bisagra',
  'Donald Norman · affordances',
  'Kristina Höök · somaesthetic design',
  'Christopher Frayling · research through design',
]

export const RESEARCH_CLOSING =
  'Ninguna de estas líneas está cerrada, y no tengo prisa por cerrarlas antes de tiempo. Lo que sí está decidido es desde dónde miro: el objeto como punto de entrada, la paradoja como motor y el caso construido como prueba.'
