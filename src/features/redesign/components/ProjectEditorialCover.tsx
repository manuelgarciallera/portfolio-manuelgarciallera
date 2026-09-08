import Image from 'next/image'

import type { CaseVisual } from '../content/types'
import { NudeProjectCover } from '../nude-project/NudeProjectCover'

interface ProjectEditorialCoverProps {
  index: string
  visual: CaseVisual
}

const COVER_ASSETS = {
  laliga: '/projects/laliga/editorial-cover-v1.webp',
  coordination: '/projects/coordination-hub/editorial-cover-v1.webp',
} as const

export function ProjectEditorialCover({ visual }: ProjectEditorialCoverProps) {
  if (visual.theme === 'nude-project') return <NudeProjectCover />
  if (visual.theme === 'buy-sell') return null
  if (visual.theme !== 'laliga' && visual.theme !== 'coordination' && visual.theme !== 'theuxunion') return null

  if (visual.theme === 'theuxunion') {
    return (
      <span className="rd-project-cover rd-project-cover--theuxunion" aria-hidden="true">
        <Image
          className="rd-project-cover__artifact rd-project-cover__artifact--ribbon"
          src="/projects/theuxunion/cover-ribbon-v1.webp"
          alt=""
          width={1356}
          height={1159}
          sizes="(max-width: 760px) 72vw, 52vw"
        />
        <Image
          className="rd-project-cover__artifact rd-project-cover__artifact--sphere"
          src="/projects/theuxunion/brand-hd.webp"
          alt=""
          width={1670}
          height={1670}
          sizes="(max-width: 760px) 56vw, 38vw"
        />
        <Image
          className="rd-project-cover__artifact rd-project-cover__artifact--polyhedron"
          src="/projects/theuxunion/cover-polyhedron-v1.webp"
          alt=""
          width={1254}
          height={1254}
          sizes="(max-width: 760px) 32vw, 20vw"
        />
        <Image className="rd-project-cover__logo" src={visual.logoSrc} alt="" width={190} height={190} />
      </span>
    )
  }

  return (
    <span className={`rd-project-cover rd-project-cover--${visual.theme}`} aria-hidden="true">
      <Image
        className="rd-project-cover__art"
        src={COVER_ASSETS[visual.theme]}
        alt=""
        fill
        sizes="100vw"
      />
      <Image className="rd-project-cover__logo" src={visual.logoSrc} alt="" width={246} height={72} />
    </span>
  )
}
