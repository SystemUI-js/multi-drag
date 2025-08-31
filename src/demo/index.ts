import '../style.css'
import { Drag, keepTouchesRelative, getPoseFromElement, type GestureParams, type DragEvent } from '..'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <div class="header-content">
      <h1>多指操作（Multi Drag Project）</h1>
      <p>基于Vite + TypeScript打造（Build with Vite + TypeScript）</p>
      <p>试试不同的手势操作：Item1 单指拖拽+双指缩放、Item2 单指缩放+双指旋转、Item3 单指旋转+双指拖拽</p>
    </div>
    <div id="drag-zone">
      <div id="drag-container">
        <div class="draggable-item" id="item1">Item 1 (单指拖拽优先)</div>
        <div class="draggable-item" id="item2">Item 2 (单指缩放优先)</div>
        <div class="draggable-item" id="item3">Item 3 (单指旋转优先)</div>
      </div>
    </div>
  </div>
`

// 为每个 Item 创建不同的手势实例
const item1 = document.getElementById('item1') as HTMLElement
const item2 = document.getElementById('item2') as HTMLElement
const item3 = document.getElementById('item3') as HTMLElement

// Item1: 拖拽+缩放（禁用旋转）
let item1StartEvents: DragEvent[] | null = null

new Drag(item1, {
    onDragStart: (element, events) => {
        // 设置视觉反馈
        element.style.opacity = '0.8'
        element.style.zIndex = '1000'

        // 保存起始事件，并返回初始 Pose（Drag 会保存并在后续回调传回）
        item1StartEvents = events
        console.log(`单指拖拽优先开始 - Item1，触点数: ${events.length}`)
        return getPoseFromElement(element)
    },

    onDragMove: (element, events, pose) => {
        if (!item1StartEvents || !pose) return

        const params: GestureParams = {
            element,
            initialPose: pose,
            startEvents: item1StartEvents,
            currentEvents: events
        }

        // 单指拖拽优先，双指支持缩放
        keepTouchesRelative(params, {
            enableMove: true,
            enableScale: true,
            enableRotate: false,
            singleFingerPriority: ['drag', 'scale']
        })
    },

    onDragEnd: (element, _events, _pose) => {
        element.style.opacity = '1'
        element.style.zIndex = 'auto'
        console.log(`单指拖拽优先结束 - Item1`)
    }
})

// Item2: 单指缩放优先，双指旋转
let item2StartEvents: DragEvent[] | null = null

new Drag(item2, {
    onDragStart: (element, events) => {
        element.style.opacity = '0.8'
        element.style.zIndex = '1000'

        item2StartEvents = events
        console.log(`单指缩放优先开始 - Item2，触点数: ${events.length}`)
        return getPoseFromElement(element)
    },

    onDragMove: (element, events, pose) => {
        if (!item2StartEvents || !pose) return

        const params: GestureParams = {
            element,
            initialPose: pose,
            startEvents: item2StartEvents,
            currentEvents: events
        }

        // 单指缩放优先，双指支持旋转
        keepTouchesRelative(params, {
            enableMove: false,
            enableScale: true,
            enableRotate: true,
            singleFingerPriority: ['scale', 'rotate']
        })
    },

    onDragEnd: (element, _events, _pose) => {
        element.style.opacity = '1'
        element.style.zIndex = 'auto'
        console.log(`单指缩放优先结束 - Item2`)
    }
})

// Item3: 单指旋转优先，双指拖拽
let item3StartEvents: DragEvent[] | null = null

new Drag(item3, {
    onDragStart: (element, events) => {
        element.style.opacity = '0.8'
        element.style.zIndex = '1000'

        item3StartEvents = events
        console.log(`单指旋转优先开始 - Item3，触点数: ${events.length}`)
        return getPoseFromElement(element)
    },

    onDragMove: (element, events, pose) => {
        if (!item3StartEvents || !pose) return

        const params: GestureParams = {
            element,
            initialPose: pose,
            startEvents: item3StartEvents,
            currentEvents: events
        }

        // 单指旋转优先，双指支持拖拽
        keepTouchesRelative(params, {
            enableMove: true,
            enableScale: false,
            enableRotate: true,
            singleFingerPriority: ['rotate', 'drag']
        })
    },

    onDragEnd: (element, _events, _pose) => {
        element.style.opacity = '1'
        element.style.zIndex = 'auto'
        console.log(`单指旋转优先结束 - Item3`)
    }
})

// Initialize positions for the 3 items
const initializeItemPositions = () => {
	const items = [item1, item2, item3]

	// Define initial positions for each item (relative to drag-container)
	const initialPositions = [
		{ left: 24, top: 10 },   // Item 1 - top left area
		{ left: 24, top: 110 },  // Item 2 - center area
		{ left: 24, top: 210 }   // Item 3 - bottom area
	]

	items.forEach((item, index) => {
		if (item && initialPositions[index]) {
			item.style.position = 'absolute'
			item.style.left = `${initialPositions[index].left}px`
			item.style.top = `${initialPositions[index].top}px`
			// 确保元素可以进行 transform 操作
			item.style.transformOrigin = '0 0'
		}
	})
}

// Initialize item positions when page loads
initializeItemPositions()

console.log('多手势应用初始化完成:')
console.log('- Item1: 单指拖拽优先，双指支持缩放 - singleFingerPriority: ["drag", "scale"]')
console.log('- Item2: 单指缩放优先，双指支持旋转 - singleFingerPriority: ["scale", "rotate"]')
console.log('- Item3: 单指旋转优先，双指支持拖拽 - singleFingerPriority: ["rotate", "drag"]')
console.log('所有功能基于 keepTouchesRelative 函数的优先级配置实现，提供灵活的单指/多指手势组合')
