import { DragBase, DragOperationType } from '../drag/base'
import { createAnElement, mockMouseMove, mockTouchMove } from './utils'

describe('DragBase', () => {
    it('registers and removes listeners', () => {
        const element = createAnElement()
        const dragBase = new DragBase(element)
        const listener = jest.fn()
        dragBase.addEventListener(DragOperationType.Start, listener)
        dragBase.trigger(DragOperationType.Start, [])
        expect(listener).toHaveBeenCalledTimes(1)
        dragBase.removeEventListener(DragOperationType.Start, listener)
        dragBase.trigger(DragOperationType.Start, [])
        expect(listener).toHaveBeenCalledTimes(1)
    })

    it('respects enabled and passive mode', () => {
        const element = createAnElement()
        const dragBase = new DragBase(element)
        const listener = jest.fn()
        dragBase.addEventListener(DragOperationType.Move, listener)
        dragBase.setPassive(true)
        mockMouseMove(element, { x: 0, y: 0 }, { x: 10, y: 10 })
        expect(listener).toHaveBeenCalledTimes(0)
        dragBase.setPassive(false)
        dragBase.setDisabled()
        mockMouseMove(element, { x: 0, y: 0 }, { x: 10, y: 10 })
        expect(listener).toHaveBeenCalledTimes(0)
    })

    it('cleans fingers after end', () => {
        const element = createAnElement()
        const dragBase = new DragBase(element, { maxFingerCount: 2 })
        mockTouchMove(element, { x: 0, y: 0 }, { x: 20, y: 20 }, 2)
        expect(dragBase.getFingers().length).toBe(0)
    })
})
