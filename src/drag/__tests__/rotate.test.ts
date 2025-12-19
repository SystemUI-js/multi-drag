import { Rotate } from '../rotate'
import { createAnElement, mockTouchMove, mockMouseMove } from './utils'
import { DragOperationType } from '../base.ts'

describe('[Rotate] test', () => {
  /**
   * 测试基础旋转功能 - 模拟鼠标拖动导致元素旋转
   */
  it('should rotate element with mouse movement', () => {
    const element = createAnElement()
    new Rotate(element)
    mockMouseMove(element, { x: 50, y: 50 }, { x: 60, y: 60 })

    // 验证元素的transform包含rotate属性
    expect(element.style.transform).toContain('rotate')
  })

  /**
   * 测试双指旋转功能 - 模拟双指拖动导致元素旋转
   */
  it('should rotate element with two fingers', () => {
    const element = createAnElement()
    new Rotate(element)
    mockTouchMove(element, { x: 50, y: 50 }, { x: 60, y: 60 }, 2)

    // 验证元素的transform包含rotate属性
    expect(element.style.transform).toContain('rotate')
  })

  /**
   * 测试单指旋转角度计算
   */
  it('should calculate rotation angle with single finger', () => {
    const element = createAnElement()
    new Rotate(element)
    mockTouchMove(element, { x: 50, y: 50 }, { x: 100, y: 100 }, 1)

    // 验证元素的transform包含rotate属性
    expect(element.style.transform).toContain('rotate')
  })

  /**
   * 测试构造函数选项
   */
  it('should create instance with options', () => {
    const element = createAnElement()
    const rotate = new Rotate(element, {})

    expect(rotate).toBeInstanceOf(Rotate)
  })

  /**
   * 测试旋转角度的计算是否正确
   */
  it('should calculate the correct rotation angle', () => {
    const element = createAnElement()
    new Rotate(element)
    // 从(0,0)移动到(10,0)，角度应该为0
    mockMouseMove(element, { x: 1, y: 0 }, { x: 10, y: 0 })
    expect(element.style.transform).toContain('rotate(0deg)')

    // 从(0,0)移动到(0,10)，角度应该为90
    mockMouseMove(element, { x: 10, y: 0 }, { x: 0, y: 10 })
    expect(element.style.transform).toContain('rotate(-270deg)')
  })

  /**
   * 测试 onRotate 回调函数
   */
  it('should call onRotate callback during rotation', () => {
    const element = createAnElement()
    const onRotate = jest.fn()
    const rotate = new Rotate(element)
    rotate.addEventListener(DragOperationType.Move, onRotate)
    mockMouseMove(element, { x: 50, y: 50 }, { x: 60, y: 60 })

    expect(onRotate).toHaveBeenCalled()
  })

  /**
   * 测试禁用旋转功能
   */
  it('should not rotate when disabled', () => {
    const element = createAnElement()
    const rotate = new Rotate(element)
    rotate.setDisabled()
    mockMouseMove(element, { x: 50, y: 50 }, { x: 60, y: 60 })

    expect(element.style.transform).not.toContain('rotate')
  })
})
