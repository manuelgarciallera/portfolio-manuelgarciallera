export interface ProcessPhase {
  index: string
  title: string
  intent: string
  decides: string
  executes: string
  evidence: string
}

export interface ProcessPrinciple {
  title: string
  body: string
}

/**
 * El método. No es una promesa de servicio: es el procedimiento real con el que
 * se han producido los casos publicados, con la frontera explícita entre lo que
 * decide una persona y lo que ejecuta la IA.
 */
export const PROCESS_STATEMENT =
  'Un método sirve para algo cuando el segundo proyecto cuesta la mitad que el primero sin perder calidad.'

export const PROCESS_INTRO = [
  'Trabajo con un procedimiento fijo. No porque el diseño sea mecánico, sino justo por lo contrario: cuanto más resueltas están las decisiones repetibles, más tiempo queda para las que no lo son.',
  'Cada fase produce un artefacto verificable y deja escrito por qué se decidió así. Eso permite auditar el resultado, retomarlo meses después y transferirlo a otro proyecto sin empezar de cero.',
]

export const PROCESS_PHASES: ProcessPhase[] = [
  {
    index: '01',
    title: 'Encuadre',
    intent: 'Definir el problema, la audiencia y la restricción real antes de dibujar nada.',
    decides: 'Problema, alcance, criterios de éxito y qué queda fuera.',
    executes: 'Recopilación de contexto, síntesis de material previo.',
    evidence: 'Enunciado del problema y criterios de aceptación escritos.',
  },
  {
    index: '02',
    title: 'Research',
    intent: 'Entender el terreno con métodos, no con intuición.',
    decides: 'Qué métodos aplican y qué hallazgos son relevantes.',
    executes: 'Benchmark, evaluación heurística, ordenación de hallazgos.',
    evidence: 'Benchmark comparado, heurísticas con severidad, arquitectura de información.',
  },
  {
    index: '03',
    title: 'Sistema',
    intent: 'Tokens y componentes antes que pantallas. Sin sistema no hay escala.',
    decides: 'Dirección de arte, jerarquía, escala tipográfica, carácter del movimiento.',
    executes: 'Andamiaje de variables, estados de componente, comprobación de contraste.',
    evidence: 'Colección de tokens y componentes con todos sus estados definidos.',
  },
  {
    index: '04',
    title: 'Prototipo',
    intent: 'Pantallas montadas con instancias del sistema, navegables desde el primer día.',
    decides: 'Composición, flujo y qué se prueba antes de programar.',
    executes: 'Montaje de variantes, responsive, documentación de estados.',
    evidence: 'Prototipo navegable y responsive en los puntos de ruptura acordados.',
  },
  {
    index: '05',
    title: 'Traspaso',
    intent: 'Del diseño al código sin traducción: los nombres del sistema son los mismos.',
    decides: 'Qué es contrato y qué es implementación libre.',
    executes: 'Lectura estructurada del diseño, generación de componentes, pruebas.',
    evidence: 'Componentes en código que replican la jerarquía del sistema de diseño.',
  },
  {
    index: '06',
    title: 'Verificación',
    intent: 'Lo que no se comprueba, no está hecho.',
    decides: 'Umbral de calidad aceptable y qué deuda se declara.',
    executes: 'Pruebas, auditoría de accesibilidad, medición de rendimiento.',
    evidence: 'Suite en verde, contraste validado, comparación diseño-navegador.',
  },
]

export const PROCESS_AI_LAYER: ProcessPrinciple[] = [
  {
    title: 'Qué decide la persona',
    body: 'El problema, la dirección de arte, la jerarquía, el criterio de calidad y todo lo irreversible. El gusto no se delega porque no es automatizable: es el resultado de una formación y una mirada.',
  },
  {
    title: 'Qué ejecuta la IA',
    body: 'El trabajo sistemático: andamiaje de componentes y estados, revisión de accesibilidad, generación de variantes para elegir, documentación y verificación. Acelera; no dirige.',
  },
  {
    title: 'Cómo se controla',
    body: 'Niveles de autonomía explícitos, revisión independiente antes de dar nada por acordado, y registro de cada decisión con su responsable y su evidencia. Si no se puede auditar, no vale.',
  },
]

export const PROCESS_PRINCIPLES: ProcessPrinciple[] = [
  {
    title: 'Sistema antes que pantalla',
    body: 'Diseñar pantallas sueltas produce trabajo bonito e irrepetible. Diseñar el sistema produce trabajo que crece.',
  },
  {
    title: 'Evidencia sobre afirmación',
    body: 'Cada caso muestra el artefacto real: el componente, el código, la prueba. Y declara lo que no se hizo.',
  },
  {
    title: 'La estética es función',
    body: 'Lo que se percibe como bello se percibe como más usable. El cuidado visual no es acabado: es parte del rendimiento del producto.',
  },
  {
    title: 'Podar lo que no acelera',
    body: 'Toda capa de método que no haga el siguiente proyecto más rápido o mejor se elimina. El procedimiento existe para producir, no para lucirse.',
  },
]
