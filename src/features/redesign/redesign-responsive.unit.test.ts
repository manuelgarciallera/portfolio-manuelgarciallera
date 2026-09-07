import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

describe('case-study responsive safeguards', () => {
  it('allows comparison columns and carousel tabs to shrink on mobile', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/\.rd-compare-col\s*\{[^}]*min-width:\s*0/)
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*\.rd-preview-tabs\s*\{[^}]*max-width:/)
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*\.rd-case-visual-copy strong\s*\{[^}]*6\.5vw/)
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*\.rd-case-visual-copy\s*\{[^}]*position:\s*absolute/)
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*\.rd-research-banner\s*\{[^}]*grid-template-columns:\s*1fr/)
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*\.rd-research-artifact-canvas\s*\{[^}]*width:\s*min\(74vw,\s*20rem\)/)
  })

  it('contains the dynamic-branding scene and disables motion until it is visible', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/\.rd-buy-sell-scene\[data-active='false'\][\s\S]*animation-play-state:\s*paused/)
    expect(css).toMatch(/@media \(max-width: 760px\)[\s\S]*\.rd-buy-sell-scene__card[^}]*max-width:/)
  })

  it('centers the Frank Herbert quote as an editorial pause before the manifesto', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/\.rd-principle\s*\{[^}]*text-align:\s*center/)
    expect(css).toMatch(/\.rd-principle p\s*\{[^}]*margin:\s*0 auto/)
    expect(css).toMatch(/\.rd-principle cite\s*\{[^}]*text-align:\s*center/)
  })

  it('lets the research visual bleed to both viewport edges', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/\.rd-section--banner\s*\{[^}]*padding-inline:\s*0/)
    expect(css).toMatch(/\.rd-section--banner\s*\{[^}]*inline-size:\s*100vw/)
    expect(css).toMatch(/\.rd-section--banner\s*\{[^}]*margin-inline:\s*calc\(50% - 50vw\)/)
    expect(css).toMatch(/\.rd-case-visual,\s*\.rd-case-feature\s*\{[^}]*inline-size:\s*100vw/)
    expect(css).toMatch(/\.rd-case-visual,\s*\.rd-case-feature\s*\{[^}]*margin-inline:\s*calc\(50% - 50vw\)/)
    expect(css).toMatch(/\.rd-root\s*\{[^}]*overflow-x:\s*clip/)
  })

  it('separates case studies without adding a decorative rule below their captions', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/\.rd-cases\s*\{[^}]*gap:\s*clamp\(6rem,\s*11vw,\s*10rem\)/)
    expect(css).toMatch(/\.rd-case-caption\s*\{[^}]*padding:\s*0 0/)
  })

  it('gives interactive capsules and carousel controls a visible hover response', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/\.rd-preview-tabs button\s*\{[^}]*transition:/)
    expect(css).toMatch(/\.rd-preview-tabs button:hover\s*\{[^}]*transform:\s*translateY\(-2px\)/)
    expect(css).toMatch(/\.rd-preview-controls button:hover\s*\{[^}]*color:\s*#d9ff43[^}]*transform:\s*none/)
    expect(css).toMatch(/\.rd-case-story__actions a:hover\s*\{[^}]*transform:\s*translateY\(-2px\)/)
    expect(css).toMatch(/\.rd-case-visual:has\(\.rd-preview-tabs button:hover\)[^}]*\.rd-case-hover-cta\s*\{[^}]*opacity:\s*0/)
    expect(css).toMatch(/\.rd-preview-carousel--card\s*\{[^}]*z-index:\s*auto[^}]*pointer-events:\s*none/)
  })

  it('keeps active carousel capsules stable and raises the row by three pixels', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/\.rd-preview-tabs\s*\{[^}]*top:\s*calc\(1\.8rem\s*-\s*3px\)/)
    expect(css).toMatch(/\.rd-preview-tabs button\[data-active="true"\]\s*\{[^}]*border-color:\s*currentColor/)
    expect(css).toMatch(/\.rd-preview-tabs button\[data-active="true"\]\s*\{[^}]*transform:\s*translateY\(0\)/)
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*\.rd-preview-tabs\s*\{[^}]*scrollbar-width:\s*none/)
    expect(css).toMatch(/\.rd-preview-tabs::-webkit-scrollbar\s*\{[^}]*display:\s*none/)
  })

  it('animates real cover artwork while keeping project logos visually stable', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/\.rd-project-cover__art\s*\{[^}]*animation:\s*rd-project-cover-drift 7s/)
    expect(css).not.toMatch(/\.rd-project-cover__logo\s*\{[^}]*animation:/)
    expect(css).toMatch(/\.rd-case-visual\[data-engaged='true'\] \.rd-project-cover__art,\s*\.rd-case-visual\[data-engaged='true'\] \.rd-project-cover__artifact\s*\{[^}]*animation-play-state:\s*running/)
  })

  it('keeps the Coordination Hub logo legible in the mobile cover', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*\.rd-project-cover--coordination \.rd-project-cover__logo\s*\{[^}]*width:\s*min\(44%,\s*11rem\)/)
  })

  it('keeps every editorial cover moving for a sequence longer than five seconds', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/\.rd-article-cover\[data-active='true'\]\.rd-article-cover--material i:nth-of-type\(1\)[^{]*\{[^}]*animation:\s*rd-article-material-a 11s/)
    expect(css).toMatch(/\.rd-article-cover\[data-active='true'\]\.rd-article-cover--system i:nth-of-type\(1\)[^{]*\{[^}]*animation:\s*rd-article-system-frame 10\.5s/)
    expect(css).toMatch(/\.rd-article-cover\[data-active='true'\]\.rd-article-cover--human-ai i:nth-of-type\(1\)[^{]*\{[^}]*animation:\s*rd-article-human-a 12s/)
    expect(css).toMatch(/\.rd-article-cover\[data-active='true'\]\.rd-article-cover--complexity i[^{]*\{[^}]*animation:\s*rd-article-complexity 11\.5s/)
    expect(css).toMatch(/@media\(prefers-reduced-motion:reduce\)\{[^}]*\.rd-article-cover i,[^}]*\{animation:none!important/)
  })

  it('uses one real footer artwork instead of layered CSS objects', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/\.rd-footer-artwork\s*\{[^}]*object-fit:\s*contain/)
    expect(css).not.toMatch(/\.rd-footer-art__orb\s*\{/)
    expect(css).not.toMatch(/\.rd-footer-art__torus\s*\{/)
    expect(css).not.toMatch(/\.rd-footer-art__glass\s*\{/)
  })

  it('keeps pointer-following case prompts off touch-sized layouts', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*\.rd-case-hover-cta\s*\{[^}]*display:\s*none/)
  })

  it('gives an active mobile project slide the full visual area without copy overlapping its tabs', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*\.rd-case-visual:has\(\.rd-preview-carousel--card\[data-frame='slide'\]\) \.rd-case-visual-copy\s*\{[^}]*visibility:\s*hidden/)
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*\.rd-preview-carousel--card\[data-frame='slide'\] \.rd-preview-content\s*\{[^}]*top:\s*0[^}]*height:\s*100%/)
  })

  it('uses branded project backdrops, emphatic slide motion and fluorescent TheUXUnion controls', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/\.rd-case-visual--theuxunion \.rd-preview-viewport[^}]*background:\s*#f2c9ff/)
    expect(css).toMatch(/\.rd-case-visual--theuxunion \.rd-preview-tabs button\[data-active="true"\][^{]*\{[^}]*background:\s*#ff2bd6/)
    expect(css).toMatch(/\.rd-case-visual--coordination \.rd-preview-viewport[^}]*background:\s*#d9ff43/)
    expect(css).toMatch(/\.rd-preview-slide\s*\{[^}]*translate3d\(4%[^}]*transition:\s*opacity 1200ms[^}]*transform 1600ms/)
  })

  it('uses high-contrast reading tokens and a substantial body weight', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')
    const contactCss = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/contact.css'), 'utf8')

    expect(css).toMatch(/:root\s*\{[^}]*--ink:\s*#080908/)
    expect(css).toMatch(/:root\s*\{[^}]*--ink-soft:\s*#1d201b/)
    expect(css).toMatch(/\[data-theme="dark"\]\s*\{[^}]*--ink:\s*#fff/)
    expect(css).toMatch(/\.rd-root\s*\{[^}]*font-weight:\s*500/)
    expect(css).toMatch(/\.rd-axis p\s*\{[^}]*font-weight:\s*500/)
    expect(css).toMatch(/\.rd-manifesto-copy p\s*\{[^}]*font-weight:\s*500/)
    expect(contactCss).toMatch(/\.rd-contact-heading p\s*\{[^}]*font-weight:\s*500/)
    expect(contactCss).toMatch(/\.rd-contact-linkedin\s*\{[^}]*font-weight:\s*600/)
  })

  it('gives the capability index a responsive, animated visual anchor', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/\.rd-now__visual\s*\{[^}]*aspect-ratio:\s*3\s*\/\s*2/)
    expect(css).toMatch(/\.rd-now__visual img\s*\{[^}]*object-fit:\s*contain/)
    expect(css).toMatch(/@keyframes\s+rd-now-orbital-scroll/)
    expect(css).toMatch(/@media\(prefers-reduced-motion:reduce\)[\s\S]*\.rd-now__visual img/)
  })

  it('keeps mobile HCI artwork in flow with breathing room and reduces new artifact motion', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*\.rd-research-banner\s*\{[^}]*grid-template-rows:\s*auto auto/)
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*\.rd-research-artifact\s*\{[^}]*margin-top:\s*clamp\(2rem,\s*8vw,\s*3rem\)/)
    expect(css).not.toMatch(/\.rd-cases-transition\s*\{/)
  })

  it('uses one desktop content axis without changing the mobile composition', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*--desktop-axis:\s*var\(--hero-content-inset\)/)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-section:not\(\.rd-section--banner\)[^{]*\{[^}]*padding-inline:\s*var\(--desktop-axis\)/)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-case-visual\s*\{[^}]*padding-left:\s*var\(--desktop-axis\)/)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-section#casos\s*\{[^}]*padding-inline:\s*var\(--desktop-axis\)/)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-research-banner\s*\{[^}]*padding-left:\s*var\(--desktop-axis\)/)
  })

  it('pulls every desktop project detail pair closer to the headline as one balanced group', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-case-visual-narrative\s*\{[^}]*align-items:\s*stretch[^}]*margin-top:\s*clamp\(4rem,\s*8vw,\s*8rem\)/)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-case-visual-headline\s*\{[^}]*align-self:\s*start/)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-case-visual-details\s*\{[^}]*width:\s*min\(34rem,\s*100%\)[^}]*gap:\s*clamp\(\.65rem,\s*\.8vw,\s*1rem\)[^}]*justify-self:\s*start[^}]*transform:\s*translate\(32px,\s*calc\(-1 \* clamp\(3\.5rem,\s*5vw,\s*6rem\)\)\)/)
  })

  it('widens the desktop research headline and keeps its fluorescent copy at a fixed rhythm', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-research-copy h2\s*\{[^}]*width:\s*min\(19ch,\s*58vw\)[^}]*max-width:\s*none[^}]*text-wrap:\s*wrap/)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-research-copy p\s*\{[^}]*margin:\s*clamp\(3rem,\s*5vw,\s*5rem\)\s+0\s+1\.6rem[^}]*color:\s*#d9ff43/i)
  })

  it('keeps the hero seamless and uses the LaLiga coral surface', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')
    expect(css).toMatch(/\.rd-hero-art\s*\{[^}]*background:\s*var\(--bg\)/)
    expect(css).toMatch(/\.rd-case-visual--laliga \.rd-preview-viewport[^}]*background:\s*#ef3340/i)
  })

  it('lets case-study media surrounds inherit the reading surface in both themes', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/\.rd-case-story__media\s*\{[^}]*background:\s*transparent/)
    expect(css).toMatch(/\.rd-case-phase__visual\s*\{[^}]*padding:\s*0[^}]*border-radius:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/)
    expect(css).toMatch(/\.rd-case-phase__visual img\s*\{[^}]*border:\s*1px solid var\(--hairline\)/)
    // Manuel: «las imagenes tienen como un reborde, no queda bien, deberia
    // eliminarse ese reborde, dejando solo a las imagenes, es demasiada distraccion
    // visual». La placa de color por caso desaparece con su filete y su sombra: la
    // captura ya trae su propio radio, y lo que la separa del lienzo es la sombra de
    // la propia imagen. La guarda no se borra, cambia de objeto: antes fijaba el
    // color de la placa, ahora impide que la placa vuelva.
    expect(css).toMatch(/\.rd-case-story__frame\s*\{[^}]*background:\s*transparent/)
    expect(css).not.toMatch(/\.rd-case-story__frame--[a-z-]+\s*\{[^}]*background:/)
    expect(css).not.toMatch(/\.rd-case-story__frame\s*\{[^}]*(?:border|box-shadow):/)
    expect(css).toMatch(/\.rd-case-story__media img\s*\{[^}]*box-shadow:\s*0 2rem/)
    expect(css).toMatch(/\.rd-case-phase__frame--buy-sell,[^}]*\.rd-case-phase__frame--theuxunion,[^}]*\.rd-case-phase__frame--neutral\s*\{[^}]*background:\s*var\(--bg\)/)
    expect(css).not.toMatch(/\.rd-case-story__chapter--system \.rd-case-story__media\s*\{[^}]*background:/)
    expect(css).not.toMatch(/\.rd-case-phase__visual--(?:laliga|theuxunion|neutral)\s*\{[^}]*background:/)
  })

  it('keeps framed case images flush vertically, evenly separated and free of divider rules', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/\.rd-case-story__chapter\s*\{[^}]*margin-top:\s*clamp\(2\.5rem,\s*5vw,\s*5rem\)[^}]*border-top:\s*0/)
    expect(css).toMatch(/\.rd-case-story__chapter:last-of-type\s*\{[^}]*margin-bottom:\s*clamp\(2\.5rem,\s*5vw,\s*5rem\)/)
    // El marco ya no dibuja una placa, asi que no tiene relleno lateral. El aire
    // respecto al borde de la columna lo da ahora la anchura, no el padding.
    expect(css).toMatch(/\.rd-case-story__frame\s*\{[^}]*width:\s*calc\(100% - clamp\(1rem,\s*3vw,\s*3rem\)\)/)
    expect(css).not.toMatch(/\.rd-case-story__frame\s*\{[^}]*padding:/)
    expect(css).toMatch(/\.rd-case-phase__frame\s*\{[^}]*padding:\s*0[^}]*place-items:\s*stretch/)
    expect(css).toMatch(/\.rd-case-phase__frame\[data-fit="contain"\] img\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0[^}]*height:\s*100%/)
  })

  it('reserves hover for crystal colour and enlarges the footer art on desktop', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')
    expect(css).toMatch(/\.rd-now__list button:hover\s*\{[^}]*color:\s*var\(--crystal-lilac\)/)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-footer-artwork\s*\{[^}]*width:\s*min\(112vw,\s*108rem\)/)
  })

  it('strengthens the desktop navigation without changing the mobile scale', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-desktop-nav\s*\{[^}]*gap:\s*clamp\(1\.1rem,\s*1\.8vw,\s*2rem\)/)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-desktop-nav\s+a:not\(\.rd-nav-contact\)\s*\{[^}]*font-size:\s*\.96rem/)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-desktop-nav \.rd-nav-contact\s*\{[^}]*font-size:\s*\.92rem/)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-brand-monogram\s*\{[^}]*width:\s*3rem[^}]*height:\s*2\.45rem/)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-brand:hover \.rd-brand-monogram\s*\{[^}]*color:\s*var\(--crystal-lilac\)/)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-brand-wordmark\s*\{[^}]*font-size:\s*clamp\(1\.05rem,\s*1\.15vw,\s*1\.12rem\)/)
  })

  it('tightens and shifts the desktop manifesto columns without changing mobile', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-manifesto-copy\s*\{[^}]*width:\s*min\(48rem,\s*52%\)[^}]*gap:\s*clamp\(\.7rem,\s*1vw,\s*1rem\)[^}]*margin-left:\s*31%/)
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*\.rd-manifesto-copy\s*\{[^}]*margin-left:\s*0/)
  })

  it('uses pointer cursors and slightly smaller lower carousel controls on desktop', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')
    expect(css).toMatch(/\.rd-case-visual,\s*\.rd-case-hit-area\s*\{[^}]*cursor:\s*pointer/)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-preview-controls\s*\{[^}]*bottom:\s*1\.5rem/)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-preview-controls button\s*\{[^}]*width:\s*2\.5rem[^}]*height:\s*2\.5rem/)
  })

  it('reveals project titles on desktop and keeps mobile titles immediate', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-case-title-reveal\s*\{[^}]*transform:\s*translate3d\(0,\s*115%,\s*0\)[^}]*clip-path:\s*inset\(100% 0 0 0\)/)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*\.rd-case-title\.is-in \.rd-case-title-reveal\s*\{[^}]*transform:\s*translate3d\(0,\s*0,\s*0\)[^}]*clip-path:\s*inset\(0 0 0 0\)/)
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*\.rd-case-title-reveal\s*\{[^}]*transform:\s*none[^}]*clip-path:\s*none/)
  })

  it('gives the case prelude CTAs distinct hover and keyboard-focus feedback', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')

    expect(css).toMatch(/\.rd-prelude-progress li:not\(\.is-active\) a:is\(:hover,\s*:focus-visible\)\s*\{[^}]*color:\s*var\(--crystal-lilac\)[^}]*transform:\s*translateY\(-1px\)/)
    expect(css).toMatch(/\.rd-prelude-progress li:not\(\.is-active\) a:is\(:hover,\s*:focus-visible\)::after\s*\{[^}]*width:\s*1\.15rem/)
  })
})
