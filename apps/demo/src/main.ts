import './style.css'
import {
  Drag,
  DragOperationType,
  Finger,
  Mixin,
  MixinType,
  defaultSetPose,
  type Pose
} from '@system-ui-js/multi-drag'
import log from 'loglevel'
import VConsole from 'vconsole'
import { getLocale, setLocale, t, type Locale } from './i18n'
import type { TranslationKey } from './locales/zh-CN'

if (import.meta.env.DEV) {
  log.setLevel('trace')
  new VConsole()
}

const appElement = document.querySelector<HTMLDivElement>('#app')

if (!appElement) {
  throw new Error('Missing #app container')
}

// 页面 DOM 只创建一次：所有受国际化管理的文本节点携带稳定的 data-i18n 标记，
// 语言切换时仅原位更新 textContent，保证拖拽实例与事件绑定始终有效。
// 键通过类型约束的辅助函数写入模板，避免拼写出未知资源键。
const i18nAttrs = (key: TranslationKey) => `data-i18n="${key}"`

appElement.innerHTML = `
    <div class="page">
        <header class="hero">
            <div class="hero-top">
                <div class="hero-text">
                    <h1 ${i18nAttrs('hero.title')}>${t('hero.title')}</h1>
                    <p ${i18nAttrs('hero.subtitle')}>${t('hero.subtitle')}</p>
                </div>
                <div
                    class="language-switcher"
                    role="group"
                    data-i18n-aria-label="languageSwitcher.label"
                    aria-label="${t('languageSwitcher.label')}"
                >
                    <button type="button" class="language-button" data-locale="zh-CN">中</button>
                    <button type="button" class="language-button" data-locale="en-US">EN</button>
                </div>
            </div>
        </header>
        <section class="panel">
            <div>
                <h2 ${i18nAttrs('demo.title')}>${t('demo.title')}</h2>
                <p ${i18nAttrs('demo.description')}>${t('demo.description')}</p>
            </div>
            <div class="drag-zone">
                <div class="drag-container">
                    <div class="draggable-item" id="item1" ${i18nAttrs('demo.item1')}>${t('demo.item1')}</div>
                    <div class="draggable-item" id="item2" ${i18nAttrs('demo.item2')}>${t('demo.item2')}</div>
                    <div class="draggable-item" id="item3" ${i18nAttrs('demo.item3')}>${t('demo.item3')}</div>
                </div>
            </div>
        </section>
        <section class="panel">
            <div>
                <h2 ${i18nAttrs('host.title')}>${t('host.title')}</h2>
                <p ${i18nAttrs('host.description')}>${t('host.description')}</p>
            </div>
            <div class="drag-zone">
                <div class="drag-container joysticks">
                    <div class="joystick joystick1">
                        <div class="joystick-handle" id="joystick1" style="left: 50px; top: 50px"></div>
                    </div>
                    <div class="joystick joystick2">
                        <div class="joystick-handle" id="joystick2" style="left: 50px; top: 50px"></div>
                    </div>
                </div>
            </div>
        </section>
        <section class="panel">
            <div>
                <h2 ${i18nAttrs('pressure.title')}>${t('pressure.title')}</h2>
                <p ${i18nAttrs('pressure.description')}>${t('pressure.description')}</p>
            </div>
            <div class="drag-zone">
                <div class="drag-container">
                    <div class="draggable-item pressure-item" id="pressure-item">
                        <span class="pressure-label" ${i18nAttrs('pressure.label')}>${t('pressure.label')}</span>
                        <span class="pressure-value" id="pressure-value">0.50</span>
                    </div>
                </div>
            </div>
        </section>
    </div>
`

// 语言切换的页面级刷新：只更新文案节点、html.lang、按钮当前态与 aria-pressed，
// 不重建任何 DOM，拖拽位置与交互状态在切换后保持不变。
const applyLocale = (locale: Locale) => {
  setLocale(locale)
  document.documentElement.lang = locale

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n as TranslationKey
    element.textContent = t(key)
  })

  document
    .querySelectorAll<HTMLElement>('[data-i18n-aria-label]')
    .forEach((element) => {
      const key = element.dataset.i18nAriaLabel as TranslationKey
      element.setAttribute('aria-label', t(key))
    })

  document
    .querySelectorAll<HTMLButtonElement>('[data-locale]')
    .forEach((button) => {
      const isActive = button.dataset.locale === locale
      button.classList.toggle('is-active', isActive)
      button.setAttribute('aria-pressed', String(isActive))
    })
}

document
  .querySelectorAll<HTMLButtonElement>('[data-locale]')
  .forEach((button) => {
    button.addEventListener('click', () => {
      applyLocale(button.dataset.locale as Locale)
    })
  })

// 初始化按钮当前态与 html.lang（初始语言固定为 zh-CN）
applyLocale(getLocale())

const item1 = document.getElementById('item1') as HTMLElement
const item2 = document.getElementById('item2') as HTMLElement
const item3 = document.getElementById('item3') as HTMLElement
const joystick1 = document.getElementById('joystick1') as HTMLElement
const joystick2 = document.getElementById('joystick2') as HTMLElement
const pressureItem = document.getElementById('pressure-item') as HTMLElement

for (const [element, top] of [
  [item1, 20],
  [item2, 120],
  [item3, 220],
  [pressureItem, 20]
] as const) {
  element.style.position = 'absolute'
  element.style.left = '24px'
  element.style.top = `${top}px`
  element.style.transformOrigin = 'center'
}

new Mixin(item1, {}, [MixinType.Drag, MixinType.Scale])
new Drag(item2)
new Mixin(
  item3,
  {},
  [MixinType.Drag, MixinType.Rotate, MixinType.Scale],
  [MixinType.Scale, MixinType.Rotate]
)

const limit75 = (element: HTMLElement, pose: Partial<Pose>) => {
  const center = { x: 50, y: 50 }
  const position = pose.position
  if (!position) {
    return
  }

  const nextPosition = { ...position }
  const distance = Math.hypot(
    center.x - nextPosition.x,
    center.y - nextPosition.y
  )
  if (distance > 75) {
    const ratio = distance / 75
    nextPosition.x = (position.x - center.x) / ratio + center.x
    nextPosition.y = (position.y - center.y) / ratio + center.y
  }
  defaultSetPose(element, { ...pose, position: nextPosition })
}

const joystickGoBack = (element: HTMLElement) => {
  element.style.left = '50px'
  element.style.top = '50px'
}

new Drag(joystick1, {
  setPose: limit75,
  setPoseOnEnd: joystickGoBack
})

new Drag(joystick2, {
  setPose: limit75,
  setPoseOnEnd: joystickGoBack
})

const pressureDrag = new Drag(pressureItem)
const pressureValue = document.getElementById('pressure-value') as HTMLElement
pressureDrag.addEventListener(DragOperationType.Move, (fingers: Finger[]) => {
  const pressure = fingers[0]?.getLastOperation()?.pressure ?? 0.5
  pressureItem.style.setProperty('--pressure', String(pressure))
  pressureValue.textContent = pressure.toFixed(2)
})
