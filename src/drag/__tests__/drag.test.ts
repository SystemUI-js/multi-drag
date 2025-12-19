import { Drag } from '../drag'
import { createAnElement, mockMouseMove, mockTouchMove } from './utils'

describe('[Drag] test', () => {
  /**
   * 测试触发事件 - 模拟鼠标拖动元素向右移动10px
   * 验证:
   * 1. 初始位置为left: 0px
   * 2. 鼠标从x: 50按下,移动到x: 60,向右移动10px
   * 3. 元素的left应该从0px变为10px
   */
  it('base test', () => {
    const element = createAnElement()
    // 使用Drag类而不是DragBase,因为Drag类实现了实际的拖动逻辑
    new Drag(element)
    mockMouseMove(element, { x: 50, y: 50 }, { x: 60, y: 50 })

    // 验证元素向右移动了10px
    expect(element.style.left).toBe('10px')
  })
  it('test two fingers', () => {
    const element = createAnElement()
    // 使用Drag类而不是DragBase,因为Drag类实现了实际的拖动逻辑
    new Drag(element)
    mockTouchMove(element, { x: 60, y: 50 }, { x: 100, y: 50 }, 2)

    // 验证元素向右移动了40px
    expect(element.style.left).toBe('40px')
  })
})
