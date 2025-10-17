import { DragBase, Options } from './base';
import { Drag } from './drag';
import { Rotate } from './rotate';
import { Scale } from './scale';

export enum MixinType {
    Drag = 'drag',
    Rotate = 'rotate',
    Scale = 'scale',
}

export class Mixin extends DragBase {
    constructor(element: HTMLElement, options: Options = {}, private mixinTypes: MixinType[]) {
        super(element, options)
        if (this.mixinTypes.includes(MixinType.Drag)) {
            this.enableDrag()
        }
        if (this.mixinTypes.includes(MixinType.Rotate)) {
            this.enableRotate()
        }
        if (this.mixinTypes.includes(MixinType.Scale)) {
            this.enableScale()
        }
    }
    private enableDrag() {
        new Drag(this.element, this.options)
    }
    private enableRotate() {
        new Rotate(this.element, this.options)
    }
    private enableScale() {
        new Scale(this.element, this.options)
    }
}
