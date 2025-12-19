import { DragBase, DragOperationType, Options } from './base'
import { Drag } from './drag'
import { Finger } from './finger'
import { Rotate } from './rotate'
import { Scale } from './scale'

export enum MixinType {
  Drag = 'drag',
  Rotate = 'rotate',
  Scale = 'scale'
}

export class Mixin extends DragBase {
  private dragInstances: DragBase[] = []
  constructor(
    element: HTMLElement,
    options: Options = {},
    private mixinTypes: MixinType[]
  ) {
    super(element, { ...options, maxFingerCount: -1 })
    if (this.mixinTypes.includes(MixinType.Drag)) {
      this.enableDrag()
    }
    if (this.mixinTypes.includes(MixinType.Rotate)) {
      this.enableRotate()
    }
    if (this.mixinTypes.includes(MixinType.Scale)) {
      this.enableScale()
    }
    this.addEventListener(DragOperationType.Start, this.handleStart)
    this.addEventListener(DragOperationType.End, this.handleEnd)
    this.addEventListener(DragOperationType.Move, this.handleMove)
  }
  private handleEnd = (fingers: Finger[]) => {
    this.dragInstances.forEach((instance) => {
      instance.setCurrentOperationType(DragOperationType.End)
      instance.trigger(DragOperationType.End, fingers)
    })
  }
  private handleMove = (fingers: Finger[]) => {
    if (fingers.length <= 1) {
      // 单指拖动
      const list = this.mixinTypes || []
      // 如果有拖拽实例，先触发拖拽
      if (list.includes(MixinType.Drag)) {
        this.dragInstances.forEach((instance) => {
          if (instance instanceof Drag) {
            instance.setCurrentOperationType(DragOperationType.Move)
            instance.trigger(DragOperationType.Move, fingers)
          }
        })
        return
      }
      // 没有拖拽则一起触发，因为拖拽跟其他的会冲突（交互体验上）
      this.dragInstances.forEach((instance) => {
        instance.setCurrentOperationType(DragOperationType.Move)
        instance.trigger(DragOperationType.Move, fingers)
      })
    } else {
      this.dragInstances.forEach((instance) => {
        instance.setCurrentOperationType(DragOperationType.Move)
        instance.trigger(DragOperationType.Move, fingers)
      })
    }
  }
  private handleStart = (fingers: Finger[]) => {
    this.dragInstances.forEach((instance) => {
      instance.setCurrentOperationType(DragOperationType.Start)
      instance.trigger(DragOperationType.Start, fingers)
    })
  }
  private enableDrag() {
    const instance = new Drag(this.element, { ...this.options, passive: true })
    this.dragInstances.push(instance)
  }
  private enableRotate() {
    const instance = new Rotate(this.element, {
      ...this.options,
      passive: true
    })
    this.dragInstances.push(instance)
  }
  private enableScale() {
    const instance = new Scale(this.element, { ...this.options, passive: true })
    this.dragInstances.push(instance)
  }
}
