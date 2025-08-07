import '../style.css'
import { Drag } from '../drag'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <div class="header-content">
      <h1>多指操作（Multi Drag Project）</h1>
      <p>基于Vite + TypeScript打造（Build with Vite + TypeScript）</p>
      <p>试试多个手指同时拖动Item（Try to drag these Items with MULTI FINGERS at same time）</p>
    </div>
    <div id="drag-zone">
      <div id="drag-container">
        <div class="draggable-item">Item 1</div>
        <div class="draggable-item">Item 2</div>
        <div class="draggable-item">Item 3</div>
      </div>
    </div>
  </div>
`

// Initialize drag functionality using the new Drag class with Default Position Handler logic
const dragItems = document.querySelectorAll('.draggable-item')

dragItems.forEach((item) => {
	const element = item as HTMLElement
	let startX = 0
	let startY = 0
	let initialLeft = 0
	let initialTop = 0

	// Create a new Drag instance for each item
	new Drag(element, {
		onDragStart: (el, event) => {
			// Set visual feedback
			el.style.opacity = '0.7'
			el.style.zIndex = '1000'

			// Store initial position using normalized coordinates from DragEvent
			startX = event.clientX
			startY = event.clientY

			// Calculate position relative to drag-zone instead of viewport
			initialLeft = parseFloat(el.style.left) || 0
			initialTop = parseFloat(el.style.top) || 0

			// Set position absolute for dragging while maintaining current position relative to drag-zone
			el.style.position = 'absolute'
			el.style.left = `${initialLeft}px`
			el.style.top = `${initialTop}px`

			console.log(`Drag started for: ${el.textContent} (${event.type} event, identifier: ${event.identifier})`)
		},

		onDragMove: (el, event) => {
			// Use normalized coordinates from DragEvent
			const currentX = event.clientX
			const currentY = event.clientY

			const deltaX = currentX - startX
			const deltaY = currentY - startY

			// Apply positioning relative to drag-zone
			el.style.left = `${initialLeft + deltaX}px`
			el.style.top = `${initialTop + deltaY}px`
		},

		onDragEnd: (el, event) => {
			// Reset visual feedback
			el.style.opacity = '1'
			el.style.zIndex = 'auto'

			console.log(`Drag ended for: ${el.textContent} (${event.type} event, identifier: ${event.identifier})`)
		}
	})
})

// Initialize positions for the 3 items
const initializeItemPositions = () => {
	const items = Array.from(dragItems) as HTMLElement[]

	// Define initial positions for each item (relative to drag-container)
	const initialPositions = [
		{ left: 24, top: 10 },   // Item 1 - top left area
		{ left: 24, top: 110 },  // Item 2 - center right area
		{ left: 24, top: 210 }   // Item 3 - bottom center area
	]

	items.forEach((item, index) => {
		if (initialPositions[index]) {
			item.style.position = 'absolute'
			item.style.left = `${initialPositions[index].left}px`
			item.style.top = `${initialPositions[index].top}px`
		}
	})
}

// Initialize item positions when page loads
initializeItemPositions()

console.log('Multi-drag application initialized with Default Position Handler logic applied to Item1, Item2, Item3')
console.log('Initial positions set for 3 items in demo')
