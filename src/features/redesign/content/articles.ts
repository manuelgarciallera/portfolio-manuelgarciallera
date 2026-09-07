export interface ArticleSection {
  heading?: string
  paragraphs: string[]
  related?: { href: string; label: string }
}
export interface Article {
  slug: string; index: string; category: string; title: string; summary: string; publishedAt: string; readTime: string;
  theme: 'material' | 'system' | 'human-ai' | 'complexity'; sections: ArticleSection[]
}

export const ARTICLE_AUTHOR = {
  name: 'Manuel García-Llera',
  role: 'Product Designer · Design Engineer',
  bio: 'Investigo, diseño y construyo sistemas digitales. Mi trabajo conecta cultura material, HCI, diseño de producto e implementación.',
  // El retrato vive en el dominio propio: un avatar de GitHub es una URL de
  // terceros que puede cambiar o desaparecer sin aviso.
  image: '/images/manuel-garcia-llera.jpg',
}

export const ARTICLES: Article[] = [
  {
    slug: 'del-objeto-a-la-interfaz', index: '01', category: 'HCI · Cultura material', theme: 'material',
    title: 'Del objeto a la interfaz: lo que perdemos cuando desaparece la materia',
    summary: 'Una interfaz también tiene peso, resistencia y temperatura, aunque sólo los percibamos con los ojos.', publishedAt: '2026-09-02', readTime: '7 min',
    sections: [
      { paragraphs: ['Empecé a pensar en las interfaces desde los objetos. Al volver a una pantalla después de estudiar su peso cultural, resulta difícil seguir viendo un botón como una superficie neutra: puede parecer blando o rígido, una transición puede transmitir continuidad o ruptura y una jerarquía puede invitar a tocar o a mantener distancia.', 'Mi interés por esta cuestión nace en la cultura material. Los objetos cotidianos explican valores, restricciones y formas de vida. Cuando el producto se convierte en interfaz, esa capacidad no desaparece: cambia de canal.'] },
      { heading: 'La materia se vuelve comportamiento', paragraphs: ['En una pantalla, la textura no depende sólo del grano o de una sombra. Depende de cómo responde el sistema: cuánto tarda, qué cede, qué permanece y cómo reconoce la intención de la persona.', 'Diseñar esa dimensión háptico-óptica significa coordinar forma y tiempo. Una animación sólo tiene sentido cuando revela una relación, confirma una acción o ayuda a construir un modelo mental.'] },
      { heading: 'Más que apariencia', paragraphs: ['La oportunidad para HCI consiste en estudiar qué cualidades materiales pueden trasladarse a sistemas digitales sin imitar torpemente el mundo físico. No necesitamos botones de plástico. Necesitamos interfaces cuya conducta pueda comprenderse y recordarse.', 'Ésta es la línea que quiero desarrollar: investigar cómo la materialidad percibida afecta a confianza, orientación y toma de decisiones en productos digitales complejos.'], related: { href: '/casos/buy-sell-marketplace', label: 'Ver la materialidad aplicada en Buy&Sell' } },
    ],
  },
  {
    slug: 'sistemas-de-diseno-de-figma-a-codigo', index: '02', category: 'Design Systems', theme: 'system',
    title: 'Sistemas de diseño que sobreviven de Figma al código',
    summary: 'Un sistema no demuestra su valor en el archivo maestro, sino cuando varias personas pueden construir con él.', publishedAt: '2026-09-02', readTime: '8 min',
    sections: [
      { paragraphs: ['He visto sistemas de diseño impecablemente ordenados fracasar en su primer contacto con el producto. Ocurre cuando tokens, componentes y estados describen una maqueta, pero no las decisiones que el software necesita ejecutar.', 'En Buy&Sell quise someter la atomización a una prueba concreta: que cada estado visual pudiera corresponderse con permisos, datos y ciclos de vida reales.'] },
      { heading: 'Diseñar contratos, no catálogos', paragraphs: ['El componente útil no es el que acumula variantes. Es el que expresa un contrato comprensible: qué recibe, qué devuelve, qué estados admite y qué parte puede cambiar sin romper el conjunto.', 'Figma ayuda a explorar y alinear. El código obliga a precisar. Cuando ambos divergen, no basta con corregir píxeles: hay que revisar el modelo compartido.'] },
      { heading: 'El traspaso es una conversación', paragraphs: ['La documentación no sustituye el trabajo entre diseño y desarrollo. Un sistema resistente incorpora decisiones, ejemplos y límites, pero también un proceso para negociar excepciones.', 'La fidelidad importante no consiste en que dos capturas coincidan. Consiste en conservar intención, jerarquía y comportamiento cuando el producto recibe datos reales.'], related: { href: '/casos/buy-sell-marketplace', label: 'Recorrer el sistema de Figma a Angular' } },
    ],
  },
  {
    slug: 'colaboracion-humano-ia-con-autoria', index: '03', category: 'IA · Práctica', theme: 'human-ai',
    title: 'Colaborar con IA sin diluir autoría ni responsabilidad',
    summary: 'La IA puede ampliar la capacidad de un equipo. No puede asumir el criterio que da sentido a sus decisiones.', publishedAt: '2026-09-02', readTime: '6 min',
    sections: [
      { paragraphs: ['Trabajo con IA a diario y, precisamente por eso, procuro no atribuirle una autoridad que no tiene. Usarla no vuelve innovador un proceso: la diferencia está en cómo se reparten iniciativa, comprobación y responsabilidad.', 'En mi práctica, la IA explora alternativas, acelera tareas sistemáticas y ayuda a contrastar estructuras. La decisión final sigue necesitando contexto, sensibilidad y consecuencias asumidas por una persona.'] },
      { heading: 'Documentar la colaboración', paragraphs: ['Registrar únicamente el nombre de la herramienta dice muy poco. Resulta más útil explicar qué información recibió, qué produjo, qué criterio permitió seleccionar una opción y qué límites se encontraron.', 'Esta trazabilidad protege la autoría y mejora el aprendizaje. También permite distinguir una decisión de diseño de una coincidencia estadística convincente.'] },
      { heading: 'El objetivo no es automatizarlo todo', paragraphs: ['Los mejores flujos reservan a la máquina la amplitud y a la persona la dirección. A veces será necesario invertir ese reparto: pedir a la IA una crítica estrecha mientras el humano explora.', 'Diseñar colaboración humano-IA implica diseñar también desacuerdo, revisión, memoria y posibilidad de detenerse.'], related: { href: '/casos/coordination-hub', label: 'Ver el protocolo humano–IA de Coordination Hub' } },
    ],
  },
  {
    slug: 'interfaces-para-roles-y-estados-complejos', index: '04', category: 'Producto · Complejidad', theme: 'complexity',
    title: 'Interfaces para roles, estados y decisiones complejas',
    summary: 'Cuando cada persona puede ver y hacer cosas diferentes, la arquitectura deja de ser invisible.', publishedAt: '2026-09-02', readTime: '7 min',
    sections: [
      { paragraphs: ['Un producto puede parecer sencillo hasta que lo miro desde el segundo perfil. Entonces aparecen permisos, excepciones, estados intermedios y decisiones que dependen de otras personas.', 'Por eso comienzo estos sistemas por las relaciones y no por las pantallas. ¿Quién puede actuar? ¿Sobre qué entidad? ¿En qué momento? ¿Qué necesita saber antes de hacerlo?'] },
      { heading: 'La interfaz como representación del sistema', paragraphs: ['Una navegación distinta por rol no es una personalización cosmética. Es la traducción visible de responsabilidades diferentes.', 'En proyectos como Buy&Sell o un hub de operaciones, los estados deben ser legibles y coherentes entre interfaz, API y base de datos. Si cada capa utiliza un vocabulario distinto, la experiencia termina exponiendo la fractura.'] },
      { heading: 'Reducir sin ocultar', paragraphs: ['Simplificar no significa eliminar complejidad, sino situarla donde pueda ser comprendida y manejada. Una buena interfaz permite actuar sin exigir que la persona conozca toda la arquitectura.', 'El trabajo de producto consiste en decidir qué debe verse ahora, qué puede esperar y qué evidencia necesita cada decisión.'], related: { href: '/casos/laliga-club-operations-hub', label: 'Explorar roles y estados en el Hub de Clubes' } },
    ],
  },
]

export const getArticleBySlug = (slug: string) => ARTICLES.find((article) => article.slug === slug)
