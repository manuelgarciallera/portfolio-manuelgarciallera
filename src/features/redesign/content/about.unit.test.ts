import { describe, expect, it } from 'vitest'

import { ABOUT_FACTS, ABOUT_NOW } from './about'

describe('about content', () => {
  it('positions 3D and interior architecture as a complementary spatial practice', () => {
    expect(ABOUT_FACTS).toContainEqual({
      label: 'Práctica espacial',
      value: '3D · Arquitectura de interiores',
    })
    expect(ABOUT_NOW.at(-1)).toContain('práctica complementaria')
  })
})
