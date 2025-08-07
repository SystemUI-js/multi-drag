import '../style.css'
import { Drag } from '../drag'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>多指操作（Multi Drag Project）</h1>
    <p>基于Vite + TypeScript打造（Build with Vite + TypeScript）</p>
    <p>试试多个手指同时拖动Item（Try to drag these Items with MULTI FINGERS at same time）</p>
    <div id="drag-container">
      <div class="draggable-item">Item 1</div>
      <div class="draggable-item">Item 2</div>
      <div class="draggable-item">Item 3</div>
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

			// Get current position from element's bounding rect
			const rect = el.getBoundingClientRect()
			initialLeft = rect.left
			initialTop = rect.top

			// Set position absolute for dragging while maintaining current position
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

			// Apply Default Position Handler logic: use style.left and style.top
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

console.log('Multi-drag application initialized with Default Position Handler logic applied to Item1, Item2, Item3')
