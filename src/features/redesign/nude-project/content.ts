import type { CaseStudy } from '../content/types'

const file = 'https://www.figma.com/design/q8g3VDiheBeFjwQYLhrIbn/TheNudeProject'

export const NUDE_PROJECT: CaseStudy = {
  slug: 'nude-project', index: '05', title: 'NudeProject',
  claim: 'Moda, comunidad y compra en una experiencia móvil diseñada para explorar sin perderse.',
  summary: 'TFM del máster de Diseño de Experiencia de Usuario UX/UI. Una propuesta académica para Nude Project que conecta catálogo, podcast, favoritos y cuenta mediante un prototipo y un sistema de componentes en Figma.',
  year: 'TFM UX/UI',
  context: 'TFM · Máster UX/UI · propuesta académica en equipo',
  role: 'Diseño UX/UI y prototipado en equipo',
  contribution: 'Diseño de experiencia, componentes y prototipo móvil',
  collaboration: 'Trabajo académico realizado en equipo; el caso presenta la propuesta conjunta.',
  disclosure: 'Propuesta académica no oficial para Nude Project. Diseñada con Figma y Adobe CC; no se desarrolló ni se llevó a producción. Marca y fotografías pertenecen a sus titulares.',
  stack: ['Figma', 'Adobe CC'],
  tags: 'UX/UI · Prototipo móvil · Sistema de componentes',
  published: true,
  delivery: 'design-prototype',
  proofPoints: [
    { value: 'Mobile', label: 'diseño de la experiencia de compra' },
    { value: 'Componentes', label: 'lenguaje visual reutilizable en Figma' },
    { value: 'Flujos', label: 'recorridos conectados antes del desarrollo' },
  ],
  visual: {
    theme: 'nude-project',
    logoSrc: '/projects/nude-project/logo.svg', logoAlt: 'Nude Project',
    kicker: 'Moda y cultura digital', statement: 'Vestir una identidad. Diseñar cómo se vive.',
    slides: [
      { label: 'Descubrir', src: '/projects/nude-project/mobile-home.webp', alt: 'Inicio del prototipo móvil NudeProject con colección y búsqueda', fit: 'contain', description: 'La colección abre la experiencia; búsqueda y navegación permanecen reconocibles.' },
      { label: 'Comprar', src: '/projects/nude-project/mobile-bag.webp', alt: 'Bolsa del prototipo NudeProject con tallas, cantidades y total', fit: 'contain', description: 'Talla, cantidad y precio se reúnen en la misma decisión, antes de continuar con la compra.' },
      { label: 'Componentes', src: '/projects/nude-project/navigation-system.webp', alt: 'Variantes del componente de navegación del sistema Figma de NudeProject', fit: 'contain', description: 'La navegación enlaza tienda, podcast, marca, favoritos y perfil mediante componentes compartidos.' },
      { label: 'Recorridos', src: '/projects/nude-project/flow.webp', alt: 'Diagrama de flujo de tienda, podcast, cuenta, favoritos y carrito de NudeProject', fit: 'contain', description: 'El mapa permite seguir entradas, decisiones y retornos. El original ampliable está enlazado en Figma.' },
    ],
  },
  phases: [
    { id: 'research', title: 'El reto', paragraphs: ['Una marca de moda también es contenido y pertenencia. La propuesta reúne compra y cultura de marca sin tratarlas como experiencias desconectadas.', 'El alcance mostrado aquí es el diseño académico: las pantallas y el diagrama documentan la solución propuesta, no resultados de conversión ni métricas de una aplicación real.'] },
    { id: 'prototipo', title: 'Un lenguaje compartido', paragraphs: ['La paleta clara y los tonos marrones acompañan a la fotografía de colección. Cabecera, búsqueda, tarjetas, tallas y navegación se articulan como componentes y variantes en Figma.', 'El prototipo organiza tienda, podcast, favoritos y perfil. El diagrama de flujo hace explícitas las decisiones de compra, registro, recuperación de acceso y gestión de la cuenta.'] },
    { id: 'desarrollo', title: 'Prototipo, no código', paragraphs: ['El entregable se realizó con Figma y Adobe CC. No hubo implementación frontend, backend ni integración de pagos: las interacciones pertenecen al prototipo.', 'La bolsa reúne selección de talla, cantidad, descuento y total. La navegación inferior mantiene accesibles las áreas principales durante el recorrido.'] },
    { id: 'validacion', title: 'Evidencia y límites', paragraphs: ['Las pantallas, componentes y flujos originales permiten revisar la coherencia de la propuesta. Este caso no atribuye pruebas con usuarios ni mejoras cuantificadas que no estén documentadas.', 'Llevarlo a producto exigiría validar accesibilidad y tareas con personas, desarrollar la tienda e integrar inventario, pagos y datos reales. Son pasos futuros, no capacidades ya implementadas.'] },
  ],
  ai: { tool: '', phase: '', humanInput: '', output: '', criteria: '', limits: '', decision: '' },
  figmaLayers: ['Identidad / logotipo', 'Cabecera / búsqueda', 'Navegación / variantes', 'Producto / tallas', 'Bolsa / cantidades', 'Perfil / formularios'],
  learnings: ['Una experiencia de marca necesita recorridos tan claros como su identidad visual.', 'Definir componentes y flujos permite revisar el conjunto antes de desarrollar.'],
  futureQuestion: '¿Cómo mantener la personalidad de una marca al simplificar las tareas de compra?',
  links: [
    { label: 'Explorar las pantallas y componentes', href: `${file}?node-id=309-5697` },
    { label: 'Abrir la primera pantalla', href: `${file}?node-id=492-41478` },
    { label: 'Ampliar el diagrama de flujo', href: `${file}?node-id=534-12084` },
  ],
}
