import './style.css'
import {
  Drag,
  Mixin,
  MixinType,
  defaultSetPose,
  type Pose
} from '@system-ui-js/multi-drag'
import log from 'loglevel'
import VConsole from 'vconsole'

if (import.meta.env.DEV) {
  log.setLevel('trace')
  new VConsole()
}

const appElement = document.querySelector<HTMLDivElement>('#app')

if (!appElement) {
  throw new Error('Missing #app container')
}

appElement.innerHTML = `
    <div class="page">
        <header class="hero">
            <h1>Multi Drag Workspace Demo</h1>
            <p>展示 Web 封装 @system-ui-js/multi-drag 的常用手势组合与宿主扩展点。</p>
        </header>
        <section class="panel">
            <div>
                <h2>Web 封装示例</h2>
                <p>保持 Drag / Mixin 核心用法，并支持配置单指动作。</p>
            </div>
            <div class="drag-zone">
                <div class="drag-container">
                    <div class="draggable-item" id="item1">Item 1 (Drag + Scale，单指仅 Drag)</div>
                    <div class="draggable-item" id="item2">Item 2 (Drag)</div>
                    <div class="draggable-item" id="item3">Item 3 (Drag + Rotate + Scale，单指 Scale + Rotate)</div>
                </div>
            </div>
        </section>
        <section class="panel">
            <div>
                <h2>宿主扩展点兼容</h2>
                <p>继续支持 getPose / setPose / setPoseOnEnd。</p>
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
    </div>
`

const item1 = document.getElementById('item1') as HTMLElement
const item2 = document.getElementById('item2') as HTMLElement
const item3 = document.getElementById('item3') as HTMLElement
const joystick1 = document.getElementById('joystick1') as HTMLElement
const joystick2 = document.getElementById('joystick2') as HTMLElement

for (const [element, top] of [
  [item1, 20],
  [item2, 120],
  [item3, 220]
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
