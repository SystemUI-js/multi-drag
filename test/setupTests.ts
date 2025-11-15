// JSDOM 环境下的一些基础 polyfill 与配置
// 说明：在 jsdom 中我们可以使用 document/window，但可能缺失部分 API，这里根据需要补齐

// getComputedStyle 在 jsdom 可用，但部分 CSS 值可能为空字符串；测试里我们按需设置 style

// 关闭 JSDOM 中未实现的 scroll/resize 等告警（如有需要可以在这里 mock）
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true })

// PointerEvent polyfill for JSDOM
if (!global.PointerEvent) {
    class PointerEvent extends MouseEvent {
        public pointerId: number
        public width: number
        public height: number
        public pressure: number
        public tangentialPressure: number
        public tiltX: number
        public tiltY: number
        public twist: number
        public pointerType: string
        public isPrimary: boolean

        constructor(type: string, params: PointerEventInit = {}) {
            super(type, params)
            this.pointerId = params.pointerId || 0
            this.width = params.width || 1
            this.height = params.height || 1
            this.pressure = params.pressure || 0
            this.tangentialPressure = params.tangentialPressure || 0
            this.tiltX = params.tiltX || 0
            this.tiltY = params.tiltY || 0
            this.twist = params.twist || 0
            this.pointerType = params.pointerType || ''
            this.isPrimary = params.isPrimary || false
        }
    }
    global.PointerEvent = PointerEvent as any
}
