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
    slug: 'the-ux-union',
    index: '02',
    title: 'The UX ',
    titleAccent: 'Union',
    claim: 'Plataforma y comunidad para perfiles UX: producto, estrategia y MVP.',
    summary: 'Caso en preparación. Producto propio: plataforma para perfiles UX con estrategia de comunidad.',
    year: '2026',
    context: 'Producto propio',
    role: 'Diseño de producto, estrategia, MVP',
    stack: ['Figma', 'Next.js'],
    tags: 'Producto · Comunidad · Estrategia',
    published: false,
    phases: [],
    ai: { tool: '', phase: '', humanInput: '', output: '', criteria: '', limits: '', decision: '' },
    figmaLayers: [],
    learnings: [],
    futureQuestion: '',
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
