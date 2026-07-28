import type { CaseStudy } from './types'

export const CASES: CaseStudy[] = [
  {
    slug: 'buy-sell-marketplace',
    index: '01',
    title: 'Buy&Sell ',
    titleAccent: 'Marketplace',
    claim: 'Un marketplace con CRM y tres roles: de la atomización en Figma al componente en producción, con la base de datos como fuente de verdad.',
    summary:
      'Trabajo Fin de Máster (Full Stack Development, UNIR). Un marketplace de compraventa con panel de gestión, tres roles con permisos diferenciados y un sistema de diseño atomizado primero en Figma y llevado después, componente a componente, a Angular.',
    year: '2026',
    context: 'TFM · Máster Full Stack Development (UNIR) · Proyecto completo con proceso de equipo',
    role: 'Diseño UX/UI, prototipado en Figma, frontend Angular, modelado de base de datos y API',
    stack: ['Figma', 'Angular (signals)', 'Node.js + Express', 'MySQL'],
    tags: 'Figma → Angular · CRM · Roles · MySQL',
    published: true,
    phases: [
      {
        id: 'research',
        title: 'Research',
        paragraphs: [
          'El punto de partida no fue una pantalla, sino una pregunta: ¿qué necesita ver cada tipo de persona dentro de un marketplace para poder actuar con confianza? Un comprador, un moderador y un administrador miran el mismo producto y necesitan cosas distintas.',
          'El benchmarking de marketplaces consolidados sirvió para mapear patrones ya validados por millones de usuarios (ficha de producto, estados de venta, señales de confianza del vendedor) y detectar dónde había espacio para decidir con criterio propio: el flujo de moderación.',
          'La decisión estructural del research: el flujo de moderación condiciona el modelo de datos. Un producto no está simplemente "publicado o no": vive en un ciclo de estados (borrador, publicado, en revisión, retirado, reservado, vendido) que determina qué ve cada rol. Esa máquina de estados nació en el research, no en el código.',
        ],
        bullets: [
          'Benchmarking de marketplaces de referencia',
          'Hipótesis de usuario por rol: comprador/vendedor, moderador, administrador',
          'Arquitectura de la información y mapa de estados del producto',
          'Site map y flujos por rol antes de dibujar una sola pantalla',
        ],
      },
      {
        id: 'prototipo',
        title: 'Prototipo',
        paragraphs: [
          'El sistema de diseño se construyó en Figma por atomización estricta: átomos (badge, button, icon, toast), moléculas (cards, buscador, user-card) y organismos (headers por rol, paneles de moderación, informes de administración). Cada componente se diseñó con sus variantes y estados antes de existir en código.',
          'La prueba de que la atomización no fue cosmética: el header no es un componente, son cuatro. Guest, usuario, moderador y administrador tienen cabeceras distintas porque sus permisos son distintos. La jerarquía visual replica la jerarquía de permisos.',
          'El prototipo funcional navegable en Figma permitió validar los flujos completos por rol antes de escribir la primera línea de Angular.',
        ],
      },
      {
        id: 'ia',
        title: 'IA en el proceso',
        paragraphs: [
          'La IA se integró como acelerador documentado, no como autor. Se utilizó para explorar variantes de componentes, acelerar scaffolding repetitivo y contrastar decisiones de arquitectura; la decisión final fue humana en cada fase, contrastando claridad, accesibilidad, coherencia con el sistema y viabilidad técnica.',
        ],
      },
      {
        id: 'desarrollo',
        title: 'Desarrollo',
        paragraphs: [
          'Cada componente de Figma se convirtió en un componente Angular con la misma jerarquía atómica: la carpeta components/ del frontend replica exactamente la estructura atoms / molecules / organisms del archivo de diseño. El sistema de diseño no se tradujo: se transfirió.',
          'La base de datos MySQL actúa como fuente de verdad de los roles y los estados. Los tipos del frontend no se inventan: mapean los enums de la base de datos, de modo que un estado imposible en la BBDD es un estado imposible en la interfaz.',
          'La API Node/Express media entre ambos mundos con endpoints por rol, y el CRM de gestión (usuarios, incidencias, informes) vive sobre los mismos componentes atomizados que la tienda.',
        ],
      },
      {
        id: 'validacion',
        title: 'Validación',
        paragraphs: [
          'La validación combinó revisión académica del TFM, pruebas funcionales de los flujos por rol y contraste heurístico de las interfaces contra los principios de usabilidad trabajados en el máster de UX/UI. El resultado: un sistema donde diseño, código y datos cuentan la misma historia.',
        ],
      },
    ],
    ai: {
      tool: 'Claude · Codex (asistentes de código y diseño)',
      phase: 'Exploración de variantes, scaffolding de componentes, contraste de arquitectura',
      humanInput: 'Sistema de diseño atomizado en Figma, modelo de datos, criterios de accesibilidad y coherencia',
      output: 'Variantes de componentes y estructuras candidatas para revisión',
      criteria: 'Claridad, accesibilidad, coherencia con el sistema, evidencia de usuario, viabilidad técnica',
      limits: 'La IA no decide jerarquías ni flujos; propone. Todo output se revisa contra el prototipo y el modelo de datos',
      decision: 'Humana en cada fase. La IA acelera; el criterio dirige',
    },
    figmaLayers: [
      'atoms / badge · button · button-icon · icon · link-icon · toast',
      'molecules / cards · buscador · user-card · user-contact · breadcrum · report-modal',
      'organisms / guest-header · user-header · moderator-header · admin-moderator-header',
      'organisms / admin · reports · incidents · historic-moderator',
    ],
    codeEvidence: {
      caption:
        'Componente real del TFM: el átomo Badge en Angular (signals). Sus variantes tipadas mapean literalmente el enum de MySQL — del prototipo al componente, y del componente al dato.',
      filename: 'frontend/src/app/components/atoms/badge/badge.ts',
      code: `import { Component, computed, input } from '@angular/core';
import { BadgeIcon, BadgeIconPosition } from './badge.types';

@Component({
  selector: 'atom-badge',
  templateUrl: './badge.html',
  styleUrl: './badge.css',
})
export class Badge {
  variant = input<string>('Como nuevo');
  icon = input<BadgeIcon>('none');
  iconPosition = input<BadgeIconPosition>('left');

  protected label = computed(() =>
    this.variant().replace(/_/g, ' ')
  );

  protected classes = computed(() =>
    \`app-badge app-badge--\${this.cssVariant()}\`
  );
}`,
    },
    dataMapping:
      "BadgeEstado = 'Borrador' | 'Publicado' | 'En_revision' | 'Retirado' | 'Reservado' | 'Vendido'  ←  enum MySQL de la tabla productos",
    learnings: [
      'La atomización en Figma solo vale si sobrevive al traspaso: la estructura de carpetas del frontend debe replicar la del archivo de diseño.',
      'El flujo de moderación es la parte del sistema que más condiciona el modelo de datos, no la más visible.',
      'Tipar el frontend contra los enums de la base de datos elimina toda una familia de estados imposibles.',
    ],
    futureQuestion:
      '¿Cómo afecta la arquitectura de la información a la adopción de un sistema de gestión por parte de roles no técnicos?',
  },
  {
    slug: 'coordination-hub',
    index: '02',
    title: 'Coordination ',
    titleAccent: 'Hub',
    claim: 'Dos IAs trabajando como un equipo real: protocolo, evidencia y consenso verificable, sin una persona haciendo de mensajero.',
    summary:
      'Herramienta interna que coordina a varias IAs sobre un mismo proyecto. Registro de eventos inmutable, protocolo MCP, niveles de autonomía L0–L3 y un requisito que lo cambia todo: para que algo se llame consenso, tiene que estar revisado por otro y sostenido en evidencia.',
    year: '2026',
    context: 'Producto propio · infraestructura de método, construida mientras se usaba',
    role: 'Dirección de producto, arquitectura de decisión, especificación y revisión independiente del código',
    stack: ['Node.js', 'MCP (Model Context Protocol)', 'Event sourcing · JSONL', 'Zod', 'node:test'],
    tags: 'Multi-agente · MCP · Gobernanza L0–L3',
    published: true,
    phases: [
      {
        id: 'research',
        title: 'Research',
        paragraphs: [
          'El problema apareció trabajando, no en un brief: al usar dos IAs sobre el mismo proyecto, la persona acaba convertida en cable de red. Copiar la respuesta de una, pegarla en la otra, volver a empezar. El coste no es el tiempo de copiar: es que las decisiones dejan de tener rastro y nadie sabe quién acordó qué.',
          'El mercado ya está poblado —marcos de orquestación multiagente de grandes proveedores— pero resuelven otro problema: agentes efímeros dentro de una aplicación. Aquí los agentes son productos distintos, con sesiones separadas, cuotas propias y ventanas de disponibilidad que se agotan. La pregunta de investigación fue esa: cómo coordinar agentes que no comparten memoria ni horario.',
          'La decisión estructural: no construir un agente soberano que decida por todos. Se separó la inteligencia de la autoridad. Una parte propone y razona; otra, determinista, autoriza. Ninguna IA puede ampliarse a sí misma los permisos.',
        ],
        bullets: [
          'Diagnóstico del coste real de la intermediación humana',
          'Comparación con marcos existentes y decisión de construir a medida',
          'Modelo de niveles de autonomía L0–L3, con L3 reservado a la persona',
          'Criterios de éxito medibles antes de escribir código',
        ],
      },
      {
        id: 'prototipo',
        title: 'Prototipo',
        paragraphs: [
          'La arquitectura se diseñó antes que la interfaz. Un registro de eventos append-only como única fuente de verdad, proyecciones de lectura por encima, y un motor de políticas que autoriza cada mutación. Nada se borra: el historial es el producto.',
          'Cada mensaje declara su naturaleza —hecho, inferencia, propuesta, objeción, revisión o resultado— y su clase de visibilidad. La interfaz distingue visualmente lo observado de lo inferido, porque presentar una estimación como dato exacto es el fallo más caro de un sistema de supervisión.',
          'El principio de diseño que gobierna la pantalla: supervisión por excepción. No una cuadrícula de métricas, sino una secuencia — qué necesita atención, qué trabajo está detenido, qué IA puede actuar, qué evidencia lo demuestra.',
        ],
      },
      {
        id: 'ia',
        title: 'IA en el proceso',
        paragraphs: [
          'Este caso es particular: la IA no es la herramienta del proyecto, es el sujeto del proyecto. Dos asistentes con fortalezas distintas se repartieron el trabajo por competencia — uno implementa, verifica y despliega; otro especifica, revisa e interroga la integridad — y se coordinaron por el propio Hub mientras lo construían.',
          'La dirección, los criterios de aceptación y toda decisión irreversible siguieron siendo humanas. El sistema está diseñado para que eso no dependa de la buena voluntad: las acciones irreversibles se reclasifican automáticamente al nivel que exige aprobación de la persona.',
        ],
      },
      {
        id: 'desarrollo',
        title: 'Desarrollo',
        paragraphs: [
          'El Hub expone sus operaciones como herramientas MCP, de modo que cada IA consulta su bandeja, acusa recibo, publica resultados y cierra temas desde su propia sesión, sin adaptadores a medida por producto.',
          'La fiabilidad se trató como requisito, no como pulido: claves de idempotencia para que un reenvío no duplique trabajo, control de concurrencia con un único ganador por transición, arrendamientos que expiran y un proceso de recuperación cuya regla es explícita — cero tareas huérfanas tras una caída o un agotamiento de cuota.',
          'El aislamiento entre proyectos no se confía a convenciones de nombres: cada evento lleva su clave de proyecto y una consulta de un proyecto no puede devolver contenido de otro.',
        ],
      },
      {
        id: 'validacion',
        title: 'Validación',
        paragraphs: [
          'La prueba real del método llegó cuando la revisión independiente encontró el fallo más grave del sistema en el propio sistema: la función que cerraba un tema como "consenso" no comprobaba que nadie más lo hubiera revisado. Cualquier agente podía declarar acuerdo en solitario, y el nivel de la decisión estaba fijado por código, esquivando el motor de políticas.',
          'Se corrigió elevando el consenso a contrato verificable: exige la petición original correlacionada, revisión de todos los revisores requeridos, imposibilidad de revisarse a uno mismo, y responsable, evidencia, reversibilidad y fecha de revisión obligatorios. El nivel se deriva; lo irreversible escala solo; lo que requiere aprobación humana únicamente lo cierra la persona.',
          'Verificación al cierre: 95 pruebas automatizadas en verde, política de seguridad de contenido estricta, ausencia comprobada de secretos y de rutas absolutas en lo que se muestra, sin desbordamiento horizontal entre 320 y 1440 píxeles, y un ensayo de migración sobre los datos reales con recuento e identificadores preservados.',
        ],
      },
    ],
    ai: {
      tool: 'Claude · Codex, coordinados entre sí por el propio Hub',
      phase: 'Todo el ciclo: especificación, implementación, revisión cruzada y verificación',
      humanInput: 'Problema, criterios de aceptación, arquitectura de decisión, prioridades y toda aprobación irreversible',
      output: 'Implementación, pruebas, revisiones independientes con hallazgos priorizados y evidencia',
      criteria: 'Evidencia verificable, reversibilidad, aislamiento entre proyectos, ausencia de secretos, pruebas en verde',
      limits: 'Ninguna IA amplía sus propios permisos, cierra una decisión irreversible ni declara consenso sin revisión ajena',
      decision: 'Humana en todo lo irreversible. Las IAs deciden lo reversible y lo dejan trazado',
    },
    figmaLayers: [
      'foundations / niveles de autonomía · estados de disponibilidad · clases de visibilidad',
      'organisms / cola de atención · línea temporal de conversación · panel de consenso',
      'organisms / registro de decisiones · inventario de agentes · cadena de evidencia',
    ],
    codeEvidence: {
      caption:
        'El corazón del sistema: la puerta de consenso. Antes bastaba con que un agente lo declarara; ahora exige revisión independiente de todos los revisores requeridos y deriva el nivel en lugar de fijarlo.',
      filename: 'src/store.mjs · resolveTopic()',
      code: `const requiredReviewers = [
  ...new Set(target.to.filter((agent) => agent !== parsed.from)),
]
if (requiredReviewers.length === 0) {
  throw new Error('Consensus requires an independent review')
}

const reviewedBy = requiredReviewers.filter((reviewer) =>
  events.some(
    (event) =>
      event.correlationId === target.id &&
      event.from === reviewer &&
      ['review', 'objection', 'result'].includes(event.messageKind),
  ),
)
if (reviewedBy.length !== requiredReviewers.length) {
  throw new Error('Consensus requires an independent review from: ...')
}

const level =
  parsed.reversibility === 'irreversible' ? 'L3' : topicLevel
if (level === 'L3' && parsed.from !== 'manuel') {
  throw new Error('L3 consensus may only be resolved by Manuel')
}`,
    },
    dataMapping:
      "consensusState = 'reviewed' | 'provisional' | 'lapsed'  ←  derivado de las revisiones registradas, no declarado por el agente que resuelve",
    learnings: [
      'Separar la inteligencia de la autoridad: que una parte proponga y otra determinista autorice es lo que impide que una recomendación se confunda con una decisión.',
      'Un acuerdo sin revisión ajena no es consenso, es una opinión con sello. Si el sistema no lo comprueba, acabará ocurriendo.',
      'La indisponibilidad por cuota no es un caso excepcional sino la norma: el diseño debe degradar de forma explícita en lugar de bloquearse.',
      'La trazabilidad sale gratis si se registra en el momento; reconstruirla después es imposible.',
    ],
    futureQuestion:
      '¿Qué necesita ver una persona para supervisar con confianza el trabajo de varios agentes autónomos sin leer todo lo que producen?',
  },
  {
    slug: 'fintech-app',
    index: '03',
    title: 'Fintech ',
    titleAccent: 'App',
    claim: 'Prototipado móvil con sistema de componentes.',
    summary: 'Caso en preparación. Prototipado móvil de producto financiero con design system.',
    year: '2025',
    context: 'Máster UX/UI (UNIR)',
    role: 'UX/UI, prototipado',
    stack: ['Figma'],
    tags: 'Prototipado móvil · Design system',
    published: false,
    phases: [],
    ai: { tool: '', phase: '', humanInput: '', output: '', criteria: '', limits: '', decision: '' },
    figmaLayers: [],
    learnings: [],
    futureQuestion: '',
  },
  {
    slug: 'estadio-3d',
    index: '04',
    title: 'Estadio ',
    titleAccent: '3D',
    claim: 'Visualización espacial y experiencia en entornos deportivos.',
    summary: 'Caso en preparación. Diseño espacial y visualización 3D en el entorno del deporte de élite.',
    year: '2025',
    context: 'Experiencia profesional',
    role: 'Diseño visual y espacial, 3D',
    stack: ['3D', 'Tiempo real'],
    tags: 'Visualización espacial · Experiencia',
    published: false,
    phases: [],
    ai: { tool: '', phase: '', humanInput: '', output: '', criteria: '', limits: '', decision: '' },
    figmaLayers: [],
    learnings: [],
    futureQuestion: '',
  },
]

export function getPublishedCases(): CaseStudy[] {
  return CASES.filter((item) => item.published)
}

export function getCaseBySlug(slug: string): CaseStudy | undefined {
  return CASES.find((item) => item.slug === slug)
}
