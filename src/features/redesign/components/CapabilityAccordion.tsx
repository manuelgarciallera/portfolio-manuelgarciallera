'use client'

import Image from 'next/image'
import { useState } from 'react'

const CAPABILITIES = [
  { title: 'Producto digital', body: 'Conecto las necesidades de las personas y del negocio con recorridos, roles y decisiones que pueden comprenderse y usarse.', href: '#casos', cta: 'Ver evidencia', imageSrc: '/art/capabilities/product-system.webp', imageAlt: 'Piezas conectadas que representan un recorrido de producto digital' },
  { title: 'UX/UI y sistemas', body: 'Investigo, estructuro y prototipo en Figma. Trabajo con Atomic Design para que tokens, componentes y estados formen un sistema reutilizable.', href: '/casos/buy-sell-marketplace', cta: 'Ver evidencia', imageSrc: '/art/capabilities/design-system.webp', imageAlt: 'Módulos visuales que forman un sistema de diseño reutilizable' },
  { title: 'Frontend', body: 'Llevo las decisiones al navegador con Angular o Next.js y compruebo qué ocurre cuando aparecen datos, permisos, accesibilidad y rendimiento reales.', href: '/casos/buy-sell-marketplace#fase-desarrollo', cta: 'Ver evidencia', imageSrc: '/art/capabilities/frontend-surface.webp', imageAlt: 'Estructura digital que se transforma en una interfaz ejecutable' },
  { title: 'Investigación HCI', body: 'Me interesa cómo la materialidad, la percepción y la tecnología cambian nuestra relación con una interfaz y nuestra forma de decidir.', href: '/articulos/del-objeto-a-la-interfaz', cta: 'Ver evidencia', imageSrc: '/art/capabilities/hci-material.webp', imageAlt: 'Material, percepción y gesto humano representados como un sistema conectado' },
  { title: 'IA aplicada', body: 'Comparo distintas IAs y utilizo flujos con MCP para explorar, automatizar e implementar, manteniendo humanas la dirección y la responsabilidad.', href: '/casos/coordination-hub', cta: 'Ver evidencia', imageSrc: '/art/capabilities/human-ai.webp', imageAlt: 'Nodo humano que dirige una red mínima de inteligencia artificial' },
  { title: '3D y arquitectura interior', body: 'Práctica complementaria. Diseño y visualizo espacios trabajando con volumen, materialidad, luz y escala; una mirada física que también mejora cómo pienso las interfaces.', href: '/sobre-mi', cta: 'Ver contexto', imageSrc: '/art/capabilities/spatial-light.webp', imageAlt: 'Volumen arquitectónico definido por material, luz y escala' },
] as const

export function CapabilityAccordion() {
  const [open, setOpen] = useState(-1)

  return (
    <section className="rd-now" aria-labelledby="rd-now-title">
      <div className="rd-now__intro">
        <p>Empecé diseñando marcas y espacios. Hoy investigo, prototipo y construyo productos digitales.</p>
        <figure className="rd-now__visual" aria-hidden="true">
          <Image
            src="/art/capability-ai-network-v2.webp"
            alt=""
            width={1536}
            height={1024}
            sizes="(max-width: 760px) 82vw, 25vw"
          />
        </figure>
        <span id="rd-now-title">Lo que hago</span>
      </div>
      <div className="rd-now__list">
        {CAPABILITIES.map((item, index) => (
          <article key={item.title} className={open === index ? 'is-open' : undefined}>
            <h2><button type="button" aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)}>{item.title}<span aria-hidden="true">{open === index ? '−' : '+'}</span></button></h2>
            <div className="rd-now__answer"><div><p>{item.body}</p><a href={item.href}>{item.cta} <span aria-hidden="true">→</span></a><figure className="rd-now__answer-visual"><Image src={item.imageSrc} alt={item.imageAlt} width={1280} height={720} loading="lazy" sizes="(max-width: 760px) calc(100vw - 4rem), 44vw" /></figure></div></div>
          </article>
        ))}
      </div>
    </section>
  )
}
