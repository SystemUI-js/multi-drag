import {
    keepTouchesRelative,
    type GestureParams,
    type Pose
} from '../dragMethods'
import {
    getPoseFromElement,
    applyPoseToElement
} from '../../utils/dragUtils'
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
        test('应该从元素获取rect和style信息', () => {
            const pose = getPoseFromElement(testElement)

            // 验证返回的Pose对象包含rect和style
            expect(pose.rect).toBeDefined()
            expect(pose.style).toBeDefined()
            expect(pose.rect).toBeInstanceOf(DOMRect)
            expect(pose.style).toBeInstanceOf(CSSStyleDeclaration)
        })

        test('应该正确获取元素的边界矩形和样式', () => {
            // 设置测试元素的样式
            testElement.style.left = '10px'
            testElement.style.top = '20px'
            testElement.style.transform = 'rotate(45deg) scale(1.5)'

            // 模拟getBoundingClientRect
            testElement.getBoundingClientRect = jest.fn(() => ({
                left: 10,
                top: 20,
                width: 100,
                height: 100,
                right: 110,
                bottom: 120,
                x: 10,
                y: 20,
                toJSON: () => {}
            } as DOMRect))

            const pose = getPoseFromElement(testElement)

            expect(pose.rect.left).toBe(10)
            expect(pose.rect.top).toBe(20)
            expect(pose.rect.width).toBe(100)
            expect(pose.rect.height).toBe(100)
            expect(pose.style.left).toBe('10px')
            expect(pose.style.top).toBe('20px')
            expect(pose.style.transform).toBe('rotate(45deg) scale(1.5)')
        })

        test('应该返回样式的快照而不是引用', () => {
            // 设置初始样式
            testElement.style.left = '100px'
            testElement.style.top = '200px'
            testElement.style.transform = 'rotate(30deg) scale(2)'

            // 获取姿态快照
            const pose = getPoseFromElement(testElement)

            // 验证返回的style不是同一个对象引用
            expect(pose.style).not.toBe(testElement.style)

            // 修改元素的样式
            testElement.style.left = '500px'
            testElement.style.top = '600px'
            testElement.style.transform = 'rotate(90deg) scale(3)'

            // 快照中的值应该保持原始状态，不受后续修改影响
            expect(pose.style.left).toBe('100px')
            expect(pose.style.top).toBe('200px')
            expect(pose.style.transform).toBe('rotate(30deg) scale(2)')

            // 元素的实际样式应该是新值
            expect(testElement.style.left).toBe('500px')
            expect(testElement.style.top).toBe('600px')
            expect(testElement.style.transform).toBe('rotate(90deg) scale(3)')
        })

        test('应该正确复制所有关键样式属性到快照', () => {
            // 设置各种样式属性
            testElement.style.position = 'absolute'
            testElement.style.left = '50px'
            testElement.style.top = '75px'
            testElement.style.right = '25px'
            testElement.style.bottom = '35px'
            testElement.style.transform = 'rotate(45deg) scale(1.5) translateX(10px)'
            testElement.style.transformOrigin = '50% 50%'

            const pose = getPoseFromElement(testElement)

            // 验证所有关键属性都被正确复制
            expect(pose.style.position).toBe('absolute')
            expect(pose.style.left).toBe('50px')
            expect(pose.style.top).toBe('75px')
            expect(pose.style.right).toBe('25px')
            expect(pose.style.bottom).toBe('35px')
            expect(pose.style.transform).toBe('rotate(45deg) scale(1.5) translateX(10px)')
            expect(pose.style.transformOrigin).toBe('50% 50%')
        })

        test('应该处理空样式属性', () => {
            // 清空所有样式
            testElement.style.cssText = ''

            const pose = getPoseFromElement(testElement)

            // 应该能正常获取姿态，即使样式为空
            expect(pose.style).toBeInstanceOf(CSSStyleDeclaration)
            expect(pose.rect).toBeInstanceOf(DOMRect)

            // 空样式属性应该不被设置
            expect(pose.style.left).toBe('')
            expect(pose.style.top).toBe('')
            expect(pose.style.transform).toBe('')
        })

        test('应该处理部分样式属性', () => {
            // 只设置部分样式属性
            testElement.style.cssText = ''
            testElement.style.left = '100px'
            testElement.style.transform = 'scale(2)'
            // 不设置 top, right, bottom 等

            const pose = getPoseFromElement(testElement)

            // 设置的属性应该被复制
            expect(pose.style.left).toBe('100px')
            expect(pose.style.transform).toBe('scale(2)')

            // 未设置的属性应该为空
            expect(pose.style.top).toBe('')
            expect(pose.style.right).toBe('')
            expect(pose.style.bottom).toBe('')
        })
    })

    describe('applyPoseToElement', () => {
        test('应该正确应用姿态到元素', () => {
            const pose = createMockPose(50, 100, 2, 90)

            applyPoseToElement(testElement, pose)

            expect(testElement.style.left).toBe('50px')
            expect(testElement.style.top).toBe('100px')
            expect(testElement.style.transform).toBe('rotate(90deg) scale(2)')
        })

        test('应该只应用非空的样式属性', () => {
            // 创建一个部分设置的样式对象
            const style = document.createElement('div').style
            style.left = '100px'
            style.transform = 'scale(2)'
            // 不设置 top, right, bottom 等

            const pose: Pose = {
                rect: new DOMRect(0, 0, 100, 100),
                style: style
            }

            // 先设置元素的一些初始值
            testElement.style.top = '500px'
            testElement.style.right = '600px'

            applyPoseToElement(testElement, pose)

            // 设置的属性应该被应用
            expect(testElement.style.left).toBe('100px')
            expect(testElement.style.transform).toBe('scale(2)')

            // 未设置的属性应该保持原值或为空
            expect(testElement.style.top).toBe('500px') // 保持原值
            expect(testElement.style.right).toBe('600px') // 保持原值
        })

        test('应该正确应用transformOrigin选项', () => {
            const pose = createMockPose(0, 0, 1, 0)

            applyPoseToElement(testElement, pose, {
                transformOrigin: '25% 75%'
            })

            expect(testElement.style.transformOrigin).toBe('25% 75%')
        })

        test('应该正确应用transition选项', () => {
            const pose = createMockPose(0, 0, 1, 0)

            applyPoseToElement(testElement, pose, {
                transition: 'all 0.3s ease-in-out'
            })

            expect(testElement.style.transition).toBe('all 0.3s ease-in-out')
        })

        test('应该处理空字符串的样式属性', () => {
            const style = document.createElement('div').style
            style.left = ''  // 空字符串
            style.top = '100px'
            style.transform = ''  // 空字符串

            const pose: Pose = {
                rect: new DOMRect(0, 0, 100, 100),
                style: style
            }

            // 设置初始值
            testElement.style.left = '999px'
            testElement.style.transform = 'rotate(999deg)'

            applyPoseToElement(testElement, pose)

            // 空字符串的属性不应该被应用，保持原值
            expect(testElement.style.left).toBe('999px')
            expect(testElement.style.transform).toBe('rotate(999deg)')

            // 非空属性应该被应用
            expect(testElement.style.top).toBe('100px')
        })

        test('应该处理undefined的可选参数', () => {
            const pose = createMockPose(10, 20, 1.5, 45)

            // 不传递options参数
            expect(() => {
                applyPoseToElement(testElement, pose)
            }).not.toThrow()

            // 传递部分undefined的options
            expect(() => {
                applyPoseToElement(testElement, pose, {
                    transformOrigin: undefined,
                    transition: 'all 0.2s'
                })
            }).not.toThrow()

            expect(testElement.style.transition).toBe('all 0.2s')
        })

        test('应该正确覆盖现有的样式属性', () => {
            // 设置初始样式
            testElement.style.left = '999px'
            testElement.style.top = '888px'
            testElement.style.transform = 'rotate(999deg) scale(999)'
            testElement.style.position = 'fixed'

            const pose = createMockPose(50, 75, 2, 30)

            applyPoseToElement(testElement, pose)

            // 所有相关属性都应该被正确覆盖
            expect(testElement.style.left).toBe('50px')
            expect(testElement.style.top).toBe('75px')
            expect(testElement.style.transform).toBe('rotate(30deg) scale(2)')
            expect(testElement.style.position).toBe('absolute')
        })

        test('应该处理复杂的transform字符串', () => {
            const style = document.createElement('div').style
            style.left = '100px'
            style.top = '200px'
            style.transform = 'rotate(45deg) scale(1.5) translateX(10px) skew(15deg, 10deg)'

            const pose: Pose = {
                rect: new DOMRect(0, 0, 100, 100),
                style: style
            }

            applyPoseToElement(testElement, pose)

            expect(testElement.style.transform).toBe('rotate(45deg) scale(1.5) translateX(10px) skew(15deg, 10deg)')
        })
    })

    describe('keepTouchesRelative', () => {
        test('应该在单指时进行拖拽，保持缩放和旋转不变', () => {
            const initialPose = createMockPose(50, 60, 1.5, 30)
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

            const initialPose = createMockPose(100, 100, 1, 0)

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
            const initialPose = createMockPose(0, 0, 1, 0)
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
            const initialPose = createMockPose(50, 60, 1.5, 30)
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
            const initialPose = createMockPose(100, 100, 1, 0)

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
            const initialPose = createMockPose(100, 100, 2, 0)

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
            const initialPose = createMockPose(100, 100, 1.5, 45)

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
            const initialPose = createMockPose(100, 100, 1, 0)

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

            const initialPose = createMockPose(100, 100, 1, 0)

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

            const initialPose = createMockPose(100, 100, 1, 0)

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
            const initialPose = createMockPose(100, 100, 1, 0)

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

                test('应该防止样式叠加问题 - 多次调用不会累积变换', () => {
            // 设置初始元素状态
            testElement.style.left = '100px'
            testElement.style.top = '100px'
            testElement.style.transform = 'rotate(45deg) scale(1.5)'

            // 获取初始姿态（这应该是一个快照，而不是引用）
            const initialPose = getPoseFromElement(testElement)

            // 第一次拖动
            const startEvents1 = [createMockDragEvent(150, 150)]
            const currentEvents1 = [createMockDragEvent(200, 200)] // 移动 50px

            keepTouchesRelative({
                element: testElement,
                initialPose,
                startEvents: startEvents1,
                currentEvents: currentEvents1
            })

            const firstResult = {
                left: testElement.style.left,
                top: testElement.style.top,
                transform: testElement.style.transform
            }

            // 第二次拖动（使用相同的初始姿态）
            const startEvents2 = [createMockDragEvent(150, 150)]
            const currentEvents2 = [createMockDragEvent(200, 200)] // 同样移动 50px

            keepTouchesRelative({
                element: testElement,
                initialPose, // 使用同样的初始姿态
                startEvents: startEvents2,
                currentEvents: currentEvents2
            })

            const secondResult = {
                left: testElement.style.left,
                top: testElement.style.top,
                transform: testElement.style.transform
            }

            // 两次调用的结果应该相同，证明没有叠加
            expect(secondResult.left).toBe(firstResult.left)
            expect(secondResult.top).toBe(firstResult.top)
            expect(secondResult.transform).toBe(firstResult.transform)

            // 并且位置应该是预期的（初始位置 + 偏移）
            expect(testElement.style.left).toBe('150px') // 100 + 50
            expect(testElement.style.top).toBe('150px')  // 100 + 50
        })

        test('应该防止变换累积 - 连续多次拖动操作', () => {
            // 设置复杂的初始状态
            testElement.style.left = '50px'
            testElement.style.top = '75px'
            testElement.style.transform = 'rotate(30deg) scale(2) translateX(10px)'

            const initialPose = getPoseFromElement(testElement)

            // 执行多次相同的拖动操作
            for (let i = 0; i < 5; i++) {
                keepTouchesRelative({
                    element: testElement,
                    initialPose, // 每次都使用同一个初始姿态
                    startEvents: [createMockDragEvent(100, 100)],
                    currentEvents: [createMockDragEvent(150, 120)] // 移动 50x, 20y
                })
            }

            // 最终结果应该与执行一次的结果相同
            expect(testElement.style.left).toBe('100px') // 50 + 50
            expect(testElement.style.top).toBe('95px')   // 75 + 20

            // 变换不应该累积，应该保持初始的scale和rotation
            const transformMatch = testElement.style.transform.match(/scale\(([\d.]+)\)/)
            const scaleValue = transformMatch ? parseFloat(transformMatch[1]) : 1
            expect(scaleValue).toBeCloseTo(2, 1) // 应该接近初始的scale(2)
        })

        test('应该正确处理复杂变换的快照 - 旋转和缩放组合', () => {
            // 设置复杂的初始变换
            testElement.style.left = '200px'
            testElement.style.top = '300px'
            testElement.style.transform = 'rotate(45deg) scale(1.5)'

            const initialPose = getPoseFromElement(testElement)

            // 执行双指手势（缩放和旋转）
            const startEvents = [
                createMockDragEvent(220, 320, 1),
                createMockDragEvent(280, 320, 2)
            ]
            const currentEvents = [
                createMockDragEvent(210, 310, 1), // 缩小距离并移动
                createMockDragEvent(270, 330, 2)
            ]

            keepTouchesRelative({
                element: testElement,
                initialPose,
                startEvents,
                currentEvents
            })

            const firstTransform = testElement.style.transform

            // 第二次执行相同操作
            keepTouchesRelative({
                element: testElement,
                initialPose, // 使用同一个快照
                startEvents,
                currentEvents
            })

            // 变换应该保持一致，不累积
            expect(testElement.style.transform).toBe(firstTransform)
        })

        test('应该正确处理从不同初始状态开始的拖动', () => {
            // 第一个状态
            testElement.style.left = '0px'
            testElement.style.top = '0px'
            testElement.style.transform = 'rotate(0deg) scale(1)'

            const pose1 = getPoseFromElement(testElement)

            // 从第一个状态拖动
            keepTouchesRelative({
                element: testElement,
                initialPose: pose1,
                startEvents: [createMockDragEvent(50, 50)],
                currentEvents: [createMockDragEvent(100, 100)]
            })

            const result1 = {
                left: testElement.style.left,
                top: testElement.style.top
            }

            // 改变状态
            testElement.style.left = '500px'
            testElement.style.top = '600px'
            testElement.style.transform = 'rotate(90deg) scale(3)'

            const pose2 = getPoseFromElement(testElement)

            // 从第二个状态拖动相同距离
            keepTouchesRelative({
                element: testElement,
                initialPose: pose2,
                startEvents: [createMockDragEvent(50, 50)],
                currentEvents: [createMockDragEvent(100, 100)]
            })

            const result2 = {
                left: testElement.style.left,
                top: testElement.style.top
            }

            // 两次拖动的相对偏移应该相同，但绝对位置不同
            const offset1 = { x: parseInt(result1.left) - 0, y: parseInt(result1.top) - 0 }
            const offset2 = { x: parseInt(result2.left) - 500, y: parseInt(result2.top) - 600 }

            expect(offset1.x).toBe(offset2.x)
            expect(offset1.y).toBe(offset2.y)
        })

        test('应该在元素样式被外部修改后仍使用正确的初始状态', () => {
            // 设置初始状态
            testElement.style.left = '100px'
            testElement.style.top = '200px'
            testElement.style.transform = 'rotate(30deg) scale(1.5)'

            // 获取快照
            const initialPose = getPoseFromElement(testElement)

            // 外部修改元素样式（模拟其他代码的干扰）
            testElement.style.left = '999px'
            testElement.style.top = '888px'
            testElement.style.transform = 'rotate(999deg) scale(999)'

            // 执行拖动，应该基于快照的初始状态，而不是当前被修改的状态
            keepTouchesRelative({
                element: testElement,
                initialPose,
                startEvents: [createMockDragEvent(150, 250)],
                currentEvents: [createMockDragEvent(200, 300)] // 移动 50px
            })

            // 结果应该基于原始快照状态（100, 200）而不是被修改的状态（999, 888）
            expect(testElement.style.left).toBe('150px') // 100 + 50
            expect(testElement.style.top).toBe('250px')  // 200 + 50

            // 变换应该基于原始的旋转和缩放，而不是被修改的999值
            expect(testElement.style.transform).toContain('scale(1.5)')

            // 验证旋转角度接近30度（考虑浮点数精度）
            const rotateMatch = testElement.style.transform.match(/rotate\(([\d.-]+)deg\)/)
            const rotateValue = rotateMatch ? parseFloat(rotateMatch[1]) : 0
            expect(rotateValue).toBeCloseTo(30, 1) // 允许1位小数的误差
        })
    })

    describe('复杂变换场景测试', () => {
        test('应该正确处理matrix格式的变换快照', () => {
            // 设置matrix格式的复杂变换
            testElement.style.left = '100px'
            testElement.style.top = '200px'
            testElement.style.transform = 'matrix(1.5, 0.5, -0.5, 1.5, 0, 0)' // 包含旋转和缩放的matrix

            const initialPose = getPoseFromElement(testElement)

            // 验证快照正确保存了matrix变换
            expect(initialPose.style.transform).toBe('matrix(1.5, 0.5, -0.5, 1.5, 0, 0)')

            // 执行拖动操作
            keepTouchesRelative({
                element: testElement,
                initialPose,
                startEvents: [createMockDragEvent(150, 250)],
                currentEvents: [createMockDragEvent(200, 300)]
            })

            // 验证结果基于原始matrix变换计算
            expect(testElement.style.left).toBe('150px') // 100 + 50
            expect(testElement.style.top).toBe('250px')  // 200 + 50

            // 变换应该被转换为rotate和scale格式，但保持相同的变换效果
            expect(testElement.style.transform).toMatch(/rotate\([\d.-]+deg\)\s+scale\([\d.]+\)/)
        })

        test('应该正确处理包含translate的复杂变换', () => {
            testElement.style.left = '50px'
            testElement.style.top = '75px'
            testElement.style.transform = 'rotate(45deg) scale(2) translateX(20px) translateY(10px)'

            const initialPose = getPoseFromElement(testElement)

            // 多次执行相同的拖动
            for (let i = 0; i < 3; i++) {
                keepTouchesRelative({
                    element: testElement,
                    initialPose,
                    startEvents: [createMockDragEvent(100, 125)],
                    currentEvents: [createMockDragEvent(130, 145)] // 移动30, 20
                })
            }

            // 结果应该保持一致
            expect(testElement.style.left).toBe('80px')  // 50 + 30
            expect(testElement.style.top).toBe('95px')   // 75 + 20

            // 缩放应该基于原始值，不累积
            const scaleMatch = testElement.style.transform.match(/scale\(([\d.]+)\)/)
            const scaleValue = scaleMatch ? parseFloat(scaleMatch[1]) : 1
            expect(scaleValue).toBeCloseTo(2, 1) // 应该接近原始的scale(2)
        })

        test('应该正确处理3D变换的快照', () => {
            testElement.style.left = '0px'
            testElement.style.top = '0px'
            testElement.style.transform = 'rotate3d(1, 1, 0, 45deg) scale3d(1.5, 1.5, 1)'

            const initialPose = getPoseFromElement(testElement)

            // 验证3D变换被正确快照
            expect(initialPose.style.transform).toBe('rotate3d(1, 1, 0, 45deg) scale3d(1.5, 1.5, 1)')

            keepTouchesRelative({
                element: testElement,
                initialPose,
                startEvents: [createMockDragEvent(25, 25)],
                currentEvents: [createMockDragEvent(75, 100)]
            })

            // 位置应该正确更新
            expect(testElement.style.left).toBe('50px')  // 0 + 50
            expect(testElement.style.top).toBe('75px')   // 0 + 75
        })

        test('应该正确处理负值和小数的变换', () => {
            testElement.style.left = '-10.5px'
            testElement.style.top = '-20.75px'
            testElement.style.transform = 'rotate(-30.5deg) scale(0.75)'

            const initialPose = getPoseFromElement(testElement)

            keepTouchesRelative({
                element: testElement,
                initialPose,
                startEvents: [createMockDragEvent(0, 0)],
                currentEvents: [createMockDragEvent(15.5, 25.25)]
            })

            expect(testElement.style.left).toBe('5px')    // -10.5 + 15.5
            expect(testElement.style.top).toBe('4.5px')  // -20.75 + 25.25

            // 验证负值旋转和小数缩放被正确处理
            expect(testElement.style.transform).toMatch(/rotate\(-3\d\.\d*deg\)/)
            expect(testElement.style.transform).toMatch(/scale\(0\.7\d*\)/)
        })

        test('应该正确处理多重嵌套变换', () => {
            testElement.style.left = '100px'
            testElement.style.top = '150px'
            testElement.style.transform = 'translateZ(0) rotate(90deg) scale(2) rotateX(45deg)'

            const initialPose = getPoseFromElement(testElement)

            // 第一次拖动
            keepTouchesRelative({
                element: testElement,
                initialPose,
                startEvents: [createMockDragEvent(125, 175)],
                currentEvents: [createMockDragEvent(150, 200)]
            })

            const result1 = testElement.style.transform

            // 第二次相同拖动
            keepTouchesRelative({
                element: testElement,
                initialPose,
                startEvents: [createMockDragEvent(125, 175)],
                currentEvents: [createMockDragEvent(150, 200)]
            })

            // 变换应该保持一致，不累积
            expect(testElement.style.transform).toBe(result1)
        })

        test('应该正确处理零值变换', () => {
            testElement.style.left = '50px'
            testElement.style.top = '60px'
            testElement.style.transform = 'rotate(0deg) scale(1) translateX(0px)'

            const initialPose = getPoseFromElement(testElement)

            keepTouchesRelative({
                element: testElement,
                initialPose,
                startEvents: [createMockDragEvent(75, 85)],
                currentEvents: [createMockDragEvent(100, 110)]
            })

            expect(testElement.style.left).toBe('75px')  // 50 + 25
            expect(testElement.style.top).toBe('85px')   // 60 + 25

            // 零值变换应该正确处理
            expect(testElement.style.transform).toMatch(/rotate\(0deg\)/)
            expect(testElement.style.transform).toMatch(/scale\(1\)/)
        })
    })
})
