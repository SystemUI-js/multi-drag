import { makeDraggable } from '../makeDraggable'
import { dragManager } from '../../dragManager'

describe('makeDraggable', () => {
  test('拖拽时会根据鼠标位移更新元素位置', () => {
    // 准备 DOM 元素
    const div = document.createElement('div')
    div.style.position = 'absolute'
    div.style.left = '10px'
    div.style.top = '20px'
    div.style.width = '100px'
    div.style.height = '50px'
    document.body.appendChild(div)

    // 使元素可拖拽
    makeDraggable(div)

    // 模拟按下（mousedown），命中目标元素
    const mousedown = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 200,
      bubbles: true,
      cancelable: true,
    })
    div.dispatchEvent(mousedown)

    // 模拟移动（mousemove）
    const mousemove = new MouseEvent('mousemove', {
      clientX: 130, // 位移 +30
      clientY: 260, // 位移 +60
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(mousemove)

    // 断言位置已更新
    expect(div.style.left).toBe('40px') // 10 + 30
    expect(div.style.top).toBe('80px')  // 20 + 60

    // 模拟松开（mouseup）
    const mouseup = new MouseEvent('mouseup', {
      clientX: 130,
      clientY: 260,
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(mouseup)

    // 结束后 DragManager 不再认为有活跃拖拽
    expect(dragManager.isDragging()).toBe(false)
  })
})
