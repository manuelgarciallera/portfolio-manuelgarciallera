import type { CSSProperties } from 'react'
import {
  siAngular,
  siBootstrap,
  siClaude,
  siExpress,
  siFigma,
  siJson,
  siModelcontextprotocol,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siOpenaigym,
  siReact,
  siTailwindcss,
  siTypescript,
  siZod,
  type SimpleIcon,
} from 'simple-icons'

const ICONS: Record<string, SimpleIcon> = {
  Angular: siAngular,
  Bootstrap: siBootstrap,
  Claude: siClaude,
  Express: siExpress,
  Figma: siFigma,
  JSONL: siJson,
  MCP: siModelcontextprotocol,
  MySQL: siMysql,
  'Next.js': siNextdotjs,
  'Node.js': siNodedotjs,
  'OpenAI/Codex': siOpenaigym,
  React: siReact,
  'Tailwind CSS': siTailwindcss,
  TypeScript: siTypescript,
  Zod: siZod,
}

export function TechStack({ technologies, compact = false }: { technologies: string[]; compact?: boolean }) {
  return (
    <span className={`rd-tech-stack${compact ? ' rd-tech-stack--compact' : ''}`} aria-label="Stack tecnológico" tabIndex={0}>
      {technologies.map((technology) => {
        const icon = ICONS[technology]
        if (!icon) return <span className="rd-tech-stack__item" key={technology}><span>{technology}</span></span>
        const style = { '--tech-color': `#${icon.hex}` } as CSSProperties
        return (
          <span className="rd-tech-stack__item" key={technology} title={technology} style={style}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icon.path} /></svg>
            <span>{technology}</span>
          </span>
        )
      })}
    </span>
  )
}
