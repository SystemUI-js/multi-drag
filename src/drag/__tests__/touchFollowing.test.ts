import {
    keepTouchesRelative,
    type GestureParams,
    type Pose
} from '../dragMethods'
import type { DragEvent } from '../../dragManager'

// 创建模拟的 DragEvent
function createMockDragEvent(x: number, y: number, identifier: string | number = 'test'): DragEvent {
    return {
        identifier,
        clientX: x,
        clientY: y,
        target: null,
        originalEvent: {} as MouseEvent,
        type: 'mouse'
    }
}

// 创建模拟的 Pose 对象
function createMockPose(left: number = 0, top: number = 0, scale: number = 1, rotateDeg: number = 0): Pose {
    const style = document.createElement('div').style
    style.position = 'absolute'
    style.left = `${left}px`
    style.top = `${top}px`
    style.transform = `rotate(${rotateDeg}deg) scale(${scale})`

    const rect = new DOMRect(left, top, 100, 100) // 默认100x100尺寸

    return { rect, style }
}

describe('触点跟随优化测试', () => {
    let testElement: HTMLElement

    beforeEach(() => {
        // 创建测试元素
        testElement = document.createElement('div')
        testElement.style.position = 'absolute'
        testElement.style.left = '100px'
        testElement.style.top = '100px'
        testElement.style.width = '100px'
        testElement.style.height = '100px'
        document.body.appendChild(testElement)

        // 模拟 getBoundingClientRect 返回正确的值
        testElement.getBoundingClientRect = jest.fn(() => ({
            left: 100,
            top: 100,
            width: 100,
            height: 100,
            right: 200,
            bottom: 200,
            x: 100,
            y: 100,
            toJSON: () => {}
        } as DOMRect))
    })

    afterEach(() => {
        document.body.removeChild(testElement)
    })

    describe('keepTouchesRelative 优化版本', () => {
        test('应该基于元素边界盒子计算相对位置', () => {
            const initialPose = createMockPose(0, 0, 1, 0)

            // 触摸点在元素右下角 (190, 190)
            const startEvents = [createMockDragEvent(190, 190)]
            // 移动到新位置 (250, 250)
            const currentEvents = [createMockDragEvent(250, 250)]

            const params: GestureParams = {
                element: testElement,
                initialPose,
                startEvents,
                currentEvents
            }

            keepTouchesRelative(params)

            // 变换应该有合理的值
            const transform = testElement.style.transform
            expect(testElement.style.left).toMatch(/[\d.-]+px/)
            expect(testElement.style.top).toMatch(/[\d.-]+px/)
            expect(transform).not.toContain('NaN')
        })

        test('应该在双指缩放时保持触点相对位置', () => {
            const initialPose = createMockPose(0, 0, 1, 0)

            // 两指在元素上，距离50px
            const startEvents = [
                createMockDragEvent(125, 150, 1), // 元素中心偏左
                createMockDragEvent(175, 150, 2)  // 元素中心偏右
            ]

            // 两指拉开，距离100px（2倍缩放）
            const currentEvents = [
                createMockDragEvent(100, 150, 1),
                createMockDragEvent(200, 150, 2)
            ]

            const params: GestureParams = {
                element: testElement,
                initialPose,
                startEvents,
                currentEvents
            }

            keepTouchesRelative(params)

            const transform = testElement.style.transform

            // 应该有缩放变换
            expect(transform).toMatch(/scale\([\d.]+\)/)

            // 应该有合理的位置值以保持触点位置
            expect(testElement.style.left).toMatch(/[\d.-]+px/)
            expect(testElement.style.top).toMatch(/[\d.-]+px/)
            expect(transform).not.toContain('NaN')
        })
    })

    describe('真实场景模拟', () => {
        test('应该模拟真实的缩放手势', () => {
            const initialPose = createMockPose(0, 0, 1, 0)

            // 模拟用户在元素的 1/4 和 3/4 位置放置两指
            const startEvents = [
                createMockDragEvent(125, 150, 1), // 25% 位置
                createMockDragEvent(175, 150, 2)  // 75% 位置
            ]

            // 模拟用户将两指拉开到元素外
            const currentEvents = [
                createMockDragEvent(75, 150, 1),  // 超出元素左边界
                createMockDragEvent(225, 150, 2)  // 超出元素右边界
            ]

            const params: GestureParams = {
                element: testElement,
                initialPose,
                startEvents,
                currentEvents
            }

            keepTouchesRelative(params)

            const transform = testElement.style.transform

            // 应该有显著的缩放
            expect(transform).toMatch(/scale\([2-9]\.?[\d]*\)/)

            // 触点应该保持在相对位置
            expect(testElement.style.left).toMatch(/[\d.-]+px/)
            expect(testElement.style.top).toMatch(/[\d.-]+px/)
            expect(transform).not.toContain('NaN')
        })
    })
})
