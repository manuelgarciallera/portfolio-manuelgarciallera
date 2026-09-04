'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

export function ResearchThreshold() {
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: '12% 0px', threshold: 0.18 },
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="rd-research-threshold"
      data-active={active ? 'true' : 'false'}
      aria-hidden="true"
    >
      <Image
        src="/art/research-stained-glass-v1.webp"
        alt=""
        width={1920}
        height={1080}
        quality={92}
        sizes="(max-width: 767px) 116vw, 74vw"
      />
    </section>
  )
}
