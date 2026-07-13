'use client'

export function ManifestoSection() {
  return (
    <section className="rd-section" id="enfoque">
      <p className="rd-label rd-reveal" data-index="01">
        Enfoque
      </p>
      <h2 className="rd-statement rd-reveal">
        Diseño, prototipo y construyo productos digitales, investigando cómo las interfaces —y la{' '}
        <em>IA integrada</em> en ellas— ayudan a las personas a comprender, decidir y{' '}
        <em>trabajar mejor</em>.
      </h2>
    </section>
  )
}

export function CapabilitiesSection() {
  return (
    <section className="rd-section" id="capacidades">
      <p className="rd-label rd-reveal" data-index="02">
        Capacidades
      </p>
      <div className="rd-axes">
        <div className="rd-axis rd-reveal">
          <h3>
            <span>a</span>Investigación
          </h3>
          <p>Métodos DCU y UX research: de la pregunta a la evidencia. HCI, arquitectura de información y usabilidad medible.</p>
        </div>
        <div className="rd-axis rd-reveal">
          <h3>
            <span>b</span>Prototipado + IA
          </h3>
          <p>Figma, sistemas de diseño e IA documentada como acelerador — con criterio y decisión final humana en cada fase.</p>
        </div>
        <div className="rd-axis rd-reveal">
          <h3>
            <span>c</span>Desarrollo
          </h3>
          <p>Full stack: del componente atomizado en Figma al componente en código, con datos, roles y arquitectura real.</p>
        </div>
      </div>
    </section>
  )
}

export function ContactSection() {
  return (
    <section className="rd-section rd-contact" id="contacto">
      <p className="rd-label rd-reveal" data-index="04">
        Contacto
      </p>
      <a className="rd-contact-mail rd-reveal" href="mailto:manuelgarciallera@outlook.com">
        Hablemos<em>.</em>
      </a>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="rd-footer">
      <span>© {new Date().getFullYear()} Manuel García-Llera</span>
      <span>Madrid · manuelgarciallera.com</span>
      <span>Diseño + IA, documentado con criterio</span>
    </footer>
  )
}
