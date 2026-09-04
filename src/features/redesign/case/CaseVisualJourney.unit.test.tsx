import { renderToStaticMarkup } from 'react-dom/server'
import fs from 'node:fs'
import path from 'node:path'
import { describe,expect,it } from 'vitest'
import { getCaseBySlug } from '../content/cases'
import { CaseVisualJourney } from './CaseVisualJourney'
describe('CaseVisualJourney',()=>{it('distributes existing LaLiga evidence as a visual story',()=>{const study=getCaseBySlug('laliga-club-operations-hub')!;const markup=renderToStaticMarkup(<CaseVisualJourney study={study}/>);expect(markup).toContain('Recorrido visual de LaLiga Hub de Clubes');expect(markup).toContain('El proyecto, por capas');expect(markup).toContain('club-home-hd.webp');expect(markup).toContain('La portada convierte permisos, actividad y accesos frecuentes')})})

describe('TheUXUnion visual journey', () => {
  it('renders portrait mobile evidence cleanly and slows its editorial rail', () => {
    const study = getCaseBySlug('the-ux-union')!
    const markup = renderToStaticMarkup(<CaseVisualJourney study={study} />)
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(markup).toContain('rd-visual-journey__media--portrait')
    expect(markup).toContain('rd-visual-journey__media--device')
    expect(markup).toContain('width="1290" height="2796"')
    expect(css).toMatch(/\.rd-visual-journey__media--portrait img\s*\{[^}]*width:\s*min\(100%,\s*clamp\(18rem,\s*28vw,\s*30rem\)\)[^}]*max-height:\s*72vh/)
    expect(css).toMatch(/\.rd-visual-journey--theuxunion \.rd-visual-journey__rail\s*\{[^}]*animation-duration:\s*46s/)
    expect(css).toMatch(/\.rd-visual-journey figure\s*>\s*\.rd-visual-journey__media--portrait\s*\{[^}]*min-height:\s*0[^}]*background:\s*transparent/)
    expect(css).toMatch(/@media\(max-width:760px\)[\s\S]*?\.rd-visual-journey__media--portrait img\s*\{[^}]*width:\s*100%[^}]*max-height:\s*none/)
    expect(css).toMatch(/\.rd-visual-journey__media--device img\s*\{[^}]*border-radius:\s*13%\s*\/\s*6%[^}]*clip-path:\s*inset\(0 round 13%\s*\/\s*6%\)/)
  })
})
