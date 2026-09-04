import Image from 'next/image'

export function TheUxUnionFeatureBrand() {
  return (
    <figure className="rd-case-feature-brand rd-case-feature-brand--theuxunion">
      <Image
        src="/projects/theuxunion/visual-language-hd.webp"
        alt="Lenguaje visual tridimensional de TheUXUnion"
        fill
        priority
        sizes="(max-width: 767px) 100vw, 26vw"
      />
      <figcaption>TheUXUnion</figcaption>
    </figure>
  )
}
