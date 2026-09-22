import type { CaseStudy } from './types'

import { NUDE_PROJECT } from '../nude-project/content'

export const CASES: CaseStudy[] = [
  {
    slug: 'buy-sell-marketplace',
    index: '01',
    title: 'Buy&Sell ',
    titleAccent: 'Marketplace',
    claim: 'En un marketplace construido en equipo, conecté la dirección UX/UI, el sistema de diseño y la implementación frontend que asumí.',
    summary:
      'Trabajo Fin de Máster (Full Stack Development, UNIR). Trabajé en un marketplace de compraventa con panel de gestión, tres roles con permisos diferenciados y un sistema de diseño que llevé de Figma a Angular junto al equipo.',
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
        label: 'Abrir diseño en Figma',
        href: 'https://www.figma.com/design/ilgPpOdrbhQoPV25IgWXfK/Buy-Sell?node-id=0-1',
      },
    ],
    phases: [
      {
        id: 'research',
        title: 'Problema',
        paragraphs: [
          'Empecé por una pregunta, no por una pantalla: ¿qué necesita ver cada rol para actuar con criterio en un marketplace? Comprador, moderación y administración miran el mismo producto, pero toman decisiones distintas.',
          'Revisamos patrones habituales —ficha de producto, estados de venta y señales sobre el vendedor— para entender qué información sostiene cada recorrido. Ese análisis llevó mi atención al flujo de moderación, donde había que decidir qué se muestra y qué se bloquea.',
          'Con esa lectura definimos un ciclo de estados —borrador, publicado, en revisión, retirado, reservado y vendido— que condiciona el modelo de datos y la experiencia de cada rol. No traté el producto como una pantalla aislada: cada estado cambia quién puede hacer qué.',
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
          'En Figma organicé el sistema en átomos, moléculas y organismos para poder hablar de variantes y estados antes de abrir Angular. Badge, botón, tarjeta, buscador y panel se diseñaron como piezas que debían mantener una misma lógica al llegar al código.',
          'La diferencia entre roles apareció enseguida en las cabeceras: no necesitábamos un header genérico, sino accesos acordes con cada permiso. Usé esa distinción para que la jerarquía visual acompañara lo que cada persona puede consultar o gestionar.',
          'El prototipo navegable nos permitió recorrer los flujos por rol, detectar decisiones pendientes y ajustar la estructura antes de implementar mis partes del frontend.',
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
          'La evidencia que puedo mostrar combina la revisión académica del TFM, pruebas funcionales de los flujos por rol y un contraste heurístico con los principios trabajados en el máster de UX/UI. Me sirvió para revisar la correspondencia entre diseño, código y datos, sin presentar el ejercicio académico como una validación comercial.',
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
      'Aprendí que la atomización en Figma solo aporta valor si sobrevive al traspaso: la estructura del frontend necesita conservar esa lógica.',
      'El flujo de moderación condiciona el modelo de datos aunque apenas se vea en la portada del producto.',
      'Tipar el frontend contra los enums de la base de datos me ayudó a acotar estados que la interfaz no debería permitir.',
    ],
    futureQuestion:
      '¿Cómo afecta la arquitectura de la información a la adopción de un sistema de gestión por parte de roles no técnicos?',
  },
  {
    slug: 'laliga-club-operations-hub',
    index: '02',
    title: 'LaLiga ',
    titleAccent: 'Hub de Clubes',
    claim: 'Estoy explorando cómo una plataforma multirol puede hacer legibles intercambios documentales complejos sin perder su gobernanza.',
    summary:
      'Caso en evolución de una plataforma conceptual para clubes, infraestructura y marca. He planteado espacios por organización, permisos derivados del servidor, expedientes con estados verificables y una interfaz que puede adaptarse a la identidad de cada club.',
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
        { label: 'Experiencia club', src: '/projects/laliga/club-home-render-2x.webp', alt: 'Interfaz implementada del espacio de Málaga CF con datos sintéticos', description: 'La portada reúne actividad y accesos frecuentes para cada club. Captura real del desarrollo, a doble resolución y con datos de demostración.' },
        { label: 'Vista infraestructura', src: '/projects/laliga/infrastructure-home-render-2x.webp', alt: 'Interfaz implementada del espacio de infraestructuras con datos sintéticos', description: 'La vista de infraestructuras permite explorar la coordinación entre organizaciones. Esta captura muestra la evolución actual del desarrollo, con datos sintéticos.' },
        { label: 'Sistema oscuro', src: '/projects/laliga/club-dark-render-2x.webp', alt: 'Interfaz real de club en modo oscuro con datos de demostración', description: 'Reviso la jerarquía y los estados también en modo oscuro. Es una captura del modo implementado, no una inversión de colores de la imagen.' },
        { label: 'Adaptación móvil', src: '/projects/laliga/club-mobile-render-3x.webp', alt: 'Interfaz implementada del espacio de club adaptada a móvil, con datos sintéticos', description: 'En móvil priorizo los accesos frecuentes y mantengo el contexto del club. Captura real a triple resolución; puede ampliarse para revisar el detalle.', fit: 'contain' },
      ],
    },
    phases: [
      {
        id: 'research',
        title: 'Problema',
        paragraphs: [
          'Partí de una pregunta: ¿cómo ordenar una relación documental entre clubes, departamentos y responsabilidades sin perder quién debe actuar, sobre qué versión y con qué evidencia? No me interesaba sumar otro panel de indicadores.',
          'Separé club, infraestructuras y marca para analizar qué cambia con cada responsabilidad. Permisos, estados y organización pasan a ser parte del diseño: la interfaz tiene que ayudar a decidir sin esconder la complejidad que protege el proceso.',
        ],
        bullets: ['Necesidades por rol', 'Estados del expediente', 'Aislamiento por organización', 'Supervisión por excepción'],
      },
      {
        id: 'prototipo',
        title: 'Sistema',
        paragraphs: [
          'Planteé el sistema visual como una estructura gobernada: tokens compartidos, temas de club acotados y componentes que pueden cambiar de identidad sin alterar la jerarquía funcional.',
          'No traté desktop, mobile, claro y oscuro como cuatro diseños independientes. Comparten navegación, estados, permisos y reglas de contraste; solo cambia lo que pertenece al contexto de cada organización.',
        ],
      },
      {
        id: 'ia',
        title: 'Producto + IA',
        paragraphs: [
          'La propuesta reúne expedientes, adjuntos, notificaciones, auditoría y un asistente que responde con evidencia. No planteo la IA como sustituto del circuito de aprobación: debe trabajar dentro de permisos, fuentes y estados visibles.',
          'La home se deriva del rol autenticado y combina accesos operativos con los indicadores que requieren atención. Busco reducir navegación sin convertir el panel en una colección de métricas decorativas.',
        ],
      },
      {
        id: 'desarrollo',
        title: 'Implementación',
        paragraphs: [
          'El trabajo se articula con una separación entre núcleo y contenido: autorización server-side, aislamiento multi-tenant, puertos y adaptadores, temas gobernados y contratos verificables.',
          'Claude desarrolló el sistema visual y los contratos de Figma; Codex tradujo la arquitectura a código, datos y pruebas. Mi responsabilidad fue dirigir prioridades, resolver decisiones L3 y revisar que producto, diseño e implementación mantuvieran el mismo criterio.',
        ],
      },
      {
        id: 'validacion',
        title: 'Evidencia',
        paragraphs: [
          'La evidencia reúne comparaciones Figma-código, recorridos de navegador, controles de autorización y aislamiento, pruebas de recuperación y auditorías visuales en desktop y mobile.',
          'Lo presento como una evolución, no como un cierre: el producto se trabaja localmente con datos sintéticos y todavía quedan abiertas la convergencia del menú principal y algunos refinamientos de interfaz.',
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
      'He comprobado que un tema de marca necesita limitar qué tokens modifica y conservar jerarquía, contraste y comportamiento.',
      'Una pestaña visible no es un modelo de autorización: los permisos tienen que derivarse del servidor.',
      'La revisión Figma-código me resulta útil cuando deja evidencia comparable, no solo una impresión de parecido.',
    ],
    futureQuestion: '¿Cómo puede una interfaz multirol hacer visible la gobernanza sin añadir carga cognitiva a quienes solo necesitan completar una tarea?',
  },
  {
    slug: 'coordination-hub',
    index: '03',
    title: 'Coordination ',
    titleAccent: 'Hub',
    claim: 'Un espacio para coordinar el trabajo con varias IAs y entender qué ha propuesto cada una, qué se ha revisado y qué decisión me corresponde tomar.',
    summary:
      'Lo empecé para resolver un problema de mi propio trabajo: al pasar de una IA a otra perdía contexto y tenía que reconstruir las decisiones. El Hub, cuya interfaz experimental se llama Testigo, reúne proyectos, conversaciones y memoria revisada. Mi objetivo es poder seguir el trabajo sin confundir una propuesta con un resultado comprobado.',
    year: '2026',
    context: 'Producto propio · infraestructura de método, construida mientras se usaba',
    role: 'Dirección de producto, arquitectura de decisión, especificación y revisión independiente del código',
    contribution: 'Dirección de producto, arquitectura de decisión y definición de los contratos de supervisión humano‑IA',
    collaboration: 'He trabajado con Claude y Codex para implementar y revisar el sistema. Mantengo la dirección del producto, los criterios de aceptación y las decisiones que requieren autorización.',
    disclosure: 'Interfaz real con datos de demostración. Estas capturas proceden del desarrollo de Testigo y no contienen conversaciones de trabajo ni información de LALIGA. Los proveedores aparecen desconectados en esta sesión aislada; las pantallas muestran el diseño de la supervisión, no una ejecución autónoma en curso.',
    status: 'experimental',
    stack: ['Node.js', 'MCP', 'JSONL', 'Zod', 'Claude', 'OpenAI/Codex'],
    tags: 'Multi-agente · MCP · Gobernanza L0–L3',
    proofPoints: [
      { value: 'Piloto', label: 'producto propio en desarrollo' },
      { value: 'L0–L3', label: 'autonomía con autoridad humana' },
      { value: 'MCP', label: 'coordinación entre sesiones separadas' },
    ],
    published: true,
    visual: {
      theme: 'coordination',
      presentation: 'evidence-once',
      logoSrc: '/projects/coordination-hub/logo.svg',
      logoAlt: 'Coordination Hub',
      kicker: 'Human–AI coordination',
      statement: 'Trazabilidad, revisión independiente y autoridad humana.',
      slides: [
        { label: '1. Seguir una conversación', src: '/projects/coordination-hub/testigo-workspace-demo-20260922.webp', alt: 'Interfaz real de Testigo: proyecto de demostración, conversación central y disponibilidad de proveedores a la derecha', description: 'Organizo el contexto por proyecto y conversación. Cada intervención conserva su autor y puedo comprobar la disponibilidad de las herramientas sin salir del espacio de trabajo. Interfaz real con datos de demostración.', fit: 'contain' },
        { label: '2. Revisar qué se conserva', src: '/projects/coordination-hub/testigo-memory-demo-20260922.webp', alt: 'Panel de memoria de Testigo con registros de demostración y controles de revisión', description: 'La memoria permite distinguir el material recibido del conocimiento revisado. Me interesa que la persona pueda consultar y revisar qué información se reutiliza, en lugar de asumir que todo lo escrito es válido. Interfaz real con datos de demostración.', fit: 'contain' },
        { label: '3. Preparar otro proyecto', src: '/projects/coordination-hub/testigo-new-project-demo-20260922.webp', alt: 'Formulario real de Testigo para crear un proyecto en un entorno de demostración', description: 'La creación de un espacio separado hace explícito dónde empieza cada proyecto. Es una parte de la experiencia de entrada que sigo probando para reducir la configuración y evitar mezclar contextos. Interfaz real con datos de demostración.', fit: 'contain' },
      ],
    },
    phases: [
      {
        id: 'research',
        title: 'Research',
        paragraphs: [
          'El problema apareció mientras trabajaba. Copiaba respuestas entre asistentes, repetía el contexto y perdía tiempo comprobando qué se había hecho realmente. Quise separar tres cosas que suelen mezclarse: la petición, la propuesta y la evidencia del resultado.',
          'Definí niveles de autonomía para que una recomendación no se convirtiera por sí sola en una autorización. L0 permite observar; L1 y L2 delimitan acciones según su alcance; L3 reserva las decisiones de mayor impacto a la persona.',
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
          'Organicé la interfaz alrededor de una tarea concreta: entender qué necesita mi atención. A la izquierda sitúo el contexto; en el centro, la conversación; a la derecha, el estado de las herramientas. La memoria se consulta cuando hace falta, sin ocupar permanentemente el espacio de lectura.',
          'El registro de eventos conserva el rastro de las operaciones. Sobre él se construyen las vistas que permiten leer una conversación y revisar sus decisiones sin recorrer el registro técnico completo.',
        ],
      },
      {
        id: 'ia',
        title: 'IA en el proceso',
        paragraphs: [
          'En este caso utilizo IA para construir una herramienta que también debe ayudarme a supervisarla. Alterno implementación y revisión con Claude y Codex, y comparo sus conclusiones con el código y las pruebas. Que dos respuestas coincidan no me basta para dar algo por validado.',
        ],
      },
      {
        id: 'desarrollo',
        title: 'Desarrollo',
        paragraphs: [
          'El Hub ofrece operaciones mediante MCP para consultar mensajes, registrar respuestas y aportar evidencias desde herramientas compatibles. El contrato distingue enviar, recibir, procesar y verificar: son estados diferentes y quiero que la interfaz también los trate así.',
          'He puesto el foco en la recuperación, los reenvíos y la separación entre proyectos. Son situaciones poco vistosas, pero decisivas para que una herramienta de coordinación no añada más incertidumbre de la que resuelve.',
        ],
      },
      {
        id: 'validacion',
        title: 'Validación',
        paragraphs: [
          'Una revisión detectó un problema revelador: se podía cerrar un tema como consenso sin comprobar una revisión ajena. Corregimos el contrato para exigir esa revisión y conservar la evidencia. Este hallazgo cambió mi criterio de diseño: un estado positivo tiene que explicar qué lo sostiene.',
          'La versión inicial documentó 95 pruebas automatizadas. Es una evidencia histórica del desarrollo, no una garantía de que el producto actual esté terminado. El Hub continúa en piloto y la facilidad de uso necesita seguir contrastándose con personas; una captura o una prueba de código no sustituyen esa validación.',
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
      'He aprendido a registrar las decisiones durante el trabajo: reconstruir después su contexto cuesta más y puede dejar lagunas.',
    ],
    futureQuestion:
      '¿Qué necesita ver una persona para supervisar con confianza el trabajo de varios agentes autónomos sin leer todo lo que producen?',
  },
  {
    slug: 'the-ux-union',
    index: '04',
    title: 'TheUX',
    titleAccent: 'Union',
    claim: 'Estoy explorando una comunidad de diseño donde la reputación se lea a través de proyectos, aprendizaje y contribuciones situadas.',
    summary: 'TheUXUnion evoluciona de una propuesta de comunidad y exploración visual a un MVP implementado en Next.js. Investigo cómo conectar talento, portfolio, aprendizaje y oportunidades sin reducir una red profesional a una colección de contactos.',
    year: '2026',
    context: 'Producto propio · comunidad profesional de diseño · MVP en evolución',
    role: 'Fundador, dirección de producto, identidad, UX/UI e implementación',
    contribution: 'Visión de producto, dirección visual, arquitectura de la experiencia y desarrollo del MVP',
    collaboration: 'Proceso iterativo con apoyo de IA para exploración visual, contraste de arquitectura y aceleración de implementación; dirección y selección finales humanas',
    status: 'evolving',
    disclosure: 'El MVP actual hace visible la propuesta y la dirección visual. Autenticación, backend y los flujos completos de reputación y oportunidades permanecen en desarrollo.',
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
          'Partí de una incomodidad: muchas redes profesionales acumulan contactos, pero explican poco sobre cómo trabaja una persona, qué ha aprendido o qué aporta a una comunidad. Quise investigar si esa información podía leerse como una trayectoria, no como un contador.',
          'La hipótesis es que la reputación puede apoyarse en señales contextualizadas —proyectos, formación, feedback y contribución— en lugar de depender solo del alcance o del número de conexiones. Es una pregunta de producto que el MVP todavía no resuelve por completo.',
        ],
        bullets: ['Propuesta de valor', 'Mapa de actores', 'Señales de reputación', 'Recorrido landing → acceso → perfil'],
      },
      {
        id: 'prototipo',
        title: 'Sistema',
        paragraphs: [
          'Trabajé una identidad con base oscura y técnica, pero reservé el color para el contenido y los estados importantes. La estructura, los textos y los controles necesitaban permanecer sobrios para que la experiencia siguiera siendo legible.',
          'La evolución me llevó de una exploración gráfica más abierta a un sistema de producto más disciplinado: navegación, módulos, tarjetas y adaptaciones responsive reutilizables.',
        ],
      },
      {
        id: 'ia',
        title: 'Producto + IA',
        paragraphs: [
          'El concepto reúne perfiles vivos, nodos de afinidad, portfolio, recursos, coworking, eventos y oportunidades. El MVP concentra el esfuerzo en explicar ese ecosistema y plantear una entrada por mérito.',
          'Uso IA para abrir direcciones visuales y acelerar variaciones, pero la edición sigue siendo deliberada: selecciono las imágenes por la idea de identidad que sostienen, no como sustituto de investigación, arquitectura ni jerarquía.',
        ],
      },
      {
        id: 'desarrollo',
        title: 'Implementación',
        paragraphs: [
          'Llevé la primera versión estática a una aplicación Next.js con TypeScript, componentes independientes, navegación responsive, selector de tema y una landing modular en la que puedo incorporar nuevos flujos.',
          'Sigue siendo un MVP: muestra la propuesta, la marca y una estructura de entrada, pero no equivale todavía a la plataforma completa de reputación, autenticación y oportunidades que plantea la visión.',
        ],
      },
      {
        id: 'validacion',
        title: 'Evidencia',
        paragraphs: [
          'Conservo las capas de evolución —primeras versiones desktop/mobile, dirección visual e implementación actual— para que se pueda leer el proceso y no solo una pantalla final.',
          'El caso conecta el prototipo Hi‑Fi mobile, el sistema de identidad, la biblioteca de componentes, el MVP desktop y la presentación de producto mediante exportaciones HD de los archivos de Figma.',
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
      'Aprendí que una identidad intensa necesita una estructura silenciosa para poder leerse sin convertir toda la experiencia en estímulo.',
      'Para mí, la reputación solo se entiende cuando cada señal conserva contexto, procedencia y relación con trabajo real.',
      'Mostrar la evolución del producto me parece más honesto que presentar un MVP como si ya fuera la visión completa.',
    ],
    futureQuestion: '¿Qué señales permiten construir confianza profesional sin reproducir las dinámicas de popularidad de una red social?',
  },
  NUDE_PROJECT,
  {
    slug: 'fintech-app',
    index: '06',
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
    index: '07',
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
