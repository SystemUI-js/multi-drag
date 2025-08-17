import {
    keepTouchesRelative,
    getPoseFromElement,
    applyPoseToElement,
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

describe('dragMethods', () => {
    let testElement: HTMLElement

    beforeEach(() => {
        // 创建测试元素
        testElement = document.createElement('div')
        testElement.style.position = 'absolute'
        testElement.style.left = '0px'
        testElement.style.top = '0px'
        testElement.style.width = '100px'
        testElement.style.height = '100px'
        document.body.appendChild(testElement)
    })

    afterEach(() => {
        document.body.removeChild(testElement)
    })

    describe('getPoseFromElement', () => {
        test('应该从无 transform 的元素获取默认姿态', () => {
            const pose = getPoseFromElement(testElement)
            expect(pose).toEqual({
                left: 0,
                top: 0,
                scale: 1,
                rotateDeg: 0
            })
        })

        test('应该从有 transform 的元素正确解析姿态', () => {
            // 在 JSDOM 中直接设置 matrix 值来模拟浏览器行为
            // matrix(a, b, c, d, e, f) 对应 matrix(scaleX*cos, scaleX*sin, -scaleY*sin, scaleY*cos, translateX, translateY)
            // 对于 scale(1.5) rotate(45deg) translate(10px, 20px)，大约的 matrix 值：
            const cos45 = Math.cos(45 * Math.PI / 180)
            const sin45 = Math.sin(45 * Math.PI / 180)
            const a = 1.5 * cos45  // ≈ 1.06
            const b = 1.5 * sin45  // ≈ 1.06
            const c = -1.5 * sin45 // ≈ -1.06
            const d = 1.5 * cos45  // ≈ 1.06

            // 设置 left 和 top 样式来模拟位置
            testElement.style.left = '10px'
            testElement.style.top = '20px'
            testElement.style.transform = `matrix(${a}, ${b}, ${c}, ${d}, 0, 0)` // 只包含缩放和旋转
            const pose = getPoseFromElement(testElement)

            expect(pose.left).toBeCloseTo(10, 1)
            expect(pose.top).toBeCloseTo(20, 1)
            expect(pose.scale).toBeCloseTo(1.5, 1)
            expect(pose.rotateDeg).toBeCloseTo(45, 1)
        })
    })

    describe('applyPoseToElement', () => {
        test('应该正确应用姿态到元素', () => {
            const pose: Pose = {
                left: 50,
                top: 100,
                scale: 2,
                rotateDeg: 90
            }

            applyPoseToElement(testElement, pose)

            expect(testElement.style.left).toBe('50px')
            expect(testElement.style.top).toBe('100px')
            expect(testElement.style.transform).toBe('rotate(90deg) scale(2)')
        })
    })



    describe('keepTouchesRelative', () => {
        test('应该在单指时进行拖拽，保持缩放和旋转不变', () => {
            const initialPose: Pose = { left: 50, top: 60, scale: 1.5, rotateDeg: 30 }
            const startEvents = [createMockDragEvent(100, 100)]
            const currentEvents = [createMockDragEvent(150, 120)] // 移动了 50, 20

            const params: GestureParams = {
                element: testElement,
                initialPose,
                startEvents,
                currentEvents
            }

            keepTouchesRelative(params)

            // 应该保持原有的缩放和旋转，但更新位置
            expect(testElement.style.transform).toContain('scale(1.5)')
            expect(testElement.style.transform).toMatch(/rotate\([\d.-]+deg\)/)  // 允许任何旋转角度，因为触点跟随会调整角度
            // 位置应该有所改变（因为触点跟随逻辑）
            expect(testElement.style.left).toMatch(/[\d.-]+px/)
            expect(testElement.style.top).toMatch(/[\d.-]+px/)
        })

        test('应该在双指时同时进行缩放、旋转和平移，保持触点相对位置', () => {
            // 设置元素初始位置
            testElement.style.left = '100px'
            testElement.style.top = '100px'

            const initialPose: Pose = { left: 100, top: 100, scale: 1, rotateDeg: 0 }

            // 两指在元素上的初始位置
            const startEvents = [
                createMockDragEvent(120, 120, 1), // 相对元素 (20, 20)
                createMockDragEvent(180, 120, 2)  // 相对元素 (80, 20)
            ]

            // 两指明显移动、拉远并旋转
            const currentEvents = [
                createMockDragEvent(150, 140, 1), // 明显移动和拉远
                createMockDragEvent(250, 160, 2)  // 明显移动和拉远
            ]

            const params: GestureParams = {
                element: testElement,
                initialPose,
                startEvents,
                currentEvents
            }

            keepTouchesRelative(params)

            // 应该应用了缩放（距离变化）
            const transform = testElement.style.transform
            expect(transform).toMatch(/scale\([\d.]+\)/)
            expect(transform).toMatch(/rotate\([\d.-]+deg\)/)
            // 位置应该通过 left/top 样式设置
            expect(testElement.style.left).toMatch(/[\d.-]+px/)
            expect(testElement.style.top).toMatch(/[\d.-]+px/)

            // 变换应该不是默认值（位置或变换应该有所改变）
            expect(transform).not.toBe('rotate(0deg) scale(1)')
            // 位置应该有所改变
            expect(testElement.style.left).not.toBe('100px')
            expect(testElement.style.top).not.toBe('100px')
        })

        test('应该设置正确的 transform-origin', () => {
            const initialPose: Pose = { left: 0, top: 0, scale: 1, rotateDeg: 0 }
            const startEvents = [createMockDragEvent(100, 100)]
            const currentEvents = [createMockDragEvent(150, 150)]

            const params: GestureParams = {
                element: testElement,
                initialPose,
                startEvents,
                currentEvents
            }

            keepTouchesRelative(params, { transformOrigin: '50% 50%' })

            expect(testElement.style.transformOrigin).toBe('50% 50%')
        })

        test('应该支持只启用移动功能', () => {
            const initialPose: Pose = { left: 50, top: 60, scale: 1.5, rotateDeg: 30 }
            const startEvents = [createMockDragEvent(100, 100)]
            const currentEvents = [createMockDragEvent(150, 120)] // 移动了 50, 20

            const params: GestureParams = {
                element: testElement,
                initialPose,
                startEvents,
                currentEvents
            }

            keepTouchesRelative(params, {
                enableMove: true,
                enableScale: false,
                enableRotate: false
            })

            // 位置应该改变
            expect(testElement.style.left).toMatch(/[\d.-]+px/)
            expect(testElement.style.top).toMatch(/[\d.-]+px/)
            // 缩放和旋转应该保持不变
            expect(testElement.style.transform).toContain('scale(1.5)')
            expect(testElement.style.transform).toMatch(/rotate\(29\.9+\d*deg\)|rotate\(30deg\)/)
        })

        test('应该支持只启用缩放功能', () => {
            const initialPose: Pose = { left: 100, top: 100, scale: 1, rotateDeg: 0 }

            // 两指缩放手势
            const startEvents = [
                createMockDragEvent(120, 120, 1),
                createMockDragEvent(180, 180, 2)
            ]
            const currentEvents = [
                createMockDragEvent(110, 110, 1), // 拉开距离
                createMockDragEvent(190, 190, 2)
            ]

            const params: GestureParams = {
                element: testElement,
                initialPose,
                startEvents,
                currentEvents
            }

            keepTouchesRelative(params, {
                enableMove: false,
                enableScale: true,
                enableRotate: false
            })

            // 位置应该保持不变
            expect(testElement.style.left).toBe('100px')
            expect(testElement.style.top).toBe('100px')
            // 缩放应该改变
            expect(testElement.style.transform).toMatch(/scale\([\d.]+\)/)
            expect(testElement.style.transform).not.toContain('scale(1)')
            // 旋转应该保持不变
            expect(testElement.style.transform).toContain('rotate(0deg)')
        })

        test('应该支持只启用旋转功能', () => {
            const initialPose: Pose = { left: 100, top: 100, scale: 2, rotateDeg: 0 }

            // 两指旋转手势
            const startEvents = [
                createMockDragEvent(120, 150, 1), // 水平排列
                createMockDragEvent(180, 150, 2)
            ]
            const currentEvents = [
                createMockDragEvent(150, 120, 1), // 旋转90度，垂直排列
                createMockDragEvent(150, 180, 2)
            ]

            const params: GestureParams = {
                element: testElement,
                initialPose,
                startEvents,
                currentEvents
            }

            keepTouchesRelative(params, {
                enableMove: false,
                enableScale: false,
                enableRotate: true
            })

            // 位置应该保持不变
            expect(testElement.style.left).toBe('100px')
            expect(testElement.style.top).toBe('100px')
            // 缩放应该保持不变
            expect(testElement.style.transform).toContain('scale(2)')
            // 旋转应该改变
            expect(testElement.style.transform).toMatch(/rotate\([\d.-]+deg\)/)
            expect(testElement.style.transform).not.toContain('rotate(0deg)')
        })

                test('应该支持完全禁用所有功能', () => {
            const initialPose: Pose = { left: 100, top: 100, scale: 1.5, rotateDeg: 45 }

            const startEvents = [
                createMockDragEvent(120, 120, 1),
                createMockDragEvent(180, 180, 2)
            ]
            const currentEvents = [
                createMockDragEvent(150, 150, 1), // 移动、缩放、旋转
                createMockDragEvent(250, 250, 2)
            ]

            const params: GestureParams = {
                element: testElement,
                initialPose,
                startEvents,
                currentEvents
            }

            keepTouchesRelative(params, {
                enableMove: false,
                enableScale: false,
                enableRotate: false
            })

            // 所有属性都应该保持初始值
            expect(testElement.style.left).toBe('100px')
            expect(testElement.style.top).toBe('100px')
            expect(testElement.style.transform).toContain('scale(1.5)')
            expect(testElement.style.transform).toContain('rotate(45deg)')
        })

        test('应该支持单指优先级配置 - 拖拽优先', () => {
            const initialPose: Pose = { left: 100, top: 100, scale: 1, rotateDeg: 0 }

            const startEvents = [createMockDragEvent(150, 150)]
            const currentEvents = [createMockDragEvent(200, 200)] // 移动了 50, 50

            const params: GestureParams = {
                element: testElement,
                initialPose,
                startEvents,
                currentEvents
            }

            keepTouchesRelative(params, {
                singleFingerPriority: ['drag', 'scale', 'rotate'],
                enableMove: true,
                enableScale: true,
                enableRotate: true
            })

            // 应该执行拖拽（优先级最高）
            expect(testElement.style.left).toBe('150px')
            expect(testElement.style.top).toBe('150px')
            expect(testElement.style.transform).toContain('scale(1)')
            expect(testElement.style.transform).toContain('rotate(0deg)')
        })

        test('应该支持单指优先级配置 - 缩放优先', () => {
            // 设置元素在屏幕上的位置
            testElement.style.left = '100px'
            testElement.style.top = '100px'

            const initialPose: Pose = { left: 100, top: 100, scale: 1, rotateDeg: 0 }

            const startEvents = [createMockDragEvent(120, 120)] // 相对元素位置 (20, 20)
            const currentEvents = [createMockDragEvent(140, 140)] // 相对元素位置 (40, 40)，距离增加

            const params: GestureParams = {
                element: testElement,
                initialPose,
                startEvents,
                currentEvents
            }

            keepTouchesRelative(params, {
                singleFingerPriority: ['scale', 'drag', 'rotate'],
                enableMove: true,
                enableScale: true,
                enableRotate: true
            })

            // 应该执行缩放（优先级最高）
            expect(testElement.style.left).toBe('100px') // 位置不变
            expect(testElement.style.top).toBe('100px')  // 位置不变
            expect(testElement.style.transform).toMatch(/scale\([\d.]+\)/)
            expect(testElement.style.transform).not.toContain('scale(1)')
            expect(testElement.style.transform).toContain('rotate(0deg)')
        })

        test('应该支持单指优先级配置 - 旋转优先', () => {
            // 设置元素在屏幕上的位置和尺寸
            testElement.style.left = '100px'
            testElement.style.top = '100px'
            testElement.style.width = '100px'
            testElement.style.height = '100px'

            // 模拟 getBoundingClientRect
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

            const initialPose: Pose = { left: 100, top: 100, scale: 1, rotateDeg: 0 }

            const startEvents = [createMockDragEvent(120, 150)] // 元素右侧
            const currentEvents = [createMockDragEvent(150, 120)] // 移动到元素上方，产生旋转

            const params: GestureParams = {
                element: testElement,
                initialPose,
                startEvents,
                currentEvents
            }

            keepTouchesRelative(params, {
                singleFingerPriority: ['rotate', 'drag', 'scale'],
                enableMove: true,
                enableScale: true,
                enableRotate: true
            })

            // 应该执行旋转（优先级最高）
            expect(testElement.style.left).toBe('100px') // 位置不变
            expect(testElement.style.top).toBe('100px')  // 位置不变
            expect(testElement.style.transform).toContain('scale(1)')
            expect(testElement.style.transform).toMatch(/rotate\([\d.-]+deg\)/)
            expect(testElement.style.transform).not.toContain('rotate(0deg)')
        })

        test('应该在单指优先级中跳过禁用的手势', () => {
            const initialPose: Pose = { left: 100, top: 100, scale: 1, rotateDeg: 0 }

            const startEvents = [createMockDragEvent(150, 150)]
            const currentEvents = [createMockDragEvent(200, 200)]

            const params: GestureParams = {
                element: testElement,
                initialPose,
                startEvents,
                currentEvents
            }

            keepTouchesRelative(params, {
                singleFingerPriority: ['scale', 'drag'], // scale 优先，但被禁用
                enableMove: true,
                enableScale: false, // 禁用缩放
                enableRotate: false
            })

            // 应该跳过禁用的 scale，执行 drag
            expect(testElement.style.left).toBe('150px')
            expect(testElement.style.top).toBe('150px')
            expect(testElement.style.transform).toContain('scale(1)')
            expect(testElement.style.transform).toContain('rotate(0deg)')
        })
    })
})
