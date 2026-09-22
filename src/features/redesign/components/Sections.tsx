'use client'

import Image from 'next/image'
import Link from 'next/link'
import { PUBLIC_ROUTES } from '../../../lib/public-routes'
import { PROFILE_LINKS } from '../../../lib/site-config'
import { ContactForm } from './ContactForm'
import { ContactLink } from './ContactLink'
import '../contact.css'

export function ManifestoSection() {
  return (
    <>
      <section className="rd-quote-panel" aria-label="Principio de trabajo">
        <blockquote className="rd-principle rd-reveal">
          <p>«Cada principio es el momento ideal para cuidar atentamente que los equilibrios queden establecidos de la manera más exacta.»</p>
          <cite>Frank Herbert · Dune</cite>
        </blockquote>
      </section>
      <section className="rd-section" id="enfoque">
        <p className="rd-label rd-reveal">
          Enfoque
        </p>
        <h2 className="rd-statement rd-reveal">
          Diseño y construyo productos digitales para que la complejidad se pueda{' '}
          <em>entender, usar y discutir</em>. Investigo qué ocurre cuando las interfaces —y la{' '}
          <em>IA dentro de ellas</em>— participan en nuestras decisiones.
        </h2>
        <div className="rd-manifesto-copy rd-reveal">
          <p>Aprender a desarrollar me ha ayudado a mirar el diseño con más profundidad. Cuando planteo una pantalla, también me pregunto qué datos necesita, quién puede modificarlos y qué ocurre si algo falla. Entender esas relaciones me permite discutir las soluciones con ingeniería y comprobar si lo que he diseñado funciona de verdad.</p>
          <p>En mi día a día trabajo con distintas inteligencias artificiales. Llevo meses probando cómo responden, dónde me ayudan y en qué se equivocan. Después de una etapa utilizando principalmente Claude, ahora trabajo más con Codex: en mis proyectos estoy encontrando la estabilidad y la capacidad de resolución que necesito. Sigo contrastando sus respuestas; elegir una herramienta no significa dejar de revisar sus resultados.</p>
        </div>
        <Image
          className="rd-manifesto-art"
          src="/art/manifesto-system-assembly-v2.webp"
          alt=""
          width={1536}
          height={1024}
          sizes="(min-width: 768px) 64vw, 1px"
          loading="lazy"
          aria-hidden="true"
        />
      </section>
    </>
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
          <p>Conecto necesidades de las personas y del negocio mediante investigación de usuarios, evaluación heurística, arquitectura de información y HCI.</p>
        </div>
        <div className="rd-axis rd-reveal">
          <h3>
            <span>b</span>Prototipado + IA
          </h3>
          <p>Trabajo con Atomic Design para que tokens, componentes y estados no se queden en Figma, sino que formen un sistema reutilizable que pueda llegar al código.</p>
        </div>
        <div className="rd-axis rd-reveal">
          <h3>
            <span>c</span>Desarrollo
          </h3>
          <p>Implemento con Angular o Next.js y entiendo también Node.js y MySQL: el lugar donde el diseño se enfrenta a datos, permisos, accesibilidad y rendimiento reales.</p>
        </div>
      </div>
    </section>
  )
}

export function ContactSection() {
  return (
    <section className="rd-section rd-contact" aria-labelledby="contacto">
      <p className="rd-label rd-reveal">
        Contacto
      </p>
      <div className="rd-contact-heading">
        <h2 id="contacto" tabIndex={-1}>Hablemos<em>.</em></h2>
        <p>Si crees que mi forma de trabajar encaja en tu equipo, o tienes un producto o una investigación que quieras desarrollar, me gustaría conocerlo. Cuéntame qué necesitas y en qué punto estás. Leeré tu mensaje personalmente.</p>
        <a className="rd-contact-linkedin" href={PROFILE_LINKS.linkedin} target="_blank" rel="noreferrer">También puedes encontrarme en LinkedIn <span aria-hidden="true">↗</span></a>
      </div>
      <ContactForm />
    </section>
  )
}

export function Footer() {
  return (
    <footer className="rd-footer">
      <span>© {new Date().getFullYear()} Manuel García-Llera</span>
      <span>Madrid · manuelgarciallera.com</span>
      <nav aria-label="Navegación secundaria">
        <Link href="/sobre-mi">Sobre mí</Link>
        <Link href={PUBLIC_ROUTES.projects}>Proyectos</Link>
        <Link href="/proceso">Proceso</Link>
        <Link href={PUBLIC_ROUTES.blog}>Blog</Link>
        <ContactLink>Contacto</ContactLink>
        <Link href="/privacidad">Privacidad</Link>
        <a href={PROFILE_LINKS.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
      </nav>
      <Image
        className="rd-footer-artwork"
        src="/art/footer-liquid-ribbon-v2.webp"
        alt=""
        width={1536}
        height={1024}
        sizes="(max-width: 760px) 92vw, 62vw"
        aria-hidden="true"
      />
    </footer>
  )
}
