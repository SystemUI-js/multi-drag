import { Mixin, MixinType } from '../drag/mixin'
import { createAnElement, createPointerEvent, mockTouchMove } from './utils'

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

  it('keeps two-finger scale when the second finger lifts', () => {
    const element = createAnElement()
    new Mixin(element, {}, [MixinType.Drag, MixinType.Scale], [MixinType.Drag])

    element.dispatchEvent(
      createPointerEvent('pointerdown', {
        clientX: 0,
        clientY: 50,
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true
      })
    )

    element.dispatchEvent(
      createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 50,
        pointerId: 2,
        pointerType: 'touch',
        isPrimary: false
      })
    )

    document.dispatchEvent(
      createPointerEvent('pointermove', {
        clientX: 150,
        clientY: 50,
        pointerId: 2,
        pointerType: 'touch',
        isPrimary: false
      })
    )

    expect(element.style.transform).toContain('scale(1.5)')

    document.dispatchEvent(
      createPointerEvent('pointerup', {
        clientX: 150,
        clientY: 50,
        pointerId: 2,
        pointerType: 'touch',
        isPrimary: false
      })
    )

    expect(element.style.transform).toContain('scale(1.5)')

    document.dispatchEvent(
      createPointerEvent('pointermove', {
        clientX: 10,
        clientY: 50,
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true
      })
    )

    expect(element.style.left).not.toBe('0px')
    expect(element.style.transform).toContain('scale(1.5)')
  })
})
