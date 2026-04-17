import { Scale } from '../drag/scale'
import { createAnElement, mockTouchMove } from './utils'

describe('Scale', () => {
    it('scales with two pointers', () => {
        const element = createAnElement()
        new Scale(element)
        mockTouchMove(element, { x: 50, y: 50 }, { x: 80, y: 80 }, 2)
        expect(element.style.transform).toContain('scale')
    })
})
