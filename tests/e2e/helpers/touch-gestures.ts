import { Page, Locator } from '@playwright/test'

export class TouchGestureHelper {
  constructor(private page: Page) {}

  /**
   * 模拟双指缩放手势
   * @param element 目标元素
   * @param scaleFactor 缩放倍数（1.0 = 无变化，2.0 = 放大一倍，0.5 = 缩小一半）
   */
  async pinchToZoom(element: Locator, scaleFactor: number = 2.0) {
    const box = await element.boundingBox()
    if (!box) throw new Error('Element not found')

    const centerX = box.x + box.width / 2
    const centerY = box.y + box.height / 2

    // 计算初始触摸点距离
    const initialDistance = 40
    const finalDistance = initialDistance * scaleFactor

    await this.page.evaluate(async (params) => {
      const el = document.querySelector(params.selector) as HTMLElement
      if (!el) return

      // 双指初始位置（水平排列）
      const touch1Start = {
        clientX: params.centerX - params.initialDistance / 2,
        clientY: params.centerY
      }
      const touch2Start = {
        clientX: params.centerX + params.initialDistance / 2,
        clientY: params.centerY
      }

      // 双指最终位置
      const touch1End = {
        clientX: params.centerX - params.finalDistance / 2,
        clientY: params.centerY
      }
      const touch2End = {
        clientX: params.centerX + params.finalDistance / 2,
        clientY: params.centerY
      }

      // 开始触摸
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          new Touch({ identifier: 1, target: el, ...touch1Start }),
          new Touch({ identifier: 2, target: el, ...touch2Start })
        ],
        bubbles: true,
        cancelable: true
      })
      el.dispatchEvent(touchStartEvent)

      // 等待一小段时间
      await new Promise(resolve => setTimeout(resolve, 50))

      // 移动触摸点（缩放手势）
      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [
          new Touch({ identifier: 1, target: el, ...touch1End }),
          new Touch({ identifier: 2, target: el, ...touch2End })
        ],
        bubbles: true,
        cancelable: true
      })
      document.dispatchEvent(touchMoveEvent)

      // 结束触摸
      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [
          new Touch({ identifier: 1, target: el, ...touch1End }),
          new Touch({ identifier: 2, target: el, ...touch2End })
        ],
        bubbles: true,
        cancelable: true
      })
      document.dispatchEvent(touchEndEvent)
    }, {
      selector: await this.getElementSelector(element),
      centerX,
      centerY,
      initialDistance,
      finalDistance
    })
  }

  /**
   * 模拟双指旋转手势
   * @param element 目标元素
   * @param angleDegrees 旋转角度（度）
   */
  async rotateGesture(element: Locator, angleDegrees: number = 45) {
    const box = await element.boundingBox()
    if (!box) throw new Error('Element not found')

    const centerX = box.x + box.width / 2
    const centerY = box.y + box.height / 2
    const radius = 30

    await this.page.evaluate(async (params) => {
      const el = document.querySelector(params.selector) as HTMLElement
      if (!el) return

      // 初始双指位置（水平排列）
      const touch1Start = {
        clientX: params.centerX - params.radius,
        clientY: params.centerY
      }
      const touch2Start = {
        clientX: params.centerX + params.radius,
        clientY: params.centerY
      }

      // 旋转后的双指位置
      const angleRad = (params.angleDegrees * Math.PI) / 180
      const touch1End = {
        clientX: params.centerX - params.radius * Math.cos(angleRad),
        clientY: params.centerY - params.radius * Math.sin(angleRad)
      }
      const touch2End = {
        clientX: params.centerX + params.radius * Math.cos(angleRad),
        clientY: params.centerY + params.radius * Math.sin(angleRad)
      }

      // 开始触摸
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          new Touch({ identifier: 1, target: el, ...touch1Start }),
          new Touch({ identifier: 2, target: el, ...touch2Start })
        ],
        bubbles: true,
        cancelable: true
      })
      el.dispatchEvent(touchStartEvent)

      await new Promise(resolve => setTimeout(resolve, 50))

      // 旋转手势
      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [
          new Touch({ identifier: 1, target: el, ...touch1End }),
          new Touch({ identifier: 2, target: el, ...touch2End })
        ],
        bubbles: true,
        cancelable: true
      })
      document.dispatchEvent(touchMoveEvent)

      // 结束触摸
      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [
          new Touch({ identifier: 1, target: el, ...touch1End }),
          new Touch({ identifier: 2, target: el, ...touch2End })
        ],
        bubbles: true,
        cancelable: true
      })
      document.dispatchEvent(touchEndEvent)
    }, {
      selector: await this.getElementSelector(element),
      centerX,
      centerY,
      radius,
      angleDegrees
    })
  }

  /**
   * 模拟单指拖拽
   * @param element 目标元素
   * @param deltaX X轴偏移
   * @param deltaY Y轴偏移
   */
  async dragGesture(element: Locator, deltaX: number, deltaY: number) {
    const box = await element.boundingBox()
    if (!box) throw new Error('Element not found')

    const startX = box.x + box.width / 2
    const startY = box.y + box.height / 2

    await this.page.evaluate(async (params) => {
      const el = document.querySelector(params.selector) as HTMLElement
      if (!el) return

      const touchStart = {
        clientX: params.startX,
        clientY: params.startY
      }
      const touchEnd = {
        clientX: params.startX + params.deltaX,
        clientY: params.startY + params.deltaY
      }

      // 开始触摸
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          new Touch({ identifier: 1, target: el, ...touchStart })
        ],
        bubbles: true,
        cancelable: true
      })
      el.dispatchEvent(touchStartEvent)

      await new Promise(resolve => setTimeout(resolve, 50))

      // 拖拽
      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [
          new Touch({ identifier: 1, target: el, ...touchEnd })
        ],
        bubbles: true,
        cancelable: true
      })
      document.dispatchEvent(touchMoveEvent)

      // 结束触摸
      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [
          new Touch({ identifier: 1, target: el, ...touchEnd })
        ],
        bubbles: true,
        cancelable: true
      })
      document.dispatchEvent(touchEndEvent)
    }, {
      selector: await this.getElementSelector(element),
      startX,
      startY,
      deltaX,
      deltaY
    })
  }

  /**
   * 获取元素的CSS选择器
   */
  private async getElementSelector(element: Locator): Promise<string> {
    return await element.evaluate((el) => {
      if (el.id) return `#${el.id}`
      if (el.className) return `.${el.className.split(' ')[0]}`
      return el.tagName.toLowerCase()
    })
  }

  /**
   * 等待手势完成
   */
  async waitForGestureComplete(delayMs: number = 200) {
    await this.page.waitForTimeout(delayMs)
  }
}
