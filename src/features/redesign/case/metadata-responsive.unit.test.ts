import fs from 'node:fs'
import postcss, { type ChildNode, type Document, type Root } from 'postcss'
import { expect, it } from 'vitest'

// Evaluate the equal-specificity column declarations in their actual source order.
// This catches a later tablet rule silently undoing the phone layout.
it.each([[320, '1fr'], [390, '1fr'], [767, '1fr'], [820, '1fr 1fr'], [1440, 'repeat(4, 1fr)']])(
  'keeps the metadata column layout at %ipx', (width, expected) => {
    const root = postcss.parse(fs.readFileSync('src/features/redesign/redesign.css', 'utf8'))
    let columns = ''
    root.walkRules('.rd-meta-grid', rule => {
      let active = true
      for (let parent: ChildNode | Document | Root | undefined = rule.parent; parent; parent = parent.parent) {
        if (parent.type !== 'atrule' || parent.name !== 'media') continue
        for (const match of parent.params.matchAll(/(min|max)-width:\s*(\d+)px/g)) {
          if (match[1] === 'max' ? Number(width) > Number(match[2]) : Number(width) < Number(match[2])) active = false
        }
      }
      if (active) rule.walkDecls('grid-template-columns', declaration => { columns = declaration.value })
    })
    expect(columns).toBe(expected)
  },
)
