import '../style.css'
import { Drag, Scale, Rotate, Mixin, MixinType } from '..'
import VConsole from 'vconsole';
import log from 'loglevel'

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
        <div class="draggable-item" id="item1">Item 1 (单指拖拽优先)</div>
        <div class="draggable-item" id="item2">Item 2 (单指缩放优先)</div>
        <div class="draggable-item" id="item3">Item 3 (单指旋转优先)</div>
        <div class="draggable-item" id="item4">Item 4 (惯性拖拽)</div>
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
		{ left: 160, top: 110 }  // Item 4 - right center area
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

new Rotate(item1)

new Scale(item2)

new Drag(item3, {
  inertial: true
})

new Mixin(item4, {}, [MixinType.Rotate, MixinType.Scale, MixinType.Drag])

log.info('多手势应用初始化完成:')
log.info('- Item1: 单指拖拽优先，双指支持缩放 - singleFingerPriority: ["drag", "scale"]')
log.info('- Item2: 单指缩放优先，双指支持旋转 - singleFingerPriority: ["scale", "rotate"]')
log.info('- Item3: 单指旋转优先，双指支持拖拽 - singleFingerPriority: ["rotate", "drag"]')
log.info('- Item4: 惯性拖拽 - singleFingerPriority: []')
log.info('所有功能基于 keepTouchesRelative 函数的优先级配置实现，提供灵活的单指/多指手势组合')
