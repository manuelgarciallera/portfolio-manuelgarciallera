import Image from 'next/image'
import Link from 'next/link'

import { ABOUT_CREDENTIALS } from '../content/about'
import { PROFILE_LINKS } from '@/lib/site-config'
import { CvDownloads } from './CvDownloads'

/**
 * Componente de servidor a proposito. Es contenido estatico —retrato, cargo,
 * titulacion, identificadores—: no tiene estado ni eventos, asi que su marcado no
 * tiene por que viajar como JavaScript. Se inyecta en `AboutPage`, que si es
 * cliente, a traves de una prop: React permite pasar arboles de servidor como
 * hijos de un componente cliente sin que entren en su bundle.
 *
 * Quien llega aqui desde un correo —un supervisor antes de contestar, o alguien
 * de seleccion antes de abrir un caso— escanea antes de leer, y busca siempre lo
 * mismo: cara, cargo, titulacion, identificadores. Esa informacion existia
 * repartida entre tres paginas y ninguna la reunia.
 */
export function AboutIdentity() {
  return (
    <section className="rd-section rd-identity">
      <p className="rd-label rd-reveal" data-index="01">
        Perfil
      </p>
      <div className="rd-identity__grid">
        <figure className="rd-identity__portrait">
          <Image
            src="/images/manuel-garcia-llera.jpg"
            alt="Retrato de Manuel García-Llera"
            width={640}
            height={640}
            sizes="(max-width: 767px) 60vw, 18rem"
          />
        </figure>

        <div className="rd-identity__body">
          <p className="rd-identity__role">
            Visual Design Manager en LALIGA · Product Designer y Design Engineer
          </p>

          <h2 className="rd-identity__heading">Formación</h2>
          <ul className="rd-identity__list">
            {ABOUT_CREDENTIALS.map((credential) => (
              <li key={credential.title}>
                <strong>{credential.title}</strong>
                <span>
                  {credential.institution}
                  {credential.detail ? ` · ${credential.detail}` : ''}
                </span>
              </li>
            ))}
          </ul>

          <h2 className="rd-identity__heading">Identificadores</h2>
          <ul className="rd-identity__ids">
            {PROFILE_LINKS.orcid ? (
              <li>
                <a href={PROFILE_LINKS.orcid} rel="me noopener noreferrer" target="_blank">
                  ORCID <span aria-hidden="true">↗</span>
                </a>
              </li>
            ) : null}
            {PROFILE_LINKS.scholar ? (
              <li>
                <a href={PROFILE_LINKS.scholar} rel="me noopener noreferrer" target="_blank">
                  Google Scholar <span aria-hidden="true">↗</span>
                </a>
              </li>
            ) : null}
            <li>
              <a href={PROFILE_LINKS.linkedin} rel="me noopener noreferrer" target="_blank">
                LinkedIn <span aria-hidden="true">↗</span>
              </a>
            </li>
            <li>
              <a href={PROFILE_LINKS.github} rel="me noopener noreferrer" target="_blank">
                GitHub <span aria-hidden="true">↗</span>
              </a>
            </li>
            <li>
              <Link href="/investigacion">Investigación</Link>
            </li>
          </ul>
          <CvDownloads />
        </div>
      </div>
    </section>
  )
}
