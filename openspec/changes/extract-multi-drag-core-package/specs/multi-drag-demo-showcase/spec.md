## ADDED Requirements

### Requirement: Demo 同时展示 core 与 multi-drag 两类示例
系统 MUST 提供至少一个基于 core 的示例和至少一个基于 `@system-ui-js/multi-drag` 的示例，并在 Demo 中清晰标识二者的用途差异。

#### Scenario: 开发者浏览 Demo
- **WHEN** 开发者打开 Demo 页面或示例入口
- **THEN** 系统 MUST 能让其区分“平台无关 core 用法”和“Web 开箱即用 multi-drag 用法”

### Requirement: core 示例显式展示宿主边界
系统 MUST 让 core 示例显式体现“输入归一化 → core 计算 → 宿主状态应用”的边界。示例 SHALL 不通过让 core 直接读写 DOM 来完成交互。

#### Scenario: 查看 core 示例实现
- **WHEN** 开发者查看 core 示例的交互逻辑或运行效果
- **THEN** 示例 MUST 展示宿主层如何把事件转换为标准化输入，并把 core 结果应用到界面状态

### Requirement: Demo 可用于验证兼容定位
系统 MUST 让 `multi-drag` 示例继续表现原包在 DOM/Web 场景下的核心价值，同时帮助团队对比抽离前后兼容层行为是否发生明显回退。

#### Scenario: 对比两类示例
- **WHEN** 团队或开发者对比 core 示例与 `multi-drag` 示例
- **THEN** 系统 MUST 能体现 core 适合作为底层能力复用，而 `multi-drag` 适合作为 Web 封装直接使用
