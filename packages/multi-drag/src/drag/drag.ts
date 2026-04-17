import { DragBase, Options } from './base'

export class Drag extends DragBase {
    constructor(element: HTMLElement, options?: Options) {
        super(element, { ...options, maxFingerCount: -1 }, { drag: true })
    }
}
