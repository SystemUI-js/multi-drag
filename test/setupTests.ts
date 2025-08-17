// JSDOM 环境下的一些基础 polyfill 与配置
// 说明：在 jsdom 中我们可以使用 document/window，但可能缺失部分 API，这里根据需要补齐

// getComputedStyle 在 jsdom 可用，但部分 CSS 值可能为空字符串；测试里我们按需设置 style

// 关闭 JSDOM 中未实现的 scroll/resize 等告警（如有需要可以在这里 mock）
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true })
