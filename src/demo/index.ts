import '../style.css'
import { Drag, DragBase, Mixin, MixinType } from '..'
import VConsole from 'vconsole';
import log from 'loglevel'
import { Finger, FingerOperationType } from '../drag/finger';
import { DragOperationType } from '../drag/base';

if (process.env.NODE_ENV === 'development') {
  log.setLevel('trace');
  new VConsole();
  log.info('vConsole 已初始化');
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <div class="header-content">
      <h1>多指操作（Multi Drag Project）</h1>
      <p>基于Vite + TypeScript打造（Build with Vite + TypeScript）</p>
      <p>试试不同的手势操作：Item1 单指拖拽+双指缩放、Item2 单指缩放+双指旋转、Item3 单指旋转+双指拖拽、Item4 双指旋转+缩放</p>
    </div>
    <div id="drag-zone">
      <div id="drag-container">
        <div class="draggable-item" id="item1">单指拖拽，双指拖拽+缩放</div>
        <div class="draggable-item" id="item2">缩放+旋转</div>
        <div class="draggable-item" id="item3">单指拖拽，<br>双指拖拽+缩放+旋转</div>
        <div class="draggable-item" id="item4">惯性拖拽</div>
      </div>
    </div>
  </div>
`

// 为每个 Item 创建不同的手势实例
const item1 = document.getElementById('item1') as HTMLElement
const item2 = document.getElementById('item2') as HTMLElement
const item3 = document.getElementById('item3') as HTMLElement
const item4 = document.getElementById('item4') as HTMLElement

// const drag3 = new Drag(item3, {
//     onDragStart: (element, localPoints, globalPoints) => {
//         element.style.opacity = '0.8'
//         element.style.zIndex = '1000'

//         log.info(`单指旋转优先开始 - Item3，触点数: ${localPoints.length}`)
//         return {
//             initialPose: getPoseFromElement(element),
//             startLocalPoints: localPoints,
//             startGlobalPoints: globalPoints
//         }
//     },

//     onDragMove: (element, _, globalPoints, pose) => {
//         if (!pose) return

//         const params: GestureParams = {
//             element,
//             initialPose: pose.initialPose,
//             startGlobalPoints: pose.startGlobalPoints,
//             currentGlobalPoints: globalPoints
//         }

//         // 单指旋转优先，双指支持拖拽
//         keepTouchesRelative(params, {
//             enableMove: true,
//             enableScale: false,
//             enableRotate: true,
//             singleFingerPriority: ['rotate', 'drag']
//         })
//     },

//     onDragEnd: (element, _localPoints, _globalPoints, _startPayload, duration?) => {
//         element.style.opacity = '1'
//         element.style.zIndex = 'auto'
//     }
// })

// Initialize positions for the items
const initializeItemPositions = () => {
  const items = [item1, item2, item3, item4]

  // Define initial positions for each item (relative to drag-container)
  const initialPositions = [
    { left: 24, top: 10 },   // Item 1 - top left area
    { left: 24, top: 110 },  // Item 2 - center area
    { left: 24, top: 210 },  // Item 3 - bottom area
    { left: 24, top: 310 }  // Item 4 - right center area
  ]

  items.forEach((item, index) => {
    if (item && initialPositions[index]) {
      item.style.position = 'absolute'
      item.style.left = `${initialPositions[index].left}px`
      item.style.top = `${initialPositions[index].top}px`
      // 确保元素可以进行 transform 操作
      item.style.transformOrigin = 'center'
    }
  })
}

// Initialize item positions when page loads
initializeItemPositions()

const drag1 = new Mixin(item1, {}, [MixinType.Drag, MixinType.Scale])

const drag2 = new Mixin(item2, {}, [MixinType.Rotate, MixinType.Scale])

const drag3 = new Mixin(item3, {}, [MixinType.Drag, MixinType.Rotate, MixinType.Scale])

const drag4 = new Drag(item4, {
  inertial: true
})

printFingerByDragBase(drag1)
printFingerByDragBase(drag2)
printFingerByDragBase(drag3)
printFingerByDragBase(drag4)

function printFingerByDragBase(d: DragBase) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  d.addEventListener(DragOperationType.Start, (fingers) => {
    container.innerHTML = ''
    for (const finger of fingers) {
      printFinger(finger, container, FingerOperationType.Start)
    }
  })
  d.addEventListener(DragOperationType.Move, (fingers) => {
    container.innerHTML = ''
    for (const finger of fingers) {
      printFinger(finger, container, FingerOperationType.Move)
    }
  })
  d.addEventListener(DragOperationType.End, () => {
    container.innerHTML = ''
  })
}

function printFinger(finger: Finger, container: HTMLDivElement, type: FingerOperationType) {
  const point = finger.getLastOperation(type)?.point
  const fingerDiv = document.createElement('div')
  fingerDiv.style.position = 'fixed'
  fingerDiv.style.left = `${point?.x || 0}px` || '0px'
  fingerDiv.style.top = `${point?.y || 0}px` || '0px'
  fingerDiv.style.width = '70px'
  fingerDiv.style.height = '70px'
  fingerDiv.style.zIndex = '1000'
  fingerDiv.style.transform = 'translate(-50%, -50%)'
  fingerDiv.style.borderRadius = '50%'
  // 加个阴影
  fingerDiv.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)'
  fingerDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.7)'
  container.appendChild(fingerDiv)
}
