import Image from 'next/image'
import Link from 'next/link'
import { RailControls } from './RailControls'
import './visual-gallery.css'

const works = [
  { slug: 'buy-sell-marketplace', name: 'Buy&Sell', word: 'Intercambio', image: '/projects/visual-gallery/buy-sell-art.webp', position: 'center' },
  { slug: 'laliga-club-operations-hub', name: 'LALIGA', word: 'Sistema', image: '/projects/laliga/editorial-cover-v1.webp', position: '68% center' },
  { slug: 'coordination-hub', name: 'Coordination Hub', word: 'Sincronía', image: '/projects/coordination-hub/editorial-cover-v1.webp', position: 'center' },
  { slug: 'the-ux-union', name: 'TheUXUnion', word: 'Conexión', image: '/projects/visual-gallery/theux-art.webp', position: 'center' },
  { slug: 'nude-project', name: 'NudeProject', word: 'Actitud', image: '/projects/nude-project/editorial-photo.webp', position: 'center' },
]

// Rendered by the route on the server and passed through the client shell as a slot.
export function VisualGallery() {
  return <section className="rd-art-gallery" aria-labelledby="art-gallery-title">
    <header className="rd-art-gallery__heading">
      <h2 id="art-gallery-title">Diseño que se siente.</h2>
      <div className="rd-art-gallery__navigation">
        <p id="art-gallery-help">Explora de lado a lado. Entra en cada proyecto.</p>
        <RailControls trackId="art-gallery-track" />
      </div>
    </header>
    <div id="art-gallery-track" className="rd-art-gallery__track" role="region" aria-label="Galería de proyectos" aria-describedby="art-gallery-help" tabIndex={0}>
      {works.map((work) => <Link className="rd-art-gallery__item" href={`/casos/${work.slug}`} key={work.slug} aria-label={`Ver caso: ${work.name}`} prefetch={false}>
        <Image src={work.image} alt="" fill loading="lazy" sizes="(max-width: 760px) 84vw, (max-width: 1200px) 46vw, 34vw" style={{ objectPosition: work.position }} />
        <span className="rd-art-gallery__word" aria-hidden="true">{work.word}</span>
        <span className="rd-art-gallery__name">{work.name}<span aria-hidden="true">↗</span></span>
      </Link>)}
    </div>
  </section>
}
