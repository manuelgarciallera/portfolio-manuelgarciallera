import type { CaseStudy } from './types'

export const CASES: CaseStudy[] = [
  {
    slug: 'buy-sell-marketplace',
    index: '01',
    title: 'Buy&Sell ',
    titleAccent: 'Marketplace',
    claim: 'Un marketplace tecnológico construido en equipo: mi contribución conecta dirección UX/UI, sistema de diseño e implementación frontend.',
    summary:
      'Trabajo Fin de Máster (Full Stack Development, UNIR). Un marketplace de compraventa con panel de gestión, tres roles con permisos diferenciados y un sistema de diseño atomizado primero en Figma y llevado después, componente a componente, a Angular.',
    year: '2026',
    context: 'TFM · Máster Full Stack Development (UNIR) · Proyecto completo con proceso de equipo',
    role: 'Lead UX/UI y portavoz del equipo · sistema de diseño · implementación frontend de registro y perfil',
    stack: ['Figma', 'Angular', 'Node.js', 'Express', 'Bootstrap', 'MySQL', 'Next.js'],
    tags: 'Figma → Angular · CRM · Roles · MySQL',
    proofPoints: [
      { value: '3 roles', label: 'permisos y recorridos diferenciados' },
      { value: 'Figma → Angular', label: 'sistema llevado a componentes' },
      { value: 'Full stack', label: 'interfaz conectada a API y datos' },
    ],
    contribution: 'Dirección UX/UI, sistema de diseño e implementación frontend de los flujos de registro y perfil',
    collaboration: 'Proyecto realizado en equipo durante el TFM; mi autoría se limita a la contribución descrita en este caso',
    disclosure: 'Proyecto académico funcional. No se presenta como producto comercial ni como trabajo individual.',
    published: true,
    visual: {
      theme: 'buy-sell',
      logoSrc: '/projects/buy-sell/logo-lockup.svg',
      logoAlt: 'Buy&Sell',
      kicker: 'Marketplace tecnológico',
      statement: 'Diseño, producto y sistema full stack. De la investigación al código.',
      slides: [
        { label: 'Fundamentos', src: '/projects/buy-sell/figma-brand-navigation-hd.webp', alt: 'Marca, tokens y navegación del sistema de diseño Buy&Sell', description: 'La identidad deja de ser decoración y se convierte en reglas compartidas para navegar, informar y actuar.' },
        { label: 'Componentes', src: '/projects/buy-sell/figma-list-states-hd.webp', alt: 'Componentes de lista y estados del sistema de diseño Buy&Sell', description: 'Cada variante expresa un estado del producto y mantiene el mismo contrato entre Figma, interfaz y datos.' },
        { label: 'Experiencia', src: '/projects/buy-sell/product-hd.webp', alt: 'Detalle de producto del marketplace Buy&Sell', description: 'Información, confianza y acción conviven en una ficha que ayuda a decidir sin esconder el estado del artículo.' },
        { label: 'Producto final', src: '/projects/buy-sell/home-hd.webp', alt: 'Inicio del marketplace Buy&Sell', description: 'El sistema completo reúne exploración, roles y operaciones reales en una experiencia implementada.' },
      ],
    },
    story: [
      {
        id: 'opening',
        kind: 'brand-scene',
        eyebrow: 'Una identidad que se convierte en producto',
        title: 'De la materia al marketplace.',
        body: 'El azul construye el espacio, el blanco ordena la información y el naranja activa el intercambio.',
      },
      {
        id: 'context',
        kind: 'narrative',
        eyebrow: 'Contexto y arquitectura',
        title: 'Un mismo producto. Tres formas de decidir.',
        body: 'Compradores, vendedores y moderación comparten el sistema, pero necesitan permisos, señales y recorridos diferentes.',
        image: {
          src: '/projects/buy-sell/home-hd.webp',
          alt: 'Página de exploración implementada del marketplace Buy&Sell',
          fit: 'contain',
        },
      },
      {
        id: 'system',
        kind: 'system',
        eyebrow: 'Sistema de diseño',
        title: 'Los fundamentos toman forma.',
        body: 'Tokens, navegación, estados y componentes se organizan antes de construir las pantallas.',
        image: {
          src: '/projects/buy-sell/figma-brand-navigation-hd.webp',
          alt: 'Fundamentos, marca y navegación del sistema de diseño Buy&Sell',
          fit: 'contain',
        },
      },
      {
        id: 'journey',
        kind: 'journey',
        eyebrow: 'Experiencia de producto',
        title: 'Explorar, comprender y actuar.',
        body: 'La interfaz convierte el catálogo, la confianza y el estado de cada artículo en decisiones legibles.',
        image: {
          src: '/projects/buy-sell/product-hd.webp',
          alt: 'Detalle de producto implementado en Buy&Sell',
          fit: 'contain',
        },
      },
      {
        id: 'implementation',
        kind: 'implementation',
        eyebrow: 'Producto implementado',
        title: 'El sistema sobrevive al traspaso.',
        body: 'Figma define el lenguaje; Angular, Node y MySQL demuestran cómo funciona con componentes, permisos y datos reales.',
        image: {
          src: '/projects/buy-sell/figma-list-states-hd.webp',
          alt: 'Componentes de lista y estados del sistema de diseño Buy&Sell',
          fit: 'contain',
        },
        links: [
          { kind: 'product', label: 'Ver el producto implementado', href: '#fase-desarrollo' },
          {
            kind: 'figma',
            label: 'Explorar el sistema en Figma',
            href: 'https://www.figma.com/design/ilgPpOdrbhQoPV25IgWXfK/Buy-Sell?node-id=0-1',
            external: true,
          },
        ],
      },
    ],
    links: [
      {
        label: 'Explorar la evidencia en Figma',
        href: 'https://www.figma.com/design/ilgPpOdrbhQoPV25IgWXfK/Buy-Sell?node-id=0-1',
      },
    ],
    phases: [
      {
        id: 'research',
        title: 'Problema',
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
        title: 'Sistema',
        paragraphs: [
          'El sistema de diseño se construyó en Figma por atomización estricta: átomos (badge, button, icon, toast), moléculas (cards, buscador, user-card) y organismos (headers por rol, paneles de moderación, informes de administración). Cada componente se diseñó con sus variantes y estados antes de existir en código.',
          'La prueba de que la atomización no fue cosmética: el header no es un componente, son cuatro. Guest, usuario, moderador y administrador tienen cabeceras distintas porque sus permisos son distintos. La jerarquía visual replica la jerarquía de permisos.',
          'El prototipo funcional navegable en Figma permitió validar los flujos completos por rol antes de escribir la primera línea de Angular.',
        ],
      },
      {
        id: 'ia',
        title: 'IA + criterio',
        paragraphs: [
          'La IA se integró como acelerador documentado, no como autor. Se utilizó para explorar variantes de componentes, acelerar scaffolding repetitivo y contrastar decisiones de arquitectura; la decisión final fue humana en cada fase, contrastando claridad, accesibilidad, coherencia con el sistema y viabilidad técnica.',
        ],
      },
      {
        id: 'desarrollo',
        title: 'Implementación',
        paragraphs: [
          'Como lead UX/UI definí el lenguaje visual y la estructura del sistema compartido. En desarrollo llevé a Angular los flujos de registro, perfil y edición de perfil, cuidando la correspondencia con sus versiones desktop y mobile.',
          'El producto completo conectó Angular, una API Node/Express y MySQL. Backend y base de datos fueron responsabilidad de otro integrante; mi trabajo consistió en diseñar la experiencia y conectar mi parte del frontend con los contratos del equipo.',
          'La implementación reveló la distancia entre un prototipo ideal y un producto colectivo: restricciones del shell compartido, dependencias del API y componentes desarrollados por distintas personas. Esa negociación forma parte del caso, no se oculta.',
        ],
      },
      {
        id: 'validacion',
        title: 'Evidencia',
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
    slug: 'laliga-club-operations-hub',
    index: '02',
    title: 'LaLiga ',
    titleAccent: 'Hub de Clubes',
    claim: 'Una plataforma multirol para convertir intercambios documentales complejos en procesos gobernados, trazables y comprensibles.',
    summary:
      'Caso en evolución de una plataforma conceptual para clubes, infraestructura y marca. El sistema combina espacios por organización, permisos derivados del servidor, expedientes con estados verificables y una interfaz adaptable a la identidad de cada club.',
    year: '2026',
    context: 'Proyecto conceptual de consultoría tecnológica · datos sintéticos',
    role: 'Dirección de producto, decisiones L3 y validación del sistema',
    contribution: 'Dirección de producto y criterio L3; definición de prioridades, revisión visual y validación del sistema',
    collaboration: 'Claude: Figma y sistema visual · Codex: arquitectura, implementación, datos y pruebas',
    disclosure: 'Caso en evolución con datos sintéticos. No representa un despliegue oficial ni una adopción pública por LaLiga. Marcas y escudos pertenecen a sus respectivos titulares.',
    status: 'evolving',
    stack: ['Figma', 'React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    tags: 'Producto multirol · Design system · Figma → código',
    proofPoints: [
      { value: '3 espacios', label: 'club, infraestructuras y marca' },
      { value: 'Multi-tenant', label: 'aislamiento y permisos del servidor' },
      { value: '4 modos', label: 'desktop, mobile, claro y oscuro' },
    ],
    published: true,
    visual: {
      theme: 'laliga',
      logoSrc: '/projects/laliga/logo-negative.svg',
      logoAlt: 'LaLiga · Hub de Clubes',
      kicker: 'Operaciones de clubes',
      statement: 'Documentación gobernada, identidad adaptable y decisiones trazables.',
      slides: [
        { label: 'Experiencia club', src: '/projects/laliga/club-home-hd.webp', alt: 'Inicio del espacio de gestión documental de Málaga CF con datos sintéticos', description: 'La portada convierte permisos, actividad y accesos frecuentes en una agenda operativa comprensible para cada club.' },
        { label: 'Vista infraestructura', src: '/projects/laliga/infrastructure-home-hd.webp', alt: 'Panel de infraestructuras para coordinar documentación con múltiples clubes', description: 'La misma arquitectura cambia de escala para coordinar expedientes entre organizaciones sin perder responsables ni trazabilidad.' },
        { label: 'Sistema oscuro', src: '/projects/laliga/club-dark-hd.webp', alt: 'Variante oscura de la experiencia de club', description: 'El modo oscuro conserva jerarquía, estados y contraste; no es una inversión automática de colores.' },
        { label: 'Adaptación mobile', src: '/projects/laliga/club-mobile-hd.webp', alt: 'Inicio de club adaptado a una pantalla móvil', description: 'En móvil se priorizan las decisiones urgentes y los accesos más frecuentes, manteniendo el contexto del club.', fit: 'contain' },
      ],
    },
    phases: [
      {
        id: 'research',
        title: 'Problema',
        paragraphs: [
          'La dificultad no era diseñar otro panel de indicadores. Era ordenar una relación documental con muchos clubes, departamentos y responsabilidades sin perder quién debe actuar, sobre qué versión y con qué evidencia.',
          'El encuadre separó tres superficies —club, infraestructuras y marca— y convirtió permisos, estados y organización en parte del diseño. La interfaz debía ayudar a decidir sin ocultar la complejidad que protege el proceso.',
        ],
        bullets: ['Necesidades por rol', 'Estados del expediente', 'Aislamiento por organización', 'Supervisión por excepción'],
      },
      {
        id: 'prototipo',
        title: 'Sistema',
        paragraphs: [
          'El sistema visual se planteó como una estructura gobernada: tokens compartidos, temas de club acotados y componentes capaces de cambiar de identidad sin alterar la jerarquía funcional.',
          'Desktop, mobile, claro y oscuro no son cuatro diseños independientes. Comparten navegación, estados, permisos y reglas de contraste; solo cambia aquello que pertenece realmente al contexto de cada organización.',
        ],
      },
      {
        id: 'ia',
        title: 'Producto + IA',
        paragraphs: [
          'La experiencia reúne expedientes, adjuntos, notificaciones, auditoría y un asistente que responde con evidencia. La IA no sustituye el circuito de aprobación: trabaja dentro de permisos, fuentes y estados visibles.',
          'La home se deriva del rol autenticado y combina accesos operativos con los indicadores que requieren atención. El objetivo es reducir navegación sin convertir el panel en una colección de métricas decorativas.',
        ],
      },
      {
        id: 'desarrollo',
        title: 'Implementación',
        paragraphs: [
          'El proyecto se construyó con una separación estricta entre núcleo y contenido: autorización server-side, aislamiento multi-tenant, puertos y adaptadores, temas gobernados y contratos verificables.',
          'Claude desarrolló el sistema visual y los contratos de Figma; Codex tradujo la arquitectura a código, datos y pruebas. Mi responsabilidad fue dirigir prioridades, resolver decisiones L3 y revisar que producto, diseño e implementación convergieran.',
        ],
      },
      {
        id: 'validacion',
        title: 'Evidencia',
        paragraphs: [
          'La validación incluye comparaciones Figma-código, recorridos de navegador, controles de autorización y aislamiento, pruebas de recuperación y auditorías visuales en desktop y mobile.',
          'El caso se publica como evolución, no como cierre: el producto funciona localmente con datos sintéticos, pero la convergencia del menú principal y algunos refinamientos de interfaz siguen abiertos.',
        ],
      },
    ],
    ai: {
      tool: 'Claude · Codex · Coordination Hub',
      phase: 'Diseño, implementación, revisión cruzada y verificación',
      humanInput: 'Dirección de producto, prioridades, criterios de aceptación y decisiones L3',
      output: 'Sistema visual en Figma, arquitectura ejecutable, pruebas y evidencia de paridad',
      criteria: 'Trazabilidad, seguridad, claridad por rol, coherencia visual y posibilidad de evolución',
      limits: 'Sin datos reales, publicación privada y ninguna afirmación de adopción oficial',
      decision: 'Humana en decisiones externas, irreversibles o de posicionamiento',
    },
    figmaLayers: [
      'foundations / color gobernado · tipografía · spacing · temas claro/oscuro',
      'components / navbar · section tabs · tiles · KPI cards · estados',
      'patterns / club · infraestructuras · marca · desktop · mobile',
      'handoff / nodeIds · contratos · comparación visual Figma-código',
    ],
    learnings: [
      'Un tema de marca solo es seguro cuando modifica tokens permitidos y conserva jerarquía, contraste y comportamiento.',
      'Los permisos deben derivarse del servidor; una pestaña visible no es un modelo de autorización.',
      'La revisión Figma-código gana valor cuando produce evidencia comparable y no una impresión subjetiva de parecido.',
    ],
    futureQuestion: '¿Cómo puede una interfaz multirol hacer visible la gobernanza sin añadir carga cognitiva a quienes solo necesitan completar una tarea?',
  },
  {
    slug: 'coordination-hub',
    index: '03',
    title: 'Coordination ',
    titleAccent: 'Hub',
    claim: 'Dos IAs trabajando como un equipo real: protocolo, evidencia y consenso verificable, sin una persona haciendo de mensajero.',
    summary:
      'Herramienta interna que coordina a varias IAs sobre un mismo proyecto. Registro de eventos inmutable, protocolo MCP, niveles de autonomía L0–L3 y un requisito que lo cambia todo: para que algo se llame consenso, tiene que estar revisado por otro y sostenido en evidencia.',
    year: '2026',
    context: 'Producto propio · infraestructura de método, construida mientras se usaba',
    role: 'Dirección de producto, arquitectura de decisión, especificación y revisión independiente del código',
    contribution: 'Dirección de producto, arquitectura de decisión y definición de los contratos de supervisión humano‑IA',
    collaboration: 'Claude y Codex trabajaron como agentes con funciones diferenciadas, coordinados mediante el propio Hub y bajo decisiones humanas L3',
    status: 'experimental',
    stack: ['Node.js', 'MCP', 'JSONL', 'Zod', 'Claude', 'OpenAI/Codex'],
    tags: 'Multi-agente · MCP · Gobernanza L0–L3',
    proofPoints: [
      { value: '95 pruebas', label: 'contratos y recuperación verificados' },
      { value: 'L0–L3', label: 'autonomía con autoridad humana' },
      { value: 'MCP', label: 'coordinación entre sesiones separadas' },
    ],
    published: true,
    visual: {
      theme: 'coordination',
      logoSrc: '/projects/coordination-hub/logo.svg',
      logoAlt: 'Coordination Hub',
      kicker: 'Human–AI coordination',
      statement: 'Trazabilidad, revisión independiente y autoridad humana.',
      slides: [
        { kind: 'coordination-diagram', diagramVariant: 'flow', label: 'Flujo verificable', src: 'diagram:flow', alt: 'Flujo verificable entre Manuel, Claude y Codex', description: 'Cada solicitud, revisión y resultado conserva autoría, contexto y una evidencia que puede volver a consultarse.' },
        { kind: 'coordination-diagram', diagramVariant: 'autonomy', label: 'Autonomía L0–L3', src: 'diagram:autonomy', alt: 'Niveles de autonomía con decisión humana en L3', description: 'La autonomía crece con la reversibilidad; las decisiones externas o irreversibles siguen reservadas a la persona.' },
        { kind: 'coordination-diagram', diagramVariant: 'consensus', label: 'Puerta de consenso', src: 'diagram:consensus', alt: 'Consenso condicionado a revisión independiente', description: 'Un agente no puede certificar su propia propuesta: el acuerdo exige revisión independiente y criterios explícitos.' },
        { kind: 'coordination-diagram', diagramVariant: 'verification', label: 'Verificación', src: 'diagram:verification', alt: 'Pruebas, políticas y evidencia del sistema', description: 'Las promesas del método se convierten en contratos, pruebas y reglas que fallan de forma visible cuando algo no encaja.' },
      ],
    },
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
    slug: 'the-ux-union',
    index: '04',
    title: 'TheUX',
    titleAccent: 'Union',
    claim: 'Una comunidad de diseño donde la reputación se construye con proyectos, aprendizaje y contribuciones verificables.',
    summary: 'Evolución de TheUXUnion desde una propuesta de comunidad y exploración visual hasta un MVP implementado en Next.js. El producto investiga cómo conectar talento, portfolio, aprendizaje y oportunidades sin convertir la red profesional en una colección de contactos.',
    year: '2026',
    context: 'Producto propio · comunidad profesional de diseño · MVP en evolución',
    role: 'Fundador, dirección de producto, identidad, UX/UI e implementación',
    contribution: 'Visión de producto, dirección visual, arquitectura de la experiencia y desarrollo del MVP',
    collaboration: 'Proceso iterativo con apoyo de IA para exploración visual, contraste de arquitectura y aceleración de implementación; dirección y selección finales humanas',
    status: 'evolving',
    disclosure: 'El MVP actual valida la propuesta y la dirección visual. Autenticación, backend y los flujos completos de reputación y oportunidades permanecen en desarrollo.',
    stack: ['Figma', 'React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    tags: 'Producto propio · Comunidad · Identidad · Next.js',
    proofPoints: [
      { value: '0 → MVP', label: 'de propuesta visual a producto' },
      { value: 'Next.js', label: 'arquitectura modular implementada' },
      { value: 'Responsive', label: 'jerarquía desktop y mobile' },
    ],
    published: true,
    visual: {
      theme: 'theuxunion',
      logoSrc: '/projects/theuxunion/logo.svg',
      logoAlt: 'TheUXUnion',
      kicker: 'Design community',
      statement: 'Menos contactos acumulados. Más proyectos, mérito y conexiones con sentido.',
      slides: [
        { label: 'Mobile · Descubrir', src: '/projects/theuxunion/mobile-discover-figma-hd.webp', alt: 'Pantalla mobile Descubrir de TheUXUnion diseñada en Figma', description: 'La portada mobile reúne proyectos, oportunidades y conversación en una jerarquía compacta, con navegación persistente y estados reconocibles.', fit: 'contain' },
        { label: 'Mobile · Nodos', src: '/projects/theuxunion/mobile-nodes-figma-hd.webp', alt: 'Pantalla mobile de actividad y nodos de TheUXUnion diseñada en Figma', description: 'Los nodos convierten conexiones y contribuciones en señales visibles de actividad dentro de la comunidad.', fit: 'contain' },
        { label: 'Sistema · Identidad', src: '/projects/theuxunion/design-system-foundations-figma-hd.webp', alt: 'Sistema de identidad de TheUXUnion con logotipo, isotipo e imagotipo', description: 'El sistema documenta las relaciones entre marca verbal, símbolo, red y adaptaciones para distintos contextos.' },
        { label: 'Sistema · Componentes', src: '/projects/theuxunion/design-system-components-figma-hd.webp', alt: 'Biblioteca de botones, estados, migas de pan y enlaces de TheUXUnion', description: 'Botones, estados y navegación se construyen como piezas reutilizables para sostener una experiencia coherente.' },
        { label: 'Desktop implementado', src: '/projects/theuxunion/mvp-implemented-hd.webp', alt: 'MVP desktop de TheUXUnion implementado en Next.js', description: 'El MVP concentra esa ambición en una arquitectura modular, responsive y preparada para probar la entrada por mérito.' },
        { label: 'Pitch · Nodos', src: '/projects/theuxunion/pitch-nodes-figma-hd.webp', alt: 'Lámina del pitch de TheUXUnion que explica el sistema de mérito mediante nodos', description: 'La presentación traduce la propuesta de reputación en una historia visual: cada nodo representa una competencia validada y una trayectoria que puede leerse.' },
      ],
    },
    links: [{ label: 'Recorrer el MVP público', href: 'https://manuelgarciallera.github.io/theuxunion/' }],
    phases: [
      {
        id: 'research',
        title: 'Problema',
        paragraphs: [
          'Las redes profesionales permiten acumular contactos, pero explican mal cómo trabaja una persona, qué ha aprendido y qué valor aporta a una comunidad. TheUXUnion nace para convertir esa información dispersa en una trayectoria legible.',
          'La hipótesis central es que el prestigio puede construirse mediante señales contextualizadas —proyectos, formación, feedback y contribución— en lugar de depender únicamente de alcance, autopromoción o número de conexiones.',
        ],
        bullets: ['Propuesta de valor', 'Mapa de actores', 'Señales de reputación', 'Recorrido landing → acceso → perfil'],
      },
      {
        id: 'prototipo',
        title: 'Sistema',
        paragraphs: [
          'La identidad combina un fondo oscuro y técnico con una capa visual expresiva. El color pertenece al contenido y a los estados importantes; la estructura, los textos y los controles mantienen una base sobria.',
          'La evolución ha permitido separar una exploración gráfica inicialmente amplia de un sistema de producto más disciplinado: navegación, módulos, tarjetas y adaptaciones responsive reutilizables.',
        ],
      },
      {
        id: 'ia',
        title: 'Producto + IA',
        paragraphs: [
          'El concepto reúne perfiles vivos, nodos de afinidad, portfolio, recursos, coworking, eventos y oportunidades. El MVP actual concentra el esfuerzo en explicar ese ecosistema y probar la entrada por mérito.',
          'La IA se usa para abrir direcciones visuales y acelerar variaciones, pero la edición es deliberada: las imágenes seleccionadas sostienen una idea concreta de identidad y no sustituyen investigación, arquitectura ni jerarquía.',
        ],
      },
      {
        id: 'desarrollo',
        title: 'Implementación',
        paragraphs: [
          'La primera versión estática evolucionó hacia una aplicación Next.js con TypeScript, componentes independientes, navegación responsive, selector de tema y una landing modular preparada para incorporar nuevos flujos.',
          'El producto implementado sigue siendo un MVP: muestra propuesta, marca y estructura de entrada, pero todavía no debe confundirse con la plataforma completa de reputación, autenticación y oportunidades descrita en la visión.',
        ],
      },
      {
        id: 'validacion',
        title: 'Evidencia',
        paragraphs: [
          'El caso conserva las distintas capas de evolución —primeras versiones desktop/mobile, dirección visual e implementación actual— para que la mejora sea visible y no quede reducida a una pantalla final.',
          'El caso conecta ahora el prototipo Hi‑Fi mobile, el sistema de identidad, la biblioteca de componentes, el MVP desktop y la presentación de producto mediante exportaciones HD procedentes de los archivos de Figma.',
        ],
      },
    ],
    ai: {
      tool: 'Claude · Codex · herramientas de generación visual',
      phase: 'Exploración de identidad, contraste de producto y desarrollo del MVP',
      humanInput: 'Visión, propuesta de valor, selección estética, arquitectura y criterios de producto',
      output: 'Variantes visuales, estructuras candidatas y aceleración de componentes',
      criteria: 'Coherencia de marca, legibilidad, singularidad, utilidad y viabilidad responsive',
      limits: 'Una imagen llamativa no demuestra un flujo ni una hipótesis; cada artefacto se etiqueta por lo que realmente evidencia',
      decision: 'Humana: dirección, selección, poda y alcance final',
    },
    figmaLayers: [
      'foundations / marca · color · tipografía · ritmo espacial',
      'wireframes / arquitectura · acceso · perfil · nodos',
      'components / navegación · tarjetas · módulos · controles',
      'responsive / desktop · mobile · estados · jerarquía',
    ],
    learnings: [
      'Una identidad intensa necesita una estructura silenciosa que permita leerla sin convertir toda la experiencia en estímulo.',
      'La reputación solo es comprensible cuando cada señal conserva contexto, procedencia y relación con trabajo real.',
      'Mostrar la evolución del producto es más honesto y más útil que presentar un MVP como si fuera la visión completa.',
    ],
    futureQuestion: '¿Qué señales permiten construir confianza profesional sin reproducir las dinámicas de popularidad de una red social?',
  },
  {
    slug: 'fintech-app',
    index: '05',
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
    index: '06',
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
