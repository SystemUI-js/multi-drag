## Context

当前仓库仍是单包结构，`@system-ui-js/multi-drag` 的核心手势计算、手指状态管理、DOM 事件接入、位姿读写与 Demo/测试组织都混在同一套实现内。`src/drag/base.ts` 同时负责：

- 绑定 `pointerdown` 与元素样式控制
- 驱动 `Finger` 生命周期与拖拽事件流
- 维护 pose 记录与惯性逻辑
- 触发 drag / rotate / scale 相关行为

`src/drag/finger.ts` 直接依赖 `document` 和 `PointerEvent`，而 `drag.ts`、`rotate.ts`、`scale.ts` 中又包含大量本可平台无关的几何计算与状态流转逻辑。这导致以下问题：

- 无法在 Expo 等非 DOM 环境复用手势核心能力
- 平台适配与核心算法耦合，后续扩展成本高
- 纯计算逻辑难以独立单测，只能依赖 DOM/JSDOM/E2E 验证
- 原包未来继续演进时，平台差异容易继续污染公共模型

本次变更需要在不破坏原 `@system-ui-js/multi-drag` Web 核心能力的前提下，抽出可独立发布的 `multi-drag-core` 包，并为后续多平台适配预留稳定边界。当前 proposal 中新包命名存在 `@system-js-ui` / `@system-ui-js` 不一致的问题，设计中将其视为待确认项。

## Goals / Non-Goals

**Goals:**

- 拆出一个不依赖 `HTMLElement`、`document`、`PointerEvent` 的 core 包，承载多指手势领域模型、计算逻辑与状态流转。
- 让现有 `@system-ui-js/multi-drag` 退化为 Web/DOM 适配层与兼容封装层，对外保持现有核心能力可用。
- 为仓库建立可支撑多包独立构建、测试、发布的目录与脚本结构。
- 让 Demo 同时展示“直接使用 core 构建交互”和“继续使用 multi-drag Web 封装”两类示例。
- 为后续 Expo 或其他平台适配提供清晰扩展点，而不是继续复制 DOM 逻辑。

**Non-Goals:**

- 本次不尝试一次性支持 Expo/React Native 等新平台运行时。
- 本次不重做原有公开 API 的交互模型，只做内部重组与必要兼容封装。
- 本次不引入复杂插件系统或过度抽象的跨平台事件总线。
- 本次不以“完全无破坏性内部重构”为目标；允许内部目录、构建脚本和测试布局发生调整。

## Decisions

### 1. 采用 workspace 多包结构，而不是继续维持单包 + 内部子模块

**Decision**

将仓库从单包结构调整为 workspace/monorepo 形式，至少包含：

- `packages/multi-drag-core`：平台无关核心
- `packages/multi-drag`：Web/DOM 兼容层与现有主包
- `apps/demo` 或等价 Demo 目录：示例展示

共享 TypeScript、测试、lint、构建配置放在仓库根目录或公共配置目录中。

**Rationale**

- proposal 明确要求 core 与原包独立构建、测试、发布；单包内部导出子路径无法完整解决发布与职责边界问题。
- 独立 package 能更清晰地表达“core 是平台无关资产，multi-drag 是 Web 封装”。
- 有利于未来新增 `multi-drag-expo` 等适配层，而不污染已有包。

**Alternatives considered**

- 保持单包，仅新增 `core/` 目录并通过子路径导出：实现成本低，但仍无法形成独立发布、版本边界与测试边界。
- 新建 core 仓库：职责清晰，但迁移成本高，会增加发布、联调和版本同步复杂度。

### 2. core 只暴露领域模型、计算器与手势状态机，不直接处理宿主事件对象

**Decision**

core 包只接收归一化后的输入数据，不依赖浏览器事件对象。核心 API 由以下几类能力构成：

- 几何与位姿模型：`Point`、`Pose`、`GestureDelta`、`GestureSnapshot`
- 纯计算函数：位移、旋转角度、缩放比、惯性位移/旋转/缩放推导
- 手势状态机：接收标准化 pointer/finger 输入，输出阶段变化与 pose 变化
- 组合控制器：支持 drag / rotate / scale 的单独启用与组合启用

core 输入采用平台中立的数据结构，例如 `PointerLikeInput`、`PointerLifecycleEvent`，而不是 `PointerEvent` 本身。

**Rationale**

- 当前 `Finger` 与 `DragBase` 的最大问题不是算法不足，而是事件对象和宿主能力混入核心领域模型。
- 只有彻底切断 DOM 类型依赖，core 才能真正运行在非 Web 宿主。
- 纯数据输入/输出天然更适合单测和回归验证。

**Alternatives considered**

- 在 core 中保留 `PointerEvent`，通过适配器传递浏览器事件：实现快，但会把 Web 类型泄漏到所有平台。
- 只提取数学函数，不提取状态机：风险较低，但无法真正解决平台复用问题，价值不足。

### 3. 将现有实现拆成“core 控制器 + DOM adapter + 兼容 API”三层

**Decision**

新的职责边界如下：

- **core**：维护手势上下文、指针集合、阶段流转、位姿计算、惯性计算
- **DOM adapter**：负责 `HTMLElement` / `document` 监听、事件归一化、元素 pose 读取与写回
- **兼容 API 层**：保留现有 `Drag` / `Rotate` / `Scale` / `Mixin` 等对外使用方式，将其内部实现改为驱动 core + adapter

其中 `base.ts` 的职责将被拆散：

- 事件接入与宿主生命周期逻辑移入 DOM adapter
- pose 历史与惯性推导下沉到 core
- 事件派发与组合控制留在兼容层或 core controller 的显式订阅接口中

**Rationale**

- 当前 `base.ts` 是最严重的耦合点，继续在其中打补丁只会扩大技术债。
- `Mixin` 已天然体现“组合多个行为”的边界，适合作为兼容 API 层保留。
- 把 adapter 独立出来后，Web 行为与非 Web 行为可以并行演进。

**Alternatives considered**

- 直接让 `DragBase` 变成抽象类，再继承 DOM/Expo 版本：表面上分层，但仍会把历史负担保留在同一个类层级中。
- 完全重写新 API，不保留兼容层：长期更干净，但会破坏原包使用者升级路径。

### 4. 兼容原包 API，优先做“内部切换”而不是“外部破坏性升级”

**Decision**

`@system-ui-js/multi-drag` 第一阶段保持现有核心使用方式与 Web 行为定位不变。现有公开类与入口继续存在，但内部通过 adapter 调用 core。必要时新增更底层导出供高级用户使用，但不要求现有用户迁移。

**Rationale**

- proposal 已明确要求原包完成 core 抽离后继续提供既有 DOM/Web 核心功能与兼容定位。
- 先保证内部重构成功，再逐步暴露更底层扩展接口，风险更低。

**Alternatives considered**

- 直接在主版本中收敛 API、引导用户迁移到 core：对长期 API 简化有利，但会显著放大此次拆分范围。

### 5. 测试策略从“以 DOM 验证为主”转为“core 单测 + adapter 集成 + E2E 演示”三级验证

**Decision**

测试分层调整为：

- `multi-drag-core`：覆盖几何计算、状态机流转、惯性逻辑的纯单元测试
- `multi-drag`：覆盖 DOM adapter、兼容类封装与默认 pose 读写的集成测试
- Demo/E2E：保留真实浏览器交互验证，确保 Web 行为未回退

**Rationale**

- 当前纯计算逻辑无法独立测试，是阻碍核心抽离的重要原因。
- 分层测试可以让非 Web 适配扩展获得更稳定的回归基础。

**Alternatives considered**

- 继续以 E2E 为主：能覆盖最终行为，但定位问题慢，且无法证明 core 真正平台无关。

### 6. Demo 同时展示 core 与 multi-drag 两类用法，但不要求 core 直接操作 DOM

**Decision**

Demo 拆成两类场景：

- **core demo**：展示如何用归一化输入与自定义渲染/状态更新方式驱动交互
- **multi-drag demo**：展示原包在 DOM 场景中的开箱即用能力

core demo 可以仍运行在 Web 页面中，但其交互代码应显式展示“事件归一化 + 状态应用”的边界，而不是让 core 直接触碰 DOM。

**Rationale**

- 这样既能帮助开发者理解职责边界，也能验证 core 的平台无关定位不是口头约定。

**Alternatives considered**

- 只保留原 multi-drag demo：学习成本低，但无法体现新包价值。
- 单独做非 Web demo：更理想，但超出本次范围。

## Risks / Trade-offs

- **[拆分边界判断失误]** → 先优先抽离纯计算与状态模型，再把 DOM 行为通过适配接口下沉，避免一次性重写所有类。
- **[兼容层回归风险]** → 保留原 Web E2E 用例，并在兼容类上增加关键路径集成测试。
- **[多包构建与发布复杂度上升]** → 统一 workspace 脚本与共享配置，避免每个包维护独立且分叉的工具链。
- **[core API 过早定型]** → 第一阶段只暴露最小稳定模型，复杂扩展点先收敛在内部。
- **[命名与 scope 不一致导致发布混乱]** → 在开始实现前确认新包 scope 与命名约定，并在发布脚本中统一读取。
- **[性能回退]** → 保留“预览更新”和“结束时最终写回”的能力边界，避免抽象后每次 move 都引入额外对象分配与重复写入。
- **[文档与 Demo 不一致]** → Demo 以真实 public API 为准，README 与变更说明同步基于最终目录结构更新。

## Migration Plan

1. 建立 workspace 目录与共享构建配置，准备 `multi-drag-core` 与 `multi-drag` 的包边界。
2. 从现有实现中提取纯类型、几何计算、惯性计算与手势状态模型到 core。
3. 在 core 中补齐单元测试，确保算法与状态流转先稳定。
4. 重写/调整 Web DOM adapter，将 `PointerEvent`、`document` 监听、默认 pose 读写集中到 `multi-drag` 包。
5. 让现有 `Drag` / `Rotate` / `Scale` / `Mixin` 兼容类改为驱动 core controller，保持原包对外核心用法不变。
6. 更新 Demo，使其同时展示 core 与 multi-drag 两类示例。
7. 调整构建、测试、发布流程，支持多包独立产物与发布检查。

**Rollback strategy**

- 若兼容层行为在切换到 core 后出现明显回退，可暂时保留旧 Web 实现作为回退分支，并以 feature flag/独立入口完成短期兜底。
- 发布前若 core API 仍不稳定，可先只在仓库内完成分层和内部复用，延后对外发布 core 包。

## Open Questions

- 新包 scope 最终应为 `@system-ui-js/multi-drag-core` 还是 proposal 中写到的 `@system-js-ui/multi-drag-core`？
- 是否需要把 `multi-drag` 与 `multi-drag-core` 版本号保持严格同步，还是允许独立演进？
- 当前 `getPose` / `setPose` / `setPoseOnEnd` 的能力边界是否足够支撑兼容层，还是需要抽象为更明确的 host adapter 接口？
- 第一阶段是否保留 `Finger` 这一命名，还是在 core 中改为更平台中立的 `PointerSession` / `GesturePointer` 概念？
- Demo 目录最终放在独立 app 还是继续跟随 `multi-drag` 包管理？
