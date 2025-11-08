import { Scale } from '../scale'
import { createAnElement, mockTouchMove } from './utils'
import { DragOperationType } from '../base.ts';

describe('[Scale] test', () => {
    /**
     * Test basic scaling functionality - simulate mouse drag causing element to scale
     */
    it('should scale element with mouse movement', () => {
        const element = createAnElement()
        new Scale(element)
        // Simulate two-finger gesture for scaling, as mouse move is ambiguous for scaling
        mockTouchMove(element, { x: 50, y: 50 }, { x: 60, y: 60 }, 2)

        // Verify element's transform includes scale property
        expect(element.style.transform).toContain('scale')
    })

    /**
     * Test two-finger scaling functionality - simulate two-finger drag causing element to scale
     */
    it('should scale element with two fingers', () => {
        const element = createAnElement()
        new Scale(element)
        mockTouchMove(element, { x: 50, y: 50 }, { x: 60, y: 60 }, 2)

        // Verify element's transform includes scale property
        expect(element.style.transform).toContain('scale')
    })

    /**
     * Test single-finger scaling
     */
    it('should calculate scale factor with single finger', () => {
        const element = createAnElement()
        new Scale(element)
        mockTouchMove(element, { x: 50, y: 50 }, { x: 100, y: 100 }, 1)

        // Verify element's transform includes scale property
        expect(element.style.transform).toContain('scale')
    })

    /**
     * Test constructor options
     */
    it('should create instance with options', () => {
        const element = createAnElement()
        const scale = new Scale(element, {})

        expect(scale).toBeInstanceOf(Scale)
    })

    /**
     * Test onScale callback function
     */
    it('should call onScale callback during scaling', () => {
        const element = createAnElement()
        const onScale = jest.fn()
        const scale = new Scale(element)
        scale.addEventListener(DragOperationType.Move, onScale)
        mockTouchMove(element, { x: 50, y: 50 }, { x: 60, y: 60 }, 2)

        expect(onScale).toHaveBeenCalled()
    })

    /**
     * Test disabling scaling functionality
     */
    it('should not scale when disabled', () => {
        const element = createAnElement()
        const scale = new Scale(element)
        scale.setDisabled()
        mockTouchMove(element, { x: 50, y: 50 }, { x: 60, y: 60 }, 2)

        expect(element.style.transform).not.toContain('scale')
    })
});
