import { DragBase } from '..'
import { DragOperationType } from '../base'
import { createAnElement, mockMouseMove, mockTouchMove } from './utils'

describe('[DragBase] base test', () => {
    it('should be a function', () => {
        expect(typeof DragBase).toBe('function')
    })
    it('should be a class', () => {
        expect(DragBase.prototype.constructor).toBe(DragBase)
    })
    it('should have a prototype', () => {
        expect(DragBase.prototype).toBeDefined()
    })
    it('should have a constructor', () => {
        expect(DragBase.prototype.constructor).toBe(DragBase)
    })
    it('should have a addEventListener method', () => {
        expect(typeof DragBase.prototype.addEventListener).toBe('function')
    })
})

describe('[DragBase] addEventListener test', () => {
    it('should add an event listener', () => {
        const element = createAnElement()
        const dragBase = new DragBase(element)
        const listener = jest.fn()
        dragBase.addEventListener(DragOperationType.Start, listener)
        dragBase.addEventListener(DragOperationType.Move, listener)
        dragBase.addEventListener(DragOperationType.End, listener)
        expect(listener).toBeDefined()
        dragBase.trigger(DragOperationType.Start, [])
        dragBase.trigger(DragOperationType.Move, [])
        dragBase.trigger(DragOperationType.End, [])
        expect(listener).toHaveBeenCalledTimes(3)
    })
    it('should remove an event listener', () => {
        const element = createAnElement()
        const dragBase = new DragBase(element)
        const listener = jest.fn()
        dragBase.addEventListener(DragOperationType.Start, listener)
        dragBase.removeEventListener(DragOperationType.Start, listener)
        dragBase.trigger(DragOperationType.Start, [])
        expect(listener).toHaveBeenCalledTimes(0)
    })
    it('test enabled', () => {
        const element = createAnElement()
        const dragBase = new DragBase(element)
        const listener = jest.fn()
        dragBase.addEventListener(DragOperationType.Start, listener)
        dragBase.setDisabled()
        dragBase.trigger(DragOperationType.Start, [])
        mockMouseMove(element, { x: 50, y: 50 }, { x: 60, y: 50 })
        expect(listener).toHaveBeenCalledTimes(0)
        dragBase.setEnabled()
        dragBase.trigger(DragOperationType.Start, [])
        mockMouseMove(element, { x: 50, y: 50 }, { x: 60, y: 50 })
        expect(listener).toHaveBeenCalledTimes(2)
    })
    it('test setPassive', () => {
        const element = createAnElement()
        const dragBase = new DragBase(element)
        const startListener = jest.fn()
        dragBase.addEventListener(DragOperationType.Start, startListener)
        const moveListener = jest.fn()
        dragBase.addEventListener(DragOperationType.Move, moveListener)
        dragBase.setPassive(true)
        mockMouseMove(element, { x: 50, y: 50 }, { x: 60, y: 50 })
        expect(startListener).toHaveBeenCalledTimes(0)
        expect(moveListener).toHaveBeenCalledTimes(0)
    })
})

describe('[DragBase] maxFingerCount', () => {
    it('maxFingerCount === 1, but finger count is 2', () => {
        const element = createAnElement()
        const dragBase = new DragBase(element)
        const listener = jest.fn()
        dragBase.addEventListener(DragOperationType.Move, listener)
        mockTouchMove(element, { x: 40, y: 40 }, { x: 50, y: 50 }, 2)
        // 两根手指移动两次
        expect(listener).toHaveBeenCalledTimes(2)
    })
})

describe('[DragBase] fingers onDestroy', () => {
    it('should destroy fingers when onDestroy', () => {
        const element = createAnElement()
        const dragBase = new DragBase(element)
        mockTouchMove(element, { x: 40, y: 40 }, { x: 50, y: 50 }, 100)
        expect(dragBase.getFingers().length).toBe(0)
    })
})
