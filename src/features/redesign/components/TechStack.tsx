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
  siReact,
  siTailwindcss,
  siTypescript,
  siZod,
  type SimpleIcon,
} from 'simple-icons'
import { supplementalTechIcons } from './supplementalTechIcons'

const ICONS: Record<string, Pick<SimpleIcon, 'path' | 'hex'>> = {
  ...supplementalTechIcons,
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
  React: siReact,
  'Tailwind CSS': siTailwindcss,
  TypeScript: siTypescript,
  Zod: siZod,
}

export function TechStack({ technologies, compact = false }: { technologies: string[]; compact?: boolean }) {
  return (
    <span className={`rd-tech-stack${compact ? ' rd-tech-stack--compact' : ''}`} aria-label="Tecnologías utilizadas">
      {technologies.map((technology) => {
        const icon = ICONS[technology]
        if (!icon) return <span className="rd-tech-stack__item" key={technology}><span>{technology}</span></span>
        return (
          <span className="rd-tech-stack__item" key={technology}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icon.path} /></svg>
            <span>{technology}</span>
          </span>
        )
      })}
    </span>
  )
}
