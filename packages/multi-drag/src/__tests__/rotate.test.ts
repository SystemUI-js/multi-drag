import { Rotate } from '../drag/rotate'
import { createAnElement, mockMouseMove, mockTouchMove } from './utils'

describe('Rotate', () => {
  it('rotates with pointer interaction', () => {
    const element = createAnElement()
    new Rotate(element)
    mockMouseMove(element, { x: 50, y: 50 }, { x: 60, y: 60 })
    expect(element.style.transform).toContain('rotate')
  })

  it('rotates with two pointers', () => {
    const element = createAnElement()
    new Rotate(element)
    mockTouchMove(element, { x: 50, y: 50 }, { x: 70, y: 70 }, 2)
    expect(element.style.transform).toContain('rotate')
  })
})
