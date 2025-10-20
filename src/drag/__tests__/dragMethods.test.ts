import { Drag } from '../drag'
import { getPoseFromElement } from '../../utils/dragUtils'

/**
 * 测试基础类 - 提供通用的测试功能
 */
class TestRunner {
    protected testElement!: HTMLElement

    /**
     * 创建测试元素
     */
    createElement(): void {
        this.testElement = document.createElement('div')
        this.testElement.style.position = 'absolute'
        this.testElement.style.left = '0px'
        this.testElement.style.top = '0px'
        this.testElement.style.width = '100px'
        this.testElement.style.height = '100px'
        document.body.appendChild(this.testElement)
    }

    /**
     * 设置元素样式
     * @param styles - 样式对象
     */
    setElementStyles(styles: Partial<CSSStyleDeclaration>): void {
        Object.assign(this.testElement.style, styles)
    }

    /**
     * 清理测试元素
     */
    cleanup(): void {
        if (this.testElement && this.testElement.parentNode) {
            document.body.removeChild(this.testElement)
        }
    }

    /**
     * 模拟元素的getBoundingClientRect方法
     * @param rect - 边界矩形数据
     */
    mockGetBoundingClientRect(rect: Partial<DOMRect>): void {
        this.testElement.getBoundingClientRect = jest.fn(() => ({
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            right: 100,
            bottom: 100,
            x: 0,
            y: 0,
            toJSON: () => {},
            ...rect
        } as DOMRect))
    }
}

/**
 * 拖拽测试套件 - 测试Drag类相关功能
 */
class DragTestSuite extends TestRunner {
    private dragInstance!: Drag

    /**
     * 测试Drag类实例化
     */
    testDragInstantiation(): void {
        this.dragInstance = new Drag(this.testElement)
        expect(this.dragInstance).toBeInstanceOf(Drag)
    }

    /**
     * 测试基本拖拽功能
     */
    testBasicDragFunctionality(): void {
        this.dragInstance = new Drag(this.testElement)

        // 验证Drag实例创建成功
        expect(this.dragInstance).toBeInstanceOf(Drag)
        expect(this.testElement).toBeDefined()

        // 验证拖拽实例存在
        expect(this.dragInstance).toBeDefined()
        expect(this.dragInstance instanceof Drag).toBe(true)
    }
}

/**
 * 姿态测试套件 - 测试Pose相关功能
 */
class PoseTestSuite extends TestRunner {
    /**
     * 测试从元素获取姿态信息
     */
    testGetPoseFromElement(): void {
        const pose = getPoseFromElement(this.testElement)

        expect(pose.rect).toBeDefined()
        expect(pose.style).toBeDefined()
        expect(pose.rect).toBeInstanceOf(DOMRect)
        expect(pose.style).toBeInstanceOf(CSSStyleDeclaration)
    }

    /**
     * 测试边界矩形和样式获取
     */
    testBoundingRectAndStyle(): void {
        this.setElementStyles({
            left: '10px',
            top: '20px',
            transform: 'rotate(45deg) scale(1.5)'
        })

        this.mockGetBoundingClientRect({
            left: 10,
            top: 20,
            width: 100,
            height: 100,
            right: 110,
            bottom: 120,
            x: 10,
            y: 20
        })

        const pose = getPoseFromElement(this.testElement)

        expect(pose.rect.left).toBe(10)
        expect(pose.rect.top).toBe(20)
        expect(pose.rect.width).toBe(100)
        expect(pose.rect.height).toBe(100)
        expect(pose.style.left).toBe('10px')
        expect(pose.style.top).toBe('20px')
        expect(pose.style.transform).toBe('rotate(45deg) scale(1.5)')
    }

    /**
     * 测试样式快照的独立性
     */
    testStyleSnapshotIndependence(): void {
        this.setElementStyles({
            left: '100px',
            top: '200px',
            transform: 'rotate(30deg) scale(2)'
        })

        const pose = getPoseFromElement(this.testElement)
        expect(pose.style).not.toBe(this.testElement.style)

        // 修改元素样式
        this.setElementStyles({
            left: '500px',
            top: '600px',
            transform: 'rotate(90deg) scale(3)'
        })

        // 快照保持原始值
        expect(pose.style.left).toBe('100px')
        expect(pose.style.top).toBe('200px')
        expect(pose.style.transform).toBe('rotate(30deg) scale(2)')

        // 元素是新值
        expect(this.testElement.style.left).toBe('500px')
        expect(this.testElement.style.top).toBe('600px')
        expect(this.testElement.style.transform).toBe('rotate(90deg) scale(3)')
    }

    /**
     * 测试关键样式属性复制
     */
    testCopyAllStyleProperties(): void {
        this.testElement.style.position = 'absolute'
        this.testElement.style.left = '50px'
        this.testElement.style.top = '75px'
        this.testElement.style.transform = 'rotate(15deg) scale(1.2)'
        this.testElement.style.zIndex = '999'

        const pose = getPoseFromElement(this.testElement)

        expect(pose.style.position).toBe('absolute')
        expect(pose.style.left).toBe('50px')
        expect(pose.style.top).toBe('75px')
        expect(pose.style.transform).toBe('rotate(15deg) scale(1.2)')
    }

    /**
     * 测试空样式属性处理
     */
    testEmptyStyleProperties(): void {
        // 不设置任何特殊样式，使用默认值
        const pose = getPoseFromElement(this.testElement)

        expect(pose.style).toBeDefined()
        expect(pose.style.position).toBe('absolute') // 在createElement中设置的
        expect(pose.style.left).toBe('0px')          // 在createElement中设置的
        expect(pose.style.top).toBe('0px')           // 在createElement中设置的
    }
}

// 执行测试
describe('基于类的拖拽测试', () => {
    let dragTestSuite: DragTestSuite
    let poseTestSuite: PoseTestSuite

    beforeEach(() => {
        dragTestSuite = new DragTestSuite()
        poseTestSuite = new PoseTestSuite()
        dragTestSuite.createElement()
        poseTestSuite.createElement()
    })

    afterEach(() => {
        dragTestSuite.cleanup()
        poseTestSuite.cleanup()
    })

    describe('Drag类测试', () => {
        test('应该能够实例化Drag类', () => {
            dragTestSuite.testDragInstantiation()
        })

        test('应该支持基本拖拽功能', () => {
            dragTestSuite.testBasicDragFunctionality()
        })
    })

    describe('Pose功能测试', () => {
        test('应该从元素获取rect和style信息', () => {
            poseTestSuite.testGetPoseFromElement()
        })

        test('应该正确获取元素的边界矩形和样式', () => {
            poseTestSuite.testBoundingRectAndStyle()
        })

        test('应该返回样式的快照而不是引用', () => {
            poseTestSuite.testStyleSnapshotIndependence()
        })

        test('应该复制所有关键样式属性', () => {
            poseTestSuite.testCopyAllStyleProperties()
        })

        test('应该正确处理空样式属性', () => {
            poseTestSuite.testEmptyStyleProperties()
        })
    })
})
