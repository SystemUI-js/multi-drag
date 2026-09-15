import { expect, test, type Page } from '@playwright/test'

// window 探针类型：用于在语言切换前后比对拖拽节点的对象身份
type I18nProbeWindow = Window & { __i18nItem2?: Element | null }

// 断言语言切换按钮状态：当前语言按钮 aria-pressed=true 且带 is-active 类
const expectLocaleButtonState = async (
  page: Page,
  activeLocale: 'zh-CN' | 'en-US'
) => {
  for (const locale of ['zh-CN', 'en-US'] as const) {
    const button = page.locator(`[data-locale="${locale}"]`)
    const isActive = locale === activeLocale
    await expect(button).toHaveAttribute('aria-pressed', String(isActive))
    if (isActive) {
      await expect(button).toHaveClass(/is-active/)
    } else {
      await expect(button).not.toHaveClass(/is-active/)
    }
  }
}

// 复用 multi-touch.spec.ts 的 PointerEvent 序列，验证切换语言后拖拽仍生效
const dragItem2ByPointerEvents = async (page: Page) => {
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
}

test.describe('demo i18n', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#item1')
    await page.waitForSelector('#item2')
    await page.waitForSelector('[data-locale="zh-CN"]')
    await page.waitForSelector('[data-locale="en-US"]')
  })

  test('默认以中文渲染并高亮中文按钮', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
    await expect(page.locator('[data-i18n="demo.title"]')).toHaveText(
      'Web 封装示例'
    )
    await expect(page.locator('#item1')).toContainText('单指仅 Drag')
    await expect(page.locator('[data-locale="zh-CN"]')).toHaveText('中')
    await expect(page.locator('[data-locale="en-US"]')).toHaveText('EN')
    await expectLocaleButtonState(page, 'zh-CN')
  })

  test('点击 EN 切换英文，点击 中 切回中文', async ({ page }) => {
    await page.locator('[data-locale="en-US"]').click()

    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await expect(page.locator('[data-i18n="demo.title"]')).toHaveText(
      'Web Wrapper Example'
    )
    await expect(page.locator('#item1')).toContainText(
      'single-finger Drag only'
    )
    await expect(
      page.locator('[data-i18n-aria-label="languageSwitcher.label"]')
    ).toHaveAttribute('aria-label', 'Switch language')
    await expectLocaleButtonState(page, 'en-US')

    await page.locator('[data-locale="zh-CN"]').click()

    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
    await expect(page.locator('[data-i18n="demo.title"]')).toHaveText(
      'Web 封装示例'
    )
    await expect(page.locator('#item1')).toContainText('单指仅 Drag')
    await expect(
      page.locator('[data-i18n-aria-label="languageSwitcher.label"]')
    ).toHaveAttribute('aria-label', '切换语言')
    await expectLocaleButtonState(page, 'zh-CN')
  })

  test('切换语言前后 #item2 保持同一 DOM 对象且仍可拖拽', async ({ page }) => {
    // 记录切换前的拖拽节点引用
    await page.evaluate(() => {
      const probeWindow = window as I18nProbeWindow
      probeWindow.__i18nItem2 = document.getElementById('item2')
    })

    await page.locator('[data-locale="en-US"]').click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')

    // 切换到英文后节点身份不变（语言切换不重建拖拽 DOM）
    expect(
      await page.evaluate(() => {
        const probeWindow = window as I18nProbeWindow
        return probeWindow.__i18nItem2 === document.getElementById('item2')
      })
    ).toBe(true)

    await page.locator('[data-locale="zh-CN"]').click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')

    // 切回中文后节点身份依旧不变
    expect(
      await page.evaluate(() => {
        const probeWindow = window as I18nProbeWindow
        return probeWindow.__i18nItem2 === document.getElementById('item2')
      })
    ).toBe(true)

    // 语言往返切换后，现有 PointerEvent 拖拽方式仍能移动 #item2
    const beforeLeft = await page
      .locator('#item2')
      .evaluate((element) => element.style.left)

    await dragItem2ByPointerEvents(page)

    await expect
      .poll(() =>
        page.locator('#item2').evaluate((element) => element.style.left)
      )
      .not.toBe(beforeLeft)
  })
})
