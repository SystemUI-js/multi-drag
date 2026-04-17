import type { GestureFeatures } from '@system-ui-js/multi-drag-core'
import { DragBase, type Options } from './base'

export enum MixinType {
  Drag = 'drag',
  Rotate = 'rotate',
  Scale = 'scale'
}

export class Mixin extends DragBase {
  private readonly activeMixinTypes: readonly MixinType[]
  private readonly singleFingerMixinTypes: readonly MixinType[]

  constructor(
    element: HTMLElement,
    options: Options = {},
    mixinTypes: MixinType[],
    singleFingerMixinTypes?: MixinType[]
  ) {
    const activeMixinTypes = [...new Set(mixinTypes)]

    super(
      element,
      { ...options, maxFingerCount: -1 },
      {
        drag: activeMixinTypes.includes(MixinType.Drag),
        rotate: activeMixinTypes.includes(MixinType.Rotate),
        scale: activeMixinTypes.includes(MixinType.Scale)
      }
    )

    this.activeMixinTypes = activeMixinTypes
    this.singleFingerMixinTypes = [
      ...new Set(
        singleFingerMixinTypes ??
          activeMixinTypes.filter((type) => type === MixinType.Drag)
      )
    ]
  }

  protected resolveGestureFeatures(pointerCount: number): GestureFeatures {
    const currentMixinTypes =
      pointerCount <= 1 ? this.singleFingerMixinTypes : this.activeMixinTypes

    return {
      drag: currentMixinTypes.includes(MixinType.Drag),
      rotate: currentMixinTypes.includes(MixinType.Rotate),
      scale: currentMixinTypes.includes(MixinType.Scale)
    }
  }
}
