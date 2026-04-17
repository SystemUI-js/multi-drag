import { DragBase, Options } from './base'

export class Rotate extends DragBase {
  constructor(element: HTMLElement, options?: Options) {
    super(element, { ...options, maxFingerCount: 2 }, { rotate: true })
  }
}
