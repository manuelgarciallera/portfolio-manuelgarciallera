import Image from 'next/image'
import './nude-project.css'

export function NudeProjectCover() {
  return <span className="rd-project-cover rd-nude-cover" aria-hidden="true">
    <span className="rd-nude-cover__photo">
      <Image src="/projects/nude-project/editorial-photo.webp" alt="" fill sizes="(max-width: 760px) 90vw, 60vw" />
    </span>
    <span className="rd-nude-cover__lockup">
      <Image src="/projects/nude-project/logo.svg" alt="" width={530} height={54} sizes="(max-width: 760px) 65vw, 36vw" />
    </span>
  </span>
}
