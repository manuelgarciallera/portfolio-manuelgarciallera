export interface ProcessPhase {
  index: string
  title: string
  image: string
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
  'Trabajo con método para que una intuición pueda explicarse, probarse y mejorar sin perder su parte humana.'

export const PROCESS_INTRO = [
  'No sigo estas fases como una receta cerrada. Las uso para liberar atención: cuando lo repetible tiene una estructura, puedo dedicar más tiempo a escuchar, interpretar y tomar las decisiones que de verdad cambian el producto.',
  'Cada fase deja una evidencia y una razón. Así puedo discutir el trabajo con otras personas, retomarlo meses después y reconocer con honestidad qué sabemos, qué estamos suponiendo y qué falta por comprobar.',
]

export const PROCESS_PHASES: ProcessPhase[] = [
  {
    index: '01',
    title: 'Encuadre',
    image: '/art/capabilities/spatial-light.webp',
    intent: 'Definir el problema, la audiencia y la restricción real antes de dibujar nada.',
    decides: 'Problema, alcance, criterios de éxito y qué queda fuera.',
    executes: 'Recopilación de contexto, síntesis de material previo.',
    evidence: 'Enunciado del problema y criterios de aceptación escritos.',
  },
  {
    index: '02',
    title: 'Investigación',
    image: '/art/capabilities/hci-material.webp',
    intent: 'Contrastar mis primeras impresiones con el contexto y las necesidades de las personas.',
    decides: 'Qué métodos aplican y qué hallazgos son relevantes.',
    executes: 'Análisis comparativo, evaluación heurística, ordenación de hallazgos.',
    evidence: 'Comparativa de referentes, heurísticas con severidad, arquitectura de información.',
  },
  {
    index: '03',
    title: 'Sistema',
    image: '/art/capabilities/design-system.webp',
    intent: 'Definir una base de tipografía, color, espaciado y componentes que pueda mantenerse al crecer.',
    decides: 'Dirección de arte, jerarquía, escala tipográfica, carácter del movimiento.',
    executes: 'Andamiaje de variables, estados de componente, comprobación de contraste.',
    evidence: 'Colección de tokens y componentes con todos sus estados definidos.',
  },
  {
    index: '04',
    title: 'Prototipo',
    image: '/art/capabilities/product-system.webp',
    intent: 'Pantallas montadas con instancias del sistema, navegables desde el primer día.',
    decides: 'Composición, flujo y qué se prueba antes de programar.',
    executes: 'Montaje de variantes, adaptación a distintos tamaños de pantalla, documentación de estados.',
    evidence: 'Prototipo navegable y adaptable a los tamaños de pantalla acordados.',
  },
  {
    index: '05',
    title: 'Traspaso',
    image: '/art/capabilities/frontend-surface.webp',
    intent: 'Mantener una relación reconocible entre los componentes de Figma y su implementación.',
    decides: 'Qué es contrato y qué es implementación libre.',
    executes: 'Lectura estructurada del diseño, generación de componentes, pruebas.',
    evidence: 'Componentes en código que replican la jerarquía del sistema de diseño.',
  },
  {
    index: '06',
    title: 'Verificación',
    image: '/art/capabilities/human-ai.webp',
    intent: 'Probar el resultado en el navegador y revisar lo que una prueba automática no puede valorar.',
    decides: 'Umbral de calidad aceptable y qué deuda se declara.',
    executes: 'Pruebas, auditoría de accesibilidad, medición de rendimiento.',
    evidence: 'Suite en verde, contraste validado, comparación diseño-navegador.',
  },
]

export const PROCESS_AI_LAYER: ProcessPrinciple[] = [
  {
    title: 'Qué decide la persona',
    body: 'Defino el problema, las prioridades y los criterios de calidad. La IA puede proponer alternativas, pero me corresponde valorar si tienen sentido para el usuario y asumir la decisión que tomamos.',
  },
  {
    title: 'Qué ejecuta la IA',
    body: 'La utilizo para explorar variantes, preparar componentes, revisar código y proponer pruebas. Le doy contexto y límites concretos. Después comparo el resultado con el diseño y con el comportamiento que esperaba.',
  },
  {
    title: 'Cómo se controla',
    body: 'Dejo por escrito qué puede hacer cada herramienta, qué necesita mi aprobación y cómo comprobaré el resultado. Cuando una decisión es importante, busco una revisión independiente y conservo el motivo del cambio.',
  },
]

export const PROCESS_PRINCIPLES: ProcessPrinciple[] = [
  {
    title: 'Sistema antes que pantalla',
    body: 'Me interesa que una buena decisión pueda repetirse. Por eso relaciono las pantallas con componentes, estados y reglas comunes, y reviso el sistema cuando aparece una necesidad nueva.',
  },
  {
    title: 'Evidencia sobre afirmación',
    body: 'Intento mostrar cómo he llegado al resultado: el prototipo, los componentes y las comprobaciones disponibles. También explico qué parte está en desarrollo o no se ha validado todavía.',
  },
  {
    title: 'La estética es función',
    body: 'Cuido la tipografía, los espacios y el movimiento porque influyen en cómo se entiende una interfaz. Si un efecto distrae o una composición dificulta leer, reviso la decisión aunque visualmente me guste.',
  },
  {
    title: 'Podar lo que no acelera',
    body: 'Adapto el método al problema. Me interesa documentar lo que facilita trabajar y aprender, sin añadir pasos que el equipo no necesita.',
  },
]
