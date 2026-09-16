import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {describe,expect,it} from 'vitest'
import {HeroOrbCanvas} from './HeroOrbCanvas'

describe('organic hero decorative boundary',()=>{
  it('renders a decorative canvas without duplicating the accessible identity',()=>{
    const markup=renderToStaticMarkup(createElement(HeroOrbCanvas,{isDark:true,reduceMotion:false,isCompact:false}))
    expect(markup).toContain('aria-hidden="true"')
    expect(markup.match(/<canvas/g)).toHaveLength(1)
    expect(markup).not.toContain('Manuel')
  })
})
