## Why

当前 Demo 的用户可见文案集中硬编码在页面模板中，且中英文混排，不利于中英文用户理解和后续文案维护。为 Demo 增加轻量国际化能力，可以在不影响拖拽演示行为的前提下提供一致的双语体验。

## What Changes

- 新增 `zh-CN` 和 `en-US` 语言文件，集中管理 Demo 的全部用户可见文案。
- 新增轻量 i18n 工具模块，支持获取当前语言文本和切换语言。
- 修改 `apps/demo/src/main.ts`，通过 i18n 系统渲染文案，不再在页面模板中硬编码中文文本。
- 在页面顶部增加“中 / EN”语言切换按钮，并在切换后更新页面文案。
- 为语言切换按钮补充与现有 Demo 一致的样式。
- 运行与 Demo 相关的构建和测试，验证双语渲染及现有拖拽交互未受影响。

## Capabilities

### New Capabilities

- `demo-internationalization`: 定义 Demo 的中英文资源、文本获取、语言切换入口和双语渲染要求。

### Modified Capabilities

无。

## Impact

- 影响 `apps/demo/src/main.ts`、`apps/demo/src/style.css`，并在 `apps/demo/src/` 下新增语言资源和轻量 i18n 工具。
- 可能调整或新增 Demo 相关测试，以覆盖中英文渲染和语言切换。
- 不新增第三方运行时依赖，不改变 `@system-ui-js/multi-drag-core` 或 `@system-ui-js/multi-drag` 的公开 API 和拖拽行为。
