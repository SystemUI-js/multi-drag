import { expect, test } from '@playwright/test'

test.describe('demo smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#item1')
    await page.waitForSelector('#item2')
    await page.waitForSelector('#item3')
  })

  test('页面展示 web 封装示例与宿主扩展点', async ({ page }) => {
    await expect(page.getByText('Web 封装示例')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: '宿主扩展点兼容' })
    ).toBeVisible()
    await expect(page.locator('#item2')).toContainText('Item 2 (Drag)')
  })

  test('item2 可拖拽', async ({ page }) => {
    const item2 = page.locator('#item2')

    const beforeLeft = await item2.evaluate((element) => element.style.left)

    await page.evaluate(() => {
      const element = document.getElementById('item2')
      if (!(element instanceof HTMLElement)) {
        throw new Error('Missing #item2')
      }

      element.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          button: 0,
          clientX: 60,
          clientY: 140,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true
        })
      )
      document.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true,
          button: 0,
          clientX: 140,
          clientY: 180,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true
        })
      )
      document.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          button: 0,
          clientX: 140,
          clientY: 180,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true
        })
      )
    })

    const afterLeft = await item2.evaluate((element) => element.style.left)
    expect(afterLeft).not.toBe(beforeLeft)
  })

  test('item1 鼠标拖拽后不会持续叠加高度', async ({ page }) => {
    const item1 = page.locator('#item1')

    const before = await item1.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return {
        height: rect.height,
        styleHeight: element.style.height
      }
    })

    await page.evaluate(() => {
      const dragItem = (elementId: string) => {
        const element = document.getElementById(elementId)
        if (!(element instanceof HTMLElement)) {
          throw new Error(`Missing #${elementId}`)
        }

        element.dispatchEvent(
          new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientX: 60,
            clientY: 110,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true
          })
        )
        document.dispatchEvent(
          new PointerEvent('pointermove', {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientX: 180,
            clientY: 180,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true
          })
        )
        document.dispatchEvent(
          new PointerEvent('pointerup', {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientX: 180,
            clientY: 180,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true
          })
        )
      }

      dragItem('item1')
      dragItem('item1')
    })

    const after = await item1.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return {
        height: rect.height,
        styleHeight: element.style.height
      }
    })

    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1)
    expect(after.styleHeight).toBe('24px')
  })
})
