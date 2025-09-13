import { Drag } from "../drag"
import { getPoseFromElement, toPoints } from "../utils/dragUtils"
import { MathUtils } from "../utils/mathUtils"
import { DragSelection } from "./selection"
import { DragEvent } from "../dragManager"

interface RegisterOptions {
    onSelected?: (item: Drag | HTMLElement) => void
    onUnSelected?: (item: Drag | HTMLElement) => void
}

interface Options {
    selectOnMove?: boolean
}

function getMoveDistance(events1: DragEvent[], events2: DragEvent[]) {
    const points1 = toPoints(events1)
    const points2 = toPoints(events2)
    const center1 = MathUtils.getCentroid(points1)
    const center2 = MathUtils.getCentroid(points2)
    return MathUtils.distance(center1, center2)
}

function createSelectionRectElement() {
    const rect = document.createElement('div')
    rect.style.position = 'absolute'
    rect.style.backgroundColor = 'rgba(0, 0, 255, 0.2)'
    rect.style.pointerEvents = 'none'
    rect.classList.add('selection-rect')
    return rect
}

class DragContainer {
    private drag: Drag
    private selection: DragSelection = new DragSelection()
    private selectionRectElement?: HTMLElement
    constructor(private element: HTMLElement, private options: Options = {}) {
        this.drag = new Drag(element, {
            onDragStart: (el: HTMLElement, events) => {
                const points = toPoints(events)
                const center = MathUtils.getCentroid(points)
                this.selection.setStartPoint(center)
                const ele = createSelectionRectElement()
                this.selectionRectElement = ele
                this.element.appendChild(ele)
                return {
                    initialPose: getPoseFromElement(el),
                    startEvents: events,
                }
            },
            onDragMove: (_, events, payload) => {
                console.log(...events.map(event => event.identifier))
                // 移动距离大于2px则开启选择
                const startEvents = payload?.startEvents
                if (startEvents) {
                    const currentPoints = toPoints(events)
                    const currentCenter = MathUtils.getCentroid(currentPoints)
                    const startPoints = toPoints(startEvents)
                    const startCenter = MathUtils.getCentroid(startPoints)
                    const moveDistance = getMoveDistance(startEvents, events)
                    if (moveDistance > 1) {
                        this.selection.setEndPoint(currentCenter)
                        const selectionRect = this.selection.getSelectionRect()
                        if (selectionRect && this.selectionRectElement) {
                            const containerRect = this.element.getBoundingClientRect()
                            // 相对container的
                            const offsetCurrentCenter = {
                                x: currentCenter.x - containerRect.left,
                                y: currentCenter.y - containerRect.top,
                            }
                            const offsetStartCenter = {
                                x: startCenter.x - containerRect.left,
                                y: startCenter.y - containerRect.top,
                            }
                            this.selectionRectElement.style.left = `${Math.min(offsetCurrentCenter.x, offsetStartCenter.x)}px`
                            this.selectionRectElement.style.top = `${Math.min(offsetCurrentCenter.y, offsetStartCenter.y)}px`
                            this.selectionRectElement.style.width = `${selectionRect.width}px`
                            this.selectionRectElement.style.height = `${selectionRect.height}px`
                        }
                        if (this.options.selectOnMove) {
                            this.updateSelection()
                        }
                    }
                }
            },
            onDragEnd: (_, events, payload) => {
                const startEvents = payload?.startEvents
                this.element.querySelectorAll('.selection-rect').forEach(ele => {
                    ele.remove()
                })
                if (startEvents) {
                    const moveDistance = getMoveDistance(startEvents, events)
                    if (moveDistance <= 1) {
                        this.clearSelection()
                    }
                }
                if (!this.options.selectOnMove) {
                    this.updateSelection()
                }
            }
        })
    }
    private registerMap: Map<Drag | HTMLElement, RegisterOptions | undefined> = new Map()
    private selectedItems: Set<Drag | HTMLElement> = new Set()
    registerItem(item: Drag | HTMLElement, options?: RegisterOptions) {
        this.registerMap.set(item, options)
        this.selection.register(item)
    }
    unregisterItem(item: Drag | HTMLElement) {
        this.registerMap.delete(item)
        this.selection.unregister(item)
    }
    clearSelection() {
        this.selection.clearSelection()
        this.updateSelection()
        this.selectedItems.clear()
    }
    updateSelection() {
        const selectedList = this.selection.getSelectedList()
        this.selectedItems.forEach(item => {
            if (!selectedList.includes(item)) {
                const options = this.registerMap.get(item)
                if (options) {
                    options.onUnSelected?.(item)
                }
            }
        })
        selectedList.forEach(item => {
            if (!this.selectedItems.has(item)) {
                const options = this.registerMap.get(item)
                if (options) {
                    options.onSelected?.(item)
                }
            }
        })
        this.selectedItems = new Set(selectedList)
    }
    onDestroy() {
        this.selection.clearRegister()
        this.drag.destroy()
    }
}

export { DragContainer }
