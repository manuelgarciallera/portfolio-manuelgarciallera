import Image from 'next/image'

export function CasesTransitionArtifact() {
  return (
    <figure className="rd-cases-transition" aria-hidden="true">
      <Image
        src="/art/cases-convergence-v1.webp"
        alt=""
        width={1536}
        height={1024}
        sizes="(max-width: 760px) 76vw, 38vw"
      />
    </figure>
  )
}
