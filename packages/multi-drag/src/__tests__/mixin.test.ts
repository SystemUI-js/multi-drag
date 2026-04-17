import { Mixin, MixinType } from '../drag/mixin'
import { createAnElement, mockTouchMove } from './utils'

describe('Mixin', () => {
  it('defaults to drag only for single finger gestures', () => {
    const element = createAnElement()
    new Mixin(element, {}, [MixinType.Drag, MixinType.Scale, MixinType.Rotate])

    mockTouchMove(element, { x: 50, y: 50 }, { x: 70, y: 70 }, 1)

    expect(element.style.left).toBe('20px')
    expect(element.style.top).toBe('20px')
    expect(element.style.transform).toBe('rotate(0deg)scale(1)')
  })

  it('respects singleFingerMixinTypes when provided', () => {
    const element = createAnElement()
    new Mixin(
      element,
      {},
      [MixinType.Drag, MixinType.Scale],
      [MixinType.Drag, MixinType.Scale]
    )

    mockTouchMove(element, { x: 50, y: 50 }, { x: 70, y: 70 }, 1)

    expect(element.style.transform).not.toBe('rotate(0deg)scale(1)')
    expect(element.style.transform).toContain('scale')
  })
})
