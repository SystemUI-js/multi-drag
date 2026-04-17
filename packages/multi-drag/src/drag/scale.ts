import { DragBase, Options } from './base'

export class Scale extends DragBase {
    constructor(element: HTMLElement, options?: Options) {
        super(element, { ...options, maxFingerCount: 2 }, { scale: true })
    }
}
