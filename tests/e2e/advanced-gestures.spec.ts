import { test, expect } from '@playwright/test'
import { TouchGestureHelper } from './helpers/touch-gestures'

test.describe('高级多点触摸手势测试', () => {
  let touchHelper: TouchGestureHelper

  test.beforeEach(async ({ page }) => {
    touchHelper = new TouchGestureHelper(page)

    await page.goto('/')
    await page.waitForSelector('#item1')
    await page.waitForSelector('#item2')
    await page.waitForSelector('#item3')
  })

  test('Item1 - 纯缩放功能测试', async ({ page }) => {
    const item1 = page.locator('#item1')

    // 获取初始变换
    const initialTransform = await item1.evaluate((el) =>
      window.getComputedStyle(el).transform
    )

    // 执行缩放手势（放大2倍）
    await touchHelper.pinchToZoom(item1, 2.0)
    await touchHelper.waitForGestureComplete()

    // 检查变换是否发生变化
    const finalTransform = await item1.evaluate((el) =>
      window.getComputedStyle(el).transform
    )

    expect(finalTransform).not.toBe(initialTransform)

    // 检查是否包含缩放变换（可能是 scale 或 matrix 格式）
    expect(finalTransform).toMatch(/scale\([^1][0-9.]*\)|matrix\([^)]*\)/)
  })

  test('Item1 - 缩小手势测试', async ({ page }) => {
    const item1 = page.locator('#item1')

    // 先放大
    await touchHelper.pinchToZoom(item1, 2.0)
    await touchHelper.waitForGestureComplete()

    const afterZoomInTransform = await item1.evaluate((el) =>
      window.getComputedStyle(el).transform
    )

    // 然后缩小
    await touchHelper.pinchToZoom(item1, 0.5)
    await touchHelper.waitForGestureComplete()

    const afterZoomOutTransform = await item1.evaluate((el) =>
      window.getComputedStyle(el).transform
    )

    // 两次变换应该不同
    expect(afterZoomOutTransform).not.toBe(afterZoomInTransform)
  })

  test('Item2 - 拖拽功能测试', async ({ page }) => {
    const item2 = page.locator('#item2')

    // 获取初始位置
    const initialBox = await item2.boundingBox()
    expect(initialBox).not.toBeNull()

    // 执行拖拽手势
    await touchHelper.dragGesture(item2, 100, 50)
    await touchHelper.waitForGestureComplete()

    // 检查位置变化
    const finalBox = await item2.boundingBox()
    expect(finalBox).not.toBeNull()

    // 位置应该发生明显变化
    expect(Math.abs(finalBox!.x - initialBox!.x)).toBeGreaterThan(70)
    expect(Math.abs(finalBox!.y - initialBox!.y)).toBeGreaterThan(30)
  })

  test('Item3 - 旋转手势测试', async ({ page }) => {
    const item3 = page.locator('#item3')

    // 获取初始变换
    const initialTransform = await item3.evaluate((el) =>
      window.getComputedStyle(el).transform
    )

    // 执行旋转手势（45度）
    await touchHelper.rotateGesture(item3, 45)
    await touchHelper.waitForGestureComplete()

    // 检查变换是否发生变化
    const finalTransform = await item3.evaluate((el) =>
      window.getComputedStyle(el).transform
    )

    expect(finalTransform).not.toBe(initialTransform)

    // 检查是否包含旋转变换（可能是 rotate 或 matrix 格式）
    expect(finalTransform).toMatch(/rotate\([^0][0-9.-]*deg\)|matrix\([^)]*\)/)
  })

  test('Item3 - 复合手势测试（旋转+缩放）', async ({ page }) => {
    const item3 = page.locator('#item3')

    const initialTransform = await item3.evaluate((el) =>
      window.getComputedStyle(el).transform
    )

    // 先执行旋转
    await touchHelper.rotateGesture(item3, 30)
    await touchHelper.waitForGestureComplete()

    const afterRotateTransform = await item3.evaluate((el) =>
      window.getComputedStyle(el).transform
    )

    // 再执行缩放
    await touchHelper.pinchToZoom(item3, 1.5)
    await touchHelper.waitForGestureComplete()

    const finalTransform = await item3.evaluate((el) =>
      window.getComputedStyle(el).transform
    )

    // 每次操作都应该产生变化
    expect(afterRotateTransform).not.toBe(initialTransform)
    expect(finalTransform).not.toBe(afterRotateTransform)

    // 最终变换应该包含旋转和缩放（matrix 格式也算）
    expect(finalTransform).toMatch(/rotate\([^0][0-9.-]*deg\)|matrix\([^)]*\)/)
    expect(finalTransform).toMatch(/scale\([^1][0-9.]*\)|matrix\([^)]*\)/)
  })

  test('多元素并发操作测试', async ({ page }) => {
    const item1 = page.locator('#item1')
    const item2 = page.locator('#item2')
    const item3 = page.locator('#item3')

    // 获取所有元素的初始状态
    const [
      item1InitialTransform,
      item2InitialBox,
      item3InitialTransform
    ] = await Promise.all([
      item1.evaluate((el) => window.getComputedStyle(el).transform),
      item2.boundingBox(),
      item3.evaluate((el) => window.getComputedStyle(el).transform)
    ])

    // 连续快速操作多个元素
    await touchHelper.pinchToZoom(item1, 1.5)
    await page.waitForTimeout(100)

    await touchHelper.dragGesture(item2, 60, 30)
    await page.waitForTimeout(100)

    await touchHelper.rotateGesture(item3, 60)
    await touchHelper.waitForGestureComplete()

    // 检查所有元素都发生了变化
    const [
      item1FinalTransform,
      item2FinalBox,
      item3FinalTransform
    ] = await Promise.all([
      item1.evaluate((el) => window.getComputedStyle(el).transform),
      item2.boundingBox(),
      item3.evaluate((el) => window.getComputedStyle(el).transform)
    ])

    // 验证所有元素都发生了变化
    expect(item1FinalTransform).not.toBe(item1InitialTransform)
    expect(item3FinalTransform).not.toBe(item3InitialTransform)

    expect(item2FinalBox).not.toBeNull()
    expect(item2InitialBox).not.toBeNull()
    expect(Math.abs(item2FinalBox!.x - item2InitialBox!.x)).toBeGreaterThan(40)
  })

  test('边界条件测试', async ({ page }) => {
    const item1 = page.locator('#item1')

    // 测试极小缩放
    await touchHelper.pinchToZoom(item1, 0.1)
    await touchHelper.waitForGestureComplete()

    let transform = await item1.evaluate((el) =>
      window.getComputedStyle(el).transform
    )

    // 应该仍然有有效的变换
    expect(transform).toMatch(/matrix|scale/)

    // 测试极大缩放
    await touchHelper.pinchToZoom(item1, 5.0)
    await touchHelper.waitForGestureComplete()

    transform = await item1.evaluate((el) =>
      window.getComputedStyle(el).transform
    )

    // 应该仍然有有效的变换
    expect(transform).toMatch(/matrix|scale/)
  })

  test('性能测试 - 快速连续手势', async ({ page }) => {
    const item3 = page.locator('#item3')

    const startTime = Date.now()

    // 快速连续执行多个手势
    for (let i = 0; i < 5; i++) {
      await touchHelper.rotateGesture(item3, 15)
      await page.waitForTimeout(50) // 很短的延迟
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    // 应该在合理时间内完成（不超过3秒）
    expect(duration).toBeLessThan(3000)

    // 元素应该仍然响应
    const finalTransform = await item3.evaluate((el) =>
      window.getComputedStyle(el).transform
    )
    expect(finalTransform).toMatch(/matrix|rotate/)
  })
})
