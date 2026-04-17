import { expect, test } from '@playwright/test'

test.describe('advanced demo behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#item3')
    await page.waitForSelector('#joystick1')
  })

  test('item3 单指拖拽可移动', async ({ page }) => {
    const item = page.locator('#item3')
    const before = await item.boundingBox()
    expect(before).not.toBeNull()

    await item.hover()
    await page.mouse.down()
    await page.mouse.move(before!.x + 80, before!.y + 50)
    await page.mouse.up()

    const after = await item.boundingBox()
    expect(after).not.toBeNull()
    expect(Math.abs(after!.x - before!.x)).toBeGreaterThan(20)
  })

  test('joystick 在结束时回弹到宿主 pose', async ({ page }) => {
    const handle = page.locator('#joystick1')

    await handle.hover()
    await page.mouse.down()
    await page.mouse.move(140, 140)
    await page.mouse.up()

    const left = await handle.evaluate((element) => element.style.left)
    const top = await handle.evaluate((element) => element.style.top)

    expect(left).toBe('50px')
    expect(top).toBe('50px')
  })
})
