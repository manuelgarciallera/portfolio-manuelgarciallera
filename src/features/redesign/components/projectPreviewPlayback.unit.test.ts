import { describe, expect, it } from 'vitest'

import {
  advancePreviewFrame,
  centeredTabScrollLeft,
  frameDurationMs,
  selectCenteredPreview,
  type PreviewFrame,
} from './projectPreviewPlayback'

describe('project preview playback', () => {
  it('starts an eligible preview even when its last quarter is below the viewport', () => {
    const active = selectCenteredPreview([
      { id: 'buy-sell', top: -420, bottom: 230 },
      { id: 'laliga', top: 200, bottom: 1044 },
      { id: 'coordination', top: 1050, bottom: 1700 },
    ], 844)

    expect(active).toBe('laliga')
  })

  it('chooses the eligible preview closest to the viewport centre', () => {
    const active = selectCenteredPreview([
      { id: 'buy-sell', top: 100, bottom: 600 },
      { id: 'laliga', top: 300, bottom: 790 },
    ], 844)

    expect(active).toBe('buy-sell')
  })

  it('does not start a preview before three quarters of its visible capacity are on screen', () => {
    const active = selectCenteredPreview([
      { id: 'buy-sell', top: -180, bottom: 500 },
      { id: 'laliga', top: 345, bottom: 1015 },
    ], 844)

    expect(active).toBeNull()
  })

  it('uses viewport capacity for cards taller than a short landscape screen', () => {
    expect(selectCenteredPreview([{ id: 'tall', top: -200, bottom: 700 }], 400)).toBe('tall')
    expect(selectCenteredPreview([{ id: 'tall', top: 101, bottom: 1001 }], 400)).toBeNull()
    expect(selectCenteredPreview([{ id: 'edge', top: 100, bottom: 1000 }], 400)).toBe('edge')
    expect(selectCenteredPreview([{ id: 'empty', top: 0, bottom: 0 }], 400)).toBeNull()
  })

  it('activates a preview wherever it sits once all its pixels are visible', () => {
    const active = selectCenteredPreview([
      { id: 'buy-sell', top: 0, bottom: 665 },
      { id: 'laliga', top: 990, bottom: 1655 },
    ], 712)

    expect(active).toBe('buy-sell')
  })

  it('holds the cover longer and loops back to it after every slide', () => {
    let frame: PreviewFrame = { kind: 'cover' }

    expect(frameDurationMs(frame)).toBe(2300)
    frame = advancePreviewFrame(frame, 3)
    expect(frame).toEqual({ kind: 'slide', index: 0 })
    expect(frameDurationMs(frame)).toBe(4200)
    frame = advancePreviewFrame(frame, 3)
    expect(frame).toEqual({ kind: 'slide', index: 1 })
    frame = advancePreviewFrame(frame, 3)
    expect(frame).toEqual({ kind: 'slide', index: 2 })
    frame = advancePreviewFrame(frame, 3)
    expect(frame).toEqual({ kind: 'cover' })
  })

  it('keeps the active carousel pill centred without scrolling beyond the rail', () => {
    expect(centeredTabScrollLeft(520, 120, 360, 540)).toBe(400)
    expect(centeredTabScrollLeft(10, 120, 360, 540)).toBe(0)
    expect(centeredTabScrollLeft(790, 120, 360, 540)).toBe(540)
  })
})
