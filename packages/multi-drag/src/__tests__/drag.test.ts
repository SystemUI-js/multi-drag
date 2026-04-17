import { Drag } from '../drag/drag'
import { createAnElement, mockMouseMove, mockTouchMove } from './utils'

describe('Drag', () => {
    it('drags with mouse', () => {
        const element = createAnElement()
        new Drag(element)
        mockMouseMove(element, { x: 50, y: 50 }, { x: 60, y: 50 })
        expect(element.style.left).toBe('10px')
    })

    it('drags with two fingers by average delta', () => {
        const element = createAnElement()
        new Drag(element)
        mockTouchMove(element, { x: 60, y: 50 }, { x: 100, y: 50 }, 2)
        expect(element.style.left).toBe('40px')
    })
})
